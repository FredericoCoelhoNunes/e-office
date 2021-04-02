import Person from "./Person.js"
import Office from "./Office.js"

person = new Person("local_user");
//person.connect()?

office = new Office("my_office");


person.peerConnection.connect().then(
    office = new Office(office_name)
    office.addPerson()
    office.addCoworkers()
    office.addStreams())

// New user joins a room
person.socket.on('user-joined-room', userId => {
    console.log(`User ${userId} joined the room.`);
});

// Sending message: joined the server
// socket.emit('user-joined-room', USER_ID);

// New userId/trackId match received
person.socket.on('userid-streamid-match', (userId, streamId) => {
    office.userIdStreamIdMatches[userId] = streamId;
});

// Listen for local ICE candidates on the local RTCPeerConnection
person.peerConnection.onicecandidate = ({candidate}) => person.socket.emit('webrtc-message', {userId: USER_ID, roomId: ROOM_ID, data: {"candidate": candidate}});

// Handles negotiation
peerConnection.onnegotiationneeded = async () => {
    console.log('Starting negotiation.')
    await peerConnection.setLocalDescription(await peerConnection.createOffer());
    socket.emit('webrtc-message', {userId: USER_ID, roomId: ROOM_ID, data: {"description": peerConnection.localDescription}});
    console.log('Sent a WebRTC connection offer to the server.');
}

socket.on('webrtc-message', async ({description, candidate}) => {
    if (description) {
        await peerConnection.setRemoteDescription(description);
        if (description.type == "offer") {
            await peerConnection.setLocalDescription(await peerConnection.createAnswer());
            socket.emit('webrtc-message', {userId: USER_ID, roomId: ROOM_ID, data: {"description": peerConnection.localDescription}});
        }
    } else if (candidate) await peerConnection.addIceCandidate(candidate);
  }
)

// Listen for connectionstatechange on the local RTCPeerConnection
peerConnection.oniceconnectionstatechange = event => {
    if (peerConnection.iceConnectionState === 'connected') {
        console.log('Connected to server!');
    }
};

// Signals when a new track is added.
peerConnection.ontrack = (event) => {
    console.log('Track added from server!');
    console.log(event.streams[0].id)
    var mediaStream = new MediaStream([event.track]);
    var streamSource = audioContext.createMediaStreamSource(mediaStream);
    gainNodes[event.streams[0].id] = audioContext.createGain();
    streamSource.connect(gainNodes  [event.streams[0].id]);
    gainNodes[event.streams[0].id].connect(audioContext.destination);

    // et voila :) gains are now controllable live with gainNodes[userIdStreamIdMatches[<some user ID>]].gain.value = <gain value>
}

// Getting media and connecting to server.
// getMedia({audio: true, video: false}).then(
//     connectToSFUWebRTCServer
// )
console.log(`Welcome to room ${ROOM_ID}. You are user ${USER_ID}.`);

export {
    USER_ID,
    socket,
    peerConnection,
    getMedia,
    connectToSFUWebRTCServer,
    userIdStreamIdMatches,
    gainNodes
};