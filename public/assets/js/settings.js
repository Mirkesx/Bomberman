const colors = ['grey', 'black', 'blue', 'red'];

const loadSettings = () => {
    $('#gameSetup').show("fast", setupSettings);
}

const setupSettings = () => {
    printUserList();
    disableInputs();
    setInputListeners();
    setEventsButtons();
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
    if(userList.length == _.filter(userList, (user) => user.status == "ready").length)
        $('#buttonStart').removeAttr('disabled');
    else
        $('#buttonStart').prop('disabled', 'true');
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
    if (userNickname != host)
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
        socket.emit('start-game', userNickname);
        console.log("Starting a new game");
    });
};