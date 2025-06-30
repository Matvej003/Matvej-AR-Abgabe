
const scene = document.querySelector('a-scene');
let gameState = {
    score: 0,
    misses: 0,
    gameActive: true
};

function updateUI() {
    document.getElementById('score').textContent = 'Hits: ' + gameState.score;
    document.getElementById('misses').textContent = 'Misses: ' + gameState.misses;
    const total = gameState.score + gameState.misses;
    const acc = total > 0 ? ((gameState.score / total) * 100).toFixed(1) : 0;
    document.getElementById('accuracy').textContent = 'Accuracy: ' + acc + '%';
}

function spawnTargets(count = 5) {
    for (let i = 0; i < count; i++) {
        const target = document.createElement('a-sphere');
        const radius = (Math.random() * 0.3 + 0.2).toFixed(2); // radius between 0.2 and 0.5
        target.setAttribute('radius', radius);
        target.setAttribute('color', '#FF4444');
        target.setAttribute('class', 'target');
        target.setAttribute('position', getRandomPosition());
        scene.appendChild(target);
    }
}

function getRandomPosition() {
    // Horizontaler Abstand zwischen 3-8 Metern
    const radius = Math.random() * 5 + 3;
    
    // Zufälliger Winkel um die Y-Achse (360 Grad)
    const theta = Math.random() * 2 * Math.PI;
    
    // Höhe zwischen -1 und 3 Metern (relativ zur Augenhöhe)
    // Vermeidet Spawning direkt über oder unter dem Spieler
    const y = (Math.random() * 4 - 1).toFixed(2);
    
    // X und Z basierend auf dem horizontalen Kreis
    const x = (radius * Math.cos(theta)).toFixed(2);
    const z = (radius * Math.sin(theta)).toFixed(2);

    return `${x} ${y} ${z}`;
}


function destroyTarget(el, hit) {
    if (!el) return;

    if (hit) {
        gameState.score++;
        if (hit) {
    gameState.score++;
    const hitSound = document.getElementById('hitSound');
    if (hitSound) {
        hitSound.currentTime = 0;
        hitSound.play();
    }
}

    }

    el.parentNode.removeChild(el);
    updateUI();

    // spawn new target to keep consistent amount
    spawnTargets(1);
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

window.addEventListener('load', () => {
    updateUI();
    spawnTargets(20); // start with 5 targets
});
