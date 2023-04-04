let host_version = -1;//バージョン情報がないことを表す-1
// バージョンを取得する関数
function getVersion(){
    //ファイル名とdetailes_mean_boxのinnerHTMLを含むjsonを作成
    //const data = {filename:window.location.href.split('/').pop(),version:host_version};
    const data = {filename:window.location.pathname,version:host_version};
    return (fetch("/check/update",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json()));
}
// 送信する際のフォーマット
function send_format(jsondata,sending){
    if(jsondata["status"]=="reload"){
        if( confirm("このページは更新されています。保存を実行してしまうと現在の変更で上書きしてしまいます。再読み込みしますか？") ) {
            location.reload;//リロードする
        }
        else {
            if(confirm("現在の変更で上書き保存しますか？")){
                sending();//送信処理
                alert("保存しました");
                //host_version = jsondata["version"]+1;
            }else{
                //flag = false;
            }
        }
    }else if(jsondata["status"]=="continue"){
        sending();
        alert("保存しました");
    }
}
//ロード時にログインしていた場合に行う関数
function initSet(jsondata){
    console.log('Success:', jsondata);
    host_version = jsondata["version"];
    console.log(jsondata["version"]);
    if(jsondata["login_flag"]){
        console.log(jsondata["login_flag"]);
        change_logout();//ヘッダーのログインボタンをログアウトボタンに変更
        document.getElementById("plusicon_block").classList.remove("none");//プラスアイコンブロックを表示
        addDraghandler();//全てのクラスcontent要素のdiv要素にドラッグイベント関数を登録する
    }else{
        Array.prototype.forEach.call(contentedit_icon, function(element){//htmlcollectionでforeachを実現する
            element.classList.add("none");//contentedit_iconクラスを持つ要素を表示
        });
        Array.prototype.forEach.call(icon_select, function(element){//htmlcollectionでforeachを実現する
            element.classList.add("none");//icon_selectクラスを持つ要素を表示
        });
    }
    document.body.classList.remove("none");//body要素を表示させる
}

const addcontent_popup = document.getElementById("addcontent_popup");//コンテンツ追加ポップアップ
const addcontent_category = addcontent_popup.getElementsByClassName("contents_category")[0];//コンテンツのカテゴリのテキストを入れる要素
const addcontent_del_btn = addcontent_popup.getElementsByClassName("popup_del_btn")[0];//コンテンツ追加ポップアップを消すデリートボタン
const content_fileter = document.getElementById("content_fileter");

const deletecontent_popup = document.getElementById("deletecontent_popup");//コンテンツ削除のポップアップ
const deletecontent_category = deletecontent_popup.getElementsByClassName("contents_category")[0];//コンテンツのカテゴリのテキストを入れる要素
const deletecontent_del_btn = deletecontent_popup.getElementsByClassName("popup_del_btn")[0];//コンテンツ削除ポップアップを消すデリートボタン
const black_curtain = document.getElementById("black_curtain");//暗転用のマスク

let edit_ele = ""
//addcontent_popupに由来するコンテンツカテゴリのtextContentを変え、ブラックマスクを表示し、コンテンツ追加ポップアップを表示する(イベント関数)
function appear_addContentPopup(e){
    //コンテンツカテゴリのtextContentを、クリックした要素に対応して変える
    addcontent_category.textContent = e.currentTarget.parentNode.getElementsByClassName("tag")[0].textContent;

    black_curtain.classList.remove("none");//マスクを表示する
    addcontent_popup.classList.remove("none");//コンテンツ追加ポップアップを表示する

    edit_ele = e.currentTarget.parentNode.parentNode;
    console.dir(e.currentTarget.parentNode.parentNode);

    content_fileter.focus();//すぐにテキスト入力できるようにしておく
}
//コンテンツ追加ポップアップのバツボタンをクリックした時のイベントリスナーを登録
addcontent_del_btn.addEventListener("click",function(e){
    black_curtain.classList.add("none");//マスクを消す
    addcontent_popup.classList.add("none");//コンテンツ追加ポップアップを消す
});

//removecontent_popupに由来するコンテンツカテゴリのtextContentを変え、ブラックマスクを表示し、コンテンツ追加ポップアップを表示する(イベント関数)
function appear_deleteContentPopup(e){
    const delete_select = document.getElementById("delete_select");//選択できる削除候補リスト要素
    //deleteボタンを押した要素の親の親が持つコンテント要素内のaタグ要素群を取得
    const content_a = e.currentTarget.parentNode.parentNode.getElementsByClassName("content")[0].getElementsByTagName("A");
    for(i=0;i<content_a.length;i++){//aタグのテキストコンテントに対応したdelete候補要素を生成する
        let opt = document.createElement("option");//option要素を生成
        opt.value = content_a[i].textContent;//valueにa要素のテキストコンテントを持たせる
        opt.textContent = content_a[i].textContent;//option要素のテキストコンテントにa要素のテキストコンテントを持たせる
        delete_select.appendChild(opt);//delete_selectの子要素として追加
    }
    console.dir(e.currentTarget.parentNode);
    //コンテンツカテゴリのtextContentを、クリックした要素に対応して変える
    deletecontent_category.textContent = e.currentTarget.parentNode.getElementsByClassName("tag")[0].textContent;

    black_curtain.classList.remove("none");//マスクを表示する
    deletecontent_popup.classList.remove("none");//コンテンツ追加ポップアップを表示する

    edit_ele = e.currentTarget.parentNode.parentNode;
    console.dir(e.currentTarget.parentNode.parentNode);
}
//コンテンツ削除ポップアップのバツボタンをクリックした時のイベントリスナーを登録
deletecontent_del_btn.addEventListener("click",function(e){
    black_curtain.classList.add("none");//マスクを消す
    deletecontent_popup.classList.add("none");//コンテンツ削除ポップアップを消す

    delete_select.textContent = "";//リセット
});

/*---------------------------------*/

//note_blockのアイコンをaddに変える処理群
function set_addIcon(ele){
    const contentedit_icon = ele;
    contentedit_icon.innerHTML = "+";
    contentedit_icon.classList.remove("contentdelete_icon");//デリートアイコンクラスを消す
    contentedit_icon.classList.add("contentadd_icon");//プラスアイコンクラスを追加
    contentedit_icon.removeEventListener("click",appear_deleteContentPopup);//+ボタンをクリックしたときのイベント関数を追加
    contentedit_icon.addEventListener("click",appear_addContentPopup);//+ボタンをクリックしたときのイベント関数を追加
}
//note_blockのアイコンをdeleteに変える処理群
function set_deleteIcon(ele){
    const contentedit_icon = ele;
    contentedit_icon.innerHTML = '<img src="/img/delete.png" alt="no img">';
    contentedit_icon.classList.remove("contentadd_icon");//デリートアイコンクラスを消す
    contentedit_icon.classList.add("contentdelete_icon");//プラスアイコンクラスを追加
    contentedit_icon.removeEventListener("click",appear_addContentPopup);//+ボタンをクリックしたときのイベント関数を追加
    contentedit_icon.addEventListener("click",appear_deleteContentPopup);//deleteボタンをクリックしたときのイベント関数を追加
}
//note_blockのアイコンを変える関数
function set_iconSelect(e){
    console.log(e.target.value);
    if(e.target.value == "add"){//もしクリックしたターゲット要素のvalueがaddなら
        set_addIcon(e.currentTarget.parentNode.getElementsByClassName("contentedit_icon")[0]);//クリックしたセレクトの親note_blockのアイコンをaddアイコンに設定する
    }else if(e.target.value == "delete"){//もしクリックしたターゲット要素のvalueがdeleteなら
        set_deleteIcon(e.currentTarget.parentNode.getElementsByClassName("contentedit_icon")[0]);//クリックしたセレクトの親note_blockのアイコンをdeleteアイコンに設定する
    }
}
//note_blockのアイコンを変えるセレクト要素
const icon_select = document.getElementsByClassName("icon_select");
//ロード時は必ず全てのselectアイコンに、クリック時に動作させるicon_select関数を登録
for(i=0;i<icon_select.length;i++){
    icon_select[i].addEventListener("change",set_iconSelect);
}
const contentedit_icon = document.getElementsByClassName("contentedit_icon")//コンテンツを追加や削除を行えるアイコン要素群
//ロード時は必ず全てのnote_blockのアイコンをaddボタンにしたいので、設定しておく
Array.prototype.forEach.call(contentedit_icon, function(element){//htmlcollectionでforeachを実現する
    set_addIcon(element);//contentedit_iconをaddに設定する。
});

//送った後に実行する
function afterPost(input,btn,popup,btn_value) {
    black_curtain.classList.add("none");//マスクを消す
    popup.classList.add("none");//コンテンツ追加ポップアップを消す
    btn.disabled = false;//ポップアップの送信ボタンをクリックできるようにする
    btn.value=btn_value;//ボタンのテキストを"送信"に変えておく
    input.value = "";//入力されたデータがinputのvalueに入っているので空にしておく
}

const addcontent_submit_btn = addcontent_popup.getElementsByClassName("submit_btn")[0];
//ノーツ追加のための送信処理（サーバ側で現在の変更を保存する）
function noteadd_save(){
    //カテゴリとコンテントの辞書オブジェクトを作る
    const data = {category:addcontent_category.textContent,content:content_fileter.value,note_box:note_box.innerHTML};
        
    //パス名を/add/webnote_contentにして送信
    fetch("/add/webnote_content",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())//responseのjsonデータを取得して返す
    .then(jsondata => {//jsondataを処理する
        console.log('Success:', jsondata);
        /*
        if(jsondata["status"] == "false"){//もし重複していたら
            note_box.innerHTML = tmp;//note_box.innerHTMLを元に戻す
        }*/
        host_version++;//バージョン情報を１加算
        console.log(jsondata["message"]);
        afterPost(content_fileter,addcontent_submit_btn,addcontent_popup,"送信");//送信完了後の処理
    })
    .catch((error) => {//flask側で処理エラーが起きたら
        console.error('Error:', error);
        note_box.innerHTML = tmp;
        afterPost(content_fileter,addcontent_submit_btn,addcontent_popup,"送信");//送信完了後の処理
    });
}
//ノート追加ポップアップの送信ボタンを押したときに動作させる関数を登録
addcontent_submit_btn.addEventListener("click",function(){

    if(content_fileter.value!=""){
        const target_content = edit_ele.getElementsByClassName("content")[0];
        //まず編集ブロックのノートに対して同じものを追加しようとしていないかを判定
        ident_flag = false;
        Array.prototype.forEach.call(target_content.children,function(element){
            if(element.children[0].textContent == content_fileter.value){
                ident_flag = true;
            }
        });
        if(!ident_flag){//もし同じ名称のノートが存在していなかった場合
            addcontent_submit_btn.disabled = true; //連打防止
            addcontent_submit_btn.value="送信中";
            const note_box = document.getElementById("note_box");
            let tmp = note_box.innerHTML;//エラー時に元に戻せるようにnote_box.innerHTMLを保管しておく
            
            const categoryname = edit_ele.querySelector(".tag").textContent;
            //target_content.innerHTML += '    <div draggable="true" >・ <a href="./webnote/'+content_fileter.value+'.html">'+content_fileter.value+'</a></div>\n                    ';
            target_content.innerHTML += '<div draggable="true" >・ <a href="/webnote/'+categoryname+'/'+content_fileter.value+'.html">'+content_fileter.value+'</a></div>';
            
            //webnote.htmlのバージョンを確認して、ノート追加における送信処理
            getVersion().then(jsondata => {
                send_format(jsondata,noteadd_save);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }else{//同じ名称のノートが存在していた場合
            alert("すでに同じ名前のノートが追加されています");
        }
    }
});



const delete_select = document.getElementById("delete_select");
const deletecontent_submit_btn = deletecontent_popup.getElementsByClassName("submit_btn")[0];
//ノート削除のための送信処理（サーバ側で現在の変更を保存する）
function notedelete_save(){
    //カテゴリとコンテントの辞書オブジェクトを作る
    const data = {category:deletecontent_category,note_box:note_box.innerHTML};
        
    //パス名を/delete/webnote_contentにして送信
    fetch("/delete/webnote_content",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())//responseのjsonデータを取得して返す
    .then(jsondata => {//jsondataを処理する
        console.log('Success:', jsondata);
        /*
        if(jsondata["status"] == "false"){//もし重複していたら
            note_box.innerHTML = tmp;//note_box.innerHTMLを元に戻す
        }*/
        host_version++;//バージョン情報を１加算
        console.log(jsondata["message"]);
        black_curtain.classList.add("none");//マスクを消す
        deletecontent_popup.classList.add("none");//コンテンツ追加ポップアップを消す
        deletecontent_submit_btn.disabled = false;//ポップアップの送信ボタンをクリックできるようにする
        deletecontent_submit_btn.value="送信";//ボタンのテキストを"送信"に変えておく
        delete_select.textContent = "";//リセット
    })
    .catch((error) => {//flask側で処理エラーが起きたら
        console.error('Error:', error);
        note_box.innerHTML = tmp;
        black_curtain.classList.add("none");//マスクを消す
        deletecontent_popup.classList.add("none");//コンテンツ追加ポップアップを消す
        deletecontent_submit_btn.disabled = false;//ポップアップの送信ボタンをクリックできるようにする
        deletecontent_submit_btn.value="送信";//ボタンのテキストを"送信"に変えておく
        delete_select.textContent = "";//リセット
    });
}
//ノート削除ポップアップの送信ボタンを押したときに動作させる関数を登録
deletecontent_submit_btn.addEventListener("click",function(){
    let opts = delete_select.options;
    let select_num = 0;
    for(i=0;i<opts.length;i++){
        if (opts[i].selected) {
            select_num+=1;
        }
    }
    if(select_num!=0){
        deletecontent_submit_btn.disabled = true; //連打防止
        deletecontent_submit_btn.value="送信中";
        const note_box = document.getElementById("note_box");
        let tmp = note_box.innerHTML;//エラー時に元に戻せるようにnote_box.innerHTMLを保管しておく
        
        const target_content = edit_ele.getElementsByClassName("content")[0];
        const target_content_a = target_content.getElementsByTagName("A");
        for(i=0;i<opts.length;i++){
            if (opts[i].selected) {
                for(j=0;j<target_content_a.length;j++){
                    if(opts[i].value == target_content_a[j].textContent){
                        target_content_a[j].parentNode.remove();//divを消す
                        break;
                    }
                }
            }
        }
        
        //webnote.htmlのバージョンを確認して、ノート削除における送信処理を行う
        getVersion().then(jsondata => {
            send_format(jsondata,notedelete_save);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

const plusicon = document.getElementById("plusicon");
const addnoteblock_popup = document.getElementById("addnoteblock_popup");
const addnoteblock_category = addnoteblock_popup.getElementsByClassName("contents_category")[0];
const addnoteblock_del_btn = addnoteblock_popup.getElementsByClassName("popup_del_btn")[0];
const noteblock_fileter = document.getElementById("noteblock_fileter");
//addnoteblock_popupに由来するコンテンツカテゴリのtextContentを変え、ブラックマスクを表示し、コンテンツ追加ポップアップを表示する(イベント関数)
function appear_addNoteblockPopup(e){
    black_curtain.classList.remove("none");//マスクを表示する
    addnoteblock_popup.classList.remove("none");//コンテンツ追加ポップアップを表示する

    edit_ele = e.currentTarget.parentNode.parentNode;//edit対象の要素をedit_eleに格納
    console.dir(e.currentTarget.parentNode.parentNode);

    noteblock_fileter.focus();//すぐにテキスト入力できるようにしておく
}
//ノートブロック追加ポップアップのバツボタンをクリックした時のイベントリスナーを登録
addnoteblock_del_btn.addEventListener("click",function(e){
    black_curtain.classList.add("none");//マスクを消す
    addnoteblock_popup.classList.add("none");//コンテンツ追加ポップアップを消す
});
plusicon.addEventListener("click",appear_addNoteblockPopup);

const addnoteblock_submit_btn = addnoteblock_popup.getElementsByClassName("submit_btn")[0];
//ノートブロック追加のための送信処理
function blockadd_save(){
    //カテゴリとコンテントの辞書オブジェクトを作る
    const data = {new_category:noteblock_fileter.value,note_box:note_box.innerHTML};
        
    //パス名を/add/webnote_categoryにして送信
    fetch("/add/webnote_category",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())//responseのjsonデータを取得して返す
    .then(jsondata => {//jsondataを処理する
        console.log('Success:', jsondata);
        /*
        if(jsondata["status"] == "false"){//もし重複していたら
            note_box.innerHTML = tmp;//note_box.innerHTMLを元に戻す
        }*/
        host_version++;//バージョン情報を１加算
        console.log(jsondata["message"]);
        afterPost(noteblock_fileter,addnoteblock_submit_btn,addnoteblock_popup,"追加");//送信完了後の処理
    })
    .catch((error) => {//flask側で処理エラーが起きたら
        console.error('Error:', error);
        note_box.innerHTML = tmp;
        afterPost(noteblock_fileter,addnoteblock_submit_btn,addnoteblock_popup,"追加");//送信完了後の処理
    });
}

let tmp;
//ノートブロック追加ポップアップのsubmitボタンをクリックした時のイベントリスナーを登録
addnoteblock_submit_btn.addEventListener("click",function(e){
    if(noteblock_fileter.value=="")return;//何も入力がないなら

    if(noteblock_fileter.value.indexOf("/")!=-1)return;//入力値にパス区切り文字'/'が入っているなら

    const tags = document.getElementsByClassName("tag");
    // 既に同じ名前をカテゴリがあった場合キャンセルする
    f = false;
    Array.prototype.forEach.call(tags,function(tag){
        categoryname = tag.textContent;
        if(categoryname == noteblock_fileter.value)f = true;
    });
    if(f)return;

    addnoteblock_submit_btn.disabled = true; //連打防止
    addnoteblock_submit_btn.value="追加中";
    const note_box = document.getElementById("note_box");
    tmp = note_box.innerHTML;//エラー時に元に戻せるようにnote_box.innerHTMLを保管しておく
    
    const new_note_block = document.createElement("div");//新たにdiv要素を生成
    new_note_block.classList.add("note_block");//生成したnote_blockのclassにnote_blockを追加
    new_note_block.innerHTML += '\n\
                    <div class="top_tag">\n\
                        <div class="tag">' + noteblock_fileter.value + '</div>\n\
                        <div class="contentedit_icon contentadd_icon">+</div>\n\
                        <select name="icon_change" size="1" class="icon_select">\n\
                            <option value="add">add</option>\n\
                            <option value="delete">delete</option>\n\
                            <option value="rewriting">rewriting</option>\n\
                        </select>\n\
                    </div>\n\
                    <div class="content"></div>\n\
                ';
    note_box.innerHTML+="\    ";
    note_box.appendChild(new_note_block);//新たなnote_blockをnote_boxの末尾の子として追加
    note_box.innerHTML+="\n            ";
    set_addIcon(new_note_block.getElementsByClassName("contentedit_icon")[0]);//editアイコンをaddにしておく
    new_note_block.getElementsByClassName("icon_select")[0].addEventListener("change",set_iconSelect);//selectアイコンにクリックイベント関数を登録する
    
    //webnote.htmlのバージョンを確認してバージョンの違いがなければwebnote.htmlを更新
    getVersion().then(jsondata => {
        send_format(jsondata,blockadd_save);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

const minusicon = document.getElementById("minusicon");
const deletenoteblock_popup = document.getElementById("deletenoteblock_popup");
const deletenoteblock_del_btn = deletenoteblock_popup.getElementsByClassName("popup_del_btn")[0];
const deletenoteblock_content = deletenoteblock_popup.getElementsByClassName("popup_content")[0];
const deletenoteblock_appear_list = document.getElementById("appear_list");
//tagクラスのtextContentを取得し、deletenoteblock_popupのチェックボックスを生成する。
function checkbox_addtag(){
    const category_tags = document.getElementsByClassName("tag");
    console.dir(category_tags);

    //コンテンツごとにチェックボックスを生成
    Array.prototype.forEach.call(category_tags, function(element){//htmlcollectionでforeachを実現する
        let new_check = document.createElement("div");//新しいdiv要素を作る
        new_check.classList.add("appear_select");//div要素にクラスappear_selectを追加する
        //そのカテゴリブロックが現在隠れているかを判断する
        if(element.parentNode.parentNode.classList.contains("none")){//隠れている場合
            //input要素とテキストをdiv要素のinnerHTML(コンテンツ)として代入。チェックなし
            new_check.innerHTML = '<input type="checkbox" name="'+element.textContent+'" value="'+element.textContent+'">'+element.textContent;
        }else{//隠れていない場合
            //input要素とテキストをdiv要素のinnerHTML(コンテンツ)として代入。チェックあり
            new_check.innerHTML = '<input type="checkbox" name="'+element.textContent+'" value="'+element.textContent+'" checked>'+element.textContent;
        }
        deletenoteblock_appear_list.appendChild(new_check);//appear_listにdiv要素を追加
    });
}
//ブラックマスクを表示し、コンテンツ表示ポップアップを表示する(イベント関数)
function appear_deleteNoteblockPopup(e){
    deletenoteblock_appear_list.innerHTML = "";//チェックリストを初期化しておく
    black_curtain.classList.remove("none");//マスクを表示する
    deletenoteblock_popup.classList.remove("none");//コンテンツ追加ポップアップを表示する

    edit_ele = e.currentTarget.parentNode.parentNode;//edit対象の要素をedit_eleに格納
    console.dir(e.currentTarget.parentNode.parentNode);

    //カテゴリを表示しておく。
    checkbox_addtag();
}
//ノートブロック表示ポップアップのバツボタンをクリックした時のイベントリスナーを登録
deletenoteblock_del_btn.addEventListener("click",function(e){
    black_curtain.classList.add("none");//マスクを消す
    deletenoteblock_popup.classList.add("none");//コンテンツ追加ポップアップを消す

    deletenoteblock_appear_list.innerHTML = "";//次に表示させたときにappear_listのチェックボックスが重複しないようにチェックボックスを消す
});
minusicon.addEventListener("click",appear_deleteNoteblockPopup);

const deletenoteblock_submit_btn = deletenoteblock_popup.getElementsByClassName("submit_btn")[0];
//ノートブロック削除のための送信処理
function blockdelete_save(){
    //カテゴリとコンテントの辞書オブジェクトを作る
    const data = {new_category:"null",note_box:note_box.innerHTML};

    //パス名を/modify/webnote_contentにして送信
    fetch("/modify/webnote_category",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())//responseのjsonデータを取得して返す
    .then(jsondata => {//jsondataを処理する
        console.log('Success:', jsondata);
        /*
        if(jsondata["status"] == "false"){//もし重複していたら
            note_box.innerHTML = tmp;//note_box.innerHTMLを元に戻す
        }*/
        host_version++;//バージョン情報を１加算
        console.log(jsondata["message"]);
    })
    .catch((error) => {//flask側で処理エラーが起きたら
        console.error('Error:', error);
        note_box.innerHTML = tmp;
    });
}

//ノートブロック削除ポップアップのsubmitボタンをクリックした時のイベントリスナーを登録
deletenoteblock_submit_btn.addEventListener("click",function(e){
    deletenoteblock_submit_btn.disabled = true; //連打防止
    const note_block = document.getElementsByClassName("note_block");
    const note_box = document.getElementById("note_box");
    const tmp = note_box.innerHTML;//バックアップ用
    let i = 0;
    //チェックリストをもとにカテゴリの表示非表示を設定する。
    Array.prototype.forEach.call(deletenoteblock_appear_list.children, function(element){//htmlcollectionでforeachを実現する
        if(element.getElementsByTagName("input")[0].checked == true){//もしチェックがあったなら
            note_block[i].classList.remove("none");//カテゴリを表示する
        }else{
            note_block[i].classList.add("none");//カテゴリを非表示にする
        }
        i++;
    });

    //webnote.htmlのバージョンを確認してバージョンの違いがなければwebnote.htmlを更新
    getVersion().then(jsondata => {
        send_format(jsondata,blockdelete_save);
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    black_curtain.classList.add("none");//マスクを消す
    deletenoteblock_popup.classList.add("none");//コンテンツ追加ポップアップを消す
    deletenoteblock_submit_btn.disabled = false;//ポップアップの送信ボタンをクリックできるようにする
    deletenoteblock_appear_list.innerHTML = "";//次に表示させたときにappear_listのチェックボックスが重複しないようにチェックボックスを消す
});

/*----------------------------------*/

//クラスcontent要素のdiv要素の入れ替え処理
content = document.getElementsByClassName("content");
let dragged;//ドラッグした要素を格納する変数
let save_flag = false;

function dragend_savefunc(){
    //カテゴリとコンテントの辞書オブジェクトを作る
    const data = {new_category:"none",note_box:note_box.innerHTML};
                
    //パス名を/modify/webnote_contentにして送信
    fetch("/modify/webnote_category",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())//responseのjsonデータを取得して返す
    .then(jsondata => {//jsondataを処理する
        console.log('Success:', jsondata);
        if(jsondata["status"] == "false"){//もし重複していたら
            note_box.innerHTML = tmp;//note_box.innerHTMLを元に戻す
        }
        host_version++;//バージョン情報を１加算
        console.log(jsondata["message"]);
    })
    .catch((error) => {//flask側で処理エラーが起きたら
        console.error('Error:', error);
    });
}

//全てのクラスcontent要素のdiv要素にドラッグイベント関数を登録する関数
function addDraghandler(){
    //全てのクラスcontent要素のdiv要素にドラッグイベント関数を登録する
    Array.prototype.forEach.call(content,function(element){
        Array.prototype.forEach.call(element.children,function(content_div){
            //ドラッグが始まったときに動作する
            content_div.addEventListener("dragstart", e => {
                console.dir(e.currentTarget);
                dragged = e.currentTarget;
                e.currentTarget.parentNode.classList.add("dropzone");
                //この要素より前の要素に対してクラス属性値droppreviousを追加
                let ele = e.currentTarget;
                while(ele.previousElementSibling!=null){
                    ele.previousElementSibling.classList.add("dropprevious");
                    ele = ele.previousElementSibling;
                }
                //この要素より後の要素に対してクラス属性値droppreviousを追加
                ele = e.currentTarget;
                while(ele.nextElementSibling!=null){
                    ele.nextElementSibling.classList.add("dropnext");
                    ele = ele.nextElementSibling;
                }
                e.currentTarget.classList.add("dragging");
            });
            //ドラッグが終わるときに動作する
            content_div.addEventListener("dragend", e => {
                // reset the transparency
                console.log("dragend");
                e.currentTarget.classList.remove("dragging");
                if(save_flag){
                    getVersion().then(jsondata => {
                        send_format(jsondata,dragend_savefunc);
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
                }
                save_flag = false;
            });
            //ドロップ中のカーソルが要素の上に来たときに動作する
            content_div.addEventListener("dragover", e => {
                // prevent default to allow drop
                e.preventDefault();
            }, false);
            //初めにドロップ中のカーソルが要素の上に来たときに一回だけ動作する
            content_div.addEventListener("dragenter", e => {
                // highlight potential drop target when the draggable element enters it
                if(e.currentTarget.classList.contains("dropprevious")||e.currentTarget.classList.contains("dropnext")){
                    e.currentTarget.classList.add("dragover");
                }
            });
            //ドロップ中のカーソルが要素の上から外れたときに動作する
            content_div.addEventListener("dragleave", e => {
                // reset background of potential drop target when the draggable element leaves it
                if (dragged != e.currentTarget) {
                    e.currentTarget.classList.remove("dragover");
                }
            });
            //ドロップされたときに動作する dragendより先に行われる
            content_div.addEventListener("drop", e => {
                console.log("drop");
                console.dir(e.currentTarget);
                // prevent default action (open as link for some elements)
                e.preventDefault();
                // move dragged element to the selected drop target
                if (e.currentTarget.parentNode.classList.contains("dropzone")) {
                    e.currentTarget.classList.remove("dragover");
                    if(e.currentTarget.classList.contains("dropprevious")){
                        e.currentTarget.parentNode.removeChild(dragged);
                        e.currentTarget.before(dragged);
                        save_flag=true;
                    }else if(e.currentTarget.classList.contains("dropnext")){
                        e.currentTarget.parentNode.removeChild(dragged);
                        e.currentTarget.after(dragged);
                        save_flag=true;
                    }
                    const eles = e.currentTarget.parentNode.children;
                    Array.prototype.forEach.call(eles,function(ele){
                        ele.classList.remove("dropprevious");
                        ele.classList.remove("dropnext");
                    });
                    e.currentTarget.parentNode.classList.remove("dropzone");
                }
            });
        });
    });
}


//まずロードしたら、ページの現在のバージョンを撮りにいき、ページの初期設定
getVersion().then(jsondata => {initSet(jsondata);})
.catch((error) => {
    console.error('Error:', error);
});