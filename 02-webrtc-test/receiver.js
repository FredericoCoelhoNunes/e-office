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

socket.on('offer', async message => {
    console.log('Got offer.');
    if (message.offer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', {'answer': answer});
    }
});

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
        console.log('Got new remote ICE candidate');
        try {
            await peerConnection.addIceCandidate(message.candidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});

// Listen for connectionstatechange on the local RTCPeerConnection
peerConnection.oniceconnectionstatechange = event => {
    if (peerConnection.iceConnectionState === 'connected') {
        console.log('Ta-dah!');

        var mediaStream = new MediaStream([peerConnection.getReceivers()[0].track]);
        
        // Recording the media stream
        // var mediaRecorder = new MediaRecorder(mediaStream);

        // mediaRecorder.ondataavailable = function(event) {
        //     var blob = event.data;
        //     blob.text().then(function(d) {
        //         console.log(d);
        //     });
        // };

        // mediaRecorder.start(1000);

        // Playing the stream
        const audioContext = new window.AudioContext();
        var streamSource = audioContext.createMediaStreamSource(mediaStream);
        streamSource.connect(audioContext.destination);
    }
};

// Listen for connectionstatechange on the local RTCPeerConnection
peerConnection.ontrack = event => {
    console.log('received track')
};


