// ログイン状態を取得する関数
function getLogin(){
    return(fetch("/get/login",{
        method: 'GET', // or 'PUT'
    })
    .then(response => response.json()));
}
// ページの初期設定を行う関数
function initSet(jsondata){
    console.log('Success:', jsondata);
    // ログインしていたときに行う追加の処理
    if(jsondata["login_flag"]){
        change_logout();//ヘッダーのログインボタンをログアウトボタンに変更
    }
    document.body.classList.remove("none");//body要素を表示させる
}

//ログイン状態かを確認した後、それに伴うページの初期設定を行う
getLogin().then(jsondata => {
    initSet(jsondata);// ページの初期設定を行う
})
.catch((error) => {
    console.error('Error:', error);
});

contents_item = document.getElementsByClassName("contents_item");
console.log(contents_item.length);

contents_item[0].addEventListener("click",function(){//WebNote
    location.href="webnote.html";
});
contents_item[1].addEventListener("click",function(){//GitHub
    location.href="https://github.com/RyosukeSuzukii";
});
contents_item[2].addEventListener("click",function(){//Work
    location.href="work.html";
});
contents_item[3].addEventListener("click",function(){//Memory
    location.href="memory.html";
});