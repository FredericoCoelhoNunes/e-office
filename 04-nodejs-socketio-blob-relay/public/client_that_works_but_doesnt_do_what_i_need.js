const socket = io('http://localhost:5500')
console.log(ROOM_ID)

const USER_ID = Math.floor(Math.random() * 100); 

socket.emit('join-room', ROOM_ID , USER_ID)

socket.on('user-connected', userId => {
  console.log('User connected: ' + userId);
})

// Get user microphone
var audioCtx;

navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
    
    // Initialize webm audio recorder 
    var mediaRecorder = new MediaRecorder(stream);

    // Send data to server any time it's available
    // This works! Sends the first blob multiple times. Since the first blob contains the encoding, all its copies play :) 
    mediaRecorder.ondataavailable = function(event) {
        if (mediaRecorder.state != 'inactive') {
            var blobToSend = event.data;
            sendBlobToServer(blobToSend);
            setTimeout(_ => sendBlobToServer(blobToSend), 600);
            setTimeout(_ => sendBlobToServer(blobToSend), 900);
            setTimeout(_ => sendBlobToServer(blobToSend), 1400);
            setTimeout(_ => sendBlobToServer(blobToSend), 1600);
            mediaRecorder.stop();
        }
    }

    // Record every N milliseconds
    mediaRecorder.start(3000);

    audioCtx = new AudioContext();
});

// Send binary blob to server
var sendBlobToServer = (blob) => {
    console.log(blob)
    socket.emit('new-blob', blob, ROOM_ID, USER_ID);
};


// Processing incoming sounds

socket.on('new-blob', (arrayBuffer, roomId, userId) => {
    
    if (audioCtx) { 
        console.log(`Got a new blob from user ${userId} on room ${roomId}`);

        // Debug
        console.log(audioCtx);
        var v = new Int8Array(arrayBuffer);
        console.log(v);
        //

        audioCtx.decodeAudioData(arrayBuffer).then(data => {
            var source = audioCtx.createBufferSource();
            source.buffer = data;
            source.connect(audioCtx.destination);
            source.start(0);
            console.log('success!');
        });
    };
})