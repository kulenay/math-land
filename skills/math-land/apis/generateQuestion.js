// apis/generateQuestion.js - 为指定关卡生成一道题目（含答案，供答题/讲解用）
const { errorResult, successResult } = require('../utils/util.js')
const levelsCount = require('../utils/levels-count.js')
const levelsMakeTen = require('../utils/levels-make-ten.js')
const questionsCount = require('../utils/questions-count.js')
const questionsMakeTen = require('../utils/questions-make-ten.js')

async function generateQuestion(params = {}) {
  console.info('[ai-mode] generateQuestion 入口, params=', JSON.stringify(params))
  try {
    const moduleId = String(params.moduleId || '')
    const levelId = Number(params.levelId)
    if (!moduleId || !levelId) {
      return errorResult('需要 moduleId 和 levelId')
    }
    // 忠实搬移主包 modules/index.js 的模块分发
    const levels = moduleId === '1' ? levelsCount : levelsMakeTen
    const generator = moduleId === '1' ? questionsCount : questionsMakeTen
    const level = levels.getLevel(moduleId, levelId)
    if (!level) {
      return errorResult(`关卡 ${moduleId}-${levelId} 不存在`)
    }
    // 主包 game.js 生成整关题目序列后逐题展示；此处取序列第一题
    const question = generator.generateLevel(level)[0]
    return successResult(`已为关卡「${level.name}」生成一道题`, {
      moduleId,
      levelId,
      question,
    })
  } catch (err) {
    console.error('[ai-mode] generateQuestion 出错:', err.message)
    return errorResult(`生成题目失败: ${err.message}`)
  }
}

module.exports = { generateQuestion }
