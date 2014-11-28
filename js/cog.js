/**
 * Cog tiny 2D HTML5 Game JavaScript Library
 * https://github.com/import-this/cog
 *
 * Copyright (c) 2014, Vasilis Poulimenos
 * Released under the BSD 3-Clause License
 * https://github.com/import-this/cog/blob/master/LICENSE
 *
 * Cog is a tiny library inspired by other powerful 2D HTML5 canvas
 * JavaScript libraries like KineticJS, Fabric.js, Paper.js or EaselJS.
 * It is a toy project made out of the effort of trying to understand
 * the process of making an HTML5 game. In all likelihood, it will not
 * be developed any further in the future.
 * No need to reinvent the wheel.
 *
 * Fun fact:
 *      The library name Cog is derived from 'Cognitive science', an
 *      extracurricular course during which I played a game with a
 *      friend on his iPhone and came up with the idea of making a
 *      clone of it. This in turn led to the creation of Cog.
 * Go figure.
 *
 * Supported browsers (as suggested by online references):
 *      IE 9+, FF 4+, Chrome 5+, Opera 11.60+, SF 5+
 *      + corresponding mobile versions.
 *
 * Cog provides polyfills for the following methods:
 *      window.requestAnimationFrame
 *      window.cancelAnimationFrame
 *
 * Public members in the cog namespace:
 *  Constants:
 *      PI2
 *  Basic Objects:
 *      Object
 *          Shape
 *              Circle
 *              Rect
 *              Square
 *          Text
 *  Drawing Classes:
 *      Painter
 *  User Input:
 *      UserInputDaemon
 *  Local Storage:
 *      StorageManager
 *          GameStorageManager
 *  Application Cache:
 *      AppCacheManager
 *  Logging:
 *      log
 *  Utilities:
 *      noConflict
 *
 * The code follows the conventions of Google JavaScript Style Guide,
 *      with some alterations. The style guide is described in depth here:
 *      https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
 * Comments follow the conventions of JSDoc. Documentation can be found here:
 *      http://usejsdoc.org/
 *
 * Date: 15/10/2014
 * @version: 1.0.0
 * @author Vasilis Poulimenos
 */

/*
 * Useful general info:
 *  Reminder for inheritance in JavaScript:
 *      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 *  Compatibility tables:
 *      http://kangax.github.io/compat-table/es5/
 *      http://caniuse.com
 *      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create#Browser_compatibility
 *      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#Browser_compatibility
 *      http://www.quirksmode.org/dom/w3c_cssom.html
 *  Pitfalls:
 *      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
 *      http://kangax.github.io/nfe/
 */

(function(global) {

"use strict";

var cog = {},
    // Save global.cog in case of overwrite.
    oldcog = global.cog;

if (oldcog) {
    if (global.console && global.console.log) {
        global.console.log('cog is already defined and will be overridden.');
    }
}

/********************************* Logging ***********************************/

cog.log = (function() {
    var console = global.console;

    if (console && console.log) {
        return console.log;
    }
    return function log() {
        // Do nothing.
    };
}());

/******************************** Constants **********************************/

// Public
var PI2 = cog.PI2 = Math.PI * 2,

// Private
    // Some properties may be overridden. Get the originals where possible.
    Object = ({}).constructor,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    isNaN = global.isNaN;

/****************************** Polyfills/Shims ******************************/

/*
 * Internet Explorer 8 and earlier versions do not support the <canvas>
 * element at all, so no need to provide polyfills for really old browsers.
 */

/**
 * Polyfill for window.requestAnimationFrame (with small fixes):
 *      https://gist.github.com/paulirish/1579671
 * More info here:
 *      http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
 * Compatibility table:
 *      http://caniuse.com/#feat=requestanimationframe
 */
(function(window) {
    var lastTime = 0,
        vendors = ['webkit', 'moz', 'o', 'ms'],
        i;

    for (i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        window.requestAnimationFrame =
            window[vendors[i] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[i] + 'CancelAnimationFrame'] ||
            window[vendors[i] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            //var currTime = new Date().getTime();
            var currTime = Date.now(),      // Cog doesn't support IE < 9.
                timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            window.clearTimeout(id);
        };
    }
}(global));

/******************************* Basic Objects *******************************/

/**
 * A 2D generic object with x and y coordinates.
 * Root of all objects.
 * Used as an abstract base class.
 *
 * @alias Object
 * @param {Object} options - A configuration object.
 *      The x and y coordinates default to 0.
 * @constructor
 */
// Use an underscore to avoid collision with global.Object.
function Object_(options) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.options = {};
    this._copyOptions(options);
    delete this.options.x;
    delete this.options.y;
}

/**
 * Copies the options given to this.options.
 * @param {Object} options - A configuration object.
 */
Object_.prototype._copyOptions = function(options) {
    // http://stackoverflow.com/a/5344074/1751037
    // No deep copies needed. A simple for in loop sufficies.
    var target = this.options, prop;

    for (prop in options) {
        if (hasOwnProperty.call(options, prop)) {
            target[prop] = options[prop];
        }
    }
};

Object_.prototype.toString = function() {
    return 'cog.Object = ' + JSON.stringify(this);
};

/**
 * Moves the object in the Cartesian plane by (dx, dy) units.
 * @param {number} dx - the distance to move by on the x-axis.
 * @param {number} dy - the distance to move by on the y-axis.
 * @return {cog.Object} this
 */
Object_.prototype.move = function(dx, dy) {
    this.x += dx;
    this.y += dy;
    return this;
};

/**
 * Moves the object in the Cartesian plane by dx units.
 * @param {number} dx - the distance to move by on the x-axis.
 * @return {cog.Object} this
 */
Object_.prototype.moveX = function(dx) {
    this.x += dx;
    return this;
};

/**
 * Moves the object in the Cartesian plane by dy units.
 * @param {number} dy - the distance to move by on the y-axis.
 * @return {cog.Object} this
 */
Object_.prototype.moveY = function(dy) {
    this.y += dy;
    return this;
};

/**
 * Moves the object in the Cartesian plane to the coords specified.
 * @param {number} x - the new x-coord.
 * @param {number} y - the new y-coord.
 * @return {cog.Object} this
 */
Object_.prototype.moveTo = function(x, y) {
    this.x = x;
    this.y = y;
    return this;
};

/**
 * Moves the object in the Cartesian plane to the x-coord specified.
 * @param {number} x - the new x-coord.
 * @return {cog.Object} this
 */
Object_.prototype.moveToX = function(x) {
    this.x = x;
    return this;
};

/**
 * Moves the object in the Cartesian plane to the y-coord specified.
 * @param {number} y - the new y-coord.
 * @return {cog.Object} this
 */
Object_.prototype.moveToY = function(y) {
    this.y = y;
    return this;
};

/**
 * This method does not draw anything.
 * Subclasses may override this method for custom drawing.
 * @param {cog.Painter} painter -
 * @return {cog.Object} this
 */
Object_.prototype.draw = function(painter) {
    return this;
};

// No need to expose the name with an underscore.
cog.Object = Object_;


/**
 * A generic shape with x and y coordinates.
 * Root of all shapes.
 *
 * @param {Object} [options={}] - A configuration object.
 *      The x and y coordinates default to 0.
 * @constructor
 * @augments cog.Object
 */
function Shape(options) {
    Object_.call(this, options);
}

Shape.prototype = Object.create(Object_.prototype);
Shape.prototype.constructor = Shape;

Shape.prototype.toString = function() {
    return 'cog.Shape = ' + JSON.stringify(this);
};

(function() {
    function getX() {
        /*jshint validthis: true */
        return this.x;
    }

    /**
     * The leftmost (smallest) x-coordinate of the shape.
     */
    Object.defineProperty(Shape.prototype, 'left', {
        get: getX
    });

    /**
     * The rightmost (biggest) x-coordinate of the shape.
     */
    Object.defineProperty(Shape.prototype, 'right', {
        get: getX
    });
}());

(function() {
    function getY() {
        /*jshint validthis: true */
        return this.y;
    }

    /**
     * The topmost (smallest) y-coordinate of the shape.
     */
    Object.defineProperty(Shape.prototype, 'top', {
        get: getY
    });

    /**
     * The bottommost (biggest) y-coordinate of the shape.
     */
    Object.defineProperty(Shape.prototype, 'bottom', {
        get: getY
    });
}());

/**
 * Checks if the shape collides with the axis-aligned
 * minimum bounding rectangle of the shape specified.
 * Shape objects do not collide with anything by default.
 * Subclasses may override this method for custom collision detection.
 *
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} Always returns false.
 */
Shape.prototype.intersectsBBof = function(shape) {
    return false;
};

/**
 * Checks if the axis-aligned minimum bounding rectangle of the shape collides
 * with the axis-aligned minimum bounding rectangle of the shape specified.
 * Shape objects do not collide with anything by default.
 * Subclasses may override this method for custom collision detection.
 *
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} Always returns false.
 */
Shape.prototype.intersects = function(shape) {
    return false;
};

/**
 * Checks if the axis-aligned minimum bounding rectangle of the first shape
 * collides with the axis-aligned minimum bounding rectangle of the second.
 * @param {cog.Shape} shape - The first shape.
 * @param {cog.Shape} othershape - The second shape.
 * @return {boolean} true if the two AAMBR collide.
 */
function _BBCollidesWithBB(shape, othershape) {
    // http://gamedev.stackexchange.com/a/913/32466
    // Rectangles just touching each other intersect.
    // !(s1.left > s2.right ||    // left
    //   s1.right < s2.left ||    // right
    //   s1.top > s2.bottom ||    // top
    //   s1.bottom < s2.top)      // bottom
    if (shape.left <= othershape.right &&
        shape.right >= othershape.left &&
        shape.top <= othershape.bottom &&
        shape.bottom >= othershape.top) {
        return true;
    }
    return false;
}

cog.Shape = Shape;


/**
 * A circle centered at (x, y).
 * @param {Object} [options={}] - A configuration object.
 *      The x and y coordinates and radius default to 0.
 * @constructor
 * @augments cog.Shape
 */
function Circle(options) {
    options = options || {};
    Shape.call(this, options);
    this.radius = options.radius || 0;
    delete this.options.radius;
}

Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.constructor = Circle;

Circle.prototype.toString = function() {
    return 'cog.Circle = ' + JSON.stringify(this);
};

Object.defineProperty(Circle.prototype, 'left', {
    get: function() { return this.x - this.radius; }
});

Object.defineProperty(Circle.prototype, 'right', {
    get: function() { return this.x + this.radius; }
});

Object.defineProperty(Circle.prototype, 'top', {
    get: function() { return this.y - this.radius; }
});

Object.defineProperty(Circle.prototype, 'bottom', {
    get: function() { return this.y + this.radius; }
});

/**
 * Checks if the axis-aligned minimum bounding rectangle of the circle collides
 * with the axis-aligned minimum bounding rectangle of the shape specified.
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} true if a collision is detected.
 */
Circle.prototype.intersectsBBof = function(shape) {
    return _BBCollidesWithBB(this, shape);
};

/**
 * Checks if the circle collides with the shape specified.
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} true if the two shapes collide.
 */
Circle.prototype.intersects = function(shape) {
    return false;
};

/**
 *
 * @return {cog.Circle} this
 */
Circle.prototype.draw = function(painter) {
    painter.drawCircle(this);
    return this;
};

cog.Circle = Circle;


/**
 * A rectangle with its top-left corner at (x, y).
 * @param {Object} [options={}] - A configuration object.
 *      The x, y coordinates and width, height parameters default to 0.
 * @constructor
 * @augments cog.Shape
 */
function Rect(options) {
    options = options || {};
    Shape.call(this, options);
    this.width = options.width || 0;
    this.height = options.height || 0;
    delete this.options.width;
    delete this.options.height;
}

Rect.prototype = Object.create(Shape.prototype);
Rect.prototype.constructor = Rect;

Rect.prototype.toString = function() {
    return 'cog.Rect = ' + JSON.stringify(this);
};

Object.defineProperty(Rect.prototype, 'right', {
    get: function() { return this.x + this.width; }
});

Object.defineProperty(Rect.prototype, 'bottom', {
    get: function() { return this.y + this.height; }
});

/**
 * Checks if the rectangle collides with the axis-aligned
 * minimum bounding rectangle of the shape specified.
 * The axis-aligned minimum bounding rectangle of a rectangle is itself.
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} true if a collision is detected.
 */
Rect.prototype.intersectsBBof = function(shape) {
    return _BBCollidesWithBB(this, shape);
};

/**
 * Checks if the rectangle collides with the shape specified.
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} true if the two shapes collide.
 */
Rect.prototype.intersects = function(shape) {
    return false;
};

/**
 *
 * @return {cog.Rect} this
 */
Rect.prototype.draw = function(painter) {
    painter.drawRect(this);
    return this;
};

cog.Rect = Rect;


/**
 * A square with its top-left corner at (x, y).
 *
 * No need to make Square a subclass of Rectangle, so avoid the
 * square-rectangle problem (or circle-ellipse problem) altogether.
 *
 * @param {Object} [options={}] - A configuration object.
 *      The x, y coordinates and width, height parameters default to 0.
 * @constructor
 * @augments cog.Shape
 */
function Square(options) {
    options = options || {};
    Shape.call(this, options);
    this.width = options.width || 0;
    delete this.options.width;
}

Square.prototype = Object.create(Shape.prototype);
Square.prototype.constructor = Square;

Object.defineProperty(Square.prototype, 'height', {
    get: function() { return this.width; }
});

Square.prototype.toString = function() {
    return 'cog.Square = ' + JSON.stringify(this);
};

Object.defineProperty(Square.prototype, 'right', {
    get: function() { return this.x + this.width; }
});

Object.defineProperty(Square.prototype, 'bottom', {
    get: function() { return this.y + this.width; }
});

/**
 * Checks if the square collides with the axis-aligned
 * minimum bounding rectangle of the shape specified.
 * The axis-aligned minimum bounding rectangle of a square is itself.
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} true if a collision is detected.
 */
Square.prototype.intersectsBBof = Rect.prototype.intersectsBBof;

/**
 * Checks if the square collides with the shape specified.
 * @param {cog.Shape} shape - The shape to detect collision with.
 * @return {boolean} true if the two shapes collide.
 */
Square.prototype.intersects = Rect.prototype.intersects;

/**
 *
 * @return {cog.Square} this
 */
Square.prototype.draw = function(painter) {
    painter.drawSquare(this);
    return this;
};

cog.Square = Square;


/**
 * Text positioned at (x, y).
 * @param {Object} [options={}] - A configuration object.
 *      The x and y coordinates default to 0.
 *      The text defaults to an empty string.
 * @constructor
 * @augments cog.Object
 */
function Text(options) {
    options = options || {};
    Object_.call(this, options);
    this.text = options.text || '';
    delete this.options.text;
}

Text.prototype = Object.create(Object_.prototype);
Text.prototype.constructor = Text;

/**
 *
 * @return {cog.Text} this
 */
Text.prototype.draw = function(painter) {
    painter.drawText(this);
    return this;
};

cog.Text = Text;

/****************************** Drawing Classes ******************************/

/*
 * Canvas performance tips:
 *      https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
 *      http://www.html5rocks.com/en/tutorials/canvas/performance/
 */

/**
 * A basic class for drawing shapes.
 * @param {canvas} canvas - An html canvas to draw on.
 * @constructor
 */
function Painter(canvas) {
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
}

/**
 * Applies the options specified to the canvas context.
 * @param {Object} options - A configuration object.
 */
Painter.prototype._applyOptions = function(options) {
    var ctx = this.ctx, prop;

    for (prop in options) {
        if (hasOwnProperty.call(options, prop)) {
            ctx[prop] = options[prop];
        }
    }
};

/**
 * Displays the canvas of the painter.
 */
Painter.prototype.showCanvas = function() {
    this.ctx.canvas.style.display = 'block';
};

/**
 * Hides the canvas of the painter.
 * After this call, the canvas will not occupy any space.
 */
Painter.prototype.hideCanvas = function() {
    this.ctx.canvas.style.display = 'none';
};

/**
 * Clears the entire canvas.
 * @return {cog.Painter} this
 */
Painter.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    return this;
};

/**
 * Clears the rectangular area specified.
 * @param {cog.Rect} rectangle - The rectangle to clear.
 * @return {cog.Painter} this
 */
Painter.prototype.clearRect = function(rect) {
    this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    return this;
};

/**
 * Draws the rectangle specified.
 * @param {cog.Rect} rectangle - The rectangle to draw.
 * @return {cog.Painter} this
 */
Painter.prototype.drawRect = function(rect) {
    this._applyOptions(rect.options);
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    return this;
};

/**
 * Draws the square specified.
 * @param {cog.Square} square - The square to draw.
 * @return {cog.Painter} this
 */
Painter.prototype.drawSquare = function(square) {
    this.drawRect(square);
    return this;
};

/**
 * Draws the circle specified.
 * @param {cog.Circle} circle - The circle to draw.
 * @return {cog.Painter} this
 */
Painter.prototype.drawCircle = function(circle) {
    var ctx = this.ctx;

    this._applyOptions(circle.options);
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, PI2);
    ctx.fill();
    return this;
};

/**
 * Draws the text specified.
 * @param {cog.Text} text - The text to draw.
 * @return {cog.Painter} this
 */
Painter.prototype.drawText = function(text) {
    this._applyOptions(text.options);
    this.ctx.fillText(text.text, text.x, text.y);
    return this;
};

/**
 * Returns the width of the text specified.
 * @param {cog.Text} text - The text to measure.
 * @return {number} The width of the text.
 */
Painter.prototype.getTextWidth = function(text) {
    return this.ctx.measureText(text).width;
};

cog.Painter = Painter;

/******************************** User Input *********************************/

/**
 * A daemon that captures user input.
 * Subclass this to provide application specific functionality.
 * @constructor
 */
function UserInputDaemon() {
    this.events = {};
    this.targets = {};
}

/**
 * Registers an event handler for one or more events.
 *
 * An event can have many handlers and they will be executed according
 * to their registration order. If the same handler is registered more
 * than once for the same event, then the duplicate is discarded.
 * (This behavior is the same as EventTarget.addEventListener).
 *
 * @param {string} events - One or more space-separated event types.
 * @param {function(Event, [*])} callback - The handler to register
 *      for the event.
 *      The handler will be called when the event fires as follows:
 *           function(Event event [, * extraParameter ] [, ... ] )
 * @param {Element} [target] - The object to attach the handler to.
 * @return {cog.UserInputDaemon} this
 */
UserInputDaemon.prototype.on = function(events, callback, target) {
    var i, len, event, callbacklist;

    events = events.split(' ');
    for (i = 0, len = events.length; i < len; ++i) {
        event = events[i];
        callbacklist = this.events[event];

        try {
            if (callbacklist.indexOf(callback) >= 0) {
                callbacklist.push(callback);
            }
        } catch (ex) {
            switch (ex.name) {
            case 'TypeError':   // No callback list yet.
                this.events[event] = [callback];
                break;
            default:
                throw new Error('Assertion failed');
            }
        }
        if (target) {
            target.addEventListener(event, callback, false);
        }
    }
    return this;
};

/**
 * Removes an event handler.
 *
 * @param {string} events - One or more space-separated event types.
 * @param {function} [callback] - The handler (previously attached) to remove.
 *      If a handler is not specified, then all events handlers of that type
 *      are removed.
 * @param {Element} [target] - The object that the handler is attached to.
 * @return {cog.UserInputDaemon} this
 */
UserInputDaemon.prototype.off = function(events, callback, target) {
    var i, len, event, callbacklist;

    events = events.split(' ');
    for (i = 0, len = events.length; i < len; ++i) {
        event = events[i];

        if (callback) {
            callbacklist = this.events[event];
            callbacklist.splice(callbacklist.indexOf(callback), 1);
            if (target) {
                target.removeEventListener(event, callback, false);
            }
        } else {
            delete this.events[event];
        }
    }
    return this;
};

/**
 * Fires all handlers registered for an event.
 * This method does not cause the default behavior of an event to occur.
 *
 * @param {string} event - The event type.
 * @param {Array} [data] - Additional parameters to pass along to
 *      the event handler.
 * @param {Element} [target] - The object that the handler is attached to.
 * @return {cog.UserInputDaemon} this
 */
UserInputDaemon.prototype.trigger = function(event, data, target) {
    var i, len, callbacklist = this.events[event];

    if (callbacklist) {
        for (i = 0, len = callbacklist.length; i < len; ++i) {
            callbacklist[i].apply(target, data);
        }
    }
    return this;
};

/**
 * Tells the daemon to start listening for events.
 * This method does nothing. Override it in a subclass
 * to provide useful functionality.
 * @return {cog.UserInputDaemon} this
 */
UserInputDaemon.prototype.start = function() {
    return this;
};

/**
 * Tells the daemon to stop listening for events.
 * This method does nothing. Override it in a subclass
 * to provide useful functionality.
 * @return {cog.UserInputDaemon} this
 */
UserInputDaemon.prototype.stop = function() {
    return this;
};

/**
 * Restarts the daemon.
 * Equivalent to calling: daemon.stop().start();.
 * @return {cog.UserInputDaemon} this
 */
UserInputDaemon.prototype.restart = function() {
    this.stop();
    this.start();
    return this;
};

cog.UserInputDaemon = UserInputDaemon;

/******************************* Local Storage *******************************/

/*
 * https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage
 * http://dev.w3.org/html5/webstorage/
 */

/**
 * A generic storage manager.
 * Manages local and session storage.
 *
 * @param {Storage} [localStorage=global.localStorage] - A local storage.
 * @param {Storage} [sessionStorage=global.sessionStorage] - A session storage.
 * @constructor
 */
function StorageManager(localStorage, sessionStorage) {
    this._local = localStorage || global.localStorage;
    this._session = sessionStorage || global.sessionStorage;
}

/**
 * Clears the local storage.
 * @return {cog.StorageManager} this
 */
StorageManager.prototype.clearLocal = function() {
    this._local.clear();
    return this;
};

/**
 * Clears the session storage.
 * @return {cog.StorageManager} this
 */
StorageManager.prototype.clearSession = function() {
    this._session.clear();
    return this;
};

/**
 * Clears both local and session storage.
 * @return {cog.StorageManager} this
 */
StorageManager.prototype.clear = function() {
    this.clearLocal();
    this.clearSession();
    return this;
};

cog.StorageManager = StorageManager;

/**
 * A storage manager designed for games.
 * Manages local and session storage.
 *
 * @param {Storage} [localStorage=global.localStorage] - A local storage.
 * @param {Storage} [sessionStorage=global.sessionStorage] - A session storage.
 * @constructor
 * @augments cog.StorageManager
 */
function GameStorageManager(localStorage, sessionStorage) {
    StorageManager.call(this, localStorage, sessionStorage);

    var difficultyKey = GameStorageManager._DIFFICULTY_KEY,
        highScoreKey = GameStorageManager._HIGH_SCORE_KEY,
        timesPlayedKey = GameStorageManager._TIMES_PLAYED_KEY;

    this._local.setItem(difficultyKey,
                        this._local.getItem(difficultyKey) || 0);
    this._local.setItem(highScoreKey,
                        this._local.getItem(highScoreKey) || 0);
    this._local.setItem(timesPlayedKey,
                        this._local.getItem(timesPlayedKey) || 0);
    this._session.setItem(highScoreKey,
                          this._session.getItem(highScoreKey) || 0);
    this._session.setItem(timesPlayedKey,
                          this._session.getItem(timesPlayedKey) || 0);
}

GameStorageManager.prototype = Object.create(StorageManager.prototype);
GameStorageManager.prototype.constructor = GameStorageManager;

/** @const {string} */
GameStorageManager._DIFFICULTY_KEY = 'difficulty';
/** @const {string} */
GameStorageManager._HIGH_SCORE_KEY = 'highScore';
/** @const {string} */
GameStorageManager._TIMES_PLAYED_KEY = 'timesPlayed';
/** @const {string} */
GameStorageManager._SCORE_TYPE_MSG = 'Score cannot be interpreted as a number';
/** @const {string} */
GameStorageManager._NEG_SCORE_MSG = 'Negative score';

/**
 * Returns the difficulty level.
 * @return {number} The difficulty level.
 */
GameStorageManager.prototype.getDifficulty = function() {
    return +this._local.getItem(GameStorageManager._DIFFICULTY_KEY);
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
    return +this._local.getItem(GameStorageManager._HIGH_SCORE_KEY);
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
 * Returns the total times that the player has played the game.
 * @return {number} The total times played.
 */
GameStorageManager.prototype.getTotalTimesPlayed = function() {
    return +this._local.getItem(GameStorageManager._TIMES_PLAYED_KEY);
};

/**
 * Increments the total times that the player has played the game.
 * @return {number} The total times played after incrementing.
 */
GameStorageManager.prototype.incTotalTimesPlayed = function() {
    var timesPlayedKey = GameStorageManager._TIMES_PLAYED_KEY,
        timesPlayed = (+this._local.getItem(timesPlayedKey)) + 1;

    this._local.setItem(timesPlayedKey, timesPlayed);
    return timesPlayed;
};

/**
 * Erases the total times that the player has played the game.
 */
GameStorageManager.prototype.resetTotalTimesPlayed = function() {
    this._local.setItem(GameStorageManager._TIMES_PLAYED_KEY, 0);
};


/**
 * Returns the high score for the current game session.
 * @return {number} The high score for the current game session.
 */
GameStorageManager.prototype.getCurrScore = function() {
    return +this._session.getItem(GameStorageManager._HIGH_SCORE_KEY);
};

/**
 * Sets the new high score for the current game session.
 * If the score specified is lower than the previous one,
 * then this method does nothing.
 * If the score specified is higher than the all-time high score,
 * then it is automatically updated.
 *
 * @param {number} score - The new high score.
 * @throws {TypeError} if the parameter cannot be interpreted as a number.
 * @throws {RangeError} if the new score is negative.
 * @return {boolean} true if the high score changed.
 */
GameStorageManager.prototype.updateCurrScore = function(score) {
    score = Number(score);
    if (isNaN(score)) {
        throw new TypeError(GameStorageManager._SCORE_TYPE_MSG);
    }
    if (score < 0) {
        throw new RangeError(GameStorageManager._NEG_SCORE_MSG);
    }
    if (score < this.getCurrScore()) {
        return false;
    }
    this._session.setItem(GameStorageManager._HIGH_SCORE_KEY, score);
    this.updateHighScore(score);
    return true;
};

/**
 * Erases the high score for the current game session.
 */
GameStorageManager.prototype.resetCurrScore = function() {
    this._session.setItem(GameStorageManager._HIGH_SCORE_KEY, 0);
};

/**
 * Returns the times that the player has played the game in this session.
 * @return {number} The times played in this session.
 */
GameStorageManager.prototype.getTimesPlayed = function() {
    return +this._session.getItem(GameStorageManager._TIMES_PLAYED_KEY);
};

/**
 * Increments the number of times that the player has played the game
 * in this session. The number of total times played is automatically
 * incremented.
 * @return {number} The times played in this session after incrementing.
 */
GameStorageManager.prototype.incTimesPlayed = function() {
    var timesPlayedKey = GameStorageManager._TIMES_PLAYED_KEY,
        timesPlayed = (+this._session.getItem(timesPlayedKey)) + 1;

    this._session.setItem(timesPlayedKey, timesPlayed);
    this.incTotalTimesPlayed();
    return timesPlayed;
};

/**
 * Erases the times that the player has played the game in this session.
 */
GameStorageManager.prototype.resetTimesPlayed = function() {
    this._session.setItem(GameStorageManager._TIMES_PLAYED_KEY, 0);
};

cog.GameStorageManager = GameStorageManager;

/***************************** Application Cache *****************************/

/*
 * http://www.html5rocks.com/en/tutorials/appcache/beginner/
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache
 * https://html.spec.whatwg.org/#applicationcache
 */

/**
 * A basic application cache manager.
 * @param {Cache} [appCache=global.applicationCache] - The application cache.
 * @constructor
 */
function AppCacheManager(appCache) {
    this.appCache = appCache || global.applicationCache;
    this.appCache.addEventListener('updateready', function() {
        if (this.status === this.UPDATEREADY) {
            global.location.reload();
        }
    }, false);
}

/**
 *
 */
AppCacheManager.prototype.checkStatus = function() {
    var appCache = this.appCache;

    switch (appCache.status) {
    case appCache.UNCACHED:     // 0
        return 'UNCACHED';
    case appCache.IDLE:         // 1
        return 'IDLE';
    case appCache.CHECKING:     // 2
        return 'CHECKING';
    case appCache.DOWNLOADING:  // 3
        return 'DOWNLOADING';
    case appCache.UPDATEREADY:  // 4
        return 'UPDATEREADY';
    case appCache.OBSOLETE:     // 5
        return 'OBSOLETE';
    default:
        throw new Error('Unknown application cache status');
    }
};

/**
 * Attempts to update the user's cache.
 */
AppCacheManager.prototype.update = function() {
    this.appCache.update();
};

cog.AppCacheManager = AppCacheManager;

/********************************* Utilities *********************************/

/**
 * Gives control of the "cog" variable back to its previous owner.
 * @return {Object} A reference to the cog object.
 */
cog.noConflict = function() {
    if (global.cog === cog) {
        global.cog = oldcog;
    }
    return cog;
};


// Expose cog.
global.cog = cog;

}(typeof window !== "undefined" ? window : this));
