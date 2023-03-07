const loginFormManagement = {
    init: function(){
        this.setParameters();//変数の初期化
        this.defEventHandler();//イベントハンドラ定義

        this.button_input.addEventListener("click",this.loginSend);//送信ボタンにクリックイベントハンドラを登録
    },
    setParameters: function(){
        this.message = document.getElementsByTagName("p")[0];
        this.login_form = document.getElementById("login_form");
        this.login_inputs = this.login_form.getElementsByTagName("input");
        this.id_input = this.login_inputs[0];
        this.pass_input = this.login_inputs[1];
        this.button_input = this.login_inputs[2];
    },
    defEventHandler: function(){
        this.loginSend = function(e){
            e.preventDefault();// デフォルトの処理を無効化
            const data = {id:this.id_input.value, password:this.pass_input.value};
            fetch("/login",{
                method: 'POST', // or 'PUT'
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(jsondata => {
                console.log(jsondata);
                if(jsondata["result"]){
                    new_url = new URL(window.location.href).origin + jsondata["url"];//サーバから送られてきたurlに移動
                    if(document.referrer != ""){//リファラーにURLがあった場合、
                        const referrer_fqdn = new URL(document.referrer).hostname;// URLからfqdnを取得
                        if(referrer_fqdn == window.location.hostname){//もしリファラーのfqdnがログインページのfqdnと同じだった場合、
                            new_url = document.referrer;//リファラーを新しいurlにする
                        }
                    }
                    location.href = new_url;//ページに遷移させる
                }else{
                    this.message.textContent = "IDまたはPasswordが違います"
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }.bind(this);
    }
}

loginFormManagement.init();