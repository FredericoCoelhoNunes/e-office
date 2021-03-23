# Description

Simply uses the MediaRecorder API to record slices of audio and send them to the server.
The server saves the slices as webm files.
I misinterpreted how the AudioRecorder worked: I thought each chunk was separately saved, encoded and sent - but apparently, the thing was developed to record a single audio block (so you're supposed to concatenate all the chunks before sending). This means that only the first chunk can be played, because that's where all the encoding information is (whoops).

This experiment and the next is where I concluded that the MediaRecorder API isn't suitable for streaming, and directed my attention somewhere else.