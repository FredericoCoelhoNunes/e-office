class ConfiguredPeerConnection {
    /*
    A WebRTC peer connection configured to communicate through a socket.io
    signalling server.
    */

    constructor(socket) {
        this.configuration = {
            'iceServers': [{
                'urls': [
                    'stun:stun.l.google.com:19302',
                ]
            }]
        };
        this.socket = socket;
        this.getAndConfigureConnection();
    }

    configureNegotiationHandlers() {

        this.socket.on('webrtc-message', async ({
            description,
            candidate
        }) => {
            try {
                if (description) {
                    await this.conn.setRemoteDescription(description);
                    if (description.type == "offer") {
                        await this.conn.setLocalDescription(await this.conn.createAnswer());
                        this.socket.emit('webrtc-message', {
                            data: {
                                "description": this.conn.localDescription
                            }
                        });
                    }
                } else if (candidate) await this.conn.addIceCandidate(candidate);
            } catch (e) {
                console.log(e)
            }
        })

        this.conn.onicecandidate = ({
            candidate
        }) => {
            this.socket.emit(
                'webrtc-message', {
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

    configureOnTrackHandler(coworkers, streamId2CoworkerName, audioController) {
        // Signals when a new track is added.
        this.conn.ontrack = (event) => {
            var coworkerName = streamId2CoworkerName[event.streams[0].id];

            // if we want do do more complex audio controlling, handle the next
            // 3 lines inside the audio controller.
            var streamSource = audioController.audioContext.createMediaStreamSource(event.streams[0]);
            streamSource.connect(coworkers[coworkerName].gainNode);
            coworkers[coworkerName].gainNode.connect(audioController.audioContext.destination);
        }
    }

    addTrack(track) {
        return this.conn.addTrack(track);
    }

    stopTransceivers() {
        this.conn.getTransceivers().forEach(tr => {
            tr.stop();
        });
    }

    getAndConfigureConnection() {
        this.conn = new RTCPeerConnection(this.configuration);
        this.configureNegotiationHandlers();
    }

    closeConnIfOpen() {
        if (this.conn) {
            this.conn.close();
        }
    }
}

export {
    ConfiguredPeerConnection
};