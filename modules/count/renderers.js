// ============================================
// modules/count/renderers.js - 「数一数」题型渲染器
// 把语义题目（questions.js 生成）转换为展示 viewModel，
// 供 game 页 wxml 渲染。布局位置在这里计算。
// ============================================

const EMOJI_SIZE = 56; // rpx，物品显示尺寸（布局估算用）

/** 散落位置：网格 + 抖动，避免重叠又自然散布。 */
function scatterPositions(count, areaW = 100, areaH = 100) {
  const aspect = areaW / areaH; // 区域宽高比（约 2:1）
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  const rows = Math.ceil(count / cols);
  const cellW = areaW / cols;
  const cellH = areaH / rows;
  const positions = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    // 格内抖动（±20%，留边距）
    const jx = (Math.random() - 0.5) * cellW * 0.4;
    const jy = (Math.random() - 0.5) * cellH * 0.4;
    positions.push({
      x: Math.round(Math.min(95, Math.max(5, c * cellW + cellW / 2 + jx)) * 10) / 10,
      y: Math.round(Math.min(95, Math.max(5, r * cellH + cellH / 2 + jy)) * 10) / 10,
    });
  }
  return positions;
}

function rowOf(item, n) {
  return Array.from({ length: n }, () => item);
}

function buildScatter(q) {
  const positions = scatterPositions(q.count);
  return {
    type: 'scatter',
    question: `数一数，有几个${q.item}？`,
    scatter: positions.map((p) => ({ emoji: q.item, ...p })),
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildTenFrame(q) {
  return {
    type: 'tenframe',
    question: `把${q.item}放进格子，放 ${q.count} 个`,
    item: q.item,
    target: q.count,
    cells: Array.from({ length: 10 }, () => 0),
    filled: 0,
  };
}

function buildSubitize(q) {
  return {
    type: 'subitize',
    question: `看一眼！有几个${q.item}？`,
    row: rowOf(q.item, q.count),
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildFeed(q) {
  return {
    type: 'feed',
    question: `跳跳饿了！给它 ${q.count} 只${q.item}`,
    item: q.item,
    target: q.count,
    bugs: rowOf(q.item, q.pool),
    plate: [], // 已放入盘中的 bug 索引
  };
}

function buildCompare(q) {
  return {
    type: 'compare',
    question: '哪边更多？',
    left: rowOf(q.item, q.left),
    right: rowOf(q.item, q.right),
    options: [
      { key: 'left', label: '左边' },
      { key: 'right', label: '右边' },
    ],
  };
}

function buildGroup(q) {
  const pairs = [];
  for (let i = 0; i < q.count; i += 2) {
    pairs.push([q.item, q.item]);
  }
  return {
    type: 'group',
    question: `两个两个地数，一共有几个${q.item}？`,
    groups: pairs,
    options: q.options.map((v) => ({ key: String(v), label: String(v) })),
  };
}

function buildMatch(q) {
  return {
    type: 'match',
    question: `哪一堆是 ${q.count} 个${q.item}？`,
    groups: q.groups.map((n, i) => ({
      index: i,
      row: rowOf(q.item, n),
    })),
    options: q.groups.map((_, i) => ({ key: i, label: `第${i + 1}堆` })),
  };
}

/** 语义题目 -> 展示 viewModel */
function buildView(q) {
  switch (q.type) {
    case 'scatter':
      return buildScatter(q);
    case 'tenframe':
      return buildTenFrame(q);
    case 'subitize':
      return buildSubitize(q);
    case 'feed':
      return buildFeed(q);
    case 'compare':
      return buildCompare(q);
    case 'group':
      return buildGroup(q);
    case 'match':
      return buildMatch(q);
    default:
      return buildScatter(q);
  }
}

module.exports = { buildView, scatterPositions, EMOJI_SIZE };
