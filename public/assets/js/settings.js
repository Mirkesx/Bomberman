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
    $('#gameSetup #cardPlayersList .card-body').html('');
    let list = "";
    for (let i = 0; i < userList.length; i++) {
        let $row = $('<div class="row"></div>');
        $row.append('<span class="col-10 userName" style="color:' + colors[i] + ';">' + userList[i].nickname + '</span>');
        $row.append('<span class="col-1 fa ' + (userList[i].status == "ready" ? 'fa-check' : 'fa-times') + ' fa-2 ' + userList[i].status + '"></span>');
        /*if (userNickname == host)
            $row.append('<span class="col-1 fa fa-solid:door-closed fa-2 kick-user"></span>')*/
        $row.appendTo('#gameSetup #cardPlayersList .card-body');
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
    if (userNickname != host)
        $('#buttonStart').hide();

    $('#buttonReady').click(() => {
        if ($('#buttonReady').hasClass('btn-danger')) {
            console.log("Now ready.")
            socket.emit('player-ready', userNickname);
            $('#buttonReady').removeClass('btn-danger').addClass('btn-success');
        } else {
            console.log("Now not ready.")
            socket.emit('player-not-ready', userNickname);
            $('#buttonReady').removeClass('btn-success').addClass('btn-danger');
        }
    });

    $('#buttonStart').click(() => {
        socket.emit('start-game', userNickname);
        console.log("Starting a new game");
    });
};

const appendUserToList = (nickname) => {
    let $row = $('<div class="row"></div>');
    $row.append('<span class="col-10 userName" style="color:' + colors[userList.length - 1] + ';">' + nickname + '</span>');
    $row.append('<span class="col-1 fa fa-times fa-2 not-ready"></span>')
    $row.appendTo('#gameSetup #cardPlayersList .card-body');
}

const removeUserFromList = (nickname) => {
    let $rowUserList = $('#gameSetup #cardPlayersList .card-body').find('.row');
    for (let $div of $rowUserList) {
        $user = $($div);
        if ($user.find('.userName').text() == nickname) {
            $user.remove();
        }
    }
}