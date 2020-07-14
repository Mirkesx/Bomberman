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

app.use('/test', express.static('test'));
app.use('/public', express.static('public'));
app.use('/node_modules', express.static('node_modules'));

/**
 * Routes definitions
 */

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/test', function (req, res) {
    res.sendFile(__dirname + '/test/index.html');
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
            if (client.status == "ready") {
                rooms[client.roomName].readyPlayers--;
            }
            if (client.isInGame) {
                io.sockets.in(client.roomName).emit('kill-player', client.in_game_id);
                rooms[client.roomName].players = _.filter(rooms[client.roomName].players, (p) => p != client.in_game_id);
                if (rooms[client.roomName].players.length == 1) {
                    io.sockets.in(client.roomName).emit('end-game', rooms[client.roomName].players[0]);
                }
            }
            if (rooms[client.roomName].userList.length == 0) {
                rooms[client.roomName].gameStarted = false;
            }
            io.sockets.in(client.roomName).emit('user_disconnected', { nickname: client.nickname, status: client.status });
            console.log("[ROOM " + client.roomName + "] - User " + client.nickname + " disconnected");
        }
    })

    client.on("request_user_list", () => {
        client.emit("user_list", { list: rooms[client.roomName].userList, h: rooms[client.roomName].host });
    })

    client.on("create-room", (data) => {
        if (!rooms.hasOwnProperty(data.roomName)) {
            rooms[data.roomName] = { userList: [], gameStarted: false, readyPlayers: 0, stage: 1 };
            //client.emit("enter-room", data);
        }
        /*else {
            client.emit("room-exists");
        }*/
        client.emit("enter-room", data);
    });

    client.on("login", (data) => {
        if (!rooms[data.roomName].gameStarted) {
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
        } else {
            client.emit('room-in-game');
        }

    });

    client.on("send-input-values", (data) => {
        io.sockets.in(client.roomName).emit("get-input-values", data);
    });

    client.on("player-ready", (index) => {
        client.status = "ready";
        rooms[client.roomName].userList[index].status = "ready";
        rooms[client.roomName].readyPlayers++;
        io.sockets.in(client.roomName).emit("set-player-ready", index);
    });

    client.on("player-not-ready", (index) => {
        client.status = "not-ready";
        rooms[client.roomName].userList[index].status = "not-ready";
        rooms[client.roomName].readyPlayers--;
        io.sockets.in(client.roomName).emit("set-player-not-ready", index);
    });

    client.on("update-stage", (stage) => {
        rooms[client.roomName].stage = stage;
        io.sockets.in(client.roomName).emit("update-stage-carousel", stage);
    });

    const loginUser = (data) => {
        client.join(data.roomName);
        rooms[data.roomName].userList.push({ nickname: data.nickname, avatar: data.avatar, status: "not-ready" });
        if (rooms[data.roomName].userList.length === 1) {
            rooms[data.roomName].host = data.nickname;
            console.log("[ROOM CREATED] - User " + rooms[data.roomName].host + " has created a new room called " + data.roomName);
        }

        client.nickname = data.nickname;
        client.roomName = data.roomName;
        client.avatar = data.avatar;
        client.status = 'not-ready';
        client.isInGame = false;


        console.info("[ROOM " + client.roomName + "] - User " + client.nickname + " connected");
        rooms[client.roomName].readyPlayers++;


        io.sockets.in(client.roomName).emit('user_logged', data.nickname);
        client.emit("user_list", { list: rooms[client.roomName].userList, h: rooms[client.roomName].host });
        client.emit('load_dashboard', rooms[client.roomName].gameStarted);
    };

    const checkValidRoom = (data) => {
        return rooms[data.roomName] &&
            rooms[data.roomName].userList.length < 4 &&
            _.findIndex(rooms[data.roomName].userList, (user) => user.nickname == data.nickname) < 0
    };


    // GAME EVENTS
    client.on('start-game', (data) => {
        console.log("[ROOM " + client.roomName + "] - Started a new game");
        rooms[client.roomName].gameStarted = true;
        rooms[client.roomName].players = _.range(data.n_p);
        rooms[client.roomName].map = generateWalls(empty_stage);
        rooms[client.roomName].items = generateItems(rooms[client.roomName].map);
        io.sockets.in(client.roomName).emit('load-game', data);
    });

    client.on('close-game', () => {
        rooms[client.roomName].gameStarted = false;
        io.sockets.in(client.roomName).emit('exit-game');
    });

    client.on('user-exits', () => {
        client.isInGame = false;
        io.sockets.in(client.roomName).emit('kill-player', client.in_game_id);
        client.in_game_id = -1;
        rooms[client.roomName].players = _.filter(rooms[client.roomName].players, (p) => p != client.in_game_id);
        if (rooms[client.roomName].players.length == 1) {
            io.sockets.in(client.roomName).emit('end-game', rooms[client.roomName].players[0]);
        }
    });

    client.on('request-stage', (id) => {
        client.in_game_id = id;
        client.isInGame = true;
        io.sockets.in(client.roomName)
            .emit('walls-items-ready',
                {
                    stage: rooms[client.roomName].map,
                    items: rooms[client.roomName].items
                }
            );
    });

    client.on('move-player', (data) => {
        io.sockets.in(client.roomName).emit('move-enemy', data);
    });

    client.on('stop-player', (id) => {
        io.sockets.in(client.roomName).emit('stop-enemy', id);
    });

    client.on('placed-bomb', (data) => {
        io.sockets.in(client.roomName).emit('place-enemy-bomb', data);
    })


    client.on('dead-items', (data) => {
        console.log('[ROOM ' + client.roomName + '] - Player ' + (data.id + 1) + " died");
        locations = replaceItems(data.stage, data.items);
        rooms[client.roomName].map = locations[1];
        io.sockets.in(client.roomName).emit('kill-player', data.id);
        io.sockets.in(client.roomName).emit('replace-items', locations[0]);
        rooms[client.roomName].players = _.filter(rooms[client.roomName].players, (p) => p != data.id);
        if (rooms[client.roomName].players.length == 1) {
            io.sockets.in(client.roomName).emit('end-game', rooms[client.roomName].players[0]);
        }
    });
});





http.listen(3000, function () {
    console.log('[SERVER] - Listening on localhost:3000');
});




/**
 *  METHODS DEFINITIONS 
 */

function leaveRoom(room, nickname) {
    let index = _.findIndex(rooms[room].userList, (user) => user.nickname === nickname);
    if (rooms[room] && index >= -1) {
        rooms[room].userList.splice(index, 1);
        if (rooms[room].userList.length > 0 && nickname === rooms[room].host) {
            rooms[room].host = rooms[room].userList[0].nickname;
            console.log("[ROOM " + room + "] - User " + rooms[room].host + " is now the host");
            io.sockets.in(room).emit('new_host', rooms[room].host);
        }
    }
}

const empty_stage = [ //0 grass, 1 unbreakable wall, 2 wall, 3 item-inside wall, 4 item outside wall
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];


const generateWalls = () => {
    const players_start = [
        "1,1",
        "1,2",
        "2,1",
        "13,1",
        "12,1",
        "13,2",
        "1,11",
        "1,10",
        "2,11",
        "13,11",
        "13,10",
        "12,11",
    ];

    let stage = [[], [], [], [], [], [], [], [], [], [], [], [], []];

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 13; j++) {
            stage[j].push(empty_stage[j][i]);
            if (players_start.indexOf(i + "," + j) === -1 && stage[j][i] === 0) {
                if (Math.random() < 0.85) {
                    stage[j][i] = 2;
                }
            }
        }
    }

    return stage;
}

const items_list = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 3, 9, 9, 9, 9, 9, 9, 9, 23, 23, 23];

const generateItems = (stage) => {
    items = [];
    for (let i = 1; i < 14; i++) {
        for (let j = 1; j < 12; j++) {
            if (stage[j][i] === 2) {
                if (Math.random() < 0.20) {
                    items.push([items_list[Math.floor(Math.random() * items_list.length)], i * 16, j * 16]);
                }
            }
        }
    }
    return items;
}

const replaceItems = (stage, items) => {
    notWalls = [];
    for (let i = 1; i < 14; i++) {
        for (let j = 1; j < 12; j++) {
            if (stage[j][i] === 0)
                notWalls.push([i * 16, j * 16]);
        }
    }

    i = 0;
    locations = [];
    while (i < items.length && notWalls.length > 0) {
        index = Math.floor(Math.random() * notWalls.length);
        locations.push([items[i], notWalls[index]]);
        stage[notWalls[index][1] / 16][notWalls[index][0] / 16] = 3;
        notWalls.splice(index, 1);
        i++;
    }
    return [locations, stage];
};