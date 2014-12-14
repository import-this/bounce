/*global bounce */
(function(bounce) {
    "use strict";
    var canvas = document.getElementById('bounce'),
        game;

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
            var target = event.target;

            // Careful: This check will only work for the specified HTML.
            // If the menu becomes more complex, the check may have to change.
            if (target.nodeName === 'LI') {
                document.getElementById('start-menu').style.display = 'none';
                bounce.play(game, +target.tabIndex);
            }
        }, false);
    }());

    bounce.play(game, 2);
}(bounce));
