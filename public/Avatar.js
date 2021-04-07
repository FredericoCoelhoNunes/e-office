/**
A class that holds information about the graphical representation of an entity
inside a Phaser game (the interactive e-office space).
**/
class Avatar {

    /**
     * @param {!spriteName} string name by which this sprite will be known
     * inside the Phaser game, after it is loaded.
     * @param {!fileName} string name of the file containing the sprite. 
     */
    constructor(spriteName, fileName) {
        this.sprite = undefined
        this.spriteName = spriteName
        this.fileName = fileName
    }

    /**
     * x position of Avatar's sprite in the game area.
     * @return {number} The x position.
     */
    get x() {
        return this.sprite.x;
    }

    /**
     * y position of Avatar's sprite in the game area.
     * @return {number} The y position.
     */
    get y() {
        return this.sprite.y;
    }

    /**
     * Renders the Avatar in the office area, at position (x, y), with
     * possibility of integrated "physics" (such as collision). Used for the 
     * local user's avatar.
     * @param {!phaserGame} Phaser.Game an instance of a phaser game, where the 
     *      entity is to be rendered.
     * @param {!x} number
     * @param {!y} number
     */
    createSpriteWithPhysics(phaserGame, x, y) {
        this.sprite = phaserGame.physics.add.image(
            x, y, this.spriteName
        ).setOrigin(0.5, 0.5);
        this.sprite.setScale(0.2);
        this.sprite.setCollideWorldBounds(true);
    }

    /**
     * Renders the Avatar in the office area, at position (x, y), by simply
     * drawing its sprite image. Used for the coworkers' avatars.
     * @param {!phaserGame} Phaser.Game an instance of a phaser game, where the 
     *      entity is to be rendered.
     * @param {!x} number
     * @param {!y} number
     */
    addSprite(phaserGame, x, y) {
        this.sprite = phaserGame.add.sprite(
            x, y, this.spriteName
        ).setOrigin(0.5, 0.5);
        this.sprite.setScale(0.2);
    }

    /**
     * Gets the Avatar's sprite details (its name inside the Phaser.game, and
     * the file name to load it)
     * @return {Array<string>} [spriteName, fileName].
     */
    getSpriteDetails() {
        return [this.spriteName, this.fileName];
    }

    /**
     * Sets the Avatar's sprite position
     * @param {!x} number desired x position
     * @param {!y} number desired y position
     */
    setPosition(x, y) {
        this.sprite.setPosition(x, y);
    }

    /**
     * Destroys the sprite, removing it from the Game area.
     */
    destroySprite() {
        this.sprite.destroy();
    }
}

export {
    Avatar
}