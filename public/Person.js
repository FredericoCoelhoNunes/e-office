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
    Avatar
} from './Avatar.js';
import {
    ConfiguredPeerConnection
} from './ConfiguredPeerConnection.js';


class Person {
    constructor(userName, socket) {
        this.userName = userName;
        this.avatar = new Avatar("person", "assets/person.png");
        this.socket = socket;

        this.peerConnection = new ConfiguredPeerConnection(this.socket);
    }

    get sprite() {
        return this.avatar.sprite;
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
        office.changeActiveRoom(roomId);

        this.peerConnection.configureOnTrackHandler(
            self.office.coworkers,
            self.office.streamId2CoworkerName,
            self.office.audioController
        );

        this.socket.emit(
            'new-coworker',
            this.userName,
            roomId,
            this.avatar.x,
            this.avatar.y
        );
    }

    leaveRoom(office, roomId) {
        this.socket.emit('coworker-left-room', this.userName, roomId);
        office.clearState();
        this.peerConnection.stopTransceivers();
    }

    emitNewPosition(x, y) {
        this.socket.emit('new-position', x, y);
    }
}

export {
    Person
};