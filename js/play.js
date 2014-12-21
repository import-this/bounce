/*global bounce */
(function(bounce) {
    "use strict";
    var game, canvas,
        startMenu, endMenu,
        startButton, restartButton,
        currScore, bestScore,
        isrunning;

    function newGame() {
        var game = bounce.bounce(canvas, 2);

        game.inputDaemon.on('stop', function showEndMenu() {
            currScore.innerHTML = game.score.toString();
            bestScore.innerHTML = game.storageManager.getHighScore();
            endMenu.style.display = 'table';
        });
        game.inputDaemon.on('restart', function hideEndMenu() {
            endMenu.style.display = 'none';
        });

        return game;
    }

    /*
     * Make the canvas cover the whole window.
     */
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    try {
        canvas = document.getElementById('bounce');
        startMenu = document.getElementById('start-menu');
        endMenu = document.getElementById('end-menu');
        currScore = document.getElementById('curr-score');
        bestScore = document.getElementById('best-score');
        startButton = document.getElementById('start-button');
        restartButton = document.getElementById('restart-button');

        resizeCanvas();
        /*window.addEventListener('resize', function resize() {
            resizeCanvas();
            game.destroy();
            game = newGame();
            bounce.play(game);
        }, false);*/

        // TODO: Fix this after creating menu.
        /*function getDifficulty() {
            var levels = document.getElementById('start-menu-items');

            // Use event delegation for clicking the <li> tags.
            levels.addEventListener('click', function start(event) {
                var target = event.target,
                    menu;

                // NOTE: If the menu changes, the check may have to change, too.
                if (target.nodeName === 'LI') {
                    menu = document.getElementById('start-menu');
                    menu.style.display = 'none';
                    bounce.play(game, +target.tabIndex);
                }
            }, false);
        }*/

        game = newGame();

        startButton.addEventListener('click', function start() {
            // Pause the game automatically when the player loses focus.
            window.addEventListener('blur', function() {
                game.pause();
            }, false);
            window.addEventListener('focus', function() {
                game.resume();
            }, false);

            // Keyboard shortcuts
            isrunning = true;
            document.addEventListener('keydown', function(event) {
                switch (event.which) {
                    case 82:        // r/R: Restart
                        game.restart();
                        break;
                    case 81:        // q/Q: Stop
                        game.stop();
                        break;
                    case 80:        // p/P or Space: Pause/Resume
                        /* falls through */
                    case 32:
                        if (isrunning) {
                            isrunning = false;
                            game.pause();
                        }
                        else {
                            isrunning = true;
                            game.resume();
                        }
                        break;
                    default:
                        // Do nothing.
                        break;
                }
            }, false);

            startMenu.style.display = 'none';
            bounce.play(game);
        }, false);

        restartButton.addEventListener('click', function restart() {
            game.restart();
        }, false);
    } catch (ex) {
        document.getElementById('error-msg').style.display = 'table';
        throw ex;
    }
}(bounce));
