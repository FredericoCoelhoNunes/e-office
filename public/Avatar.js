/*
Visual representation of a person inside the office.
*/

class Avatar {
    constructor(spriteName, fileName) {
        this.sprite = undefined
        this.spriteName = spriteName
        this.fileName = fileName
    }

    get x() {
        return this.sprite.x;
    }

    get y() {
        return this.sprite.y;
    }

    createSpriteWithPhysics(phaserGame, x, y) {
        this.sprite = phaserGame.physics.add.image(
            x, y, this.spriteName
        ).setOrigin(0.5, 0.5);
        this.sprite.setScale(0.2);
        this.sprite.setCollideWorldBounds(true);
    }

    addSprite(phaserGame, x, y) {
        this.sprite = phaserGame.add.sprite(
            x, y, this.spriteName
        ).setOrigin(0.5, 0.5);
        this.sprite.setScale(0.2);
    }

    getSpriteDetails() {
        return [this.spriteName, this.fileName];
    }

    setPosition(x, y) {
        this.sprite.setPosition(x, y);
    }

    destroySprite() {
        this.sprite.destroy();
    }
}

export {
    Avatar
}