$(function() {
    //=========================初始化====================================
    var $window = $(window);
    var $messageArea = $('#messageArea');       // 消息显示的区域
    var $inputArea = $('#inputArea');           // 输入消息的区域
    $inputArea.focus();  // 首先聚焦到输入框
    var connected = false;                      // 用来判断是否连接的标志

    // 通过一个hash函数得到用户名的颜色
    function getUsernameColor (username) {
        var COLORS = [
            '#e21400', '#91580f', '#f8a700', '#f78b00',
            '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
            '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
        ];
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // 初始化显示的名字颜色
    var nameColor = getUsernameColor( $("#name").text());
    $("#name").css('color', nameColor);

    Date.prototype.format = function (fmt) { // author: meizz
        var o = {
            "M+": this.getMonth() + 1, // 月份
            "d+": this.getDate(), // 日
            "h+": this.getHours(), // 小时
            "m+": this.getMinutes(), // 分
            "s+": this.getSeconds(), // 秒
            "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
            "S": this.getMilliseconds() // 毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };

    //====================webSocket连接======================
    // 创建一个webSocket连接
    var socket = new WebSocket('ws://'+window.location.host+'/chatRoom/WS?name=' + $('#name').text() + '&rand=' + $('#rand').val());

    // 当webSocket连接成功的回调函数
    socket.onopen = function () {
        console.log("webSocket open");
        connected = true;
    };

    // 断开webSocket连接的回调函数
    socket.onclose = function () {
        console.log("webSocket close");
        connected = false;
    };

    //=======================接收消息并显示===========================
    // 接受webSocket连接中，来自服务端的消息
    socket.onmessage = function(event) {
        // 将服务端发送来的消息进行json解析
        var data = JSON.parse(event.data);
        console.log("revice:" , data);

        var name = data.name;
        var type = data.type;
        var msg = data.message;
        var r = data.random

        // type为0表示有人发消息
        var $messageDiv;
        // var $rand = $('#rand').val()
        if (type == 0) {
            var $useravatar = $('<img height="70px" style="margin-right: 10px;margin-bottom: 37px" src="/static/img/avatar/avatar%20(' + r + ').png"/>');
            if (name === 'gao' || name === 'Gao') {
                $useravatar = $('<img height="70px" style="margin-right: 10px;margin-bottom: 37px" src="/static/img/icon.png"/>');
            }
            var $usernameDiv = $('<span style="margin-right: 15px;font-weight: 700;overflow: hidden;text-align: right;"/>')
                    .text(name);
            if (name == $("#name").text()) {
                $usernameDiv.css('color', nameColor);
            } else {
                $usernameDiv.css('color', getUsernameColor(name));
            }
            var $usernamemsg = $('<div style="display: inline-block"/>');
            var $messageBodyDiv = "";
            if (name === $("#name").text()) {
                $messageBodyDiv = $('<div class="msg msg_mine"/>')
                    .text(msg);
            } else {
                $messageBodyDiv = $('<div class="msg msg_other"/>')
                    .text(msg);
            }
            var $username = $('<div class="msg_username"/>').text(name + "　" + new Date().format("hh:mm:ss"))
            $usernamemsg.append($username, $messageBodyDiv)

            $messageDiv = $('<li style="list-style-type:none;font-size:20px;margin-bottom: -30px"/>')
                    .data('username', name)
                    // .append($usernameDiv, $messageBodyDiv);
                    .append($useravatar, $usernamemsg);
        }
        // type为1或2表示有人加入或退出
        else {
            var $messageBodyDiv = $('<span style="color:#999999;">')
                    .text(msg + "　" + new Date().format("yyyy-MM-dd hh:mm:ss"));
            $messageDiv = $('<li style="list-style-type:none;font-size:15px;text-align:center;"/>')
                    .append($messageBodyDiv);
        }

        $messageArea.append($messageDiv);
        $messageArea[0].scrollTop = $messageArea[0].scrollHeight;   // 让屏幕滚动
    }

    //========================发送消息==========================
    // 当回车键敲下
    $window.keydown(function (event) {
        // 13是回车的键位
        if (event.which === 13) {
            sendMessage();
            typing = false;
        }
    });

    // 发送按钮点击事件
    $("#sendBtn").click(function () {
        sendMessage();
    });

    $(document).on('click', '#re_send', function() {
        var inputMessage = $inputArea.val();
        if (inputMessage) {
            sendToSocket(inputMessage);
            $('#myModal').modal('hide');
        }
        return 0;
    });

    // 通过webSocket发送消息到服务端
    function sendMessage () {
        var inputMessage = $inputArea.val();  // 获取输入框的值

        const predictUrl = "http://aoi.naist.jp/predict";
        var $data = JSON.stringify({"text":inputMessage});

        if (inputMessage) {
            $.ajax({
                type: "POST",
                url: predictUrl,
                contentType: "application/json;charset=utf-8",
                data: $data,
                dataType: "json",
                async: false,
                success:function (message) {
                    if (message.result === "Offensive") {
                        // alert("Offensive");
                        $('#myModal').modal('show');
                        $('#myModal').on('hidden.bs.modal', function (e) {
                            $inputArea.focus();
                        })
                    } else {
                        sendToSocket(inputMessage);
                    }
                },
                error:function (message) {
                    alert("fail: " + message);
                }
            });
        }
    }

    function sendToSocket(inputMessage) {
        if (inputMessage && connected) {
            $inputArea.val('');      // 清空输入框的值
            socket.send(inputMessage);  // 基于WebSocket连接发送消息
            console.log("send message:" + inputMessage);
        }
    }
});
