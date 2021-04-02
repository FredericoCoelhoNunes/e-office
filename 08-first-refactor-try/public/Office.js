/*
class Office():
    "Office, from the point of view of a person".

    person;
    co-workers;  # list of avatars?
    streams;

*/

class Office {
    constructor(officeName) {
        this.officeName = officeName;
        this.coworkers = {}; // object that contains streams, gainNodes, and userIds from coworkers
        //this.streams = [];
        //this.userIdStreamIdMatches = {};
        //this.gainNodes = {};
        this.audioContext = new window.AudioContext();
    }

    addPerson(person) {
        this.person = person
    }

    addCoworker() {
        console.log("Adding coworker to office room")
    }

}
