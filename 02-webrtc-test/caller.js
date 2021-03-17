// Creates a media stream from the user's audio - https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API
async function getMedia(constraints) {
    let stream = null;
  
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch(err) {
      console.log("getUserMedia not suppported in your browser")
    }
  }

// Connect to signalling server (socket.io)
const socket = io("http://127.0.0.1:5000/");


//
const configuration = {'iceServers': [
    {'urls': [
        'stun:stun.l.google.com:19302',
    ]
    }
]};
const peerConnection = new RTCPeerConnection(configuration);

async function getMedia(constraints) {
    let stream = null;
  
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch(err) {
      console.log("getUserMedia not suppported in your browser")
    }
}

async function makeCall(stream) {
    socket.on('answer', async message => {
        if (message.answer) {
            console.log('Got answer.');
            const remoteDesc = new RTCSessionDescription(message.answer);
            await peerConnection.setRemoteDescription(remoteDesc);
        }
    });

    peerConnection.addTrack(stream.getTracks()[0]);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', {'offer': offer});
    console.log('sent an offer');
}

// Listen for local ICE candidates on the local RTCPeerConnection
peerConnection.onicecandidate = event => {
    if (event.candidate) {
        console.log('Got new local ICE candidate');
        socket.emit('new_ice_candidate', {'candidate': event.candidate});
    }
};

// Listen for remote ICE candidates and add them to the local RTCPeerConnection
socket.on('received_ice_candidate', async message => {
    if (message.candidate) {
        try {
            console.log('Got new remote ICE candidate');
            await peerConnection.addIceCandidate(message.candidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});

// Listen for connectionstatechange on the local RTCPeerConnection
peerConnection.oniceconnectionstatechange = event => {
    if (peerConnection.connectionState === 'connected') {
        console.log('Ta-dah!');
    }
};

getMedia({ audio: true, video: false }).then(makeCall);