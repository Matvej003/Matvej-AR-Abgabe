const scene = document.querySelector('a-scene');

// Objekt zur Speicherung des Spielzustands
let gameState = {
    score: 0,
    misses: 0,
    gameActive: false,
    timeLeft: 60,
    gameStarted: false
};

let gameTimer = null;

// Funktion: updateUI
// Aktualisiert die UI-Elemente mit aktuellen Werten
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('misses').textContent = gameState.misses;
    const total = gameState.score + gameState.misses;
    const acc = total > 0 ? ((gameState.score / total) * 100).toFixed(1) : 0;
    document.getElementById('accuracy').textContent = acc + '%';
    document.getElementById('timer').textContent = gameState.timeLeft;
}

// Funktion: spawnTargets
// Erzeugt eine definierte Anzahl an Kugeln mit Zufallsposition und Größe
function spawnTargets(count = 10) {
    for (let i = 0; i < count; i++) {
        const target = document.createElement('a-sphere');
        const radius = (Math.random() * 0.3 + 0.2).toFixed(2);
        target.setAttribute('radius', radius);
        target.setAttribute('material', 'color: #ff4444;');

        target.setAttribute('class', 'target');
        
        // Zufällige Position innerhalb eines Radius generieren
        target.setAttribute('position', getRandomPosition());
        target.setAttribute('animation__pulse', 'property: scale; to: 1.2 1.2 1.2; dur: 500; dir: alternate; loop: true');
        scene.appendChild(target);
    }
}

// Funktion: getRandomPosition
// Gibt eine zufällige Position im Raum zurück (rund um die Kamera)
function getRandomPosition() {
    const radius = Math.random() * 5 + 3;
    const angle = Math.random() * 2 * Math.PI;
    const x = (radius * Math.cos(angle)).toFixed(2);
    const z = (radius * Math.sin(angle)).toFixed(2);
    const y = (Math.random() * 2 + 1).toFixed(2);
    return `${x} ${y} ${z}`;
}

// Funktion: destroyTarget
// Entfernt ein Ziel aus der Szene und aktualisiert Score/Misses
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
        // Zeigt Spielende-Overlay mit Ergebnis
        endGame("GEWONNEN!");
    } else if (gameState.gameActive) {
        spawnTargets(1); // Neue Kugel nach Treffer
    }
}

// Klick-Event zum Zielen und Treffen von Kugeln
let lastClickTime = 0;
scene.addEventListener('click', (event) => {
    if (!gameState.gameActive) return;

    const now = Date.now();
    if (now - lastClickTime < 200) return;
    lastClickTime = now;

    const camera = document.querySelector('[camera]');
    // Raycaster zum Erkennen getroffener Objekte
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0); // zentriert

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

// Funktion: startTimer
// Startet den Countdown und beendet das Spiel bei 0 Sekunden
function startTimer() {
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

// Funktion: endGame
// Zeigt das Endergebnis und blendet das Overlay ein
function endGame(message) {
    gameState.gameActive = false;
    document.getElementById("gameOverScreen").style.display = "flex";
    document.getElementById("gameOverMessage").textContent = message;
    document.getElementById("gameStats").innerHTML =
        `Treffer: ${gameState.score}<br>` +
        `Verfehlt: ${gameState.misses}<br>` +
        `Treffsicherheit: ${(gameState.score / (gameState.score + gameState.misses) * 100).toFixed(1)}%`;
}

// Funktion: startGame
// Startet das Spiel und blendet alle nötigen UI-Elemente ein
function startGame() {
    gameState.gameActive = true;
    gameState.gameStarted = true;
    gameState.score = 0;
    gameState.misses = 0;
    gameState.timeLeft = 60;
    updateUI();

    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("ui").style.display = "block";
    document.getElementById("crosshair").style.display = "block";
    document.getElementById("instructions").style.display = "block";

    spawnTargets(10);
    startTimer();
}

// Funktion: restartGame
// Wird aufgerufen, wenn der User neu starten möchte
function restartGame() {
    gameState.gameActive = false;
    gameState.gameStarted = false;
    clearInterval(gameTimer);

    const targets = document.querySelectorAll('.target');
    targets.forEach(t => t.remove());

    startGame();
}

// Event Listener für Start- und Neustart-Button
document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("restartButton").addEventListener("click", restartGame);
