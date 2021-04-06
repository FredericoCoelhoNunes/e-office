class BasicAudioController {

    constructor(audioContext) {
        this.audioContext = audioContext;
    }

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

    calculateGain(x1, y1, x2, y2) {
        let distance = this.getDistance(x1, y1, x2, y2);
        let newGain = 1 / (1 + distance / 10);
        return newGain
    }

    getDistance(x1, y1, x2, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        var distance = Math.sqrt(a * a + b * b);
        return distance
    };

    createGain() {
        return this.audioContext.createGain()
    }

}

export {
    BasicAudioController
}