/**
 * Loading Modules
 */

var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io')(http);

/**
 * Static files
 */

app.use(express.static('public'));
app.use(express.static('node_modules'));

/**
 * Routes definitions
 */

app.get('/', function (req, res) {
    res.sendFile(express.static(__dirname + '/public/index.html'));
});

/**
 * 
 * Manage WebSocket Server
 */

const rooms = {};
io.on('connection', function (client) {

    client.on("disconnect", () => {
        if (client.nickname) {
            leaveRoom(client.roomName, client.nickname);
            io.sockets.in(client.roomName).emit('user_disconnected', client.nickname);
            console.log("Client disconnected", client.roomName, client.nickname);
        }
    })

    client.on("request_user_list", (roomName) => {
        client.emit("user_list", rooms[roomName].userList);
    })

    client.on("login", (data) => {
        if (rooms[data.roomName] === undefined || (rooms[data.roomName] && rooms[data.roomName].userList.indexOf(data.nickname) < 0) ) {
            client.join(data.roomName);
            if(rooms[data.roomName]) {
                rooms[data.roomName].userList.push(data.nickname);
            } else {
                rooms[data.roomName] = {userList: [data.nickname]};
            }
            client.nickname = data.nickname;
            client.roomName = data.roomName;
            console.info("Client Connected", client.roomName, client.nickname);
            client.emit("user_list", rooms[client.roomName].userList);
            io.sockets.in(client.roomName).emit('user_logged', data.nickname);
        } else {
                client.emit("nickname-exists");
        }

        client.on("send_message", (msg) => {
            io.sockets.in(client.roomName).emit("message", {nickname : client.nickname, message : msg});
        })
    })
})

http.listen(3000, function () {
    console.log('listening on localhost:3000');
});

/**
 *  METHODS DEFINITIONS 
 */

 function leaveRoom(room, nickname) {
     if(rooms[room]) {
         rooms[room].userList.splice(rooms[room].userList.indexOf(nickname),1);
     }
 }