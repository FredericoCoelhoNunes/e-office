// Connect to socket.io server
const socket = io('localhost:1313');

// audio context to play the sounds
const audioContext = new window.AudioContext();

// STUN configuration: these are free servers provided for example by Google that allow each peer
// to get some ICE candidates
// "An ICE candidate describes the protocols and routing needed for WebRTC to be able to communicate
// with a remote device. When starting a WebRTC peer connection, typically a number of candidates are
// proposed by each end of the connection, until they mutually agree upon one which describes the
// connection they decide will be best. WebRTC then uses that candidate's details to initiate the connection."
const configuration = {
    'iceServers': [
        {
            'urls': [
                'stun:stun.l.google.com:19302',
            ]
        }
    ]
};
const peerConnection = new RTCPeerConnection(configuration);

const USER_ID = Math.floor(Math.random() * 100); 
// ROOM_ID comes from another script on the .ejs file

// Tracks which stream belongs to which user
let userIdStreamIdMatches = {};

// Gain Nodes - tracks the gain nodes corresponding to each stream
let gainNodes = {};

// Gets microphone
var getMedia = async (constraints) => {
    let stream = null;
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
}

// Connects to the SFU (selective forwarding unit) WebRTC server.
var connectToSFUWebRTCServer = async (stream) => {
    // Adding audio track to WebRTC connection.
    // Triggers the onnegotiationneeded event 
    peerConnection.addTrack(stream.getTracks()[0]);    
}

// New user joins a room
socket.on('user-joined-room', userId => {
    console.log(`User ${userId} joined the room.`);
});

// Sending message: joined the server
socket.emit('user-joined-room', USER_ID);

// New userId/trackId match received
socket.on('userid-streamid-match', (userId, streamId) => {
    userIdStreamIdMatches[userId] = streamId;
});

// Listen for local ICE candidates on the local RTCPeerConnection
peerConnection.onicecandidate = ({candidate}) => socket.emit('webrtc-message', {userId: USER_ID, roomId: ROOM_ID, data: {"candidate": candidate}});

// Handles negotiation
peerConnection.onnegotiationneeded = async () => {
    console.log('Starting negotiation.')
    await peerConnection.setLocalDescription(await peerConnection.createOffer());
    socket.emit('webrtc-message', {userId: USER_ID, roomId: ROOM_ID, data: {"description": peerConnection.localDescription}});
    console.log('Sent a WebRTC connection offer to the server.');
}

socket.on('webrtc-message', async ({description, candidate}) => {
    if (description) {
        await peerConnection.setRemoteDescription(description);
        if (description.type == "offer") {
            await peerConnection.setLocalDescription(await peerConnection.createAnswer());
            socket.emit('webrtc-message', {userId: USER_ID, roomId: ROOM_ID, data: {"description": peerConnection.localDescription}});
        }
    } else if (candidate) await peerConnection.addIceCandidate(candidate);
  }
)

// Listen for connectionstatechange on the local RTCPeerConnection
peerConnection.oniceconnectionstatechange = event => {
    if (peerConnection.iceConnectionState === 'connected') {
        console.log('Connected to server!');
    }
};

// Signals when a new track is added.
peerConnection.ontrack = (event) => {
    console.log('Track added from server!');
    console.log(event.streams[0].id)
    var mediaStream = new MediaStream([event.track]);
    var streamSource = audioContext.createMediaStreamSource(mediaStream);
    gainNodes[event.streams[0].id] = audioContext.createGain();
    streamSource.connect(gainNodes[event.streams[0].id]);
    gainNodes[event.streams[0].id].connect(audioContext.destination);
}

// Getting media and connecting to server.
getMedia({audio: true, video: false}).then(
    connectToSFUWebRTCServer
)
console.log(`Welcome to room ${ROOM_ID}. You are user ${USER_ID}.`);
