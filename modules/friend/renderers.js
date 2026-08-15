// ============================================
// modules/friend/renderers.js - 「数字好朋友」题型渲染器
// 语义题目 -> 展示 viewModel
// ============================================

function rowOf(item, n) {
  return Array.from({ length: n }, () => item);
}

function buildSoundcount(q) {
  return {
    type: 'soundcount',
    question: '听一听，响了几声？',
    hint: '👂 小耳朵竖起来，数一数响了几下',
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildNeighbor(q) {
  return {
    type: 'neighbor',
    question: `${q.n} 的邻居是谁？`,
    hint: `比 ${q.n} 小 1 和大 1 的两个数`,
    n: q.n,
    mode: q.mode,
    pair: q.pair,
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildSplitnum(q) {
  return {
    type: 'splitnum',
    question: `${q.total} 可以分成哪两个数？`,
    hint: `选出两个数，加起来等于 ${q.total}`,
    total: q.total,
    mode: q.mode,
    target: q.target,
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildSign(q) {
  return {
    type: 'sign',
    question: '比一比，哪边多？',
    hint: '选符号：> 大于　< 小于　= 等于',
    left: rowOf(q.item, q.left),
    right: rowOf(q.item, q.right),
    options: q.options.map((v) => ({ key: v, label: v })),
  };
}

/** 语义题目 -> 展示 viewModel */
function buildView(q) {
  switch (q.type) {
    case 'soundcount': return buildSoundcount(q);
    case 'neighbor': return buildNeighbor(q);
    case 'splitnum': return buildSplitnum(q);
    case 'sign': return buildSign(q);
    default: return buildSoundcount(q);
  }
}

module.exports = { buildView };
