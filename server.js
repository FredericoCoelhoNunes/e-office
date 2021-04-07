const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server); // all Websockets conections start with an HTTP request :-) 
const wrtc = require("wrtc");

app.set('view engine', 'ejs');
app.use(express.static("public"))

// To store info about users that joined
let roomData = {}; // information for users in each room.
let usersCurrentRoom = {}; // helper variable to keep track of users' current room.
let peerConnections = {}; // stores currently opened WebRTC peer connections.

// Configuration of the STUN server used to get WebRTC ICE candidates.
const configuration = {
    'iceServers': [{
        'urls': [
            'stun:stun.l.google.com:19302',
        ]
    }]
};


// Route for each office.
app.get('/:office', (req, res) => {
    res.render('office.ejs', {
        office: req.params.office
    })
})


/**
 * Adds a peerConnection for a user that joined, and configures all handlers.
 * @param {!userData} object the user's data, contained in roomData[userId].
 * @param {!userId} string the user's unique ID for this session (socket.id).
 * @param {!roomId} number the id of the room the user is connected to.
 */
var addPeerConnection = (userData, userId, roomId) => {
    console.log(`Adding peer connection for user ${userData.userName}`);
    peerConnections[userId] = new wrtc.RTCPeerConnection(configuration);

    attachNegotiationEventHandler(peerConnections[userId], userData.socket)
    attachOnIceCandidateEventHandler(peerConnections[userId], userData.socket);
    attachOnSuccessfulConnectionEventHandler(peerConnections[userId], userData.userName);
    attachOnTrackEventHandler(userData, userId, roomId);
};


/**
 * Attaches event handler for the onicecandidate event to a peer connection.
 * @param {!peerConnection} wrtc.RTCPeerConnection A Web RTC peer connection.
 * @param {!socket} socket A socket.io socket.
 */
var attachOnIceCandidateEventHandler = (peerConnection, socket) => {
    peerConnection.onicecandidate = ({
        candidate
    }) => socket.emit('webrtc-message', {
        candidate
    });
}


/**
 * Attaches event handler for the successful connection event to a peer
 * connection.
 * @param {!peerConnection} wrtc.RTCPeerConnection A Web RTC peer connection.
 * @param {!userId} number the user unique ID for this session (socket.id)
 */
var attachOnSuccessfulConnectionEventHandler = (peerConnection, userId) => {
    peerConnection.oniceconnectionstatechange = event => {
        if (peerConnection.iceConnectionState === 'connected') {
            console.log(`User ${userId} successfully connected!`);
        }
    }
};

/**
 * Used when a new track arrives from a user. Steps:
 *      - takes the incoming track, and for each other user in the room, creates
 *        a stream and adds it to their peer connection.
 *      - takes the tracks for all other users in the room, and adds it to the
 *        new user's peer connection.
 *      - sends updates to the clients for all the new (userName, streamId)
 *        matches.
 * @param {!roomData} object data for all users in the room.
 * @param {!userData} object data for the new user.
 * @param {!userId} number the user unique ID for this session (socket.id)
 * @param {!roomId} roomId the room that the user just joined.
 */
var addTracksAndUpdateUserNameStreamIdMatches = (roomData, userData, userId, roomId) => {
    // Adding each user's tracks to each other's peer connection's with the server.
    userNameStreamIdMatches = addTracks(roomData, userData, userId, roomId);
    // Update all users's (trackId,userId) matches
    updateUserNameStreamIdMatches(roomId, userNameStreamIdMatches);
}

/**
 * Attaches on track event handler - what to do when a new track arrives - to a
 * user's peer connection.
 * @param {!userData} object data for the new user.
 * @param {!userId} number the user unique ID for this session (socket.id)
 * @param {!roomId} roomId the room that the user just joined.
 */
var attachOnTrackEventHandler = (userData, userId, roomId) => {
    peerConnections[userId].ontrack = (event) => {
        addTracksAndUpdateUserNameStreamIdMatches(roomData, userData, userId, roomId);
    }

}

/**
 * Emits new matches of (streamId, sourceUserId) that were created when new
 * tracks were added to the different peer connections, for all users in a room.
 * @param {!roomId} number the ID of the room.
 * @param {!userIdStreamIdMatches} array an array of objects with keys userId 
 *      (the user the needs to be informed that a certain stream ID belongs to
 *       a specific coworker), sourceUser (the userName of the coworker), and
 *      streamId (the ID of the stream that the user will receive). 
 */
var updateUserNameStreamIdMatches = (roomId, userIdStreamIdMatches) => {
    for (var {
            userId,
            sourceUser,
            streamId
        } of userIdStreamIdMatches) {
        roomData[roomId][userId].socket.emit('streamid-coworkername-match', streamId, sourceUser);
    }
};

/**
 * Adds every other user's tracks to a new user's peerConnection, and vice
 * versa, for all users in the same room. Keeps a record of all new
 * (userName, streamId matches that were formed).
 * @param {!roomData} object data for all users in the room.
 * @param {!userData} object data for the new user.
 * @param {!userId} number the user unique ID for this session (socket.id)
 * @param {!roomId} roomId the room that the user just joined.
 */
var addTracks = (roomData, userData, userId, roomId) => {
    let userNameStreamIdMatches = [];
    let streamId;
    for (const [otherUserId, otherUserData] of Object.entries(roomData[roomId])) {

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

/**
 * The actual function logic that adds a user's track to another user's peer
 * connection.
 * @param {!roomData} object data for all users in the room.
 * @param {!userData} object data for the new user.
 * @param {!userId} number the user unique ID for this session (socket.id)
 * @param {!roomId} roomId the room that the user just joined.
 */
var addUserTrackToDestinationStream = (sourceUserData, destinationUserData) => {
    console.log(`Adding user ${sourceUserData.userName}'s track to user ${destinationUserData.userName}'s stream.`)
    try {
        var stream = new wrtc.MediaStream();
        var streamId = stream.id;

        // TODO: Not sure if this is a good way to do it, but I forcing each
        // track to be on an individual stream. This is because stream.id was
        // the ONLY id I could find that is common on both ends of the
        // connection, which allows us to match sound with user on the
        // receiving client-side.
        var outgoingTransceiver = peerConnections[destinationUserData.socket.id].addTransceiver(
            peerConnections[sourceUserData.socket.id].getReceivers()[0].track, {
                streams: [stream]
            }
        );

        sourceUserData.outgoingTransceivers[destinationUserData.userName] = outgoingTransceiver;

        return streamId
    } catch (e) {
        console.log('Error: ', e)
    }
};

/**
 * Attaches WebRTC renegotiation event handler to a user's peer connection.
 * @param {!peerConnection} wrtc.RTCPeerConnection A Web RTC peer connection.
 * @param {!socket} socket A socket.io socket.
 */
var attachNegotiationEventHandler = async (peerConnection, socket) => {
    peerConnection.onnegotiationneeded = async () => {
        await peerConnection.setLocalDescription(await peerConnection.createOffer());
        socket.emit('webrtc-message', {
            'description': peerConnection.localDescription
        });
    }
};

/**
 * Gets information about a user's current coworkers from it's room's data.
 * @param {!roomData} object data for all users in the room.
 * @param {!userId} number the user unique ID for this session (socket.id)
 * @param {!roomId} roomId the room that the user just joined.
 */
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

/**
 * Deletes a user's data from the stream. Only deletes ephemeral data (not the 
 * peerConnection, for example, as we want to re-use it between rooms)
 * @param {!socket} socket A socket.io socket.
 * @param {!userName} string the user's name.
 * @param {!roomId} roomId the room that the user just joined.
 */
var deleteUserData = (socket, userName, roomId) => {
    socket.to(roomId).emit('coworker-left-room', userName);
    socket.leave(roomId);

    for (let [_, tr] of Object.entries(roomData[roomId][socket.id].outgoingTransceivers)) {
        tr.stop();
    }

    // deleting outgoing transceivers from other users directed at the user that is leaving
    for (const [otherUserName, otherUserData] of Object.entries(roomData[roomId])) {
        if (otherUserName != userName) {
            let found = false;
            for (let [destinationUsername, tr] of Object.entries(otherUserData.outgoingTransceivers)) {
                if (destinationUsername == userName) {
                    found = true;
                    tr.stop();
                }
            }
            if (found) {
                delete otherUserData.outgoingTransceivers[userName];
            }
        }
    }

    delete roomData[roomId][socket.id];
    delete usersCurrentRoom[socket.id];
}

// The socket.io signalling server.
io.on('connection', socket => {

    // What to do when a new coworker joins a room:
    //  - take note of it's current room.
    //  - create room data object if it doesn't exist.
    //  - add user data.
    //  - add peer connection for the user if it doesn't exist (i.e. if user
    //    is just now connecting and not only switching rooms)
    //  - emit "new-coworker" to other people in the room
    //  - emit all coworkers' information to the newly joined user.
    //  - if user had already sent in its audio track (i.e. if he had previously
    //    been connected to another room in this session)) simply run the track 
    //    "redistribution" function
    socket.on('new-coworker', (userName, roomId, x, y) => {
        console.log(`${userName} joined. (socket id is ${socket.id})`)
        socket.join(roomId);
        usersCurrentRoom[socket.id] = roomId;

        if (!(roomId in roomData)) {
            roomData[roomId] = {};
        }

        roomData[roomId][socket.id] = {
            userName,
            x,
            y,
            socket,
            "outgoingTransceivers": {}
        }

        if (!peerConnections[socket.id]) {
            addPeerConnection(roomData[roomId][socket.id], socket.id, roomId);
        }
        socket.to(roomId).emit('new-coworker', userName, x, y);

        var currentCoworkers = getCurrentCoworkers(roomData, socket.id, roomId);

        console.log('Sending current coworkers: ', currentCoworkers);
        socket.emit('current-coworkers', currentCoworkers);

        // If this user is coming from another room, that means his track is
        // already being sent. Which means we just have to redirect it :)
        // Try catch is because if you leave/join room too fast, sometimes it
        // crashes on the server side =(
        try {
            if (peerConnections[socket.id].getReceivers().length >= 1) {
                console.log("Resending track")
                addTracksAndUpdateUserNameStreamIdMatches(
                    roomData,
                    roomData[roomId][socket.id],
                    socket.id,
                    roomId
                )
            }
        } catch (e) {
            console.log(e)
        }
    });

    // Inform other users in a room of a coworker's new position.
    socket.on('new-position', (x, y) => {
        var roomId = usersCurrentRoom[socket.id]
        if (roomId) {
            roomData[roomId][socket.id].x = x;
            roomData[roomId][socket.id].y = y;
            socket.to(roomId).emit('new-position', roomData[roomId][socket.id].userName, x, y);
        }
    })

    // WebRTC offer/answer/incoming ICE candidate handling.
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

    // When a user leaves a room, delete its data and inform its coworkers.
    socket.on('coworker-left-room', (userName, roomId) => deleteUserData(socket, userName, roomId));

    socket.on('disconnect', () => {
        roomId = usersCurrentRoom[socket.id];
        if (roomId) {
            userName = roomData[roomId][socket.id].userName;
            deleteUserData(socket, userName, roomId);
        }
        delete peerConnections[socket.id];
    });


})

function logEverything() {
    console.log(roomData);
    for (const [k1, v1] of Object.entries(roomData)) {
        for (const [k2, v2] of Object.entries(v1)) {
            console.log(v2.outgoingTransceivers)
            for ([userName, tr] of Object.entries(v2.outgoingTransceivers)) {
                console.log(userName, ' -- Stopped: ', tr.stopped);
            }
        }
    }
    console.log(usersCurrentRoom);
    console.log(peerConnections);
}

server.listen(5500);