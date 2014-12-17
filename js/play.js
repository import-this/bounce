/*global bounce */
(function(bounce) {
    "use strict";
    var canvas, game, endMenu, restartButton, currScore, highScore;

    try {
        canvas = document.getElementById('bounce');
        endMenu = document.getElementById('end-menu'),
        currScore = document.getElementById('curr-score'),
        highScore = document.getElementById('high-score'),
        restartButton = document.getElementById('restart-button');

        // Make the canvas cover the whole window.
        (function fixSize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }());

        game = bounce.bounce(canvas).draw();

        // TODO: Fix this after creating menu.
        (function getDifficulty() {
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
        }());

        game.inputDaemon.on('stop', function showEndMenu() {
            currScore.innerHTML = game.score.toString();
            highScore.innerHTML = game.storageManager.getHighScore();
            endMenu.style.display = 'block';
        });

        game.inputDaemon.on('restart', function hideEndMenu() {
            endMenu.style.display = 'none';
        });

        restartButton.addEventListener('click', function restart() {
            game.restart();
        }, false);

        bounce.play(game, 2);
    } catch (ex) {
        document.getElementById('error-msg').style.display = 'block';
        throw ex;
    }
}(bounce));
