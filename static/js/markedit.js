let host_version = -1;//バージョン情報がないことを表す-1
//let csrf_token = "";
const EditTool = {
    init: function(){
        this.defEventHandler();//イベントハンドラを宣言
    },
    // ページのバージョンを取得する関数
    getVersion: function(){
        //ファイル名とdetailes_mean_boxのinnerHTMLを含むjsonを作成
        //const data = {filename:window.location.href.split('/').pop(),version:host_version};
        const data = {filename:window.location.pathname,version:host_version};
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
        //
        Array.prototype.forEach.call(this.details_eles,function(element){
            if(!element.classList.contains("oneblock")) return;
            this.oneblockStartUp(element);//oneblockをセットアップする
        }.bind(this));
        
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
        //this.header1_ele = this.details_mean_box.getElementsByClassName("header1");
        this.oneblock_ele = this.details_mean_box.getElementsByClassName("oneblock");
        //this.header2_ele = this.details_mean_box.getElementsByClassName("header2");
        //this.nest_block_ele = this.details_mean_box.getElementsByClassName("nest_block");
        this.word_table_ele = this.details_mean_box.getElementsByClassName("word_table");
        this.penicon = document.getElementById("penicon");
        this.sentence = document.getElementById("sentence");
        this.save_path = "/api/save";
    },

    // oneblockをスタートアップするメソッド
    oneblockStartUp: function(oneblock){
        this.oneblockSetup(oneblock);// oneblockをセットアップ
        const textarea = oneblock.querySelector(".flex_textarea");
        const markup_icon = oneblock.querySelector(".markup_icon");
        const look_icon = oneblock.querySelector(".look_icon");
        markup_icon.classList.add("none");
        look_icon.classList.add("none");
        const flex_textarea_dummy = textarea.querySelector(".flex_textarea_dummy");
        const flex_textarea_real = textarea.querySelector(".flex_textarea_real");
        const look = oneblock.querySelector(".look");
        flex_textarea_real.value = flex_textarea_dummy.textContent.slice(0, -1);
        flex_textarea_real.disabled = true;
        textarea.classList.add("none");
        look.classList.remove("none");
    },
    // oneblockをセットアップするメソッド
    oneblockSetup: function(oneblock){
        const textarea = oneblock.querySelector(".flex_textarea");
        this.addInputHandler_textarea(textarea);//textareaにinputイベントハンドラを追加
        const edicon = oneblock.querySelector(".edicon");
        this.addClickHandler_iconInEdicon(edicon);//edicon子要素にclickイベントハンドラを追加
    },
    // webnote編集を開始するためのスタートアップをするメソッド
    webnoteStartup: function(){
        this.sentence.contentEditable = "true";//クラスsentenceの要素を編集可能にする
        //oneblockをmousedownしたときに編集を可能にするイベントを追加
        for(i=0;i<this.details_eles.length;i++){
            if(this.details_eles[i].classList.contains("oneblock")){
                console.dir(this.details_eles[i]);
                this.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
                this.details_eles[i].addEventListener("click",this.falseContentEditable);
                this.visible_markupIcon(this.details_eles[i]);//markup_iconを表示
            }
        }
        //this.allPutEditWord_table(); //全てのword_tableの前にそのword_table編集用の要素を追加
    },
    webnoteShutdown: function(){
        palletManagement.pallet.classList.add("none");//パレットヘッダーを消す
        this.webnote_main_frame.classList.remove("edit_mode");//paddingを戻しておく
        palletManagement.onClickLookPallet();
        Array.prototype.forEach.call(this.details_eles,function(oneblock){
            if(!oneblock.classList.contains("oneblock")) return;
            const markup_icon = oneblock.querySelector(".markup_icon");
            const look_icon = oneblock.querySelector(".look_icon");
            markup_icon.classList.add("none");
            look_icon.classList.add("none");
            flex_textarea = oneblock.querySelector(".flex_textarea");
            look = oneblock.querySelector(".look");
            if(!look_icon.classList.contains("none")){
                EditManagement.visible_look(markup_icon,look_icon,flex_textarea,look);
            }
        }.bind(this));
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
        //const data = {filename:window.location.href.split('/').pop(),content:webnote_main.innerHTML};
        const data = {filename:window.location.pathname,content:webnote_main.innerHTML};
        fetch(EditManagement.save_path,{
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

    //flex_textarea_realに、文字をdummyに追記するinputハンドラを追加するメソッド
    addInputHandler_textarea: function(flex_textarea) {
        const dummy = flex_textarea.querySelector('.flex_textarea_dummy');
        flex_textarea.querySelector('.flex_textarea_real').addEventListener('input', e => {
            dummy.textContent = e.target.value + '\u200b';
        });
    },
    //edicon子要素のmarkup_iconとlook_iconにclickハンドラを追加するメソッド
    addClickHandler_iconInEdicon: function(edicon){
        const markup_icon = edicon.querySelector(".markup_icon");
        const look_icon = edicon.querySelector(".look_icon");
        markup_icon.addEventListener("click",EditManagement.iconInEdicon_clickhandler);
        look_icon.addEventListener("click",EditManagement.iconInEdicon_clickhandler);
    },

    // markup_iconを表示させるメソッド
    visible_markupIcon: function(oneblock){
        markup_icon = oneblock.querySelector(".markup_icon");
        markup_icon.classList.remove("none");
    },
    //markup_icon、look_icon、flex_textarea、lookをnoneトグルさせる
    toggle_iconInEdicon: function(markup_icon,look_icon,flex_textarea,look){
        if(!look_icon.classList.contains("none")){
            //markdownをパースする
            look.innerHTML = marked.parse(flex_textarea.querySelector(".flex_textarea_real").value);
        }
        markup_icon.classList.toggle("none");
        look_icon.classList.toggle("none");
        flex_textarea.classList.toggle("none");
        look.classList.toggle("none");
    },
    //markup_iconとflex_textareaを表示させ、look_iconとlookを非表示にする
    visible_textarea: function(markup_icon,look_icon,flex_textarea,look){
        markup_icon.classList.add("none");
        look_icon.classList.remove("none");
        flex_textarea.classList.remove("none");
        look.classList.add("none");
    },
    //markup_iconとflex_textareaを表示させ、look_iconとlookを非表示にする
    visible_look: function(markup_icon,look_icon,flex_textarea,look){
        markup_icon.classList.remove("none");
        look_icon.classList.add("none");
        //markdownをパースする
        look.innerHTML = marked.parse(flex_textarea.querySelector(".flex_textarea_real").value);
        flex_textarea.classList.add("none");
        look.classList.remove("none");
    },

    // bindされたイベントハンドラを定義するにはこの関数を実行する
    defEventHandler: function(){
        //要素を作成し、自要素の後ろに挿入する(clickイベント関数) Main
        this.click_insert_ele = function(e){
            const ele = palletManagement.judg_create_ele();//追加する要素を作成
            e.currentTarget.after(ele);//要素を自分の後ろに追加
            e.currentTarget.classList.remove("pikapika");//発光を消す
            //パレット内の本文要素に対して、"x"を非表示にし本文アイコンを表示する
            palletManagement.palletBody.getElementsByTagName("a")[0].classList.add("none");
            palletManagement.palletBody.getElementsByTagName("img")[0].classList.remove("none");

            for(i=0;i<this.details_eles.length;i++){//oneblockにmousedownイベント解除
                let n = this.details_eles[i].className;
                if(n=="oneblock"){
                    this.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
                    this.details_eles[i].addEventListener("click",this.falseContentEditable);
                    this.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_flash);
                    this.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_flash);
                    this.details_eles[i].removeEventListener("click",this.click_insert_ele);
                }
            }
        }.bind(this);
        //penアイコンに付与させるclickイベントハンドラ。editモードへ移行する Main
        this.transitionEditMode = function(){
            if(!this.webnote_main_frame.classList.contains("edit_mode")){//もしwebnote_main_frameのクラスにedit_modeがないなら
                this.webnote_main_frame.classList.add("edit_mode");
                palletManagement.pallet.classList.remove("none");
                
                this.webnoteStartup();//webnoteの編集準備をする
            }
        }.bind(this);

        //マウスダウンされた要素(e.currentTarget)をselect_contenteditable_eleに格納する関数(mousedownイベントハンドラ) Main
        this.falseContentEditable = function(e){
            e.stopPropagation();
            this.select_contenteditable_ele = e.currentTarget;
            //this.select_range = window.getSelection().getRangeAt(0);
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
            palletManagement.palletDel.getElementsByTagName("a")[0].classList.add("none");
            palletManagement.palletDel.getElementsByTagName("img")[0].classList.remove("none");
            /*
            if(e.currentTarget.classList.contains("word_table")){//もし消そうとクリックした要素のclassにword_tableが含まれていたら
                this.deleteEditWord_table(e.currentTarget);
            }*/
            e.currentTarget.classList.remove("redfrash");//赤発光を消す
            e.currentTarget.remove();//選択した要素を消す

            for(i=0;i<this.details_eles.length;i++){//oneblockにdel系イベント解除
                let n = this.details_eles[i].className;
                if(n=="oneblock"){
                    this.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
                    this.details_eles[i].addEventListener("click",this.falseContentEditable);
                    this.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_red);
                    this.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_red);
                    this.details_eles[i].removeEventListener("click",this.click_del_ele);
                }
            }
        }.bind(this);
        
        // edicon内のアイコンをクリックしたとき用のイベントハンドラ
        this.iconInEdicon_clickhandler = function(e){
            const edicon = e.currentTarget.parentNode;
            const markup_icon = edicon.querySelector(".markup_icon");
            const look_icon = edicon.querySelector(".look_icon");
            const oneblock = edicon.parentNode;
            const flex_textarea = oneblock.querySelector(".flex_textarea");
            const look = oneblock.querySelector(".look");
            this.toggle_iconInEdicon(markup_icon,look_icon,flex_textarea,look);
            if(!flex_textarea.classList.contains("none")){
                real = flex_textarea.querySelector(".flex_textarea_real");
                //real.focus();//flex_textarea_realをフォーカスする これがあると謎スクロールを起こす
            }
        }.bind(this);
    }
}






const palletManagement = {
    edit_id: 0,//pallet内の要素の番号
    init: function(){
        this.setParameters();//エディットパレットに関する変数の初期化
        this.defEventHandler();//イベントハンドラを宣言

        //ブロックに関連したパレット内要素(h1,本文,h2,nest,表、del)にclickイベントを付与する
        /*
        for(i=0;i<this.block_pallet_num;i++){
            this.pallet_item[i].addEventListener("click",this.editProcessing_block);
        }*/
        this.palletMark.addEventListener("click",this.onClickMarkPallet);
        this.palletLook.addEventListener("click",this.onClickLookPallet);
        this.palletBody.addEventListener("click",this.editProcessing_block);
        this.palletDel.addEventListener("click",this.editProcessing_block);
        this.palletTable.addEventListener("click",this.onClickTablePallet);
        //finボタンクリックしたときに、editモード解除するイベントを追加する
        this.fin_but.addEventListener("click",this.release_edit_event);

        //table_rangeにイベント付与
        this.table_range.addEventListener("mouseover",this.mouseover_tableflash);//table_rangeをmouseoverしたときのイベント関数としてmouseover_tableflashを登録
        this.table_range.addEventListener("mouseout",this.mouseout_resetTableFlash);//table_rangeをmouseoutしたときのイベント関数としてreset_tableflash関数を登録する
        this.table_range.addEventListener("click",this.click_table_add);//table_rangeをclickしたときのイベント関数としてclick_table_add関数を登録する

        //パレット要素の画像要素にclickイベントを付与する
        this.palletImg.addEventListener("click",this.onClickImgPallet);
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
        this.palletLink.addEventListener("click",this.onClickLinkPallet);
        //this.palletLink.addEventListener("mousedown",this.getBlockCaratPosition);

        //this.link_popup.addEventListener("mouseenter",this.getBlockCaratPosition);
        // リンクポップアップのxボタンをクリックしたときのイベントハンドラを登録
        this.link_popup_del_btn.addEventListener("click",this.deleteLinkPopup);
        // リンクポップアップのsubmitボタンをクリックしたときのイベントハンドラを登録
        this.link_submit_btn.addEventListener("click",this.insertLinkText);
        //this.link_submit_btn.addEventListener("mousedown",this.getBlockCaratPosition);

        // windowにリサイズハンドラを付与する
        window.addEventListener("resize",() => {
            this.palletTable.getElementsByTagName("a")[0].classList.add("none");//xを消す
            this.palletTable.getElementsByTagName("img")[0].classList.remove("none");//tableアイコンを表示
            this.table_popup.classList.add("none");//tableポップアップを非表示
            this.palletImg.getElementsByTagName("a")[0].classList.add("none");//xを消す
            this.palletImg.getElementsByTagName("img")[0].classList.remove("none");//imgアイコンを表示
            this.img_popup.classList.add("none")//画像入力ブロックを非表示
            //this.deleteJustifiPopup();
        })
    },
    setParameters: function(){
        this.pallet = document.getElementById("pallet");
        this.pallet_item = document.getElementsByClassName("pallet_item");//pallet_itemを取得
        this.block_pallet_num = 2;
        this.block_addPallet_num = 1;
        //pallet_itemに付けられるタイトルを定義
        this.palletMark_title="markup";this.palletLook_title="look";
        this.palletBody_title="本文";this.palletDel_title="del";
        this.palletTable_title="表";this.palletImg_title = "画像";this.palletLink_title = "link";
        //pallet_titleとタイトルが一致する要素を対応する変数に格納
        for(i=0;i<this.pallet_item.length;i++){
            switch(this.pallet_item[i].title){
                case this.palletLook_title:
                    this.palletLook = this.pallet_item[i];
                    break;
                case this.palletMark_title:
                    this.palletMark = this.pallet_item[i];
                    break;
                case this.palletBody_title:
                    this.palletBody = this.pallet_item[i];
                    break;
                case this.palletDel_title:
                    this.palletDel = this.pallet_item[i];
                    break;
                case this.palletTable_title:
                    this.palletTable = this.pallet_item[i];
                    break;
                case this.palletImg_title:
                    this.palletImg = this.pallet_item[i];
                    break;
                case this.palletLink_title:
                    this.palletLink = this.pallet_item[i];
                    break;
            }
        }

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

        //this.justifi = document.getElementById("justifi");
        //this.justifi_intLinks = this.justifi.getElementsByClassName("intLink");
    },
    //edit_idから追加する要素を判定し、要素を作成する　clickイベント関数で使われる関数 pallet
    judg_create_ele: function(){
        /*--------------------------------------------*/
        let ele;
        if(this.edit_id == this.palletBody_title){
            ele = document.createElement("div");
            //ele.textContent = "oneblock";
            ele.classList.add("oneblock");
            ele.innerHTML = 
            '<div class="edicon"><div class="markup_icon none"><img src="/img/pallet_icon/markup.png"></div><div class="look_icon"><img src="/img/pallet_icon/look_b.png"></div></div>'+
            '<div class="textblock"><div class="flex_textarea"><div class="flex_textarea_dummy" aria-hidden="true">## oneblock</div><textarea class="flex_textarea_real">## oneblock</textarea></div><div class="look none"></div></div>'
            EditManagement.oneblockSetup(ele);//oneblockをセットアップする

        }
        /*--------------------------------------------*/
        ele.querySelector(".flex_textarea_real").disabled = true;
        ele.addEventListener("mouseover",EditTool.mouseover_flash);
        ele.addEventListener("mouseout",EditTool.mouseout_flash);
        ele.addEventListener("click",EditManagement.click_insert_ele);
        //ele.addEventListener("paste",EditManagement.pasteStyleMatch);
        return(ele);
    },
    //パレットの子要素をリセットする
    clean_palletfunc: function(){
        //this.img_popup.classList.add("none");
        this.deleteImgPopup();//画像ポップアップを隠す
        this.deleteLinkPopup();//linkポップアップを隠す
        //this.deleteJustifiPopup();//段落ポップアップを隠す
        this.table_popup.classList.add("none");//表ポップアップを隠す
        for(i=0;i<this.pallet_item.length-1;i++){//テキストコンテントのxを元に戻す
            if(!this.pallet_item[i].getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているなら
                this.pallet_item[i].getElementsByTagName("a")[0].classList.add("none");//xを消す
                this.pallet_item[i].getElementsByTagName("img")[0].classList.remove("none");//アイコンを表示させる
                break;
            }
        }
    },

    // 表パレットに関する処理
    //tableポップアップを表示するメソッド
    appearTablePopup: function(){
        rect=this.palletTable.getBoundingClientRect();//pallet要素内にあるtable要素のページ内での位置を取得
        this.table_popup.style.left = rect.left + "px";//位置leftの値でtableポップアップのleft属性の値を変える
        this.table_popup.classList.remove("none");//tableポップアップを表示させる
    },
    //tableポップアップを非表示にするメソッド
    deleteTablePopup: function(){
        this.table_popup.classList.add("none");
        this.palletTable.getElementsByTagName("a")[0].classList.add("none");
        this.palletTable.getElementsByTagName("img")[0].classList.remove("none");//アイコンを表示させる
    },
    //table_rangeの全ての行要素(t_col)のsqu要素に対してclass属性値flashtable_iconを削除する
    reset_tableflash: function(){
        for(i=0;i<this.t_rows.length;i++){//全ての行を網羅する
            c = this.t_rows[i].children;
            for(j=0;j<c.length;j++){
                c[j].children[0].classList.remove("flashtable_icon");
            }
        }
        this.select_row = 0; this.select_col = 0;
        //console.log("行数"+select_row+"と列数"+select_col);
    },
    //要素eleのsqu要素にclass属性値flashtable_iconを追加する。
    tableflash: function(ele){
        ele.children[0].classList.add("flashtable_icon");
    },

    //画像パレット
    //画像入力ボックスを出現する際に行うメソッド
    appearImgPopup: function(){
        rect = this.palletImg.getBoundingClientRect();//pallet要素内にあるtable要素の、ページ内での位置を取得
        if(window.innerWidth >= 525){
            this.img_popup.style.left = (rect.left - 301.8515625) + "px";
        }else{
            this.img_popup.style.left = "";
        }
        this.img_popup.classList.remove("none");//画像入力ボックスを出現させる
    },
    //挿入する画像を生成
    createImage: function(imgsrc) {
        width = parseFloat(window.getComputedStyle(EditManagement.details_mean_box).width);
        const elImage = new Image();
        elImage.src = imgsrc;
        elImage.classList.add('img_block');
        if(this.imgw_select.value!="auto"){
            elImage.style.width = this.imgw_select.value;
            width = width * (this.imgw_select.value.split("%")[0] / 100);//
        }
        height = width * (elImage.naturalHeight/elImage.naturalWidth);//画像のheightの計算値
        img_text = '<img src="'+imgsrc+'" width="'+this.imgw_select.value+'">';//コピーするimgテキスト
        let kaigyou_num = parseInt(height / 20);//画像のheightに合わせた改行の数
        for(i=0;i<kaigyou_num-1;i++){
            img_text += "\n";//改行を挿入
        }
        return img_text;
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
                img_item.addEventListener("mouseover",this.mouseoverImgItem);//img_itemをmouseoverしたとき画像を表示
                img_item.addEventListener("mouseout",this.mouseoutImgItem);//img_itemをmouseoutしたとき画像を削除
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
    appearLinkPopup: function(){
        rect = this.palletLink.getBoundingClientRect();//pallet要素内にあるlink要素の、ページ内での位置を取得
        this.link_popup.style.left = rect.left - 70 + "px";
        this.link_popup.classList.remove("none");//画像入力ボックスを出現させる
        this.link_textarea[0].focus();//link_textをフォーカスする
    },

    defEventHandler: function(){
        // palletMarkのクリックイベントハンドラ
        this.onClickMarkPallet = function(e){
            Array.prototype.forEach.call(EditManagement.details_eles,function(element){
                markup_icon = element.querySelector(".markup_icon");
                look_icon = element.querySelector(".look_icon");
                flex_textarea = element.querySelector(".flex_textarea");
                look = element.querySelector(".look");
                EditManagement.visible_textarea(markup_icon,look_icon,flex_textarea,look);
            });
        }.bind(this),
        // palletLookのクリックイベントハンドラ
        this.onClickLookPallet = function(e){
            Array.prototype.forEach.call(EditManagement.details_eles,function(element){
                markup_icon = element.querySelector(".markup_icon");
                look_icon = element.querySelector(".look_icon");
                flex_textarea = element.querySelector(".flex_textarea");
                look = element.querySelector(".look");
                if(!look_icon.classList.contains("none")){
                    EditManagement.visible_look(markup_icon,look_icon,flex_textarea,look);
                }
            });
        }.bind(this),

        //ブロックに関連するpalletをクリックしたときに行う関数(clickイベント関数) pallet
        this.editProcessing_block = function(e){
            if(!e.currentTarget.getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているとき
                e.currentTarget.getElementsByTagName("a")[0].classList.add("none");
                e.currentTarget.getElementsByTagName("img")[0].classList.remove("none");//アイコンを表示させる
                console.log(e.currentTarget.title);
                for(i=0;i<EditManagement.details_eles.length;i++){//oneblockにinsert系イベント解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="oneblock"){//"x"ボタンを押したら、強制的にブロック要素を編集可能にする
                        if(e.currentTarget.title == this.palletDel_title){//クリックしたのがパレットのdel要素ならば、
                            EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
                            EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);
                            EditManagement.details_eles[i].removeEventListener("mouseover",EditTool.mouseover_red);
                            EditManagement.details_eles[i].removeEventListener("mouseout",EditTool.mouseout_red);
                            EditManagement.details_eles[i].removeEventListener("click",EditManagement.click_del_ele);
                        }else{//それ以外のパレット内の要素なら
                            EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
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
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//oneblockにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="oneblock"){
                        EditManagement.clean_eventfunc(i);
                        //delの場合は、del用のイベントを登録
                        if(this.edit_id == this.palletDel_title){
                            EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = true;
                            EditManagement.details_eles[i].addEventListener("mouseover",EditTool.mouseover_red);
                            EditManagement.details_eles[i].addEventListener("mouseout",EditTool.mouseout_red);
                            EditManagement.details_eles[i].addEventListener("click",EditManagement.click_del_ele);
                        }else{
                            EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = true;
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
            EditManagement.sentence.contentEditable = "false";//クラスsentenceの要素を編集不可にする
            //detaile_mean_boxの子要素に付与されたあらゆるイベントを解除
            for(i=0;i<EditManagement.details_eles.length;i++){
                let n = EditManagement.details_eles[i].className;
                if(n=="oneblock"){
                    EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = true;
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
            EditManagement.webnoteShutdown();//編集を終了するときに実施する処理
        }.bind(this);

        // palletTableのクリックイベントハンドラ
        this.onClickTablePallet = function(e){
            if(!e.currentTarget.getElementsByTagName("a")[0].classList.contains("none")){//"x"が表示されているとき
                this.deleteTablePopup();//tableポップアップを消す
            }else{
                //palletをリセット
                this.clean_palletfunc();
                this.appearTablePopup();//tableポップアップを表示させる
                this.edit_id = e.currentTarget.title;
                console.log(this.edit_id);
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//oneblockにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="oneblock"){
                        EditManagement.clean_eventfunc(i);
                        EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
                        EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);
                    }
                }
            }
        }.bind(this),
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
                let i = 1;//このiは別の行要素の列要素(squ要素)を青く光らせるのに必要になる
                //次に、その列要素より前の列要素(squ要素)を全て青く光らせる。
                while(origin.previousElementSibling!=null){
                    origin = origin.previousElementSibling;
                    this.tableflash(origin);
                    i++;
                }
                this.select_col = i;//click時に使用
                //初めに得られた行要素よりも全ての前の行要素に対して、添字i以下の列要素(squ要素)を青く光らせる
                let p = 1;//行を数えるための変数
                while(origin_parent.previousElementSibling!=null){
                    origin_parent = origin_parent.previousElementSibling;
                    for(j=0;j<this.select_col;j++){
                        this.tableflash(origin_parent.children[j]);
                    }
                    p++;
                }
                this.select_row = p;//click時に使用
                //console.log("行数"+select_row+"と列数"+select_col);
            }
        }.bind(this);
        //table_rangeをclickしたときにtableポップアップを消し、markdown表テキストを生成しクリップボードにコピーするイベント関数 pallet
        this.click_table_add = function(e){
            if(this.select_row>0&&this.select_col>0){//行と列が1以上なら
                let head_text = "|";
                let head_margin_text = "|";
                for(j=0;j<this.select_col;j++){
                    head_text+=" Column"+(j+1)+" |";
                    head_margin_text+=" -------- |";
                }
                let table_text = head_text+"\n"+head_margin_text;
                for(i=0;i<this.select_row;i++){
                    table_text+="\n|";
                    for(j=0;j<this.select_col;j++){
                        table_text+="  |";
                    }
                }
                navigator.clipboard.writeText(table_text);//クリップボードにコピー
                this.clean_palletfunc();//palletの表示を元に戻す
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
                this.appearImgPopup();//画像入力ボックスの位置をきめ、出現させる
                this.edit_id = e.currentTarget.title;
                console.log(this.edit_id);
                //e.currentTarget.textContent = "x";//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//oneblockにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="oneblock"){
                        EditManagement.clean_eventfunc(i);//あらゆるイベント関数を解除する
                        EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
                        EditManagement.details_eles[i].addEventListener("click",EditManagement.falseContentEditable);//マウスダウン時にその要素を編集可能にする関数を追加
                    }
                }
                this.renderPictures()//画像一覧を取りに行く
            }
        }.bind(this);
        // 画像を指定のブロック内に追加するclickイベントハンドラ
        this.clickImgItem = function(e){
            //EditManagement.select_contenteditable_ele.focus();
            //const range = document.getSelection().getRangeAt(0).cloneRange();//範囲オブジェクトを複製生成
            const imgsrc = "/img/" + e.currentTarget.textContent;//画像までのパスを生成
            const img_text = this.createImage(imgsrc);//クリックした要素を元に挿入する画像を生成
            navigator.clipboard.writeText(img_text);//クリップボードにコピー
        }.bind(this);
        // imglistのitemをmouseoverしたとき、画像を表示するイベントハンドラ
        this.mouseoverImgItem = function(e){
            const img_preview = document.getElementById("img_preview");
            const path = e.currentTarget.textContent;
            img_preview.classList.remove("none");
            const img = img_preview.querySelector("img");
            img_preview.querySelector("img").src = "/img/"+path;//srcに設定
        }.bind(this);
        // imglistのitemをmouseoutしたとき、画像を削除するイベントハンドラ
        this.mouseoutImgItem = function(e){
            const img_preview = document.getElementById("img_preview");
            img_preview.classList.add("none");
            img_preview.src = "";//srcは空文字
        }
        //画像ポップアップを削除する関数
        this.deleteImgPopup = function(){
            this.img_popup.classList.add("none");//画像ポップアップを隠す
            //this.pallet_item[6].textContent = this.pallet_item[6].title;
            this.palletImg.getElementsByTagName("a")[0].classList.add("none");//パレット要素の画像要素の"x"を隠す
            this.palletImg.getElementsByTagName("img")[0].classList.remove("none");//パレット要素の画像要素のアイコンを表示する
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
                this.appearLinkPopup();//画像入力ボックスの位置をきめ、出現させる
                this.edit_id = e.currentTarget.title;
                console.log(this.edit_id);
                e.currentTarget.getElementsByTagName("a")[0].classList.remove("none");//クリックしたpalletアイテムのテキストコンテントをxに変える
                e.currentTarget.getElementsByTagName("img")[0].classList.add("none");//アイコンを消す
                
                for(i=0;i<EditManagement.details_eles.length;i++){//oneblockにinsert系イベント追加し、del系イベントを解除
                    let n = EditManagement.details_eles[i].className;//クラスネームを格納
                    if(n=="oneblock"){
                        EditManagement.clean_eventfunc(i);//あらゆるイベント関数を解除する
                        EditManagement.details_eles[i].querySelector(".flex_textarea_real").disabled = false;
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
                if(n=="oneblock"){
                    EditManagement.select_range = range;
                }
            }
        }.bind(this);
        // リンクポップアップのsubmitボタンに付与するイベントハンドラ ブロックにリンクテキストを挿入する
        this.insertLinkText = function(){
            let link_text = "";
            if(this.link_textarea[0].value==""&&this.link_textarea[1].value==""){//もし表示テキストとリンクするurlが入力されていなかったら
                return false;
            }else if(this.link_textarea[0].value==""){
                link_text += "["+this.link_textarea[1].value+"]("+this.link_textarea[1].value+")";
            }else{
                link_text += "["+this.link_textarea[0].value+"]("+this.link_textarea[1].value+")";
            }
            navigator.clipboard.writeText(link_text);//クリップボードにコピー
            this.deleteLinkPopup();
        }.bind(this);
        //リンクポップアップを削除する関数
        this.deleteLinkPopup = function(){
            this.link_popup.classList.add("none");//画像ポップアップを隠す
            this.palletLink.getElementsByTagName("a")[0].classList.add("none");//パレット要素のリンク要素の"x"を隠す
            this.palletLink.getElementsByTagName("img")[0].classList.remove("none");//パレット要素のリンク要素のアイコンを表示する
        }.bind(this);
    }
}

//markdownを行うmarkedオブジェクトのメソッドを編集する関数
function set_marked(){
    // Override function
    const renderer = {
        //pタグの編集
        paragraph(text){
            const regex = [/^:c?i[0-9]\s/,/^:c(i[0-9])?\s/];
            style_text = "";stylef_text = "";indent_text = "";r_text = text;
            //もし文頭に:in があればnの値だけインデントする ※nは0~9のいずれかの値
            if(text.search(regex[0])!=-1){
                opt_text = text.match(regex[0])[0];
                indent_num = parseInt(opt_text.match(/[0-9]/)[0]);
                r_text = text.replace(regex[0],"");
                style_text = " style='";
                stylef_text = "'";
                indent_text = "padding-left:"+indent_num*26+"px;";
            }
            align_text = "";
            //もし文頭に:c があれば中央に配置
            if(text.search(regex[1])!=-1){
                console.log("true");
                r_text = text.replace(regex[1],"");
                style_text = " style='";
                stylef_text = "'";
                align_text = "text-align:center;";
            }
            return("<p"+style_text + indent_text + align_text + stylef_text+">"+r_text+"</p>")
        }
    };
    marked.use({ renderer });
}

// memoryノート用の設定に変更するメソッド
function switch_memoryNote(){
    EditManagement.save_path = "/save/memory_article";
    console.log(EditManagement.save_path);
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

set_marked()// markedオブジェクトの設定をする
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

/*--------------------------------------------*/
//テキスト編集命令関数
function formatDoc(sCmd, sValue) {
    document.execCommand(sCmd, false, sValue);
    //select_contenteditable_ele.focus();//選択している要素にフォーカスする
}
//キーを押したときの処理
function key_down_func(e){
    //console.log(e.key);
    //console.log(e.ctrlKey);
    /*
    if(e.metaKey === true){
        if(e.key === 'u' || e.key === 'U'){
            //UキーとCommandが同時に押された時の処理
            formatDoc("Underline");//編集可能な要素のテキストを範囲選択している場合、そのテキストにアンダーラインを引く
            console.log("underline");
        }
	}*/
    if(e.ctrlKey === true){
        if(e.key === 'q'){
            //qキーとControlが同時に押された時の処理
            if(!EditManagement.select_contenteditable_ele) return false;
            const edicon = EditManagement.select_contenteditable_ele.querySelector(".edicon");
            const markup_icon = edicon.querySelector(".markup_icon");
            const look_icon = edicon.querySelector(".look_icon");
            if(!markup_icon.classList.contains("none")){
                markup_icon.click();
            }else if(!look_icon.classList.contains("none")){
                look_icon.click();
            }
        }
	}
	return false;
}
document.addEventListener('keydown', key_down_func);

let ltoken = 45;
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