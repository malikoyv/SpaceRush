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

let isInvulnerable = false;
let invulnerabilityTimer = 0;
const invulnerabilityDuration = 5000; // 5 seconds of invulnerability

let speedReductionTimer = 0;
const speedReductionDuration = 5000; // 5 seconds of speed reduction
let currentSpeedReduction = 0;

const speedReductionPercentage = 5; // 5% reduction per hit
let totalSpeedReduction = 0; // Track total speed reduction

function drawBall() {
    if (isInvulnerable) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100); // Pulsating effect
    }
    ctx.drawImage(ball.image, ball.x - ball.width / 2, ball.y - ball.height / 2, ball.width, ball.height);
    ctx.globalAlpha = 1;
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
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
        const currentSpeed = speed * (1 + (speedIncrease - currentSpeedReduction) / 100);
        obstacle.y += obstacle.speed * (currentSpeed / speed);
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
        shape: 'triangle',
        reduceSpeed: true // Add this property
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
        shape: 'rectangle',
        grantInvulnerability: true // Add this property
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
            if (obstacle.grantInvulnerability) {
                isInvulnerable = true;
                invulnerabilityTimer = invulnerabilityDuration;
            } else if (obstacle.reduceSpeed) {
                // Calculate 5% of base speed
                let reductionAmount = speed * (speedReductionPercentage / 100);
                totalSpeedReduction += reductionAmount;
                speedReductionTimer = speedReductionDuration;
                updateSpeed(); // Update speed after reduction
            } else if (!isInvulnerable && obstacle.color !== 'purple') {
                gameOver = true;
            }
            // Remove the obstacle after collision
            obstacle.hit = true;
        }
    });
    // Remove hit obstacles
    obstacles = obstacles.filter(obstacle => !obstacle.hit);
}

function updateSpeed() {
    currentSpeed = speed * (1 + speedIncrease / 100) - totalSpeedReduction;
    // Ensure speed doesn't go below 50% of base speed
    currentSpeed = Math.max(currentSpeed, speed * 0.5);
}

function updateInvulnerability() {
    if (isInvulnerable) {
        invulnerabilityTimer -= 16; // Assuming 60 FPS (1000ms / 60 ≈ 16ms per frame)
        if (invulnerabilityTimer <= 0) {
            isInvulnerable = false;
        }
    }
}

function updateSpeedReduction() {
    if (speedReductionTimer > 0) {
        speedReductionTimer -= 16; // Assuming 60 FPS (1000ms / 60 ≈ 16ms per frame)
        if (speedReductionTimer <= 0) {
            totalSpeedReduction = Math.max(0, totalSpeedReduction - (speed * (speedReductionPercentage / 100)));
            updateSpeed(); // Update speed after reduction ends
        }
    }
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

function drawSpeedInfo() {
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    
    // Draw speed increase
    if (speedIncrease > 0) {
        ctx.fillStyle = 'blue';
        ctx.fillText(`+${speedIncrease}% speed`, canvas.width - 10, 30);
    }
    
    // Draw speed reduction if active
    if (speedReductionTimer > 0) {
        ctx.fillStyle = 'purple';
        ctx.fillText(`-${currentSpeedReduction}% speed`, canvas.width - 10, 60);
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameOver) {
        drawBackground();
        updateInvulnerability(); // Add this line
        drawBall();
        drawObstacles();
        moveObstacles();
        checkCollision();
        drawScore();
        drawSpeedInfo()
        
        if (showSpeedIncreaseMessage) {
            drawSpeedIncrease();
            speedIncreaseMessageTimer--;
            if (speedIncreaseMessageTimer <= 0) {
                showSpeedIncreaseMessage = false;
            }
        }
        
        spawnObstacle();
        updateSpeedReduction();
        updateSpeed(); // Update speed every frame
        
        requestAnimationFrame(gameLoop);
    } else {
        drawBackground();
        ctx.font = '40px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, 300);
        ctx.font = '20px Arial';
        ctx.fillText('Score: ' + score, canvas.width / 2, 350);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        switchLane();
    }
});

backgroundImage.onload = function() {
    gameLoop();
};