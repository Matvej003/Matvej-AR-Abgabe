const scene = document.querySelector('a-scene');
let gameState = {
    score: 0,
    misses: 0,
    gameActive: false,
    timeLeft: 60,
    gameStarted: false
};

let gameTimer = null;

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('misses').textContent = gameState.misses;
    const total = gameState.score + gameState.misses;
    const acc = total > 0 ? ((gameState.score / total) * 100).toFixed(1) : 0;
    document.getElementById('accuracy').textContent = acc + '%';
    document.getElementById('timer').textContent = gameState.timeLeft;
}

function spawnTargets(count = 10) {
    for (let i = 0; i < count; i++) {
        const target = document.createElement('a-sphere');
        const radius = (Math.random() * 0.3 + 0.2).toFixed(2);
        target.setAttribute('radius', radius);
        target.setAttribute('color', '#FF4444');
        target.setAttribute('class', 'target');
        target.setAttribute('position', getRandomPosition());
        target.setAttribute('animation__pulse', 'property: scale; to: 1.2 1.2 1.2; dur: 500; dir: alternate; loop: true');
        scene.appendChild(target);
    }
}

function getRandomPosition() {
    const radius = Math.random() * 5 + 3;
    const angle = Math.random() * 2 * Math.PI;
    const x = (radius * Math.cos(angle)).toFixed(2);
    const z = (radius * Math.sin(angle)).toFixed(2);
    const y = (Math.random() * 2 + 1).toFixed(2);
    return `${x} ${y} ${z}`;
}

function destroyTarget(el, hit) {
    if (!el) return;

    if (hit) {
        gameState.score++;
        const hitSound = document.getElementById('hitSound');
        if (hitSound) {
            hitSound.currentTime = 0;
            hitSound.play().catch(() => {});
        }
    }

    el.parentNode.removeChild(el);
    updateUI();

    if (gameState.score >= 30) {
        endGame("GEWONNEN!");
    } else if (gameState.gameActive) {
        spawnTargets(1);
    }
}

let lastClickTime = 0;

scene.addEventListener('click', (event) => {
    if (!gameState.gameActive) return;

    const now = Date.now();
    if (now - lastClickTime < 200) return;
    lastClickTime = now;

    const camera = document.querySelector('[camera]');
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0);

    raycaster.setFromCamera(mouse, camera.getObject3D('camera'));
    const intersects = raycaster.intersectObjects(scene.object3D.children, true);

    let hitTarget = false;
    for (let i = 0; i < intersects.length; i++) {
        const intersected = intersects[i].object.el;
        if (intersected && intersected.classList.contains('target')) {
            destroyTarget(intersected, true);
            hitTarget = true;
            break;
        }
    }

    if (!hitTarget) {
        gameState.misses++;
        updateUI();
    }
});

function startTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    gameTimer = setInterval(() => {
        if (!gameState.gameActive) {
            clearInterval(gameTimer);
            return;
        }
        gameState.timeLeft--;
        updateUI();
        if (gameState.timeLeft <= 0) {
            endGame("Zeit abgelaufen!");
            clearInterval(gameTimer);
        }
    }, 1000);
}

function endGame(message) {
    gameState.gameActive = false;
    
    // Clear all remaining targets
    const targets = document.querySelectorAll('.target');
    targets.forEach(target => target.remove());
    
    // Show game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const gameStats = document.getElementById('gameStats');
    
    gameOverMessage.textContent = message;
    
    const total = gameState.score + gameState.misses;
    const accuracy = total > 0 ? ((gameState.score / total) * 100).toFixed(1) : 0;
    
    gameStats.innerHTML = `
        Treffer: ${gameState.score}<br>
        Fehlschüsse: ${gameState.misses}<br>
        Genauigkeit: ${accuracy}%<br>
        Zeit gespielt: ${60 - gameState.timeLeft}s
    `;
    
    gameOverScreen.style.display = 'flex';
    
    // Hide game UI
    document.getElementById('ui').style.display = 'none';
    document.getElementById('crosshair').style.display = 'none';
    document.getElementById('instructions').style.display = 'none';
}

function startGame() {
    // Hide start screen
    document.getElementById('startScreen').style.display = 'none';
    
    // Show game UI
    document.getElementById('ui').style.display = 'block';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
    
    // Reset game state
    gameState = {
        score: 0,
        misses: 0,
        gameActive: true,
        timeLeft: 60,
        gameStarted: true
    };
    
    // Clear any existing targets
    const existingTargets = document.querySelectorAll('.target');
    existingTargets.forEach(target => target.remove());
    
    // Start the game
    updateUI();
    spawnTargets(10);
    startTimer();
    
    // Enable pointer lock after a short delay
    setTimeout(() => {
        const camera = document.querySelector('[camera]');
        if (camera && camera.components['look-controls']) {
            camera.components['look-controls'].requestPointerLock();
        }
    }, 500);
}

function restartGame() {
    // Hide game over screen
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // Clear timer
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    // Start new game
    startGame();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F5') {
            event.preventDefault();
            if (gameState.gameStarted) {
                restartGame();
            }
        }
    });
});

// Wait for A-Frame to load
window.addEventListener('load', () => {
    // Initialize UI but don't start game
    updateUI();
});
