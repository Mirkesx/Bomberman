var socket = io(window.location.href);
var userNickname;
var roomName;
var avatar;
var userList = [];
var host;

$(document).ready(() => {

    const loginUser = (isCreatingRoom) => {
        userNickname = $("#nickname").val();
        roomName = $("#roomName").val();
        if (roomName && roomName.length > 1 && userNickname && userNickname.length > 3) {
            socket = io(window.location.href);

            socket.on('connect', () => {

                socket.on("nickname-exists", () => {
                    $('.chat').hide();
                    socket.close();
                    console.log("Nickname exists");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 500);
                });

                socket.on("room-not-exists", () => {
                    $('.chat').hide();
                    socket.close();
                    console.log("Doesn't exists a room with this name");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 500);
                });

                socket.on("room-exists", () => {
                    $('.chat').hide();
                    socket.close();
                    console.log("This room name is already used");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 500);
                });

                socket.on("room-full", () => {
                    $('.chat').hide();
                    socket.close();
                    console.log("This room is full");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 500);
                });

                socket.on('enter-room', (data) => {
                    socket.emit("login", { nickname: data.nickname, roomName: data.roomName, avatar: data.avatar });
                });

                socket.on("user_list", (list, h) => {
                    userList = _.map(list, (user) => (user['host'] === user['nickname'] ? "<H> " : "") + user['nickname']);
                    host = h;
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

                socket.on("new_host", (nickname) => {
                    serviceMessage('Utente promosso ad host: ' + nickname);
                    if(userNickname === nickname) {
                        host = nickname;
                    }
                });

                if (isCreatingRoom) {
                    socket.emit('create-room', { nickname: userNickname, roomName: roomName, avatar: avatar });
                    host = userNickname;
                }
                else {
                    socket.emit("login", { nickname: userNickname, roomName: roomName, avatar: avatar });
                }

                socket.on("message", (data) => {
                    console.log(data);
                    if (userNickname != data.nickname) {
                        //messaggio degli altri
                        receiveMsg(data.nickname, data.message, data.avatar);
                    }
                })

                $('.chat').show();
            });
        }
    }

    setUserList = () => {
        let list = "Users online<br>";
        for (let user of userList)
            list += (host === user ? "Host - " : "") + user + "<br>";
        $("#usersList").attr("data-original-title", list);
    }

    /*
    Manage events
    */

    $("#join-room").on('click', () => {
        avatar = $('#carouselAvatar').find('.active').attr('data-avatar');
        $('#loginModal').modal('hide');
        loginUser(false);
    });
    $("#create-room").on('click', () => {
        avatar = $('#carouselAvatar').find('.active').attr('data-avatar');
        $('#loginModal').modal('hide');
        loginUser(true);
    });

    /*
     * Chat commands
     */

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

    $('#usersList').tooltip({ trigger: 'click hover', title: "Users online", placement: 'bottom', html: true });

    /*
     * Initial Setup
     */

    createLoginModal();
});


function createLoginModal() {
    $('.chat').hide();
    $('#loginModal').modal({ backdrop: 'static', keyboard: false });
    $('#carouselAvatar').carousel('pause');
    $('#carouselAvatar').carousel();
    $('#prev-avatar').click(() => {
        $('#carouselAvatar').carousel('prev');
        $('#carouselAvatar').carousel('pause');
    });
    $('#next-avatar').click(() => {
        $('#carouselAvatar').carousel('next');
        $('#carouselAvatar').carousel('pause');
    });
}