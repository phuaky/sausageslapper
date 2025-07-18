// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sizeDisplay = document.getElementById('sausageSize');
const mouthCountDisplay = document.getElementById('mouthCount');

// Resize canvas to full window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game state
let gameOver = false;
let gameOverReason = 'shrunk'; // 'shrunk' or 'eaten'
let mouseX = 0;
let mouseY = 0;
let handPosition = { x: 0, y: 0 };
let handAngle = 0;
let fingerWiggle = 0;

// Clouds
const clouds = [];
for (let i = 0; i < 5; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        width: 100 + Math.random() * 50,
        speed: 0.5 + Math.random() * 0.5
    });
}

// Sausage object
const sausage = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 50,
    vx: 2 + Math.random() * 2,
    vy: 1 + Math.random() * 2,
    rotation: 0,
    wobble: 0,
    segments: 5
};

// Particles
const particles = [];

// Mouths array
const mouths = [];

// Initialize first mouth
function spawnMouth() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(edge) {
        case 0: // left
            x = -50;
            y = Math.random() * canvas.height;
            break;
        case 1: // right
            x = canvas.width + 50;
            y = Math.random() * canvas.height;
            break;
        case 2: // top
            x = Math.random() * canvas.width;
            y = -50;
            break;
        case 3: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 50;
            break;
    }
    
    mouths.push({
        x: x,
        y: y,
        size: 60,
        speed: 2,
        chomp: 0,
        chompDirection: 1,
        angle: 0
    });
    
    mouthCountDisplay.textContent = mouths.length;
}

// Spawn initial mouth
spawnMouth();

// Mouse tracking
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateHandPosition();
});

canvas.addEventListener('click', () => {
    if (gameOver) {
        resetGame();
    } else {
        attemptSlap();
    }
});

// Update hand position based on mouse
function updateHandPosition() {
    handPosition.x = mouseX;
    handPosition.y = mouseY;
    
    // Calculate angle to point toward sausage
    const dx = sausage.x - handPosition.x;
    const dy = sausage.y - handPosition.y;
    handAngle = Math.atan2(dy, dx);
}

// Attempt to slap the sausage or mouths
function attemptSlap() {
    // Check sausage slap
    const sausageDist = Math.sqrt(
        Math.pow(sausage.x - handPosition.x, 2) + 
        Math.pow(sausage.y - handPosition.y, 2)
    );
    
    if (sausageDist < 150) {
        // Successful sausage slap!
        sausage.size *= 1.05; // Smaller size increase
        sausage.segments += 1; // Add a segment to make it longer!
        
        // Launch sausage away from hand (slower speed)
        const angle = Math.atan2(sausage.y - handPosition.y, sausage.x - handPosition.x);
        sausage.vx = Math.cos(angle) * 3;
        sausage.vy = Math.sin(angle) * 3;
        
        // Create particles
        createParticles(sausage.x, sausage.y, 'sausage');
        
        // Update size display
        sizeDisplay.textContent = Math.floor(sausage.size);
        return;
    }
    
    // Check mouth slaps
    for (let i = 0; i < mouths.length; i++) {
        const mouth = mouths[i];
        const mouthDist = Math.sqrt(
            Math.pow(mouth.x - handPosition.x, 2) + 
            Math.pow(mouth.y - handPosition.y, 2)
        );
        
        if (mouthDist < 150) {
            // Successful mouth slap - spawn new mouth!
            spawnMouth();
            
            // Push this mouth away
            const angle = Math.atan2(mouth.y - handPosition.y, mouth.x - handPosition.x);
            const pushForce = 5;
            mouth.x += Math.cos(angle) * pushForce * 10;
            mouth.y += Math.sin(angle) * pushForce * 10;
            
            // Create angry particles
            createParticles(mouth.x, mouth.y, 'mouth');
            break;
        }
    }
}

// Create emoji particles
function createParticles(x, y, type = 'sausage') {
    const emojis = type === 'mouth' ? ['😱', '💢', '😤', '😡', '🤬', '😠'] : ['💥', '⭐', '✨', '🌟', '💫', '🎆'];
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            life: 1
        });
    }
}

// Update game logic
function update() {
    if (gameOver) return;
    
    // Update clouds
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.width) {
            cloud.x = -cloud.width;
        }
    });
    
    // Update sausage
    sausage.x += sausage.vx;
    sausage.y += sausage.vy;
    sausage.rotation += 0.05;
    sausage.wobble += 0.1;
    
    // Check if sausage is off screen
    let offScreen = false;
    if (sausage.x < -sausage.size || sausage.x > canvas.width + sausage.size) {
        offScreen = true;
        sausage.x = sausage.x < 0 ? canvas.width + sausage.size : -sausage.size;
    }
    if (sausage.y < -sausage.size || sausage.y > canvas.height + sausage.size) {
        offScreen = true;
        sausage.y = sausage.y < 0 ? canvas.height + sausage.size : -sausage.size;
    }
    
    // Shrink if off screen (reduced penalty)
    if (offScreen) {
        sausage.size *= 0.95; // Only shrink by 5% instead of 15%
        if (sausage.segments > 5) {
            sausage.segments -= 1; // Lose a segment when going off screen
        }
        sizeDisplay.textContent = Math.floor(sausage.size);
    }
    
    // Check game over
    if (sausage.size < 20) {
        gameOver = true;
    }
    
    // Update particles
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.vy += 0.3; // Gravity for particles
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
    
    // Update hand animation
    fingerWiggle += 0.2;
    
    // Update mouths
    mouths.forEach((mouth, index) => {
        // Calculate direction to sausage
        const dx = sausage.x - mouth.x;
        const dy = sausage.y - mouth.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Move toward sausage
        if (dist > 0) {
            mouth.x += (dx / dist) * mouth.speed;
            mouth.y += (dy / dist) * mouth.speed;
        }
        
        // Update angle to face sausage
        mouth.angle = Math.atan2(dy, dx);
        
        // Animate chomping
        mouth.chomp += mouth.chompDirection * 0.15;
        if (mouth.chomp > 1 || mouth.chomp < 0) {
            mouth.chompDirection *= -1;
        }
        
        // Check if mouth caught sausage
        if (dist < (mouth.size + sausage.size) * 0.4) {
            gameOver = true;
            gameOverReason = 'eaten';
        }
        
        // Wrap mouths around screen
        if (mouth.x < -100) mouth.x = canvas.width + 100;
        if (mouth.x > canvas.width + 100) mouth.x = -100;
        if (mouth.y < -100) mouth.y = canvas.height + 100;
        if (mouth.y > canvas.height + 100) mouth.y = -100;
    });
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.width);
    });
    
    // Draw sausage
    drawSausage();
    
    // Draw mouths
    mouths.forEach(mouth => drawMouth(mouth));
    
    // Draw particles
    particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.font = '30px Arial';
        ctx.fillText(particle.emoji, particle.x - 15, particle.y + 15);
        ctx.restore();
    });
    
    // Draw hand
    drawHand();
    
    // Draw game over message
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Comic Sans MS';
        ctx.textAlign = 'center';
        const message = gameOverReason === 'eaten' ? 'SAUSAGE EATEN!' : 'SAUSAGE ESCAPED!';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        
        ctx.font = '30px Comic Sans MS';
        ctx.fillText('Click anywhere to restart', canvas.width / 2, canvas.height / 2 + 60);
    }
}

// Draw cloud
function drawCloud(x, y, width) {
    const height = width * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, height / 2, 0, Math.PI * 2);
    ctx.arc(x + width * 0.25, y - height * 0.1, height * 0.4, 0, Math.PI * 2);
    ctx.arc(x + width * 0.5, y, height * 0.5, 0, Math.PI * 2);
    ctx.arc(x + width * 0.75, y - height * 0.05, height * 0.45, 0, Math.PI * 2);
    ctx.fill();
}

// Draw sausage
function drawSausage() {
    ctx.save();
    ctx.translate(sausage.x, sausage.y);
    ctx.rotate(sausage.rotation);
    
    // Calculate total length based on segments
    const totalLength = sausage.size + (sausage.segments - 5) * 10; // Base size + extra length per segment
    
    // Draw sausage body segments
    const segmentLength = totalLength / sausage.segments;
    for (let i = 0; i < sausage.segments; i++) {
        const wobbleOffset = Math.sin(sausage.wobble + i * 0.5) * 5;
        
        ctx.fillStyle = i % 2 === 0 ? '#8B4513' : '#A0522D';
        ctx.beginPath();
        ctx.ellipse(
            -totalLength / 2 + segmentLength * i + segmentLength / 2,
            wobbleOffset,
            segmentLength / 2 + 2,
            sausage.size * 0.3,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw face
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(totalLength / 2 - 15, -10, 8, 0, Math.PI * 2);
    ctx.arc(totalLength / 2 - 15, 10, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(totalLength / 2 - 15, -10, 4, 0, Math.PI * 2);
    ctx.arc(totalLength / 2 - 15, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw smile
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(totalLength / 2 - 15, 0, 15, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    ctx.restore();
}

// Draw hand
function drawHand() {
    ctx.save();
    ctx.translate(handPosition.x, handPosition.y);
    
    // Rotate to point toward sausage
    ctx.rotate(handAngle);
    
    // Draw palm
    ctx.fillStyle = '#FFDBAC';
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw fingers
    for (let i = -2; i <= 2; i++) {
        const fingerAngle = i * 0.3 + Math.sin(fingerWiggle + i) * 0.1;
        ctx.save();
        ctx.rotate(fingerAngle);
        ctx.fillRect(35, i * 12 - 5, 25, 10);
        ctx.beginPath();
        ctx.arc(60, i * 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Draw thumb
    ctx.save();
    ctx.rotate(-0.8);
    ctx.fillRect(20, -30, 20, 12);
    ctx.beginPath();
    ctx.arc(40, -24, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
}

// Draw mouth
function drawMouth(mouth) {
    ctx.save();
    ctx.translate(mouth.x, mouth.y);
    ctx.rotate(mouth.angle);
    
    // Mouth body (red/pink)
    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.ellipse(0, 0, mouth.size * 0.8, mouth.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner mouth (dark red)
    ctx.fillStyle = '#B71C1C';
    ctx.beginPath();
    ctx.ellipse(0, 0, mouth.size * 0.6, mouth.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Teeth (top)
    ctx.fillStyle = 'white';
    const teethCount = 5;
    const teethWidth = mouth.size * 0.8 / teethCount;
    for (let i = 0; i < teethCount; i++) {
        const x = -mouth.size * 0.4 + i * teethWidth + teethWidth / 2;
        const y = -mouth.size * 0.3 + mouth.chomp * 10;
        ctx.beginPath();
        ctx.moveTo(x - teethWidth * 0.3, y);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x + teethWidth * 0.3, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Teeth (bottom)
    for (let i = 0; i < teethCount; i++) {
        const x = -mouth.size * 0.4 + i * teethWidth + teethWidth / 2;
        const y = mouth.size * 0.3 - mouth.chomp * 10;
        ctx.beginPath();
        ctx.moveTo(x - teethWidth * 0.3, y);
        ctx.lineTo(x, y - 10);
        ctx.lineTo(x + teethWidth * 0.3, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Tongue
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.ellipse(mouth.size * 0.2, 0, mouth.size * 0.3, mouth.size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-mouth.size * 0.3, -mouth.size * 0.5, 8, 0, Math.PI * 2);
    ctx.arc(-mouth.size * 0.3, mouth.size * 0.5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-mouth.size * 0.3, -mouth.size * 0.5, 4, 0, Math.PI * 2);
    ctx.arc(-mouth.size * 0.3, mouth.size * 0.5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Reset game
function resetGame() {
    gameOver = false;
    gameOverReason = 'shrunk';
    sausage.x = canvas.width / 2;
    sausage.y = canvas.height / 2;
    sausage.size = 50;
    sausage.segments = 5; // Reset segments
    sausage.vx = 2 + Math.random() * 2;
    sausage.vy = 1 + Math.random() * 2;
    particles.length = 0;
    mouths.length = 0;
    spawnMouth();
    sizeDisplay.textContent = '50';
    mouthCountDisplay.textContent = '1';
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();