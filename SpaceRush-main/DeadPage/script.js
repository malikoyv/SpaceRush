let score = 0; // This will hold the player's score

function gameOver() {
    // When the game ends, show the "You Are Dead" screen and display the score
    document.getElementById("score-display").innerHTML = `Score: ${score}`;
    document.getElementById("startPage").style.display = "block";  // Show the game over screen
}

function restartGame() {
    // Reset the game and score
    score = 0;
    document.getElementById("score-display").innerHTML = `Score: ${score}`;

    // Hide the game over screen and restart the game
    document.getElementById("startPage").style.display = "none";

    // Add any additional logic to restart your game
    alert('Game restarting...');
    initGame(); // Start the game again
}

// Simulate score updating (replace this with actual game logic)
function updateScore(points) {
    score += points;
    console.log(`Score updated: ${score}`);
}
