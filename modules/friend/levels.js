// ============================================
// modules/friend/levels.js - 「数字好朋友」关卡配置
// 6 关，聚焦"数字之间的关系"：
//   听音数数（听觉数感）/ 找邻居（数序）/ 分与合（部分-整体）/ 比大小（数量比较）
// ============================================

const LEVELS = [
  {
    id: 1,
    name: '听音数数',
    desc: '闭上小眼睛，听一听响了几声',
    questionCount: 6,
    types: ['soundcount'],
    min: 1,
    max: 5,
  },
  {
    id: 2,
    name: '找邻居',
    desc: '数字的前后邻居是谁？',
    questionCount: 6,
    types: ['neighbor'],
    min: 2,
    max: 9,
  },
  {
    id: 3,
    name: '分与合',
    desc: '一个数可以分成哪两个数？',
    questionCount: 6,
    types: ['splitnum'],
    min: 4,
    max: 9,
  },
  {
    id: 4,
    name: '比一比',
    desc: '哪边多？选对符号',
    questionCount: 6,
    types: ['sign'],
    min: 1,
    max: 10,
  },
  {
    id: 5,
    name: '数字好朋友',
    desc: '四种玩法混合练习',
    questionCount: 6,
    types: ['soundcount', 'neighbor', 'splitnum', 'sign'],
    min: 1,
    max: 9,
  },
  {
    id: 6,
    name: '数感达人',
    desc: '加大难度混合挑战',
    questionCount: 8,
    types: ['soundcount', 'neighbor', 'splitnum', 'sign'],
    min: 1,
    max: 10,
  },
];

function getLevel(moduleId, levelId) {
  if (String(moduleId) !== '4') return null;
  return LEVELS.find((l) => l.id === levelId) || null;
}

function getAllLevels(moduleId) {
  if (String(moduleId) !== '4') return [];
  return LEVELS;
}

module.exports = { getLevel, getAllLevels };
