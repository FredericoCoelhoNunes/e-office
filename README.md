# E-Office

A virtual environment to interact with your coworkers!

## Requirements

- Must use Firefox
- Give permissions for the browser to access your microphone, when prompted!

## General Architecture

- Client uses:
    - WebRTC to connect to an audio relay server which follow an SFU (selective forwarding unit) architecture. This server decides what users to route which audio streams to (for example: only users in the same office area).
    - Phaser to render the office area and allow moving the user's avatar around.
    - Web Audio API to direct the audio coming from the server to the user's headphones, and to adjust the audio gains based on the distance to the other user's avatars.
    - socket.io to connect to the signalling server.
- Server uses:
    - wrtc (which is a Node implementation of WebRTC) so it can be treated as a WebRTC peer, which facilitates the implementation of the relay functionalities.
    - socket.io to serve as a multipurpose server: for signalling (WebRTC) and for the users to communicate their positions, among other information.

## Files

`public/main.js` is the entrypoint. Check class comments for brief descriptions of the difference objects and how they interact. 