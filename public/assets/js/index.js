var socket;
var userNickname;
var roomName;
var avatar;
var userList;
var host;
var stageSelected;
var num_players_ready;

$(document).ready(() => {

    const loginUser = (isCreatingRoom) => {
        userList = [];
        userNickname = $("#nickname").val();
        roomName = $("#roomName").val();
        num_players_ready = 0;
        if (roomName && roomName.length > 1 && userNickname && userNickname.length > 3) {
            socket = io(window.location.href);

            socket.on('connect', () => {

                socket.on("nickname-exists", () => {
                    $('.chat').hide();
                    socket.close();
                    //console.log("Nickname exists");
                    createPopup("Nickname already exists in this room");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 1000);
                });

                socket.on("room-not-exists", () => {
                    $('.chat').hide();
                    socket.close();
                    //console.log("Doesn't exists a room with this name");
                    createPopup("Doesn't exists a room with this name");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 1000);
                });

                socket.on("room-exists", () => {
                    $('.chat').hide();
                    socket.close();
                    //console.log("This room name is already used");
                    createPopup("This room name is already used");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 1000);
                });

                socket.on("room-full", () => {
                    $('.chat').hide();
                    socket.close();
                    //console.log("This room is full");
                    createPopup("This room is full");
                    setTimeout(() => {
                        $('#loginModal').modal('show');
                        $('#carouselAvatar').carousel('pause');
                    }, 500);
                });

                socket.on('enter-room', (data) => {
                    socket.emit("login", { nickname: data.nickname, roomName: data.roomName, avatar: data.avatar });
                });

                socket.on("user_list", (data) => {
                    userList = data.list;
                    host = data.h;
                    setUserList();
                    printUserList();
                });

                socket.on("user_logged", (nickname) => {
                    if (nickname !== userNickname) {
                        serviceMessage('User joined: ' + nickname);
                        socket.emit('request_user_list');
                        //$('#buttonStart').prop('disabled', 'true');
                        $('#buttonStart').hide();
                        $('#buttonReady').show();
                    }
                });

                socket.on("user_disconnected", (data) => {
                    serviceMessage('User disconnected: ' + data.nickname);
                    if (data.status == "ready")
                        num_players_ready--;
                    socket.emit('request_user_list');
                });

                socket.on("new_host", (nickname) => {
                    serviceMessage('New host: ' + nickname);
                    if (userNickname === nickname) {
                        host = nickname;
                        //$('#buttonStart').show();
                        initCarousel();
                    }
                });

                socket.on("set-player-ready", (index) => {
                    userList[index].status ="ready";
                    let $rowUserList = $('#gameSetup #cardPlayersList .card-body').find('.row');
                    $user = $($rowUserList[index]);
                    $user.find('.not-ready').removeClass('fa-times not-ready').addClass("fa-check ready");
                    num_players_ready++;
                    if (host == userNickname && num_players_ready == userList.length) {
                        //$('#buttonStart').removeAttr('disabled');
                        $('#buttonReady').hide();
                        $('#buttonStart').show();
                    }
                });

                socket.on("set-player-not-ready", (index) => {
                    userList[index].status ="not-ready";
                    let $rowUserList = $('#gameSetup #cardPlayersList .card-body').find('.row');
                    $user = $($rowUserList[index]);
                    $user.find('.ready').removeClass('fa-check ready').addClass("fa-times not-ready");
                    num_players_ready--;
                    if (host == userNickname && num_players_ready < userList.length) {
                        //$('#buttonStart').prop('disabled', 'true');
                        $('#buttonStart').hide();
                        $('#buttonReady').show();
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
                    if (userNickname != data.nickname) {
                        //messaggio degli altri
                        receiveMsg(data.nickname, data.message, data.avatar);
                    }
                })

                socket.on("load_dashboard", (gameStarted) => {
                    $('.chat').show();

                    if (gameStarted) {
                        console.log("Wait for the game to finish!");
                    } else {
                        console.log("Loading your dashboard. Please Wait.")
                        loadSettings();
                    }
                });

                socket.on("get-input-values", (data) => {
                    $('#' + data.id).val(data.value);
                });

                socket.on("update-stage-carousel", (stage) => {
                    if(host != userNickname) {
                        $('#carouselStage').carousel(stage-1);
                        $('#carouselStage').carousel('pause');
                        stage = stage;
                    }
                });



                // GAME EVENTS
                socket.on('walls-items-ready', (data) => {
                    console.log("Items received");
                    setupStage(data.stage, data.items);
                });

            });
        }
    }

    setUserList = () => {
        let list = "";
        for (let i = 0; i < userList.length; i++)
            list += (host === userList[i].nickname ? "Host - " : "") + userList[i].nickname + "<br>";
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

    /*
     * Game Commands
     */

    $('.icon-volume').click(() => {
        if($('.icon-volume').hasClass('fa-volume-up')) {
            $('.icon-volume').removeClass('fa-volume-up').addClass('fa-volume-off');
            game.scene.scenes[0].sound.mute = true;
        } else {
            $('.icon-volume').removeClass('fa-volume-off').addClass('fa-volume-up');
            game.scene.scenes[0].sound.mute = false;
        }
    });

    $('.icon-exit').click(() => {
        game.destroy();
        $('.game').hide();
        $('.lobby').show();
    });
});


function createLoginModal() {
    $('.chat').hide();
    $('#gameSetup').hide();
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

function createPopup(text) {
    const popup = $('<div class="popup_scheda"></div>')
        .css({
            position: "fixed",
            display: "block",
            top: -50,
            padding: 50,
            opacity: 0,
            color: "white",
            "font-weight": "strong",
            "font-size": 15,
            "border-radius": 50,
            "z-index": 9999,
            "text-align": "center",
            "margin-left": -$('.popup_scheda').outerWidth() / 2
        })
        .html("<h5>"+text+"</h5>")
        .appendTo('body')
        .addClass("bg-danger")
        .animate({
            top: 50,
            opacity: 1
        },
            500);

    popup.css("left", ($(window).width() / 2) - (popup.outerWidth() / 2));

    window.setTimeout(() => deletePopup(popup), 1000);
}

function deletePopup(popup) {
    popup.animate({
        top: -50,
        opacity: 0
    },
        250,
        () => {
            $('.popup_scheda').remove();
            popupCreato = false;
        });
}