const express = require('express');
const app = express();
const server = require('http').Server(app);
app.use(express.static("public")) 
var io = require('socket.io')(server);

app.get('/', (req, res) => {
    res.sendFile('index.html')
});

var players = {};

io.on('connection', function (socket) {

    socket.emit('current-players', players);

    socket.on('new-player', (playerName, x, y) => {
        players[socket.id] = {playerName, x, y};
        socket.broadcast.emit('new-player', players[socket.id]);
    });

    socket.on('new-position', (x, y) => {
        players[socket.id].x = x;
        players[socket.id].y = y;
        socket.broadcast.emit('new-position', players[socket.id].playerName, x, y);
    })
    
    // socket.on('disconnect', function () {
    //     console.log('user disconnected');
    // });
});

server.listen(1234);