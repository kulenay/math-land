// ============================================
// modules/make-ten/questions.js - 「凑十魔法」题目生成器
// 5 种题型：
//   fillten   补满十格阵：格中已有 N 个，补到 10（补数）
//   split     十的拆分：10 = □ + □，选两个数
//   pair      凑十伙伴：4 个数里找两对和 = 10
//   completen 补数：a + □ = 10，点选项
//   make10    凑十加法：a + b = ?，十格阵 + 散放，点选项
// ============================================

const { randInt, shuffle, pickFrom, genOptions } = require('./rand.js');

const ITEMS = ['🍎', '🌟', '🐟', '🎈', '🍊', '🌸', '🐝', '🍄'];
const PAIRS = [[1, 9], [2, 8], [3, 7], [4, 6]]; // 和为 10 的配对池（避免 5+5 重复）

function pickItem() {
  return ITEMS[randInt(0, ITEMS.length - 1)];
}

/**
 * 生成一关的题目序列。
 * 同题型相邻去重：同一题型的答案指纹不连续重复（如连续两道 split 答案对相同），
 * 提升随机感；最多重试 10 次避免死循环。
 * @param {object} level 关卡配置
 * @returns {Array} 语义题目数组
 */
function generateLevel(level) {
  const questions = [];
  const lastFingerprint = {};
  for (let i = 0; i < level.questionCount; i++) {
    const type = level.types[i % level.types.length];
    let q = generateOne(type, level);
    let guard = 0;
    while (fingerprint(q) === lastFingerprint[type] && guard < 10) {
      q = generateOne(type, level);
      guard++;
    }
    lastFingerprint[type] = fingerprint(q);
    questions.push(q);
  }
  return questions;
}

/** 答案指纹：同题型相同答案时指纹相同，用于相邻去重。 */
function fingerprint(q) {
  switch (q.type) {
    case 'fillten':
      return 'fillten:' + q.filled;
    case 'split':
      return 'split:' + q.answerPair.slice().sort().join(',');
    case 'pair':
      return 'pair:' + q.pairs.map((p) => p.slice().sort().join('+')).sort().join('|');
    case 'completen':
      return 'completen:' + q.a;
    case 'make10':
      return 'make10:' + q.a + '+' + q.b;
    default:
      return '';
  }
}

function generateOne(type, level) {
  switch (type) {
    case 'fillten':
      return genFillten(level);
    case 'split':
      return genSplit();
    case 'pair':
      return genPair();
    case 'completen':
      return genCompleten(level);
    case 'make10':
      return genMake10(level);
    default:
      return genFillten(level);
  }
}

/** 补满十格阵：已有 filled 个（6~8），补到 10。 */
function genFillten(level) {
  return {
    type: 'fillten',
    item: pickItem(),
    filled: randInt(level.min, level.max),
  };
}

/** 十的拆分：10 = a + b，另加 2 个不构成 10 对的干扰数。 */
function genSplit() {
  const [a, b] = pickFrom(PAIRS);
  const used = new Set([a, b]);
  const dist = [];
  let guard = 0;
  while (dist.length < 2 && guard < 60) {
    guard++;
    const d = randInt(1, 9);
    // 不与 a/b 重复、不与任何已选数成 10 对
    if (!used.has(d) && d !== 10 - a && d !== 10 - b
      && !dist.includes(d) && !dist.includes(10 - d)) {
      dist.push(d);
    }
  }
  return {
    type: 'split',
    options: shuffle([a, b, ...dist]),
    answerPair: [a, b],
  };
}

/** 凑十伙伴：随机生成两对和为 10 的互异数字对（排除 5+5 避免重复按钮混淆）。 */
function genPair() {
  const pairs = [];
  const used = new Set();
  let guard = 0;
  while (pairs.length < 2 && guard < 80) {
    guard++;
    const a = randInt(1, 9);
    const b = 10 - a;
    if (a === b || used.has(a) || used.has(b)) continue;
    // 与已选对中的任何数字都不重复
    if (pairs.some(([x, y]) => x === a || x === b || y === a || y === b)) continue;
    pairs.push([a, b]);
    used.add(a);
    used.add(b);
  }
  return {
    type: 'pair',
    pairs,
    options: shuffle(pairs.reduce((acc, p) => acc.concat(p), [])),
  };
}

/** 补数：a（6~9）+ □ = 10。 */
function genCompleten(level) {
  const a = randInt(level.min, level.max);
  const answer = 10 - a;
  return {
    type: 'completen',
    a,
    answer,
    options: genOptions(answer, 3, 1),
  };
}

/** 凑十加法：a（6~9）+ b = ?，b ≥ 10-a 保证需要用凑十法，和 ≤ 17（b 上限 8）。 */
function genMake10(level) {
  const a = randInt(level.min, level.max);
  // b 下限取 10-a 保证"先凑 10 再算剩下的"有意义；上限 8 且和不超过 17，扩大变化
  const b = randInt(Math.max(2, 10 - a), Math.min(8, 17 - a));
  const answer = a + b;
  return {
    type: 'make10',
    a,
    b,
    answer,
    options: genOptions(answer, 4, 2),
  };
}

module.exports = { generateLevel };
