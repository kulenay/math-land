// ============================================
// modules/life/questions.js - 「生活大冒险」题目生成器
// 5 种题型：
//   order  早餐点数：散落食物，框选/选数
//   bus    公交变化：车上加减人，算现在几人
//   share  等分糖果：N 颗糖分给几位朋友，每人几颗
//   shop   收银算钱：1 元 1 个，买 N 个几元
//   queue  排队序数：找目标动物排第几
// ============================================

const { randInt, shuffle, pickFrom, genOptions } = require('../../core/rand.js');

const FOOD = ['🍞', '🥚', '🍩', '🥟', '🍎', '🍌', '🥕'];
const PEOPLE = ['👧', '👦', '👵', '👨', '👩', '🧒'];
const GOODS = ['🍎', '🧸', '🎈', '🍦', '⚽', '📚'];
const ANIMALS = ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🐨', '🐷'];

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
    case 'order': return 'order:' + q.count;
    case 'bus': return 'bus:' + q.result;
    case 'share': return 'share:' + q.per;
    case 'shop': return 'shop:' + q.total;
    case 'queue': return 'queue:' + q.pos;
    default: return '';
  }
}

function generateOne(type, level) {
  switch (type) {
    case 'order': return genOrder(level);
    case 'bus': return genBus(level);
    case 'share': return genShare(level);
    case 'shop': return genShop(level);
    case 'queue': return genQueue(level);
    default: return genOrder(level);
  }
}

/** 早餐点数：散落 N 个食物，选数（复用框选计数交互）。 */
function genOrder(level) {
  const count = randInt(level.min, level.max);
  return {
    type: 'order',
    item: pick(FOOD),
    count,
    options: genOptions(count),
    answer: count,
  };
}

/** 公交变化：车上原来 base 人，上来/下去 delta 人，求现在几人（结果 1~10）。 */
function genBus(level) {
  const base = randInt(level.min, level.max);
  let up = Math.random() < 0.5;
  const delta = randInt(1, 3);
  let result = up ? base + delta : base - delta;
  // 越界修正：下太多就改上来，上太多就改下去
  if (result > 10) { up = false; result = base - delta; }
  if (result < 1) { up = true; result = base + delta; }
  result = Math.max(1, Math.min(10, result));
  return {
    type: 'bus',
    base,
    up,
    delta,
    result,
    options: genOptions(result),
    answer: result,
  };
}

/** 等分糖果：total = friends × per，每人分到 per 颗。 */
function genShare(level) {
  const friends = randInt(2, 3);
  const perMin = Math.max(1, Math.ceil(level.min / friends));
  const perMax = Math.max(perMin, Math.floor(level.max / friends));
  const per = randInt(perMin, perMax);
  const total = friends * per;
  return {
    type: 'share',
    total,
    friends,
    per,
    options: genOptions(per),
    answer: per,
  };
}

/** 收银算钱：1 元 1 个，买 count 个 = count 元。 */
function genShop(level) {
  const count = randInt(level.min, level.max);
  return {
    type: 'shop',
    item: pick(GOODS),
    price: 1,
    count,
    total: count,
    options: genOptions(count),
    answer: count,
  };
}

/** 排队序数：len 人排队，目标动物在第 pos 位。 */
function genQueue(level) {
  const len = randInt(level.min, level.max);
  const pos = randInt(1, len);
  const target = pick(ANIMALS);
  const row = [];
  for (let i = 0; i < len; i++) {
    let a = pick(ANIMALS);
    let guard = 0;
    while (a === target && guard < 20) { a = pick(ANIMALS); guard++; }
    row.push({ emoji: a, isTarget: false });
  }
  row[pos - 1] = { emoji: target, isTarget: true };
  return {
    type: 'queue',
    row,
    target,
    pos,
    options: genOptions(pos),
    answer: pos,
  };
}

module.exports = { generateLevel };
