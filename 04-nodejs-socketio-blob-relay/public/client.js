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
    // Unfortunately, this doesn't work - only the first chunk can be decoded on the other client.
    // The reason why only the 1st chunk works is because all the encoding information is on the first chunk.
    // I assumed is that every chunk was independently saved, encoded and sent (since the onlydataavailable triggers with each chunk),
    // but the MediaRecorder was made with the purpose of creating a single media file, so you're supposed to let it record, then
    // call .stop(), and then concatenate all the chunks collected.
    mediaRecorder.ondataavailable = function(event) {
        var blob = event.data;
        if (blob && blob.size > 0) {
            sendBlobToServer(blob);
        }
    };

    // Record every N milliseconds
    mediaRecorder.start(3000);

    audioCtx = new AudioContext();
});

// Send binary blob to server
var sendBlobToServer = (blob) => {
    console.log(blob)
    socket.emit('new-blob', blob, ROOM_ID, USER_ID);
};


// Processing incoming sounds - doesn't work! See MediaRecorder.ondataavailable above.
socket.on('new-blob', (arrayBuffer, roomId, userId) => {
    
    if (audioCtx) { 
        console.log(j);
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

