/*
class Office():
    "Office, from the point of view of a person".

    person;
    co-workers;  # list of avatars?
    streams;

*/

class Office {
    constructor(officeName, person, audioContext) {
        this.officeName = officeName;
        this.person = person;
        this.coworkers = {};
        //this.userIdStreamIdMatches = {};
        //this.gainNodes = {};
        this.audioContext = audioContext;

        this.person.conn.configureOnTrackHandler(this);
    }

    addCoworker(coworkerName, x, y, phaserGame) {
        console.log("Adding coworker to office room")
        this.coworkers[coworkerName] = {
            sprite: phaserGame.add.sprite('person').setOrigin(0.5, 0.5),
            x,
            y,
            gainNode: undefined
        }
    }

    updatePosition(coworkerName, x, y) {
        this.coworkers[coworkerName].x = x;
        this.coworkers[coworkerName].y = y;
        this.coworkers[coworkerName].sprite.setPosition(x, y);
    }

    updateGain(coworkerName, x, y) {

        let newVal = this.calculateGain(this.player.x, this.player.y, x, y);

        console.log(`New gain for user ${coworkerName} is ${newVal}`)
        try {
            this.coworkers[coworkerName].gainNode.gain.value = newVal;
        } catch (e) {
            console.log(e);
            console.log(userIdStreamIdMatches);
            console.log(gainNodes);
        }
    }

}