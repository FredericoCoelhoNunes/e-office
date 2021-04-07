/**
A class that controls the audio inside the e-office, from the perspective of
the local user. Changes the voice gain for each coworker based on its distance
to the user. 
**/
class BasicAudioController {

    /**
     * @param {!audioContext} AudioContext an AudioContext (from the Web Audio
     * API). Used to create the gain nodes.
     */
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    /**
     * Updates the audio gain for a coworker, based onits distance inside the
     * e-office space.
     * @param {!office} Office an instance of Office where we wish to control
     * the sound.
     * @param {!x} coworkerName the name of the coworker.
     * @param {!x} number the x position of the coworker.
     * @param {!y} number the y position of the coworker.
     */
    updateGain(office, coworkerName, x, y) {
        let newVal = this.calculateGain(
            office.person.avatar.x,
            office.person.avatar.y,
            x,
            y,
        );

        try {
            office.coworkers[coworkerName].gainNode.gain.value = newVal;
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Calculates the value of the gain, based on two points (x1, y1) and
     * (x2, y2)
     * @param {!x1} number
     * @param {!y1} number
     * @param {!x2} number
     * @param {!y2} number
     * @return {number} the new value of the gain based on the distance.
     */
    calculateGain(x1, y1, x2, y2) {
        let distance = this.getDistance(x1, y1, x2, y2);
        let newGain = 1 / (1 + distance / 10);
        return newGain
    }

    /**
     * Calculates the Euclidean distance between two points (x1, y1) and
     * (x2, y2)
     * @param {!x1} number
     * @param {!y1} number
     * @param {!x2} number
     * @param {!y2} number
     * @return {number} the distance.
     */
    getDistance(x1, y1, x2, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        var distance = Math.sqrt(a * a + b * b);
        return distance
    };

    /**
     * Creates an instance of a GainNode.
     * @return {GainNode} a Web Audio API GainNode.
     */
    createGain() {
        return this.audioContext.createGain()
    }

}

export {
    BasicAudioController
}