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
  '3': {
    id: 3,
    name: '生活大冒险',
    emoji: '🏡',
    desc: '生活里的数',
    impl: require('./life/index.js'),
  },
  '4': {
    id: 4,
    name: '数字好朋友',
    emoji: '🧩',
    desc: '数字间的关系',
    impl: require('./friend/index.js'),
  },
  '5': {
    id: 5,
    name: '时间与钱币',
    emoji: '⏰',
    desc: '认识钟表和钱币',
    impl: require('./clock/index.js'),
  },
};

function get(moduleId) {
  return registry[String(moduleId)] || null;
}

function getAll() {
  return Object.values(registry);
}

module.exports = { get, getAll };
