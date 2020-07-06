var socket = io(window.location.href);
var userNickname;
var roomName;
var userList = [];

$(document).ready(() => {

    const loginUser = () => {
        userNickname = $("#nickname").val();
        roomName = $("#roomName").val();
        if (roomName && roomName.length > 1 && userNickname && userNickname.length > 3) {
            socket = io(window.location.href);

            socket.on('connect', () => {

                socket.on("nickname-exists", () => {
                    alert("Nickname exists");
                    $('.login_panel').show();
                    $('.chat').hide();
                    socket.close();
                });

                socket.on("user_list", (list) => {
                    userList = list;
                    setUserList();
                });

                socket.on("user_logged", (nickname) => {
                    if (nickname !== userNickname) {
                        serviceMessage('Utente connesso: ' + nickname);
                        userList.push(nickname);
                        setUserList();
                    }
                });

                socket.on("user_disconnected", (nickname) => {
                    serviceMessage('Utente disconnesso: ' + nickname);
                    userList.splice(userList.indexOf(nickname), 1);
                    setUserList();
                });

                socket.emit("login", { nickname: userNickname, roomName: roomName });

                socket.on("message", (data) => {

                    if (userNickname != data.nickname) {
                        //messaggio degli altri
                        receiveMsg(data.nickname, data.message);
                    }
                })

                $('.login_panel').hide();
                $('.chat').show();
            });
        }
    }

    setUserList = () => {
        let list = "Users online<br>";
        for (let user of userList)
        list += user + "<br>";
        $("#usersList").attr("data-original-title", list );
    }

    /*
    Manage events
    */

    //$('.chat_panel').resizable({minWidth: 50, minHeight: 50, handles: "n, w, nw"});

    $("#submit").on('click', loginUser);

    $('.chat_icon').on('click', () => {
        $('.chat_icon').hide();
        $('.chat_panel').show();
        $('.messages').animate({ scrollTop: $('.messages').prop('scrollHeight') }, 300);
    });

    $('.chat_panel').find('.card-header').on('click', () => {
        $('#unread-messages').html('0');
        $('.chat_panel').hide();
        $('.chat_icon').show();
    });

    $('#usersList').tooltip({trigger: 'click hover', title: "Users online", placement: 'bottom', html: true });
});