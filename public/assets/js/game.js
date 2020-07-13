function startGame() {
    $('.lobby').hide();
    $('.canvasContainer').html("");


    var config = {
        type: Phaser.AUTO,
        width: 240,
        height: 208,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.NO_CENTER
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
            },
        },
        pixelArt: true,
    };

    var game = new Phaser.Game(config);
    var map, tileset, layer, scene;
    var player;
    var bombs, flipFlopBomb;
    var cursors, animated; //animated is used to show the right animation with the player sprite
    var walls, items;
    const items_list = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 3, 3, 9, 9, 9, 9, 9, 23, 23, 23];

    function preload() {
        //1 hard wall, 2 normal wall, 3 grass, 4 shadowed grass,
        this.load.image("tiles-stage-1", "/public/assets/tiles/snes_stage_1.png");
        this.load.tilemapCSV('map', '/public/assets/tilemaps/stage_1.csv');


        this.load.spritesheet('white-bm',
            '/public/assets/sprites/snes_white.png',
            { frameWidth: 17, frameHeight: 26 }
        );

        this.load.spritesheet('white-bomb',
            '/public/assets/sprites/snes_bombs_white.png',
            { frameWidth: 16, frameHeight: 16 }
        );

        this.load.spritesheet('bomb-flame',
            '/public/assets/sprites/bomb_flames.png',
            { frameWidth: 16, frameHeight: 16 }
        );

        this.load.spritesheet('walls',
            '/public/assets/tiles/snes_stage_1.png',
            { frameWidth: 16, frameHeight: 16 }
        );

        this.load.spritesheet('wall-destroyed',
            '/public/assets/sprites/wall_destroyed.png',
            { frameWidth: 16, frameHeight: 16 }
        );

        this.load.spritesheet('items',
            '/public/assets/sprites/snes_items.png',
            { frameWidth: 16, frameHeight: 16 }
        );

        this.bombsGroup = this.physics.add.group({
            allowGravity: false
        });
        this.flamesGroup = this.physics.add.group({
            allowGravity: false
        });
        this.wallsGroup = this.physics.add.group({
            allowGravity: false
        });
        this.itemsGroup = this.physics.add.group({
            allowGravity: false
        });
        scene = this;
    }

    function create() {

        // MAP
        map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
        tileset = map.addTilesetImage('tiles-stage-1');
        layer = map.createStaticLayer(0, tileset, 0, 0);
        layer.setCollisionByExclusion([3, 4]);


        // PLAYER
        player = this.physics.add.sprite(24, 24, 'white-bm', 7);
        player.setSize(11, 9, 0, 0).setOffset(3, 15).setOrigin(0.5, 0.75);
        player.setDepth(2000);
        player.setCollideWorldBounds(true);


        // WALLS and ITEMS
        generateWalls();
        generateItems();

        //ANIMATIONS
        playerAnimation();
        flamesAnimation();
        this.anims.create({
            key: 'bomb-ticking',
            frames: this.anims.generateFrameNumbers('white-bomb', { start: 0, end: 3 }),
            frameRate: 3,
            repeat: 1
        });
        this.anims.create({
            key: 'wall-destroyed',
            frames: this.anims.generateFrameNumbers('wall-destroyed', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: 0
        });
        this.anims.create({
            key: 'item-destroyed',
            frames: this.anims.generateFrameNumbers('bomb-flame', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: 0
        });
        this.physics.add.collider(player, layer);


        //CURSORS
        cursors = this.input.keyboard.createCursorKeys();

        //INITIALIZATIONS VARIABLES
        animated = false;
        bombs = [];
        player.speed = 1;
        player.bombs = 3;
        player.flames = 2;
        player.status = 'alive';
        player.godlike = false;
        flipFlopBomb = false;
    }


    function update() {

        if (player.status === 'alive') {
            player.setVelocity(0, 0);
            speed = 50 + player.speed * 15;

            if (cursors.up.isDown) {
                player.body.velocity.y = -speed;
                if (cursors.left.isDown) {
                    player.body.velocity.x = -speed;
                } else if (cursors.right.isDown) {
                    player.body.velocity.x = speed;
                }

                player.anims.play('up', true);
                animated = true;

            } else if (cursors.down.isDown) {
                player.body.velocity.y = speed;
                if (cursors.left.isDown) {
                    player.body.velocity.x = -speed;
                } else if (cursors.right.isDown) {
                    player.body.velocity.x = speed;
                }

                player.anims.play('down', true);
                animated = true;

            } else if (cursors.left.isDown) {
                player.body.velocity.x = -speed;

                player.anims.play('left', true);
                animated = true;

            }
            else if (cursors.right.isDown) {
                player.body.velocity.x = speed;

                player.anims.play('right', true);
                animated = true;

            }

            if (!flipFlopBomb && player.bombs > bombs.length && cursors.space.isDown) {
                place_bomb(player.x, player.y, this);
                flipFlopBomb = true;
            }

            if (flipFlopBomb && cursors.space.isUp) {
                flipFlopBomb = false;
            }

            if (animated && player.body.velocity.x == 0 && player.body.velocity.y == 0) {
                player.anims.setCurrentFrame(player.anims.currentAnim.frames[1]);
                player.anims.stop();
                animated = false;
            }

            if (!player.godlike && scene.physics.collide(player, scene.flamesGroup)) {
                death(player);
            }
        }
    }

    const death = (player) => {
        player.status = "dead";
        player.anims.play('death', true);
        player.once("animationcomplete", () => {
            setTimeout(() => {
                player.destroy();
            }, 1000);
        });
    };

    const generateWalls = () => {
        const players_start = [
            "1,1",
            "1,2",
            "2,1",
            "13,1",
            "12,1",
            "13,2",
            "1,11",
            "1,10",
            "2,11",
            "13,11",
            "13,10",
            "12,11",
        ];

        walls = [];
        for (let i = 1; i < 14; i++) {
            for (let j = 1; j < 12; j++) {
                console.log()
                if (players_start.indexOf(i + "," + j) === -1 && map.getTileAtWorldXY(i * 16, j * 16, layer).index !== 1) {
                    if (Math.random() < 0.85) {
                        let wall = scene.wallsGroup.create(i * 16, j * 16, 'walls', 2).setOrigin(0, 0);
                        wall.setImmovable();
                        wall.setDepth(1001);
                        scene.physics.add.collider(player, wall);
                        walls.push(wall);
                    }
                }
            }
        }
    }

    const destroyWall = (wall) => {
        wall.anims.play("wall-destroyed", true);
        wall.once("animationcomplete", () => {
            wall.destroy();
        });
    }

    const generateItems = () => {
        items = [];
        for (let wall of walls) {
            if (Math.random() < 0.25) {
                index = items_list[Math.floor(Math.random() * items_list.length)];
                item = scene.itemsGroup.create(wall.x, wall.y, 'items', index).setOrigin(0, 0);
                item.setImmovable();
                item.index = index;
                item.player_collider = scene.physics.add.overlap(item, player, (item) => {
                    if (item.index == 0 && player.bombs < 10) {
                        player.bombs++
                    } else if (item.index == 1 && player.bombs < 13) {
                        player.flames++;
                    } else if (item.index == 3) {
                        player.flames = 13;
                    } else if (item.index == 9 && player.speed < 6) {
                        player.speed++;
                    } else if (item.index == 23 & player.speed > 0) {
                        player.speed--;
                    }
                    item.destroy();
                });
            }
        }

    }

    const destroyItem = (item) => {
        item.anims.play('item-destroyed', true);
        item.once('animationcomplete', () => {
            item.destroy();
        });
    }


    const place_bomb = (x, y, scene) => {
        var bomb;
        var newX, newY, i, j; //i,j are the coordinates of the 16x16 squares of the stage map
        i = Math.floor(Math.floor(x) / 16);
        j = Math.floor(Math.floor(y) / 16);

        newX = Math.floor(x) - (Math.floor(x) % 16) + 8;
        newY = Math.floor(y) - (Math.floor(y) % 16) + 8;

        if (_.filter(bombs, (b) => Math.floor(b.x / 16) == i && Math.floor(b.y / 16) == j).length == 0) {
            bomb = scene.bombsGroup.create(-128, -128, 'white-bomb').setOrigin(0, 0).disableBody(true, true);
            bomb.x = newX;
            bomb.y = newY;
            bomb.setSize(13, 13).setOffset(2, 2);

            bomb.setInteractive();
            bomb.setImmovable();

            setTimeout(() => { //fixed the bug when the bomb is misplaced on top of an undestructable wall
                if (bombOverlapWall(bomb)) { //bomb misplaced
                    bomb.x -= 8;
                    bomb.y -= 8;
                }
                bomb.enableBody(false, 0, 0, true, true);
                bomb.anims.play('bomb-ticking', true);
            }, 50);

            bomb.once("animationcomplete", () => {
                explosion(bomb, 0);
            });
            scene.physics.add.collider(player, bomb);
            scene.physics.add.collider(scene.flamesGroup, bomb, () => {
                explosion(bomb, -0.5);
            });

            bombs.push(bomb);
            return bomb;
        }
        return bomb;
    };

    const explosion = (bomb, origin) => {
        bombs.splice(bombs.indexOf(bomb), 1);
        createFlames(bomb.x, bomb.y, origin);
        bomb.destroy();
    }

    const bombOverlapWall = (bomb) => {
        return map.getTileAtWorldXY(bomb.x + 1, bomb.y + 1, layer).index === 1 ||
            map.getTileAtWorldXY(bomb.x + 1, bomb.y + 15, layer).index === 1 ||
            map.getTileAtWorldXY(bomb.x + 15, bomb.y + 1, layer).index === 1 ||
            map.getTileAtWorldXY(bomb.x + 15, bomb.y + 15, layer).index === 1;
    }

    const createFlames = (x, y, origin) => {
        u = d = l = r = true;

        flames = [];

        flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 5).setOrigin(origin, origin));
        flames[flames.length - 1].animation = "bomb-exploding-center";

        for (let i = 0; i < player.flames; i++) {
            if (u)
                u = addFlameUp(flames, x, y, i, player.flames, origin);
            if (d)
                d = addFlameDown(flames, x, y, i, player.flames, origin);
            if (l)
                l = addFlameLR(flames, x, y, i, player.flames, origin, true);
            if (r)
                r = addFlameLR(flames, x, y, i, player.flames, origin, false);
        }

        _.each(flames, (f) => {
            f.setImmovable();
            f.anims.play(f.animation, 'play');
            f.once("animationcomplete", () => {
                f.destroy();
            });
        });
    }

    const addFlameUp = (flames, x, y, i, length, origin) => {
        if (map.getTileAtWorldXY(x, y - 16 * (i + 1), layer).index !== 1) {
            y = y - 16 * (i + 1);
            if (checkAndDestroyObjects(x, y)) {
                return false;
            }

            if (i == length - 1) {
                flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 20).setOrigin(origin, origin).setSize(10, 16).setOffset(3, 0));
                flames[flames.length - 1].animation = "bomb-exploding-up-head";
            }
            else {
                flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 10).setOrigin(origin, origin).setSize(10, 16).setOffset(3, 0));
                flames[flames.length - 1].animation = "bomb-exploding-ud-body";
            }
            return true;
        }
        return false;
    }

    const addFlameDown = (flames, x, y, i, length, origin) => {
        if (map.getTileAtWorldXY(x, y + 16 * (i + 1), layer).index !== 1) {
            y = y + 16 * (i + 1);
            if (checkAndDestroyObjects(x, y)) {
                return false;
            }

            if (i == length - 1) {
                flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 25).setOrigin(origin, origin).setSize(10, 16).setOffset(3, 0));
                flames[flames.length - 1].animation = "bomb-exploding-down-head";
            }
            else {
                flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 10).setOrigin(origin, origin).setSize(10, 16).setOffset(3, 0));
                flames[flames.length - 1].animation = "bomb-exploding-ud-body";
            }
            return true;
        }
        return false;
    }

    const addFlameLR = (flames, x, y, i, length, origin, isL) => {
        if (isL) {
            if (map.getTileAtWorldXY(x - 16 * (i + 1), y, layer).index !== 1) {
                x = x - 16 * (i + 1);
                if (checkAndDestroyObjects(x, y)) {
                    return false;
                }

                if (i == length - 1) {
                    flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 35).setOrigin(origin, origin).setSize(16, 10).setOffset(0, 3));
                    flames[flames.length - 1].animation = "bomb-exploding-left-head";
                }
                else {
                    flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 15).setOrigin(origin, origin).setSize(16, 10).setOffset(0, 3));
                    flames[flames.length - 1].animation = "bomb-exploding-lr-body";
                }
                return true;
            }
        } else {
            if (map.getTileAtWorldXY(x + 16 * (i + 1), y, layer).index !== 1) {
                x = x + 16 * (i + 1);
                if (checkAndDestroyObjects(x, y)) {
                    return false;
                }

                if (i == length - 1) {
                    flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 30).setOrigin(origin, origin).setSize(16, 10).setOffset(0, 3));
                    flames[flames.length - 1].animation = "bomb-exploding-right-head";
                }
                else {
                    flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 15).setOrigin(origin, origin).setSize(16, 10).setOffset(0, 3));
                    flames[flames.length - 1].animation = "bomb-exploding-lr-body";
                }
                return true;
            }
        }
        return false;
    }

    const checkAndDestroyObjects = (x, y) => { //used to stop the flames at the first wall/item
        walls_hit = _.filter(scene.wallsGroup.children.entries, (w) => w.x === x && w.y === y);
        if (walls_hit.length > 0) {
            _.each(walls_hit, (w) => destroyWall(w));
            return true;
        }
        items_hit = _.filter(scene.itemsGroup.children.entries, (i) => i.x === x && i.y === y);
        if (items_hit.length > 0) {
            _.each(items_hit, (i) => destroyItem(i));
            return true;
        }
        return false;
    }



    const playerAnimation = () => {
        scene.anims.create({
            key: 'left',
            frames: scene.anims.generateFrameNumbers('white-bm', { start: 3, end: 5 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'right',
            frames: scene.anims.generateFrameNumbers('white-bm', { start: 9, end: 11 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'up',
            frames: scene.anims.generateFrameNumbers('white-bm', { start: 0, end: 2 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'down',
            frames: scene.anims.generateFrameNumbers('white-bm', { start: 6, end: 8 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'death',
            frames: scene.anims.generateFrameNumbers('white-bm', { start: 12, end: 17 }),
            frameRate: 5,
            repeat: 0
        });
    }


    const flamesAnimation = () => {
        scene.anims.create({
            key: 'bomb-exploding-center',
            frames: scene.anims.generateFrameNumbers('bomb-flame', { frames: [5, 6, 7, 8, 9, 8, 7, 6, 5] }),
            frameRate: 18,
            repeat: 0
        });

        scene.anims.create({
            key: 'bomb-exploding-ud-body',
            frames: scene.anims.generateFrameNumbers('bomb-flame', { frames: [10, 11, 12, 13, 14, 13, 12, 11, 10] }),
            frameRate: 18,
            repeat: 0
        });

        scene.anims.create({
            key: 'bomb-exploding-lr-body',
            frames: scene.anims.generateFrameNumbers('bomb-flame', { frames: [15, 16, 17, 18, 19, 18, 17, 16, 15] }),
            frameRate: 18,
            repeat: 0
        });

        scene.anims.create({
            key: 'bomb-exploding-up-head',
            frames: scene.anims.generateFrameNumbers('bomb-flame', { frames: [20, 21, 22, 23, 24, 23, 22, 21, 20] }),
            frameRate: 18,
            repeat: 0
        });

        scene.anims.create({
            key: 'bomb-exploding-down-head',
            frames: scene.anims.generateFrameNumbers('bomb-flame', { frames: [25, 26, 27, 28, 29, 28, 27, 26, 25] }),
            frameRate: 18,
            repeat: 0
        });

        scene.anims.create({
            key: 'bomb-exploding-right-head',
            frames: scene.anims.generateFrameNumbers('bomb-flame', { frames: [30, 31, 32, 33, 34, 33, 32, 31, 30] }),
            frameRate: 18,
            repeat: 0
        });

        scene.anims.create({
            key: 'bomb-exploding-left-head',
            frames: scene.anims.generateFrameNumbers('bomb-flame', { frames: [35, 36, 37, 38, 39, 38, 37, 36, 35] }),
            frameRate: 18,
            repeat: 0
        });
    }

    $canvas = $('canvas').detach();
    $('.canvasContainer').html($canvas);
    resize();
    window.addEventListener("resize", resize, false);
}

function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;

    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}