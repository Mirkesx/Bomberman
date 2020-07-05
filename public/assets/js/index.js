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
                    $('.chat_panel').hide();
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
                $('.chat_panel').show();
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

    $("#submit").on('click', loginUser);

    $('#usersList').tooltip({trigger: 'click hover', title: "Users online", placement: 'bottom', html: true });
});