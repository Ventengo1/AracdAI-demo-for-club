// script.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const finalScoreEl = document.getElementById("final-score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
let screenShakeTimer = 0;

// Audio Context Setup
let audioCtx;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSynthSound(freq, type, duration) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Game State
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem("astro_high_score") || 0;
highScoreEl.textContent = highScore;

let gameSpeed = 4;
let keys = {};

// Player Rocket
const player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 80,
  width: 30,
  height: 50,
  speed: 8,
  hasShield: false,
  shieldTimer: 0
};

// Game Arrays
let obstacles = [];
let powerups = [];
let particles = [];
let stars = [];
let popups = [];

// Initialize Background Stars
for (let i = 0; i < 150; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 2 + 1
  });
}

// Event Listeners
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

startBtn.addEventListener("click", () => {
  initAudio();
  startGame();
});

restartBtn.addEventListener("click", () => {
  initAudio();
  startGame();
});

function startGame() {
  score = 0;
  gameSpeed = 4;
  obstacles = [];
  powerups = [];
  particles = [];
  player.x = canvas.width / 2 - player.width / 2;
  player.hasShield = false;
  
  scoreEl.textContent = score;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  isPlaying = true;
  requestAnimationFrame(gameLoop);
}

function addPopup(x, y, text) {
  popups.push({ x: x, y: y, text: text, life: 30 });
}

function spawnObstacle() {
  const types = ["rocket", "asteroid"];
  const type = types[Math.floor(Math.random() * types.length)];
  const width = type === "rocket" ? 28 : Math.random() * 20 + 25;
  const height = type === "rocket" ? 48 : width;
  
  obstacles.push({
    x: Math.random() * (canvas.width - width),
    y: -height,
    width,
    height,
    speed: gameSpeed + Math.random() * 2,
    type
  });
}

function spawnPowerup() {
  const types = ["shield", "star"];
  const type = types[Math.floor(Math.random() * types.length)];
  
  powerups.push({
    x: Math.random() * (canvas.width - 20),
    y: -20,
    width: 20,
    height: 20,
    type
  });
}

function createExplosion(x, y, color) {
  screenShakeTimer = 12;
  draw();
  for (let i = 0; i < 20; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 4 + 1,
      color,
      life: 30
    });
  }
}

// Draw Helpers
function drawRocket(x, y, width, height, color, isEnemy = false) {
  ctx.fillStyle = color;
  // Body
  ctx.fillRect(x + width * 0.2, y + height * 0.2, width * 0.6, height * 0.6);
  // Nose
  ctx.beginPath();
  if (isEnemy) {
    ctx.moveTo(x + width * 0.2, y + height * 0.8);
    ctx.lineTo(x + width * 0.8, y + height * 0.8);
    ctx.lineTo(x + width / 2, y + height);
  } else {
    ctx.moveTo(x + width * 0.2, y + height * 0.2);
    ctx.lineTo(x + width * 0.8, y + height * 0.2);
    ctx.lineTo(x + width / 2, y);
  }
  ctx.fill();
  
  // Fins
  ctx.fillStyle = "#ff0055";
  ctx.fillRect(x, y + (isEnemy ? 0 : height * 0.6), width * 0.2, height * 0.3);
  ctx.fillRect(x + width * 0.8, y + (isEnemy ? 0 : height * 0.6), width * 0.2, height * 0.3);
}

function update() {
    let isBoosting = keys["Space"] || keys["ShiftLeft"] || keys["ShiftRight"];
    let speedMultiplier = 1;

    if (isBoosting) {
        speedMultiplier = 2.5;
    }
  // Boost Mechanic
  
  if (keys["Space"] || keys["ShiftLeft"] || keys["ShiftRight"]) {
    speedMultiplier = 1.8;
  }

  // Player Movement
  if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > 0) {
    player.x -= player.speed * speedMultiplier;
  }
  if ((keys["ArrowRight"] || keys["KeyD"]) && player.x < canvas.width - player.width) {
    player.x += player.speed * speedMultiplier;
  }
  
  popups.forEach((p, index) => {
    p.y -= 1.5;  //adding this as feature, want it to be a popup that come uo
    p.life--;
    if (p.life <= 0) popups.splice(index, 1);
  });

  // Thruster Particles
  particles.push({
    x: player.x + player.width / 2 + (Math.random() - 0.5) * 6,
    y: player.y + player.height,
    vx: (Math.random() - 0.5) * 1,
    vy: Math.random() * 3 + 2,
    size: Math.random() * 3 + 2,
    color: speedMultiplier > 1 ? "#00ffff" : "#ffaa00",
    life: 15
  });

  // Background Stars
  stars.forEach((star) => {
    star.y += star.speed * (speedMultiplier > 1 ? 2 : 1);
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  // Spawning logic
  if (Math.random() < 0.03) spawnObstacle();
  if (Math.random() < 0.005) spawnPowerup();

  // Update Particles
  particles.forEach((p, index) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(index, 1);
  });

  // Update Obstacles
  obstacles.forEach((obs, index) => {
    obs.y += obs.speed;

    // Collision Detection
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      if (player.hasShield) {
        player.hasShield = false;
        createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, "#00ffcc");
        playSynthSound(400, "square", 0.1);
        obstacles.splice(index, 1);
      } else {
        handleGameOver();
      }
    }

    if (obs.y > canvas.height) {
      obstacles.splice(index, 1);
      score += 10;
      scoreEl.textContent = score;
      if (score % 100 === 0) gameSpeed += 0.5;
    }
  });

  // Update Powerups
  powerups.forEach((pow, index) => {
    pow.y += 3;

    if (
      player.x < pow.x + pow.width &&
      player.x + player.width > pow.x &&
      player.y < pow.y + pow.height &&
      player.y + player.height > pow.y
    ) {
      if (pow.type === "shield") {
        player.hasShield = true;
        playSynthSound(600, "sine", 0.15);
      } else if (pow.type === "star") {
        score += 50;
        scoreEl.textContent = score;
        addPopup(pow.x, pow.y, "+50"); //new feature I adding 
        playSynthSound(800, "triangle", 0.1);
      }
      powerups.splice(index, 1);
    }

    if (pow.y > canvas.height) powerups.splice(index, 1);
  });
}

function draw() {
  ctx.save();
  if (screenShakeTimer > 0) {
    screenShakeTimer--;
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render Stars
  ctx.fillStyle = "#ffffff";
  stars.forEach((star) => {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });

  // Render Particles
  particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  
  popups.forEach((p) => {
    ctx.fillStyle = "#ffff00"; //draw the popup for the score
    ctx.font = "bold 12px 'Courier New'";
    ctx.fillText(p.text, p.x, p.y);
  });

  // Render Player
  drawRocket(player.x, player.y, player.width, player.height, "#00ffcc");

  // Render Shield Aura
  if (player.hasShield) {
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      player.x + player.width / 2,
      player.y + player.height / 2,
      player.height / 1.3,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // Render Obstacles
  obstacles.forEach((obs) => {
    if (obs.type === "rocket") {
      drawRocket(obs.x, obs.y, obs.width, obs.height, "#ff0055", true);
    } else {
      ctx.fillStyle = "#8888aa";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
  });

  // Render Powerups
  powerups.forEach((pow) => {
    ctx.fillStyle = pow.type === "shield" ? "#00ffcc" : "#ffff00";
    ctx.beginPath();
    ctx.arc(pow.x + 10, pow.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function handleGameOver() {
  isPlaying = false;
  createExplosion(player.x + player.width / 2, player.y + player.height / 2, "#ff0055");
  playSynthSound(150, "sawtooth", 0.4);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("astro_high_score", highScore);
    highScoreEl.textContent = highScore;
  }

  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove("hidden");
  draw();
}

function gameLoop() {
  if (!isPlaying) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
