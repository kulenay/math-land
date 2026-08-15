// ============================================
// modules/clock/renderers.js - 「时间与钱币」题型渲染器
// 语义题目 -> 展示 viewModel
// 钟表用纯 CSS 渲染：时针/分针按角度旋转；硬币用彩色圆片 + 面值文字。
// ============================================

function buildClock(q) {
  // 时针：整点 h 指向 h*30°，半点再偏 15°；分针：整点 0°，半点 180°
  const hourAngle = (q.hour % 12) * 30 + (q.half ? 15 : 0);
  const minuteAngle = q.half ? 180 : 0;
  return {
    type: 'clock',
    question: '钟表上是几点？',
    hint: q.half ? '分针指到 6，就是几点半' : '分针指到 12，就是整点',
    hour: q.hour,
    half: q.half,
    hourAngle,
    minuteAngle,
    options: q.options,
  };
}

function buildCoin(q) {
  return {
    type: 'coin',
    question: '这枚硬币是多少钱？',
    hint: '看看硬币上的数字',
    coin: q.coin,
    options: q.options,
  };
}

function buildMoney(q) {
  return {
    type: 'money',
    question: '一共有多少钱？',
    hint: '把硬币加起来数一数',
    coins: q.coins,
    options: q.options,
  };
}

function buildPay(q) {
  return {
    type: 'pay',
    question: `买${q.item}，钱够吗？`,
    hint: `${q.item} ${q.price} 元 1 个，你有 ${q.money} 元`,
    item: q.item,
    price: q.price,
    // 钱包：money 个 1 元硬币
    coins: Array.from({ length: q.money }, (_, i) => i),
    options: q.options,
  };
}

/** 语义题目 -> 展示 viewModel */
function buildView(q) {
  switch (q.type) {
    case 'clock': return buildClock(q);
    case 'coin': return buildCoin(q);
    case 'money': return buildMoney(q);
    case 'pay': return buildPay(q);
    default: return buildClock(q);
  }
}

module.exports = { buildView };
