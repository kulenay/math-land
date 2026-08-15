// ============================================
// modules/friend/questions.js - 「数字好朋友」题目生成器
// 4 种题型：
//   soundcount 听音数数：响 count 声，数出几声（听觉数感）
//   neighbor   找邻居：数字 n 的前一个和后一个数（数序）
//   splitnum   分与合：total 可以分成哪两个数（部分-整体）
//   sign       比大小：两边数量选 > < = 符号（数量比较符号化）
// ============================================

const { randInt, shuffle, pickFrom, genOptions } = require('../../core/rand.js');

const ITEMS = ['🍎', '🌟', '🐟', '🎈', '🍊', '🌸', '🐝', '🍄', '🍬', '⚽'];

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

/**
 * 生成一关的题目序列。同题型相邻去重（答案指纹不连续重复）。
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
    case 'soundcount': return 'soundcount:' + q.count;
    case 'neighbor': return 'neighbor:' + q.n;
    case 'splitnum': return 'splitnum:' + q.total;
    case 'sign': return 'sign:' + q.left + ',' + q.right;
    default: return '';
  }
}

function generateOne(type, level) {
  switch (type) {
    case 'soundcount': return genSoundcount(level);
    case 'neighbor': return genNeighbor(level);
    case 'splitnum': return genSplitnum(level);
    case 'sign': return genSign(level);
    default: return genSoundcount(level);
  }
}

/** 听音数数：响 count 声（1~6），数出几声。 */
function genSoundcount(level) {
  const count = randInt(Math.max(1, level.min), Math.min(6, level.max));
  return {
    type: 'soundcount',
    count,
    options: genOptions(count),
    answer: count,
  };
}

/** 找邻居：n（2~9）的前一个和后一个数。选项 4 个，含 n-1、n+1，不含 n 本身。 */
function genNeighbor(level) {
  const n = randInt(Math.max(2, level.min), Math.min(9, level.max));
  const lo = n - 1;
  const hi = n + 1;
  const set = new Set([lo, hi]);
  let guard = 0;
  while (set.size < 4 && guard < 80) {
    guard++;
    const d = n + randInt(-3, 3);
    if (d >= 1 && d <= 11 && d !== n && !set.has(d)) set.add(d);
  }
  let fb = 1;
  while (set.size < 4) {
    if (fb !== n && !set.has(fb)) set.add(fb);
    fb++;
  }
  return {
    type: 'neighbor',
    n,
    mode: 'set',          // onPickTap 判定模式：两个数恰为 pair
    pair: [lo, hi],
    answerPair: [lo, hi],
    answer: n,            // 答对时精灵庆祝用（主角数字 n）
    options: shuffle(Array.from(set)),
  };
}

/** 分与合：total（4~9）分成 a + b（a ≠ b），干扰数不与任何选项凑成 total。 */
function genSplitnum(level) {
  const total = randInt(Math.max(4, level.min), Math.min(9, level.max));
  let a = randInt(1, total - 1);
  let guard = 0;
  while (a * 2 === total && guard < 20) {
    a = randInt(1, total - 1);
    guard++;
  }
  if (a * 2 === total) a = a === 1 ? 2 : 1; // 兜底：total 偶数且随机不到非半数
  const b = total - a;
  const dist = [];
  guard = 0;
  while (dist.length < 2 && guard < 80) {
    guard++;
    const d = randInt(1, 9);
    // 不与 a/b 重复，且 d 与任何已选数相加 ≠ total（保证只有一对正确答案）
    if (d !== a && d !== b && d !== total - a && d !== total - b
      && !dist.includes(d) && !dist.includes(total - d)) {
      dist.push(d);
    }
  }
  let fb = 1;
  while (dist.length < 2) {
    const d = fb++;
    if (d !== a && d !== b && d !== total - a && d !== total - b
      && !dist.includes(d) && !dist.includes(total - d)) {
      dist.push(d);
    }
    if (fb > 12) break;
  }
  return {
    type: 'splitnum',
    total,
    mode: 'sum',          // onPickTap 判定模式：两数和 = target
    target: total,
    answerPair: [a, b],
    answer: total,        // 答对时精灵庆祝用（主角数字 total）
    options: shuffle([a, b, ...dist]),
  };
}

/** 比大小：左右数量（1~10），约 1/3 概率相等练"="。 */
function genSign(level) {
  const item = pick(ITEMS);
  const min = Math.max(1, level.min);
  const max = Math.min(10, level.max);
  let left = randInt(min, max);
  let right = randInt(min, max);
  if (Math.random() < 0.3) {
    right = left;
  } else {
    let guard = 0;
    while (right === left && guard < 20) {
      right = randInt(min, max);
      guard++;
    }
    if (right === left) right = left === max ? Math.max(min, left - 1) : left + 1;
  }
  const answer = left > right ? '>' : left < right ? '<' : '=';
  return {
    type: 'sign',
    item,
    left,
    right,
    answer,
    options: ['>', '<', '='],
  };
}

module.exports = { generateLevel };
