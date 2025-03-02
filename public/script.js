const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverElement = document.getElementById('game-over');
const shootSound = document.getElementById('shoot-sound');
const explosionSound = document.getElementById('explosion-sound');
const gameOverSound = document.getElementById('game-over-sound');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreElement.textContent = `High Score: ${highScore}`;
let gameOver = false;
let gameTime = 0; // ゲーム時間の追跡

// プレイヤー
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 50,
  width: 50,
  height: 50,
  speed: 5,
  dx: 0,
  shield: false,
  rapidFire: false,
  lastShot: 0,
  shotDelay: 500 // 通常の射撃間隔（ミリ秒）
};

// 敵
const enemies = [];
const enemyTypes = {
  normal: { color: 'red', speed: 2, shoot: false },
  fast: { color: 'blue', speed: 3, shoot: false },
  shooter: { color: 'green', speed: 2, shoot: true }
};
const enemyRows = 5;
const enemyCols = 10;
const enemyWidth = 50;
const enemyHeight = 50;
const enemyPadding = 10;
const enemyOffsetTop = 50;
const enemyOffsetLeft = 50;
let enemyDx = 2;
let enemyDy = 0;
let enemyShootInterval = 2000; // 敵の射撃間隔（ミリ秒）

// 弾
const bullets = [];
const enemyBullets = [];
const bulletWidth = 5;
const bulletHeight = 10;
const bulletSpeed = 5;

// パワーアップアイテム
const powerUps = [];
const powerUpWidth = 20;
const powerUpHeight = 20;

// 敵の初期位置設定
function createEnemies() {
  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
      const x = enemyOffsetLeft + col * (enemyWidth + enemyPadding);
      const y = enemyOffsetTop + row * (enemyHeight + enemyPadding);
      const type = row % 3 === 0 ? 'fast' : row % 2 === 0 ? 'shooter' : 'normal';
      enemies.push({
        x, y,
        width: enemyWidth,
        height: enemyHeight,
        type: enemyTypes[type],
        shootTimer: Math.random() * enemyShootInterval
      });
    }
  }
}

// パワーアップアイテムの生成
function spawnPowerUp(x, y) {
  const type = Math.random() > 0.5 ? 'rapidFire' : 'shield';
  powerUps.push({ x, y, width: powerUpWidth, height: powerUpHeight, type });
}

// 描画関数
function drawPlayer() {
  ctx.fillStyle = player.shield ? 'cyan' : 'white';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.type.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

function drawBullets() {
  ctx.fillStyle = 'yellow';
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
  ctx.fillStyle = 'orange';
  enemyBullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawPowerUps() {
  powerUps.forEach(powerUp => {
    ctx.fillStyle = powerUp.type === 'rapidFire' ? 'purple' : 'green';
    ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
  });
}

// 更新関数
function updatePlayer() {
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function updateEnemies(delta) {
  enemies.forEach(enemy => {
    enemy.x += enemy.type.speed * enemyDx;
    enemy.y += enemyDy;

    // 敵の射撃処理
    if (enemy.type.shoot) {
      enemy.shootTimer += delta;
      if (enemy.shootTimer > enemyShootInterval) {
        enemyBullets.push({
          x: enemy.x + enemy.width / 2 - bulletWidth / 2,
          y: enemy.y + enemy.height,
          width: bulletWidth,
          height: bulletHeight
        });
        enemy.shootTimer = 0;
      }
    }
  });

  // 敵が端に到達したら方向転換
  let reachedEdge = false;
  enemies.forEach(enemy => {
    if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
      reachedEdge = true;
    }
  });

  if (reachedEdge) {
    enemyDx = -enemyDx;
    enemyDy = 10; // 下に移動
  } else {
    enemyDy = 0;
  }

  // 敵が画面下部に到達したらゲームオーバー
  enemies.forEach(enemy => {
    if (enemy.y + enemy.height > canvas.height) {
      gameOver = true;
    }
  });
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
    bullet.y -= bulletSpeed;
    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });

  enemyBullets.forEach((bullet, index) => {
    bullet.y += bulletSpeed;
    if (bullet.y > canvas.height) {
      enemyBullets.splice(index, 1);
    }
  });
}

function updatePowerUps() {
  powerUps.forEach((powerUp, index) => {
    powerUp.y += 2;
    if (powerUp.y > canvas.height) {
      powerUps.splice(index, 1);
    }
  });
}

// 当たり判定
function checkCollisions() {
  // プレイヤーの弾と敵の当たり判定
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);
        score += 10;
        scoreElement.textContent = `Score: ${score}`;
        explosionSound.play();
        if (Math.random() < 0.2) spawnPowerUp(enemy.x, enemy.y); // 20%の確率でパワーアップ
      }
    });
  });

  // 敵の弾とプレイヤーの当たり判定
  enemyBullets.forEach((bullet, bIndex) => {
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      enemyBullets.splice(bIndex, 1);
      if (!player.shield) {
        gameOver = true;
      } else {
        player.shield = false;
      }
    }
  });

  // パワーアップアイテムとプレイヤーの当たり判定
  powerUps.forEach((powerUp, pIndex) => {
    if (
      powerUp.x < player.x + player.width &&
      powerUp.x + powerUp.width > player.x &&
      powerUp.y < player.y + player.height &&
      powerUp.y + powerUp.height > player.y
    ) {
      powerUps.splice(pIndex, 1);
      if (powerUp.type === 'rapidFire') {
        player.rapidFire = true;
        player.shotDelay = 200; // 連射速度アップ
        setTimeout(() => {
          player.rapidFire = false;
          player.shotDelay = 500;
        }, 5000); // 5秒後に効果終了
      } else if (powerUp.type === 'shield') {
        player.shield = true;
        setTimeout(() => {
          player.shield = false;
        }, 5000); // 5秒後に効果終了
      }
    }
  });
}

// ゲームループ
let lastTime = 0;
function gameLoop(timestamp) {
  if (gameOver) {
    gameOverElement.style.display = 'block';
    gameOverSound.play();
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      highScoreElement.textContent = `High Score: ${highScore}`;
    }
    return;
  }

  const delta = timestamp - lastTime;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawPowerUps();
  updatePlayer();
  updateEnemies(delta);
  updateBullets();
  updatePowerUps();
  checkCollisions();

  // 難易度の増加
  gameTime += delta;
  if (gameTime > 30000) { // 30秒後
    enemyDx *= 1.5;
    enemyShootInterval = Math.max(1000, enemyShootInterval * 0.8);
    gameTime = 0;
  }

  requestAnimationFrame(gameLoop);
}

// キーボードイベント
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') {
    player.dx = -player.speed;
  } else if (e.key === 'ArrowRight') {
    player.dx = player.speed;
  } else if (e.key === ' ') {
    const now = performance.now();
    if (now - player.lastShot > player.shotDelay) {
      bullets.push({
        x: player.x + player.width / 2 - bulletWidth / 2,
        y: player.y - bulletHeight,
        width: bulletWidth,
        height: bulletHeight
      });
      player.lastShot = now;
      shootSound.play();
    }
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    player.dx = 0;
  }
});

// ゲーム開始
createEnemies();
gameLoop();