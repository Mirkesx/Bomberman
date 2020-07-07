const loadSettings = () => {
    $('#gameSetup').show("fast",setupSettings);
}

const setupSettings = () => {
    disableInputs();
    setInputListeners();
}

const disableInputs = () => {
    if(userNickname != host) {
        $('#gameSetup').find('input').prop('disabled',true);
    }
}

const setInputListeners = () => {
    if(userNickname == host) {
        $('#gameSetup').find('input').change((event) => {
            var idInput = event.currentTarget.id;
            socket.emit('send-input-values',{id: idInput, value: $('#'+idInput).val()});
        });
    }
}

