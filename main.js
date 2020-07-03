var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(express.static(__dirname + '/public/index.html'));
});

var roomno = 1;
io.on('connection', function (client) {

    client.on('manageRoom', (data) => {
        client.join(data.name);
        let npersons = io.nsps['/'].adapter.rooms[data.name].length;
        io.sockets.in(data.name).emit('connectToRoom', "You are in room " + data.name + ". There are " + npersons + " users.");
    });

    client.on('disconnect', () => {
        console.log("User disconnected!");
    });

    client.on("leavingRoom", (data) => {
        let npersons;
        if (io.nsps['/'].adapter.rooms[data.name] && io.nsps['/'].adapter.rooms[data.name].length > 0) {
            npersons = io.nsps['/'].adapter.rooms[data.name].length-1;
            io.sockets.in(data.name).emit('connectToRoom', "You are in room " + data.name + ". There are " + npersons + " users.");
        }
    });
})

http.listen(3000, function () {
    console.log('listening on localhost:3000');
});