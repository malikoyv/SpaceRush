window.addEventListener('message', function(event) {
    if (event.data === 'startGame') {
        startGame();
    }
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const backgroundImage = new Image();
backgroundImage.src = 'background.jpg';

const lanes = [150, 250];
let score = 0;
let speed = 5;
let speedIncrease = 0;
let showSpeedIncreaseMessage = false;
let speedIncreaseMessageTimer = 0;

const ball = {
    x: 150,
    y: 550,
    width: 40,  // Adjust this based on your spaceship image size
    height: 40, // Adjust this based on your spaceship image size
    lane: 0,
    image: new Image()
};

ball.image.src = 'spaceship.png';

let obstacles = [];
let gameOver = false;
let ballSwitching = false;

let lastObstacleTime = 0;
let baseObstacleInterval = 1000; // Basis interval mellem forhindringer
let minObstacleInterval = 800; // Smallere interval før 20 point

let canSpawnImprovedObstacle = false;
let canSpawnBlackObstacle = false;

function drawBall() {
    ctx.drawImage(ball.image, ball.x - ball.width / 2, ball.y - ball.height / 2, ball.width, ball.height);
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function startGame() {
    document.getElementById('startPage').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    
    // Reset game state
    score = 0;
    speed = 5;
    speedIncrease = 0;
    obstacles = [];
    gameOver = false;
    ball.x = lanes[0];
    ball.y = 550;
    ball.lane = 0;
    
    // Start the game loop
    gameLoop();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.beginPath();
        if (obstacle.shape === 'triangle') {
            ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.closePath();
        } else {
            ctx.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        ctx.fillStyle = obstacle.color;
        ctx.fill();
    });
}

function moveObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.y += obstacle.speed;
        if (!obstacle.passed && obstacle.y > ball.y) {
            score++;
            obstacle.passed = true;
            checkSpeedIncrease();
        }
    });
    obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
}

function checkSpeedIncrease() {
    if (score % 10 === 0) {
        speedIncrease += 10;
        showSpeedIncreaseMessage = true;
        speedIncreaseMessageTimer = 100;
        
        if (score === 20) {
            // Nulstil intervallet til basis efter 20 point
            minObstacleInterval = baseObstacleInterval;
        } else {
            // Reducer intervallet med 10%
            minObstacleInterval *= 0.9;
        }
        
        canSpawnImprovedObstacle = true;
    }
    if (score >= 45) {
        canSpawnBlackObstacle = true;
    }
}

function spawnImprovedObstacle() {
    // Find den modsatte bane af den seneste normale forhindring
    const lastNormalObstacle = obstacles.find(obs => obs.color !== 'purple' && obs.color !== 'black');
    const improvedObstacleLane = lastNormalObstacle ? 
        (lastNormalObstacle.x === lanes[0] - 25 ? 1 : 0) : 
        Math.floor(Math.random() * 2);
    
    const obstacleSpeed = speed * (1 + speedIncrease / 100) * 1.25; // 25% hurtigere
    
    obstacles.push({
        x: lanes[improvedObstacleLane] - 25,
        y: -50,
        width: 50,
        height: 40,
        passed: false,
        speed: obstacleSpeed,
        color: 'purple',
        shape: 'triangle'
    });
    
    canSpawnImprovedObstacle = false;
}

function spawnBlackObstacle() {
    const obstacleSpeed = speed * (1 + speedIncrease / 100) * 1.4; // 40% hurtigere
    
    // Find den modsatte bane af den seneste normale forhindring
    const lastNormalObstacle = obstacles.find(obs => obs.color !== 'purple' && obs.color !== 'black');
    const blackObstacleLane = lastNormalObstacle ? 
        (lastNormalObstacle.x === lanes[0] - 25 ? 1 : 0) : 
        Math.floor(Math.random() * 2);
    
    obstacles.push({
        x: lanes[blackObstacleLane] - 25,
        y: -50,
        width: 50,
        height: 20,
        passed: false,
        speed: obstacleSpeed,
        color: 'black',
        shape: 'rectangle'
    });
    
    canSpawnBlackObstacle = false;
}

function spawnObstacle() {
    const currentTime = Date.now();
    const actualInterval = score < 20 ? minObstacleInterval : 
        Math.max(minObstacleInterval, baseObstacleInterval * (1 - speedIncrease / 100));
    
    if (currentTime - lastObstacleTime < actualInterval) {
        return;
    }

    const availableLanes = [0, 1];
    if (obstacles.length > 0) {
        const lastObstacle = obstacles[obstacles.length - 1];
        if (lastObstacle.color === 'black' || lastObstacle.color === 'purple') {
            // Hvis den seneste forhindring er sort eller lilla, vælg den modsatte bane
            const normalObstacleLane = lastObstacle.x === lanes[0] - 25 ? 1 : 0;
            availableLanes.splice(availableLanes.indexOf(normalObstacleLane), 1);
        }
    }

    const randomLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

    if (canSpawnBlackObstacle && Math.random() < 0.1 && obstacles.length > 0 && 
        obstacles[obstacles.length - 1].y > 150) {
        spawnBlackObstacle();
    } else if (canSpawnImprovedObstacle && Math.random() < 0.2 && obstacles.length > 0 && 
        obstacles[obstacles.length - 1].y > 100) {
        spawnImprovedObstacle();
    } else {
        obstacles.push(createNormalObstacle(randomLane));
    }

    lastObstacleTime = currentTime;
}

function createNormalObstacle(lane) {
    const obstacleSpeed = speed * (1 + speedIncrease / 100);
    return {
        x: lanes[lane] - 25,
        y: -50,
        width: 50,
        height: 20,
        passed: false,
        speed: obstacleSpeed,
        color: `rgb(${Math.floor(255 * (1 - speedIncrease / 100))}, 0, 0)`,
        shape: 'rectangle'
    };
}

function checkCollision() {
    obstacles.forEach(obstacle => {
        let collision = false;
        if (obstacle.shape === 'rectangle') {
            collision = (
                ball.x + ball.width / 2 > obstacle.x &&
                ball.x - ball.width / 2 < obstacle.x + obstacle.width &&
                ball.y + ball.height / 2 > obstacle.y &&
                ball.y - ball.height / 2 < obstacle.y + obstacle.height
            );
        } else if (obstacle.shape === 'triangle') {
            // Simpel kollisionsdetektering for trekant
            const spaceshipBottom = ball.y + ball.height / 2;
            const spaceshipTop = ball.y - ball.height / 2;
            const triangleBottom = obstacle.y + obstacle.height;
            const triangleMiddleX = obstacle.x + obstacle.width / 2;
            
            if (ball.x + ball.width / 2 > obstacle.x && ball.x - ball.width / 2 < obstacle.x + obstacle.width &&
                spaceshipBottom > obstacle.y && spaceshipTop < triangleBottom) {
                const slope = obstacle.height / (obstacle.width / 2);
                const spaceshipRelativeX = Math.abs(ball.x - triangleMiddleX);
                const triangleY = triangleBottom - spaceshipRelativeX * slope;
                
                if (spaceshipBottom > triangleY) {
                    collision = true;
                }
            }
        }
        
        if (collision) {
            gameOver = true;
        }
    });
}

function switchLane() {
    if (!ballSwitching) {
        ballSwitching = true;
        ball.lane = ball.lane === 0 ? 1 : 0; // Skift mellem 0 og 1
        ball.x = lanes[ball.lane];
        setTimeout(() => ballSwitching = false, 200);
    }
}

function drawScore() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
}

function drawSpeedIncrease() {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'right';
    ctx.fillText(`+${speedIncrease}% speed`, canvas.width - 10, 30);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameOver) {
        drawBackground();
        drawBall();
        drawObstacles();
        moveObstacles();
        checkCollision();
        drawScore();
        
        if (showSpeedIncreaseMessage) {
            drawSpeedIncrease();
            speedIncreaseMessageTimer--;
            if (speedIncreaseMessageTimer <= 0) {
                showSpeedIncreaseMessage = false;
            }
        }
        
        spawnObstacle();
        
        requestAnimationFrame(gameLoop);
    } else {
        showDeadPage();
    }
}

function showDeadPage() {
    const deadPageIframe = document.createElement('iframe');
    deadPageIframe.id = 'deadPage';
    deadPageIframe.src = 'DeadPage/deadPage.html';
    deadPageIframe.style.position = 'absolute';
    deadPageIframe.style.top = '0';
    deadPageIframe.style.left = '0';
    deadPageIframe.style.width = '100%';
    deadPageIframe.style.height = '100%';
    deadPageIframe.style.border = 'none';
    document.getElementById('game-container').appendChild(deadPageIframe);
    
    // Send the score to the dead page
    setTimeout(() => {
        deadPageIframe.contentWindow.postMessage({ type: 'setScore', score: score }, '*');
    }, 100);
}

// Add this function to restart the game
function restartGame() {
    const deadPageIframe = document.getElementById('deadPage');
    if (deadPageIframe) {
        deadPageIframe.remove();
    }
    startGame();
}

// Add this event listener to handle messages from the dead page
window.addEventListener('message', function(event) {
    if (event.data === 'restartGame') {
        restartGame();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        switchLane();
    }
});

// Remove or comment out this line at the end of the file
// window.startGame = startGame;