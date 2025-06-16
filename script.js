const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Масштабирование пиксельной графики
ctx.imageSmoothingEnabled = false;

// Размер клетки и сетки
const box = 32;
canvas.width = Math.floor(window.innerWidth / box) * box;
canvas.height = Math.floor(window.innerHeight / box) * box;
const cols = canvas.width / box;
const rows = canvas.height / box;

// Инициализация
let snake = [
  { x: 5, y: 5, dir: "RIGHT" },
  { x: 4, y: 5, dir: "RIGHT" }
];
let food = { x: 10, y: 10 };
let direction = "RIGHT";
let moveDelay = 150;
let lastMoveTime = 0;

// Загрузка текстур
const headImg = new Image(); headImg.src = "assets/HEAD.png";
const bodyImg = new Image(); bodyImg.src = "assets/BODY.png";
const tailImg = new Image(); tailImg.src = "assets/ASS.png";
const cornerImg = new Image(); cornerImg.src = "assets/CORNER.png";
const foodImg = new Image(); foodImg.src = "assets/FOOD.png";

// Telegram Mini App
Telegram.WebApp.ready();
Telegram.WebApp.expand();
Telegram.WebApp.MainButton.setText("Закрыть игру").show().onClick(() => {
  Telegram.WebApp.close();
});

// Запуск игры
document.getElementById("playBtn").addEventListener("click", () => {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  requestAnimationFrame(gameLoop);
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

function placeFood() {
  food = {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
  };
}

function resetGame() {
  snake = [
    { x: 5, y: 5, dir: "RIGHT" },
    { x: 4, y: 5, dir: "RIGHT" }
  ];
  direction = "RIGHT";
  placeFood();
}

function moveSnake() {
  const head = { ...snake[0] };

  if (direction === "RIGHT") head.x++;
  if (direction === "LEFT") head.x--;
  if (direction === "UP") head.y--;
  if (direction === "DOWN") head.y++;

  head.dir = direction;

  // Стены
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    resetGame();
    return;
  }

  // Самоедство
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
}

function drawRotatedImage(img, x, y, angle) {
  ctx.save();
  ctx.translate(x + box / 2, y + box / 2);
  ctx.rotate(angle);
  ctx.drawImage(img, -box / 2, -box / 2, box, box);
  ctx.restore();
}

function directionToAngle(dir) {
  switch (dir) {
    case "UP": return -Math.PI / 2;
    case "DOWN": return Math.PI / 2;
    case "LEFT": return Math.PI;
    case "RIGHT": return 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Еда
  ctx.drawImage(foodImg, food.x * box, food.y * box, box, box);

  // Тело змеи
  for (let i = 0; i < snake.length; i++) {
    const curr = snake[i];

    if (i === 0) {
      // голова
      drawRotatedImage(headImg, curr.x * box, curr.y * box, directionToAngle(curr.dir));
    } else if (i === snake.length - 1) {
      // хвост
      const prev = snake[i - 1];
      const angle = directionToAngle(prev.dir);
      drawRotatedImage(tailImg, curr.x * box, curr.y * box, angle);
    } else {
      const prev = snake[i - 1];
      const next = snake[i + 1];

      const dx1 = curr.x - next.x;
      const dy1 = curr.y - next.y;
      const dx2 = prev.x - curr.x;
      const dy2 = prev.y - curr.y;

      const isCorner = dx1 !== dx2 || dy1 !== dy2;

      if (isCorner) {
        let angle = 0;

        if ((dx1 === 0 && dx2 === 1) || (dx2 === 0 && dx1 === 1)) angle = 0;                    // сверху → вниз → вправо
        else if ((dy1 === 0 && dx2 === -1) || (dx1 === -1 && dy2 === 0)) angle = Math.PI / 2;   // слева → вверх → вниз
        else if ((dx1 === 0 && dx2 === -1) || (dx2 === 0 && dx1 === -1)) angle = Math.PI;       // снизу → вверх → влево
        else if ((dy1 === 0 && dx2 === 1) || (dx1 === 1 && dy2 === 0)) angle = -Math.PI / 2;    // справа → вниз → вверх

        drawRotatedImage(cornerImg, curr.x * box, curr.y * box, angle);
      } else {
        // обычное тело
        const angle = dx1 === 0 ? -Math.PI / 2 : 0;
        drawRotatedImage(bodyImg, curr.x * box, curr.y * box, angle);
      }
    }
  }
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

resetGame();
