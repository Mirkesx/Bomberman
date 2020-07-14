const colors = ['grey', 'black', 'blue', 'red'];

const loadSettings = () => {
    $('#gameSetup').show("fast", setupSettings);
    $('.timePanel').hide();
}

const setupSettings = () => {
    printUserList();
    disableInputs();
    setInputListeners();
    setEventsButtons();
    setCarousel();
}

const printUserList = () => {
    $('#gameSetup').find('#cardPlayersList').find('.card-body').html('');
    for (let i = 0; i < userList.length; i++) {
        let $row = $('<div class="row"></div>');
        $row.append('<span class="col-10 userName" style="color:' + colors[i] + ';">' + userList[i].nickname + '</span>');
        $row.append('<span class="col-1 fa ' + (userList[i].status == "ready" ? 'fa-check' : 'fa-times') + ' fa-2 ' + userList[i].status + '"></span>');
        /*if (userNickname == host)
            $row.append('<span class="col-1 fa fa-solid:door-closed fa-2 kick-user"></span>')*/
        $('#gameSetup').find('#cardPlayersList').find('.card-body').append($row);
    }
    if(userNickname == host) {
        if(userList.length == _.filter(userList, (user) => user.status == "ready").length) {
            //$('#buttonStart').removeAttr('disabled');
            $('#buttonReady').hide();
            $('#buttonStart').show();
        }
        else {
            //$('#buttonStart').prop('disabled', 'true');
            $('#buttonStart').hide();
            $('#buttonReady').show();
        }
    }
};

const disableInputs = () => {
    if (userNickname != host) {
        $('#gameSetup').find('input').prop('disabled', true);
    }
};

const setInputListeners = () => {
    if (userNickname == host) {
        $('#gameSetup').find('input').change((event) => {
            var idInput = event.currentTarget.id;
            socket.emit('send-input-values', { id: idInput, value: $('#' + idInput).val() });
        });
    }
};

const setEventsButtons = () => {
    $('#buttonStart').hide();

    $('#buttonReady').click(() => {
        let index = _.findIndex(userList, (user) => user.nickname == userNickname);
        if (userList[index].status == "not-ready") {
            console.log("Now ready.")
            socket.emit('player-ready', index);
            $('#buttonReady').removeClass('btn-danger').addClass('btn-success');
        } else {
            console.log("Now not ready.")
            socket.emit('player-not-ready', index);
            $('#buttonReady').removeClass('btn-success').addClass('btn-danger');
        }
    });

    $('#buttonStart').click(() => {
        console.log("Starting a new game");
        setupGame();
    });
};

const setCarousel = () => {

    initCarousel();

    $('#prev-stage').click(() => {
        $('#carouselStage').carousel('prev');
        $('#carouselStage').carousel('pause');
        stageSelected = $('#carouselStage').find('.active').attr('data-stage');
        socket.emit("update-stage",stageSelected);
    });
    $('#next-stage').click(() => {
        $('#carouselAvatar').carousel();
        $('#carouselStage').carousel('next');
        $('#carouselStage').carousel('pause');
        stageSelected = $('#carouselStage').find('.active').attr('data-stage');
        socket.emit("update-stage",stageSelected);
    });
};

const initCarousel = () => {
    if(host == userNickname) {
        $('#carouselStage').carousel();
        $('#prev-stage').show();
        $('#next-stage').show();
        $('#carouselStage').carousel('pause');
    } else {
        $('#prev-stage').hide();
        $('#next-stage').hide();
    }
}