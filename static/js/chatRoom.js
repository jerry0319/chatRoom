var player = null;

$(function () {
    //=========================初始化====================================
    var $window = $(window);
    var $messageArea = $('#messageArea');       // 消息显示的区域
    var $inputArea = $('#inputArea');           // 输入消息的区域
    var connected = false;                      // 用来判断是否连接的标志
    var prodPath = $('#prodPath').val();
    var allow_send = 0;
    var requestUrl = "http://aoi.naist.jp/";
    // if (prodPath === '') {
    //     requestUrl = "http://127.0.0.1:8091/";
    // }

    function live_size() {
        var live_width = $window.width() * (7 / 12) - 30;
        var live_height = live_width / 4 * 3
        init_streams(live_width, live_height,player);
    }
    live_size();

    function init_live2d() {
        L2Dwidget.init({
            "model": {
                jsonPath: "https://unpkg.com/live2d-widget-model-wanko@1.0.5/assets/wanko.model.json",
                "scale": 1
            },
            "display": {
                "position": "right",
                "width": 150,
                "height": 300,
                "hOffset": 0,
                "vOffset": -100
            },
            "mobile": {
                "show": true,
                "scale": 0.5
            },
            "react": {
                "opacityDefault": 1,
                "opacityOnHover": 1
            }
        });
    }

    // init_live2d();

    // 在线用户列表
    // $("#usersModal").modal({backdrop: "static", keyboard: false});
    $("#onlineList").click(function () {
        $("#usersModal").modal('toggle');
    });

    $('#usersModal').on('shown.bs.modal', function (e) {
        $(document).off('focusin.modal');
    })

    function position(dom) {
        dom.css({
            left: ($window.width() - dom.outerWidth()) - 30
        });
    }

    function modalHeight() {
        var modalHeight = $window.height() / 2
        $("#usersModal").css({
            height: modalHeight
        });
        $("#usersModal .modal-body").css({
            height: modalHeight - 100
        });
    }

    position($("#usersModal"));
    modalHeight();

    // 行为选择按钮
    var activeButton = "sendBtn4";
    var activeType = 4;
    $("#modeSelect").on('shown.bs.dropdown', function () {
        $("#" + activeButton).addClass("active");
        $("#live2d-widget").hide();
        $("#wankoModal").hide();
    });

    $("#modeSelect").on('hide.bs.dropdown', function () {
        if (activeType === 4) {
            $("#live2d-widget").show();
        }
    });

    if (activeType === 4) {
        init_live2d();
    }

    // $('#dropDown').trigger("click");
    $inputArea.focus();  // 首先聚焦到输入框


    $(".dropdown-item").on('click', function () {
        $("#" + activeButton).removeClass("active");
        $(this).addClass("active")
        activeButton = $(this).attr("id");
        activeType = parseInt(activeButton.substr(activeButton.length - 1, 1));
        if (activeType === 4) {
            if ($("#live2d-widget").length > 0) {
                $("#live2d-widget").show();
            } else {
                init_live2d();
            }
        } else {
            if ($("#live2d-widget").length > 0) {
                $("#live2d-widget").hide();
            }
        }
        $inputArea.focus();
        currentModeAlert();
    });

    function currentModeAlert() {
        var alertMsg = $("#" + activeButton).text();
        $("#currentMode").text(alertMsg);
    }
    currentModeAlert();

    // wanko modal
    $("#test").click(function () {
       $("#wankoModal").modal('toggle');
    });

    $('#wankoModal').on('shown.bs.modal', function (e) {
        $(document).off('focusin.modal');
    });

    function positionWanko(dom) {
        dom.css({
            left: ($window.width() - dom.outerWidth()) - 30,
            top: ($window.height() - dom.outerWidth()) - 20
        });
    }

    positionWanko($("#wankoModal"));

    function stream_size() {
        $(".fixed-bottom").css({"left": $window.width() * (7 / 12)});
    }

    stream_size();

    $(window).resize(function(){
        position($("#usersModal"));
        positionWanko($("#wankoModal"));
        modalHeight();
        // live_size();
        stream_size();
    });

    // 通过一个hash函数得到用户名的颜色
    function getUsernameColor(username) {
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
    var nameColor = getUsernameColor($("#name").text());
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
    var socket = new WebSocket('ws://' + window.location.host + '/chatRoom/WS?name=' + $('#name').text() + '&rand=' + $('#rand').val());

    var timerID = 0;

    function keepAlive() {
        var timeout = 60000;
        if (socket.readyState === socket.OPEN) {
            socket.send("PING");
        }
        timerID = setTimeout(keepAlive, timeout);
    }

    function cancelKeepAlive() {
        if (timerID) {
            clearTimeout(timerID);
        }
    }

    // 当webSocket连接成功的回调函数
    socket.onopen = function () {
        console.log("webSocket open");
        connected = true;
        keepAlive();
    };

    // 断开webSocket连接的回调函数
    socket.onclose = function () {
        cancelKeepAlive();
        console.log("webSocket close");
        connected = false;
    };

    //=======================接收消息并显示===========================
    var $messageDiv;

    function extend_message(r, name, msg, type) {
        if (type === 0) {
            var $useravatar = $('<img height="70px" style="margin-right: 10px;margin-bottom: 37px" src="' + prodPath + '/static/img/avatar/avatar%20(' + r + ').png"/>');
            if (name === 'gao' || name === 'Gao') {
                $useravatar = $('<img height="70px" style="margin-right: 10px;margin-bottom: 37px" src="' + prodPath + '/static/img/icon.png"/>');
            }
            var $usernameDiv = $('<span style="margin-right: 15px;font-weight: 700;overflow: hidden;text-align: right;"/>')
                .text(name);
            if (name === $("#name").text()) {
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
            var noti_width = $window.width() * (5 / 12)
            var $messageBodyDiv = $('<p style="color:#999999;">')
                .text(msg + "　" + new Date().format("yyyy-MM-dd hh:mm:ss"));
            $messageDiv = $('<li class="notification" style="list-style-type:none;font-size:15px;margin-left:-40px;margin-bottom:20px;width:'+noti_width+'px;text-align:center;"/>')
                .append($messageBodyDiv);
        }

        $messageArea.append($messageDiv);
        $messageArea[0].scrollTop = $messageArea[0].scrollHeight;   // 让屏幕滚动

    }

    function onlineUserList(data) {
        data = JSON.parse(data)
        for (var x in data) {
            var $useravatar = $('<img height="50px" style="margin-right: 10px;" src="' + prodPath + '/static/img/avatar/avatar%20(' + data[x].rand + ').png"/>');
            if ($("#name").text() === 'gao' || $("#name").text() === 'Gao') {
                $useravatar = $('<img height="50px" style="margin-right: 10px;" src="' + prodPath + '/static/img/icon.png"/>');
            }
            var $strongname = $('<strong>').text(data[x].name);
             var $username = $('<span style="display: block;margin-left: 55px;margin-top: -37px;font-size:15px;word-wrap:break-word;word-break:break-all;">').append($strongname);
            var $userdiv = $('<div/>').append($useravatar, $username)
            var $userDiv = $('<li style="list-style-type:none;font-size:15px;height: 50px"/>')
                .append($userdiv);
            $('#userListArea').append($userDiv)
        }
    }

// 接受webSocket连接中，来自服务端的消息
    socket.onmessage = function (event) {
        // 将服务端发送来的消息进行json解析
        var data = JSON.parse(event.data);
        var type = data.type;
        if (type !== 3) {
            if (type !== 0) {
                $.get("/chatRoom/getOnlineList", function (data) {
                    $('#userListArea').find("li").remove();
                    onlineUserList(data);
                })
            }
            console.log("revice:", data);
            var name = data.name;
            var msg = data.message;
            var r = data.random;

            // type为0表示有人发消息
            // var $rand = $('#rand').val()
            extend_message(r, name, msg, type);
        }
    }

    //========================发送消息==========================
    // 当回车键敲下
    $window.keydown(function (event) {
        // 13是回车的键位
        if (event.which === 13) {
            sendMessage(activeType);
            typing = false;
            // $("#wankoModal").modal("hide");
        }
    });

    // 发送按钮点击事件
    // $("#sendBtn1").click(function () {
    //     sendMessage(1);
    // });
    //
    // $("#sendBtn2").click(function () {
    //     sendMessage(2);
    // });
    //
    // $("#sendBtn3").click(function () {
    //     sendMessage(3);
    // });

    $("#sendBtn").click(function () {
        sendMessage(activeType);
        // $("#wankoModal").modal("hide");
    });


    $inputArea.bind('input propertychange', function() {
        allow_send = 0;
    });

    $(document).on('click', '#re_send', function () {
        var inputMessage = $inputArea.val();
        if (inputMessage) {
            sendToSocket(inputMessage);
            $('#myModal').modal('hide');
        }
        return 0;
    });

    // 通过webSocket发送消息到服务端
    function sendMessage(type) {
        var inputMessage = $inputArea.val();  // 获取输入框的值

        var $data = JSON.stringify({"text": inputMessage, "type": type});
        var r = $('#rand').val()
        var nam = $('#name').text()

        if (inputMessage) {
            if (allow_send === 0) {
                $.ajax({
                    type: "POST",
                    url: requestUrl + "predict",
                    contentType: "application/json;charset=utf-8",
                    data: $data,
                    dataType: "json",
                    async: false,
                    success: function (message) {
                        if (message.result !== -1) { //offensive
                            if (type === 1) {
                                // show_modal();
                                extend_message(r, nam, inputMessage, 0);
                                $inputArea.val('');
                                $inputArea.focus();
                            } else if (type === 2 || type === 3) {
                                // show_modal();
                                sendToSocket(message.result);
                            } else if (type === 4) {
                                $("#recommendation").text("");
                                $("#recommendation").append(message.recommendation);
                                $("#wankoModal").modal("show");
                                $inputArea.focus();
                                allow_send = 1;
                                $("#sendBtn").text("Still send");
                            }
                        } else {
                            sendToSocket(inputMessage);
                        }
                    },
                    error: function (message) {
                        alert("fail: " + message);
                    }
                });
            } else if (allow_send === 1) {
                sendToSocket(inputMessage);
            }
        }
    }

    function show_modal() {
        $('#myModal').modal('show');
        $('#myModal').on('hidden.bs.modal', function (e) {
            $inputArea.focus();
        });
    }

    function sendToSocket(inputMessage) {
        if (inputMessage && connected) {
            $inputArea.val('');      // 清空输入框的值
            socket.send(inputMessage);  // 基于WebSocket连接发送消息
            console.log("send message:" + inputMessage);
            allow_send = 0;
            $("#sendBtn").text("Send");
            $("#wankoModal").modal("hide");
        }
    }
});

function init_streams(live_width, live_height, player) {
    $.get("/chatRoom/getStreams", function (data) {
        var result_json = eval("(" + data + ")");
        var stream_div = "";
        for (var index in result_json) {
            var stream_username = String(result_json[index].name).toLowerCase();
            stream_username = stream_username.replace(" ", "");
            var temp_div = [
                "<div class='stream'>",
                "<img class='streamThumbnail' src='" + result_json[index].thumbnail + "' alt='" + stream_username + "'/>",
                "<div class='streamProp'>",
                "<a href='#' class='streamTitle' name='" + stream_username + "'>" + result_json[index].title,
                "</a>",
                "<p class='streamUsername'>" + result_json[index].name,
                "</p>",
                "<p class='streamViewer'>" + result_json[index].viewer + " viewers",
                "</p>",
                "</div>",
                "</div>"
            ]
            stream_div += temp_div.join("");
        }
        $(".streamArea").append(stream_div);

        $('.streamTitle').click(function (){
            $('#live').slideDown();
            player = init_stream_live($(this).attr('name'), live_width, live_height, player);
            return player;
        });
        $(".streamThumbnail").click(function () {
            $('#live').slideDown();
            player = init_stream_live($(this).attr('alt'), live_width, live_height, player);
            return player;
        });
    })
}

function init_stream_live(channel, width, height, player) {
    var options = {
        width: width,
        height: height,
        channel: channel,
    };
    if (player === null) {
        player = new Twitch.Player("live", options);
    } else {
        player.setChannel(channel);
    }
    player.setVolume(0.5);
    return player
}