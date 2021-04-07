import {
    Avatar
} from './Avatar.js';
import {
    ConfiguredPeerConnection
} from './ConfiguredPeerConnection.js';

/** 
Class that represents the local user:
    - interacts with the e-office environment;
    - interacts directly with the signalling server (to send positions or
        join/leave rooms)
    - establishes a WebRTC connection with the server.
**/
class Person {

    /**
     * @param {!userName} string the username.
     * @param {!socket} socket a socket.io socket to communicate with the
     * signalling server.
     */
    constructor(userName, socket) {
        this.userName = userName;
        this.avatar = new Avatar("person", "assets/person.png");
        this.socket = socket;

        this.peerConnection = new ConfiguredPeerConnection(this.socket);
    }

    /**
     * The person's sprite (from its Avatar)
     * @return {Phaser.GameObjects.sprite}
     */
    get sprite() {
        return this.avatar.sprite;
    }

    /**
     * Sets the this.stream attribute to the Promise of audio from the user's
     * microphone (after user grants access).
     */
    getVoice() {
        // returns a Promise
        this.stream = navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
    }

    /**
     * Sends the user's audio track to the server.
     * Triggers WebRTC negotiation.
     */
    async sendVoice() {
        // Adding audio track to WebRTC connection.
        // Triggers the onnegotiationneeded event
        var stream = await this.stream;
        this.peerConnection.addTrack(stream.getTracks()[0]);
    }

    /**
     * Joins a room in the office.
     * Changes active room, reconfigures the ontrackhandler, and emits a
     * "new-coworker" signal for the members of that room.
     * TODO: join only allowed rooms.
     * TODO: do we really need to reconfigure the onTrack handler?
     *       Looks like it could be dynamic already.
     * @param {!office} Office the office where the room is located. 
     * @param {!roomId} number the room ID.
     */
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

    /**
     * Leaves a room.
     * Emits a "coworker-left-room" signal for the members of that room, and
     * clears the office state.
     * TODO: shouldn't need to specify the room ID
     * @param {!office} Office the office where the room is located. 
     * @param {!roomId} number the room ID to leave.
     */
    leaveRoom(office, roomId) {
        this.socket.emit('coworker-left-room', this.userName, roomId);
        office.clearState();
        // Commenting since I'm fairly sure this shouldn't be here, as it
        // should stop the outgoing track (which we don't want - we simply want
        // it to be redirected to the new room).
        // this.peerConnection.stopTransceivers();
    }

    /**
     * Leaves a room.
     * Emits a "coworker-left-room" signal for the members of that room, and
     * clears the office state.
     * TODO: shouldn't need to specify the room ID
     * @param {!x} x the new x position.
     * @param {!y} y the new y position.
     */
    emitNewPosition(x, y) {
        this.socket.emit('new-position', x, y);
    }
}

export {
    Person
};