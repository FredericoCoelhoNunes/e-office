// Connect to socket.io server
const socket = io('localhost:1313');


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


var getMedia = async (constraints) => {
    let stream = null;
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
}

// Connects to the SFU (selective forwarding unit) WebRTC server.
var connectToSFUWebRTCServer = async (stream) => {

    // When the server answer, set remote session description.
    socket.on('server-webrtc-answer', async message => {
        if (message.answer) {
            console.log('Got server WebRTC answer. Setting remote session description.');
            const remoteDesc = new RTCSessionDescription(message.answer);
            await peerConnection.setRemoteDescription(remoteDesc);
        }
    });

    // Adding audio track to WebRTC connection.
    peerConnection.addTrack(stream.getTracks()[0]);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('client-webrtc-offer', USER_ID, ROOM_ID, {'offer': offer});
    console.log('Sent a WebRTC connection offer to the server.');
}

// Listen for local ICE candidates on the local RTCPeerConnection
peerConnection.onicecandidate = event => {
    if (event.candidate) {
        console.log('Got new local ICE candidate. Sending to server.');
        socket.emit('client-new-ice-candidate', USER_ID, ROOM_ID, {'candidate': event.candidate});
    }
};

// Listen for remote ICE candidates and add them to the local RTCPeerConnection
socket.on('server-new-ice-candidate', async message => {
    if (message.candidate) {
        try {
            console.log('Got new server ICE candidate.');
            await peerConnection.addIceCandidate(message.candidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});

// Listen for connectionstatechange on the local RTCPeerConnection
peerConnection.oniceconnectionstatechange = event => {
    if (peerConnection.iceConnectionState === 'connected') {
        console.log('Connected to server!');
    }
};


getMedia({audio: true, video: false}).then(
    connectToSFUWebRTCServer
)

console.log(`Welcome to room ${ROOM_ID}. You are user ${USER_ID}.`);

    