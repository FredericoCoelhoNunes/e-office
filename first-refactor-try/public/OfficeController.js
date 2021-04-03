class OfficeController {

    constructor(office, person) {
        this.office = office
        this.person = person
        this.old_position = undefined

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

    getCreateFunction() {
        /* 
        Gets the scene "create" handler, with reference to the office controller.
        This was we can create new office controller by just overriding one or more of
        getCreate, getPreload, or getUpdate
         */
        self = this;

        function create() {
            self.office.configureEventHandlers(this);

            self.person.getVoice();

            self.person.createSprite(this);
            self.person.sprite.setScale(0.2);
            self.person.sprite.setCollideWorldBounds(true);

            self.person.peerConnection.configureOnTrackHandler(
                self.office.coworkers,
                self.office.streamId2CoworkerName,
                self.office.audioContext
            );

            console.log('Creating...', self);
            self.cursors = this.input.keyboard.createCursorKeys();

            self.person.joinRoom(self.office, self.office.defaultRoom);
            self.person.sendVoice();

        }

        return create
    }

    getPreloadFunction() {
        function preload() {
            this.load.image('person', 'assets/person.png');
        }

        return preload
    }

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

            if (self.oldPosition === undefined || (self.office.getDistance(self.oldPosition.x, self.oldPosition.y, x, y) > 10)) {

                for (let [coworkerName, data] of Object.entries(self.office.coworkers)) {
                    self.office.updateGain(coworkerName, data.sprite.x, data.sprite.y);
                }

                self.oldPosition = {
                    "x": x,
                    "y": y
                };

                self.office.emitNewPosition(x, y);
            }
        }

        return update
    }
}

export {
    OfficeController
};