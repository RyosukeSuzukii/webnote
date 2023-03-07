var query = decodeURIComponent(location.search);//ハイパーリンクのデータをデコードして取得
var value0 = query.split('&')[0].split('=');//day=2022/1/1
var value1 = query.split('&')[1].split('=');//付加データを取り出すしたい データは遷移先path?name=番号 になっているので=で切り分け
const day = value0[1];
const filename = value1[1];
console.log(filename);
console.log(day);

const insertion = document.getElementById("insertion");//iframe要素を取得
if(query){//もしハイパーリンクのデータがあれば
    insertion.src = "./"+filename;//iframe要素のsrcをfilenameに書き換え
}
const path_ele = document.getElementById("path");
path_ele.textContent+=(day+' '+filename);

function changeHeight(){//insertion要素のheightをウィンドウ縦サイズから差し引いたサイズにする
    var ch = window.innerHeight;
    if(ch >= 455){
        insertion.style.height = (ch-160)+"px";
    }else{
        insertion.style.height = (455-160)+"px";
    }
}
window.onresize = changeHeight;//windowをリサイズしたときに動作させる
changeHeight();//初めはリサイズイベントは実行されないので読み込み時に一回実行させる

document.addEventListener("DOMContentLoaded",function(event){
    // HTMLのDOMツリーが読み込み完了した時に実行される
    document.getElementById('insertion').onload = () => {
        // iframe要素が読み込まれた時に実行される
        //let href_ele = insertion.contentWindow.document.querySelector('a');
        let href_eles = insertion.contentWindow.document.getElementsByTagName('a');
        for(i=0;i<href_eles.length;i++){
            //console.dir(href_eles[i]);
            href_eles[i].target = "_parent";
            if(href_eles[i].href.indexOf('jp.ngrok.io') != -1){
                let path = href_eles[i].split("jp.ngrok.io")[1];
                href_eles[i].href = ".."+path;
            }
        }
    };
});