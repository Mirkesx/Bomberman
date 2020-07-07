/**
 * Loading Modules
 */

var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io')(http),
    _ = require('underscore');

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

    client.on("create-room", (data) => {
        if (rooms.hasOwnProperty(data.roomName)) {
            client.emit("room-exists");
        }
        else {
            rooms[data.roomName] = { userList: [] };
            client.emit("enter-room", data);
        }

    });

    client.on("login", (data) => {
        if (checkValidRoom(data)) {
            loginUser(data);
        } else {
            if (rooms[data.roomName] === undefined)
                client.emit("room-not-exists");
            else if (rooms[data.roomName].userList.length == 4)
                client.emit("room-full");
            else if (_.findIndex(rooms[data.roomName].userList, (user) => user.nickname == data.nickname) >= 0)
                client.emit('nickname-exists');
        }

        client.on("send_message", (msg) => {
            io.sockets.in(client.roomName).emit("message", { nickname: client.nickname, message: msg, avatar: client.avatar });
        })
    });

    const loginUser = (data) => {
        client.join(data.roomName);
        rooms[data.roomName].userList.push({ nickname: data.nickname, avatar: data.avatar });
        if (rooms[data.roomName].userList.length === 1) {
            rooms[data.roomName].host = data.nickname;
            console.log("User " + rooms[data.roomName].host + " has created a new room called " + data.roomName);
        }
        client.nickname = data.nickname;
        client.roomName = data.roomName;
        client.avatar = data.avatar;
        console.info("Client Connected", client.roomName, client.nickname, client.avatar, rooms[client.roomName].userList.length);
        client.emit("user_list", rooms[client.roomName].userList, rooms[client.roomName].host);
        io.sockets.in(client.roomName).emit('user_logged', data.nickname);
    };

    const checkValidRoom = (data) => {
        return rooms[data.roomName] &&
            rooms[data.roomName].userList.length < 4 &&
            _.findIndex(rooms[data.roomName].userList, (user) => user.nickname == data.nickname) < 0
    };
})

http.listen(3000, function () {
    console.log('listening on localhost:3000');
});

/**
 *  METHODS DEFINITIONS 
 */

function leaveRoom(room, nickname) {
    let index = _.findIndex(rooms[room].userList, (user) => user.nickname === nickname);
    //console.log("The user is at the position n. "+index);
    if (rooms[room] && index >= -1) {
        rooms[room].userList.splice(index, 1);
        if (rooms[room].userList.length > 0 && nickname === rooms[room].host) {
            rooms[room].host = rooms[room].userList[0].nickname;
            console.log("User " + rooms[room].host + " is now the host of the room called " + room);
            io.sockets.in(room).emit('new_host', rooms[room].host);
        }
    }
}