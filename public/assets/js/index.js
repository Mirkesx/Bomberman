var socket = io(window.location.href);
var name;
socket.on("connect", () => {
    socket.on('connectToRoom', function (data) {
        $('body').html(data);
    });

    $("#submit").on('click',() => {
        name = $('#roomName').val();
        if (name && name.length > 0) {
            socket.emit('manageRoom', {name});
        };
    });

    $(window).on('beforeunload', () => {
        socket.emit('leavingRoom',{name});
    });
});
