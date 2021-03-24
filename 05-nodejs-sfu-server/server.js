// TODO
//   - separate addStreams logic by room
//   - Figure this out: 
//       - addTrack triggers renegotiation.
//       - Renegotiation (on success) triggers onicestatechange.
//       - onicestatechange triggers addTrack (etc.). 

// Test: records audio stream as an mp3
// const { PassThrough } = require('stream')
// const { RTCAudioSink, RTCVideoSink } = require('wrtc').nonstandard;
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpeg = require('fluent-ffmpeg');
// ffmpeg.setFfmpegPath(ffmpegPath);
// const { StreamInput } = require('fluent-ffmpeg-multistream')

// const stream = {
//     recordPath: './recording.mp3',
//     audio: new PassThrough()
// };

// const onAudioData = ({ samples: { buffer } }) => {
//     console.log('got some audio data')
//     if (!stream.end) {
//         stream.audio.push(Buffer.from(buffer));
//     }
// };
//

const wapi = require('web-audio-api');  
const util = require('util')

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
var addPeerConnection = (userId, socket) => {
    console.log(`Adding peer connection for user ${userId}`);
    peerConnections[userId] = new wrtc.RTCPeerConnection(configuration);
    
    attachNegotiationEventHandler(peerConnections[userId], socket)
    attachOnIceCandidateEventHandler(peerConnections[userId], socket);
    attachOnSuccessfulConnectionEventHandler(peerConnections[userId], userId, socket);
};


// Attaches event handler for the onicecandidate event
var attachOnIceCandidateEventHandler = (peerConnection, socket) => {
    peerConnection.onicecandidate = ({candidate}) => socket.emit('webrtc-message', {candidate});
}


// Whenever a new connection is successful, we want to direct all streams from other users to it,
// as well as direct its stream to other users.
var attachOnSuccessfulConnectionEventHandler = (peerConnection, userId, socket) => {
    peerConnection.oniceconnectionstatechange = event => {
        if (peerConnection.iceConnectionState === 'connected') {
            console.log(`User ${userId} successfully connected!`);

            // This is what I want: adding each user's tracks to each other's peer connection's with the server.
            addTracks(peerConnections, userId);

            // Test: this records the audio from 1 client as local mp3 file. Just to make sure the server is receiving the stream.
            // var track = peerConnections[userId].getReceivers()[0].track;
            // const audioSink = new RTCAudioSink(track);
            // audioSink.addEventListener('data', onAudioData);
            // stream.audio.on('end', () => {
            //     audioSink.removeEventListener('data', onAudioData);
            // });

            // stream.proc = ffmpeg()
            //     .addInput((new StreamInput(stream.audio)).url)
            //     .addInputOptions([
            //         '-f s16le',
            //         '-ar 48k',
            //         '-ac 1',
            //         ])
            //     .on('start', ()=>{
            //         console.log('Start recording >> ', stream.recordPath)
            //     })
            //     .on('end', ()=>{
            //         stream.recordEnd = true;
            //         console.log('Stop recording >> ', stream.recordPath)
            //     })
            //     .output(stream.recordPath);

            // stream.proc.run();
            //
        }
    }
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
// The actual function logic that adds a user's track to another user's stream
var addUserTrackToDestinationStream = (peerConnections, sourceUser, destinationUser) => {
    console.log(`Adding user ${sourceUser}'s track to user ${destinationUser}'s stream.`)
    try {
        peerConnections[destinationUser].addTrack(peerConnections[sourceUser].getReceivers()[0].track);
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

    // Notifying all users that a new user joined
    socket.on('user-joined-room', (userId, roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined-room', userId);
        addPeerConnection(userId, socket);
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