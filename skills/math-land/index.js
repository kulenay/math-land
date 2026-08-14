// ============================================
// skills/math-land/index.js
// 原子接口注册入口（基础模式，无中间件）
// 注册名与 mcp.json apis[].name 一一对应
// ============================================
const { getProgress } = require('./apis/getProgress')
const { getLevelInfo } = require('./apis/getLevelInfo')
const { generateQuestion } = require('./apis/generateQuestion')
const { checkAnswer } = require('./apis/checkAnswer')
const { computeStars } = require('./apis/computeStars')
const { saveLevelResult } = require('./apis/saveLevelResult')
const { toggleSound } = require('./apis/toggleSound')

wx.modelContext.registerAPI('getProgress', getProgress)
wx.modelContext.registerAPI('getLevelInfo', getLevelInfo)
wx.modelContext.registerAPI('generateQuestion', generateQuestion)
wx.modelContext.registerAPI('checkAnswer', checkAnswer)
wx.modelContext.registerAPI('computeStars', computeStars)
wx.modelContext.registerAPI('saveLevelResult', saveLevelResult)
wx.modelContext.registerAPI('toggleSound', toggleSound)
