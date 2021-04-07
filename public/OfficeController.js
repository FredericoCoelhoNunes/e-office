/**
Defines the Phaser Game loop in which the Person and Office (which contains
the coworkers) will interact, to bring the e-office to life.
**/
class OfficeController {

    /**
     * @param {!office} Office the person corresponding to the local user.
     * @param {!person} Person the office that the person connects to.
     */
    constructor(office, person) {
        this.office = office
        this.person = person
        this.old_position = undefined

        // This config defines the Phaser game, which in turn is defined by a
        // scene with 3 stages - preload (to load the sprites), create (to set
        // up the different classes), and update (to continously render the
        // office and users' Avatars)
        this.config = {
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
                preload: this.getPreloadFunction(),
                create: this.getCreateFunction(),
                update: this.getUpdateFunction()
            }
        }

        this.game = new Phaser.Game(this.config);
    }

    /**
     * Gets the scene "create" handler. It follows these steps:
     *      - configures the office event handlers;
     *      - gets access to the user's microphone;
     *      - renders the user's avatar
     *      - configures the keyboard movement input
     *      - the person joins the office default room
     *      - the person sends its voice track, which triggers WebRTC
     *        negotiation.
     * @return {Function} the create handler.
     */
    getCreateFunction() {
        self = this;

        function create() {
            self.office.configureEventHandlers(this);

            self.person.getVoice();

            self.person.avatar.createSpriteWithPhysics(this, 200, 200);
            self.person.sprite.setCollideWorldBounds(true);

            self.cursors = this.input.keyboard.createCursorKeys();

            self.person.joinRoom(self.office, self.office.defaultRoom);
            self.person.sendVoice();
        }

        return create
    }

    /**
     * Gets the scene "preload" handler. Loads all relevant sprites.
     * @return {Function} the preload handler.
     */
    getPreloadFunction() {
        function preload() {
            const [spriteName, fileName] = self.person.avatar.getSpriteDetails();
            this.load.image(spriteName, fileName);
        }

        return preload
    }

    /**
     * Gets the scene "update" handler. It follows these steps:
     *      - updates user position based on input.
     *      - every 10 units updates relative gains for coworkers, and emits
     *        the new position to the server.
     * @return {Function} the update handler.
     */
    getUpdateFunction() {
        self = this;

        function update() {
            self.person.sprite.setVelocity(0);

            if (self.cursors.left.isDown) {
                self.person.sprite.setVelocityX(-300);
            } else if (self.cursors.right.isDown) {
                self.person.sprite.setVelocityX(300);
            }

            if (self.cursors.up.isDown) {
                self.person.sprite.setVelocityY(-300);
            } else if (self.cursors.down.isDown) {
                self.person.sprite.setVelocityY(300);
            }

            var x = self.person.sprite.x;
            var y = self.person.sprite.y;
            // var r = this.player.rotation;

            if (self.oldPosition === undefined || (self.office.audioController.getDistance(self.oldPosition.x, self.oldPosition.y, x, y) > 10)) {

                for (let [coworkerName, data] of Object.entries(self.office.coworkers)) {
                    self.office.updateGain(coworkerName, data.avatar.x, data.avatar.y);
                }

                self.oldPosition = {
                    "x": x,
                    "y": y
                };

                self.person.emitNewPosition(x, y);
            }
        }

        return update
    }
}

export {
    OfficeController
};