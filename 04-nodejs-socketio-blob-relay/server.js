
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static("public"))

// redirect to random URL page
app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
})
  
app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
})

io.on('connection', socket => {

    socket.on('join-room', (roomId, userId) => {
        console.log(`User ${userId} connected`);
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
    })

    socket.on('new-blob', (blob, roomId, userId) => {
        console.log(`Got a new blob from user ${userId} on room ${roomId}`);
        socket.to(roomId).emit('new-blob', blob, roomId, userId)
    })

})

server.listen(5500);