const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let box = 32;
let cols, rows;

const headImg = new Image();
headImg.src = "assets/snake-head.svg";

const bodyImg = new Image();
bodyImg.src = "assets/snake-body.svg";

const turnImg = new Image();
turnImg.src = "assets/snake-turn.svg";

const foodImg = new Image();
foodImg.src = "assets/food.svg";

let snake = [];
let food = { x: 0, y: 0 };
let direction = "RIGHT";
let moveDelay = 150;
let lastMoveTime = 0;
let targetHead = { x: 0, y: 0 };
let position = { x: 0, y: 0 };

function resizeCanvas() {
  const screenSize = Math.min(window.innerWidth, window.innerHeight) - 16; // отступ 8px с каждой стороны
  cols = rows = Math.floor(screenSize / box);
  canvas.width = canvas.height = cols * box;
}

window.addEventListener("resize", () => {
  resizeCanvas();
  resetGame();
});

resizeCanvas();

function resetGame() {
  snake = [
    { x: 5, y: 5 }, // голова
    { x: 4, y: 5 }, // тело
  ];
  direction = "RIGHT";
  position = { x: snake[0].x * box, y: snake[0].y * box };
  targetHead = { ...position };
  placeFood();
}

function placeFood() {
  // Помещаем еду в случайное место, не на змейке
  do {
    food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
  } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function moveSnake() {
  const head = { ...snake[0] };

  if (direction === "RIGHT") head.x++;
  if (direction === "LEFT") head.x--;
  if (direction === "UP") head.y--;
  if (direction === "DOWN") head.y++;

  // Проверка стен
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    resetGame();
    return;
  }

  // Проверка столкновения с телом
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    resetGame();
    return;
  }

  // Еда
  if (head.x === food.x && head.y === food.y) {
    snake.unshift(head);
    placeFood();
  } else {
    snake.pop();
    snake.unshift(head);
  }

  targetHead = { x: head.x * box, y: head.y * box };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Еда
  ctx.drawImage(foodImg, food.x * box, food.y * box, box, box);

  // Тело змейки (кроме головы и хвоста)
  for (let i = 1; i < snake.length - 1; i++) {
    const prev = snake[i - 1];
    const curr = snake[i];
    const next = snake[i + 1];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    ctx.save();
    ctx.translate(curr.x * box + box / 2, curr.y * box + box / 2);

    if ((dx1 === dx2 && dx1 !== 0) || (dy1 === dy2 && dy1 !== 0)) {
      // Прямой сегмент
      const angle = dx1 !== 0 ? 0 : Math.PI / 2;
      ctx.rotate(angle);
      ctx.drawImage(bodyImg, -box / 2, -box / 2, box, box);
    } else {
      // Поворот
      let angle = 0;
      if ((dx1 === 1 && dy2 === -1) || (dy1 === -1 && dx2 === 1)) angle = 0;
      else if ((dx1 === -1 && dy2 === -1) || (dy1 === -1 && dx2 === -1)) angle = Math.PI / 2;
      else if ((dx1 === -1 && dy2 === 1) || (dy1 === 1 && dx2 === -1)) angle = Math.PI;
      else if ((dx1 === 1 && dy2 === 1) || (dy1 === 1 && dx2 === 1)) angle = -Math.PI / 2;

      ctx.rotate(angle);
      ctx.drawImage(turnImg, -box / 2, -box / 2, box, box);
    }

    ctx.restore();
  }

  // Хвост (последний сегмент) — просто прямой сегмент, поворачиваем в сторону предыдущего
  if (snake.length > 1) {
    const tail = snake[snake.length - 1];
    const beforeTail = snake[snake.length - 2];

    ctx.save();
    ctx.translate(tail.x * box + box / 2, tail.y * box + box / 2);

    let dx = tail.x - beforeTail.x;
    let dy = tail.y - beforeTail.y;
    let angle = 0;

    if (dx === 1) angle = 0;
    else if (dx === -1) angle = Math.PI;
    else if (dy === 1) angle = Math.PI / 2;
    else if (dy === -1) angle = -Math.PI / 2;

    ctx.rotate(angle);
    ctx.drawImage(bodyImg, -box / 2, -box / 2, box, box);

    ctx.restore();
  }

  // Голова с плавным поворотом
  position.x = lerp(position.x, targetHead.x, 0.2);
  position.y = lerp(position.y, targetHead.y, 0.2);

  ctx.save();
  ctx.translate(position.x + box / 2, position.y + box / 2);

  let headAngle = 0;
  if (direction === "UP") headAngle = -Math.PI / 2;
  else if (direction === "DOWN") headAngle = Math.PI / 2;
  else if (direction === "LEFT") headAngle = Math.PI;
  else headAngle = 0;

  ctx.rotate(headAngle);
  ctx.drawImage(headImg, -box / 2, -box / 2, box, box);
  ctx.restore();
}

function gameLoop(timestamp) {
  if (!lastMoveTime) lastMoveTime = timestamp;

  if (timestamp - lastMoveTime > moveDelay) {
    moveSnake();
    lastMoveTime = timestamp;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// Telegram WebApp
Telegram.WebApp.ready();
Telegram.WebApp.expand();
Telegram.WebApp.MainButton.setText("Закрыть игру").show().onClick(() => {
  Telegram.WebApp.close();
});

// Свайпы
let touchX, touchY;
canvas.addEventListener("touchstart", e => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && direction !== "LEFT") direction = "RIGHT";
    else if (dx < 0 && direction !== "RIGHT") direction = "LEFT";
  } else {
    if (dy > 0 && direction !== "UP") direction = "DOWN";
    else if (dy < 0 && direction !== "DOWN") direction = "UP";
  }
});

// Кнопка Play
document.getElementById("playBtn").addEventListener("click", () => {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  resetGame();
  requestAnimationFrame(gameLoop);
});

ctx.save();
ctx.translate(snake[i].x * box + box / 2, snake[i].y * box + box / 2);
ctx.drawImage(bodyImg, -box / 2, -box / 2, box, box);
ctx.restore();
