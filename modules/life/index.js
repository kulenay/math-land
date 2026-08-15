// ============================================
// modules/life/index.js - 「生活大冒险」模块
// 把数感放进生活场景：早餐点数 / 公交加减 / 分糖果 / 收银算钱 / 排队序数
// ============================================
const levels = require('./levels.js');
const questions = require('./questions.js');
const renderers = require('./renderers.js');

module.exports = { levels, questions, renderers };
