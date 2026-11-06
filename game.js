'use strict';

/* =========================================================================
 *  ▍配置区（调数值只需要改这一段，全部集中在文件最顶部）
 * ========================================================================= */

/* -------------------------------------------------------------------------
 *  一、画布与锚点
 *  VIEW    : 逻辑画布尺寸（3:4 竖屏）
 *  ANCHOR  : 绳子悬挂锚点（画布顶部正中间）
 * ---------------------------------------------------------------------- */
const VIEW = { width: 600, height: 800 };
const ANCHOR = { x: 300, y: 76 };

/* -------------------------------------------------------------------------
 *  二、绳子外观与摆动、伸缩手感
 *  width           : 绳子线宽 LineWidth（像素，越小越细）
 *  minLength       : 收回终止长度 = 摆动时的绳长
 *  maxLength       : 安全最大长度
 *  angleLimit      : 摆动最大角度（度，相对竖直向下方向）
 *  swingSpeed      : 摆动角速度（度 / 秒）
 *  extendSpeed     : 发射伸长速度（像素 / 秒）
 *  idleRetractSpeed: 空手收回速度（像素 / 秒）
 * ---------------------------------------------------------------------- */
const ROPE = {
  width: 1,
  minLength: 96,
  maxLength: 1000,
  angleLimit: 68,
  swingSpeed: 84,
  extendSpeed: 900,
  idleRetractSpeed: 950
};

/* -------------------------------------------------------------------------
 *  三、矿镐外观（images/pickaxe.png）
 *  width / height : 绘制宽高（像素，按原图比例等比缩小）
 *  buttX / buttY  : 镐柄末端 = 绳子连接点（相对图片宽高的 0~1 比例）
 *  headX / headY  : 镐头中心 = 实际抓取点（同上）
 * ---------------------------------------------------------------------- */
const PICKAXE_ART = {
  src: 'images/pickaxe.png',
  width: 38,
  height: 40,
  buttX: 0.24,
  buttY: 0.97,
  headX: 0.49,
  headY: 0.37
};

/* -------------------------------------------------------------------------
 *  四、矿镐碰撞判定半径（与宝藏的 hitRadius 相加后做圆碰撞）
 * ---------------------------------------------------------------------- */
const HOOK = { hitRadius: 18 };

/* -------------------------------------------------------------------------
 *  五、三种宝藏的基础属性
 *  src           : 切图路径
 *  value         : 拉回后加的分值
 *  pullSpeed     : 抓住后的回收速度（像素 / 秒，越小越沉）
 *  hitRadius     : 碰撞半径（像素）
 *  displayHeight : 切图在画布上的显示高度（像素，宽度按原图比例）
 * ---------------------------------------------------------------------- */
const TREASURE_TYPES = {
  small: {
    src: 'images/treasure1.png',
    value: 500,
    pullSpeed: 900,
    hitRadius: 15,
    displayHeight: 34
  },
  medium: {
    src: 'images/stone2.png',
    value: 250,
    pullSpeed: 520,
    hitRadius: 24,
    displayHeight: 58
  },
  large: {
    src: 'images/stone1.png',
    value: 100,
    pullSpeed: 220,
    hitRadius: 36,
    displayHeight: 84
  }
};

/* -------------------------------------------------------------------------
 *  六、第一关宝藏分布（共 16 个，三层空间布局）
 *  只改下面每条的 x / y 即可移动宝藏；grade 决定分值、回收速度与大小
 *    上层（y 200~340）：6 个大型宝藏，挡住上面、分值最低
 *    中层（y 445~555）：6 个中型宝藏，分值中等
 *    底层（y 690~760）：4 个小型宝藏，最深处、分值最高
 * ---------------------------------------------------------------------- */
const LEVEL_1 = {
  name: 'Chapter 1 · Mine Entrance',
  treasures: [
    // ---- 上层：大型宝藏（分值最低 / 回收最沉）----
    { grade: 'large',  x: 150, y: 210 },
    { grade: 'large',  x: 450, y: 210 },
    { grade: 'large',  x:  75, y: 330 },
    { grade: 'large',  x: 225, y: 330 },
    { grade: 'large',  x: 375, y: 330 },
    { grade: 'large',  x: 525, y: 330 },

    // ---- 中层：中型宝藏（分值中等 / 回收适中）----
    { grade: 'medium', x: 110, y: 445 },
    { grade: 'medium', x: 300, y: 445 },
    { grade: 'medium', x: 490, y: 445 },
    { grade: 'medium', x:  70, y: 555 },
    { grade: 'medium', x: 260, y: 555 },
    { grade: 'medium', x: 450, y: 555 },

    // ---- 底层：小型宝藏（分值最高 / 回收最快）----
    { grade: 'small',  x: 100, y: 700 },
    { grade: 'small',  x: 270, y: 720 },
    { grade: 'small',  x: 430, y: 695 },
    { grade: 'small',  x: 540, y: 745 }
  ]
};

/* -------------------------------------------------------------------------
 *  七、计时与运行时资源表（一般不需要改）
 * ---------------------------------------------------------------------- */
const TIME_LIMIT = 60;    // 本关限时（秒）
const TIME_WARNING = 10;  // 剩余时间进入警戒的阈值（秒），HUD 变红

/** 所有需要预加载的切图 */
const ART_SOURCES = {
  pickaxe: PICKAXE_ART.src,
  small: TREASURE_TYPES.small.src,
  medium: TREASURE_TYPES.medium.src,
  large: TREASURE_TYPES.large.src
};

/** 已加载完成的图片：key -> HTMLImageElement */
const ART = { pickaxe: null, small: null, medium: null, large: null };

/** 图片加载失败时的占位色（保证任何情况下都不会出现空白） */
const TREASURE_FALLBACK = {
  small: '#ffd451',
  medium: '#53d3c6',
  large: '#a58cf6'
};

/* =========================================================================
 *  ▍第二部分：游戏状态与核心常量
 * ========================================================================= */

const DEG = Math.PI / 180;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startScreenEl = document.getElementById('startScreen');
const overScreenEl = document.getElementById('overScreen');
const startBtnEl = document.getElementById('startBtn');
const againBtnEl = document.getElementById('againBtn');
const finalScoreEl = document.getElementById('finalScore');

const game = {
  state: 'start',                       // 界面状态：'start' | 'playing' | 'over'
  timeLeft: TIME_LIMIT,                 // 剩余时间（秒）
  mode: 'swing',                        // 'swing' | 'extend' | 'retract'
  angle: -ROPE.angleLimit * DEG,        // 绳子与竖直方向夹角（弧度）
  dir: 1,                               // 摆动方向：1 向右，-1 向左
  length: ROPE.minLength,               // 当前绳长
  retractSpeed: ROPE.idleRetractSpeed,  // 当前收回速度
  carrying: null,                       // 当前抓到的宝藏
  score: 0,
  treasures: [],
  popups: []
};

function resetLevel() {
  game.mode = 'swing';
  game.angle = -ROPE.angleLimit * DEG;
  game.dir = 1;
  game.length = ROPE.minLength;
  game.retractSpeed = ROPE.idleRetractSpeed;
  game.carrying = null;
  game.score = 0;
  game.popups = [];
  game.treasures = LEVEL_1.treasures.map(function (t) {
    const type = TREASURE_TYPES[t.grade] || TREASURE_TYPES.small;
    return {
      grade: t.grade,
      x: t.x,
      y: t.y,
      hitRadius: type.hitRadius,
      value: type.value,
      pullSpeed: type.pullSpeed,
      grabbed: false
    };
  });
}

/* =========================================================================
 *  ▍界面状态切换：开始界面 -> 游戏 -> 结算界面 -> 重新开始
 * ========================================================================= */

function startGame() {
  resetLevel();
  game.timeLeft = TIME_LIMIT;
  game.state = 'playing';

  startScreenEl.classList.add('is-hidden');
  overScreenEl.classList.add('is-hidden');

  startBtnEl.blur();
  againBtnEl.blur();
}

function endGame() {
  game.state = 'over';
  game.timeLeft = 0;

  if (finalScoreEl) finalScoreEl.textContent = String(game.score);
  overScreenEl.classList.remove('is-hidden');
}


/* =========================================================================
 *  ▍第三部分：物理 / 状态更新
 * ========================================================================= */

function getTip() {
  return {
    x: ANCHOR.x + Math.sin(game.angle) * game.length,
    y: ANCHOR.y + Math.cos(game.angle) * game.length
  };
}

function launch() {
  if (game.state !== 'playing') return;
  if (game.mode !== 'swing') return;
  game.mode = 'extend';
  game.length = ROPE.minLength;
  game.retractSpeed = ROPE.idleRetractSpeed;
}

function findTreasureAt(x, y) {
  for (let i = 0; i < game.treasures.length; i++) {
    const t = game.treasures[i];
    if (t.grabbed) continue;
    const dx = t.x - x;
    const dy = t.y - y;
    const reach = t.hitRadius + HOOK.hitRadius;
    if (dx * dx + dy * dy <= reach * reach) return t;
  }
  return null;
}

function grabTreasure(treasure) {
  treasure.grabbed = true;
  game.carrying = treasure;
  game.mode = 'retract';
  game.retractSpeed = treasure.pullSpeed;
  const tip = getTip();
  treasure.x = tip.x;
  treasure.y = tip.y;
}

function collectTreasure() {
  const t = game.carrying;
  game.carrying = null;
  if (!t) return;

  game.score += t.value;

  const idx = game.treasures.indexOf(t);
  if (idx !== -1) game.treasures.splice(idx, 1);

  game.popups.push({
    x: ANCHOR.x,
    y: ANCHOR.y + 26,
    text: '+' + t.value,
    life: 0.9,
    maxLife: 0.9
  });
}

function update(dt) {
  // 只有正式游戏中才推进倒计时与抓取物理
  if (game.state !== 'playing') return;

  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    endGame();
    return;
  }

  if (game.mode === 'swing') {
    const limit = ROPE.angleLimit * DEG;
    game.angle += game.dir * ROPE.swingSpeed * DEG * dt;
    if (game.angle >= limit) {
      game.angle = limit;
      game.dir = -1;
    } else if (game.angle <= -limit) {
      game.angle = -limit;
      game.dir = 1;
    }
  } else if (game.mode === 'extend') {
    // 分步推进，避免高速穿透小型宝藏
    let rest = ROPE.extendSpeed * dt;
    while (rest > 0 && game.mode === 'extend') {
      const step = Math.min(rest, 8);
      rest -= step;
      game.length += step;

      const tip = getTip();
      const hit = findTreasureAt(tip.x, tip.y);
      if (hit) {
        grabTreasure(hit);
        break;
      }

      const outOfBounds =
        tip.x <= 0 ||
        tip.x >= VIEW.width ||
        tip.y >= VIEW.height ||
        game.length >= ROPE.maxLength;

      if (outOfBounds) {
        game.mode = 'retract';
        game.retractSpeed = ROPE.idleRetractSpeed;
        break;
      }
    }
  } else if (game.mode === 'retract') {
    game.length -= game.retractSpeed * dt;

    if (game.carrying) {
      const tip = getTip();
      game.carrying.x = tip.x;
      game.carrying.y = tip.y;
    }

    if (game.length <= ROPE.minLength) {
      game.length = ROPE.minLength;
      if (game.carrying) collectTreasure();
      game.mode = 'swing';
    }
  }

  for (let i = game.popups.length - 1; i >= 0; i--) {
    const p = game.popups[i];
    p.life -= dt;
    p.y -= 46 * dt;
    if (p.life <= 0) game.popups.splice(i, 1);
  }
}

/* =========================================================================
 *  ▍第四部分：绘制
 * ========================================================================= */

function roundRect(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + w - radius, y);
  context.arcTo(x + w, y, x + w, y + radius, radius);
  context.lineTo(x + w, y + h - radius);
  context.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  context.lineTo(x + radius, y + h);
  context.arcTo(x, y + h, x, y + h - radius, radius);
  context.lineTo(x, y + radius);
  context.arcTo(x, y, x + radius, y, radius);
  context.closePath();
}

function drawBackground() {
  // 背景图（bg2.png）由 CSS 铺在 canvas 上，这里只补一层暗角增强层次
  const vignette = ctx.createRadialGradient(
    VIEW.width / 2, VIEW.height * 0.44, VIEW.height * 0.16,
    VIEW.width / 2, VIEW.height * 0.5, VIEW.height * 0.74
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

/** 矿镐切图的运行时几何：以镐柄末端为绳头，以镐头中心为抓取点 */
function getPickaxeMetrics() {
  const img = ART.pickaxe;
  if (!img) return null;

  const dw = PICKAXE_ART.width;
  const dh = PICKAXE_ART.height;
  const buttX = PICKAXE_ART.buttX * dw;
  const buttY = PICKAXE_ART.buttY * dh;
  const headX = PICKAXE_ART.headX * dw;
  const headY = PICKAXE_ART.headY * dh;
  const dx = headX - buttX;
  const dy = headY - buttY;

  return {
    img: img,
    width: dw,
    height: dh,
    buttX: buttX,
    buttY: buttY,
    headDist: Math.sqrt(dx * dx + dy * dy),
    headAngle: Math.atan2(dy, dx)
  };
}

/** 绳头位置：抓取点沿绳子方向回退「镐柄末端 -> 镐头」的距离 */
function getRopeEnd(tip, metrics) {
  const m = metrics || getPickaxeMetrics();
  if (!m) return { x: tip.x, y: tip.y };
  return {
    x: tip.x - Math.sin(game.angle) * m.headDist,
    y: tip.y - Math.cos(game.angle) * m.headDist
  };
}

function drawTreasure(t) {
  const type = TREASURE_TYPES[t.grade] || TREASURE_TYPES.small;
  const img = ART[t.grade] || null;
  const h = type.displayHeight;
  const w = img ? h * (img.width / img.height) : h;

  // 静置时的柔和投影（被抓起后取消）
  if (t !== game.carrying) {
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + h * 0.44, w * 0.34, h * 0.09, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
  }

  if (img) {
    ctx.drawImage(img, t.x - w / 2, t.y - h / 2, w, h);
  } else {
    // 图片尚未就绪 / 加载失败时的兜底占位，避免出现空白
    ctx.beginPath();
    ctx.arc(t.x, t.y, h * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = TREASURE_FALLBACK[t.grade] || '#ffd451';
    ctx.fill();
  }
}

function drawTreasures() {
  for (let i = 0; i < game.treasures.length; i++) {
    const t = game.treasures[i];
    if (t === game.carrying) continue;
    drawTreasure(t);
  }
}

function drawAnchorBeam() {
  // 顶部吊装滑轮：贴合背景洞顶的悬挂电缆
  const cx = ANCHOR.x;
  const cy = ANCHOR.y - 10;

  ctx.save();
  ctx.lineCap = 'round';

  // 吊臂
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy - 16);
  ctx.lineTo(cx + 34, cy - 16);
  ctx.strokeStyle = 'rgba(6, 9, 14, 0.85)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(104, 122, 148, 0.9)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // 滑轮
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#2b3441';
  ctx.fill();
  ctx.strokeStyle = '#93a1b8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = '#d5deea';
  ctx.fill();

  ctx.restore();
}

function drawRope(tip) {
  const end = getRopeEnd(tip);

  ctx.save();
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(ANCHOR.x, ANCHOR.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = ROPE.width + 1.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ANCHOR.x, ANCHOR.y);
  ctx.lineTo(end.x, end.y);
  const ropeGrad = ctx.createLinearGradient(ANCHOR.x, ANCHOR.y, end.x, end.y);
  ropeGrad.addColorStop(0, '#a5763f');
  ropeGrad.addColorStop(1, '#7a5326');
  ctx.strokeStyle = ropeGrad;
  ctx.lineWidth = ROPE.width;
  ctx.stroke();

  // 绳索高光
  ctx.beginPath();
  ctx.moveTo(ANCHOR.x - 0.6, ANCHOR.y);
  ctx.lineTo(end.x - 0.6, end.y);
  ctx.strokeStyle = 'rgba(255, 214, 150, 0.28)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.restore();
}

function drawPickaxe(tip) {
  const m = getPickaxeMetrics();
  const dirX = Math.sin(game.angle);
  const dirY = Math.cos(game.angle);

  // 发射 / 收回时抓取点微光，提示有效判定范围
  if (game.mode !== 'swing') {
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, HOOK.hitRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 214, 140, 0.12)';
    ctx.fill();
  }

  if (!m) return;

  const buttX = tip.x - dirX * m.headDist;
  const buttY = tip.y - dirY * m.headDist;
  // 让「镐柄末端 -> 镐头」的方向对齐绳子方向
  const rotation = Math.atan2(dirY, dirX) - m.headAngle;

  ctx.save();
  ctx.translate(buttX, buttY);
  ctx.rotate(rotation);
  ctx.drawImage(m.img, -m.buttX, -m.buttY, m.width, m.height);
  ctx.restore();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
}

function drawHUD() {
  const boxX = 22;
  const boxY = 22;
  const boxW = 216;
  const boxH = 88;
  const padX = 20;
  const urgent = game.timeLeft <= TIME_WARNING;

  ctx.save();
  ctx.textBaseline = 'middle';

  // HUD 面板
  roundRect(ctx, boxX, boxY, boxW, boxH, 14);
  ctx.fillStyle = 'rgba(9, 14, 23, 0.7)';
  ctx.fill();
  ctx.strokeStyle = urgent ? 'rgba(255, 120, 100, 0.55)' : 'rgba(255, 206, 120, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- TIME 行 ----
  ctx.textAlign = 'left';
  ctx.font = '600 13px "PingFang SC", "Helvetica Neue", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(159, 176, 200, 0.95)';
  ctx.fillText('TIME', boxX + padX, boxY + 30);

  ctx.textAlign = 'right';
  ctx.font = '700 26px "PingFang SC", "Helvetica Neue", system-ui, sans-serif';
  ctx.fillStyle = urgent ? '#ff8371' : '#ffd98a';
  ctx.fillText(formatTime(game.timeLeft), boxX + boxW - padX, boxY + 30);

  // 分隔线
  ctx.beginPath();
  ctx.moveTo(boxX + padX, boxY + 46);
  ctx.lineTo(boxX + boxW - padX, boxY + 46);
  ctx.strokeStyle = 'rgba(255, 214, 140, 0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ---- SCORE 行 ----
  ctx.textAlign = 'left';
  ctx.font = '600 13px "PingFang SC", "Helvetica Neue", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(159, 176, 200, 0.95)';
  ctx.fillText('SCORE', boxX + padX, boxY + 66);

  ctx.textAlign = 'right';
  ctx.font = '700 26px "PingFang SC", "Helvetica Neue", system-ui, sans-serif';
  ctx.fillStyle = '#f4f8ff';
  ctx.fillText(String(game.score), boxX + boxW - padX, boxY + 66);

  // ---- 右上角关卡信息 ----
  ctx.textAlign = 'right';
  ctx.font = '600 15px "PingFang SC", "Helvetica Neue", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(198, 214, 235, 0.72)';
  ctx.fillText(LEVEL_1.name, VIEW.width - 28, 44);

  // ---- 右上角操作提示（整局常驻，进入结算页后随 HUD 一起隐藏）----
  ctx.font = '500 12px "PingFang SC", "Helvetica Neue", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(178, 194, 216, 0.82)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 5;
  ctx.fillText('Click / Tap / Space to launch the pickaxe', VIEW.width - 28, 70);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawPopups() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 26px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';

  for (let i = 0; i < game.popups.length; i++) {
    const p = game.popups[i];
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd98a';
    ctx.fillText(p.text, p.x, p.y);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);

  drawBackground();
  drawTreasures();

  const tip = getTip();

  drawAnchorBeam();
  drawRope(tip);
  drawPickaxe(tip);

  // 已抓取的宝藏绘制在矿镐之上
  if (game.carrying) drawTreasure(game.carrying);

  // HUD 与飘字仅在游戏进行中显示，避免与开始 / 结算界面叠加
  if (game.state === 'playing') {
    drawHUD();
    drawPopups();
  }
}

/* =========================================================================
 *  ▍第五部分：画布自适应与主循环
 * ========================================================================= */

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(VIEW.width * dpr);
  canvas.height = Math.round(VIEW.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

let lastTime = 0;

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (dt > 0.05) dt = 0.05;

  update(dt);
  render();

  window.requestAnimationFrame(loop);
}

/* =========================================================================
 *  ▍第六部分：输入绑定
 * ========================================================================= */

/** 预加载全部切图，全部成功或失败后再回调（保证渲染前图片就绪） */
function preloadArt(done) {
  const keys = Object.keys(ART_SOURCES);
  let pending = keys.length;

  if (pending === 0) {
    if (done) done();
    return;
  }

  function settle() {
    pending -= 1;
    if (pending === 0 && done) done();
  }

  keys.forEach(function (key) {
    const img = new Image();
    img.onload = function () {
      ART[key] = img;
      settle();
    };
    img.onerror = function () {
      console.warn('[art] failed to load: ' + ART_SOURCES[key]);
      settle();
    };
    img.src = ART_SOURCES[key];
  });
}

function bindInput() {
  if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      launch();
    });
  } else {
    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      launch();
    }, { passive: false });
    canvas.addEventListener('mousedown', function (e) {
      e.preventDefault();
      launch();
    });
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      launch();
    }
  });

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);

  // 开始 / 重新开始按钮
  startBtnEl.addEventListener('click', startGame);
  againBtnEl.addEventListener('click', startGame);

  // 切到后台时避免 dt 累积
  document.addEventListener('visibilitychange', function () {
    lastTime = 0;
  });
}

/* =========================================================================
 *  ▍第七部分：启动
 * ========================================================================= */

startBtnEl.disabled = true;
preloadArt(function () {
  startBtnEl.disabled = false;
});

resizeCanvas();
resetLevel();
bindInput();
window.requestAnimationFrame(loop);
