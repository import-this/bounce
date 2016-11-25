/**
 * Bounce
 * https://import-this.github.io/bounce
 *
 * An HTML5 clone of a now pretty old version of Artem Rakhmatulin's Insanity!.
 * (You can check Insanity! @ https://itunes.apple.com/us/app/insanity!/id892935435)
 *
 * Copyright (c) 2016, Vasilis Poulimenos
 * Released under the BSD 3-Clause License
 * https://github.com/import-this/bounce/blob/master/LICENSE
 *
 * Supported browsers (as suggested by online references):
 *     IE 9+, FF 4+, Chrome 5+, Opera 11.60+, SF 5+
 *     + corresponding mobile versions.
 *
 * Also, note the Phaser requirements:
 *     https://github.com/photonstorm/phaser#requirements
 * especially the polyfill for IE9:
 *     https://github.com/photonstorm/phaser#ie9
 * (Phaser provides some polyfills, e.g. rAF and Function.prototype.bind.)
 *
 * The code follows the conventions of Google JavaScript Style Guide,
 *     with some alterations. The style guide is described in depth here:
 *     https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
 * Comments follow the conventions of JSDoc. Documentation can be found here:
 *     http://usejsdoc.org/
 *
 * Date: 28/9/2016
 * @version: 2.0.0
 * @author Vasilis Poulimenos
 */

/*globals Phaser */
(function(window, Phaser) {

"use strict";

function noop() {}

/******************************* Basic Logging ********************************/

/** @const */
var log = (function() {
    var console = window.console;

    if (console && console.log) {
        // Don't simply return console.log, because that messes up 'this'.
        return function log(msg) {console.log(msg); };
    }
    return noop;
}());

/******************************* Local Storage ********************************/

/*
 * https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage
 * http://dev.w3.org/html5/webstorage/
 */

/**
 * A storage manager for the game.
 * Manages local storage.
 *
 * @param {Storage} [localStorage=window.localStorage] - The local storage.
 * @constructor
 */
function GameStorageManager(localStorage) {
    var difficultyKey = GameStorageManager._DIFFICULTY_KEY,
        highScoreKey = GameStorageManager._HIGH_SCORE_KEY,
        timesKey = GameStorageManager._TIMES_PLAYED_KEY;

    this._local = localStorage || window.localStorage;
    this._local.setItem(difficultyKey,  this._local.getItem(difficultyKey) || 0);
    this._local.setItem(highScoreKey,   this._local.getItem(highScoreKey) || 0);
    this._local.setItem(timesKey,       this._local.getItem(timesKey) || 0);
}

/**
 * Local storage is per origin (per domain and protocol),
 * so use a prefix to avoid collisions with other games.
 * @const {string}
 */
GameStorageManager.PREFIX = 'bounce_';
/** @const {string} */
GameStorageManager._DIFFICULTY_KEY = GameStorageManager.PREFIX + 'difficulty';
/** @const {string} */
GameStorageManager._HIGH_SCORE_KEY = GameStorageManager.PREFIX + 'highScore';
/** @const {string} */
GameStorageManager._TIMES_PLAYED_KEY = GameStorageManager.PREFIX + 'timesPlayed';

/** @const {string} */
GameStorageManager._SCORE_TYPE_MSG = 'Score cannot be interpreted as a number';
/** @const {string} */
GameStorageManager._NEG_SCORE_MSG = 'Negative score';

/**
 * Clears the local storage.
 * @return {GameStorageManager} this
 */
GameStorageManager.prototype._clearLocal = function() {
    this._local.clear();
    return this;
};

/**
 * Clears the storage.
 * @return {GameStorageManager} this
 */
GameStorageManager.prototype.clear = function() {
    return this._clearLocal();
};

/**
 * Returns the difficulty level.
 * @return {number} The difficulty level.
 */
GameStorageManager.prototype.getDifficulty = function() {
    return Number(this._local.getItem(GameStorageManager._DIFFICULTY_KEY));
};

/**
 * Sets the difficulty level.
 */
GameStorageManager.prototype.setDifficulty = function(difficulty) {
    this._local.setItem(GameStorageManager._DIFFICULTY_KEY, difficulty);
};

/**
 * Returns the all-time high score.
 * @return {number} The all-time high score.
 */
GameStorageManager.prototype.getHighScore = function() {
    return Number(this._local.getItem(GameStorageManager._HIGH_SCORE_KEY));
};

/**
 * Sets the new all-time high score.
 * If the score specified is lower than the previous one,
 * then this method does nothing.
 *
 * @param {number} score - The new high score.
 * @throws {TypeError} if the parameter cannot be interpreted as a number.
 * @throws {RangeError} if the new score is negative.
 * @return {boolean} true if the high score changed.
 */
GameStorageManager.prototype.updateHighScore = function(score) {
    score = Number(score);
    if (isNaN(score)) {
        throw new TypeError(GameStorageManager._SCORE_TYPE_MSG);
    }
    if (score < 0) {
        throw new RangeError(GameStorageManager._NEG_SCORE_MSG);
    }
    if (score < this.getHighScore()) {
        return false;
    }
    this._local.setItem(GameStorageManager._HIGH_SCORE_KEY, score);
    return true;
};

/**
 * Erases the all-time high score.
 */
GameStorageManager.prototype.resetHighScore = function() {
    this._local.setItem(GameStorageManager._HIGH_SCORE_KEY, 0);
};

/**
 * Returns the times that the player has played the game.
 * @return {number} The times played.
 */
GameStorageManager.prototype.getTimesPlayed = function() {
    return Number(this._local.getItem(GameStorageManager._TIMES_PLAYED_KEY));
};

/**
 * Increments the times that the player has played the game.
 * @return {number} The times played after incrementing.
 */
GameStorageManager.prototype.incTimesPlayed = function() {
    var timesPlayedKey = GameStorageManager._TIMES_PLAYED_KEY,
        timesPlayed = Number(this._local.getItem(timesPlayedKey)) + 1;

    this._local.setItem(timesPlayedKey, timesPlayed);
    return timesPlayed;
};

/**
 * Erases the times that the player has played the game.
 */
GameStorageManager.prototype.resetTimesPlayed = function() {
    this._local.setItem(GameStorageManager._TIMES_PLAYED_KEY, 0);
};

/*********************************** Bounce ***********************************/

/**
 * Don't forget to set this to false in production!
 * @const
 */
var DEBUG = !true;

/**
 * Some module global settings for our Phaser game.
 * @const
 */
var CLEAR_WORLD = true,
    CLEAR_CACHE = false,
    /**
     * Arcade physics support AABB (but not BB) vs Circle collision detection
     * since version 2.6.0 (released 8/7/2016), but there seems to be a bug as
     * of version 2.6.1 that causes such collision detection to fail at times.
     * So let's use the more expensive but powerful P2 physics system.
     *
     * Note: When a game object is given a P2 body, it has its anchor set to 0.5.
     */
    PHYSICS_SYSTEM = Phaser.Physics.P2JS,

    /**
     * Cache keys.
     */
    CACHE_KEY_PLAYER = 'player',
    CACHE_KEY_RECTS = [
        'rect1', 'rect2', 'rect3'
    ],
    CACHE_KEY_BG = 'background',
    CACHE_KEY_OVERLAY = 'overlay',

    DEBUG_POSX = 32;

/*
 * Note: All dimensions/lengths/distances are measured in pixels.
 *       It's best to keep all values round.
 */

/**
 *
 * The screen ratio for most devices is 16/9,
 * so we pick a corresponding resolution.
 * http://www.w3schools.com/browsers/browsers_display.asp
 * https://www.w3counter.com/globalstats.php
 *
 * @const
 */
var NATIVE_WIDTH = 1366,
    NATIVE_HEIGHT = 768;
//var NATIVE_WIDTH = 640,
//    NATIVE_HEIGHT = 360;
//var NATIVE_WIDTH = 1024,
//    NATIVE_HEIGHT = 576;


/**
 * The Bounce namespace.
 * @namespace
 */
var Bounce = {
    /**
     * Sprite properties.
     *
     * Note:
     * To avoid single-pixel jitters on mobile devices, it is strongly
     * recommended to use Sprite sizes that are even on both axis.
     */
    player: {
        // Offset used for adjusting shadow positions.
        offset: 3
    },
    rect: {
        // Offset used for adjusting shadow positions.
        offset: 5
    },
    desktop: {
        player: {
            radius: 32
        },
        rect: {
            speed: 500
        },
        // Base side length: 192
        // Caution: Some heights may cause weird physics.
        dimlist: [
            {width: 192, height: 192},   // scale = (1.00, 1.00)
            {width: 426, height:  78},   // scale ~ (2.22, 0.40)
            {width: 326, height: 136}    // scale ~ (1.70, 0.71)
        ]
    },
    mobile: {
        player: {
            radius: 32
        },
        rect: {
            // Offset used for adjusting shadow positions.
            offset: 5,
            speed: 380
        },
        // Base side length: 128
        // Caution: Some heights may cause weird physics.
        dimlist: [
            {width: 128, height: 128},   // scale = (1.00, 1.00)
            {width: 284, height:  50},   // scale ~ (2.22, 0.39)
            {width: 218, height:  90}    // scale ~ (1.70, 0.70)
        ]
    },

    /**
     * Game mutators.
     */
    mutators: {
        fastFactor: 1.35,
        speedup: {
            interval: 2000, // millisecs
            inc: 12         // pixels/sec increment
        },
        bigFactor: 1.5
    },

    /**
     * Keyboard Controls.
     */
    controls: {
        quitKey: Phaser.KeyCode.ESC
    }
};

/**
 * Styling options.
 */
Bounce.style = {
    stage: {
        backgroundColor: 'rgb(20, 21, 22)'
    },
    background: {
        lightColor: 'rgb(62, 63, 64)',
        darkColor: 'rgb(30, 31, 32)'
    },
    overlay: {
        color: 'rgba(16, 16, 16, 0.35)'
    },
    player: {
        color: 'rgba(3, 120, 188, 0.95)',
        //color: 'rgba(45, 117, 223, 0.95)',
        //color: 'rgba(0, 122, 255, 0.95)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowColor: 'rgba(70, 192, 255, 0.975)',
        shadowBlur: Bounce.player.offset * 2
    },
    rect: {
        color: 'rgba(255, 34, 33, 0.8)',
        //color: 'rgba(0, 122, 255, 0.8)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowColor: 'rgba(255, 34, 33, 0.975)',
        shadowBlur: Bounce.rect.offset * 2
    },
    score: {
        font: 'Arial',
        fontSize: '70px',
        fontWeight: 'normal',
        fill: 'rgba(255, 34, 33, 0.5)',
        boundsAlignH: 'center',
        boundsAlignV: 'middle',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowColor: 'rgba(255, 34, 33, 0.6)',
        shadowBlur: 2
    }
};

Bounce.style2 = {
    background: {
        lightColor: 'rgb(216, 216, 216)',
        darkColor: 'rgb(56, 56, 56)'
    },
    player: {
        color: 'rgba(255, 255, 0, 0.95)',
        shadowColor: 'rgba(255, 255, 0, 0.975)'
    },
    rect: {
        color: 'rgba(0, 122, 255, 0.7)',
        shadowColor: 'rgba(0, 122, 255, 0.975)'
    }
};


if (DEBUG) {
    // Freeze objects in DEBUG mode to detect erroneous overriding,
    // but leave them open for modification in production code.
    if (Object.freeze) {
        (function recursiveFreeze(obj) {
            var prop;

            for (prop in obj) {
                if (typeof obj[prop] === 'object') {
                    Object.freeze(obj[prop]);
                    recursiveFreeze(obj[prop]);
                }
            }
        }(Bounce));
    }
}


Bounce.GameStorageManager = GameStorageManager;

/******************************* Utilities ********************************/

/**
 * Text that is always centered in the specified bounds.
 */
function CenteredText(game, text, style, bounds) {
    Phaser.Text.call(this, game, 0, 0, text, style);

    this.bounds = bounds;

    this.name = '"' + text + '"';
    this.anchor.set(0.5);

    this._resize();
    this.game.scale.onSizeChange.add(this._resize, this);
}

CenteredText.prototype = Object.create(Phaser.Text.prototype);
CenteredText.prototype.constructor = CenteredText;

CenteredText.prototype._resize = function() {
    this.x = this.bounds.x + this.bounds.halfWidth;
    this.y = this.bounds.y + this.bounds.halfHeight;
    if (DEBUG) log('Centered ' + this.name + ' in bounds.');
};

CenteredText.prototype.destroy = function() {
    this.game.scale.onSizeChange.remove(this._resize, this);

    Phaser.Text.prototype.destroy.call(this);
};


/**
 * Sets the scale object specified such that it will fill the screen, but
 * crop some of the top/bottom or left/right sides of the playing field.
 * http://stackoverflow.com/a/33517425/1751037
 *
 * @param {Phaser.Point} scale - the scale object to set
 * @param {number} width - the target width
 * @param {number} height - the target height
 * @param {number} nativeWidth - the native width of the game
 * @param {number} nativeHeight - the native height of the game
 */
function scaleToFill(scale, width, height, nativeWidth, nativeHeight) {
    scale.setTo(Math.max(width / nativeWidth, height / nativeHeight));
}

function setSpriteProps(sprite, props) {
    var prop;

    for (prop in props) {
        if (props.hasOwnProperty(prop)) {
            sprite[prop] = props[prop];
        }
    }
}


/**
 * A state that supports a scalable game display area.
 */
Bounce._ScalableState = function(game) {
    // These will be set in 'create'.
    this.nativeWidth = 0;
    this.nativeHeight = 0;
};

/**
 * Don't forget to call this method in subclasses.
 */
Bounce._ScalableState.prototype.create = function() {
    this.nativeWidth = (this.game.bounce.isMouse) ? NATIVE_WIDTH : NATIVE_HEIGHT;
    this.nativeHeight = (this.game.bounce.isMouse) ? NATIVE_HEIGHT : NATIVE_WIDTH;
};

/**
 * Sets the world size.
 */
Bounce._ScalableState.prototype._setWorldBounds = function(width, height) {
    width = width || this.game.width;
    height = height || this.game.height;

    this.world.setBounds(0, 0, width, height);
    if (DEBUG) log('Set world bounds to: ' + this.world.bounds);
};

/**
 * Sets the camera scale so that the player sees about the same portion of the
 * playing field. The strategy selected scales the game so as to fill the screen.
 * Note that since we maintain game proportions, this strategy will not crop any
 * parts of the playing field.
 */
Bounce._ScalableState.prototype._setCameraScale = function(width, height) {
    scaleToFill(this.camera.scale, width, height, this.nativeWidth, this.nativeHeight);
    if (DEBUG) log('Set camera scale to: ' + this.camera.scale);
};

/**
 * Override hook.
 */
Bounce._ScalableState.prototype._onResize = function(width, height) {};

/**
 *
 * I *think* that scaling via canvas, instead of canvas.style, looks better
 * (even though I don't know what algorithm Chrome runs under the covers).
 * Note that we will still use the ScaleManager (see Boot state) for page
 * alignment and maintaining game proportions (to avoid some extra code),
 * but the reported scale factor will always be 1 after calling 'setGameSize'.
 *
 * @protected
 */
Bounce._ScalableState.prototype._setScaling = function() {
    this.scale.onSizeChange.add(function resize(scale, newWidth, newHeight) {
        //
        this.scale.setGameSize(newWidth, newHeight);
        this._setWorldBounds(this.nativeWidth, this.nativeHeight);
        this._setCameraScale(newWidth, newHeight);
        this._onResize(newWidth, newHeight);
        if (DEBUG) log('Resized game.');
    }, this);
    this.scale.setGameSize(this.nativeWidth, this.nativeHeight);
    this._setWorldBounds(this.nativeWidth, this.nativeHeight);
    this._setCameraScale(this.scale.width, this.scale.height);
    if (DEBUG) log('Set scaling.');
};


/**
 * The base state of our game.
 * It supports desktop and mobile modes.
 */
Bounce._BounceState = function(game) {
    Bounce._ScalableState.call(this, game);

    /**
     * The sprite options.
     */
    this.bounce = null;
    /**
     * The bounds of our bouncy world.
     */
    this.bounds = null;
};

Bounce._BounceState.prototype = Object.create(Bounce._ScalableState.prototype);
Bounce._BounceState.prototype.constructor = Bounce._BounceState;

/**
 * Don't forget to call this method in subclasses.
 */
Bounce._BounceState.prototype.create = function() {
    var y;

    Bounce._ScalableState.prototype.create.call(this);

    // Scaling should be specified first, so that further calculations are correct.
    this._setScaling();

    if (this.game.bounce.isMouse) {
        this.bounce = Bounce.desktop;
        y = this.world.height;
    } else {
        this.bounce = Bounce.mobile;
        y = this.world.bounds.halfHeight;
    }
    this.bounds = new Phaser.Rectangle(0, 0, this.world.width, y);

    this.physics.p2.setBounds(0, 0, this.bounds.width, this.bounds.height);
};

Bounce._BounceState.prototype._onResize = function() {
    // Game world resizing (due to scaling) messes with the physics bounds.
    this.physics.p2.setBounds(0, 0, this.bounds.width, this.bounds.height);
};

Bounce._BounceState.prototype.addBackground = function() {
    return this.add.image(0, 0, this.cache.getBitmapData(CACHE_KEY_BG));
};

Bounce._BounceState.prototype.createRects = function(group, five) {
    function createRect(game, group, props, i) {
        var rect = group.create(0, 0, game.cache.getBitmapData(props.key));

        rect.name = 'Rect ' + i;
        // Set the sprite position.
        setSpriteProps(rect, props.pos);
    }

    var rectProps = [{
        // Top-left
        pos: {
            top: -Bounce.rect.offset,
            left: -Bounce.rect.offset
        },
        key: CACHE_KEY_RECTS[0]
    }, {
        // Top-right
        pos: {
            top: -Bounce.rect.offset,
            right: this.bounds.width + Bounce.rect.offset
        },
        key: CACHE_KEY_RECTS[0]
    }, {
        // Bottom-left
        pos: {
            bottom: this.bounds.height + Bounce.rect.offset,
            left: -Bounce.rect.offset
        },
        key: CACHE_KEY_RECTS[1]
    }, {
        // Bottom-right
        pos: {
            bottom: this.bounds.height + Bounce.rect.offset,
            right: this.bounds.width + Bounce.rect.offset
        },
        key: CACHE_KEY_RECTS[2]
    }];

    if (five) {
        rectProps.push({
            // Top-middle
            pos: {
                top: -Bounce.rect.offset,
                left: -Bounce.rect.offset + Math.round(
                    (this.bounds.width - this.bounce.dimlist[0].width) / 2)
            },
            key: CACHE_KEY_RECTS[0]
        });
    }

    rectProps.forEach(function(props, index) {
        createRect(this, group, props, index);
    }, this);
};

/******************************* Boot State *******************************/

/**
 * State used to boot the game.
 * This state is used to perform any operations that should only be
 * executed once for the entire game (e.g. setting game options, etc.).
 */
Bounce.Boot = function(game) {};

Bounce.Boot.prototype.init = function() {
    if (DEBUG) log('Initializing Boot state...');

    // Our game does not need multi-touch support,
    // so it is recommended to set this to 1.
    this.input.maxPointers = 1;

    // Setting this here (instead of the Phaser.Game config object
    // with antialias set to false) won't work for some reason.
    //this.stage.smoothed = false;
    // Let the game continue when the tab loses focus. This prevents cheating.
    this.stage.disableVisibilityChange = !DEBUG;

    /*
    // Disable all forms of antialiasing for crisp/pixelated scaling.
    // https://github.com/photonstorm/phaser/issues/1586#issuecomment-74843571
    // For Canvas AND WebGL (modern approach)
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
    // For Canvas (legacy approach)
    if (this.game.context) {
        Phaser.Canvas.setSmoothingEnabled(this.game.context, false);
    }
    // For WebGL
    PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
    */

    this.stage.backgroundColor = Bounce.style.stage.backgroundColor;

    // Cover as much of the window as possible, while maintaining proportions.
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.windowConstraints.bottom = 'visual';
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    this.physics.startSystem(PHYSICS_SYSTEM);
    this.physics.p2.setImpactEvents(true);
};

Bounce.Boot.prototype.create = function() {
    if (DEBUG) log('Creating Boot state...');

    this.state.start('Preloader');
};

/***************************** Preloader State ****************************/

function makeBitmapData(game, width, height, key, addToCache) {
    if (addToCache === undefined) addToCache = true;

    // Note: To avoid single-pixel jitters on mobile devices, it is strongly
    // recommended to use Sprite sizes that are even on both axis.
    if (DEBUG && (width % 2 === 1 || height % 2 === 1)) {
        log('WARN: Sprite with odd dimension!');
    }
    // 'add.bitmapData' does the same thing as 'make.bitmapData',
    // i.e. it doesn't actually add the bitmapData object to the world.
    // (BitmapData's are Game Objects and don't live on the display list.)
    return game.make.bitmapData(width, height, key, addToCache);
}

function circle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
}

/**
 * State used for loading or creating any assets needed in the game.
 */
Bounce.Preloader = function(game) {
    Bounce._BounceState.call(this, game);
};

Bounce.Preloader.prototype = Object.create(Bounce._BounceState.prototype);
Bounce.Preloader.prototype.constructor = Bounce.Preloader;

Bounce.Preloader.prototype._makePlayerBitmap = function() {
    var style = Bounce.style.player, offset = Bounce.player.offset, width, bmd, ctx;

    // Same width and height.
    width = 2 * this.bounce.player.radius;
    bmd = makeBitmapData(this, width, width, CACHE_KEY_PLAYER);
    ctx = bmd.ctx;

    ctx.fillStyle = style.color;
    ctx.shadowOffsetX = style.shadowOffsetX;
    ctx.shadowOffsetY = style.shadowOffsetY;
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur;

    ctx.translate(bmd.width / 2, bmd.height / 2);
    // Draw the shape a little smaller, so as not to cover the shadow.
    circle(ctx, 0, 0, this.bounce.player.radius - offset);
    ctx.fill();
};

Bounce.Preloader.prototype._makeRectBitmap = function(width, height, key) {
    var style = Bounce.style.rect, offset = Bounce.rect.offset, bmd, ctx;

    bmd = makeBitmapData(this, width, height, key);
    ctx = bmd.ctx;

    ctx.shadowOffsetX = style.shadowOffsetX;
    ctx.shadowOffsetY = style.shadowOffsetY;
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur;

    // Draw the shape a little smaller, so as not to cover the shadow.
    bmd.rect(offset, offset, width - offset*2, height - offset*2, style.color);
};

Bounce.Preloader.prototype._makeRectBitmaps = function() {
    var dimlist = this.bounce.dimlist, i, dims;

    for (i = 0; i < dimlist.length; ++i) {
        dims = dimlist[i];
        this._makeRectBitmap(dims.width, dims.height, CACHE_KEY_RECTS[i]);
    }
};

Bounce.Preloader.prototype._makeBackgroundBitmap = function() {
    var width = this.nativeWidth, height = this.nativeHeight, bmd, ctx;

    bmd = makeBitmapData(this, width, height, CACHE_KEY_BG);
    ctx = bmd.ctx;

    if (this.game.bounce.isMouse) {
        ctx.fillStyle = Bounce.style.background.darkColor;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.fillStyle = Bounce.style.background.darkColor;
        ctx.fillRect(0, 0, width, height / 2);
        ctx.fillStyle = Bounce.style.background.lightColor;
        ctx.fillRect(0, height / 2, width, height / 2);
    }
};

Bounce.Preloader.prototype._makeOverlayBitmap = function() {
    var bmd = makeBitmapData(this, this.nativeWidth, this.nativeHeight, CACHE_KEY_OVERLAY);

    bmd.rect(0, 0, bmd.width, bmd.height, Bounce.style.overlay.color);
};

Bounce.Preloader.prototype.preload = function() {};

Bounce.Preloader.prototype.create = function() {
    if (DEBUG) log('Creating Preloader state...');

    Bounce._BounceState.prototype.create.call(this);

    this._makePlayerBitmap();
    this._makeRectBitmaps();
    this._makeBackgroundBitmap();
    this._makeOverlayBitmap();
};

Bounce.Preloader.prototype.update = function() {
    // No actual wait for asset loading, so go to the next state immediately.
    this.state.start('MainMenu');
};

/***************************** Main Menu State ****************************/

Bounce.MainMenu = function(game) {
    Bounce._BounceState.call(this, game);
};

Bounce.MainMenu.prototype = Object.create(Bounce._BounceState.prototype);
Bounce.MainMenu.prototype.constructor = Bounce.MainMenu;

Bounce.MainMenu.prototype.create = function() {
    var sprite;

    if (DEBUG) log('Creating MainMenu state...');

    Bounce._BounceState.prototype.create.call(this);

    this.addBackground();

    sprite = this.add.sprite(
        this.bounds.centerX, this.bounds.centerY,
        this.cache.getBitmapData(CACHE_KEY_PLAYER));
    sprite.anchor.set(0.5, 0.5);

    this.createRects(this.add.group(), this.game.bounce.five);

    this.camera.follow(this.world);

    this.game.bounce.onMainMenuOpen();
    // We will transition to the next state through the DOM menu!
};

/**
 * Used here for debugging purposes.
 */
Bounce.MainMenu.prototype.render = function() {
    if (DEBUG) {
        this.game.debug.cameraInfo(this.camera, DEBUG_POSX, 128);
        this.game.debug.inputInfo(DEBUG_POSX, 128+64+32);
        this.game.debug.pointer(this.input.activePointer);
        this.game.debug.text('DEBUG: ' + DEBUG, DEBUG_POSX, this.game.height-16);
    }
};

/***************************** End Menu State ****************************/

Bounce.EndMenu = function(game) {
    Bounce._BounceState.call(this, game);
};

Bounce.EndMenu.prototype = Object.create(Bounce._BounceState.prototype);
Bounce.EndMenu.prototype.constructor = Bounce.EndMenu;

/** @const */
var AUTOSTART = true;

Bounce.EndMenu.prototype.create = function() {
    var duration = 1000, overlay;

    if (DEBUG) log('Creating EndMenu state...');

    Bounce._BounceState.prototype.create.call(this);

    overlay = this.add.image(0, 0, this.cache.getBitmapData(CACHE_KEY_OVERLAY));
    overlay.name = 'Overlay';
    overlay.alpha = 0;
    this.add.tween(overlay).to({
        alpha: 1
    }, duration, Phaser.Easing.Linear.None, AUTOSTART);

    this.camera.follow(this.world);

    this.game.bounce.onEndMenuOpen();
    // We will transition to the next state through the DOM menu!
};

/******************************* Game State *******************************/

Bounce.Game = function(game) {
    Bounce._BounceState.call(this, game);

    this._player = null;
    this._rects = null;

    this._speed = 0;
};

Bounce.Game.prototype = Object.create(Bounce._BounceState.prototype);
Bounce.Game.prototype.constructor = Bounce.Game;


Bounce.Game.prototype._addScore = function() {
    var style = Bounce.style.score, bounds, text;

    if (this.game.bounce.isMouse) {
        bounds = this.bounds;
    } else {
        bounds = this.bounds.clone().offset(0, this.bounds.height);
    }

    // Store the score in the bounce namespace for easy access.
    this.game.bounce.score = 0;
    text = this.add.existing(new CenteredText(this.game, 0, style, bounds));
    text.setShadow(
        style.shadowOffsetX, style.shadowOffsetY,
        style.shadowColor, style.shadowBlur);

    this.input.onDown.addOnce(function startCount() {
        this.time.events.loop(Phaser.Timer.SECOND / 2, function updateScore() {
            text.text = ++this.game.bounce.score;
        }, this);
    }, this);
};

Bounce.Game.prototype._addPlayer = function(playerColGroup, rectsColGroup) {
    var player;

    this._player = player = this.add.sprite(
        this.bounds.centerX, this.bounds.centerY,
        this.cache.getBitmapData(CACHE_KEY_PLAYER));
    player.name = 'Player';

    player.inputEnabled = true;
    player.input.useHandCursor = true;

    this.physics.enable(player, PHYSICS_SYSTEM, DEBUG);
    //
    player.body.setCircle(this.bounce.player.radius - Bounce.player.offset);
    player.body.setCollisionGroup(playerColGroup);
    // Do NOT produce contact forces, so that the player
    // does not change the direction of other sprites.
    // We need to access the P2JS internals for this.
    player.body.data.collisionResponse = false;
    // The player collides with the rectangles and the world bounds.
    player.body.collides(rectsColGroup);
    player.body.onBeginContact.add(function lose(otherBody, playerBody) {
        // http://phaser.io/examples/v2/p2-physics/contact-events
        // The storage manager will check if it is a high score.
        Bounce.storage.updateHighScore(this.game.bounce.score);
        this.state.start('EndMenu', !CLEAR_WORLD, CLEAR_CACHE);
    }, this);
};

Bounce.Game.prototype._addRects = function(rectsColGroup, playerColGroup) {
    this._rects = this.add.physicsGroup(PHYSICS_SYSTEM);
    this._rects.name = 'Rectangles';
    this.createRects(this._rects, this.game.bounce.five);
    this._rects.forEach(function setRectBody(rect, rectsColGroup, playerColGroup) {
        var offset = Bounce.rect.offset;

        //
        rect.body.setRectangle(rect.width - offset*2, rect.height - offset*2);

        // The P2 body is not updated correctly for some reason, so we do it ourselves.
        rect.body.x = rect.x;
        rect.body.y = rect.y;

        rect.body.setCollisionGroup(rectsColGroup);
        // Rects collide against the player.
        rect.body.collides(playerColGroup);
        // Forbid rotation.
        rect.body.fixedRotation = true;
        //
        rect.body.damping = 0;
        // Define a small mass (default is 1), to minimize energy loss.
        rect.body.mass = 0.000001;
        rect.body.debug = DEBUG;
    }, this, false, rectsColGroup, playerColGroup);
};

/**
 *
 * Note that since we scale the game via the camera.scale, we need to
 * take it into account (ScaleManager will report a scale factor of 1).
 */
Bounce.Game.prototype._enableDrag = function() {
    var scale = this.camera.scale, player = this._player, dx, dy;

    function drag(pointer, pointerX, pointerY, isClick) {
        player.body.x = pointerX/scale.x + dx;
        player.body.y = pointerY/scale.y + dy;
    }

    this.input.onDown.add(function startDrag(pointer, event) {
        this.addMoveCallback(drag, this);
        dx = player.body.x - this.x/scale.x;
        dy = player.body.y - this.y/scale.y;
        if (DEBUG) log('Started drag.');
    }, this.input);
    this.input.onUp.add(function stopDrag(pointer, event) {
        this.deleteMoveCallback(drag, this);
        if (DEBUG) log('Stopped drag.');
    }, this.input);
};


Bounce.Game.prototype.quit = function quit() {
    this.state.start('MainMenu');
};

Bounce.Game.prototype.create = function() {
    var stdSpeed, playerColGroup, rectsColGroup;

    if (DEBUG) log('Creating Game state...');

    Bounce._BounceState.prototype.create.call(this);

    // Mutators.
    // Faster boxes mutator enabled?
    stdSpeed = this.bounce.rect.speed;
    this._speed = (this.game.bounce.fast) ?
        Math.round(stdSpeed * Bounce.mutators.fastFactor) : stdSpeed;
    // Accelerating boxes mutator enabled?
    if (this.game.bounce.speedup) {
        this.input.onDown.addOnce(function startAcc() {
            this.time.events.loop(Bounce.mutators.speedup.interval, function acc() {
                this._speed += Bounce.mutators.speedup.inc;
                this._rects.forEach(function accelerate(rect) {
                    var velocity = rect.body.velocity;

                    if (velocity.x !== 0) {       // Shapes have started moving.
                        velocity.x = (velocity.x > 0) ? this._speed : -this._speed;
                        velocity.y = (velocity.y > 0) ? this._speed : -this._speed;
                    }
                }, this);
            }, this);
        }, this);
    }

    this.addBackground();

    // Collision groups for the player and the rectangles.
    playerColGroup = this.physics.p2.createCollisionGroup();
    rectsColGroup = this.physics.p2.createCollisionGroup();

    this.physics.p2.updateBoundsCollisionGroup();

    this._addScore();
    this._addPlayer(playerColGroup, rectsColGroup);
    this._addRects(rectsColGroup, playerColGroup);
    this._enableDrag();

    // Make the rectangles bounce off walls (with almost no energy loss).
    this.physics.p2.restitution = 1;
    this.physics.p2.friction = 0;
    this.physics.p2.applyDamping = false;

    this.camera.follow(this.world);

    // Create controls.
    this.input.keyboard.addKey(Bounce.controls.quitKey)
        .onDown.addOnce(this.quit, this);

    this.input.onDown.addOnce(function start() {
        // When the rectangles are first created, setting their initial velocity
        // will cause them to bounce off the walls in all cases. This doesn't
        // happen (as it actually should) if they were created beforehand, so
        // destroy the old group and make a new one.
        // TODO: Find a better way to implement this.
        this._rects.destroy();
        this._addRects(rectsColGroup, playerColGroup);
        this._rects.forEach(function setSpeed(rect) {
            rect.body.velocity.x = rect.body.velocity.y = this._speed;
        }, this);
    }, this);

    // The player should render above all other game entities.
    this._player.bringToTop();
    // Calling bringToTop after enabling debugging hides the debug body.
    // http://phaser.io/docs/2.6.2/Phaser.Physics.P2.BodyDebug.html
    if (DEBUG) this.world.bringToTop(this._player.body.debugBody);

    Bounce.storage.incTimesPlayed();
};

Bounce.Game.prototype.update = function() {
    // Nothing to do here, actually. Just do some consistency checks.
    if (DEBUG) {
        this._rects.forEach(function assert(rect) {
            var velocity = rect.body.velocity;

            if (velocity.x !== 0) {       // Shapes have started moving.
                if (Math.abs(velocity.x) !== this._speed ||
                        Math.abs(velocity.y) !== this._speed)
                    throw new Error('Speed loss!');
            }
        }, this);
    }
};

/**
 * Performs final cleanup.
 */
Bounce.Game.prototype.shutdown = function() {
    /*
     * Reminder:
     * Because BitmapData's are now Game Objects themselves, and don't live on
     * the display list, they are NOT automatically cleared when we change
     * State. Therefore we must call BitmapData.destroy in our State's
     * shutdown method if we wish to free-up the resources they use.
     * Note that BitmapData objects added to the cache will be destroyed for us.
     */
};

/**
 * Used here for debugging purposes.
 */
Bounce.Game.prototype.render = function() {
    if (DEBUG) {
        this.game.debug.spriteInfo(this._player, DEBUG_POSX, 32);
        this.game.debug.cameraInfo(this.camera, DEBUG_POSX, 128);
        this.game.debug.inputInfo(DEBUG_POSX, 128+64+32);
        this.game.debug.pointer(this.input.activePointer);
        this.game.debug.text('DEBUG: ' + DEBUG, DEBUG_POSX, this.game.height-16);
    }
};

/****************************** Setup and Expose ******************************/

Bounce.play = function play(parent, config) {
    var opts = Phaser.Utils.extend({
        onMainMenuOpen: noop,
        onEndMenuOpen: noop,
        // The UI uses a mouse or a touch surface?
        isMouse: false,
        // The boxes are moving faster.
        fast: false,
        // The boxes accelerate as the game progresses.
        speedup: false,
        // Five boxes!
        five: false,
        // Bigger boxes.
        big: false
    }, config),
    game = new Phaser.Game({
        width: (opts.isMouse) ? NATIVE_WIDTH : NATIVE_HEIGHT,
        height: (opts.isMouse) ? NATIVE_HEIGHT : NATIVE_WIDTH,
        parent: parent,
        // I've got 99 problems and WebGL is one. :/
        renderer: Phaser.CANVAS,
        //antialias: false    // Disable antialiasing for crisp/pixelated scaling.
    });

    /**
     * The single instance of data storage for our game.
     */
    Bounce.storage = new Bounce.GameStorageManager();

    // Global per-instance options. Use a namespace to avoid name clashes.
    game.bounce = opts;

    game.state.add('Boot', Bounce.Boot);
    game.state.add('Preloader', Bounce.Preloader);
    game.state.add('MainMenu', Bounce.MainMenu);
    game.state.add('EndMenu', Bounce.EndMenu);
    game.state.add('Game', Bounce.Game);

    game.state.start('Boot');

    return game;
};

window.Bounce = Bounce;

}(window, Phaser));
