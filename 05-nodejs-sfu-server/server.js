const { Server } = require('engine.io');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);  // all Websockets conections start with an HTTP request :-) 
const wrtc = require("wrtc");

let idx = 0;

app.set('view engine', 'ejs');
// Makes all files in this folder accessible by http (e.g. file public/script.js is accessible in server:port/script.js).
// Otherwise, this route wouldn't exist and the room.ejs file wouldn't be able to access this script. 
app.use(express.static("public")) 

// Object to store client WebRTC connections
let peerConnections = {};
let audioConnections = [];

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
    attachOnSuccessfulConnectionEventHandler(peerConnections[userId], userId, roomId, socket);
};


// Attaches event handler for the onicecandidate event
var attachOnIceCandidateEventHandler = (peerConnection, socket) => {
    peerConnection.onicecandidate = ({candidate}) => socket.emit('webrtc-message', {candidate});
}


// Whenever a new connection is successful, we want to direct all streams from other users to it,
// as well as direct its stream to other users.
var attachOnSuccessfulConnectionEventHandler = (peerConnection, userId, roomId, socket) => {
    peerConnection.oniceconnectionstatechange = event => {
        if (peerConnection.iceConnectionState === 'connected') {
            console.log(`User ${userId} successfully connected!`);

            // Adding each user's tracks to each other's peer connection's with the server.
            addTracks(peerConnections, userId);

            // Update all users's (trackId,userId) matches
            updateUserTrackMatches(peerConnection, userId, roomId, socket);
        }
    }
};

// Update all users matches of (userId, trackId), so that volume can be tuned for each track
// This doesn't work: track ID isn't the same on sending/receiving end.
// Doing it in order, and hoping the ontrack events also triggered in the same order...
var updateUserTrackMatches = (peerConnection, userId, roomId, socket) => {
    // try {
    //     var newTrackId = peerConnections[userId].getTransceivers()[0].mid;
    //     socket.to(roomId).emit('userid-trackid-match', userId, newTrackId);
    // } catch (err) {
    //     console.log(err);
    // }
    // for (let otherUserId in peerConnections) {
    //     if (otherUserId != userId) {
    //         var trackId = peerConnections[otherUserId].getTransceivers()[0].mid;
    //         // socket.emit('userid-trackid-match', userId, trackId);
    //     }
    // }
};

// Adds every other user's tracks to a new user, and vice versa
var addTracks = (peerConnections, userId) => {
    for (const otherUserId in peerConnections) {
        if (otherUserId != userId) {
            addUserTrackToDestinationStream(peerConnections, userId, otherUserId);
            addUserTrackToDestinationStream(peerConnections, otherUserId, userId);
        }
    }
}
// The actual function logic that adds a user's track to another user's stream.
// Also sends a notification to the user with (trackId, sourceUser) so the volume can be tuned on client-side
// Note: track ID is not the same on both ends... no idea how we can match each track to the source user on client side.
var addUserTrackToDestinationStream = (peerConnections, sourceUser, destinationUser) => {
    console.log(`Adding user ${sourceUser}'s track to user ${destinationUser}'s stream.`)
    try {
        //peerConnections[destinationUser].addTrack(peerConnections[sourceUser].getReceivers()[0].track);
        if (~areConnected(sourceUser, destinationUser)) {
            peerConnections[destinationUser].addTransceiver(
                peerConnections[sourceUser].getReceivers()[0].track
            );
            audioConnections.push([sourceUser, destinationUser])
        }
        console.log(`Successfully added user ${sourceUser}'s track to user ${destinationUser}'s stream.`);
    } catch (e) {
        console.log(e)
    }
};

// Checks if two clients have already shared tracks

// Handles renegotiation (necessary every time a track is added)
var attachNegotiationEventHandler = async (peerConnection, socket) => {
    peerConnection.onnegotiationneeded = async () => {
        await peerConnection.setLocalDescription(await peerConnection.createOffer());
        socket.emit('webrtc-message', {'description': peerConnection.localDescription});
    }
};

// socket.io server.
io.on('connection', socket => {

    // Notifying all users that a new user joined
    socket.on('user-joined-room', (userId, roomId) => {
        socket.join(roomId);
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

server.listen(1313);