/*
Client that connects to the e-office server
Requires:
    - a socket to connect to the signalling server;
    - a peerConnection to send audio stream to the office;
    - an avatar for other people to see;

avatar;
peerConnection;
socket;

*/

import {
    ConfiguredPeerConnection
} from './ConfiguredPeerConnection.js';


class Person {
    constructor(userName, socket) {
        this.userName = userName;
        this.sprite = undefined;
        this.socket = socket;

        this.peerConnection = new ConfiguredPeerConnection(
            socket
        );
    }

    getAvatarFilename() {
        console.log("Getting avatar...")
        return "assets/person.png"
    }

    createSprite(phaserGame) {
        this.sprite = phaserGame.physics.add.image(400, 300, 'person')
    }

    getVoice() {
        // returns a Promise
        this.stream = navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
    }

    // Connects to the SFU (selective forwarding unit) WebRTC server.
    async sendVoice() {
        // Adding audio track to WebRTC connection.
        // Triggers the onnegotiationneeded event
        var stream = await this.stream;
        this.peerConnection.addTrack(stream.getTracks()[0]);
    }

    joinRoom(office, roomId) {
        office.setActiveRoom(roomId);

        this.socket.emit(
            'new-coworker',
            this.userName,
            roomId,
            this.sprite.x,
            this.sprite.y
        );
    }

    leaveRoom(office, roomId) {
        this.socket.leave(roomId);
        // TODO: clear streams, clear all office objects
        this.socket.emit('coworker-left-room', this.userName, roomId);
    }

    emitNewPosition(x, y) {
        this.socket.emit('new-position', x, y, this.activeRoom);
    }
}

export {
    Person
};