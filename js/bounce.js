/**
 * Bounce
 * http://import-this.github.io/bounce
 *
 * A clone of Artem Rakhmatulin's Insanity!
 * https://itunes.apple.com/us/app/insanity!/id892935435
 *
 * Copyright (c) 2014, Vasilis Poulimenos
 * Released under the BSD 3-Clause License
 * https://github.com/import-this/bounce/blob/master/LICENSE
 *
 * Supported browsers (as suggested by online references):
 *      IE 9+, FF 4+, Chrome 5+, Opera 11.60+, SF 5+
 *      + corresponding mobile versions.
 *
 * Public members in the bounce namespace:
 *  Drawing Classes:
 *      BouncePainter
 *  User Input:
 *      BounceInputDaemon
 *  Movement / Collision Detection:
 *      AbstractBouncer
 *          Bouncer
 *              DumbBouncer
 *              EasyBouncer
 *              NormalBouncer
 *              ToughBouncer
 *              InsaneBouncer
 *  Game Manager:
 *      Bounce
 *  Utility methods:
 *      bounce
 *      play
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

/*global cog */
(function(global, cog) {

"use strict";

function returnFalse() {
    return false;
}

/******************************* Drawing Class *******************************/

/*
 * Canvas performance tips:
 *      https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
 *      http://www.html5rocks.com/en/tutorials/canvas/performance/
 */

/**
 *
 * @param
 * @param
 * @param
 * @param
 * @param
 * @param
 * @constructor
 */
function BouncePainter(circle, shapes, score, backpainter,
                       toppainter, bottompainter, pausepainter) {
    var i, len;

    this.width = toppainter.width;
    this.height = toppainter.height;

    this._circle = circle;
    this._shapes = shapes;

    this._backpainter = backpainter;
    this._toppainter = toppainter;
    this._bottompainter = bottompainter;
    this._pausepainter = pausepainter;

    this._score = score;

    circle.options.fillStyle = BouncePainter._CIRCLE_COLOR;
    for (i = 0, len = shapes.length; i < len; ++i) {
        shapes[i].options.fillStyle = BouncePainter._SHAPE_COLOR;
    }

    // Bounding rectangle used for clearing parts of the canvas.
    this._rect = new cog.Rect();
}

/** @type {string} */
BouncePainter._CIRCLE_COLOR = '#FFFF00';
/** @type {string} */
BouncePainter._SHAPE_COLOR = 'rgba(0,122,255,0.7)';
/** @type {string} */
BouncePainter._PAUSE_COLOR = 'rgba(150,150,150,0.8)';

/**
 * Clears the entire canvas (top and bottom).
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clear = function() {
    this._toppainter.clear();
    this._bottompainter.clear();
    return this;
};

/**
 * Draws the game background.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawBackground = function() {
    var painter = this._backpainter,
        rect = this._rect;

    rect.x = 0;
    rect.width = this.width;
    rect.height = this.height;

    rect.y = 0;
    rect.options.fillStyle = '#383838';
    painter.drawRect(rect);

    rect.y = this.height;
    rect.options.fillStyle = '#D8D8D8';
    painter.drawRect(rect);

    return this;
};

/**
 *
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawPauseScreen = function() {
    var rect = this._rect;

    rect.x = 0;
    rect.y = 0;
    rect.width = this.width;
    rect.height = this.height * 2;
    rect.options.fillStyle = BouncePainter._PAUSE_COLOR;
    this._pausepainter.drawRect(rect);
    this._pausepainter.showCanvas();
    return this;
};

/**
 *
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearPauseScreen = function() {
    this._pausepainter.hideCanvas();
    this._pausepainter.clear();
    return this;
};

/**
 * Draws the circle that the player controls.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawCircle = function() {
    this._toppainter.drawCircle(this._circle);
    return this;
};

/**
 * Clears the bounding rectangle of the game circle.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearCircle = function() {
    var circle = this._circle,
        rect = this._rect;

    rect.x = circle.left;
    rect.y = circle.top;
    rect.width = circle.right - circle.left;
    rect.height = circle.bottom - circle.top;
    this._toppainter.clearRect(rect);
    return this;
};

/**
 * Draws the rest of the game shapes.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawShapes = function() {
    var i, len, shapes = this._shapes, painter = this._toppainter;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shapes[i].draw(painter);
    }
    return this;
};

/**
 * Removes the shapes from the canvas.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearShapes = function() {
    var i, len, shapes = this._shapes, painter = this._toppainter;

    for (i = 0, len = shapes.length; i < len; ++i) {
        painter.clearRect(shapes[i]);
    }
    return this;
};

/**
 * Draws the game scores.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawScore = function(currentScore) {
    var score = this._score;

    score.text = currentScore;
    this._bottompainter.drawText(score);
    return this;
};

/**
 * Erases the game scores from the canvas.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearScore = function() {
    var rect = this._rect,
        score = this._score,
        width = this._bottompainter.getTextWidth(score.text),
        // There is no easy and accurate way of finding the height of the
        // text, so we basically use a factor of width as a simple hack.
        height = width * 1.5;

    rect.x = Math.floor(score.x - width/2);
    rect.y = Math.floor(score.y - height/2);
    rect.width = Math.ceil(width);
    rect.height = Math.ceil(height);
    this._bottompainter.clearRect(rect);
    return this;
};

/*********************************** Input ***********************************/

/**
 * A daemon that captures user input, with Bounce-specific functionality.
 * @param {Element} element - The HTML element that will receive events.
 * @param {cog.Circle} circle - The Bounce circle.
 *      The object is never modified inside this daemon.
 * @constructor
 * @augments cog.UserInputDaemon
 */
function BounceInputDaemon(element, circle) {
    // http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
    // https://developer.mozilla.org/en-US/docs/Web/API/Element.getBoundingClientRect
    // http://stackoverflow.com/a/11396681/1751037
    cog.UserInputDaemon.call(this);
    this.element = element;
    this.circle = circle;
    this.mousemoved = false;
    this._mousepos = {x: 0, y: 0};
    this._diff = {dx: 0, dy: 0};
    this._circlepos = {x: 0, y: 0};
    this._fakeMouseupEvent = {preventDefault: cog.noop, which: 1};

    var self = this;

    function setDiff(element, event) {
        var rect = element.getBoundingClientRect(),
            circle = self.circle,
            diff = self._diff;

        diff.dx = circle.x - (event.clientX - rect.left);
        diff.dy = circle.y - (event.clientY - rect.top);
    }

    function mousemove(event) {
        /*jshint validthis:true */
        var rect = this.getBoundingClientRect(),
            pos = self._mousepos;

        pos.x = event.clientX - rect.left;
        pos.y = event.clientY - rect.top;
        self.mousemoved = true;
    }

    /**
     * If the mouse moves out of the input element and then back in,
     * get a new diff to prevent the circle from jumping to another spot.
     */
    function mouseover(event) {
        /*jshint validthis:true */
        setDiff(this, event);
        // Left mouse button not still pressed.
        if (event.which !== 1) {
            // Create an articial mouseup event since we lost the original
            // when the user moved their mouse out of the input element.
            self._mouseup(self._fakeMouseupEvent);
        }
    }

    this._mousedown = function(event) {
        event.preventDefault();
        // Left mouse button pressed.
        if (event.which === 1) {
            setDiff(this, event);
            element.addEventListener('mousemove', mousemove, false);
            element.addEventListener('mouseover', mouseover, false);
        }
    };

    this._mouseup = function(event) {
        event.preventDefault();
        // Left mouse button released.
        if (event.which === 1) {
            element.removeEventListener('mousemove', mousemove, false);
            element.removeEventListener('mouseover', mouseover, false);
        }
    };
}

BounceInputDaemon.prototype = Object.create(cog.UserInputDaemon.prototype);
BounceInputDaemon.prototype.constructor = BounceInputDaemon;

/**
 * Starts the deamon.
 * @return {BounceInputDaemon} this
 */
BounceInputDaemon.prototype.start = function() {
    this.element.addEventListener('mousedown', this._mousedown, false);
    this.element.addEventListener('mouseup', this._mouseup, false);
    return this;
};

/**
 * Stops the deamon.
 * @return {BounceInputDaemon} this
 */
BounceInputDaemon.prototype.stop = function() {
    // Create an articial mouseup event (to unregister the additional handlers)
    // in case the user restarted the game without releasing the mouse button.
    this._mouseup(this._fakeMouseupEvent);
    this.element.removeEventListener('mousedown', this._mousedown, false);
    this.element.removeEventListener('mouseup', this._mouseup, false);
    return this;
};

/**
 * Return the mouse position relative to the input element
 * as an object containing the properties `x` and `y`.
 * This method will clear the mousemoved flag.
 *
 * For performance reasons, this method does not return a new object.
 * Instead, it updates and returns a preallocated one,
 * so it is a good idea to NOT modify it at all.
 * @return {Object} The object containing the properties `x` and `y`.
 */
BounceInputDaemon.prototype.getMousePos = function() {
    this.mousemoved = false;
    return this._mousepos;
};

/**
 * Return the hypothetical circle position based on mouse movement
 * as an object containing the properties `x` and `y`.
 * This method will clear the mousemoved flag.
 *
 * For performance reasons, this method does not return a new object.
 * Instead, it updates and returns a preallocated one,
 * so it is a good idea to NOT modify it at all.
 * @return {Object} The object containing the properties `x` and `y`.
 */
BounceInputDaemon.prototype.getCirclePos = function() {
    var mousepos = this._mousepos, diff = this._diff;

    this._circlepos.x = mousepos.x + diff.dx;
    this._circlepos.y = mousepos.y + diff.dy;
    this.mousemoved = false;
    return this._circlepos;
};

/*********************** Movement / Collision Detection **********************/

/**
 *
 * Subclass this to create new movement and collision patterns.
 * @constructor
 * @abstract
 */
function AbstractBouncer(circle, shapes, width, height) {
    this.circle = circle;
    this.shapes = shapes;
    this.width = width;
    this.height = height;
}

/**
 *
 * @return {AbstractBouncer} this
 */
AbstractBouncer.prototype.moveCircle = function(x, y) {
    this.circle.moveTo(x, y);
    return this;
};

/**
 *
 * @param {} dt -
 * @return {AbstractBouncer} this
 * @abstract
 */
AbstractBouncer.prototype.moveShapes = function(dt) {
    throw new Error('abstract method');
};

/**
 *
 * @return {AbstractBouncer} this
 * @abstract
 */
AbstractBouncer.prototype.isOutOfBounds = function() {
    throw new Error('abstract method');
};

/**
 *
 * @return {AbstractBouncer} this
 * @abstract
 */
AbstractBouncer.prototype.hasCollision = function() {
    throw new Error('abstract method');
};


/**
 *
 * Pun intended.
 * @constructor
 * @abstract
 */
function Bouncer(circle, shapes, width, height) {
    AbstractBouncer.call(this, circle, shapes, width, height);

    // A list of candidates for collision detection.
    // The list is reused to avoid object churn.
    this._candidates = [];
}

Bouncer.prototype = Object.create(AbstractBouncer.prototype);
Bouncer.prototype.constructor = Bouncer;

/**
 *
 * @return {boolean} true if
 */
Bouncer.prototype.isOutOfBounds = function() {
    var circle = this.circle,
        x = circle.x,
        y = circle.y,
        radius = circle.radius;

    // left, right, top, bottom
    if (x - radius < 0 || x + radius > this.width ||
        y - radius < 0 || y + radius > this.height) {
        return true;
    }
    return false;
};

/**
 *
 * @return {boolean} true if
 */
function _intersects(circle, shape) {
    var x = circle.x,
        y = circle.y,
        left = shape.left,
        right = shape.right,
        top = shape.top,
        bottom = shape.bottom,
        xleft, xright, ytop, ybottom,
        xleft2, xright2, ytop2, ybottom2,
        radius;

    // Check collision with sides first.
    // (top, bottom, left, right)
    if (((left <= x && x <= right) && circle.bottom >= top) ||
        ((left <= x && x <= right) && circle.top <= bottom) ||
        ((top <= y && y <= bottom) && circle.right >= left) ||
        ((top <= y && y <= bottom) && circle.left <= right)) {
        return true;
    }

    xleft = x - left;
    xright = x - right;
    ytop = y - top;
    ybottom = y - bottom;

    xleft2 = xleft * xleft;
    xright2 = xright * xright;
    ytop2 = ytop * ytop;
    ybottom2 = ybottom * ybottom;

    // Now check collision with corners.
    // (topleft, topright, bottomleft, bottomright)
    radius = circle.radius;
    if ((Math.sqrt(xleft2 + ytop2) <= radius) ||
        (Math.sqrt(xright2 + ytop2) <= radius) ||
        (Math.sqrt(xleft2 + ybottom2) <= radius) ||
        (Math.sqrt(xright2 + ybottom2) <= radius)) {
        return true;
    }

    return false;
}

/**
 *
 */
Bouncer.prototype.hasCollision = function() {
    var circle = this.circle,
        shapes = this.shapes,
        candidates = this._candidates,
        i, j, len, shape;

    // Fast check with axis-aligned minimum bounding rectangles.
    for (i = 0, j = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        if (circle.intersectsBBof(shape)) {
            candidates[j++] = shape;
        }
    }
    // Slower check with exact collision detection for candidates.
    if (j > 0) {
        for (i = 0; i < j; ++i) {
            if (_intersects(circle, candidates[i])) {
                return true;
            }
        }
    }
    return false;
};


/**
 *
 * @constructor
 * @augments Bouncer
 */
function DumbBouncer(circle, shapes, width, height) {
    var speed = 0.00035 * Math.round((width+height) / 2), i, len;

    Bouncer.call(this, circle, shapes, width, height);

    this._speeds = [];
    this._speeds.length = shapes.length;
    for (i = 0, len = shapes.length; i < len; ++i) {
        this._speeds[i] = {dx: speed, dy: speed};
    }
}

DumbBouncer.prototype = Object.create(Bouncer.prototype);
DumbBouncer.prototype.constructor = DumbBouncer;

/**
 *
 * @param {number} dt - in milliseconds
 * @return {DumbBouncer} this
 */
DumbBouncer.prototype.moveShapes = function(dt) {
    var shapes = this.shapes,
        width = this.width,
        height = this.height,
        speeds = this._speeds,
        i, len, shape, speed, x, y;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        speed = speeds[i];

        // x = x0 + u*dt
        x = shape.x + Math.round(speed.dx * dt);
        y = shape.y + Math.round(speed.dy * dt);
        // When a shape is out of bounds, put it inside explicitly.
        // Just changing its direction may not bring it inside in
        // the next frame, causing it to change direction again.
        if (x < 0) {
            speed.dx *= -1;
            x = 0;
        } else if (x + shape.width > width) {
            speed.dx *= -1;
            x = width - shape.width;
        }
        if (y < 0) {
            speed.dy *= -1;
            y = 0;
        } else if (y + shape.height > height) {
            speed.dy *= -1;
            y = height - shape.height;
        }
        shape.moveTo(x, y);
    }
    return this;
};

/**
 *
 * @return {boolean} Always returns false.
 */
DumbBouncer.prototype.isOutOfBounds = returnFalse;


/**
 *
 * @constructor
 * @augments Bouncer
 */
function EasyBouncer(circle, shapes, width, height) {
    var speed = 0.00035 * Math.round((width+height) / 2), i, len;

    Bouncer.call(this, circle, shapes, width, height);

    this._speeds = [];
    this._speeds.length = shapes.length;
    for (i = 0, len = shapes.length; i < len; ++i) {
        this._speeds[i] = {dx: speed, dy: speed};
    }
}

EasyBouncer.prototype = Object.create(Bouncer.prototype);
EasyBouncer.prototype.constructor = EasyBouncer;

/**
 *
 * @param {number} dt -
 * @return {EasyBouncer} this
 */
EasyBouncer.prototype.moveShapes = function(dt) {
    var shapes = this.shapes,
        width = this.width,
        height = this.height,
        speeds = this._speeds,
        i, len, shape, speed, x, y;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        speed = speeds[i];

        // x = x0 + u*dt
        x = shape.x + Math.round(speed.dx * dt);
        y = shape.y + Math.round(speed.dy * dt);
        // When a shape is out of bounds, put it inside explicitly.
        // Just changing its direction may not bring it inside in
        // the next frame, causing it to change direction again.
        if (x < 0) {
            speed.dx *= -1;
            x = 0;
        } else if (x + shape.width > width) {
            speed.dx *= -1;
            x = width - shape.width;
        }
        if (y < 0) {
            speed.dy *= -1;
            y = 0;
        } else if (y + shape.height > height) {
            speed.dy *= -1;
            y = height - shape.height;
        }
        shape.moveTo(x, y);
    }
    return this;
};


/**
 *
 * @constructor
 * @augments Bouncer
 */
function NormalBouncer(circle, shapes, width, height) {
    Bouncer.call(this, circle, shapes, width, height);
}

NormalBouncer.prototype = Object.create(Bouncer.prototype);
NormalBouncer.prototype.constructor = NormalBouncer;

// TODO: Fix moveShapes.
/**
 *
 * @param {number} dt -
 * @return {NormalBouncer} this
 */
NormalBouncer.prototype.moveShapes = function(dt) {
    var shapes = this.shapes,
        width = this.width,
        height = this.height,
        speeds = this._speeds,
        i, len, shape, speed;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        speed = speeds[i];

        // x = (x0 + u*dt) mod limit
        // % is the remainder (not modulo) operator in JavaScript.
        shape.moveTo(
            (shape.x + Math.round(speed.dx * dt) + width) % width,
            (shape.y + Math.round(speed.dy * dt) + height) % height);
    }
    return this;
};


// TODO: Finish ToughBouncer.
/**
 *
 * @constructor
 * @augments Bouncer
 */
function ToughBouncer(circle, shapes, width, height) {
    Bouncer.call(this, circle, shapes, width, height);
}

ToughBouncer.prototype = Object.create(Bouncer.prototype);
ToughBouncer.prototype.constructor = ToughBouncer;

/**
 *
 * @param {number} dt -
 * @return {ToughBouncer} this
 */
ToughBouncer.prototype.moveShapes = function(dt) {
    var shapes = this.shapes,
        width = this.width,
        height = this.height,
        speeds = this._speeds,
        i, len, shape, speed, x, y;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        speed = speeds[i];

        // x = Math.sin(w*dt + phi)


        shape.moveTo(x, y);
    }
    return this;
};


// TODO: Finish InsaneBouncer.
/**
 *
 * @constructor
 * @augments Bouncer
 */
function InsaneBouncer(circle, shapes, width, height) {
    Bouncer.call(this, circle, shapes, width, height);
}

InsaneBouncer.prototype = Object.create(Bouncer.prototype);
InsaneBouncer.prototype.constructor = InsaneBouncer;

/**
 *
 * @param {number} dt -
 * @return {InsaneBouncer} this
 */
InsaneBouncer.prototype.moveShapes = function(dt) {
    var shapes = this.shapes,
        width = this.width,
        height = this.height,
        speeds = this._speeds,
        i, len, shape, speed, x, y;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        speed = speeds[i];

        //


        shape.moveTo(x, y);
    }
    return this;
};

/******************************* Game Manager ********************************/

// Avoid window.cancelAnimationFrame for now.
// https://developer.mozilla.org/en-US/docs/Web/API/Window.cancelAnimationFrame

var document = global.document;

/**
 * @param {string} tagName -
 * @return {Element} The new element.
 */
function createElement(tagName) {
    return document.createElement(tagName);
}

/**
 * Inserts the new node after the reference node.
 * @param {Element} newNode - The new node.
 * @param {Element} referenceNode - The reference node.
 */
function insertAfter(newNode, referenceNode) {
    // http://stackoverflow.com/a/4793630/1751037
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * @param {canvas} canvas - The canvas to apply the styles to.
 * @param {Object} newNode - A configuration object.
 */
function styleCanvas(canvas, options) {
    var style = canvas.style;

    canvas.width = options.width;
    canvas.height = options.height;

    style.position = 'absolute';
    style.top = (options.top || '0') + 'px';
    style.left = '0';
    style.zIndex = options.zIndex || '1';
    style.display = options.display || 'block';
}

function makeBouncePainter(canvas, circle, shapes) {
    var topcanvas, bottomcanvas, pausecanvas, score, options;

    // These canvases will be used for the foreground.
    // The top for shapes, the bottom for the score and
    // the third for the pause screen.
    topcanvas = createElement('canvas');
    bottomcanvas = createElement('canvas');
    pausecanvas = createElement('canvas');

    options = {
        width: canvas.width,
        height: Math.floor(canvas.height / 2)
    };

    // Math.floor(x / 2) + Math.ceil(x / 2) = x
    // pausecanvas will cover both canvases.
    styleCanvas(topcanvas, options);
    options.height = Math.ceil(canvas.height / 2);
    options.top = topcanvas.height;
    styleCanvas(bottomcanvas, options);
    options.height = canvas.height;
    options.top = '0';
    options.zIndex = '3';
    options.display = 'none';
    styleCanvas(pausecanvas, options);

    insertAfter(topcanvas, canvas);
    insertAfter(bottomcanvas, topcanvas);
    insertAfter(pausecanvas, bottomcanvas);

    score = new cog.Text({
        x: Math.floor(bottomcanvas.width / 2),
        y: Math.floor(bottomcanvas.height / 2),
        font: 50 + 'pt Calibri',
        textAlign: 'center',
        textBaseline: 'middle',
        fillStyle: '#F00'
    });

    return new BouncePainter(
        circle, shapes, score,
        new cog.Painter(canvas), new cog.Painter(topcanvas),
        new cog.Painter(bottomcanvas), new cog.Painter(pausecanvas));
}

/**
 *
 */
function makeInputSurface(canvas) {
    var inputSurface = createElement('canvas');

    styleCanvas(inputSurface, {
        width: canvas.width,
        height: Math.ceil(canvas.height / 2),
        top: Math.floor(canvas.height / 2),
        zIndex: '2'
    });
    insertAfter(inputSurface, canvas);
    return inputSurface;
}

/**
 * The main class of the game.
 * @param {cog.Circle} circle -
 * @param {Array} shapes -
 * @param {canvas} canvas -
 * @param {BouncePainter} [painter=BouncePainter] -
 * @param {BounceInputDaemon} [inputDaemon=BounceInputDaemon] -
 * @param {cog.StorageManager} [storageManager=cog.StorageManager] -
 * @param {cog.AppCacheManager} [appCacheManager=cog.AppCacheManager] -
 */
function Bounce(circle, shapes, canvas, painter, inputDaemon,
                storageManager, appCacheManager) {
    var self = this;

    this.width = canvas.width;
    this.height = Math.floor(canvas.height / 2);

    this.circle = circle;
    this.shapes = shapes;

    this.painter = painter || makeBouncePainter(canvas, circle, shapes);
    this.inputDaemon = inputDaemon || new BounceInputDaemon(
        makeInputSurface(canvas), circle);
    this.storageManager = storageManager || new cog.GameStorageManager();
    this.appCacheManager = appCacheManager || new cog.AppCacheManager();

    this._stopped = true;
    this._paused = false;
    this._ended = false;

    this._bouncer = null;
    this._elapsedmillisecs = 0;

    this._originalCoords = [];
    this._saveOriginalPos();

    this._blurHandler = function() {
        self.pause();
    };
    this._focusHandler = function() {
        self.resume();
    };
    this._keydownHandler = function(event) {
        switch (event.which) {
            case 83:        // s/S: Start
                self.start();
                break;
            case 82:        // r/R: Restart
                self.restart();
                break;
            case 81:        // q/Q: Stop
                self.stop();
                break;
            case 80:        // p/P or Space: Pause/Resume
                /* falls through */
            case 32:
                if (self._paused) {
                    self.resume();
                }
                else {
                    self.pause();
                }
                break;
            default:
                // Do nothing.
                break;
        }
    };
}

Object.defineProperty(Bounce.prototype, 'score', {
    get: function() {
        // 1 point for half a second.
        return Math.floor((this._elapsedmillisecs / 1000) * 2);
    }
});

/**
 * .
 */
Bounce.prototype._saveOriginalPos = function() {
    var shapes = this.shapes,
        circle = this.circle,
        coordlist = this._originalCoords,
        i, len, shape;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        coordlist.push({x: shape.x, y: shape.y});
    }
    // The last element will always be the circle coords.
    coordlist.push({x: circle.x, y: circle.y});
};

/**
 * .
 */
Bounce.prototype._repositionShapes = function() {
    var shapes = this.shapes,
        circle = this.circle,
        coordlist = this._originalCoords,
        i, len, shape, coords;

    for (i = 0, len = shapes.length; i < len; ++i) {
        shape = shapes[i];
        coords = coordlist[i];
        shape.x = coords.x;
        shape.y = coords.y;
    }
    // Fix the circle separately.
    coords = coordlist[i];
    circle.x = coords.x;
    circle.y = coords.y;
};

/**
 *
 */
Bounce.prototype._addKeyShortcuts = function() {
    document.addEventListener('keydown', this._keydownHandler, false);
};

/**
 *
 */
Bounce.prototype._removeKeyShortcuts = function() {
    document.removeEventListener('keydown', this._keydownHandler, false);
};

/**
 * Saves the current score if it is a new best.
 */
Bounce.prototype.saveScore = function() {
    this.storageManager.updateCurrScore(this.score);
};

/**
 * Saves the current game statistics (score plus times played).
 */
Bounce.prototype.saveStats = function() {
    this.saveScore();
    this.storageManager.incTimesPlayed();
};

/**
 *
 * @return {Bounce} this
 */
Bounce.prototype.draw = function() {
    var self = this;

    global.requestAnimationFrame(function() {
        self.painter.drawBackground()
            .drawShapes()
            .drawCircle()
            .drawScore(self.score);
    });
    return this;
};

/**
 * Performs the basic setup before the game begins.
 * @param {AbstractBouncer} [bouncer=NormalBouncer] -
 * @return {Bounce} this
 */
Bounce.prototype.setup = function(bouncer) {
    if (!this._stopped && !this._ended) {
        return this;
    }
    this._stopped = true;
    this._paused = false;
    this._ended = false;

    this._elapsedmillisecs = 0;
    this._bouncer = bouncer || this._bouncer || new NormalBouncer(
        this.circle, this.shapes, this.width, this.height);
    this._addKeyShortcuts();
    this.inputDaemon.trigger('setup');
    return this;
};

/**
 * Note that due to the way this function is called,
 * the score is not increased when the user has paused the game.
 */
Bounce.prototype._play = function() {
    var that = this;

    // Wait for the browser to get ready before starting.
    // Added bonus: We get an accurate initial timestamp.
    global.requestAnimationFrame(function(timestamp) {
        var prevscore = that.score;

        (function animate(now) {
            var self = that,
                painter = self.painter,
                bouncer = self._bouncer,
                dt, pos, score;

            // Place the rAF before everything to assure as
            // close to 60fps with the setTimeout fallback.
            if (!self._stopped && !self._paused) {
                global.requestAnimationFrame(animate);

                dt = now - timestamp;
                self._elapsedmillisecs += dt;
                timestamp = now;

                // No need to redraw the circle if it hasn't moved.
                if (self.inputDaemon.mousemoved) {
                    pos = self.inputDaemon.getCirclePos();
                    painter.clearCircle();
                    bouncer.moveCircle(pos.x, pos.y);
                    painter.drawCircle();
                }

                // Draw the shapes after the circle for better results.
                painter.clearShapes();
                bouncer.moveShapes(dt);
                painter.drawShapes();

                if (bouncer.isOutOfBounds() || bouncer.hasCollision()) {
                    self.stop();
                    return;
                }

                // No need to redraw the score if it hasn't changed.
                score = self.score;
                if (prevscore !== score) {
                    painter.clearScore().drawScore(score);
                    prevscore = score;
                }
            }
        }(timestamp));
    });
};

/**
 * Starts the game.
 * This method has no effect if the game has already started or ended.
 * @return {Bounce} this
 */
Bounce.prototype.start = function() {
    if (!this._stopped || this._ended) {
        return this;
    }
    this._stopped = false;

    // Pause the game automatically when the player loses focus.
    global.addEventListener('blur', this._blurHandler, false);
    global.addEventListener('focus', this._focusHandler, false);
    this.inputDaemon.start();
    this._play();
    this.inputDaemon.trigger('start');
    return this;
};

/**
 * Stops the game.
 * This method has no effect if the game has already stopped or ended.
 * @return {Bounce} this
 */
Bounce.prototype.stop = function() {
    if (this._stopped || this._ended) {
        return this;
    }
    this._stopped = true;

    this.inputDaemon.stop();
    global.removeEventListener('blur', this._blurHandler, false);
    global.removeEventListener('focus', this._focusHandler, false);
    this.saveStats();
    this._ended = true;
    this.inputDaemon.trigger('stop');
    return this;
};

/**
 * Pauses the game.
 * This method has no effect if the game is already paused or stopped.
 * @return {Bounce} this
 */
Bounce.prototype.pause = function() {
    var self = this;

    if (this._paused || this._stopped) {
        return this;
    }
    this._paused = true;

    global.requestAnimationFrame(function() {
        self.painter.drawPauseScreen();
    });
    // Anything can happen to the system while the game is paused. Save the
    // score just in case. The player wouldn't want to lose a new high score.
    this.saveScore();
    this.inputDaemon.trigger('pause');
    return this;
};

/**
 * Resumes the game.
 * This method has no effect if the game is already resumed or stopped.
 * @return {Bounce} this
 */
Bounce.prototype.resume = function() {
    var self = this;

    if (!this._paused || this._stopped) {
        return this;
    }
    this._paused = false;

    global.requestAnimationFrame(function() {
        self.painter.clearPauseScreen();
    });
    this._play();
    this.inputDaemon.trigger('resume');
    return this;
};

/**
 * Restarts the game.
 * The game can be restarted at any time.
 * @return {Bounce} this
 */
Bounce.prototype.restart = function() {
    var self = this;

    this.stop();
    // A call to requestAnimationFrame will make sure that all the effects
    // of the stop method will take place before being overwritten by the
    // effects of the setup and start method calls.
    global.requestAnimationFrame(function() {
        self._removeKeyShortcuts();
        self.painter.clear();
        self._repositionShapes();
        self.draw();
        self.setup();
        self.start();
    });
    this.inputDaemon.trigger('restart');
    return this;
};

/********************************* Public API *********************************/

/**
 * Create a new circle proportional to the dimensions specified.
 */
function _createCircle(width, height) {
    return new cog.Circle({
        x: Math.floor(width / 2),
        y: Math.floor(height / 2),
        radius: Math.floor(0.05 * Math.min(width, height))
    });
}

/**
 * Create 2 squares and 2 rectangles proportional to the dimensions specified.
 */
function _createShapes(width, height) {
    var squarewidth = Math.floor(0.15 * Math.round((width + height)/2)),
        rectwidth = Math.floor(0.225 * Math.round(0.8*width + 0.2*height)),
        rectheight = Math.floor(0.1 * Math.round(0.2*width + 0.8*height));

    return [
        new cog.Square({
            x: 0,
            y: 0,
            width: squarewidth
        }),
        new cog.Square({
            x: width - squarewidth,
            y: 0,
            width: squarewidth
        }),
        new cog.Rect({
            x: 0,
            y: height - rectheight,
            width: rectwidth,
            height: rectheight
        }),
        new cog.Rect({
            x: width - Math.floor(rectwidth * 0.8),
            y: height - Math.floor(rectheight * 1.2),
            width: Math.floor(rectwidth * 0.8),
            height: Math.floor(rectheight * 1.2)
        })
    ];
}

/**
 * Convenience function. Creates a new game to play.
 * @param {canvas} canvas - The canvas to draw the game on.
 * @return {Bounce} The new game.
 */
function bounce(canvas) {
    var width = canvas.width,
        height = Math.floor(canvas.height / 2);

    return new Bounce(
        _createCircle(width, height),
        _createShapes(width, height),
        canvas);
}

/**
 * Convenience function. Setups the game specified.
 * @param {Bounce} game - A bounce game instance.
 * @param {number} [difficulty=3] - The difficulty of the game.
 * @param {boolean} [autostart=false] - If true, the game will start
 *      immediately. If false, the game will wait for a click by the user.
 */
function play(game, difficulty, autostart) {
    var circle = game.circle,
        shapes = game.shapes,
        width = game.width,
        height = game.height,
        bouncer;

    if (!difficulty) {
        difficulty = game.storageManager.getDifficulty();
    }
    switch (difficulty) {
        case 1:
            bouncer = new DumbBouncer(circle, shapes, width, height);
            break;
        case 2:
            bouncer = new EasyBouncer(circle, shapes, width, height);
            break;
        case 3:
            /* falls through */
        default:    // Default difficulty: Normal.
            bouncer = new NormalBouncer(circle, shapes, width, height);
            break;
        case 4:
            bouncer = new ToughBouncer(circle, shapes, width, height);
            break;
        case 5:
            bouncer = new InsaneBouncer(circle, shapes, width, height);
            break;
    }

    game.setup(bouncer);
    if (autostart) {
        game.start();
    } else {
        // Wait for the player to click before starting the game.
        document.addEventListener('mousedown', function clickHandler(event) {
            // Left mouse button pressed.
            if (event.which === 1) {
                document.removeEventListener('mousedown', clickHandler, false);
                game.start();
            }
        }, false);
    }
}

// Export public members.
global.bounce = global.bounce || {
    Bounce: Bounce,

    AbstractBouncer: AbstractBouncer,
    Bouncer: Bouncer,
    DumbBouncer: DumbBouncer,
    EasyBouncer: EasyBouncer,
    NormalBouncer: NormalBouncer,
    ToughBouncer: ToughBouncer,
    InsaneBouncer:InsaneBouncer,

    BouncePainter: BouncePainter,
    BounceInputDaemon: BounceInputDaemon,

    bounce: bounce,
    play: play
};

}(typeof window !== "undefined" ? window : this, cog));
