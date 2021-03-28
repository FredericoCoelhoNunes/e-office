function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
 
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

var game = new Phaser.Game(config);

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
    this.socket = io('/');
    this.playerName = makeid(5);
    
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

    if (oldPosition && (x !== oldPosition.x || y !== oldPosition.y)) {
        this.socket.emit('new-position', x, y );
        console.log('emited new position');
    }

    oldPosition = {
        "x": x,
        "y": y
    };
}
