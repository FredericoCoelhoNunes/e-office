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