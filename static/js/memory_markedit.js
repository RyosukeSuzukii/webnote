var script = document.createElement('script'); //変数名は適当なものにでも
script.src = "/js/markedit.js"; //ファイルパス
document.head.appendChild(script); //<head>に生成
script.addEventListener("load",function(){
    switch_memoryNote();
});