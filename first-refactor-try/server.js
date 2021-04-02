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

// Object to store the players
var players = {};

// Socket IDs
let sockets = {};

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
var addPeerConnection = (userId, roomId, socket) => {
    console.log(`Adding peer connection for user ${userId}`);
    peerConnections[userId] = new wrtc.RTCPeerConnection(configuration);
    
    attachNegotiationEventHandler(peerConnections[userId], socket)
    attachOnIceCandidateEventHandler(peerConnections[userId], socket);
    attachOnSuccessfulConnectionEventHandler(peerConnections[userId], userId);
    attachOnTrackEventHandler(peerConnections[userId], userId, roomId, socket);
};


// Attaches event handler for the onicecandidate event
var attachOnIceCandidateEventHandler = (peerConnection, socket) => {
    peerConnection.onicecandidate = ({candidate}) => socket.emit('webrtc-message', {candidate});
}


// Connection successful
var attachOnSuccessfulConnectionEventHandler = (peerConnection, userId) => {
    peerConnection.oniceconnectionstatechange = event => {
        if (peerConnection.iceConnectionState === 'connected') {
            console.log(`User ${userId} successfully connected!`);
        }
    }
};

// Whenever a new track is received, we want to direct it to all other peers
var attachOnTrackEventHandler = (peerConnection, userId, roomId, socket) => {
    peerConnection.ontrack = event => {
        // Adding each user's tracks to each other's peer connection's with the server.
        userIdStreamIdMatches = addTracks(peerConnections, userId);
        console.log(userIdStreamIdMatches);
        // Update all users's (trackId,userId) matches
        updateUserIdStreamIdMatches(userIdStreamIdMatches);
    }
}

// Update all matches of (userId, transceiverMid). Can't use trackId as it is not the same on both ends.
// Transciever Mid seems to be guaranteed to keep the order in which it was added.
var updateUserIdStreamIdMatches = (userIdStreamIdMatches) => {
    for (var {user, sourceUser, streamId} of userIdStreamIdMatches) {
        sockets[user].emit('userid-streamid-match', sourceUser, streamId);
    }
};

// Adds every other user's tracks to a new user, and vice versa
var addTracks = (peerConnections, userId) => {
    let userIdStreamIdMatches = [];
    let streamId;
    for (const otherUserId in peerConnections) {
        if (otherUserId != userId) {
            streamId = addUserTrackToDestinationStream(peerConnections, userId, otherUserId);
            if (streamId) userIdStreamIdMatches.push({"user": otherUserId, "sourceUser": userId, "streamId": streamId});  // this means: on the "user" client, the stream that comes from "sourceUser" has ID "streamId"

            streamId = addUserTrackToDestinationStream(peerConnections, otherUserId, userId);
            if (streamId) userIdStreamIdMatches.push({"user": userId, "sourceUser": otherUserId, "streamId": streamId}); 
        }
    }
    return userIdStreamIdMatches
}
// The actual function logic that adds a user's track to another user's stream.
// Also sends a notification to the user with (trackId, sourceUser) so the volume can be tuned on client-side
var addUserTrackToDestinationStream = (peerConnections, sourceUser, destinationUser) => {
    console.log(`Adding user ${sourceUser}'s track to user ${destinationUser}'s stream.`)
    try {
        var stream = new wrtc.MediaStream();
        var streamId = stream.id;

        // TODO: Not sure if this is a good way to do it, but I am trying to force each track to be on an individual stream.
        // This is because stream.id was the ONLY id I could find that is common between peers.
        // If there's a way to do this with addTrack only, would be better.
        const transceiver = peerConnections[destinationUser].addTransceiver(
            peerConnections[sourceUser].getReceivers()[0].track,
            {streams: [stream]}
        );
        
        return streamId
        
        console.log(`Successfully added user ${sourceUser}'s track to user ${destinationUser}'s stream.`);
    } catch (e) {
        console.log(e)
    }
};

// Handles renegotiation (necessary every time a track is added)
var attachNegotiationEventHandler = async (peerConnection, socket) => {
    peerConnection.onnegotiationneeded = async () => {
        await peerConnection.setLocalDescription(await peerConnection.createOffer());
        socket.emit('webrtc-message', {'description': peerConnection.localDescription});
    }
};

// socket.io server.
io.on('connection', socket => {

    socket.emit('current-players', players);

    socket.on('new-player', (playerName, x, y) => {
        players[socket.id] = {playerName, x, y};
        socket.broadcast.emit('new-player', players[socket.id]);
    });

    socket.on('new-position', (x, y) => {
        try {
            players[socket.id].x = x;
            players[socket.id].y = y;
            socket.broadcast.emit('new-position', players[socket.id].playerName, x, y);
        } catch (e) {
            console.log(e);
            console.log(players);
        }
    })
    

    // Notifying all users that a new user joined
    socket.on('user-joined-room', (userId, roomId) => {
        socket.join(roomId);
        sockets[userId] = socket;
        socket.to(roomId).emit('user-joined-room', userId);
        addPeerConnection(userId, roomId, socket);
    });

    // Connecting to client
    socket.on('webrtc-message', async ({userId, roomId, data}) => {
        if (data.description) {
            await peerConnections[userId].setRemoteDescription(data.description);
            if (data.description.type == "offer") {
              await peerConnections[userId].setLocalDescription(await peerConnections[userId].createAnswer());
              socket.emit('webrtc-message', {description: peerConnections[userId].localDescription});
            }
        } else if (data.candidate && data.candidate.candidate != "") await peerConnections[userId].addIceCandidate(data.candidate);
    });
})

server.listen(5500);