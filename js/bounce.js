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
 * Note that there is no easy and accurate way of finding the height of some
 * text, so we basically use a factor of width or some other simple hack.
 * @param
 * @param
 * @param
 * @constructor
 */
function BouncePainter(backpainter, forepainter, pausepainter) {
    this._backpainter = backpainter;
    this._forepainter = forepainter;
    this._pausepainter = pausepainter;

    this._score = new cog.Text(
        Math.floor(forepainter.width / 2),
        3 * Math.floor(forepainter.height / 4));
    this._highScore = new cog.Text(
        null,
        forepainter.height - BouncePainter._HIGH_SCORE_FONT_SIZE);

    // Reusable bounding rectangle used for clearing parts of the canvas.
    this._rect = new cog.Rect(0, 0, forepainter.width, forepainter.height);

    // Perfomance tip: Minimize canvas state changes.
    // Apply any styling options that won't change here.
    this._pausepainter
        .setOption('fillStyle', BouncePainter._PAUSE_COLOR)
        .drawRect(this._rect);
    this._forepainter.setOptions({
        textAlign: 'center',
        textBaseline: 'middle',
        font: BouncePainter._SCORE_FONT_SIZE + 'pt Calibri'
    });
}

/** @const {string} */
BouncePainter._CIRCLE_COLOR = '#FFFF00';
/** @const {string} */
BouncePainter._SHAPE_COLOR = 'rgba(0,122,255,0.7)';
/** @const {string} */
BouncePainter._SCORE_COLOR = '#F90101';
/** @const {string} */
BouncePainter._PAUSE_COLOR = 'rgba(150,150,150,0.8)';
/** @const {number} */
BouncePainter._SCORE_FONT_SIZE = 50;
/** @const {number} */
BouncePainter._HIGH_SCORE_FONT_SIZE = 40;

Object.defineProperty(BouncePainter.prototype, 'width', {
    get: function() { return this._forepainter.width; }
});

Object.defineProperty(BouncePainter.prototype, 'height', {
    get: function() { return this._forepainter.height; }
});

/**
 * Draws all the elements of the game.
 * @param {cog.Circle} circle - The circle of the game.
 * @param {Array.<cog.Shape>]} shapes - The shapes of the game.
 * @param {string} score - The curent score of the player in the game.
 * @param {string} highScore - The best score of the player in the game.
 */
BouncePainter.prototype.draw = function(circle, shapes, score, highScore) {
    this.drawBackground()
        .drawShapes(shapes)
        .drawCircle(circle)
        .drawScore(score)
        .drawHighScore(highScore);
};

/**
 * Clears the entire canvas.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clear = function() {
    this._forepainter.clear();
    this._backpainter.clear();
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
    rect.height = Math.floor(this.height / 2);

    rect.y = 0;
    painter.setOption('fillStyle', '#383838').drawRect(rect);
    rect.y = rect.height;
    painter.setOption('fillStyle', '#D8D8D8').drawRect(rect);

    return this;
};

/**
 * Draws the circle that the player controls.
 * @param {cog.Circle} circle - The circle of the game.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawCircle = function(circle) {
    this._forepainter
        .setOption('fillStyle', BouncePainter._CIRCLE_COLOR)
        .drawCircle(circle);
    return this;
};

/**
 * Clears the bounding rectangle of the game circle.
 * @param {cog.Circle} circle - The circle of the game.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearCircle = function(circle) {
    var rect = this._rect;

    rect.x = circle.left;
    rect.y = circle.top;
    rect.width = circle.right - circle.left;
    rect.height = circle.bottom - circle.top;
    this._forepainter.clearRect(rect);
    return this;
};

/**
 * Draws the rest of the game shapes (i.e. everything except the circle).
 * @param {Array.<cog.Shape>]} shapes - The shapes of the game.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawShapes = function(shapes) {
    var i, len, painter = this._forepainter;

    painter.setOption('fillStyle', BouncePainter._SHAPE_COLOR);
    for (i = 0, len = shapes.length; i < len; ++i) {
        shapes[i].draw(painter);
    }
    return this;
};

/**
 * Removes the shapes from the canvas.
 * @param {Array.<cog.Shape>]} shapes - The shapes of the game.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearShapes = function(shapes) {
    var i, len, painter = this._forepainter;

    for (i = 0, len = shapes.length; i < len; ++i) {
        painter.clearRect(shapes[i]);
    }
    return this;
};

/**
 * Draws the game score.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawScore = function(currScore) {
    this._score.text = currScore;
    this._forepainter
        .setOption('fillStyle', BouncePainter._SCORE_COLOR)
        .drawText(this._score);
    return this;
};

/**
 * Draws the game high score.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.drawHighScore = function(highScore) {
    var painter = this._forepainter;

    this._highScore.text = 'Best: ' + highScore + ' ';
    // Change the font settings before calculating the text width.
    painter.setOption(
        'font', BouncePainter._HIGH_SCORE_FONT_SIZE + 'pt Calibri');
    // Place the high score at the bottom right corner of the canvas.
    this._highScore.x = painter.width - painter.getTextWidth(this._highScore)/2;
    painter
        .setOption('fillStyle', BouncePainter._SCORE_COLOR)
        .drawText(this._highScore)
        // Change the font settings back to the original ones.
        // drawHighScore is not expected to be called a lot, so this is fast.
        .setOption('font', BouncePainter._SCORE_FONT_SIZE + 'pt Calibri');
    return this;
};

BouncePainter.prototype._clearScore = function(which) {
    var rect = this._rect,
        score = this[which],
        width = this._forepainter.getTextWidth(score),
        height = width * 1.5;

    rect.x = Math.floor(score.x - width/2);
    rect.y = Math.floor(score.y - height/2);
    rect.width = Math.ceil(width);
    rect.height = Math.ceil(height);
    this._forepainter.clearRect(rect);
    return this;
};

/**
 * Erases the game score from the canvas.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearScore = function() {
    this._clearScore('_score');
    return this;
};

/**
 * Erases the game score from the canvas.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.clearHighScore = function() {
    this._clearScore('_highScore');
    return this;
};

/**
 * Shows the pause screen.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.showPauseScreen = function() {
    this._pausepainter.showCanvas();
    return this;
};

/**
 * Hides the pause screen.
 * @return {BouncePainter} this
 */
BouncePainter.prototype.hidePauseScreen = function() {
    this._pausepainter.hideCanvas();
    return this;
};

/*********************************** Input ***********************************/

/*
 * http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
 * http://developer.mozilla.org/en-US/docs/Web/API/Element.getBoundingClientRect
 * http://stackoverflow.com/a/11396681/1751037
 */

/**
 * A daemon that captures user input, with Bounce-specific functionality.
 * @param {Element} element - The HTML element that will receive events.
 * @param {cog.Circle} circle - The Bounce circle.
 *      The object is never modified inside this daemon.
 * @constructor
 * @augments cog.UserInputDaemon
 */
function BounceInputDaemon(element, circle) {
    cog.UserInputDaemon.call(this);
    this.element = element;
    this.circle = circle;
    this.mousemoved = false;

    // mouse position + diff = circle position
    this._mousepos = {x: circle.x, y: circle.y};
    this._diff = {dx: 0, dy: 0};
    this._circlepos = {x: circle.x, y: circle.y};

    this._boundingRect = element.getBoundingClientRect();
    this._fakeMouseupEvent = {preventDefault: cog.noop, which: 1};

    var self = this;

    function setDiff(event) {
        var rect = self._boundingRect,
            circle = self.circle,
            diff = self._diff;

        diff.dx = circle.x - (event.clientX - rect.left);
        diff.dy = circle.y - (event.clientY - rect.top);
    }

    function mousemove(event) {
        /*jshint validthis:true */
        var rect = self._boundingRect,
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
        setDiff(event);
        // The left mouse button is not still pressed.
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
            setDiff(event);
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
    this.element.removeEventListener('mousedown', this._mousedown, false);
    this.element.removeEventListener('mouseup', this._mouseup, false);
    // Create an articial mouseup event (to unregister the additional handlers)
    // in case the user restarted the game without releasing the mouse button.
    this._mouseup(this._fakeMouseupEvent);
    this._mousepos.x = this._mousepos.y = this._diff.x = this._diff.y = 0;
    this.mousemoved = false;
    return this;
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
    var speed = 0.00045 * Math.round((width+height) / 2), i, len;

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

/*
 * Avoid window.cancelAnimationFrame for now.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window.cancelAnimationFrame
 */

var document = global.document,
    requestAnimationFrame = global.requestAnimationFrame;

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
 * Create an HTML container for future elements.
 * @param {canvas} canvas - The Bounce main canvas.
 *      The container will be created after this element.
 * @return {Element} The new container.
 */
function createContainer(canvas) {
    var container = createElement('div');

    container.className = 'bounce-container';
    insertAfter(container, canvas);
    return container;
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

/**
 *
 */
function makeBouncePainter(container, canvas) {
    var backcanvas, pausecanvas, options;

    // The backcanvas is used for the background, the original for
    // the foreground and the pausecanvas for the pause screen.
    backcanvas = createElement('canvas');
    pausecanvas = createElement('canvas');

    backcanvas.className = 'bounce-back-canvas';
    pausecanvas.className = 'bounce-pause-canvas';

    options = {
        width: canvas.width,
        height: canvas.height
    };

    options.zIndex = '-1';
    styleCanvas(backcanvas, options);
    options.zIndex = '1';
    options.display = 'none';
    styleCanvas(pausecanvas, options);

    container.appendChild(backcanvas);
    container.appendChild(pausecanvas);

    return new BouncePainter(
        new cog.Painter(backcanvas),
        new cog.Painter(canvas),
        new cog.Painter(pausecanvas));
}

/**
 * The main class of the game.
 * @param {canvas} canvas - The main canvas to draw the game on.
 * @param {cog.Circle} circle - The circle of the game.
 * @param {Array} shapes - The rest of the shapes.
 * @param {Object} opt - A configuration object.
 *    This object may specify any of the following attributes:
 *      {AbstractBouncer} [bouncer=NormalBouncer] -
 *          The object responsible for the game logic.
 *      {BouncePainter} [painter=BouncePainter] -
 *          The object responsible for drawing the elements of the game.
 *      {BounceInputDaemon} [inputDaemon=BounceInputDaemon] -
 *          The object responsible for receiving input from the user.
 *      {cog.StorageManager} [storageManager=cog.StorageManager] -
 *          The object responsible for saving the game stats.
 *      {cog.AppCacheManager} [appCacheManager=cog.AppCacheManager] -
 *          The object responsible for the application cache.
 */
function Bounce(canvas, circle, shapes, opt) {
    var container = createContainer(canvas);

    this.canvas = canvas;
    this.circle = circle;
    this.shapes = shapes;

    this.painter = opt.painter || makeBouncePainter(container, canvas);
    this.inputDaemon = opt.inputDaemon || new BounceInputDaemon(canvas, circle);
    this.storageManager = opt.storageManager || new cog.GameStorageManager();
    this.appCacheManager = opt.appCacheManager || new cog.AppCacheManager();

    this._bouncer = opt.bouncer || new NormalBouncer(
        circle, shapes, canvas.width, Math.floor(canvas.height / 2));

    this._state = Bounce._READY;
    this._elapsedmillisecs = 0;
    this._originalCoords = [];

    this._saveOriginalPos();
    this.painter.draw(
        circle, shapes, this.score, this.storageManager.getHighScore());
    this.inputDaemon.start()
        .trigger('create');
}

/**
 * An enumeration of the game states.
 */
/** @const {number} */
Bounce._READY = 0;
/** @const {number} */
Bounce._RUNNING = 1;
/** @const {number} */
Bounce._PAUSED = 2;
/** @const {number} */
Bounce._ENDED = 3;

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

Object.defineProperty(Bounce.prototype, 'score', {
    get: function() {
        // 5 points per second.
        return Math.floor((this._elapsedmillisecs / 1000) * 5);
    }
});

/**
 * Stops the game and performs the final cleanup.
 * All functionality (objects, event handlers, DOM elements) is removed.
 * You must not call any other method of the instance after this one.
 */
Bounce.prototype.destroy = function() {
    var container;

    this.stop();

    // Remove event handlers.
    this.inputDaemon.stop();

    // Remove HTML elements.
    container = this.canvas.nextSibling;
    container.parentNode.removeChild(container);

    // Mark objects for garbage collection.
    this.canvas = this.circle = this.shapes =
        this.painter = this.inputDaemon =
        this.storageManager = this.appCacheManager =
        this._bouncer = this._originalCoords = null;
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
 * Note that due to the way this function is called,
 * the score is not increased when the user has paused the game.
 */
Bounce.prototype._play = function() {
    var that = this;

    // Wait for the browser to get ready before starting.
    // Added bonus: We get an accurate initial timestamp.
    requestAnimationFrame(function(timestamp) {
        var prevscore = that.score;

        (function animate(now) {
            var self = that,
                circle = self.circle,
                shapes = self.shapes,
                painter = self.painter,
                bouncer = self._bouncer,
                dt, pos, score;

            // Place the rAF before everything to assure as
            // close to 60fps with the setTimeout fallback.
            if (self._state === Bounce._RUNNING) {
                requestAnimationFrame(animate);

                dt = now - timestamp;
                self._elapsedmillisecs += dt;
                timestamp = now;

                // No need to redraw the circle if it hasn't moved.
                if (self.inputDaemon.mousemoved) {
                    pos = self.inputDaemon.getCirclePos();
                    painter.clearCircle(circle);
                    bouncer.moveCircle(pos.x, pos.y);
                    painter.drawCircle(circle);
                }

                // Draw the shapes after the circle for better results.
                painter.clearShapes(shapes);
                bouncer.moveShapes(dt);
                painter.drawShapes(shapes);

                if (bouncer.isOutOfBounds() || bouncer.hasCollision()) {
                    self.stop();
                    return;
                }

                // No need to redraw the score if it hasn't changed.
                score = self.score;
                if (prevscore !== score) {
                    painter
                        .clearScore()
                        .drawScore(score);
                    prevscore = score;
                }
            }
        }(timestamp));
    });
};

/**
 * Starts the game.
 * This method has no effect if the game has already started or ended.
 * @return {boolean} true if the game was successfully started.
 */
Bounce.prototype.start = function() {
    if (this._state !== Bounce._READY) {
        return false;
    }
    this._state = Bounce._RUNNING;

    this._play();
    this.inputDaemon.trigger('start');
    return true;
};

/**
 * Stops the game.
 * This method has no effect if the game has already stopped or ended.
 * @return {boolean} true if the game was successfully stopped.
 */
Bounce.prototype.stop = function() {
    if (this._state !== Bounce._RUNNING) {
        return false;
    }
    this._state = Bounce._ENDED;

    this.saveStats();
    this.inputDaemon.trigger('stop');
    return true;
};

/**
 * Pauses the game.
 * This method has no effect if the game is already paused or stopped.
 * @return {boolean} true if the game was successfully paused.
 */
Bounce.prototype.pause = function() {
    var self = this;

    if (this._state !== Bounce._RUNNING) {
        return false;
    }
    this._state = Bounce._PAUSED;

    requestAnimationFrame(function() {
        self.painter.showPauseScreen();
    });
    // Anything can happen to the system while the game is paused. Save the
    // score just in case. The player wouldn't want to lose a new high score.
    this.saveScore();
    this.inputDaemon.trigger('pause');
    return true;
};

/**
 * Resumes the game.
 * This method has no effect if the game is already resumed or stopped.
 * @return {boolean} true if the game was successfully resumed.
 */
Bounce.prototype.resume = function() {
    var self = this;

    if (this._state !== Bounce._PAUSED) {
        return false;
    }
    this._state = Bounce._RUNNING;

    requestAnimationFrame(function() {
        self.painter.hidePauseScreen();
    });
    this._play();
    this.inputDaemon.trigger('resume');
    return true;
};

/**
 * Pauses or resumes the game according to its current state.
 * This method has no effect if the game has not started or has already stopped.
 * @return {boolean} true if the game was successfully paused or resumed.
 */
Bounce.prototype.pauseResume = function() {
    if (this.pause()) {
        return true;
    }
    return this.resume();
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

Bounce.prototype._reset = function(event, autostart) {
    var self = this;

    this.stop();
    // A call to requestAnimationFrame will make sure that all the effects
    // of the stop method will take place before being overwritten by the
    // effects of the setup and start method calls.
    requestAnimationFrame(function() {
        self._repositionShapes();
        self._elapsedmillisecs = 0;
        self._state = Bounce._READY;    // _state should change inside rAF.
        self.painter
            .hidePauseScreen()
            .clear()
            .draw(self.circle, self.shapes, self.score,
                  self.storageManager.getHighScore());
        self.inputDaemon
            .restart()
            .trigger(event);
        if (autostart) {
            self.start();
        }
    });
};

/**
 * Restarts the game.
 * The game can be restarted at any time (in contrast to other methods).
 * @return {boolean} always returns true.
 *      A value is returned for consistency with the other methods.
 */
Bounce.prototype.restart = function() {
    // Small perf improvement. Do nothing if the game is ready to start.
    if (this._state === Bounce._READY) {
        this.inputDaemon.trigger('restart');
        return true;
    }
    this._reset('restart', true);
    return true;
};

/**
 * Resets the game.
 * After resetting, the game behaves as if it was just constructed.
 * The game can be reset at any time (in contrast to other methods).
 * @return {boolean} always returns true.
 *      A value is returned for consistency with the other methods.
 */
Bounce.prototype.reset = function() {
    this._reset('reset');
    return true;
};

/********************************* Public API *********************************/

/**
 * Create a new circle proportional to the dimensions specified.
 */
function _createCircle(width, height) {
    return new cog.Circle(
        Math.floor(width / 2),
        Math.floor(height / 2),
        Math.floor(0.05 * Math.min(width, height))
    );
}

/**
 * Create 2 squares and 2 rectangles proportional to the dimensions specified.
 */
function _createShapes(width, height) {
    var squarewidth = Math.floor(0.16 * Math.round((width + height)/2)),
        rectwidth = Math.floor(0.24 * Math.round(0.8*width + 0.2*height)),
        rectheight = Math.floor(0.1 * Math.round(0.2*width + 0.8*height)),
        rect2width = Math.floor(0.8 * rectwidth),
        rect2height = Math.floor(1.2 * rectheight);

    return [
        new cog.Square(
            0,
            0,
            squarewidth
        ),
        new cog.Square(
            width - squarewidth,
            0,
            squarewidth
        ),
        new cog.Rect(
            0,
            height - rectheight,
            rectwidth,
            rectheight
        ),
        new cog.Rect(
            width - rect2width,
            height - rect2height,
            rect2width,
            rect2height
        )
    ];
}

/**
 * Convenience function. Creates a new game to play.
 * @param {canvas} canvas - The main canvas to draw the game on.
 * @param {number} [difficulty=3] - The difficulty of the game.
 * @return {Bounce} The new game.
 */
function bounce(canvas, difficulty) {
    var width = canvas.width,
        height = Math.floor(canvas.height / 2),
        circle = _createCircle(width, height),
        shapes = _createShapes(width, height),
        bouncer;

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

    return new Bounce(canvas, circle, shapes, {bouncer: bouncer});
}

/**
 * Convenience function. Starts the game specified.
 * @param {Bounce} game - A bounce game instance.
 * @param {boolean} [autostart=false] - If true, starts the game immediately.
 *      If false, waits for the player to press the left mouse button before
 *      starting the game. The mouse button event is bound to the parent of
 *      the main canvas of the game.
 */
function play(game, autostart) {
    var container;

    if (autostart) {
        game.start();
    } else {
        container = game.canvas.parentNode;
        container.addEventListener('mousedown', function mousedown(event) {
            // Left mouse button pressed.
            if (event.which === 1) {
                event.preventDefault();
                this.removeEventListener('mousedown', mousedown, false);
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
