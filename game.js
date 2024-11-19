const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_FISH_SIZE = 20;
const MAX_FISH_SIZE = 100;
const FISH_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];
const INITIAL_FISH_COUNT = 20;

let canvas, ctx;
let player;
let fishes = [];
let score = 0;
let level = 1;
let isGameOver = false;
let isPaused = false;
let lastTime = 0;
let mouseX = 0;
let mouseY = 0;

class Fish {
  constructor(isPlayer = false) {
    this.size = isPlayer
      ? MIN_FISH_SIZE
      : Math.random() * (MAX_FISH_SIZE - MIN_FISH_SIZE) + MIN_FISH_SIZE;
    this.x = isPlayer ? CANVAS_WIDTH / 2 : Math.random() * CANVAS_WIDTH;
    this.y = isPlayer ? CANVAS_HEIGHT / 2 : Math.random() * CANVAS_HEIGHT;
    this.speed = isPlayer ? 5 : Math.random() * 2 + 1;
    this.color = isPlayer
      ? "#60A5FA"
      : FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
    this.direction = Math.random() * Math.PI * 2;
    this.isPlayer = isPlayer;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(deltaTime) {
    if (this.isPlayer) {
      // 平滑移动到鼠标位置
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {
        this.direction = Math.atan2(dy, dx);
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
      }
    } else {
      // AI 鱼的移动
      if (Math.random() < 0.02) {
        this.direction += ((Math.random() - 0.5) * Math.PI) / 2;
      }

      this.x += Math.cos(this.direction) * this.speed;
      this.y += Math.sin(this.direction) * this.speed;

      // 边界检查
      if (this.x < 0) this.x = CANVAS_WIDTH;
      if (this.x > CANVAS_WIDTH) this.x = 0;
      if (this.y < 0) this.y = CANVAS_HEIGHT;
      if (this.y > CANVAS_HEIGHT) this.y = 0;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.direction + (this.isPlayer ? Math.PI : 0));

    // 绘制鱼身
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-this.size / 2, 0);
    ctx.quadraticCurveTo(0, -this.size / 4, this.size / 2, 0);
    ctx.quadraticCurveTo(0, this.size / 4, -this.size / 2, 0);
    ctx.fill();

    // 绘制尾巴
    ctx.beginPath();
    ctx.moveTo(-this.size / 2, 0);
    ctx.lineTo(-this.size / 1.5, -this.size / 4);
    ctx.lineTo(-this.size / 1.5, this.size / 4);
    ctx.closePath();
    ctx.fill();

    // 绘制眼睛
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.size / 4, -this.size / 8, this.size / 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.size / 4, -this.size / 8, this.size / 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  collidesWith(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.size + other.size) / 3;
  }
}

function initGame() {
  canvas = document.getElementById("gameCanvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  ctx = canvas.getContext("2d");

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  startNewGame();
}

function startNewGame() {
  player = new Fish(true);
  fishes = [];
  score = 0;
  level = 1;
  isGameOver = false;
  isPaused = false;

  for (let i = 0; i < INITIAL_FISH_COUNT; i++) {
    fishes.push(new Fish());
  }

  document.getElementById("gameOverModal").classList.add("hidden");
  updateUI();
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (isGameOver || isPaused) return;

  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  update(deltaTime);
  draw();
  checkCollisions();
  spawnNewFish();
  updateUI();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  player.update(deltaTime);
  fishes.forEach((fish) => fish.update(deltaTime));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制背景气泡
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 20 + 5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  fishes.forEach((fish) => fish.draw());
  player.draw();
}

function checkCollisions() {
  for (let i = fishes.length - 1; i >= 0; i--) {
    if (player.collidesWith(fishes[i])) {
      if (player.size > fishes[i].size * 0.8) {
        // 玩家吃掉小鱼
        score += Math.floor(fishes[i].size);
        player.size += fishes[i].size * 0.1;
        fishes.splice(i, 1);

        if (score > level * 1000) {
          level++;
        }
      } else {
        // 玩家被大鱼吃掉
        gameOver();
      }
    }
  }
}

function spawnNewFish() {
  if (fishes.length < INITIAL_FISH_COUNT) {
    if (Math.random() < 0.05) {
      fishes.push(new Fish());
    }
  }
}

function gameOver() {
  isGameOver = true;
  document.getElementById("gameOverModal").classList.remove("hidden");
  document.getElementById("finalScore").textContent = score;
}

function togglePause() {
  isPaused = !isPaused;
  if (!isPaused) {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  document.getElementById("size").textContent = Math.floor(player.size);
}

window.onload = initGame;
