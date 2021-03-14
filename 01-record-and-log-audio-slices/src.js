console.log("Testing audio recording.")


// Creates a media stream from the user's audio - https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API
async function getMedia(constraints) {
    let stream = null;
  
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('got stream')
      return stream;
    } catch(err) {
      console.log("getUserMedia not suppported in your browser")
    }
  }


/* getMedia: returns a promise of an audio stream; "then" when the stream is ready, does the following:
    * instantiates a mediaRecorder for this user;
    * attaches an event handler to the mediaRecorder, for the ondataavailable event ("The dataavailable event is fired when the MediaRecorder delivers media data to your application for its use. The data is provided in a Blob object that contains the data".)
        * this event handler extracts the data from the Blob that was just made available, and logs it to the console 
    * start recording slices of 1000ms of data
*/
getMedia({ audio: true, video: false }).then(
    function(mediaStream) {

        var mediaRecorder = new MediaRecorder(mediaStream);

        mediaRecorder.ondataavailable = function(event) {
            var blob = event.data;
            blob.text().then(function(d) {
                console.log(d);
            });
        };

        mediaRecorder.start(1000);
    }
);

// Just to prove that everything keeps working while the MediaRecorder does its thing
for(let i = 0; i <= 100; i++) {
    setTimeout(
        () => {
            console.log(i);
        },  
        i*100
    )
}
     