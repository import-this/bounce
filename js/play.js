/*global bounce */
(function(bounce) {
    "use strict";
    var game, gameContainer, canvas,
        startMenu, endMenu,
        startButton, restartButton,
        currScore, bestScore,
        timesPlayed, totalTimesPlayed,
        touchdownEvent;

    /**
     * Makes the canvas specified cover the whole window.
     */
    function fitCanvas(canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /**
     * Starts the game when the user presses the left mouse button.
     */
    function startOnMouseInput(event) {
        /*jshint validthis:true */
        // Left mouse button pressed.
        if (event.which === 1) {
            event.preventDefault();
            this.removeEventListener('mousedown', startOnMouseInput, false);
            game.start();
        }
    }

    function startOnTouchInput(event) {
        /*jshint validthis:true */
        event.preventDefault();
        this.removeEventListener(touchdownEvent, startOnTouchInput, false);
        game.start();
    }

    function registerStartOnInput() {
        var eventstr = bounce.BounceInputDaemon.TOUCHDOWN_EVENT;
        gameContainer.addEventListener('mousedown', startOnMouseInput, false);
        gameContainer.addEventListener(eventstr, startOnTouchInput, false);
    }

    function showEndMenu() {
        currScore.innerHTML = game.score.toString();
        bestScore.innerHTML = game.storageManager.getHighScore();
        timesPlayed.innerHTML = game.storageManager.getTimesPlayed();
        totalTimesPlayed.innerHTML = game.storageManager.getTotalTimesPlayed();
        endMenu.style.display = 'table';
    }

    function hideEndMenu() {
        registerStartOnInput();
        endMenu.style.display = 'none';
    }

    /**
     * Creates and returns a new game.
     */
    function newGame(canvas) {
        var game = bounce.bounce(canvas, 2);
        game.inputDaemon.on('stop', showEndMenu);
        game.inputDaemon.on('reset', hideEndMenu);
        return game;
    }

    function resize() {
        /*
         * Make sure a game is already created when this handler is called.
         */
        fitCanvas(canvas);
        // Perfoming an actual resize is meaningless for this fast-paced
        // game (and a lot of work, too), so simply create a brand-new one.
        game.destroy();
        game = newGame(canvas);
        // addEventListener inside this discards potential duplicates.
        registerStartOnInput();
    }

    // Global exception handler.
    // Note that this does not catch exceptions from event handlers
    // (since these are executed in a separate context).
    try {
        canvas = document.getElementById('bounce');
        startMenu = document.getElementById('start-menu');
        endMenu = document.getElementById('end-menu');
        currScore = document.getElementById('curr-score');
        bestScore = document.getElementById('best-score');
        startButton = document.getElementById('start-button');
        restartButton = document.getElementById('restart-button');
        timesPlayed = document.getElementById('times');
        totalTimesPlayed = document.getElementById('total-times');
        gameContainer = canvas.parentNode;

        fitCanvas(canvas);
        game = newGame(canvas);

        window.addEventListener('resize', resize, false);
        window.addEventListener('orientationchange', resize, false);

        // TODO: Decide if this will be used eventually.
        /*function getDifficulty() {
            var levels = document.getElementById('start-menu-items');

            // Use event delegation for clicking the <li> tags.
            levels.addEventListener('click', function start(event) {
                // NOTE: If the menu changes, the check may have to change, too.
                if (event.target.nodeName === 'LI') {
                    startMenu.style.display = 'none';
                    // +event.target.tabIndex
                    play(game, canvas.parentNode);
                }
            }, false);
        }*/

        // Remember that the user will see the start button only once.
        startButton.addEventListener('click', function start(event) {
            this.removeEventListener('click', start, false);
            event.preventDefault();

            // Pause the game automatically when the player loses focus.
            window.addEventListener('blur', function() {
                game.pause();
            }, false);
            window.addEventListener('focus', function() {
                game.resume();
            }, false);

            // Keyboard shortcuts
            document.addEventListener('keydown', function(event) {
                switch (event.which) {
                    case 82:        // r/R: Restart (Reset)
                        game.reset();
                        break;
                    case 81:        // q/Q: Stop
                        game.stop();
                        break;
                    case 80:        // p/P or Space: Pause/Resume
                        /* falls through */
                    case 32:
                        game.pauseResume();
                        break;
                    default:
                        // Do nothing.
                        break;
                }
            }, false);

            startMenu.style.display = 'none';
            registerStartOnInput();
        }, false);

        restartButton.addEventListener('click', function restart() {
            game.reset();
        }, false);
    } catch (ex) {
        document.getElementById('error-msg').style.display = 'table';
        throw ex;
    }
}(bounce));
