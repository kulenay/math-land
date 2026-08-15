// ============================================
// modules/clock/levels.js - 「时间与钱币」关卡配置
// 6 关，认识钟表和人民币（贴近生活的一年级内容）：
//   整点 / 半点 / 混合认时 / 认钱币 / 数钱 / 购物付钱
// ============================================

const LEVELS = [
  {
    id: 1,
    name: '认识整点',
    desc: '钟表上是几点？',
    questionCount: 6,
    types: ['clock'],
    half: false, // 只出整点
  },
  {
    id: 2,
    name: '认识半点',
    desc: '分针指到 6，是几点半？',
    questionCount: 6,
    types: ['clock'],
    half: true, // 只出半点
  },
  {
    id: 3,
    name: '时间小管家',
    desc: '整点、半点混合认',
    questionCount: 6,
    types: ['clock'],
    half: 'mix', // 随机整点/半点
  },
  {
    id: 4,
    name: '认识钱币',
    desc: '1 元、5 角、1 角',
    questionCount: 6,
    types: ['coin'],
  },
  {
    id: 5,
    name: '数钱小能手',
    desc: '把硬币加起来，一共多少钱',
    questionCount: 6,
    types: ['money'],
  },
  {
    id: 6,
    name: '购物小达人',
    desc: '手里的钱买得起吗？',
    questionCount: 6,
    types: ['pay'],
  },
];

function getLevel(moduleId, levelId) {
  if (String(moduleId) !== '5') return null;
  return LEVELS.find((l) => l.id === levelId) || null;
}

function getAllLevels(moduleId) {
  if (String(moduleId) !== '5') return [];
  return LEVELS;
}

module.exports = { getLevel, getAllLevels };
