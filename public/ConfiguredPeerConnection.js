/**
Wrapper for the RTCPeerConnection class, to help with our particular use case.
Adapted to be used with a socket.io signalling server, to establish the WebRTC
connection.
**/
class ConfiguredPeerConnection {

    /**
     * @param {!socket} Socket a socket.io socket to communicate with the
     * signalling server.
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

    /**
     * Configures all the basic WebRTC negotiation event handlers.
     */
    configureNegotiationHandlers() {

        // For sending and receiving offers/answers + receiving ICE candidates.
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

        // For sending ICE candidates as "trickle" in.
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

        // To start a WebRTC negotiation.
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

        // On successful connection to the server.
        this.conn.oniceconnectionstatechange = event => {
            if (this.conn.iceConnectionState === 'connected') {
                console.log('Connected to server!');
            }
        };

    }

    /**
     * Configures the ontrack handler - what to do when a new track is
     * received. Requires access to several attributes of the Office class,
     * in order to decide what to do with the incoming sound stream.
     * Creates a new MediaStreamSource, attaches it to the gain node of the
     * right coworker, and attaches the gain node to the AudioContext
     * destination (i.e. your headphones!)
     * TODO: pass it the entire office instance instead - much cleaner!
     * @param {!x1} number
     * @param {!y1} number
     * @param {!x2} number
     * @param {!y2} number
     * @return {number} the distance.
     */
    configureOnTrackHandler(coworkers, streamId2CoworkerName, audioController) {
        this.conn.ontrack = (event) => {
            var coworkerName = streamId2CoworkerName[event.streams[0].id];
            var streamSource = audioController.audioContext.createMediaStreamSource(event.streams[0]);
            streamSource.connect(coworkers[coworkerName].gainNode);
            coworkers[coworkerName].gainNode.connect(audioController.audioContext.destination);
        }
    }

    /**
     * Adds a track to the WebRTC connection. Triggers a renegotiation process,
     * since we are trying to send media over. This process should be
     * automatically handled.
     * @param {!track} MediaStreamTrack an instance of a MediaStreamTrack from
     * the Web Audio API (obtained with MediaDevices.getUserMedia, for example)
     */
    addTrack(track) {
        this.conn.addTrack(track);
    }

    /**
     * Stops all transceivers in the PeerConnection.
     * TODO: Clarify if this is even doing anything. We are doing then when
     * leaving a room, but it doesn't seem like it stops the audio from flowing
     * to the server (which is good, we don't want it to stop! But still) 
     */
    stopTransceivers() {
        this.conn.getTransceivers().forEach(tr => {
            tr.stop();
        });
    }

    /**
     * Instantiates the RTCPeerConnection and configures the basic handlers.
     */
    getAndConfigureConnection() {
        this.conn = new RTCPeerConnection(this.configuration);
        this.configureNegotiationHandlers();
    }

    /**
     * Closes the RTCPeerConnection if it is open.
     */
    closeConnIfOpen() {
        if (this.conn) {
            this.conn.close();
        }
    }
}

export {
    ConfiguredPeerConnection
};