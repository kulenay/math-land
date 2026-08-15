// ============================================
// modules/life/levels.js - 「生活大冒险」关卡配置
// 6 关，把数感放进孩子熟悉的生活场景：
//   早餐盘点数 / 公交车加减 / 分糖果等分 / 收银算钱 / 排队序数
// ============================================

const LEVELS = [
  {
    id: 1,
    name: '早餐时间',
    desc: '数一数早餐盘里的美食',
    questionCount: 6,
    types: ['order'],
    min: 1,
    max: 5,
  },
  {
    id: 2,
    name: '公交车上',
    desc: '上来又下去，车上几人？',
    questionCount: 6,
    types: ['bus'],
    min: 2,
    max: 6,
  },
  {
    id: 3,
    name: '分糖果啦',
    desc: '糖果分给朋友，每人几颗？',
    questionCount: 6,
    types: ['share'],
    min: 2,
    max: 9,
  },
  {
    id: 4,
    name: '小小收银员',
    desc: '1 元 1 个，算算一共几元',
    questionCount: 6,
    types: ['shop'],
    min: 1,
    max: 5,
  },
  {
    id: 5,
    name: '排队买票',
    desc: '小动物排队，谁排第几？',
    questionCount: 6,
    types: ['queue'],
    min: 1,
    max: 6,
  },
  {
    id: 6,
    name: '生活大挑战',
    desc: '混合挑战',
    questionCount: 8,
    types: ['order', 'bus', 'share', 'shop', 'queue'],
    min: 1,
    max: 6,
  },
];

function getLevel(moduleId, levelId) {
  if (String(moduleId) !== '3') return null;
  return LEVELS.find((l) => l.id === levelId) || null;
}

function getAllLevels(moduleId) {
  if (String(moduleId) !== '3') return [];
  return LEVELS;
}

module.exports = { getLevel, getAllLevels };
