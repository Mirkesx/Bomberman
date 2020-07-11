var config = {
    type: Phaser.AUTO,
    width: 240,
    height: 208,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: "#2E8B57",
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    pixelArt: true,
};

var game = new Phaser.Game(config);
var layer;
var player;
var bombs;
var cursors;
var last_pos;
var bomb_placed;
var animated;

function preload() {
    //1 hard wall, 2 normal wall, 3 grass, 4 shadowed grass,
    this.load.image("tiles-stage-1", "assets/tiles/snes_stage_1.png");
    this.load.tilemapCSV('map', 'assets/tilemaps/stage_1.csv');


    this.load.spritesheet('white-bm',
        'assets/sprites/snes_white.png',
        { frameWidth: 17, frameHeight: 26 }
    );

    this.load.spritesheet('white-bomb',
        'assets/sprites/snes_bombs_white.png',
        { frameWidth: 16, frameHeight: 16 }
    );

    this.load.spritesheet('white-flame',
        'assets/sprites/snes_flames_white.png',
        { frameWidth: 16, frameHeight: 16 }
    );
}

function create() {

    // MAP
    var map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
    var tileset = map.addTilesetImage('tiles-stage-1');
    layer = map.createStaticLayer(0, tileset, 0, 0);
    layer.setCollisionByExclusion([3, 4]);


    // PLAYER
    player = this.physics.add.sprite(24, 17, 'white-bm', 7);
    player.setSize(14, 14, 0, 0).setOffset(2, 12)
    player.setCollideWorldBounds(true);


    //ANIMATIONS
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('white-bm', { start: 3, end: 5 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('white-bm', { start: 9, end: 11 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('white-bm', { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('white-bm', { start: 6, end: 8 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'death',
        frames: this.anims.generateFrameNumbers('white-bm', { start: 12, end: 17 }),
        frameRate: 5,
        repeat: 0
    });

    this.anims.create({
        key: 'bomb-ticking',
        frames: this.anims.generateFrameNumbers('white-bomb', { start: 0, end: 3 }),
        frameRate: 3,
        repeat: 1
    });


    //CURSORS
    cursors = this.input.keyboard.createCursorKeys();

    //INITIALIZATIONS VARIABLES
    bomb_placed = false;
    animated = false;
    bombs = [];
}

function update() {
    this.physics.collide(player, layer);

    player.setVelocity(0, 0);

    if (cursors.up.isDown) {
        player.body.velocity.y = -150;
        player.anims.play('up', true);
        animated = true;
    } else if (cursors.down.isDown) {
        player.body.velocity.y = 150;
        player.anims.play('down', true);
        animated = true;
    }

    if (cursors.left.isDown) {
        player.body.velocity.x = -150;
        player.anims.play('left', true);
        animated = true;
    }
    else if (cursors.right.isDown) {
        player.body.velocity.x = 150;
        player.anims.play('right', true);
        animated = true;
    }

    if (!bomb_placed && cursors.space.isDown) {
        let bomb = place_bomb(player.x, player.y, this);
        //bomb_placed = true;
        this.physics.collide(player,bomb);
    }

    if (animated && player.body.velocity.x == 0 && player.body.velocity.y == 0) {
        player.anims.setCurrentFrame(player.anims.currentAnim.frames[1]);
        player.anims.stop();
        animated = false;
    }
}


const place_bomb = (x, y, context) => {
    var bomb;
    var newX, newY;
    newX = parseInt(parseInt(x) / 16) * 16 + 8;
    newY = parseInt(parseInt(y) / 16) * 16 + 8;

    if (_.filter(bombs, (b) => (b.x < newX && b.x+16 > newX) && (b.y < newY && b.y+16 > newY)).length == 0) {
        bomb = context.add.sprite(newX, newY, 'white-bomb');
        bomb.anims.play('bomb-ticking', true);
        bomb.once("animationcomplete", () => { bombs.splice(bombs.indexOf(bomb), 1); bomb.destroy(); });
        //context.physics.collide(player, bomb);
        //bomb_placed = false;

        bombs.push(bomb);
    }
    return bomb;
};