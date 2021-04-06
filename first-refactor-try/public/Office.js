/** 
Class that represents the office space and all its rooms, from the point of view
of a person. Controls the office appearance, the coworkers currently in the
office
**/

import {
    Avatar
} from './Avatar.js'

import {
    BasicAudioController
} from './BasicAudioController.js'



class Office {
    constructor(officeName, person, audioContext, socket) {
        this.officeName = officeName;
        this.person = person;
        this.coworkers = {};
        this.streamId2CoworkerName = {};
        this.socket = socket;
        this.audioController = new BasicAudioController(audioContext);
        this.rooms = [1, 2, 3]; // TODO: actually use
        this.defaultRoom = 1;
        this.activeRoom = undefined;
    }

    addCoworker(coworkerName, x, y, phaserGame) {
        this.coworkers[coworkerName] = {
            avatar: new Avatar("person", "assets/person.png"),
            gainNode: this.audioController.createGain()
        }

        // add phaserGame.load.image(spriteName, fileName) when these are sent
        // by the coworker;
        this.coworkers[coworkerName].avatar.addSprite(phaserGame, x, y)

    }

    updatePosition(coworkerName, x, y) {
        this.coworkers[coworkerName].avatar.setPosition(x, y);
    }

    // TODO: Move to volume controller
    updateGain(coworkerName, x, y) {
        this.audioController.updateGain(this, coworkerName, x, y);
    }

    configureEventHandlers(phaserGame) {

        this.socket.on('new-coworker', (
            coworkerName,
            x,
            y
        ) => {
            this.addCoworker(coworkerName, x, y, phaserGame);
            console.log(`${coworkerName} joined room.`);
        })

        this.socket.on('current-coworkers', data => {
            console.log('Received all coworkers: ', data);
            var self = this;
            Object.keys(data).forEach(function (id) {
                self.addCoworker(data[id].userName, data[id].x, data[id].y, phaserGame);
            })
        })

        this.socket.on('new-position', (coworkerName, x, y) => {
            this.updatePosition(coworkerName, x, y)

            // TODO: replace by volumeController.updateGain ...
            this.updateGain(coworkerName, x, y)
        })

        this.socket.on('streamid-coworkername-match', (streamId, coworkerName) => {
            this.streamId2CoworkerName[streamId] = coworkerName;
        })

        this.socket.on('coworker-left-room', (userName) => {
            this.removeCoworker(userName);
        })
    }

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

    changeActiveRoom(roomId) {
        this.activeRoom = roomId;
    }

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