// the following global variables adjust the location of the player, enemy, and gem entities
// such that they are drawn within a tile square
var TILEWIDTH = 101, TILEHEIGHT = 83, PLAYER_H_OFFSET = 10, PLAYER_V_OFFSET = 17,
    ENEMY_H_OFFSET = 26, GEM_H_OFFSET = 35;

// this detects if the game needs a reset
var gResetGame = true;

/* This function creates a pseudo-classical base class that player and enemy classes will
* inherit from, such as the x,y location, the width/height, and the sprite properties.
* It also contains the render() method that subclasses will use to draw themselves on the
* screen.
*/
var Entity = function(sprite, loc, size) {
    this.sprite = sprite;
    this.x = loc.x;
    this.y = loc.y;
    this.width = size.width;
    this.height = size.height;
};

// Draw the Entity on the screen, required method for game
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/* This function sets up pseudoclassical inheritance structure between two function
*  objects. subClass will inherit from superClass
*/
inherit = function(subClass,superClass) {
    subClass.prototype = Object.create(superClass.prototype); // delegate to prototype
    subClass.prototype.constructor = subClass; // set constructor on prototype
};

/* This creates the Enemy object. Enemy will inherit from Entity object and will contain an
*  additional speed property for the bug and an update method
*/
var Enemy = function(sprite, loc, size) {
    Entity.call(this, sprite, loc, size);

    // speed of the bug
    this.speed = 10;
};

inherit(Enemy, Entity);

// Update the Enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // if game is over, don't let the bug move
    if (gResetGame)
        return false;
    // get the canvas and current sprite
    var c = ctx.canvas;
    var sprite = Resources.get(this.sprite);

    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    var movex = sprite.width;
    this.x += (dt * this.speed * 5);

    // if the bug has gone off screen vertically, then reposition it back to the left
    // of the screen one body width before start of the game board
    if (this.x > c.width) {
        this.x = 0 - this.width;
        // bugs can only move between rows 1 and 3, so randomly select y position
        // for this bug
        var rockPosition = Math.floor((Math.random() * 3) + 1);
        this.y = rockPosition * TILEHEIGHT - ENEMY_H_OFFSET;

        // to prevent the jerky movement of a bug on screen, set the speed once
        // at the start of the bug's journey across the screen
        // create random position between 1 and this.speed
        this.speed = Math.floor((Math.random() * (movex)) + 1);
    }
};

/* This is the player class. It inherits from the Entity class
*  This class requires an update(), render() and
*  a handleInput() method. In addition, this class contains detectCollision(),
*  reachedWater(), collectedGem(), and handleEvents() methods.
*/
var Player = function(sprite, loc, size) {
    Entity.call(this, sprite, loc, size);
    this.score = 0;
    this.bReachedWater = false;
    this.characters = ['images/char-cat-girl.png',
        'images/char-boy.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png'];
    this.characterIndex = 0;
};

inherit(Player, Entity);

/* This function is in charge of checking the movements of the player across the screen.
 * It creates safeguards for out of bounds movement and checks for game resets
 */
Player.prototype.update = function() {
    // if game is over, don't let the player move
    if (gResetGame) {
        return false;
    }

    var c = ctx.canvas;
    var sprite = Resources.get(this.sprite);

    // check the right bound position of the player. If she moves
    // out of the canvas width, adjust her position to stay on the last column tile of the board
    if (this.x + sprite.width  > c.width) {
        this.x = 4 * sprite.width;
    } else if (this.x <= -sprite.width) {
        // check the left bound position of the player. Adjust position
        // if she moves out of the canvas
        this.x = 0;
    }

    // check the vertical positions of player at the top and bottom
    // adjust her position if she goes out of bounds
    if (this.y  > TILEHEIGHT * 5) {
        this.y -= TILEHEIGHT;
    } else if (this.y <= 0) {
        this.y = -PLAYER_H_OFFSET;
    }
    return true;
};

/* This function detects the user's keyboard presses. up, down, left, right propels the player
 * vertically and/or horizontally across the board. 'p' allows the user to select the character
 * of the player on the board. 's' starts the game.
 */
Player.prototype.handleInput = function(keyCode) {
    var sprite = Resources.get(this.sprite);
    var movex = sprite.width,
        movey = TILEHEIGHT;

    switch(keyCode){
        case 'left':
            if (!gResetGame) {
                this.x = this.x - movex;
            }
            break;
        case 'up':
            if (!gResetGame) {
                this.y = this.y - movey;
            }
            break;
        case 'right':
            if (!gResetGame) {
                this.x = this.x + movex;
            }
            break;
        case 'down':
            if (!gResetGame) {
                this.y = this.y + movey;
            }
            break;
        case 'p': // allow users to select a different player
            if (gResetGame) {
                this.characterIndex++;
                // cycle back to the zero'th character
                if (this.characterIndex >= this.characters.length) {
                    this.characterIndex = 0;
                }
                this.sprite = this.characters[this.characterIndex];
                this.update(0);
            }
            break;
        case 's':  // restart the game
            gResetGame = false;
            player.score = 0;
            break;
    }
};

/* This is called by the Player's handleEvents function
 * and checks to see if player collided  with an enemy.
 * Returns true if collision occurs; false otherwise.
 */
Player.prototype.detectCollision = function(enemy) {
    var enemyYPos = enemy.y + ENEMY_H_OFFSET;
    var playerXPos = this.x + PLAYER_V_OFFSET;
    var playerYPos = this.y + PLAYER_H_OFFSET;


    if (enemyYPos == playerYPos &&
        (enemy.x <= playerXPos && playerXPos <= enemy.x + enemy.width)) {
        return true;
    }

    if (enemyYPos == playerYPos &&
        (enemy.x <= playerXPos + this.width && playerXPos + this.width <= enemy.x + enemy.width)) {
        return true;
    }

    return false;
};

/* This is called by the Player's handleEvents function
 * and checks to see if player reached the water.
 * Returns true if player reached water; false otherwise.
 */
Player.prototype.reachedWater = function() {
    // the water feature is at row 0 which has a height of 83 pixels. This is checking to
    // see if the the player's y position is in this vicinity
    if (this.y >= -PLAYER_H_OFFSET && this.y < TILEHEIGHT - PLAYER_H_OFFSET) {
        // return player to starting position
        this.x = TILEWIDTH * 2;
        this.y = TILEHEIGHT * 5 - PLAYER_H_OFFSET;

        return true;
    }
    return false;
};

/* This is called by the Player's handleEvents function
 * and checks to see if player collected a gem.
 * Returns true if player collected a gem; false otherwise.
 */
Player.prototype.collectedGem = function(dt) {
    // return immediately if gem is hidden
    if (!gem.bVisible) {
        return false;
    }

    var gemYPos = gem.y + GEM_H_OFFSET;
    var playerXPos = this.x + PLAYER_V_OFFSET;
    var playerYPos = this.y + PLAYER_H_OFFSET;


    if (gemYPos == playerYPos &&
        (gem.x <= playerXPos && playerXPos <= gem.x + gem.width)) {

        return true;
    }

    if (gemYPos == playerYPos &&
        (gem.x <= playerXPos + this.width && playerXPos + this.width <= gem.x + gem.width)) {

        return true;
    }

    return false;
};

/* This function is the workhorse of the Player class. It checks if player
 * collides with an enemy, reaches the water, or collects a gem. It's also in charge
 * of displaying the score on the board based on the events that just happened.
 */

Player.prototype.handleEvents = function(enemy) {
    // clear the screen first
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle = 'purple';
    ctx.font = 'bold 16px Arial';


    // check if the player collided with any bugs
    if (player.detectCollision(enemy)) {
        player.score--;
        player.x = TILEWIDTH * 2;
        player.y = TILEHEIGHT * 5 - PLAYER_H_OFFSET;
        ctx.fillText('Yikes! Collision', 0, 604);
    } else if (player.reachedWater()) {
        if (!player.bReachedWater) {
            player.score++;
            player.bReachedWater = true;
        }
        ctx.fillText('I love the lake!', 0, 604);
    } else if (player.collectedGem()) {
            player.score += 2;
            gem.bVisible = false;
    } else {
        // player is no longer in the water section so reset the flag
        player.bReachedWater = false;
    }

    // now check to see if we need to restart/reset the game
    if (player.score < 0) {
        gResetGame = true;
    }

    // now display the score, while in play
    if (!gResetGame) {
        var scoreText = 'Score: ' + player.score;
        ctx.save();
        ctx.fillText(scoreText, 200, 604);
        ctx.restore();
    } else {
        // if game is over, then let the user know
        if (player.score < 0){
            ctx.fillText('Game Over. Press \'s\' to restart, \'p\' to select another player.', 0, 604);
        }
        // game hasn't started yet, so display the correct prompt to the user
        else if (player.score == 0)
        {
            ctx.fillText('Press \'p\' to select a player. Then \'s\' to start the game.', 0, 604);
        }
    }
};

/* This class creates the gem objects that user can collect on the board to gain more scores.
 * It also inherits from the Entity class because it needs an x,y, width, height properties and
 * render() method.
 */
var Gem = function(sprite, loc, size) {
    Entity.call(this, sprite, loc, size);
    this.bVisible = true;
    this.gems = [
        'images/Gem Blue.png',
        'images/Gem Green.png',
        'images/Gem Orange.png'
    ];
    this.currentGem = 0;
    // regulates when gems appear
    this.gemTimeCounter = 0;
    this.gemTime = 15;
};

inherit(Gem, Entity);

Gem.prototype.update = function(dt) {
    this.gemTimeCounter += dt;
    // if gem is not on the board, use a Math.random to see if we should make
    // it visible again and also time the appearance of the gem every 15 dt
    if (!this.bVisible && this.gemTimeCounter > this.gemTime) {
        this.bVisible = Math.floor(Math.random() + 1);
        var xPosition = Math.floor((Math.random() * 4));
        var yPosition = Math.floor((Math.random() * 3) + 1);
        this.x = xPosition * TILEWIDTH;
        this.y = yPosition * TILEHEIGHT - GEM_H_OFFSET;
        if (this.currentGem >= this.gems.length) {
            this.currentGem = 0;
        }
        this.sprite = this.gems[this.currentGem++];
        // reset gemTime
        this.gemTimeCounter = 0;
    }
    return true;
};

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        80: 'p',
        83: 's'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});

/************* Instantiate player, enemies, and gem to display on the board *************/
// create enemy #1
var bugSize = {width: 101, height: 69};
var enemy1 = new Enemy('images/enemy-bug.png', {x: 0, y: (TILEHEIGHT - ENEMY_H_OFFSET)}, bugSize);

// create enemy #2
var enemy2 = new Enemy('images/enemy-bug.png', {x: TILEWIDTH, y: (TILEHEIGHT * 2 - ENEMY_H_OFFSET)}, bugSize);

// create enemy #3
var enemy3 = new Enemy('images/enemy-bug.png', {x: (TILEWIDTH * 2), y: (TILEHEIGHT * 3 - ENEMY_H_OFFSET)}, bugSize);

// create enemy #4
var enemy4 = new Enemy('images/enemy-bug.png', {x: TILEWIDTH, y: (TILEHEIGHT * 3 - ENEMY_H_OFFSET)}, bugSize);

// create enemy #4
var enemy5 = new Enemy('images/enemy-bug.png', {x: (TILEWIDTH * 3), y: (TILEHEIGHT * 3 - ENEMY_H_OFFSET)}, bugSize);

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
var allEnemies = [enemy1, enemy2, enemy3, enemy4, enemy5];

// Instantiate Gems
var gem = new Gem('images/Gem Blue.png', {x: 0, y: (TILEHEIGHT * 3 - GEM_H_OFFSET)}, {width: 101, height: 105});

// Place the player object in a variable called player
var playerSize = {width: 68, height: 80};
var player = new Player('images/char-cat-girl.png', {x: (TILEWIDTH * 2), y: (TILEHEIGHT * 5 - PLAYER_H_OFFSET)},
    playerSize);