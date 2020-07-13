var game;
var setupStage, replaceItems, placeBomb, moveEnemy, stopEnemy;

function setupGame() {
    bombs = $('#numberBombs').val();
    flames = $('#numberFlames').val();
    speed = $('#numberSpeed').val();
    startGame(bombs, flames, speed, num_players_ready, id);
}

function startGame(b, f, s, n_players, your_id) {
    $('.lobby').hide();
    $('.game').show();
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
    var musicConfig = {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 0,
    }

    game = new Phaser.Game(config);
    var map, tileset, layer, scene, stage;
    var players;
    var bombs, flipFlopBomb;
    var cursors, animated; //animated is used to show the right animation with the player sprite
    var walls;
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

        this.load.audio("music", "/public/assets/audio/snes_battle_music.mp3");
        this.load.audio("explosion", "/public/assets/audio/explosion.mp3");

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
        this.playersGroup = this.physics.add.group({
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


        // PLAYERS
        players = [];

        players.push(createPlayer(24, 24, 'white-bm', 0));
        if (n_players > 1)
            players.push(createPlayer(216, 24, 'white-bm', 1));
        if (n_players > 2)
            players.push(createPlayer(24, 184, 'white-bm', 2));
        if (n_players > 3)
            players.push(createPlayer(216, 216, 'white-bm', 3));

        scene.physics.add.collider(scene.playersGroup, scene.flamesGroup, (player) => {
            death(player.id);
        }, null, this);

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
        this.physics.add.collider(scene.playersGroup, layer);

        //AUDIO
        this.backgroundSong = this.sound.add("music");
        this.explosion = this.sound.add("explosion");

        //CURSORS
        cursors = this.input.keyboard.createCursorKeys();

        //INITIALIZATIONS VARIABLES
        animated = false;
        bombs = [];

        this.backgroundSong.play(musicConfig);


        socket.emit('request-stage');
    }

    const createPlayer = (x, y, sprites, id) => {
        player = scene.playersGroup.create(x, y, sprites, 7);
        player.setSize(11, 9, 0, 0).setOffset(3, 15).setOrigin(0.5, 0.75);
        player.setDepth(2000);
        player.setCollideWorldBounds(true);
        player.speed = s;
        player.countDeathCollider = 0;
        player.bombs = b;
        player.id = id;
        player.flames = f;
        player.status = 'alive';
        player.godlike = false;
        player.items_collected = [];
        flipFlopBomb = false;

        _.times(player.bombs, () => player.items_collected.push(0));
        _.times(player.flames, () => player.items_collected.push(1));
        _.times(player.speed, () => player.items_collected.push(9));

        return player;
    }


    function update() {

        if (players[your_id].status === 'alive') {
            let anim = '';
            players[your_id].setVelocity(0, 0);
            speed = 50 + players[your_id].speed * 15;

            if (cursors.up.isDown) {
                players[your_id].body.velocity.y = -speed;
                if (cursors.left.isDown) {
                    players[your_id].body.velocity.x = -speed;
                } else if (cursors.right.isDown) {
                    players[your_id].body.velocity.x = speed;
                }

                players[your_id].anims.play('up', true);
                anim = 'up';
                animated = true;

            } else if (cursors.down.isDown) {
                players[your_id].body.velocity.y = speed;
                if (cursors.left.isDown) {
                    players[your_id].body.velocity.x = -speed;
                } else if (cursors.right.isDown) {
                    players[your_id].body.velocity.x = speed;
                }

                players[your_id].anims.play('down', true);
                anim = 'down';
                animated = true;

            } else if (cursors.left.isDown) {
                players[your_id].body.velocity.x = -speed;

                players[your_id].anims.play('left', true);
                anim = 'left';
                animated = true;

            }
            else if (cursors.right.isDown) {
                players[your_id].body.velocity.x = speed;

                players[your_id].anims.play('right', true);
                anim = 'right';
                animated = true;

            }

            if (!flipFlopBomb && players[your_id].bombs > _.filter(bombs, (b) => b.player_id === your_id).length && cursors.space.isDown) {
                placeBomb(players[your_id].x, players[your_id].y, your_id, players[your_id].flames);
                socket.emit('placed-bomb', { x: players[your_id].x, y: players[your_id].y, player_id: your_id, flames_len: players[your_id].flames });
                flipFlopBomb = true;
            }

            if (flipFlopBomb && cursors.space.isUp) {
                flipFlopBomb = false;
            }

            if (animated && players[your_id].body.velocity.x == 0 && players[your_id].body.velocity.y == 0) {
                players[your_id].anims.setCurrentFrame(players[your_id].anims.currentAnim.frames[1]);
                players[your_id].anims.stop();
                anim = 'stop';
                animated = false;
            }

            socket.emit('move-player', {
                player_id: players[your_id].id,
                x: players[your_id].body.velocity.x,
                y: players[your_id].body.velocity.y,
                animation: anim,
            });
        }
    }

    moveEnemy = (x, y, id, animation) => {
        if (id != your_id) {
            if (animation == "stop") {
                players[id].anims.setCurrentFrame(players[id].anims.currentAnim.frames[1]);
                players[id].anims.stop();
                players[id].setVelocity(0, 0);
            }
            else {
                players[id].body.velocity.x = x;
                players[id].body.velocity.y = y;
                players[id].anims.play(animation, true);
            }
        }
    };

    stopEnemy = (id) => {
        if (id != your_id) {
            players[id].anims.setCurrentFrame(players[id].anims.currentAnim.frames[1]);
            players[id].anims.stop();
            players[id].setVelocity(0, 0);
        }
    };



    const death = (id) => {
        if (players[id].countDeathCollider == 0) {
            players[id].countDeathCollider++;
            players[id].status = "dead";
            players[id].anims.play('death', true);
            players[id].once("animationcomplete", () => {
                setTimeout(() => {
                    players[id].destroy();
                }, 1000);
                if (id === your_id)
                    socket.emit('dead-items', { stage: stage, items: players[id].items_collected });
            });
        }
    };

    replaceItems = (items_collected) => {
        _.each(items_collected, (item) => createNewItem(item[0], item[1][0], item[1][1]));
    }

    const destroyWall = (wall) => {
        wall.anims.play("wall-destroyed", true);
        wall.once("animationcomplete", () => {
            x = Math.floor(wall.x / 16);
            y = Math.floor(wall.y / 16);
            if (stage[y][x] === 2) {
                stage[y][x] = 0;
            }
            wall.destroy();
        });
    }

    setupStage = (s, items) => {
        if (!stage) {
            stage = s;
            walls = [];
            for (let i = 1; i < 14; i++) {
                for (let j = 1; j < 12; j++) {
                    if (stage[j][i] === 2 || stage[j][i] == 3) {
                        let wall = scene.wallsGroup.create(i * 16, j * 16, 'walls', 2).setOrigin(0, 0);
                        wall.setImmovable();
                        wall.setDepth(1001);
                        scene.physics.add.collider(scene.playersGroup, wall);
                        walls.push(wall);
                    }
                }
            }

            for (let item of items) {
                createNewItem(item[0], item[1], item[2]);
            }
            console.log("Walls/Items loaded");
        }
    };

    const createNewItem = (item_index, item_x, item_y) => {
        item = scene.itemsGroup.create(item_x, item_y, 'items', item_index).setOrigin(0, 0);
        item.setImmovable();
        item.index = item_index;
        item.player_collider = scene.physics.add.overlap(item, scene.playersGroup, (item, player) => {
            player.items_collected.push(item.index);
            if (item.index == 0 && player.bombs < 10) {
                player.bombs++;
            } else if (item.index == 1 && player.bombs < 13) {
                player.flames++;
            } else if (item.index == 3) {
                player.flames = 13;
            } else if (item.index == 9 && player.speed < 6) {
                player.speed++;
            } else if (item.index == 23 & player.speed > 0) {
                player.speed--;
            }

            x = Math.floor(item.x / 16);
            y = Math.floor(item.y / 16);
            stage[y][x] = 0;
            item.destroy();
        });
    }

    const destroyItem = (item) => {
        item.anims.play('item-destroyed', true);
        item.once('animationcomplete', () => {
            x = Math.floor(item.x / 16);
            y = Math.floor(item.y / 16);
            stage[y][x] = 0;
            item.destroy();
        });
    }


    placeBomb = (x, y, id, flames_len) => {
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
            bomb.player_id = id;
            bomb.flames = flames_len;
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
            scene.physics.add.collider(scene.playersGroup, bomb);
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
        createFlames(bomb.x, bomb.y, origin, bomb.flames);
        scene.explosion.play();
        bomb.destroy();
    }

    const bombOverlapWall = (bomb) => {
        return map.getTileAtWorldXY(bomb.x + 1, bomb.y + 1, layer).index === 1 ||
            map.getTileAtWorldXY(bomb.x + 1, bomb.y + 15, layer).index === 1 ||
            map.getTileAtWorldXY(bomb.x + 15, bomb.y + 1, layer).index === 1 ||
            map.getTileAtWorldXY(bomb.x + 15, bomb.y + 15, layer).index === 1;
    }

    const createFlames = (x, y, origin, flames_len) => {
        u = d = l = r = true;

        flames = [];

        flames.push(scene.flamesGroup.create(x, y, 'bomb-flame', 5).setOrigin(origin, origin));
        flames[flames.length - 1].animation = "bomb-exploding-center";

        for (let i = 0; i < flames_len; i++) {
            if (u)
                u = addFlameUp(flames, x, y, i, flames_len, origin);
            if (d)
                d = addFlameDown(flames, x, y, i, flames_len, origin);
            if (l)
                l = addFlameLR(flames, x, y, i, flames_len, origin, true);
            if (r)
                r = addFlameLR(flames, x, y, i, flames_len, origin, false);
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
}