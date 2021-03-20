// Get user microphone
navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
    
    // Initialize webm audio recorder 
    var mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm'});

    // Send data to server any time it's available
    mediaRecorder.ondataavailable = function(event) {
        var blob = event.data;
        if (blob && blob.size > 0) {
            sendBlobToServer(blob);
        }
    };

    // Record every N seconds
    mediaRecorder.start(5000);
})

// Send binary blob to server
let sendBlobToServer = (blob) => {
    const http = new XMLHttpRequest();
    console.log(blob);
    http.onreadystatechange = (e) => {
        console.log(http.responseText);
    }
    const url='http://localhost:1337';
    http.open("POST", url);
    http.send(blob);
};
