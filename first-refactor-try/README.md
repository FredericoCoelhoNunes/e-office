---- Draft ----

class Office():
    "Office, from the point of view of a person".

    person;
    co-workers;  # list of avatars?
    streams;

class Person():
    """
    Client that connects to the e-office server
    Requires:
        - a socket to connect to the signalling server;
        - a peerConnection to send audio stream to the office;
        - an avatar for other people to see;
    """

    avatar;
    peerConnection;
    socket;


class Avatar():
    "Visual representation of a person inside the office".

    sprite
    sprite.x
    sprite.y
    ...

person = new Person();
Person.peerConnection.connect().then(
    office = new Office(username, password, office_name)
    office.addPerson()
    office.addCoworkers()
    office.addStreams()
)

## Flow

controller starts
	person is created
		authentication
		get avatar
		get preferences
        create peerConnection

	office(person) is created
		render office space
		create gainNodes object
			create volumeController
		add update handlers
        render avatar inside office
        person configures its "ontrack", based on the office characteristics (gainNodes)
	
	person sends track to server
		person receives tracks from coworkers
		office.gainNodes are updated

	loop starts
		office receives new coworker position
		office adjusts right gain node
		person receives new track
		etc.

	office detects person is leaving
		person removes all tracks from peerConnection
		person signals server to stop sending its track to all coworkers in office
    
    office(person=)


# TODO:

- garbage collection on client and server-side
    - on client side delete all things in Office;
    - on server side delete everything related to socket.id for the user;
    - if a room is empty on server side, delete the room too;
    - stop all tracks for the deleted user on other stream
        - better if you can delete the corresponding transceiver, because we don't know if "stopped" transceivers still make the connections slower for some reason.
- implement Avatar class and add to Person and Coworkers
- implement BasicVolumeController and add to Office
- comment everything