import {
    USER_ID,
    socket,
    peerConnection,
    getMedia,
    connectToSFUWebRTCServer,
    userIdStreamIdMatches,
    gainNodes
} from "./sound.js";

// Debug
window.imported_stuff = {
    USER_ID,
    socket,
    peerConnection,
    getMedia,
    connectToSFUWebRTCServer,
    userIdStreamIdMatches,
    gainNodes
};


var players = {};

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    backgroundColor: '#0072bc',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var cursors;
var player;
var oldPosition;
var oldEmitDate; // for throttling
var newEmitDate; // fpr throttling

var game = new Phaser.Game(config);

var getDistance = (x1, y1, x2, y2) => {
    var a = x1 - x2;
    var b = y1 - y2;
    var distance = Math.sqrt( a*a + b*b );
    return distance
};

var calculateGain = (x1, y1, x2, y2) => {
    // Assuming gain = 1 is when position coincide, gain = 0 is for >100 units
    let distance = getDistance(x1, y1, x2, y2)
    let newGain;
    var maxDist = 250;
   /* if (distance >= maxDist) {
        newGain = 0;
    } else {
        newGain = 1 - (distance/maxDist);
    } */
    //newGain = 1 - (distance/maxDist);
    newGain = 1/(1+distance/10)
    return newGain
}

var updateGain = (playerName, x, y) => {
    
    let newVal = calculateGain(player.x, player.y, x, y); 

    console.log(`New gain for user ${playerName} is ${newVal}`)
    try {
        gainNodes[userIdStreamIdMatches[playerName]].gain.value = newVal;
    } catch (e) {
        console.log(e);
        console.log(userIdStreamIdMatches);
        console.log(gainNodes);
    }
    
    // console.log(userIdStreamIdMatches);
    // console.log(gainNodes);
    // console.log(playerName, x, y);
}

function addPlayer(self, playerName, x, y) {
    const playerSprite = self.add.sprite(x, y, 'person').setOrigin(0.5, 0.5);
    playerSprite.setScale(0.2);
    players[playerName] = {sprite: playerSprite, x, y};
}

function updatePosition(self, playerName, x, y) {
    players[playerName].x = x;
    players[playerName].y = y;
    players[playerName].sprite.setPosition(x, y);
}

function preload ()
{
    this.load.image('person', 'assets/person.png');
}

function create ()
{
    var self = this;
    this.socket = socket;
    this.playerName = USER_ID;
    console.log(USER_ID);

    getMedia({audio: true, video: false}).then(
        connectToSFUWebRTCServer
    )

    socket.emit('user-joined-room', USER_ID);

    player = this.physics.add.image(400, 300, 'person');
    player.setScale(0.2);
    player.setCollideWorldBounds(true);

    this.socket.emit('new-player', this.playerName, player.x, player.y);

    this.socket.on('new-player', ({playerName, x, y}) => {
        console.log('got new player')
        addPlayer(self, playerName, x, y);  
    })

    this.socket.on('current-players', data => {
        console.log('received all players')
        Object.keys(data).forEach(function (id) {
            addPlayer(self, data[id].playerName, data[id].x, data[id].y);
            console.log(players);
        })
    })

    this.socket.on('new-position', (playerName, x, y) => {
        console.log('received new position')
        updatePosition(self, playerName, x, y)
        updateGain(playerName, x, y)
    })

    cursors = this.input.keyboard.createCursorKeys();

}

function update ()
{
    player.setVelocity(0);

    if (cursors.left.isDown)
    {
        player.setVelocityX(-300);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(300);
    }

    if (cursors.up.isDown)
    {
        player.setVelocityY(-300);
    }
    else if (cursors.down.isDown)
    {
        player.setVelocityY(300);
    }

    var x = player.x;
    var y = player.y;
    // var r = this.player.rotation;

    if (oldPosition === undefined || (getDistance(oldPosition.x, oldPosition.y, x, y) > 10)) {        
        // console.log('Is undefined: ', oldPosition === undefined);
        // if (oldPosition) console.log(oldPosition.x, oldPosition.y, x, y);

        this.socket.emit('new-position', x, y);

        // Updating sounds for all players
        for (let [pname, pos] of Object.entries(players)) {
            updateGain(pname, pos.x, pos.y);
        }
        
        // console.log('emited new position');
        
        oldPosition = {
            "x": x,
            "y": y
        };
    }

}
