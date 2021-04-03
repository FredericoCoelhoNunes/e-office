/*
class Office():
    "Office, from the point of view of a person".

    person;
    co-workers;  # list of avatars?
    streams;

*/

class Office {
    constructor(officeName, person, audioContext, socket) {
        this.officeName = officeName;
        this.person = person;
        this.coworkers = {};
        this.streamId2CoworkerName = {};
        this.socket = socket;
        this.audioContext = audioContext;
        this.rooms = [1, 2, 3]; // TODO: actually use
        this.defaultRoom = 1;
        this.activeRoom = undefined;
    }

    addCoworker(coworkerName, x, y, phaserGame) {
        console.log("Adding coworker to office room")
        this.coworkers[coworkerName] = {
            sprite: phaserGame.add.sprite(x, y, 'person').setOrigin(0.5, 0.5),
            gainNode: this.audioContext.createGain()
        }
        this.coworkers[coworkerName].sprite.setScale(0.2);
    }

    updatePosition(coworkerName, x, y) {
        console.log(this.coworkers);
        console.log(coworkerName);
        this.coworkers[coworkerName].sprite.setPosition(x, y);
    }

    // TODO: Move to volume controller
    updateGain(coworkerName, x, y) {

        let newVal = this.calculateGain(this.person.sprite.x, this.person.sprite.y, x, y);

        console.log(`New gain for user ${coworkerName} is ${newVal}`)
        try {
            this.coworkers[coworkerName].gainNode.gain.value = newVal;
        } catch (e) {
            console.log(e);
            console.log(userIdStreamIdMatches);
            console.log(gainNodes);
        }
    }

    // TODO: Move to volume controller
    calculateGain(x1, y1, x2, y2) {
        // Assuming gain = 1 is when position coincide, gain = 0 is for >100 units
        let distance = this.getDistance(x1, y1, x2, y2)
        let newGain;

        newGain = 1 / (1 + distance / 10) // todo: fix this! sometimes newGain > 1?!
        return newGain
    }

    getDistance(x1, y1, x2, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        var distance = Math.sqrt(a * a + b * b);
        return distance
    };


    configureEventHandlers(phaserGame) {

        // socket.on('user-joined-room', userId => {
        //     console.log(`User ${userId} joined the room.`);
        // });

        this.socket.on('new-coworker', (
            coworkerName,
            x,
            y
        ) => {
            this.addCoworker(coworkerName, x, y, phaserGame);
            console.log(`${coworkerName} joined room.`);
        })

        this.socket.on('current-coworkers', data => {
            console.log('received all coworkers: ', data);
            var self = this;
            Object.keys(data).forEach(function (id) {
                // TODO: check if keys match
                console.log(data);
                self.addCoworker(data[id].userName, data[id].x, data[id].y, phaserGame);
                console.log(`Added ${data[id].userName}.`)
            })
        })

        this.socket.on('new-position', (coworkerName, x, y) => {
            console.log('received new position')
            this.updatePosition(coworkerName, x, y)

            // TODO: replace by volumeController.updateGain ...
            this.updateGain(coworkerName, x, y)
        })

        this.socket.on('streamid-coworkername-match', (streamId, coworkerName) => {
            this.streamId2CoworkerName[streamId] = coworkerName;
        })
    }

    emitNewPosition(x, y) {
        this.socket.emit('new-position', x, y, this.activeRoom);
    }

    setActiveRoom(roomId) {
        this.activeRoom = roomId;
    }
}

export {
    Office
};