#!/usr/bin/ python3
# -*- coding: utf-8 -*-

from flask import Flask # Flaskフレームワークのインポート
from flask import render_template, request, jsonify, session # テンプレートエンジンのインポート
import os
import glob
import re
from werkzeug.exceptions import RequestEntityTooLarge, BadRequest
import urllib.parse
import json # 関数間で値を共有するためにjsonモジュールをインポート
from datetime import timedelta #時間に関するモジュール
import secrets #乱数や安全なトークンを生成するためのモジュール
from mypackage import mark_parse

# Flaskインスタンスの作成
app = Flask(__name__,static_url_path='')
#app = Flask(__name__, static_folder='/usr/local/flask/html', static_url_path='')

#拡張子の設定
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'gif', 'PNG'])
#アップロードの上限サイズを1MBにする
app.config['MAX_CONTENT_LENGTH'] = 1*1024*1024

#指定するUPLOADディレクトリ
UPLOAD_FOLDER = os.path.dirname(__file__)+'/static/img'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

#各ページのバージョンが格納されたファイルのパス
VERSION_FILEPATH = os.path.dirname(__file__)+'/version.json'

#アカウント情報が格納されたファイルのパス
ACCOUNT_FILEPATH = os.path.dirname(__file__)+'/account.json'

app.secret_key = 'BWfAew4oE43ewabz09xkaS6aPg1' #cookieのsessionを暗号化するためのkey
#app.permanent_session_lifetime = timedelta(minutes=3) #sessionを削除するタイマー ブラウザを閉じるまでで良いのでコメントアウト

#拡張子がOKか判定する関数
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[-1] in ALLOWED_EXTENSIONS

# ルーティング
@app.route('/')
def index():
    return render_template('abc/test.html')

# ホストが持つ更新情報とサーバが持つ更新情報を比較し出力
@app.route("/check/update",methods=["POST"])
def check_update():
    if request.headers['Content-Type'] != 'application/json':
        print(request.headers['Content-Type'])
        return(jsonify(res='error'), 400)
    
    path = urllib.parse.unquote(request.json["filename"]) #ホストが現在開いているページのパス(デコード)
    host_version = request.json["version"] #ホストが持つページのバージョン
    update_flag = None #ホストの操作を決定するためのフラグ
    status = "" #ホストへ送信する操作情報
    update_version = 0 #ホストへ送信するページのバージョン 初期値は0とする
    login_flag = False

    #ホストがページのバージョン情報を持っていたなら、そのバージョンを得て、ホストのバージョンと比較する
    with open(VERSION_FILEPATH, "r") as f:
        version_dic = json.load(f)
    if path in version_dic:
        update_version = version_dic[path]
        if update_version == host_version: #host_versionと現在バージョンが一致したなら(ホストが持つページのバージョンが最新)
            update_flag = False
        else: #host_versionと現在バージョンが一致しないなら(ホストが持つページのバージョンが古い)
            update_flag = True
    
    if host_version == -1: #もしホストがページのバージョン情報を持っていないのなら
        if update_flag == None:
            version_dic[path] = 0
            with open(VERSION_FILEPATH, "w") as f:
                json.dump(version_dic, f, indent=4)
        status = "set" #ホストにバージョンを設定させる
        if "id" in session:
            login_flag = True
    elif update_flag==True:
        status = "reload" #ホストにページの更新を促す
    else:
        status = "continue" #ホストに処理を継続させる
    
    return jsonify({'status': status,
    'version': update_version,
    'update_flag': update_flag, 'path':path, 
    'len(version_dic)': len(version_dic), 'login_flag':login_flag,})

# login状態の有無を出力する
@app.route("/get/login",methods=["GET"])
def get_login():
    login_flag = False
    if "id" in session:
        login_flag = True
    return jsonify({'login_flag':login_flag})

'''
# csrfトークンを発行する処理
@app.route("/csrf",methods=["POST"])
def csrf_measure():
    # Originヘッダとリクエストurlのスキーム+ホスト名が一致したとき、csrfトークンを発行する
    if request.headers.get("Origin") == request.host_url[0:len(request.host_url)-1]:
        csrf_token = secrets.token_hex(32)
        session["csrf_token"] = csrf_token
        return jsonify({'result':"ok",'csrf_token':csrf_token})
    else:
        return jsonify({'result':"no"})
'''

# パスが/api/picsだったときの処理
@app.route('/api/pics',methods=["GET","POST"])
def api_pic():
    if "id" not in session:
        return(jsonify(res='error'), 400)
    # fetchとflaskで画像のアップロードで詰まった理由
    # 1. flaskのapp.routeのパス名がfetchで指定したパス名と異なった
    # 2. fetchについて、.then(res => res.json())を.then(res => {res.json();})にしてしまった。
    # 　　正確には、.then(res => {return res.json();})が正しい書き換え
    # 3. Apacheとflask連携して実行したときのカレントディレクトリが、app.pyがあるディレクトリではなく
    #  　別のディレクトリになっているため、app.pyがあるディレクトリを想定して、ファイルのパスを
    #  　指定するとファイルが見つからない。
    # 4. /var/log/apache2/error.logでApache2のログを見る。flaskのエラーも出力されている
    # 5. 保存するディレクトリのパーミッションのその他を書き込み可になっていない。sudo chmod 777 ディレクトリパス を実行する。
    if request.method == 'GET':
        # Apacheから動かしているのでカレントディレクトリがこのプログラムがあるディレクトリではない。
        # Apacheから動かすと、カレントディレクトリは/になった。
        # よってpicturesはstatic/img/*ではなく、var/www/site/static/img/*としなくてはいけない。
        #return jsonify({'status': "false",'message': os.getcwd()})//実行時のカレントディレクトリまでのパスを取得
        #return jsonify({'status': "false",'message': os.path.dirname(__file__))#実行時のカレントディレクトリからこのプログラムがあるディレクトリまでのパスを取得
        pictures = glob.glob(os.path.dirname(__file__)+'/static/img/*.*')
        #return jsonify({'status': "false",'message': app.config['UPLOAD_FOLDER']})
        return jsonify(pictures)

    # requestのmethodがPOSTかつ、Originヘッダとリクエストurlのスキーム+ホスト名が一致したとき and以降はcsrf対策
    elif request.method == 'POST' and (request.headers.get("Origin") == request.host_url[0:len(request.host_url)-1]):
        img_file = None
        # ファイルの取得時のエラーを捕捉しメッセージを生成する、
        try:
            img_file = request.files['img_file']
        except RequestEntityTooLarge as err:
            return jsonify({'status': "false",
                            'message': "アップロード可能なファイルサイズは1MBまでです"})
        except BadRequest as e:
            return jsonify({'status': "false",
                            "message": e.description})
        except:
            return jsonify({'status': "false",
                            "message": "error"})
        
        # ファイルがあれば
        if img_file and allowed_file(img_file.filename):
            filename = img_file.filename
            #ここのifに重複しているときに入るようにする
            if os.path.dirname(__file__)+'/static/img/'+filename in glob.glob(os.path.dirname(__file__)+'/static/img/*.*'):
                count_same = 1
                for file_name in glob.glob(os.path.dirname(__file__)+'/static/img/*.*'):
                    match = re.match(os.path.dirname(__file__)+'/static/img/' + filename[:filename.index('.')] + '\(', file_name)
                    if match:
                        count_same += 1
                    else:
                        filename = '{0}({1}){2}'.format(filename[:filename.index('.')], count_same, filename[filename.index('.'):])
            #含まれる個数をカウントして，増やすようにする
            # 保存する  保存するディレクトリのパーミッションのその他を書き込み可にしておく
            img_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            pictures = glob.glob(os.path.dirname(__file__)+'/static/img/*.*')
            return jsonify(pictures)
        elif img_file:
            pictures = glob.glob(os.path.dirname(__file__)+'/static/img/*.*')
            #拡張子がダメ
            return jsonify({'status': "false",
                            'message': "アップロード可能な拡張子は[png, jpg, gif]です"})

# パスが/api/saveだったときの処理
@app.route('/api/save',methods=["POST"])
def api_save():
    if request.headers['Content-Type'] != 'application/json':
        print(request.headers['Content-Type'])
        return(jsonify(res='error'), 400)
    if "id" not in session:
        return(jsonify(res='error'), 400)

    print(request.json)
    #ページの保存にあたって、ページのバージョンを更新
    path = urllib.parse.unquote(request.json["filename"]) #ホストが現在開いているページのパス(デコード)
    with open(VERSION_FILEPATH, "r") as f:
        version_dic = json.load(f)
    if path in version_dic:
        version_dic[path]+=1
    with open(VERSION_FILEPATH, "w") as f:
        json.dump(version_dic, f, indent=4)

    #flex_textarea_dummyのmarkdownテキストをhtmlに変換したwebnote_main要素の子要素リストを取得
    webnote_main_children = mark_parse.html_parse(request.json["content"])

    #編集するファイルのパス
    pathname = urllib.parse.unquote(request.json["filename"])
    filepath = os.path.dirname(__file__)+'/static/webnote/'+pathname
    #一時的に内容を格納するためのパス
    tmppath = os.path.dirname(__file__)+'/static/webnote/tmp.html'

    #一時ファイルに変更後の内容を格納する
    with open(filepath,'r',encoding='utf-8') as fileobj:
        with open(tmppath,'w',encoding='utf-8') as outobj:
            notwrite_flag = False
            while True:
                text_line = fileobj.readline()
                if text_line:
                    #if('<div class="details_mean_box"' in text_line):
                    if('<div id="webnote_main">' in text_line):
                        outobj.write(text_line[0:len(text_line)-1])
                        #outobj.write(request.json["content"])
                        for ele in webnote_main_children:
                            outobj.write(str(ele))
                        notwrite_flag = True
                    #elif('            </div>\n' == text_line and notwrite_flag):
                    elif('        </div>\n' == text_line and notwrite_flag):
                        #outobj.write("</div>\n")
                        outobj.write(text_line)
                        notwrite_flag = False
                    elif(notwrite_flag == False):
                        outobj.write(text_line)
                else:
                    break
    
    #一時ファイルから元にファイルに変更後の内容を格納する
    with open(tmppath,'r',encoding='utf-8') as fileobj:
        with open(filepath,'w',encoding='utf-8') as outobj:
            while True:
                text_line = fileobj.readline()
                if text_line:
                    outobj.write(text_line)
                else:
                    break
    
    #一時ファイルの内容を空にしておく
    with open(tmppath,'w',encoding='utf-8') as outobj:
        outobj.write("")
    

    return jsonify(res='ok')

# パスが/add/webnote_contentだったときの処理
@app.route('/add/webnote_content',methods=["POST"])
def add_webnoteContent():
    if request.headers['Content-Type'] != 'application/json':
        print(request.headers['Content-Type'])
        return(jsonify({'status': "false",'message': "希望しているContent-Typeが異なる"}), 400)
    if "id" not in session:
        return(jsonify(res='error'), 400)
    
    category = request.json["category"]#コンテントのカテゴリ
    content = request.json["content"]#コンテント
    note_box = request.json["note_box"]#note_boxコンテンツ

    #ページの保存にあたって、ページのバージョンを更新
    path = "webnote.html" #バージョンを更新するファイルのパス
    with open(VERSION_FILEPATH, "r") as f:
        version_dic = json.load(f)
    if path in version_dic:
        version_dic[path]+=1
    with open(VERSION_FILEPATH, "w") as f:
        json.dump(version_dic, f, indent=4)

    #編集するファイルのパス
    filepath = os.path.dirname(__file__)+'/static/webnote/'+content+".html"
    #ベースとなるhtmlテキストを格納しているファイルのパス
    basepath = os.path.dirname(__file__)+'/static/webnote/base.html'
    #webnoteディレクトリのファイルを列挙
    webnotepage_list = glob.glob(os.path.dirname(__file__)+'/static/webnote/*.*')

    if filepath not in webnotepage_list:#コンテント名のファイルがwebnoteディレクトリにない場合新たに生成
        #新しいコンテントに対応するHTMLをwebnoteディレクトリに生成する
        with open(basepath,'r',encoding='utf-8') as fileobj:
            with open(filepath,'w',encoding='utf-8') as outobj:
                while True:
                    text_line = fileobj.readline()
                    if text_line:#もしテキストラインがあれば
                        if "*" in text_line:#もしテキストに*が含まれていたら
                            newtext = ""
                            for i in range(len(text_line)):#テキストの*をcontentに置き換え
                                if text_line[i] == "*": #テキストi番目に*文字であったら
                                    newtext += content #contentをnewtextに付け足す
                                else:
                                    newtext += text_line[i]
                            outobj.write(newtext)
                        else:
                            outobj.write(text_line)
                    else:
                        break
        #return(jsonify({'status': "false",'message': "コンテントが他に重複しています"}), 400)
    
    #新しいコンテントに伴い、webnote.htmlに変更を加える
    tmppath = os.path.dirname(__file__)+'/static/webnote/tmp.html'
    webnotepath = os.path.dirname(__file__)+'/static/webnote.html'
    with open(webnotepath,'r',encoding='utf-8') as fileobj:
        with open(tmppath,'w',encoding='utf-8') as outobj:
            notwrite_flag = False
            while True:
                text_line = fileobj.readline()
                if text_line:
                    if '<div id="note_box">' in text_line:
                        outobj.write('            <div id="note_box">')
                        outobj.write(note_box)
                        notwrite_flag = True
                    elif('            </div>\n' == text_line and notwrite_flag):
                        outobj.write("</div>\n")
                        notwrite_flag = False
                    elif(notwrite_flag == False):
                        outobj.write(text_line)
                else:
                    break

    #一時ファイルから元にファイルに変更後の内容を格納する
    with open(tmppath,'r',encoding='utf-8') as fileobj:
        with open(webnotepath,'w',encoding='utf-8') as outobj:
            while True:
                text_line = fileobj.readline()
                if text_line:
                    outobj.write(text_line)
                else:
                    break
    
    #一時ファイルの内容を空にしておく
    with open(tmppath,'w',encoding='utf-8') as outobj:
        outobj.write("")
    
    return(jsonify({'status': "true",'message': "OK"}), 200)

# パスが/delete/webnote_contentだったときの処理
@app.route('/delete/webnote_content',methods=["POST"])
def delete_webnoteContent():
    if request.headers['Content-Type'] != 'application/json':
        print(request.headers['Content-Type'])
        return(jsonify({'status': "false",'message': "希望しているContent-Typeが異なる"}), 400)
    if "id" not in session:
        return(jsonify(res='error'), 400)
    
    category = request.json["category"]#コンテントのカテゴリ
    note_box = request.json["note_box"]#note_boxコンテンツ

    #ページの保存にあたって、ページのバージョンを更新
    path = "webnote.html" #バージョンを更新するファイルのパス
    with open(VERSION_FILEPATH, "r") as f:
        version_dic = json.load(f)
    if path in version_dic:
        version_dic[path]+=1
    with open(VERSION_FILEPATH, "w") as f:
        json.dump(version_dic, f, indent=4)

    #削除するコンテントに伴い、webnote.htmlに変更を加える
    tmppath = os.path.dirname(__file__)+'/static/webnote/tmp.html'
    webnotepath = os.path.dirname(__file__)+'/static/webnote.html'
    with open(webnotepath,'r',encoding='utf-8') as fileobj:
        with open(tmppath,'w',encoding='utf-8') as outobj:
            notwrite_flag = False
            while True:
                text_line = fileobj.readline()
                if text_line:
                    if '<div id="note_box">' in text_line:
                        outobj.write('            <div id="note_box">')
                        outobj.write(note_box)
                        notwrite_flag = True
                    elif('            </div>\n' == text_line and notwrite_flag):
                        outobj.write("</div>\n")
                        notwrite_flag = False
                    elif(notwrite_flag == False):
                        outobj.write(text_line)
                else:
                    break

    #一時ファイルから元にファイルに変更後の内容を格納する
    with open(tmppath,'r',encoding='utf-8') as fileobj:
        with open(webnotepath,'w',encoding='utf-8') as outobj:
            while True:
                text_line = fileobj.readline()
                if text_line:
                    outobj.write(text_line)
                else:
                    break
    
    #一時ファイルの内容を空にしておく
    with open(tmppath,'w',encoding='utf-8') as outobj:
        outobj.write("")
    
    return(jsonify({'status': "true",'message': "OK"}), 200)

# パスが/add/webnote_categoryだったときの処理
@app.route('/add/webnote_category',methods=["POST"])
def add_webnoteCategory():
    if request.headers['Content-Type'] != 'application/json':
        print(request.headers['Content-Type'])
        return(jsonify({'status': "false",'message': "希望しているContent-Typeが異なる"}), 400)
    if "id" not in session:
        return(jsonify(res='error'), 400)

    new_category = request.json["new_category"]#コンテントのカテゴリ
    note_box = request.json["note_box"]#note_boxコンテンツ

    #ページの保存にあたって、ページのバージョンを更新
    path = "webnote.html" #バージョンを更新するファイルのパス
    with open(VERSION_FILEPATH, "r") as f:
        version_dic = json.load(f)
    if path in version_dic:
        version_dic[path]+=1
    with open(VERSION_FILEPATH, "w") as f:
        json.dump(version_dic, f, indent=4)

    #追加するカテゴリに伴い、webnote.htmlに変更を加える
    tmppath = os.path.dirname(__file__)+'/static/webnote/tmp.html'
    webnotepath = os.path.dirname(__file__)+'/static/webnote.html'
    with open(webnotepath,'r',encoding='utf-8') as fileobj:
        with open(tmppath,'w',encoding='utf-8') as outobj:
            notwrite_flag = False
            while True:
                text_line = fileobj.readline()
                if text_line:
                    if '<div id="note_box">' in text_line:
                        outobj.write('            <div id="note_box">')
                        outobj.write(note_box)
                        notwrite_flag = True
                    elif('            </div>\n' == text_line and notwrite_flag):
                        outobj.write("</div>\n")
                        notwrite_flag = False
                    elif(notwrite_flag == False):
                        outobj.write(text_line)
                else:
                    break

    #一時ファイルから元にファイルに変更後の内容を格納する
    with open(tmppath,'r',encoding='utf-8') as fileobj:
        with open(webnotepath,'w',encoding='utf-8') as outobj:
            while True:
                text_line = fileobj.readline()
                if text_line:
                    outobj.write(text_line)
                else:
                    break
    
    #一時ファイルの内容を空にしておく
    with open(tmppath,'w',encoding='utf-8') as outobj:
        outobj.write("")
    
    return(jsonify({'status': "true",'message': "OK"}), 200)

# パスが/add/memory_articleだったときの処理
@app.route('/add/memory_article',methods=["POST"])
def add_memory_article():
    if request.headers['Content-Type'] != 'application/json':
        print(request.headers['Content-Type'])
        return(jsonify({'status': "false",'message': "希望しているContent-Typeが異なる"}), 400)
    if "id" not in session:
        return(jsonify(res='error'), 400)

    article_name = request.json["article_name"]#記録帳の名前
    memory_box = request.json["memory_box"]#memory_boxコンテンツ

    #ページの保存にあたって、ページのバージョンを更新
    path = "memory.html" #バージョンを更新するファイルのパス
    with open(VERSION_FILEPATH, "r") as f:
        version_dic = json.load(f)
    if path in version_dic:
        version_dic[path]+=1
    with open(VERSION_FILEPATH, "w") as f:
        json.dump(version_dic, f, indent=4)
    
    #編集するファイルのパス
    filepath = os.path.dirname(__file__)+'/static/memory/'+article_name+".html"
    #ベースとなるhtmlテキストを格納しているファイルのパス
    basepath = os.path.dirname(__file__)+'/static/memory/base.html'
    #memoryディレクトリのファイルを列挙
    memorypage_list = glob.glob(os.path.dirname(__file__)+'/static/memory/*.*')

    #記録帳名のファイルがmemoryディレクトリにない場合新たに生成
    if filepath not in memorypage_list:
        #新しい記録帳に対応するHTMLをmemoryディレクトリに生成する
        with open(basepath,'r',encoding='utf-8') as fileobj:
            with open(filepath,'w',encoding='utf-8') as outobj:
                while True:
                    text_line = fileobj.readline()
                    if text_line:#もしテキストラインがあれば
                        if "*" in text_line:#もしテキストに*が含まれていたら
                            newtext = ""
                            for i in range(len(text_line)):#テキストの*をarticle_nameに置き換え
                                if text_line[i] == "*": #テキストi番目に*文字であったら
                                    newtext += article_name #article_nameをnewtextに付け足す
                                else:
                                    newtext += text_line[i]
                            outobj.write(newtext)
                        else:
                            outobj.write(text_line)
                    else:
                        break
    
    #追加する記録帳に伴い、memory.htmlに変更を加える
    tmppath = os.path.dirname(__file__)+'/static/webnote/tmp.html'
    memorypath = os.path.dirname(__file__)+'/static/memory.html'
    with open(memorypath,'r',encoding='utf-8') as fileobj:
        with open(tmppath,'w',encoding='utf-8') as outobj:
            notwrite_flag = False
            while True:
                text_line = fileobj.readline()
                if text_line:
                    if '<div id="memory_box">' in text_line:
                        outobj.write('            <div id="memory_box">')
                        outobj.write(memory_box)
                        notwrite_flag = True
                    elif('            </div>\n' == text_line and notwrite_flag):
                        outobj.write("</div>\n")
                        notwrite_flag = False
                    elif(notwrite_flag == False):
                        outobj.write(text_line)
                else:
                    break
    
    #一時ファイルから元のファイルに変更後の内容を格納する
    with open(tmppath,'r',encoding='utf-8') as fileobj:
        with open(memorypath,'w',encoding='utf-8') as outobj:
            while True:
                text_line = fileobj.readline()
                if text_line:
                    outobj.write(text_line)
                else:
                    break
    
    #一時ファイルの内容を空にしておく
    with open(tmppath,'w',encoding='utf-8') as outobj:
        outobj.write("")
    
    return(jsonify({'status': "true",'message': "OK"}), 200)

# パスが/save/memory_articleだったときの処理
@app.route("/save/memory_article",methods=["POST"])
def save_memory_article():
    if request.headers['Content-Type'] != 'application/json':
        print(request.headers['Content-Type'])
        return(jsonify(res='error'), 400)
    if "id" not in session:
        return(jsonify(res='error'), 400)

    print(request.json)
    #ページの保存にあたって、ページのバージョンを更新
    path = urllib.parse.unquote(request.json["filename"]) #ホストが現在開いているページのパス(デコード)
    with open(VERSION_FILEPATH, "r") as f:
        version_dic = json.load(f)
    if path in version_dic:
        version_dic[path]+=1
    with open(VERSION_FILEPATH, "w") as f:
        json.dump(version_dic, f, indent=4)

    #flex_textarea_dummyのmarkdownテキストをhtmlに変換したwebnote_main要素の子要素リストを取得
    webnote_main_children = mark_parse.html_parse(request.json["content"])

    #編集するファイルのパス
    pathname = urllib.parse.unquote(request.json["filename"])
    filepath = os.path.dirname(__file__)+'/static/memory/'+pathname
    #一時的に内容を格納するためのパス
    tmppath = os.path.dirname(__file__)+'/static/webnote/tmp.html'

    #一時ファイルに変更後の内容を格納する
    with open(filepath,'r',encoding='utf-8') as fileobj:
        with open(tmppath,'w',encoding='utf-8') as outobj:
            notwrite_flag = False
            while True:
                text_line = fileobj.readline()
                if text_line:
                    if('<div id="webnote_main">' in text_line):
                        outobj.write(text_line[0:len(text_line)-1])
                        for ele in webnote_main_children:
                            outobj.write(str(ele))
                        notwrite_flag = True
                    elif('        </div>\n' == text_line and notwrite_flag):
                        outobj.write(text_line)
                        notwrite_flag = False
                    elif(notwrite_flag == False):
                        outobj.write(text_line)
                else:
                    break
    
    #一時ファイルから元にファイルに変更後の内容を格納する
    with open(tmppath,'r',encoding='utf-8') as fileobj:
        with open(filepath,'w',encoding='utf-8') as outobj:
            while True:
                text_line = fileobj.readline()
                if text_line:
                    outobj.write(text_line)
                else:
                    break
    
    #一時ファイルの内容を空にしておく
    with open(tmppath,'w',encoding='utf-8') as outobj:
        outobj.write("")
    

    return jsonify(res='ok')

# パスが/loginだったときの処理
@app.route("/login",methods=["GET","POST"])
def login():
    if request.method == "GET":
        return render_template('login.html',message='IDとPasswordを入力してください:')
    elif request.method == "POST":
        #クライアントから送られたidとpasswordがアカウントファイルと一致するかを確認する
        with open(ACCOUNT_FILEPATH, "r") as f:
            account = json.load(f)
        
        if (request.json["id"]==account["id"] and request.json["password"]==account["password"]):
            session["id"] = request.json["id"]
            return(jsonify({"result":True,"url":"/index.html"}))
            
        else:#idとパスワードが一致しなかった場合
            return(jsonify({"result":False}))

# パスが/logoutだったときの処理
@app.route("/logout",methods=["POST"])
def logout():
    session.pop("id",None) #cookieのsessionのidを削除
    return(jsonify({"message": "ok"}))


# パスが/test/testingだったときの処理
@app.route('/test/testing',methods=["POST"])
def test():
    if "id" not in session:
        return(jsonify(res='error'), 400)
    session["id"] = request.json["token"]
    return(jsonify({"message":"ok"}))

# パスが/test/checkだったときの処理
@app.route('/test/check',methods=["POST"])
def check():
    s = request.cookies.get('session', None)
    with open(ACCOUNT_FILEPATH, "r") as f:
        account = json.load(f)
    return(jsonify({'id':session["id"],'session':s,'account_id':account["id"], 'account_pass':account["password"]}))


# アプリ起動時の実行内容
if __name__ == '__main__':
    app.run()