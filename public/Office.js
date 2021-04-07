import {
    Avatar
} from './Avatar.js'

import {
    BasicAudioController
} from './BasicAudioController.js'


/** 
Class that represents the office space and all its rooms, from the point of view
of a person.
Controls the office appearance, the room where the person currently
is in, the coworkers currently in this room (and their positions), and the
matches betwwen the coworkers and the incoming audio streams.
Delegates graphics responsibilities to Avatars and sound management to
AudioControllers.
Only ever keeps track of one room at a time.
**/
class Office {

    /**
     * @param {!officeName} string the name of the office.
     * @param {!person} Person the Person corresponding to the local user.
     * @param {!audioContext} AudioContext an instance of an AudioContext, from
     *      the WebAudioAPI. Passed to the AudioController.
     *      TODO: instantiate the AudioController on the main and pass it here
     *      instead.
     * @param {!socket} socket socket.io socket, to communicate with the
     *      signalling server
     */
    constructor(officeName, person, audioContext, socket) {
        this.officeName = officeName;
        this.person = person;
        this.coworkers = {};
        this.streamId2CoworkerName = {}; // keep track of which stream corresponds to which coworker.
        this.socket = socket;
        this.audioController = new BasicAudioController(audioContext);
        this.rooms = [1, 2, 3]; // TODO: actually use this to structure the office.
        this.defaultRoom = 1;
        this.activeRoom = undefined;
    }

    /**
     * Adds a coworkers to the current room.
     * Creates its avatar at the specified position.
     * @param {!coworkerName} string the name of the coworker.
     * @param {!x} x the x position.
     * @param {!y} y the y position.
     * @param {!phaserGame} phaserGame an instance of a Phaser game that
     *      represents the e-office area. 
     */
    addCoworker(coworkerName, x, y, phaserGame) {
        this.coworkers[coworkerName] = {
            avatar: new Avatar("person", "assets/person.png"),
            gainNode: this.audioController.createGain()
        }

        // add phaserGame.load.image(spriteName, fileName) when these are sent
        // by the coworker;
        this.coworkers[coworkerName].avatar.addSprite(phaserGame, x, y)

    }

    /**
     * Updates the position of one of the coworkers.
     * @param {!coworkerName} string the name of the coworker.
     * @param {!x} x the new x position.
     * @param {!y} y the new y position.
     */
    updatePosition(coworkerName, x, y) {
        this.coworkers[coworkerName].avatar.setPosition(x, y);
    }

    /**
     * Updates the gain for one of the coworkers. Delegated to AudioController.
     * @param {!coworkerName} string the name of the coworker.
     * @param {!x} x the x position of the coworker.
     * @param {!y} y the y position of the coworker.
     */
    updateGain(coworkerName, x, y) {
        this.audioController.updateGain(this, coworkerName, x, y);
    }

    /**
     * Configures the event handlers for managing incoming coworker information
     * such as poisitions or new coworkers joining and leaving.
     * @param {!phaserGame} phaserGame an instance of a Phaser game that
     *      represents the e-office area. 
     */
    configureEventHandlers(phaserGame) {

        // When a new coworker joins.
        this.socket.on('new-coworker', (
            coworkerName,
            x,
            y
        ) => {
            this.addCoworker(coworkerName, x, y, phaserGame);
            console.log(`${coworkerName} joined room.`);
        })

        // Information about all the coworkers currently in the room.
        this.socket.on('current-coworkers', data => {
            console.log('Received all coworkers: ', data);
            var self = this;
            Object.keys(data).forEach(function (id) {
                self.addCoworker(data[id].userName, data[id].x, data[id].y, phaserGame);
            })
        })

        // New position for a coworker.
        this.socket.on('new-position', (coworkerName, x, y) => {
            this.updatePosition(coworkerName, x, y)

            // TODO: replace by volumeController.updateGain ...
            this.updateGain(coworkerName, x, y)
        })

        // New match between a stream ID (relayed from another user to this
        // user by the server) and the respective coworker's name.
        this.socket.on('streamid-coworkername-match', (streamId, coworkerName) => {
            this.streamId2CoworkerName[streamId] = coworkerName;
        })

        // Coworker left the current room.
        this.socket.on('coworker-left-room', (userName) => {
            this.removeCoworker(userName);
        })
    }

    /**
     * Removes all information about a coworker that just left the room.
     * @param {!userName} string the name of the coworker.
     */
    removeCoworker(userName) {
        this.coworkers[userName].avatar.destroySprite();
        delete this.coworkers[userName];

        let streamIds = [];
        for (const [streamId, coworkerName] of Object.entries(this.streamId2CoworkerName)) {
            if (userName == coworkerName) {
                streamIds.push(streamId);
            }
        }

        for (const streamId of streamIds) {
            delete this.streamId2CoworkerName[streamId];
        }
    }

    /**
     * Changes the active room ID.
     * @param {!roomId} number the new room ID.
     */
    changeActiveRoom(roomId) {
        this.activeRoom = roomId;
    }

    /**
     * Clears the state - used when switching rooms.
     */
    clearState() {
        for (const [coworkerName, _] of Object.entries(this.coworkers)) {
            this.removeCoworker(coworkerName)
        }
        this.streamId2CoworkerName = {};
        this.activeRoom = undefined;
    }
}

export {
    Office
};