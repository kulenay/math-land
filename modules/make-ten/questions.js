// ============================================
// modules/make-ten/questions.js - 「凑十魔法」题目生成器
// 5 种题型：
//   fillten   补满十格阵：格中已有 N 个，补到 10（补数）
//   split     十的拆分：10 = □ + □，选两个数
//   pair      凑十伙伴：4 个数里找两对和 = 10
//   completen 补数：a + □ = 10，点选项
//   make10    凑十加法：a + b = ?，十格阵 + 散放，点选项
// ============================================

const { randInt, shuffle, pickFrom, genOptions } = require('../../core/rand');

const ITEMS = ['🍎', '🌟', '🐟', '🎈', '🍊', '🌸', '🐝', '🍄'];
const PAIRS = [[1, 9], [2, 8], [3, 7], [4, 6]]; // 和为 10 的配对池（避免 5+5 重复）

function pickItem() {
  return ITEMS[randInt(0, ITEMS.length - 1)];
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

/** 凑十伙伴：从配对池随机选两对，共 4 个数。 */
function genPair() {
  const idx = shuffle([0, 1, 2, 3]).slice(0, 2);
  const pairs = idx.map((i) => PAIRS[i]);
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

/** 凑十加法：a（6~9）+ b = ?，b ≥ 10-a 保证需要用凑十法，和 ≤ 18。 */
function genMake10(level) {
  const a = randInt(level.min, level.max);
  // b 下限取 10-a：保证"先凑 10 再算剩下的"有意义（如 6+4、8+5）
  const b = randInt(Math.max(2, 10 - a), Math.min(6, 18 - a));
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
