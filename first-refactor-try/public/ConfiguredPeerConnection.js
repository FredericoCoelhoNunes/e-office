class ConfiguredPeerConnection {
    /*
    A WebRTC peer connection configured to communicate through a socket.io
    signalling server.
    */

    constructor(personId, socket) {
        this.configuration = {
            'iceServers': [{
                'urls': [
                    'stun:stun.l.google.com:19302',
                ]
            }]
        };
        this.socket = socket;
        this.personId = personId;
        this.conn = new RTCPeerConnection(this.configuration);
        this.configureNegotiationHandlers();
    }

    configureNegotiationHandlers() {

        this.socket.on('webrtc-message', async ({
            description,
            candidate
        }) => {
            if (description) {
                await this.conn.setRemoteDescription(description);
                if (description.type == "offer") {
                    await this.conn.setLocalDescription(await this.conn.createAnswer());
                    this.socket.emit('webrtc-message', {
                        personId: this.personId,
                        data: {
                            "description": this.conn.localDescription
                        }
                    });
                }
            } else if (candidate) await this.conn.addIceCandidate(candidate);
        })

        this.conn.onicecandidate = ({
            candidate
        }) => {
            this.socket.emit(
                'webrtc-message', {
                    personId: this.personId,
                    data: {
                        "candidate": candidate
                    }
                }
            )
        }

        this.conn.onnegotiationneeded = async () => {
            console.log('Starting negotiation.')
            await this.conn.setLocalDescription(await this.conn.createOffer());
            this.socket.emit('webrtc-message', {
                personId: this.personId,
                data: {
                    "description": this.conn.localDescription
                }
            });
            console.log('Sent a WebRTC connection offer to the server.');
        }

        this.conn.oniceconnectionstatechange = event => {
            if (this.conn.iceConnectionState === 'connected') {
                console.log('Connected to server!');
            }
        };

    }

    configureOnTrackHandler(office, audioContext) {
        // Signals when a new track is added.
        this.conn.ontrack = (event) => {

            var coworkerName = office.

            console.log('Track added from server!');
            console.log(event.streams[0].id)
            var mediaStream = new MediaStream([event.track]);
            var streamSource = audioContext.createMediaStreamSource(mediaStream);
            gainNodes[event.streams[0].id] = audioContext.createGain();
            streamSource.connect(gainNodes[event.streams[0].id]);
            gainNodes[event.streams[0].id].connect(audioContext.destination);
        }
    }
}

// export {
//     ConfiguredPeerConnection
// };