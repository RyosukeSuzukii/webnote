console.log(location.pathname);//現在のページのパスを表示
path_layer = 0;//現在のページのパスの階層を入れる変数
abso_path = "/Users/user/site";
abso_path_layer = 3;

//現在のページのパスの階層を取得
for (var i = 0; i < location.pathname.length; i++){
    if (location.pathname[i] == '/'){
        path_layer ++;
    }
}
//ローカルの場合に
if ( location.pathname.indexOf(abso_path) != -1) {
    //strにabso_pathを含む場合の処理
    path_layer -= abso_path_layer;
}
console.log(path_layer);


top_form_item = document.getElementsByClassName("top_form_item");//header内の遷移させる要素を取得
console.log(top_form_item.length);

top_form_item[0].addEventListener("click",function(){//Top
    if(path_layer==2){
        location.href="../index.html";
    }else{
        location.href="index.html";
    }
});
top_form_item[1].addEventListener("click",function(){//WebNote
    if(path_layer==2){
        location.href="../webnote.html";
    }else{
        location.href="webnote.html";
    }
});
top_form_item[2].addEventListener("click",function(){//GitHub
    location.href="https://github.com/RyosukeSuzukii";
});
top_form_item[3].addEventListener("click",function(){//Work
    if(path_layer==2){
        location.href="../work.html";
    }else{
        location.href="work.html";
    }
});
top_form_item[4].addEventListener("click",function(){//Memory
    if(path_layer==2){
        location.href="../memory.html";
    }else{
        location.href="memory.html";
    }
});


function clickLoginHandler(){
    location.href=new URL(window.location.href).origin + "/login";
}
function clickLogoutHandler(){
    fetch("/logout",{
        method: 'POST', // or 'PUT'
        /*
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),*/
    })
    .then(response => response.json())
    .then(jsondata => {
        console.log(jsondata["message"]);
        location.reload();
    })
}
top_form_item[5].addEventListener("click",clickLoginHandler);

function change_logout(){
    top_form_item[5].textContent = "Logout";
    top_form_item[5].removeEventListener("click",clickLoginHandler);
    top_form_item[5].addEventListener("click",clickLogoutHandler);
}