// script.js

function startGame() {
    // Send a message to the parent window to start the game
    window.parent.postMessage('startGame', '*');
}

function initGame() {
    // Placeholder for game initialization logic
    console.log("Game started!");
    // Add your game engine logic, canvas, etc. here
}