// ============================================
// modules/life/renderers.js - 「生活大冒险」题型渲染器
// 语义题目 -> 展示 viewModel（布局位置在这里计算）
// ============================================

const { scatterPositions } = require('../count/renderers.js');

const PEOPLE = ['👧', '👦', '👵', '👨', '👩', '🧒'];
const FRIEND_FACES = ['🧒', '👧', '👦'];

function buildOrder(q) {
  const positions = scatterPositions(q.count);
  return {
    type: 'scatter', // 复用 game 页框选计数交互
    scene: 'order',
    question: `早餐盘里有几个${q.item}？`,
    interactionMode: 'drag-select',
    answer: q.count,
    scatter: positions.map((p, i) => ({
      id: i,
      emoji: q.item,
      x: p.x,
      y: p.y,
      centerX: p.x,
      centerY: p.y,
      selected: false,
      flown: false,
    })),
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildBus(q) {
  const riders = [];
  for (let i = 0; i < q.base; i++) {
    riders.push({ id: 's' + i, emoji: PEOPLE[i % PEOPLE.length], status: 'stay' });
  }
  if (q.up) {
    for (let i = 0; i < q.delta; i++) {
      riders.push({ id: 'on' + i, emoji: PEOPLE[(q.base + i) % PEOPLE.length], status: 'on' });
    }
  } else {
    // 下车：最后 delta 位标记为下车（半透明淡出）
    for (let i = q.base - q.delta; i < q.base; i++) {
      riders[i].status = 'off';
    }
  }
  return {
    type: 'bus',
    question: '车上现在有几人？',
    hint: q.up
      ? `原来 ${q.base} 人，又上来 ${q.delta} 人`
      : `原来 ${q.base} 人，下去了 ${q.delta} 人`,
    riders,
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildShare(q) {
  return {
    type: 'share',
    question: '每个朋友分到几颗糖？',
    hint: `把 ${q.total} 颗🍬分给 ${q.friends} 个朋友，要一样多`,
    candies: Array.from({ length: q.total }, (_, i) => i),
    friends: Array.from({ length: q.friends }, (_, i) => FRIEND_FACES[i % FRIEND_FACES.length]),
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildShop(q) {
  return {
    type: 'shop',
    question: `买 ${q.count} 个${q.item}，一共几元？`,
    hint: `${q.item} ${q.price} 元 1 个`,
    item: q.item,
    items: Array.from({ length: q.count }, (_, i) => i),
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildQueue(q) {
  return {
    type: 'queue',
    question: `${q.target} 排在第几个？`,
    row: q.row,
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

/** 语义题目 -> 展示 viewModel */
function buildView(q) {
  switch (q.type) {
    case 'order': return buildOrder(q);
    case 'bus': return buildBus(q);
    case 'share': return buildShare(q);
    case 'shop': return buildShop(q);
    case 'queue': return buildQueue(q);
    default: return buildOrder(q);
  }
}

module.exports = { buildView };
