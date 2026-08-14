// ============================================
// modules/index.js - 模块注册表
// 每个模块统一接口：{ levels, questions, renderers }
//   levels.getLevel(moduleId, levelId) / getAllLevels(moduleId)
//   questions.generateLevel(levelConfig) -> 语义题目数组
//   renderers.buildView(question) -> viewModel
// ============================================

const registry = {
  '1': {
    id: 1,
    name: '数一数',
    emoji: '👀',
    desc: '感知数量',
    impl: require('./count/index.js'),
  },
  '2': {
    id: 2,
    name: '凑十魔法',
    emoji: '📦',
    desc: '十进制',
    impl: require('./make-ten/index.js'),
  },
};

function get(moduleId) {
  return registry[String(moduleId)] || null;
}

function getAll() {
  return Object.values(registry);
}

module.exports = { get, getAll };
