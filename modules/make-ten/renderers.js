// ============================================
// modules/make-ten/renderers.js - 「凑十魔法」题型渲染器
// 语义题目 -> 展示 viewModel，供 game 页 wxml 渲染。
// ============================================

/** 十格阵 cells：前 n 格已填。 */
function cellsFilled(n) {
  return Array.from({ length: 10 }, (_, i) => (i < n ? 1 : 0));
}

function buildFillten(q) {
  return {
    type: 'fillten',
    question: `把${q.item}放进格子，凑满 10 个`,
    item: q.item,
    cells: cellsFilled(q.filled),
    filled: q.filled,
    target: 10,
  };
}

function buildSplit(q) {
  return {
    type: 'split',
    question: '10 可以分成哪两个数？',
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildPair(q) {
  return {
    type: 'pair',
    question: '找出凑成 10 的两对伙伴',
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildCompleten(q) {
  return {
    type: 'completen',
    question: `${q.a} + □ = 10`,
    item: '⭐',
    cells: cellsFilled(q.a),
    filled: q.a,
    target: 10,
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildMake10(q) {
  return {
    type: 'make10',
    question: `${q.a} + ${q.b} = ?`,
    item: '🌟',
    cells: cellsFilled(q.a),
    filled: q.a,
    target: 10,
    extra: Array.from({ length: q.b }, () => '🌟'),
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

/** 语义题目 -> 展示 viewModel */
function buildView(q) {
  switch (q.type) {
    case 'fillten':
      return buildFillten(q);
    case 'split':
      return buildSplit(q);
    case 'pair':
      return buildPair(q);
    case 'completen':
      return buildCompleten(q);
    case 'make10':
      return buildMake10(q);
    default:
      return buildFillten(q);
  }
}

module.exports = { buildView };
