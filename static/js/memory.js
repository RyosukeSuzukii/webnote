let host_version = -1;//バージョン情報がないことを表す-1
// ページのバージョンを取得する関数
function getVersion(){
    //ファイル名とdetailes_mean_boxのinnerHTMLを含むjsonを作成
    const data = {filename:window.location.href.split('/').pop(),version:host_version};
    return(fetch("/check/update",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json()));
}
// 送信する際に行う処理のフォーマット
function send_format(jsondata,sending){
    console.log('Success:', jsondata);
    // statusがreloadだった場合、ページのリロードを催促する
    if(jsondata["status"]=="reload"){
        if( confirm("このページは更新されています。保存を実行してしまうと現在の変更で上書きしてしまいます。再読み込みしますか？") ) {
            location.reload();//リロードする
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
    // statusがcontinueだった場合、引数のtruefunc関数を実行する
    }else if(jsondata["status"]=="continue"){
        sending();//送信処理
        alert("保存しました");
    }
}

function initSet(jsondata){
    console.log('Success:', jsondata);
    host_version = jsondata["version"];
    console.log(jsondata["version"]);
    if(jsondata["login_flag"]){
        console.log(jsondata["login_flag"]);
        change_logout();//ヘッダーのログインボタンをログアウトボタンに変更
        document.getElementById("plusicon_block").classList.remove("none");//プラスアイコンブロックを表示
        //addDraghandler();//全てのクラスcontent要素のdiv要素にドラッグイベント関数を登録する
    }else{
        /*
        Array.prototype.forEach.call(contentedit_icon, function(element){//htmlcollectionでforeachを実現する
            element.classList.add("none");//contentedit_iconクラスを持つ要素を表示
        });
        Array.prototype.forEach.call(icon_select, function(element){//htmlcollectionでforeachを実現する
            element.classList.add("none");//icon_selectクラスを持つ要素を表示
        });*/
    }
    document.body.classList.remove("none");//body要素を表示させる
}

const memory_box = document.getElementById("memory_box");
const black_curtain = document.getElementById("black_curtain");//暗転用のマスク

const plusicon = document.getElementById("plusicon");
const memoryadd_popup = document.getElementById("memoryadd_popup");
const memoryadd_categorys = memoryadd_popup.getElementsByClassName("contents_category");
const memoryadd_del_btn = memoryadd_popup.getElementsByClassName("popup_del_btn")[0];
const memory_textarea = document.getElementsByClassName("memory_textarea");
const memoryadd_submit_btn = document.getElementsByClassName("submit_btn")[0];
//ブラックマスクを表示し、記録帳追加ポップアップを表示する(イベント関数)
function appear_memoryAddPopup(e){
    black_curtain.classList.remove("none");//マスクを表示する
    memoryadd_popup.classList.remove("none");//コンテンツ追加ポップアップを表示する

    edit_ele = e.currentTarget.parentNode.parentNode;
    console.dir(e.currentTarget.parentNode.parentNode);

    memory_textarea[0].focus();//すぐにテキスト入力できるようにしておく
}
plusicon.addEventListener("click",appear_memoryAddPopup);

// memoryadd_popupを非表示にする
function hide_memoryAddPopup(){
    black_curtain.classList.add("none");//マスクを非表示にする
    memoryadd_popup.classList.add("none");//コンテンツ追加ポップアップを非表示にする
}
memoryadd_del_btn.addEventListener("click",hide_memoryAddPopup);

// 送信が終わった後の処理
function afterSend(){
    //記録帳追加ポップアップの入力欄をリセットする
    memory_textarea[0].value = "";
    memory_textarea[1].value = "";
    memory_textarea[2].value = "";
}

// memory_boxのコンテンツを保存する関数
function save_memoryArticle(){
    //新しい記録帳名とmemory_boxのinnerHTMLを持つ辞書オブジェクトを作る
    const data = {article_name:memory_textarea[0].value,memory_box:memory_box.innerHTML};

    //パス名を/add/memory_articleにして送信
    fetch("/add/memory_article",{
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
        afterSend();//送信完了後の処理
    })
    .catch((error) => {//flask側で処理エラーが起きたら
        console.error('Error:', error);
        note_box.innerHTML = tmp;
        afterSend();//送信完了後の処理
    });
}
let tmp;
// memoryadd_submit_btnをclickしたときのイベントハンドラ
function add_memoryArticle(){
    memoryadd_submit_btn.disabled = true; //連打防止
    memoryadd_submit_btn.value="追加中";
    tmp = memory_box.innerHTML;//エラー時に元に戻せるようにmemory_box.innerHTMLを保管しておく

    const new_memory_article = document.createElement("div");//新たにdiv要素を生成
    new_memory_article.classList.add("memory_article");//生成したdivのclassにmemory_articleを追加
    new_memory_article.innerHTML = '\n\
                    '+memory_textarea[2].value+'\n\
                    <div class="memory_content">\n\
                        <div class="memory_img_box">\n\
                            <img src="img/memory.png" alt="draw.io.graph">\n\
                        </div>\n\
                        <div class="memory_text_box">\n\
                            <div class="memory_article_title">\n\
                                <a href="/memory/'+memory_textarea[0].value+'.html">'+memory_textarea[0].value+'</a>\n\
                            </div>\n\
                            <div class="memory_text">' + memory_textarea[1].value + '</div>\n\
                        </div>\n\
                    </div>\n                ';
    memory_box.prepend(new_memory_article);//新たなnote_blockをnote_boxの末尾の子として追加
    memory_box.innerHTML="\n                "+memory_box.innerHTML;

    hide_memoryAddPopup()//コンテンツ追加ポップアップを非表示にする

    //memory.htmlのバージョンを確認してバージョンの違いがなければmemory.htmlを更新
    getVersion().then(jsondata => {
        send_format(jsondata,save_memoryArticle);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
memoryadd_submit_btn.addEventListener("click",add_memoryArticle);

//まずロードしたら、ページの現在のバージョンを撮りにいき、ページの初期設定
getVersion().then(jsondata => {initSet(jsondata);})
.catch((error) => {
    console.error('Error:', error);
});