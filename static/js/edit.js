let host_version = -1;//バージョン情報がないことを表す-1
//let csrf_token = "";
const EditTool = {
    init: function(){
        this.defEventHandler();//イベントハンドラを宣言
    },
    // ページのバージョンを取得する関数
    getVersion: function(){
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
    },
    // 送信する際に行う処理のフォーマット
    send_format: function(jsondata,sending){
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
    },
    /*
    get_csrfToken: function(){
        return(fetch("/csrf",{method:'POST',})
        .then(response => response.json())
        .then(jsondata => {
            csrf_token = jsondata["csrf_token"];
        }));
    },*/
    defEventHandler: function(){
        //要素を発光させる関数(イベント関数)
        this.mouseover_flash = function(e){
            console.dir(e.currentTarget);
            e.currentTarget.classList.add("pikapika");
        };
        //要素の発光を止める関数(イベント関数)
        this.mouseout_flash = function(e){
            console.dir(e.currentTarget);
            e.currentTarget.classList.remove("pikapika");
        };
        //要素を赤で発光させる関数(event関数)
        this.mouseover_red = function(e){
            console.dir(e.currentTarget);
            e.currentTarget.classList.add("redfrash");
        };
        //要素を赤で発光を止める関数(event関数)
        this.mouseout_red = function(e){
            console.dir(e.currentTarget);
            e.currentTarget.classList.remove("redfrash");
        };
    }
}

const EditManagement = {
    init: function(){
        this.setParameters();//Mainフレームに関する変数の初期化
        this.defEventHandler();//イベントハンドラを宣言
        //detailes_elesの要素とsentenceにpasteイベントを追加
        this.AddPasteEvent();
        //penアイコンをクリックしたときに、editモードへ移行するイベントを追加
        this.penicon.addEventListener("click",this.transitionEditMode);
    },
    setParameters: function(){
        this.webnote_main_frame = document.getElementById("webnote_main_frame");
        this.details_mean_box = document.getElementsByClassName("details_mean_box")[0];
        this.details_eles = this.details_mean_box.children;
        this.select_contenteditable_ele = this.details_eles[0];
        this.select_range = document.createRange();
        this.select_range.setStart(this.details_eles[0], 0) // キャレットの開始位置を設定
        this.select_range.setEnd(this.details_eles[0], 0) // キャレットの終了位置を設定
        this.header1_ele = this.details_mean_box.getElementsByClassName("header1");
        this.oneblock_ele = this.details_mean_box.getElementsByClassName("oneblock");
        this.header2_ele = this.details_mean_box.getElementsByClassName("header2");
        this.nest_block_ele = this.details_mean_box.getElementsByClassName("nest_block");
        this.word_table_ele = this.details_mean_box.getElementsByClassName("word_table");
        this.penicon = document.getElementById("penicon");
        this.sentence = document.getElementById("sentence");
    },

    // 要素の前にword_tableを編集できるword_table_edit要素を配置
    putEditWord_table: function(element){
        wte = document.createElement("button");
        wte.classList.add("word_table_edit");
        wte.textContent = "行を一つ増やす";
        wte.addEventListener("click",this.add_row);
        element.before(wte);
    },
    // 全てのword_table要素の前にそのword_tableを編集できる要素を配置
    allPutEditWord_table: function(){
        Array.prototype.forEach.call(this.word_table_ele,function(element){
            this.putEditWord_table(element);
        }.bind(this));
    },
    // 要素の一つ前にあるclass：word_table_editの要素を消す
    deleteEditWord_table: function(element){
        wte = element.previousElementSibling;
        if(wte.classList.contains("word_table_edit")){
            wte.remove();
        }
    },
    // 全てのword_table要素の一つ前にあるclass：word_table_editの要素を消す
    allDeleteEditWord_table: function(){
        Array.prototype.forEach.call(this.word_table_ele,function(element){
            this.deleteEditWord_table(element);
        }.bind(this));
    },

    //details_mean_box内にあるブロックのあらゆるイベント関数を消す関数
    clean_eventfunc: function(index){
        this.details_eles[index].removeEventListener("click",this.falseContentEditable);

        this.details_eles[index].removeEventListener("mouseover",EditTool.mouseover_flash);
        this.details_eles[index].removeEventListener("mouseout",EditTool.mouseout_flash);
        this.details_eles[index].removeEventListener("click",this.click_insert_ele);

        this.details_eles[index].removeEventListener("mouseover",EditTool.mouseover_red);
        this.details_eles[index].removeEventListener("mouseout",EditTool.mouseout_red);
        this.details_eles[index].removeEventListener("click",this.click_del_ele);
    },

    //detailes_mean_boxのinnerHTMLテキストをサーバに送信する
    save_detailes: function(){
        //ファイル名とdetailes_mean_boxのinnerHTMLを含むjsonを作成
        webnote_main = document.getElementById("webnote_main");
        //const data = {filename:window.location.href.split('/').pop(),content:details_mean_box.innerHTML};
        const data = {filename:window.location.href.split('/').pop(),content:webnote_main.innerHTML};
        fetch("/api/save",{
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(jsondata => {
            console.log('Success:', jsondata);
            host_version++;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    },
    AddPasteEvent: function(){
        //sentenceにpasteイベントハンドラを追加
        this.sentence.addEventListener("paste",this.pasteStyleMatch);

        //header1,oneblock,header2,nest_block,word_tableにpasteイベントハンドラを追加
        for(i=0;i<this.details_eles.length;i++){
            let n = this.details_eles[i].className;
            if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                this.details_eles[i].addEventListener("paste",this.pasteStyleMatch);
            }
        }
    },

    // bindされたイベントハンドラを定義するにはこの関数を実行する
    defEventHandler: function(){
        //要素を作成し、自要素の後ろに挿入する(clickイベント関数) Main
        this.click_insert_ele = function(e){
            const ele = palletManagement.judg_create_ele();//追加する要素を作成
            /*--------------------------------------------*/
            e.currentTarget.after(ele);//要素を自分の後ろに追加
            if(ele.classList.contains("word_table")){//もし追加した要素がword_tableなら、この要素の前に編集用の要素を挿入
                this.putEditWord_table(ele);
            }
            e.currentTarget.classList.remove("pikapika");//発光を消す
            /*--------------------------------------------*/

            for(i=0;i<this.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにmousedownイベント解除
                /*--------------------------------------------*/
                let n = this.details_eles[i].className;
                if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                    this.details_eles[i].contentEditable = "true";
                    this.details_eles[i].addEventListener("click",this.falseContentEditable);
                    this.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_flash);
                    this.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_flash);
                    this.details_eles[i].removeEventListener("click",this.click_insert_ele);
                }
                /*--------------------------------------------*/
            }
        }.bind(this);
        //penアイコンに付与させるclickイベントハンドラ。editモードへ移行する Main
        this.transitionEditMode = function(){
            if(!this.webnote_main_frame.classList.contains("edit_mode")){//もしwebnote_main_frameのクラスにedit_modeがないなら
                this.webnote_main_frame.classList.add("edit_mode");
                palletManagement.pallet.classList.remove("none");
                
                sentence.contentEditable = "true";//クラスsentenceの要素を編集可能にする
                //header1,oneblock,header2,nest_block,word_tableをmousedownしたときに編集を可能にするイベントを追加
                for(i=0;i<this.details_eles.length;i++){
                    let n = this.details_eles[i].className;
                    if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                        console.dir(this.details_eles[i]);
                        this.details_eles[i].contentEditable = "true";
                        this.details_eles[i].addEventListener("click",this.falseContentEditable);
                    }
                }
                this.allPutEditWord_table(); //全てのword_tableの前にそのword_table編集用の要素を追加
            }
        }.bind(this);

        //マウスダウンされた要素(e.currentTarget)をselect_contenteditable_eleに格納する関数(mousedownイベントハンドラ) Main
        this.falseContentEditable = function(e){
            e.stopPropagation();
            this.select_contenteditable_ele = e.currentTarget;
            this.select_range = window.getSelection().getRangeAt(0);
        }.bind(this);
        // 次の要素(word_table)の行を一つ増やす Main
        this.add_row = function(e){
            wt = e.currentTarget.nextElementSibling;
            wt_tbody = wt.getElementsByTagName("tbody")[0];
            num = wt_tbody.children[0].children.length;
            tr = document.createElement("tr");
            for(i=0; i < num; i++){
                td = document.createElement("td");
                td.classList.add("rule");
                if(i==0){
                    td.textContent = "td";
                }
                tr.appendChild(td);
            }
            wt_tbody.appendChild(tr);
        }.bind(this);
        //要素を消す(event関数) Main
        this.click_del_ele = function(e){
            //パレット内のdel要素に対して、"x"を非表示にしdelアイコンを表示する
            palletManagement.pallet_item[5].getElementsByTagName("a")[0].classList.add("none");
            palletManagement.pallet_item[5].getElementsByTagName("img")[0].classList.remove("none");

            if(e.currentTarget.classList.contains("word_table")){//もし消そうとクリックした要素のclassにword_tableが含まれていたら
                this.deleteEditWord_table(e.currentTarget);
            }
            e.currentTarget.classList.remove("redfrash");//赤発光を消す
            e.currentTarget.remove();//選択した要素を消す

            for(i=0;i<this.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにdel系イベント解除
                let n = this.details_eles[i].className;
                if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                    this.details_eles[i].contentEditable = "true";

                    this.details_eles[i].addEventListener("click",this.falseContentEditable);
                    this.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_red);
                    this.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_red);
                    this.details_eles[i].removeEventListener("click",this.click_del_ele);
                }
            }
        }.bind(this);

        // detailes_eleにpasteするとき、スタイルを合わせてpasteするイベントハンドラ
        this.pasteStyleMatch = function(e){
            e.preventDefault();// デフォルトのペースト処理を無効化
            navigator.clipboard.read().then((clipitem) => {// clipitemを取得
                console.dir(clipitem[0]);console.log(clipitem[0].types[1]);
                if("text/html" in clipitem[0].types){// もしclipitem[0]のtypesに"text/html"を含んでいたら
                    clipitem[0].getType("text/html").then(blob=>{// blobオブジェクトを取得
                        blob.text().then(element_text=>{// htmlテキストを取得
                            //console.log(element_text);
                            element_text = element_text.replace(/<meta.*?>/,"");
                            element_text = element_text.replace(/ style=".*?"/g,"");
                            href_obj = element_text.match(/<a href=".+?">.*?<\/a>/g);
                            array = element_text.split(/<a href=".+?">.*?<\/a>/);
                            for(i=0;i<array.length;i++){
                                array[i]=array[i].replace(/<(?!(img|br|b|u)).+?>/g,"");///(<([^>]+)>)/g
                                array[i]=array[i].replace(/<\/(?!(b|u)).+?>/);
                            }
                            html_text = array[0];
                            if(href_obj!=null){
                                for(i=0;i<href_obj.length;i++){
                                    html_text+=(href_obj[i]+array[i+1]);
                                }
                            }
                            //console.log(html_text);
                            document.execCommand("insertHTML",false, html_text);// プレーンテキストをペーストする
                            //href_obj = element_text.match(/href=".+"/);// htmlテキストからhref=".+"部分を抽出したオブジェクトを取得
                            //return(href_obj);
                        })/*.then(href_obj => {// 前の処理が終わったら
                            navigator.clipboard.readText().then((clipText) => {// まずコピーされているプレーンテキストを取得
                                navigator.clipboard.writeText(clipText)// プレーンテキストをコピーする(クリップボードに保存)
                                if(href_obj!=null){//href_objがnullでなければ
                                    document.execCommand("insertHTML",false,"<a "+href_obj[0]+"'>"+clipText+"</a>");// ハイパーテキストをペーストする
                                }else{
                                    document.execCommand("insertHTML",false, clipText);// プレーンテキストをペーストする
                                }
                            });
                        })*/;
                    });
                }else{
                    navigator.clipboard.readText().then((clipText) => {// まずコピーされているプレーンテキストを取得
                        document.execCommand("insertHTML",false, clipText);// プレーンテキストをペーストする
                    });
                }
            });
        }.bind(this);
    }
}






const palletManagement = {
    edit_id: 0,//pallet内の要素の番号
    init: function(){
        this.setParameters();//エディットパレットに関する変数の初期化
        this.defEventHandler();//イベントハンドラを宣言

        //ブロックに関連したパレット内要素(h1,本文,h2,nest,表、del)にclickイベントを付与する
        for(i=0;i<this.block_pallet_num;i++){
            this.pallet_item[i].addEventListener("click",this.editProcessing_block);
        }
        //finボタンクリックしたときに、editモード解除するイベントを追加する
        this.fin_but.addEventListener("click",this.release_edit_event);

        this.table_range.addEventListener("mouseover",this.mouseover_tableflash);//table_rangeをmouseoverしたときのイベント関数としてmouseover_tableflashを登録
        this.table_range.addEventListener("mouseout",this.mouseout_resetTableFlash);//table_rangeをmouseoutしたときのイベント関数としてreset_tableflash関数を登録する
        this.table_range.addEventListener("click",this.click_table_add);//table_rangeをclickしたときのイベント関数としてclick_table_add関数を登録する

        //パレット要素の画像要素にclickイベントを付与する
        this.pallet_item[6].addEventListener("click",this.onClickImgPallet);
        // 画像ポップアップの送信ボタンをクリックしたときのイベントハンドラを登録
        this.img_popup_btn.addEventListener('click', this.upload, false);
        // 画像ポップアップのxボタンをクリックしたときのイベントハンドラを登録
        this.img_popup_del_btn.addEventListener("click",this.deleteImgPopup);
        // 画像ポップアップのinputの上げられたファイルが変わったときのイベントハンドラを登録
        this.input.addEventListener("change", () => {
            this.formData.append('img_file', this.input.files[0]);
        });

        // 画像ポップアップのギアアイコンにclickイベントを付与
        this.img_gear.addEventListener("click",this.clickImgGear);

        // パレット要素のリンク要素にclickイベントを付与する
        this.pallet_item[7].addEventListener("click",this.onClickLinkPallet);
        this.pallet_item[7].addEventListener("mousedown",this.getBlockCaratPosition);

        this.link_popup.addEventListener("mouseenter",this.getBlockCaratPosition);
        // リンクポップアップのxボタンをクリックしたときのイベントハンドラを登録
        this.link_popup_del_btn.addEventListener("click",this.deleteLinkPopup);
        // リンクポップアップのsubmitボタンをクリックしたときのイベントハンドラを登録
        this.link_submit_btn.addEventListener("click",this.insertLinkText);
        this.link_submit_btn.addEventListener("mousedown",this.getBlockCaratPosition);

        // パレット要素の段落要素にclickイベントを付与
        this.pallet_item[8].addEventListener("click",this.onClickJustifi);

        // windowにリサイズハンドラを付与する
        window.addEventListener("resize",() => {
            this.pallet_item[4].getElementsByTagName("a")[0].classList.add("none");//xを消す
            this.pallet_item[4].getElementsByTagName("img")[0].classList.remove("none");//tableアイコンを表示
            this.table_popup.classList.add("none");//tableポップアップを非表示
            this.pallet_item[6].getElementsByTagName("a")[0].classList.add("none");//xを消す
            this.pallet_item[6].getElementsByTagName("img")[0].classList.remove("none");//imgアイコンを表示
            this.img_popup.classList.add("none")//画像入力ブロックを非表示
            this.deleteJustifiPopup();
        })
    },
    setParameters: function(){
        this.pallet = document.getElementById("pallet");
        this.pallet_item = document.getElementsByClassName("pallet_item");//pallet_itemを取得
        this.block_pallet_num = 6;
        this.block_addPallet_num = 5;
        this.palletH1_title="h1";this.palletBody_title="本文";this.palletH2_title="h2";this.palletNest_title="nest";
        this.palletTable_title="表";this.palletDel_title="del";this.palletImg_title = "";

        this.fin_but = document.getElementById("cancel_but");
        
        // 表パレットに関する変数
        this.table_popup = document.getElementById("table_popup");
        this.table_range = document.getElementById("table_range");
        this.t_rows = this.table_range.getElementsByClassName("t_row");
        this.select_row = 0;//挿入する表の行の大きさ
        this.select_col = 0;//挿入する表の列の大きさ
        this.insert_tbody;//挿入するtbody要素を格納する変数

        this.formData = new FormData();//formdataオブジェクトを新しく生成
        this.img_popup = document.getElementById("img_popup");
        this.img_popup_btn = this.img_popup.getElementsByClassName("submit_btn")[0];//送信ボタン
        this.img_popup_del_btn = this.img_popup.getElementsByClassName("popup_del_btn")[0];
        this.input = document.getElementById('img_file');
        this.img_option_block = this.img_popup.getElementsByClassName("option_block")[0];
        this.img_gear = document.getElementById("img_gear");
        this.img_option = document.getElementById("img_option");
        this.imgw_select = document.getElementById("imgw_select");

        this.link_popup = document.getElementById("link_popup");
        this.link_submit_btn = this.link_popup.getElementsByClassName("submit_btn")[0];
        this.link_popup_del_btn = this.link_popup.getElementsByClassName("popup_del_btn")[0];
        this.link_textarea = this.link_popup.getElementsByClassName("link_textarea");

        this.justifi = document.getElementById("justifi");
        this.justifi_intLinks = this.justifi.getElementsByClassName("intLink");
    },
    //edit_idから追加する要素を判定し、要素を作成する　clickイベント関数で使われる関数 pallet
    judg_create_ele: function(){
        /*--------------------------------------------*/
        let ele;
        if(this.edit_id == this.palletH1_title){
            ele = document.createElement("div");
            ele.textContent = "header1";
            ele.classList.add("header1");
        }else if(this.edit_id == this.palletBody_title){
            ele = document.createElement("div");
            ele.textContent = "oneblock";
            ele.classList.add("oneblock");
        }else if(this.edit_id == this.palletH2_title){
            ele = document.createElement("div");
            ele.textContent = "header2";
            ele.classList.add("header2");
        }else if(this.edit_id == this.palletNest_title){
            ele = document.createElement("div");
            ele.textContent = "nest_block";
            ele.classList.add("nest_block");
        }else if(this.edit_id == this.palletTable_title){
            ele = document.createElement("table");
            ele.classList.add("word_table");
            ele.appendChild(insert_tbody);
        }
        for(i=0;i<this.block_addPallet_num;i++){//xマークを戻す
            if(!this.pallet_item[i].getElementsByTagName("a")[0].classList.contains("none")){//"x"が隠されていないか
                //this.pallet_item[i].textContent = this.pallet_item[i].title;
                this.pallet_item[i].getElementsByTagName("a")[0].classList.add("none");
                this.pallet_item[i].getElementsByTagName("img")[0].classList.remove("none");
                break;
            }
        }
        /*--------------------------------------------*/
        ele.contentEditable = "false";
        ele.addEventListener("mouseover",EditTool.mouseover_flash);
        ele.addEventListener("mouseout",EditTool.mouseout_flash);
        ele.addEventListener("click",EditManagement.click_insert_ele);
        ele.addEventListener("paste",EditManagement.pasteStyleMatch);
        return(ele);
    },
    //パレットの子要素をリセットする
    clean_palletfunc: function(){
        //this.img_popup.classList.add("none");
        this.deleteImgPopup();//画像ポップアップを隠す
        this.deleteLinkPopup();//linkポップアップを隠す
        this.deleteJustifiPopup();//段落ポップアップを隠す
        this.table_popup.classList.add("none");//表ポップアップを隠す
        for(i=0;i<8;i++){//テキストコンテントのxを元に戻す
            if(!this.pallet_item[i].getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているなら
                //this.pallet_item[i].textContent = this.pallet_item[i].title;
                this.pallet_item[i].getElementsByTagName("a")[0].classList.add("none");//xを消す
                this.pallet_item[i].getElementsByTagName("img")[0].classList.remove("none");//アイコンを表示させる
                break;
            }
        }
    },
    // 表パレットに関する処理
    //tableポップアップを表示する際に行う処理
    table_appear: function(){
        rect=this.pallet_item[4].getBoundingClientRect();//pallet要素内にあるtable要素のページ内での位置を取得
        this.table_popup.style.left = rect.left + "px";//位置leftの値でtableポップアップのleft属性の値を変える
        this.table_popup.classList.remove("none");//tableポップアップを表示させる
    },
    //table_rangeの全ての行要素(t_col)のsqu要素に対してclass属性値flashtable_iconを削除する
    reset_tableflash: function(){
        for(i=0;i<this.t_rows.length;i++){//全ての行を網羅する
            c = this.t_rows[i].children;
            for(j=0;j<c.length;j++){
                c[j].children[0].classList.remove("flashtable_icon");
            }
        }
        //console.log("hello");
        this.select_row = 0; this.select_col = 0;
        //console.log("行数"+select_row+"と列数"+select_col);
    },
    //要素eleのsqu要素にclass属性値flashtable_iconを追加する。
    tableflash: function(ele){
        ele.children[0].classList.add("flashtable_icon");
    },

    //画像パレット
    //画像入力ボックスを出現する際に行う処理
    imgPopup_appear: function(){
        rect = this.pallet_item[6].getBoundingClientRect();//pallet要素内にあるtable要素の、ページ内での位置を取得
        if(window.innerWidth >= 525){
            this.img_popup.style.left = (rect.left - 301.8515625) + "px";
        }else{
            this.img_popup.style.left = "";
        }
        this.img_popup.classList.remove("none");//画像入力ボックスを出現させる
    },
    //挿入する画像を生成
    createImage: function(imgsrc) {
        const elImage = new Image();
        elImage.src = imgsrc;
        elImage.classList.add('img_block');
        if(this.imgw_select.value!="auto"){
            elImage.style.width = this.imgw_select.value;
        }
        return elImage;
    },
    //画像のsrcをサーバに要求
    getPictures: function() {
        return fetch("/api/pics")
        .then(res => res.json())
    },
    //画像を読み込む
    renderPictures: function() {
        const album = document.getElementById('imglist');
        while (album.firstChild) album.removeChild(album.firstChild);
        this.getPictures().then(pictures => {
            pictures.forEach(picture => {
                img_name = picture.match(/([^/]*)\./)[1]+"."+picture.match(/[^.]+$/);//ファイル名を生成
                let img_item = document.createElement("button");
                img_item.classList.add("img_insert");//選択不可にする 選択不可にしないとクリックしたときにSelection()の値が変わってしまう
                img_item.textContent = img_name;//画像ファイル名をtextContentにする

                //img_itemをクリックしたときに発火する関数を追加
                img_item.addEventListener("click",this.clickImgItem);
                album.appendChild(img_item);
            })
        })
    },
    //画像アップロード後に行う
    afterPost: function() {
        this.img_popup_btn.disabled = false;
        this.img_popup_btn.value="送信";
        this.input.value = "";
        this.formData = new FormData();
        this.renderPictures();
    },

    //リンクパレット
    //リンク入力ポップアップを出現する際に行う処理
    linkPopup_appear: function(){
        rect = this.pallet_item[7].getBoundingClientRect();//pallet要素内にあるlink要素の、ページ内での位置を取得
        this.link_popup.style.left = rect.left - 70 + "px";
        this.link_popup.classList.remove("none");//画像入力ボックスを出現させる
        this.link_textarea[0].focus();//link_textをフォーカスする
    },

    //段落パレット
    //段落ポップアップを出現する際に行う処理
    justifiPopup_appear: function(){
        rect = this.pallet_item[8].getBoundingClientRect();//pallet要素内にあるjustifi要素の、ページ内での位置を取得
        this.justifi.style.left = rect.left - 32 + "px";
        this.justifi.classList.remove("none");//画像入力ボックスを出現させる
    },

    defEventHandler: function(){
        //ブロックに関連するpalletをクリックしたときに行う関数(clickイベント関数) pallet
        this.editProcessing_block = function(e){
            if(!e.currentTarget.getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているとき
                if(e.currentTarget.title == this.palletTable_title){this.table_popup.classList.add("none");}
                //e.currentTarget.textContent = e.currentTarget.title;
                e.currentTarget.getElementsByTagName("a")[0].classList.add("none");
                e.currentTarget.getElementsByTagName("img")[0].classList.remove("none");//アイコンを表示させる
                console.log(e.currentTarget.title);
                for(i=0;i<EditManagement.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにinsert系イベント解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){//"x"ボタンを押したら、強制的にブロック要素を編集可能にする
                        if(e.currentTarget.title == this.palletDel_title){//クリックしたのがパレットのdel要素ならば、
                            EditManagement.details_eles[i].contentEditable = "true";
                            EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);
                            EditManagement.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_red);
                            EditManagement.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_red);
                            EditManagement.details_eles[i].removeEventListener("click",EditManagement.click_del_ele);
                        }else{//それ以外のパレット内の要素なら
                            EditManagement.details_eles[i].contentEditable = "true";
                            EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);
                            EditManagement.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_flash);
                            EditManagement.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_flash);
                            EditManagement.details_eles[i].removeEventListener("click",EditManagement.click_insert_ele);
                        }
                    }
                }
            }else{
                //palletをリセット
                this.clean_palletfunc();
                this.edit_id = e.currentTarget.title;
                console.log(this.edit_id);
                //e.currentTarget.textContent = "x";//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                        EditManagement.clean_eventfunc(i);
                        //delの場合は、del用のイベントを登録
                        if(this.edit_id == this.palletDel_title){
                            EditManagement.details_eles[i].contentEditable = "false";
                            EditManagement.details_eles[i].addEventListener("mouseover",EditTool.mouseover_red);
                            EditManagement.details_eles[i].addEventListener("mouseout",EditTool.mouseout_red);
                            EditManagement.details_eles[i].addEventListener("click",EditManagement.click_del_ele);
                        //表の場合は、ブロック選択の前に行と列の選択を行うため、ここではブロック選択にしない
                        }else if(this.edit_id == this.palletTable_title){
                            this.table_appear();//tableポップアップを表示させる
                            EditManagement.details_eles[i].contentEditable = "true";
                            EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);
                            EditManagement.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_flash);
                            EditManagement.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_flash);
                            EditManagement.details_eles[i].removeEventListener("click",EditManagement.click_insert_ele);
                        }else{
                            EditManagement.details_eles[i].contentEditable = "false";
                            EditManagement.details_eles[i].addEventListener("mouseover",EditTool.mouseover_flash);
                            EditManagement.details_eles[i].addEventListener("mouseout",EditTool.mouseout_flash);
                            EditManagement.details_eles[i].addEventListener("click",EditManagement.click_insert_ele);
                        }
                    }
                }
            }
        }.bind(this);

        //あらゆるeditするためのイベントを解除し、保存を行うかの判別をする(clickイベント関数) pallet
        this.release_edit_event = function(){
            //palletをリセット
            this.clean_palletfunc();
            EditManagement.sentence.contentEditable = "false";//クラスsentenceの要素を編集可能にする
            //detaile_mean_boxの子要素に付与されたあらゆるイベントを解除
            for(i=0;i<EditManagement.details_eles.length;i++){
                let n = EditManagement.details_eles[i].className;
                if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                    EditManagement.details_eles[i].contentEditable = "false";
                    EditManagement.clean_eventfunc(i);
                }
            }
            EditManagement.allDeleteEditWord_table();
            if( confirm("保存しますか？") ) {
                //送信処理
                EditTool.getVersion().then(jsondata => {
                    EditTool.send_format(jsondata,EditManagement.save_detailes)//
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
                //save_detailes();//送信処理
                //alert("保存しました");
            }
            else {
                //alert("保存しませんでした");
            }
            this.pallet.classList.add("none");//パレットヘッダーを消す
            EditManagement.webnote_main_frame.classList.remove("edit_mode");//paddingを戻しておく
        }.bind(this);

        //table_rangeの全ての行要素(t_col)のsqu要素に対してclass属性値flashtable_iconを削除する mouseoutイベントハンドラ
        this.mouseout_resetTableFlash = function(){
            this.reset_tableflash();
        }.bind(this),
        //table_rangeをmouseoverしたときに対応する行列を青く光らせるイベント関数 pallet
        this.mouseover_tableflash = function(e){
            if(e.target.classList.contains("t_col")||e.target.classList.contains("t_squ")){//mouseoverで得られたe.targetのclassにt_colまたはt_squが含まれているか判定
                //含まれているなら
                console.dir(e.target);
                this.reset_tableflash();//まず、table_rangeの全ての列要素(squ要素)の発光をリセットする
                let origin = e.target;//originにe.targetを格納
                if(e.target.classList.contains("t_squ")){//もしclassにt_squが含まれているなら
                    origin = e.target.parentNode;//originにe.target.parentNodeを再格納
                }
                let origin_parent = origin.parentNode;//originに対する行要素をorigin_parentに格納
                this.tableflash(origin);//まずmouseoverされた列要素(squ要素)を青くする
                let i = 0;//このiは別の行要素の列要素(squ要素)を青く光らせるのに必要になる
                //次に、その列要素より前の列要素(squ要素)を全て青く光らせる。
                while(origin.previousElementSibling!=null){
                    origin = origin.previousElementSibling;
                    this.tableflash(origin);
                    i++;
                }
                this.select_col = i+1;
                //初めに得られた行要素よりも全ての前の行要素に対して、添字i以下の列要素(squ要素)を青く光らせる
                let p = 1;//行を数えるための変数
                while(origin_parent.previousElementSibling!=null){
                    origin_parent = origin_parent.previousElementSibling;
                    for(j=0;j<=i;j++){
                        this.tableflash(origin_parent.children[j]);
                    }
                    p++;
                }
                this.select_row = p;
                //console.log("行数"+select_row+"と列数"+select_col);
            }
        }.bind(this);
        //table_rangeをclickしたときにtableポップアップを消し挿入ブロック選択に移るイベント関数 pallet
        this.click_table_add = function(e){
            if(this.select_row>0&&this.select_col>0){
                insert_tbody = document.createElement("tbody");
                for(i=0;i<this.select_row;i++){
                    tr = document.createElement("tr");
                    for(j=0;j<this.select_col;j++){
                        td = document.createElement("td");
                        td.classList.add("rule");
                        if(j==0){
                            td.textContent = "td";
                        }
                        tr.appendChild(td);
                    }
                    insert_tbody.appendChild(tr);
                }
                this.table_popup.classList.add("none");
                for(i=0;i<EditManagement.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                        console.log(n);
                        EditManagement.clean_eventfunc(i);
                        EditManagement.details_eles[i].contentEditable = "false";
                        EditManagement.details_eles[i].addEventListener("mouseover",EditTool.mouseover_flash);
                        EditManagement.details_eles[i].addEventListener("mouseout",EditTool.mouseout_flash);
                        EditManagement.details_eles[i].addEventListener("click",EditManagement.click_insert_ele);
                    }
                }
            }
        }.bind(this);

        // 画像をアップロードする pallet
        this.upload = function(){
            file = document.getElementById('img_file'); //file
            if (!file.value){//もしfile要素のvalueにデータが何もなかったら
                return false;
            }
            this.img_popup_btn.disabled = true; //連打防止
            this.img_popup_btn.value="送信中";
            fetch('/api/pics', {
                method: 'POST',
                body: this.formData ,
            }).then(res => {
                return res.json();
            }).then(json => {
                console.log("kita");
                console.log(json);//中身を確認
                if(json["status"] == "false"){ //Flask側で"false"と判断されたらアラートする
                    alert(json["message"])
                }
                this.afterPost(); //POST後の処理
            }).catch(err => {
                alert("ファイルサイズが1MBを超えていませんか?")
                this.afterPost();
            })
        }.bind(this);
        //パレット要素の画像要素に付与するclickイベントハンドラ pallet
        this.onClickImgPallet = function(e){
            if(!e.currentTarget.getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているとき
                this.deleteImgPopup();//imgポップアップを消す
            }else{
                this.clean_palletfunc();//palletの状態をリセットする
                this.imgPopup_appear();//画像入力ボックスの位置をきめ、出現させる
                this.edit_id = e.currentTarget.title;
                console.log(this.edit_id);
                //e.currentTarget.textContent = "x";//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                        EditManagement.clean_eventfunc(i);//あらゆるイベント関数を解除する
                        EditManagement.details_eles[i].contentEditable = "true";
                        EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);//マウスダウン時にその要素を編集可能にする関数を追加
                    }
                }
                this.renderPictures()//画像一覧を取りに行く
            }
        }.bind(this);
        // 画像を指定のブロック内に追加するclickイベントハンドラ
        this.clickImgItem = function(e){
            EditManagement.select_contenteditable_ele.focus();
            const range = document.getSelection().getRangeAt(0).cloneRange();//範囲オブジェクトを複製生成
            const imgsrc = "../img/" + e.currentTarget.textContent;//画像までのパスを生成
            const elImage = this.createImage(imgsrc);//クリックした要素を元に挿入する画像を生成
            console.log(range);
            // textノードの場合
            if (range.startContainer.splitText) {
                const splittedNodeText = range.startContainer.splitText(range.startOffset);
                console.log(splittedNodeText);
                // 前のnodeから後ろに入れても、後のnodeから前に入れてもカーソル位置は変わらない
                range.startContainer.parentNode.insertBefore(elImage, splittedNodeText);//画像をカーソル位置に挿入
                // range.startContainer.after(elImage);
                document.getSelection().collapse(splittedNodeText, 0);
            }else{
                // それ以外の場合（基本的にdiv要素）
                // カーソルを示している子要素のindexの手前に入れる
                const insertedBeforeNode = range.startContainer.childNodes[range.startOffset];
                range.startContainer.insertBefore(elImage, insertedBeforeNode);
                document.getSelection().collapse(range.startContainer, range.startOffset + 1);
            }
        }.bind(this);
        //画像ポップアップを削除する関数
        this.deleteImgPopup = function(){
            this.img_popup.classList.add("none");//画像ポップアップを隠す
            //this.pallet_item[6].textContent = this.pallet_item[6].title;
            this.pallet_item[6].getElementsByTagName("a")[0].classList.add("none");//パレット要素の画像要素の"x"を隠す
            this.pallet_item[6].getElementsByTagName("img")[0].classList.remove("none");//パレット要素の画像要素のアイコンを表示する
            this.img_option.classList.add("none");//画像オプションビューを非表示にする
        }.bind(this);
        // 画像オプションビューを表示・非表示するclickイベントハンドラ
        this.clickImgGear = function(){
            if(this.img_option.classList.contains("none")){//画像オプションビューが非表示ならば
                this.img_option.classList.remove("none");//画像オプションビューを表示にする
            }else{
                this.img_option.classList.add("none");//画像オプションビューを非表示にする
            }
        }.bind(this);

        //パレット要素のリンク要素に付与するclickイベントハンドラ
        this.onClickLinkPallet = function(e){
            console.dir(EditManagement.select_contenteditable_ele);
            if(!e.currentTarget.getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているとき
                this.deleteLinkPopup();//imgポップアップを消す
            }else{
                this.clean_palletfunc();//palletの状態をリセットする
                this.linkPopup_appear();//画像入力ボックスの位置をきめ、出現させる
                this.edit_id = e.currentTarget.title;
                console.log(this.edit_id);
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                        EditManagement.clean_eventfunc(i);//あらゆるイベント関数を解除する
                        EditManagement.details_eles[i].contentEditable = "true";
                        EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);//マウスダウン時にその要素を編集可能にする関数を追加
                    }
                }
            }
        }.bind(this);
        //ノートblockのどの位置にcaretがあるかを特定して保存する関数 リンクパレット、リンクポップアップ、リンクポップアップサブミットボタンに付与させるイベントハンドラ
        this.getBlockCaratPosition = function(){
            selection_ele = document.activeElement;
            if(selection_ele!=document.body){
                range = window.getSelection().getRangeAt(0);
                let n = selection_ele.className;//クラスネームを格納
                if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                    EditManagement.select_range = range;
                }
            }
        }.bind(this);
        // リンクポップアップのsubmitボタンに付与するイベントハンドラ ブロックにリンクテキストを挿入する
        this.insertLinkText = function(){
            EditManagement.select_contenteditable_ele.focus();
            window.getSelection().removeAllRanges() // 現在のrangeをクリア
            window.getSelection().addRange(EditManagement.select_range) // rangeを追加
            if(this.link_textarea[0].value==""&&this.link_textarea[1].value==""){//もし表示テキストとリンクするurlが入力されていなかったら
                //console.log("failed");
                return false;
            }else if(this.link_textarea[0].value==""){
                document.execCommand("CreateLink", false, this.link_textarea[1].value);
            }else{
                document.execCommand("insertHTML",false,"<a href='"+this.link_textarea[1].value+"'>"+this.link_textarea[0].value+"</a>");
            }
            //console.log("success");
            this.deleteLinkPopup();
        }.bind(this);
        //リンクポップアップを削除する関数
        this.deleteLinkPopup = function(){
            this.link_popup.classList.add("none");//画像ポップアップを隠す
            this.pallet_item[7].getElementsByTagName("a")[0].classList.add("none");//パレット要素のリンク要素の"x"を隠す
            this.pallet_item[7].getElementsByTagName("img")[0].classList.remove("none");//パレット要素のリンク要素のアイコンを表示する
        }.bind(this);

        // 段落ポップアップを表示するclickイベントハンドラ
        this.onClickJustifi = function(e){
            if(!e.currentTarget.getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているとき
                this.deleteJustifiPopup();//imgポップアップを消す
            }else{
                this.clean_palletfunc();//palletの状態をリセットする
                this.justifiPopup_appear();//画像入力ボックスの位置をきめ、出現させる
                this.edit_id = e.currentTarget.title;
                console.log(this.edit_id);
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//header1,oneblock,header2,nest_block,word_tableにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="header1"||n=="oneblock"||n=="header2"||n=="nest_block"||n=="word_table"){
                        EditManagement.clean_eventfunc(i);//あらゆるイベント関数を解除する
                        EditManagement.details_eles[i].contentEditable = "true";
                        EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);//マウスダウン時にその要素を編集可能にする関数を追加
                    }
                }
            }
        }.bind(this);
        //段落ポップアップを削除する関数
        this.deleteJustifiPopup = function(){
            this.justifi.classList.add("none");
            this.pallet_item[8].getElementsByTagName("a")[0].classList.add("none");//パレット要素の段落要素の"x"を隠す
            this.pallet_item[8].getElementsByTagName("img")[0].classList.remove("none");//パレット要素の段落要素のアイコンを表示する
        }
    }
}

// ページの初期設定を行う関数 statusはset
function initSet(jsondata){
    console.log('Success:', jsondata);
    host_version = jsondata["version"];// ページのバージョンを初期化
    console.log(jsondata["version"]);
    // ログインしていたときに行う追加の処理
    if(jsondata["login_flag"]){
        change_logout();//ヘッダーのログインボタンをログアウトボタンに変更
    }else{
        EditManagement.penicon.classList.add("none");//peniconを表示
    }
    document.body.classList.remove("none");//body要素を表示させる
}

EditTool.init();
EditManagement.init();
palletManagement.init();
//まずロードしたら、ページの現在のバージョンをとりにいき、ページの初期設定を行う。
EditTool.getVersion().then(jsondata => {
    initSet(jsondata);// ページの初期設定を行う statusはset
})
.catch((error) => {
    console.error('Error:', error);
});

// memoryノート用の設定に変更するメソッド
function switch_memoryNote(){
    EditManagement.save_path = "/save/memory_article";
    console.log(EditManagement.save_path);
}

/*--------------------------------------------*/
//テキスト編集命令関数
function formatDoc(sCmd, sValue) {
    document.execCommand(sCmd, false, sValue);
    //select_contenteditable_ele.focus();//選択している要素にフォーカスする
}
//キーを押したときの処理
function key_down_func(e){
    if(e.metaKey === true){
        if(e.key === 'u' || e.key === 'U'){
            //UキーとCommandが同時に押された時の処理
            formatDoc("Underline");//編集可能な要素のテキストを範囲選択している場合、そのテキストにアンダーラインを引く
            console.log("underline");
        }
	}
	return false;
}
document.addEventListener('keydown', key_down_func);

ltoken = 45;
function test(){
    const data = {token:ltoken};
    fetch("/test/testing",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(jsondata => {
        console.log(jsondata["message"]);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
function checking(){
    const data = {token:ltoken};
    fetch("/test/check",{
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(jsondata => {
        console.log("response id = " + jsondata["id"]);
        console.log("response session = " + jsondata["session"]);
        console.log("response account_id = " + jsondata["account_id"]);
        console.log("response account_pass = " + jsondata["account_pass"]);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}