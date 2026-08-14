// ============================================
// modules/count/questions.js - 「数一数」题目生成器
// 输入关卡配置 -> 生成一关的语义题目数组。
// 语义题目（不含布局），布局由 renderers.js 负责。
// ============================================

// 通用物品池
const ITEMS = ['🍎', '🍬', '🌟', '🐟', '🎈', '🍊', '🌸', '🐝', '🍄', '🐚'];
const BUG = '🐛';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickItem() {
  return ITEMS[randInt(0, ITEMS.length - 1)];
}

/** 生成 4 个选项（含正确答案），邻近数字为主、远数字为辅。 */
function genOptions(correct, spread = 3) {
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < 4 && guard < 60) {
    guard++;
    const opt = Math.random() > 0.5
      ? correct + randInt(-2, 2)      // 邻近
      : correct + randInt(-spread, spread); // 稍远
    if (opt >= 1 && !set.has(opt)) set.add(opt);
  }
  // 兜底：直接补 1 ~ max(correct+5, 5) 范围
  let fallback = Math.max(correct + 5, 5);
  while (set.size < 4) {
    const opt = randInt(1, fallback);
    if (!set.has(opt)) set.add(opt);
  }
  return shuffle(Array.from(set));
}

/**
 * 生成一关的题目序列。
 * @param {object} level 关卡配置
 * @returns {Array} 语义题目数组
 */
function generateLevel(level) {
  const questions = [];
  for (let i = 0; i < level.questionCount; i++) {
    const type = level.types[i % level.types.length];
    questions.push(generateOne(type, level));
  }
  return questions;
}

function generateOne(type, level) {
  switch (type) {
    case 'scatter':
      return genScatter(level);
    case 'tenframe':
      return genTenFrame(level);
    case 'subitize':
      return genSubitize(level);
    case 'feed':
      return genFeed(level);
    case 'compare':
      return genCompare(level);
    case 'group':
      return genGroup(level);
    case 'match':
      return genMatch(level);
    default:
      return genScatter(level);
  }
}

/** 点数选数：散落 N 个物品，选数字。 */
function genScatter(level) {
  const count = randInt(level.min, level.max);
  const item = pickItem();
  return {
    type: 'scatter',
    item,
    count,
    options: genOptions(count),
    answer: count,
  };
}

/** 十格阵构建：点击格子填到 N 个。 */
function genTenFrame(level) {
  const count = randInt(level.min, level.max);
  return {
    type: 'tenframe',
    item: pickItem(),
    count,
  };
}

/** 一眼报数（感数）：1~5 个整齐排列，快速选数。 */
function genSubitize(level) {
  const count = randInt(Math.max(level.min, 1), Math.min(level.max, 5));
  return {
    type: 'subitize',
    item: pickItem(),
    count,
    options: genOptions(count),
    answer: count,
  };
}

/** 一一对应：点选虫子喂跳跳，数量 = N。 */
function genFeed(level) {
  const count = randInt(level.min, level.max);
  return {
    type: 'feed',
    item: BUG,
    count,
    pool: count + 3, // 虫堆里可选的虫子数
  };
}

/** 比较多少：左右两组，选多的一边。 */
function genCompare(level) {
  const left = randInt(level.min, level.max);
  let right = randInt(level.min, level.max);
  let guard = 0;
  while (right === left && guard < 20) {
    right = randInt(level.min, level.max);
    guard++;
  }
  if (right === left) right = left === level.max ? left - 1 : left + 1; // min===max 兜底
  const item = pickItem();
  return {
    type: 'compare',
    item,
    left,
    right,
    answer: left > right ? 'left' : 'right',
  };
}

/** 按群计数：偶数个物品 2 个一组。 */
function genGroup(level) {
  const candidates = [4, 6, 8, 10, 12].filter((n) => n >= level.min && n <= level.max);
  const pool = candidates.length ? candidates : [6, 8, 10];
  const count = pool[randInt(0, pool.length - 1)];
  return {
    type: 'group',
    item: pickItem(),
    count,
    options: genOptions(count, 4),
    answer: count,
  };
}

/** 数字找数量：给数字 N，从 3 组中选数量为 N 的组。 */
function genMatch(level) {
  const count = randInt(level.min, level.max);
  // 三组数量互不相同，其中一组 = count
  const others = new Set();
  let guard = 0;
  while (others.size < 2 && guard < 40) {
    guard++;
    const o = count + randInt(-3, 3);
    if (o >= 1 && o !== count) others.add(o);
  }
  // 兜底
  let fallback = 1;
  while (others.size < 2) {
    const o = fallback++;
    if (o !== count) others.add(o);
  }
  const groups = shuffle([count, ...Array.from(others)]);
  return {
    type: 'match',
    item: pickItem(),
    count,
    groups,
    answerIndex: groups.indexOf(count),
  };
}

module.exports = { generateLevel };
