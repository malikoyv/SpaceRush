// script.js

function startGame() {
    // You can redirect to the game page or load the game here
    alert("Starting the game...");
    // Optionally, hide the start page and show the game canvas:
    document.getElementById("startPage").style.display = "none";
    document.querySelector(".start-button").style.display = "none";

    // Call your game initialization logic here
    initGame();
}

function initGame() {
    // Placeholder for game initialization logic
    console.log("Game started!");
    // Add your game engine logic, canvas, etc. here
}