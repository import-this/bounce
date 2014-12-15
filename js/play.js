/*global bounce */
(function(bounce) {
    "use strict";
    var canvas, game;

    try {
        canvas = document.getElementById('bounce');

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
            levels.addEventListener('click', function(event) {
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

        bounce.play(game, 2);
    } catch (ex) {
        // TODO: Report the error to the user.
        throw ex;
    }
}(bounce));
