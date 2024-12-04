const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const pauseButton = document.getElementById('pauseButton');

// Make canvas responsive
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const size = Math.min(containerWidth - 40, 800);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const INITIAL_SPEED = 100;
const MIN_SPEED = 50;
const SPEED_DECREASE = 2;

let snake = [{ x: 10, y: 10 }];
let foods = [];
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop = null;
let gameSpeed = INITIAL_SPEED;
let isPaused = false;
let circuitPatterns = [];
let touchStartX = null;
let touchStartY = null;
let isGameOver = false;

// Generate circuit patterns
function generateCircuitPatterns() {
    circuitPatterns = [];
    for (let i = 0; i < 15; i++) {
        circuitPatterns.push({
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            type: Math.floor(Math.random() * 4) // 0: horizontal, 1: vertical, 2: corner, 3: cross
        });
    }
}

// Draw circuit patterns
function drawCircuitPatterns() {
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;

    circuitPatterns.forEach(pattern => {
        const x = pattern.x * gridSize;
        const y = pattern.y * gridSize;
        
        ctx.beginPath();
        switch (pattern.type) {
            case 0: // horizontal
                ctx.moveTo(x, y + gridSize/2);
                ctx.lineTo(x + gridSize, y + gridSize/2);
                break;
            case 1: // vertical
                ctx.moveTo(x + gridSize/2, y);
                ctx.lineTo(x + gridSize/2, y + gridSize);
                break;
            case 2: // corner
                ctx.moveTo(x + gridSize/2, y);
                ctx.lineTo(x + gridSize/2, y + gridSize/2);
                ctx.lineTo(x + gridSize, y + gridSize/2);
                break;
            case 3: // cross
                ctx.moveTo(x + gridSize/2, y);
                ctx.lineTo(x + gridSize/2, y + gridSize);
                ctx.moveTo(x, y + gridSize/2);
                ctx.lineTo(x + gridSize, y + gridSize/2);
                break;
        }
        ctx.stroke();
    });
}

// Draw grid lines
function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 0.5;

    // Add slight glow to grid
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 1;

    for (let i = 0; i <= tileCount; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
}

function drawGame() {
    clearCanvas();
    drawCircuitPatterns();
    drawGrid();
    moveSnake();
    checkCollision();
    drawSnake();
    drawFoods();
    if (isPaused) {
        drawPauseScreen();
    }
}

function clearCanvas() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    // Draw snake body with enhanced glow effect
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        
        // Stronger glow for head
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = isHead ? 15 : 10;
        
        // Inner bright part
        ctx.fillStyle = isHead ? '#fff' : '#00f3ff';
        ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4);
        
        // Circuit pattern inside snake segments
        if (!isHead) {
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(segment.x * gridSize + 4, segment.y * gridSize + gridSize/2);
            ctx.lineTo(segment.x * gridSize + gridSize - 4, segment.y * gridSize + gridSize/2);
            ctx.stroke();
        }
        
        // Outer border with extra glow
        ctx.strokeStyle = isHead ? '#fff' : '#00f3ff';
        ctx.lineWidth = isHead ? 2 : 1;
        ctx.strokeRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
    
    ctx.shadowBlur = 0;
}

function drawFoods() {
    foods.forEach(food => {
        const pulseIntensity = Math.sin(Date.now() * 0.01) * 5 + 10;
        
        // Enhanced food appearance
        ctx.fillStyle = '#ff0066';
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = pulseIntensity;
        
        // Draw main circle
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2,
            gridSize/3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw circuit-like pattern around food
        ctx.strokeStyle = 'rgba(255, 0, 102, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2,
            gridSize/2,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    });
    
    ctx.shadowBlur = 0;
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Enhanced pause screen text
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('PRESS SPACE TO RESUME', canvas.width / 2, canvas.height / 2 + 30);
    
    // Draw circuit-like border
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    
    ctx.shadowBlur = 0;
}

function startGameLoop() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    gameLoop = setInterval(drawGame, gameSpeed);
}

function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    pauseButton.classList.toggle('paused', isPaused);
    
    if (isPaused) {
        clearInterval(gameLoop);
        gameLoop = null;
        drawGame(); // Draw pause screen
    } else {
        startGameLoop();
    }
}

function increaseSpeed() {
    if (gameSpeed > MIN_SPEED) {
        gameSpeed -= SPEED_DECREASE;
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = setInterval(drawGame, gameSpeed);
        }
    }
}

function resetGame() {
    // Clear any existing game loop
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // Reset game state
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = INITIAL_SPEED;
    isPaused = false;
    isGameOver = false;
    
    // Reset UI
    scoreElement.textContent = score;
    pauseButton.classList.remove('paused');
    
    // Generate new game elements
    generateCircuitPatterns();
    generateFoods();
    
    // Start new game loop
    startGameLoop();
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    gameLoop = null;
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    // Draw circuit-like border
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    
    setTimeout(() => {
        resetGame();
    }, 2000);
}

function moveSnake() {
    if (isPaused || isGameOver) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    const foodIndex = foods.findIndex(food => head.x === food.x && head.y === food.y);
    if (foodIndex !== -1) {
        foods.splice(foodIndex, 1);
        score += 10;
        scoreElement.textContent = score;
        increaseSpeed();

        if (foods.length === 0) {
            generateFoods();
        }
    } else {
        snake.pop();
    }
}

function generateFoods() {
    foods = [];
    const foodCount = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < foodCount; i++) {
        generateSingleFood();
    }
}

function generateSingleFood() {
    const newFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    const isColliding = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
                       foods.some(food => food.x === newFood.x && food.y === newFood.y);

    if (isColliding) {
        generateSingleFood();
    } else {
        foods.push(newFood);
    }
}

function checkCollision() {
    if (isPaused || isGameOver) return;
    
    const head = snake[0];
    
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
    }
    
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
        }
    }
}

// Handle keyboard controls
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
        return;
    }

    if (isPaused || isGameOver) return;

    switch (event.key) {
        case 'ArrowUp':
            if (dy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
    }
});

// Add pause button event listener
pauseButton.addEventListener('click', (e) => {
    e.preventDefault();
    togglePause();
});

// Add mobile touch controls
function handleTouchStart(evt) {
    const touch = evt.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchMove(evt) {
    if (!touchStartX || !touchStartY || isPaused || isGameOver) {
        return;
    }

    evt.preventDefault();
    const touch = evt.touches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Determine swipe direction based on the larger delta
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && dx !== -1) {
            dx = 1;
            dy = 0;
        } else if (deltaX < 0 && dx !== 1) {
            dx = -1;
            dy = 0;
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && dy !== -1) {
            dx = 0;
            dy = 1;
        } else if (deltaY < 0 && dy !== 1) {
            dx = 0;
            dy = -1;
        }
    }

    touchStartX = null;
    touchStartY = null;
}

// Setup controls
function setupControls() {
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    function addButtonListeners(button, newDx, newDy, condition) {
        ['mousedown', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                if (condition && !isPaused && !isGameOver) {
                    dx = newDx;
                    dy = newDy;
                }
            });
        });
    }

    addButtonListeners(upBtn, 0, -1, () => dy !== 1);
    addButtonListeners(downBtn, 0, 1, () => dy !== -1);
    addButtonListeners(leftBtn, -1, 0, () => dx !== 1);
    addButtonListeners(rightBtn, 1, 0, () => dx !== -1);
}

// Add touch event listeners
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchmove', handleTouchMove, false);

// Initialize the game
setupControls();
generateCircuitPatterns();
generateFoods();
startGameLoop(); 