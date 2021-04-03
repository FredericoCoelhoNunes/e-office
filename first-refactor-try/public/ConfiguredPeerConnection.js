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

    configureOnTrackHandler(coworkers, streamId2CoworkerName, audioContext) {
        // Signals when a new track is added.
        this.conn.ontrack = (event) => {

            var coworkerName = streamId2CoworkerName[event.streams[0].id];

            console.log('Coworkers as seen inside TrackHandler: ', coworkers);
            console.log('Coworker name that just added a track: ', coworkerName);
            console.log('StreamId2CoworkerName: ', streamId2CoworkerName);

            // console.log(event.streams[0].id)
            var mediaStream = new MediaStream([event.track]);
            var streamSource = audioContext.createMediaStreamSource(mediaStream);
            streamSource.connect(coworkers[coworkerName].gainNode);
            coworkers[coworkerName].gainNode.connect(audioContext.destination);
        }
    }

    addTrack(track) {
        this.conn.addTrack(track);
    }
}

export {
    ConfiguredPeerConnection
};