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
 *  四、小偷巡逻配置（仅在第二关、第三关出现，轨道配置见各关 thieves 数组）
 *  src              : 切图路径
 *  y                : 默认巡逻高度（各关可用 thieves[i].y 单独覆盖）
 *  width / height   : 绘制宽高（像素）
 *  speed            : 左右往返巡逻速度（像素 / 秒）
 *  hitRadius        : 碰撞半径（与矿镐半径相加做圆碰撞）
 *  pullSpeed        : 被抓后拉回速度（像素 / 秒）
 *  penalty          : 被抓回顶部后扣除的分数
 *  penaltyTextLife  : 扣分飘字总时长（秒）
 *  penaltyTextFade  : 扣分飘字末尾淡出时长（秒）
 *  penaltyTextRise  : 扣分飘字每秒上浮像素
 * ---------------------------------------------------------------------- */
const THIEF = {
  src: 'images/thief.png',
  y: 350,
  width: 30,
  height: 38,
  speed: 150,
  hitRadius: 18,
  pullSpeed: 620,
  penalty: 500,
  penaltyTextLife: 2.8,
  penaltyTextFade: 0.8,
  penaltyTextRise: 26
};

/* -------------------------------------------------------------------------
 *  五、五种宝藏的基础属性
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
    value: 100,
    pullSpeed: 520,
    hitRadius: 24,
    displayHeight: 58
  },
  large: {
    src: 'images/stone1.png',
    value: 50,
    pullSpeed: 110,
    hitRadius: 36,
    displayHeight: 84
  },
  huge: {
    src: 'images/treasure2.png',
    value: 1000,
    pullSpeed: 160,
    hitRadius: 39,
    displayHeight: 60
  },
  ultimate: {
    src: 'images/treasure3.png',
    value: 3000,
    pullSpeed: 420,
    hitRadius: 16,
    displayHeight: 36
  }
};

/* -------------------------------------------------------------------------
 *  七、关卡数据
 *  name      : 右上角 HUD 显示的关卡名
 *  timeLimit : 本关限时（秒）
 *  target    : 本关通关目标分值（累计总分 >= target 视为通关）
 *  thief     : 小偷轨道数组（不写该字段则不出现小偷，第一关就没有）
 *  treasures : 宝藏列表，只改 x / y 即可移动宝藏
 * ---------------------------------------------------------------------- */

/* ===== 第一关：18 个宝藏（8 大 + 6 中 + 4 小），目标 1,000 分 ===== */
const LEVEL_1 = {
  name: 'Chapter 1 - Target: 1,000',
  timeLimit: 60,
  target: 1000,
  treasures: [
    // ---- 上半区：大型宝藏 ×8（分值最低 / 回收最沉）----
    { grade: 'large',  x:  85, y: 345 },
    { grade: 'large',  x: 225, y: 400 },
    { grade: 'large',  x: 365, y: 400 },
    { grade: 'large',  x: 505, y: 345 },
    { grade: 'large',  x: 125, y: 500 },
    { grade: 'large',  x: 295, y: 600 },
    { grade: 'large',  x: 435, y: 550 },
    { grade: 'large',  x: 545, y: 465 },

    // ---- 中层：中型宝藏 ×6（分值 200 / 回收适中）----
    { grade: 'medium', x: 150, y: 590 },
    { grade: 'medium', x: 300, y: 475 },
    { grade: 'medium', x: 500, y: 590 },
    { grade: 'medium', x:  70, y: 420 },
    { grade: 'medium', x: 260, y: 710 },
    { grade: 'medium', x: 450, y: 710 },

    // ---- 底层：小型宝藏 ×4（分值最高 / 回收最快）----
    { grade: 'small',  x: 220, y: 490 },
    { grade: 'small',  x: 230, y: 670 },
    { grade: 'small',  x: 400, y: 675 },
    { grade: 'small',  x: 435, y: 440 }
  ]
};

/* ===== 第二关：16 个宝藏（10 大 + 4 小 + 2 特大），目标 3,000 分 ===== */
const LEVEL_2 = {
  name: 'Chapter 2 - Target: 3,000',
  timeLimit: 60,
  target: 3000,
  // ---- 小偷轨道：y = 轨道高度，dir: 1 从左侧边缘向右，-1 从右侧边缘向左 ----
  thieves: [
    { y: 350, dir: 1 },
    { y: 350, dir: -1 }
  ],
  treasures: [
    // ---- 大型石头 ×10：穿插占据偏上与中部（主要障碍）----
    { grade: 'large', x: 120, y: 290 },
    { grade: 'large', x: 240, y: 320 },
    { grade: 'large', x: 360, y: 320 },
    { grade: 'large', x: 480, y: 290 },
    { grade: 'large', x:  90, y: 450 },
    { grade: 'large', x: 210, y: 480 },
    { grade: 'large', x: 390, y: 480 },
    { grade: 'large', x: 510, y: 450 },
    { grade: 'large', x: 150, y: 600 },
    { grade: 'large', x: 450, y: 600 },

    // ---- 小型宝藏 ×4：藏在大型石头的缝隙里（高分）----
    { grade: 'small', x: 300, y: 395 },
    { grade: 'small', x: 150, y: 500 },
    { grade: 'small', x: 450, y: 500 },
    { grade: 'small', x: 300, y: 585 },

    // ---- 特大型宝藏 ×2（treasure2）：地图最底部最深处，高价值重物 ----
    { grade: 'huge',  x: 150, y: 730 },
    { grade: 'huge',  x: 450, y: 730 }
  ]
};

/* ===== 第三关：25 个宝藏（10 大 + 8 中 + 6 小 + 1 终极），目标 5,000 分 ===== */
const LEVEL_3 = {
  name: 'Chapter 3 - Target: 5,000',
  timeLimit: 60,
  target: 8000,
  // ---- 小偷轨道：中层 y=350 两个，深层 y=550 两个，对向巡逻 ----
  thieves: [
    { y: 350, dir: 1 },
    { y: 350, dir: -1 },
    { y: 550, dir: 1 },
    { y: 550, dir: -1 }
  ],
  treasures: [
    // ---- 大石障碍 ×10：均匀铺在中上层 ----
    { grade: 'large',  x: 110, y: 220 },
    { grade: 'large',  x: 300, y: 230 },
    { grade: 'large',  x: 490, y: 220 },
    { grade: 'large',  x: 200, y: 340 },
    { grade: 'large',  x: 400, y: 340 },
    { grade: 'large',  x: 110, y: 460 },
    { grade: 'large',  x: 300, y: 460 },
    { grade: 'large',  x: 490, y: 460 },
    { grade: 'large',  x: 200, y: 580 },
    { grade: 'large',  x: 400, y: 580 },

    // ---- 中型宝藏 ×8：夹在大石缝隙中 ----
    { grade: 'medium', x: 200, y: 220 },
    { grade: 'medium', x: 400, y: 220 },
    { grade: 'medium', x: 110, y: 340 },
    { grade: 'medium', x: 300, y: 340 },
    { grade: 'medium', x: 490, y: 340 },
    { grade: 'medium', x: 200, y: 460 },
    { grade: 'medium', x: 400, y: 460 },
    { grade: 'medium', x: 300, y: 580 },

    // ---- 小型宝藏 ×6：藏在石阵深处的狭窄通道 ----
    { grade: 'small',  x: 110, y: 560 },
    { grade: 'small',  x: 490, y: 560 },
    { grade: 'small',  x: 150, y: 675 },
    { grade: 'small',  x: 300, y: 675 },
    { grade: 'small',  x: 450, y: 675 },

    // ---- 终极神秘宝藏 ×1（treasure3）：地图最底部正中央，全场唯一最高价值 ----
    { grade: 'ultimate', x: 300, y: 750 }
  ]
};

/** 关卡列表：索引 0/1/2 = 第一/二/三关 */
const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];

/* -------------------------------------------------------------------------
 *  八、计时警戒与运行时资源表（一般不需要改）
 *  （每关限时请看上面 LEVEL_1 / LEVEL_2 / LEVEL_3 的 timeLimit）
 * ---------------------------------------------------------------------- */
const TIME_WARNING = 10;  // 剩余时间进入警戒的阈值（秒），HUD 变红

/** 所有需要预加载的切图 */
const ART_SOURCES = {
  pickaxe: PICKAXE_ART.src,
  thief: THIEF.src,
  small: TREASURE_TYPES.small.src,
  medium: TREASURE_TYPES.medium.src,
  large: TREASURE_TYPES.large.src,
  huge: TREASURE_TYPES.huge.src,
  ultimate: TREASURE_TYPES.ultimate.src
};

/** 已加载完成的图片：key -> HTMLImageElement */
const ART = {
  pickaxe: null,
  thief: null,
  small: null,
  medium: null,
  large: null,
  huge: null,
  ultimate: null
};

/** 图片加载失败时的占位色（保证任何情况下都不会出现空白） */
const TREASURE_FALLBACK = {
  small: '#ffd451',
  medium: '#53d3c6',
  large: '#a58cf6',
  huge: '#ffb347',
  ultimate: '#ffe066'
};

/* -------------------------------------------------------------------------
 *  九、Discord 集成配置（OAuth2 隐式授权登录 + 通关 Webhook 推送）
 *  DISCORD_CLIENT_ID     : OAuth2 应用 Client ID
 *  DISCORD_REDIRECT_URI  : 授权回调地址（必须与 Discord 后台配置一致）
 *  DISCORD_WEBHOOK_URL   : 通关战报推送的 Webhook
 *  DISCORD_CHANNEL_URL   : 分享成功后的频道跳转地址
 *  DISCORD_SHARE_IMAGE   : 战报卡片图片
 * ---------------------------------------------------------------------- */
const DISCORD_CLIENT_ID = '1569624792594653204';
const DISCORD_REDIRECT_URI = 'https://identity-v-ngp.github.io/mine/';
const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1569621677338402866/7OZ2ajXsABkSAisIM4X0sjLrZxrzoVr8xip15bTrKEUsxRymv3OyM8SbIXPL0wgpK8Fb';
const DISCORD_CHANNEL_URL =
  'https://discord.com/channels/611028792911200256/1569619127012827146';
const DISCORD_SHARE_IMAGE =
  'https://cdn.discordapp.com/attachments/1286509730264776734/1569620630578397254/card.jpg?ex=6af41ea0&is=6af2cd20&hm=7af1b6631d8f479768ed5c671d8707f30c1a9163d3b2de03d4bc86849b6393ec&';

/** 隐式授权地址（response_type=token，无需 client secret） */
const DISCORD_AUTH_URL =
  'https://discord.com/oauth2/authorize?client_id=' + DISCORD_CLIENT_ID +
  '&response_type=token&scope=identify&redirect_uri=' + encodeURIComponent(DISCORD_REDIRECT_URI);

/** 玩家信息缓存 key 与游客兜底身份 */
const PLAYER_STORAGE_KEY = 'ngpMinerPlayer';
const PLAYER_AUTH_FLAG_KEY = 'ngpMinerAuthTried';
const PLAYER_FALLBACK_NAME = 'Adventurer';
const PLAYER_FALLBACK_ID = 'Guest';

/* =========================================================================
 *  ▍第二部分：游戏状态与核心常量
 * ========================================================================= */

const DEG = Math.PI / 180;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startScreenEl = document.getElementById('startScreen');
const overScreenEl = document.getElementById('overScreen');
const startBtnEl = document.getElementById('startBtn');
const retryBtnEl = document.getElementById('retryBtn');
const nextBtnEl = document.getElementById('nextBtn');
const againBtnEl = document.getElementById('againBtn');
const shareBtnEl = document.getElementById('shareBtn');
const overEyebrowEl = document.getElementById('overEyebrow');
const overTitleEl = document.getElementById('overTitle');
const overScoreEl = document.getElementById('overScore');
const overDetailEl = document.getElementById('overDetail');
const overNoteEl = document.getElementById('overNote');
const overPlayerEl = document.getElementById('overPlayer');
const startPlayerEl = document.getElementById('startPlayer');
const channelLinkEl = document.getElementById('channelLink');

const game = {
  state: 'start',                       // 界面状态：'start' | 'playing' | 'over'
  levelIndex: 0,                        // 当前关卡索引：0/1/2 = 第一/二/三关
  level: LEVELS[0],                     // 当前关卡配置对象
  baseScore: 0,                         // 本关开始时的继承分（Try Again 回滚目标）
  chapterScores: [],                    // 各关净得分（终极结算时汇总明细）
  timeLeft: LEVELS[0].timeLimit,        // 剩余时间（秒）
  mode: 'swing',                        // 'swing' | 'extend' | 'retract'
  angle: -ROPE.angleLimit * DEG,        // 绳子与竖直方向夹角（弧度）
  dir: 1,                               // 摆动方向：1 向右，-1 向左
  length: ROPE.minLength,               // 当前绳长
  retractSpeed: ROPE.idleRetractSpeed,  // 当前收回速度
  carrying: null,                       // 当前抓到的宝藏 / 小偷
  thieves: [],                          // 巡逻中的小偷实体数组（该关没有则为空数组）
  score: 0,                             // 当前累计总分（含继承分）
  finalScore: 0,                        // 终极通关时的最终总分（分享战报用）
  treasures: [],
  popups: []
};

/**
 * 按关卡配置生成小偷实体数组
 * - 每条配置 { y, dir }：y 为轨道高度，dir = 1 从左侧边缘向右，-1 从右侧边缘向左
 * - 未配置 thieves 的关卡返回空数组（第一关即无小偷）
 */
function createThieves(level) {
  const tracks = level.thieves || [];
  const halfW = THIEF.width / 2;

  return tracks.map(function (track) {
    const dir = track.dir < 0 ? -1 : 1;
    return {
      x: dir === 1 ? halfW : VIEW.width - halfW,
      y: typeof track.y === 'number' ? track.y : THIEF.y,
      dir: dir
    };
  });
}

function resetLevel(level) {
  game.level = level;
  game.mode = 'swing';
  game.angle = -ROPE.angleLimit * DEG;
  game.dir = 1;
  game.length = ROPE.minLength;
  game.retractSpeed = ROPE.idleRetractSpeed;
  game.carrying = null;
  game.thieves = createThieves(level);
  game.score = game.baseScore;
  game.popups = [];
  game.treasures = level.treasures.map(function (t) {
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
 *  ▍界面状态切换：开始界面 -> 关卡 -> 结算界面 -> 下一关 / 重来
 * ========================================================================= */

function formatNumber(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 分数继承 / 回滚的唯一入口
 *   startGame(idx, baseScore)
 *   - 开始新游戏        : startGame(0, 0)
 *   - 进入下一关        : startGame(idx + 1, game.score)   // 继承当前累计分
 *   - 失败重来本关      : startGame(idx, game.baseScore)   // 回滚到本关起步分
 */
function startGame(levelIndex, baseScore) {
  const idx = Math.max(0, Math.min(Math.round(levelIndex) || 0, LEVELS.length - 1));
  const inherited = typeof baseScore === 'number' && isFinite(baseScore) ? baseScore : 0;

  game.levelIndex = idx;
  game.baseScore = Math.max(0, Math.round(inherited));
  // 从第一关重新开始时，清空历史关卡明细
  if (idx === 0) game.chapterScores = [];

  resetLevel(LEVELS[idx]);
  game.timeLeft = LEVELS[idx].timeLimit;
  game.state = 'playing';

  startScreenEl.classList.add('is-hidden');
  overScreenEl.classList.add('is-hidden');

  startBtnEl.blur();
  retryBtnEl.blur();
  nextBtnEl.blur();
  againBtnEl.blur();
}

/** 按当前关卡与得分，填充并展示对应的结算面板 */
function showResult(opts) {
  overEyebrowEl.textContent = opts.eyebrow;
  overTitleEl.textContent = opts.title;
  overScoreEl.textContent = formatNumber(opts.score);
  overDetailEl.textContent = opts.detail;
  overNoteEl.textContent = opts.note;

  // 玩家身份行只在终极通关页展示
  if (overPlayerEl) overPlayerEl.hidden = !opts.showPlayer;

  retryBtnEl.hidden = !opts.showRetry;
  nextBtnEl.hidden = !opts.showNext;
  againBtnEl.hidden = !opts.showAgain;
  shareBtnEl.hidden = !opts.showShare;

  // 每次弹出结算都把分享按钮重置回初始态
  resetShareButton();

  overScreenEl.classList.remove('is-hidden');
}

/** 汇总所有已完成关卡的成绩 */
function sumChapterScores() {
  let total = 0;
  for (let i = 0; i < game.chapterScores.length; i++) {
    total += game.chapterScores[i] || 0;
  }
  return total;
}

/** 生成 "Ch1 1,200 · Ch2 3,100 · Ch3 5,200" 形式的分关明细 */
function chapterBreakdown() {
  const parts = [];
  for (let i = 0; i < game.chapterScores.length; i++) {
    parts.push('Ch' + (i + 1) + ' ' + formatNumber(game.chapterScores[i] || 0));
  }
  return parts.join(' \u00b7 ');
}

function endGame() {
  game.state = 'over';
  game.timeLeft = 0;

  const level = game.level;
  const idx = game.levelIndex;
  const isFinalChapter = idx === LEVELS.length - 1;
  const passed = game.score >= level.target;
  const chapterLabel = 'Chapter ' + (idx + 1) + ' Complete';

  // 记录本关净得分（用于终极结算的分关明细）
  game.chapterScores[idx] = game.score - game.baseScore;

  // ---- 最后一关：达成目标进入终极结算，否则重来本关 ----
  if (isFinalChapter) {
    if (!passed) {
      showResult({
        eyebrow: chapterLabel,
        title: 'Challenge Failed',
        score: game.score,
        detail:
          'Target ' + formatNumber(level.target) +
          ' \u00b7 Short by ' + formatNumber(level.target - game.score),
        note: 'The final vault is still sealed. Try again for the ' +
          formatNumber(level.target) + ' target.',
        showRetry: true
      });
      return;
    }

    // 终极通关：冻结最终成绩，用于 Webhook 战报推送
    game.finalScore = game.score;

    showResult({
      eyebrow: 'All Chapters Cleared',
      title: 'Victory!',
      score: sumChapterScores(),
      detail: chapterBreakdown(),
      note: 'Take a screenshot and share your success through the button below.',
      showShare: true,
      showAgain: true,
      showPlayer: true
    });
    return;
  }

  // ---- 前两关：达成目标进入下一关，否则重来本关 ----
  if (passed) {
    showResult({
      eyebrow: chapterLabel,
      title: 'Target Cleared!',
      score: game.score,
      detail: 'Target ' + formatNumber(level.target) + ' \u00b7 Reached',
      note: 'Chapter ' + (idx + 2) + ' awaits. Keep mining.',
      showNext: true
    });
  } else {
    showResult({
      eyebrow: chapterLabel,
      title: 'Challenge Failed',
      score: game.score,
      detail:
        'Target ' + formatNumber(level.target) +
        ' \u00b7 Short by ' + formatNumber(level.target - game.score),
      note: 'Mine faster and go for the deep high-value treasures to reach the target.',
      showRetry: true
    });
  }
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

/**
 * 抓取第 index 个小偷：实体立即从巡逻数组中移除（地图上立刻消失），
 * 转由 game.carrying 接管随钩子一起向上拉取
 */
function grabThief(index) {
  const t = game.thieves[index];
  if (!t) return;

  game.carrying = {
    isThief: true,
    x: t.x,
    y: t.y,
    dir: t.dir,
    pullSpeed: THIEF.pullSpeed
  };
  game.thieves.splice(index, 1);
  game.mode = 'retract';
  game.retractSpeed = THIEF.pullSpeed;
}

function collectTreasure() {
  const t = game.carrying;
  game.carrying = null;
  if (!t) return;

  // ---- 小偷：扣分 + 红色警示飘字（不会重新刷新，抓掉一个少一个）----
  if (t.isThief) {
    game.score = Math.max(0, game.score - THIEF.penalty);
    game.popups.push({
      x: VIEW.width / 2,
      y: 300,
      text: 'Thief stole ' + THIEF.penalty + ' pts!',
      life: THIEF.penaltyTextLife,
      maxLife: THIEF.penaltyTextLife,
      fade: THIEF.penaltyTextFade,
      rise: THIEF.penaltyTextRise,
      color: '#ff6b5e',
      size: 34
    });
    return;
  }

  // ---- 普通宝藏：加分 + 金色飘字 ----
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

/** 小偷巡逻：每个实体在自己轨道上左右匀速往返，仅在游戏进行中推进 */
function updateThieves(dt) {
  const halfW = THIEF.width / 2;

  for (let i = 0; i < game.thieves.length; i++) {
    const t = game.thieves[i];
    t.x += t.dir * THIEF.speed * dt;

    if (t.x <= halfW) {
      t.x = halfW;
      t.dir = 1;
    } else if (t.x >= VIEW.width - halfW) {
      t.x = VIEW.width - halfW;
      t.dir = -1;
    }
  }
}

/** 矿镐是否命中某个巡逻小偷；命中即抓走并从巡逻数组移除 */
function tryGrabThief(x, y) {
  const reach = THIEF.hitRadius + HOOK.hitRadius;

  for (let i = 0; i < game.thieves.length; i++) {
    const t = game.thieves[i];
    const dx = t.x - x;
    const dy = t.y - y;
    if (dx * dx + dy * dy <= reach * reach) {
      grabThief(i);
      return true;
    }
  }
  return false;
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

      // 巡逻中的小偷优先判定（它会挡住后方的宝藏）
      if (tryGrabThief(tip.x, tip.y)) break;

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

  // 小偷巡逻（暂停 / 结算时 update 提前 return，因此自动停止移动）
  updateThieves(dt);

  for (let i = game.popups.length - 1; i >= 0; i--) {
    const p = game.popups[i];
    p.life -= dt;
    p.y -= (p.rise || 46) * dt;
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

/** 绘制小偷（dir 用于左右翻转朝向） */
function drawThiefAt(x, y, dir) {
  const img = ART.thief;
  const w = THIEF.width;
  const h = THIEF.height;

  ctx.save();
  ctx.translate(x, y);

  // 小偷脚下的一点阴影，增加立体感
  ctx.beginPath();
  ctx.ellipse(0, h * 0.46, w * 0.42, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.fill();

  // 切图默认朝向左侧，向右巡逻时水平翻转，保证朝向与移动方向一致
  ctx.scale(dir > 0 ? -1 : 1, 1);
  if (img) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#e05c5c';
    ctx.fill();
  }

  ctx.restore();
}

/** 绘制全部巡逻中的小偷 */
function drawThieves() {
  for (let i = 0; i < game.thieves.length; i++) {
    const t = game.thieves[i];
    drawThiefAt(t.x, t.y, t.dir);
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
  ctx.fillText(game.level.name, VIEW.width - 28, 44);

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

  for (let i = 0; i < game.popups.length; i++) {
    const p = game.popups[i];
    // fade 存在时：先保持满不透明，最后 fade 秒内平滑淡出
    const alpha = Math.max(0, Math.min(1, p.life / (p.fade || p.maxLife)));
    ctx.globalAlpha = alpha;
    ctx.font = '700 ' + (p.size || 26) + 'px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    ctx.fillStyle = p.color || '#ffd98a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(p.text, p.x, p.y);
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);

  drawBackground();
  drawTreasures();
  drawThieves();

  const tip = getTip();

  drawAnchorBeam();
  drawRope(tip);
  drawPickaxe(tip);

  // 已抓取的宝藏 / 小偷绘制在矿镐之上
  if (game.carrying) {
    if (game.carrying.isThief) {
      drawThiefAt(game.carrying.x, game.carrying.y, game.carrying.dir || 1);
    } else {
      drawTreasure(game.carrying);
    }
  }

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

  // 开始 / 重打本关 / 下一关 / 从头再来（分数继承与回滚都在 startGame 里统一处理）
  startBtnEl.addEventListener('click', function () { startGame(0, 0); });
  retryBtnEl.addEventListener('click', function () { startGame(game.levelIndex, game.baseScore); });
  nextBtnEl.addEventListener('click', function () { startGame(game.levelIndex + 1, game.score); });
  againBtnEl.addEventListener('click', function () { startGame(0, 0); });

  // 终极通关：推送 Discord Webhook 战报
  shareBtnEl.addEventListener('click', shareToDiscord);

  // 切到后台时避免 dt 累积
  document.addEventListener('visibilitychange', function () {
    lastTime = 0;
  });
}

/* =========================================================================
 *  ▍第七部分：Discord 身份（OAuth2 隐式授权）与通关战报分享
 * ========================================================================= */

/** 当前玩家身份（默认游客兜底，任何情况下都能离线游玩） */
const player = {
  id: null,
  username: PLAYER_FALLBACK_NAME,
  authenticated: false
};

/** 读取 sessionStorage 中已缓存的玩家信息 */
function readCachedPlayer() {
  try {
    const raw = window.sessionStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.id) return null;
    return {
      id: String(data.id),
      username: data.username || PLAYER_FALLBACK_NAME
    };
  } catch (e) {
    return null;
  }
}

function saveCachedPlayer(data) {
  try {
    window.sessionStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // 隐私模式 / 存储被禁用时忽略即可，不影响游戏
  }
}

/** 解析 location.hash 中的 access_token 或 error（隐式授权回跳） */
function readHashAuth() {
  const result = { token: null, error: null };
  const hash = window.location.hash || '';
  if (hash.length < 2) return result;

  const pairs = hash.substring(1).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const eq = pairs[i].indexOf('=');
    if (eq === -1) continue;
    const key = pairs[i].substring(0, eq);
    const value = decodeURIComponent(pairs[i].substring(eq + 1));
    if (key === 'access_token') result.token = value;
    else if (key === 'error') result.error = value;
  }
  return result;
}

/** 清掉地址栏里的 #access_token=... 碎片 */
function cleanUrlHash() {
  try {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  } catch (e) {
    // 忽略
  }
}

/** 用 access_token 换取玩家资料：GET https://discord.com/api/users/@me */
async function fetchDiscordUser(accessToken) {
  try {
    const res = await fetch('https://discord.com/api/users/@me', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    if (!res.ok) {
      console.warn('[discord] user profile request failed:', res.status);
      return null;
    }
    const data = await res.json();
    if (!data || !data.id) return null;
    return {
      id: String(data.id),
      username: data.global_name || data.username || PLAYER_FALLBACK_NAME
    };
  } catch (e) {
    console.warn('[discord] user profile request error:', e);
    return null;
  }
}

/** 刷新开始界面与通关页的身份文案 */
function renderPlayerLabels() {
  const idText = player.id || PLAYER_FALLBACK_ID;
  if (startPlayerEl) {
    startPlayerEl.textContent = 'Miner: ' + player.username + ' (ID: ' + idText + ')';
  }
  if (overPlayerEl) {
    overPlayerEl.textContent = 'Player: ' + player.username + ' | ID: ' + idText;
  }
}

/** 应用玩家身份；失败时传 null 即回退游客 */
function applyPlayer(data) {
  const valid = !!(data && data.id);
  player.id = valid ? String(data.id) : null;
  player.username = valid && data.username ? data.username : PLAYER_FALLBACK_NAME;
  player.authenticated = valid;
  renderPlayerLabels();
}

/** 仅在部署域名下自动跳授权，避免本地 file:// / localhost 反复跳转 */
function canAutoAuthorize() {
  try {
    const target = new URL(DISCORD_REDIRECT_URI);
    return window.location.protocol === target.protocol && window.location.host === target.host;
  } catch (e) {
    return false;
  }
}

function redirectToDiscordAuth() {
  try {
    window.sessionStorage.setItem(PLAYER_AUTH_FLAG_KEY, '1');
  } catch (e) {
    // 忽略
  }
  window.location.href = DISCORD_AUTH_URL;
}

/**
 * 启动流程：缓存 -> hash 中的 token -> 自动跳授权 -> 游客兜底
 */
async function initDiscordAuth() {
  const cached = readCachedPlayer();
  if (cached) {
    applyPlayer(cached);
    return;
  }

  const auth = readHashAuth();

  if (auth.token) {
    cleanUrlHash();
    const user = await fetchDiscordUser(auth.token);
    if (user) {
      saveCachedPlayer(user);
      applyPlayer(user);
    } else {
      applyPlayer(null);
    }
    return;
  }

  if (auth.error) cleanUrlHash();

  let alreadyTried = false;
  try {
    alreadyTried = window.sessionStorage.getItem(PLAYER_AUTH_FLAG_KEY) === '1';
  } catch (e) {
    alreadyTried = false;
  }

  if (!auth.error && !alreadyTried && canAutoAuthorize()) {
    redirectToDiscordAuth();
    return;
  }

  applyPlayer(null);
}

/* ------------------------- 通关战报分享 ------------------------- */

function resetShareButton() {
  if (!shareBtnEl) return;
  shareBtnEl.disabled = false;
  shareBtnEl.textContent = 'Share to Discord';
  if (channelLinkEl) channelLinkEl.hidden = true;
}

/** 构造 Discord Rich Embed 战报 payload */
function buildSharePayload(totalScore) {
  const mention = player.id ? '<@' + player.id + '>' : player.username;
  const content = player.id
    ? mention +
      ' Congratulations! You have successfully conquered all chapters of Gold Miner! Total treasure secured! 🏆'
    : 'Congratulations Adventurer! You have conquered all chapters of Gold Miner! 🏆';

  return {
    content: content,
    embeds: [
      {
        title: '🏆 Gold Miner: Ultimate Victory',
        description:
          '**Player:** ' + mention + '\n' +
          '**Total Score:** ' + formatNumber(totalScore) + ' pts\n' +
          '**Status:** Certified Master Miner ⛏️',
        color: 0xFFD700,
        image: { url: DISCORD_SHARE_IMAGE },
        footer: { text: 'Gold Miner Challenge | Discord Community' },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/** 点击 Share to Discord：POST 到 Webhook，并处理中 / 成功 / 失败三态 */
async function shareToDiscord() {
  if (!shareBtnEl || shareBtnEl.disabled) return;

  const totalScore = game.finalScore || game.score;

  shareBtnEl.disabled = true;
  shareBtnEl.textContent = 'Sharing...';
  if (channelLinkEl) channelLinkEl.hidden = true;

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildSharePayload(totalScore))
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    shareBtnEl.textContent = 'Shared Successfully! 🎉';
    if (channelLinkEl) channelLinkEl.hidden = false;
  } catch (err) {
    console.warn('[discord] webhook post failed:', err);
    shareBtnEl.disabled = false;
    shareBtnEl.textContent = 'Failed to share';
    if (channelLinkEl) channelLinkEl.hidden = false;
  }
}

/* =========================================================================
 *  ▍第八部分：启动
 * ========================================================================= */

startBtnEl.disabled = true;
preloadArt(function () {
  startBtnEl.disabled = false;
});

resizeCanvas();
resetLevel(LEVELS[0]);
bindInput();
initDiscordAuth();
window.requestAnimationFrame(loop);
