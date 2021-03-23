const { Server } = require('engine.io');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);  // all Websockets conections start with an HTTP request :-) 
const wrtc = require("wrtc");

app.set('view engine', 'ejs');
// Makes all files in this folder accessible by http (e.g. file public/script.js is accessible in server:port/script.js).
// Otherwise, this route wouldn't exist and the room.ejs file wouldn't be able to access this script. 
app.use(express.static("public")) 

// Object to store client WebRTC connections
let peerConnections = {};

// STUN server configuration
const configuration = {
    'iceServers': [
        {
            'urls': [
                'stun:stun.l.google.com:19302',
            ]
        }
    ]
};


// Renders a room.
app.get('/:room', (req, res) => {
    res.render('room.ejs', {
        room: req.params.room
    })
})


// Function to add a new peer connection with a client.
var addPeerConnection = (peerConnections, userId, message, offer, configuration) => {
    console.log(`Adding peer connection for user ${userId}`);
    peerConnections[userId] = new wrtc.RTCPeerConnection(configuration);
    peerConnections[userId].setRemoteDescription(new wrtc.RTCSessionDescription(message.offer));
};


// Creates and sends a WebRTC answer to a client.
var createAndSendAnswerToClient = async (peerConnections, userId, socket) => {
    console.log(`Sending answer to user ${userId}`);
    const answer = await peerConnections[userId].createAnswer();
    await peerConnections[userId].setLocalDescription(answer);
    socket.emit('server-webrtc-answer', {'answer': answer});
}

// Attaches event handler for the onicecandidate event - send this ICE csndidate to the "caller" socket
var attachOnIceCandidateEventHandler = (peerConnections, userId, socket) => {
    peerConnections[userId].onicecandidate = event => {
        if (event.candidate) {
            console.log(`Got new local ICE candidate. Sending to user ${userId}`);
            socket.emit('server-new-ice-candidate', {'candidate': event.candidate});
        }
    }
}

// Handles a new incoming ICE candidate
var handleNewICECandidate = async (peerConnections, userId, message) => {
    try {
        console.log(`Got new remote ICE candidate from user ${userId}`);
        await peerConnections[userId].addIceCandidate(message.candidate);
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
};


// socket.io server.
io.on('connection', socket => {

    // Defining what to do when a client tries to connect.
    socket.on('client-webrtc-offer', (userId, roomId, message) => {
        if (message.offer) {
            addPeerConnection(peerConnections, userId, message, message.offer, configuration);
            attachOnIceCandidateEventHandler(peerConnections, userId, socket);
            createAndSendAnswerToClient(peerConnections, userId, socket);            
        }
    });

    // New ice-candidate from client.
    socket.on('client-new-ice-candidate', (userId, roomId, message) => {
        if (message.candidate) {
            handleNewICECandidate(peerConnections, userId, message)
        }
    });
})

server.listen(1313);