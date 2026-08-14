// ============================================
// modules/make-ten/levels.js - 「凑十魔法」关卡配置
// 6 关，对应十进制/凑十法，衔接数一数的十格阵教具。
// types 为题型序列，min/max 为算式中的数字范围。
// ============================================

const LEVELS = [
  {
    id: 1,
    name: '补满十格阵',
    desc: '还差几个凑满 10？',
    questionCount: 6,
    types: ['fillten'],
    min: 6,
    max: 8,
  },
  {
    id: 2,
    name: '十的拆分',
    desc: '10 可以分成几和几？',
    questionCount: 6,
    types: ['split'],
  },
  {
    id: 3,
    name: '凑十伙伴',
    desc: '哪两个数相加等于 10？',
    questionCount: 6,
    types: ['pair'],
  },
  {
    id: 4,
    name: '补数练习',
    desc: '几 + □ = 10',
    questionCount: 6,
    types: ['completen'],
    min: 6,
    max: 9,
  },
  {
    id: 5,
    name: '凑十加法',
    desc: '先凑 10 再计算',
    questionCount: 6,
    types: ['make10'],
    min: 6,
    max: 9,
  },
  {
    id: 6,
    name: '魔法挑战',
    desc: '混合练习',
    questionCount: 8,
    types: ['fillten', 'split', 'pair', 'completen', 'make10'],
    min: 6,
    max: 9,
  },
];

function getLevel(moduleId, levelId) {
  if (String(moduleId) !== '2') return null;
  return LEVELS.find((l) => l.id === levelId) || null;
}

function getAllLevels(moduleId) {
  if (String(moduleId) !== '2') return [];
  return LEVELS;
}

module.exports = { getLevel, getAllLevels };
