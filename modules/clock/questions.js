// ============================================
// modules/clock/questions.js - 「时间与钱币」题目生成器
// 4 种题型：
//   clock 认钟表：整点/半点，选时间（答案 key 形如 "3:00" / "3:30"）
//   coin  认钱币：一枚硬币（1元/5角/1角），选面值
//   money 数钱：若干硬币求和（结果限 1元/5角/1角/1元5角/2元…），选金额
//   pay   购物：商品价 X 元、手上有 Y 元，够不够
// ============================================

const { randInt, shuffle, pickFrom, genOptions } = require('../../core/rand.js');

const GOODS = ['🍎', '🍦', '🧸', '🎈', '🍭', '⚽', '📚', '🥛'];

// 硬币面值定义（key 用于判定，label 显示，color 是 CSS 圆片颜色）
const COINS = [
  { key: '1元', label: '1元', color: '#f6c453' },   // 金色
  { key: '5角', label: '5角', color: '#d3d9de' },   // 银色
  { key: '1角', label: '1角', color: '#c8a165' },   // 铜色
];
const COIN_BY_KEY = {};
COINS.forEach((c) => { COIN_BY_KEY[c.key] = c; });

// 金额答案池（干扰与正确答案都从这里取）
const AMOUNTS = ['1元', '2元', '3元', '5角', '1角', '1元5角', '2元5角', '6角', '5元'];

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

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

function fingerprint(q) {
  switch (q.type) {
    case 'clock': return 'clock:' + q.hour + (q.half ? ':30' : ':00');
    case 'coin': return 'coin:' + q.coin.key;
    case 'money': return 'money:' + q.answer;
    case 'pay': return 'pay:' + q.price + ',' + q.money;
    default: return '';
  }
}

function generateOne(type, level) {
  switch (type) {
    case 'clock': return genClock(level);
    case 'coin': return genCoin(level);
    case 'money': return genMoney(level);
    case 'pay': return genPay(level);
    default: return genClock(level);
  }
}

/** 环绕取小时（1~12），如 12 的邻居是 1 和 11。 */
function wrapHour(h) {
  return ((h - 1 + 12) % 12) + 1;
}

/** 认钟表：整点/半点。答案 key："3:00" / "3:30"。 */
function genClock(level) {
  const half = level.half === true || (level.half === 'mix' && Math.random() < 0.5);
  const hour = randInt(1, 12);
  const answerKey = half ? hour + ':30' : hour + ':00';

  // 干扰小时：±1/±2（环绕），与正确答案小时不同
  const others = new Set();
  let guard = 0;
  while (others.size < 3 && guard < 60) {
    guard++;
    const d = wrapHour(hour + (Math.random() < 0.5 ? -1 : 1) * randInt(1, 2));
    if (d !== hour) others.add(d);
  }
  let fb = hour + 1;
  while (others.size < 3) {
    const d = wrapHour(fb);
    if (d !== hour) others.add(d);
    fb++;
  }
  const options = shuffle([hour].concat(Array.from(others))).map((h) => ({
    key: half ? h + ':30' : h + ':00',
    label: half ? h + '点半' : h + '点',
  }));
  return {
    type: 'clock',
    hour,
    half,
    answer: answerKey,
    options,
  };
}

/** 认钱币：随机一枚硬币，选项为三种面值。 */
function genCoin() {
  const correct = pick(COINS);
  const others = COINS.filter((c) => c.key !== correct.key);
  return {
    type: 'coin',
    coin: correct,
    answer: correct.key,
    options: shuffle([correct].concat(others)).map((c) => ({ key: c.key, label: c.label })),
  };
}

/** 数钱：硬币组合求和，结果限一年级可读的金额文本。 */
function genMoney() {
  const mode = pick(['all1', 'all1', 'one5', 'two5', 'mix15']);
  let coinKeys = [];
  let answer = '';
  switch (mode) {
    case 'all1': { // k 个 1 元
      const k = randInt(1, 5);
      coinKeys = Array.from({ length: k }, () => '1元');
      answer = k + '元';
      break;
    }
    case 'one5':
      coinKeys = ['5角'];
      answer = '5角';
      break;
    case 'two5': // 2 个 5 角 = 1 元（等值交换，有教育意义）
      coinKeys = ['5角', '5角'];
      answer = '1元';
      break;
    case 'mix15': // 1 元 + 5 角 = 1 元 5 角
      coinKeys = ['1元', '5角'];
      answer = '1元5角';
      break;
  }
  // 干扰金额：3 个与答案不同的金额
  const others = new Set();
  let guard = 0;
  while (others.size < 3 && guard < 80) {
    guard++;
    const d = pick(AMOUNTS);
    if (d !== answer && !others.has(d)) others.add(d);
  }
  let fi = 0;
  while (others.size < 3) {
    const d = AMOUNTS[fi++ % AMOUNTS.length];
    if (d !== answer && !others.has(d)) others.add(d);
    if (fi > AMOUNTS.length * 2) break;
  }
  const options = shuffle([answer].concat(Array.from(others))).map((a) => ({ key: a, label: a }));
  return {
    type: 'money',
    coins: coinKeys.map((k) => COIN_BY_KEY[k]),
    answer,
    options,
  };
}

/** 购物：商品价 price 元，手上有 money 元（1 元硬币），够不够。 */
function genPay() {
  const price = randInt(1, 5);
  const money = randInt(1, 6);
  const enough = money >= price;
  return {
    type: 'pay',
    item: pick(GOODS),
    price,
    money,
    enough,
    answer: enough ? '够' : '不够',
    options: [
      { key: '够', label: '✅ 够' },
      { key: '不够', label: '❌ 不够' },
    ],
  };
}

module.exports = { generateLevel, COINS, COIN_BY_KEY };
