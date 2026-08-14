// ============================================
// modules/count/levels.js - 「数一数」关卡配置
// 8 关，对应一年级数感启蒙，难度递进。
// types 为题型序列（每关内按序循环分配），min/max 为数量范围。
// ============================================

const LEVELS = [
  {
    id: 1,
    name: '认识 1~3',
    desc: '数一数，有几颗星星？',
    questionCount: 6,
    types: ['scatter'],
    min: 1,
    max: 3,
  },
  {
    id: 2,
    name: '认识 4~5',
    desc: '物品变多了，仔细数',
    questionCount: 6,
    types: ['scatter'],
    min: 4,
    max: 5,
  },
  {
    id: 3,
    name: '认识 6~8',
    desc: '用十格阵帮忙数',
    questionCount: 6,
    types: ['scatter', 'tenframe'],
    min: 6,
    max: 8,
  },
  {
    id: 4,
    name: '认识 9~10',
    desc: '快凑满十啦！',
    questionCount: 6,
    types: ['scatter', 'tenframe'],
    min: 9,
    max: 10,
  },
  {
    id: 5,
    name: '谁多谁少',
    desc: '比一比，哪边更多？',
    questionCount: 6,
    types: ['compare'],
    min: 1,
    max: 8,
  },
  {
    id: 6,
    name: '跳跳的晚餐',
    desc: '给跳跳夹虫虫吃',
    questionCount: 6,
    types: ['feed'],
    min: 1,
    max: 8,
  },
  {
    id: 7,
    name: '火眼金睛',
    desc: '一眼看出有多少！',
    questionCount: 6,
    types: ['subitize'],
    min: 1,
    max: 5,
  },
  {
    id: 8,
    name: '两人一组',
    desc: '两个两个地数',
    questionCount: 6,
    types: ['group', 'match'],
    min: 6,
    max: 12,
  },
];

function getLevel(moduleId, levelId) {
  // 目前只有模块 1（数一数）
  if (String(moduleId) !== '1') return null;
  return LEVELS.find((l) => l.id === levelId) || null;
}

function getAllLevels(moduleId) {
  if (String(moduleId) !== '1') return [];
  return LEVELS;
}

module.exports = { getLevel, getAllLevels };
