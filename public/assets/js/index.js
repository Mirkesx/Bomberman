var socket = io(window.location.href);
var sendMsg, receiveMsg;
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
                    socket.close();
                });

                socket.on("user_list", (list) => {
                    userList = list;
                });

                socket.on("user_logged", (nickname) => {
                    if(nickname == userNickname) {
                        $('body').html('');
                    } else {
                        $('body').append('Utente connesso: ' + nickname + '<br>');
                        userList.push(nickname);
                    }
                });

                socket.on("user_disconnected", (nickname) => {
                    $('body').append('Utente disconnesso: ' + nickname + '<br>');
                    userList.splice(userList.indexOf(nickname), 1);
                });

                socket.emit("login", { nickname: userNickname, roomName: roomName });
                //socket.emit("request_user_list");

                socket.on("message", (data) => {

                    if (userNickname != data.nickname) {
                        //messaggio degli altri
                        receiveMsg(data.nickname, data.message);
                    }
                })
            });
        }
    }

    sendMsg = (msg) => {
        socket.emit("send_message", msg);
    }

    receiveMsg = (user, msg) => {
        console.log(user + ": " + msg);
    }


    /*
    Manage events
    */

    $("#submit").on('click', loginUser);

});
