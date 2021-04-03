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

class Person {
    constructor(personId, socket) {
        this.personId = personId;

        this.peerConnection = new ConfiguredPeerConnection(
            this.personId,
            socket
        );
    }

    getAvatarFilename() {
        console.log("Getting avatar...")
        return "person"
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

}

function makeId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}