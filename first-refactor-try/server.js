const {
    SSL_OP_NO_TICKET
} = require('constants');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server); // all Websockets conections start with an HTTP request :-) 
const wrtc = require("wrtc");

app.set('view engine', 'ejs');
app.use(express.static("public"))

// To store info about players that joined
let roomData = {};
let usersCurrentRoom = {}; // just a helper variable to keep track of users current rooms.
let peerConnections = {};

// STUN server configuration
const configuration = {
    'iceServers': [{
        'urls': [
            'stun:stun.l.google.com:19302',
        ]
    }]
};


// Renders a office.
app.get('/:office', (req, res) => {
    res.render('office.ejs', {
        office: req.params.office
    })
})


// Function to add a new peer connection with a client.
var addPeerConnection = (userData, userId, roomId) => {
    console.log(`Adding peer connection for user ${userData.userName}`);
    peerConnections[userId] = new wrtc.RTCPeerConnection(configuration);

    attachNegotiationEventHandler(peerConnections[userId], userData.socket)
    attachOnIceCandidateEventHandler(peerConnections[userId], userData.socket);
    attachOnSuccessfulConnectionEventHandler(peerConnections[userId], userData.userName);
    attachOnTrackEventHandler(userData, userId, roomId);
};


// Attaches event handler for the onicecandidate event
var attachOnIceCandidateEventHandler = (peerConnection, socket) => {
    peerConnection.onicecandidate = ({
        candidate
    }) => socket.emit('webrtc-message', {
        candidate
    });
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
var attachOnTrackEventHandler = (userData, userId, roomId) => {
    peerConnections[userId].ontrack = event => {
        // Adding each user's tracks to each other's peer connection's with the server.
        userNameStreamIdMatches = addTracks(roomData, userData, userId, roomId);
        // Update all users's (trackId,userId) matches
        updateUserNameStreamIdMatches(roomId, userNameStreamIdMatches);
    }
}

// Update all matches of (userId, transceiverMid). Can't use trackId as it is not the same on both ends.
// Transciever Mid seems to be guaranteed to keep the order in which it was added.
var updateUserNameStreamIdMatches = (roomId, userIdStreamIdMatches) => {
    for (var {
            userId,
            sourceUser,
            streamId
        } of userIdStreamIdMatches) {
        roomData[roomId][userId].socket.emit('streamid-coworkername-match', streamId, sourceUser);
    }
};

// Adds every other user's tracks to a new user, and vice versa (for users in the same room)
var addTracks = (roomData, userData, userId, roomId) => {
    let userNameStreamIdMatches = [];
    let streamId;
    for (const [otherUserId, otherUserData] of Object.entries(roomData[roomId])) {

        // console.log('\n\n\nRoom data:', roomData);
        // console.log('\n\n\nuserData:', userData);
        // console.log('\n\n\notherUserData:', otherUserData);
        // console.log('\n\n\n roomId:', roomId)
        // console.log('\n\n\n otherUserId:', otherUserId)

        if (otherUserData.userName != userData.userName) {
            streamId = addUserTrackToDestinationStream(userData, otherUserData);
            if (streamId) userNameStreamIdMatches.push({
                "userId": otherUserId,
                "sourceUser": userData.userName,
                "streamId": streamId
            }); // this means: on the "user" client, the stream that comes from "sourceUser" has ID "streamId"

            streamId = addUserTrackToDestinationStream(otherUserData, userData);
            if (streamId) userNameStreamIdMatches.push({
                "userId": userId,
                "sourceUser": otherUserData.userName,
                "streamId": streamId
            });
        }
    }
    return userNameStreamIdMatches
}
// The actual function logic that adds a user's track to another user's stream.
// Also sends a notification to the user with (trackId, sourceUser) so the volume can be tuned on client-side
var addUserTrackToDestinationStream = (sourceUserData, destinationUserData) => {
    console.log(`Adding user ${sourceUserData.userName}'s track to user ${destinationUserData.userName}'s stream.`)
    try {
        var stream = new wrtc.MediaStream();
        var streamId = stream.id;

        // TODO: Not sure if this is a good way to do it, but I am trying to force each track to be on an individual stream.
        // This is because stream.id was the ONLY id I could find that is common between peers.
        // If there's a way to do this with addTrack only, would be better.
        outgoingTransceiver = peerConnections[destinationUserData.socket.id].addTransceiver(
            peerConnections[sourceUserData.socket.id].getReceivers()[0].track, {
                streams: [stream]
            }
        );

        sourceUserData.outgoingTransceivers.push(outgoingTransceiver);

        return streamId
    } catch (e) {
        console.log('Error: ', e)
    }
};

// Handles renegotiation (necessary every time a track is added)
var attachNegotiationEventHandler = async (peerConnection, socket) => {
    peerConnection.onnegotiationneeded = async () => {
        await peerConnection.setLocalDescription(await peerConnection.createOffer());
        socket.emit('webrtc-message', {
            'description': peerConnection.localDescription
        });
    }
};

var getCurrentCoworkers = (roomData, userId, roomId) => {
    let currentCoworkers = {};
    for (const [otherUserId, userData] of Object.entries(roomData[roomId])) {
        if (otherUserId != userId) {
            currentCoworkers[otherUserId] = {
                userName: userData.userName,
                x: userData.x,
                y: userData.y
            };
        }
    }

    return currentCoworkers
}

var deleteUserData = (userName, roomId) => {
    socket.to(roomId).emit('coworker-left-room', userName);
    roomData[roomId][socket.id].outgoingTransceivers.forEach(tr => tr.stop());
    delete roomData[roomId][socket.id];
    delete usersCurrentRoom[socket.id];
}

// socket.io server.
io.on('connection', socket => {

    //socket.emit('current-players', players);

    socket.on('new-coworker', (userName, roomId, x, y) => {
        console.log(`${userName} joined. (socket id is ${socket.id})`)
        socket.join(roomId);
        usersCurrentRoom[socket.id] = roomId;

        if (!(roomId in roomData)) {
            console.log(`Empty room ${roomId}`)
            roomData[roomId] = {};
        }

        roomData[roomId][socket.id] = {
            userName,
            x,
            y,
            socket,
            "outgoingTransceivers" : []
        }

        addPeerConnection(roomData[roomId][socket.id], socket.id, roomId);
        socket.to(roomId).emit('new-coworker', userName, x, y);

        var currentCoworkers = getCurrentCoworkers(roomData, socket.id, roomId);

        console.log('Sending current coworkers: ', currentCoworkers);
        socket.emit('current-coworkers', currentCoworkers);
    });

    socket.on('new-position', (x, y, roomId) => {
        try {
            roomData[roomId][socket.id].x = x;
            roomData[roomId][socket.id].y = y;
            socket.to(roomId).emit('new-position', roomData[roomId][socket.id].userName, x, y);
        } catch (e) {
            console.log('Error: ', e);
        }
    })

    // Connecting to client
    socket.on('webrtc-message', async ({
        data
    }) => {
        var userPeerConnection = peerConnections[socket.id];
        if (data.description) {
            await userPeerConnection.setRemoteDescription(data.description);
            if (data.description.type == "offer") {
                await userPeerConnection.setLocalDescription(await userPeerConnection.createAnswer());
                socket.emit('webrtc-message', {
                    description: userPeerConnection.localDescription
                });
            }
        } else if (data.candidate && data.candidate.candidate != "") await userPeerConnection.addIceCandidate(data.candidate);
    });

    socket.on('coworker-left-room', deleteUserData);
    
    socket.on('disconnect', () => {
        roomId = usersCurrentRoom[socket.id];
        if (roomId) {
            userName = roomData[roomId][socket.id].userName;
            deleteUserData(userName, roomId);
        }
        delete peerConnections[socket.id];
    });
    

})

server.listen(5500);