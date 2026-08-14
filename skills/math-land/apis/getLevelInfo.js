// apis/getLevelInfo.js - 查询关卡配置
const { errorResult, successResult } = require('../utils/util.js')
const levelsCount = require('../utils/levels-count.js')
const levelsMakeTen = require('../utils/levels-make-ten.js')

async function getLevelInfo(params = {}) {
  console.info('[ai-mode] getLevelInfo 入口, params=', JSON.stringify(params))
  try {
    const moduleId = String(params.moduleId || '')
    const levelId = Number(params.levelId)
    if (!moduleId || !levelId) {
      return errorResult('需要 moduleId 和 levelId')
    }
    const levels = moduleId === '1' ? levelsCount : levelsMakeTen
    const level = levels.getLevel(moduleId, levelId)
    if (!level) {
      return errorResult(`关卡 ${moduleId}-${levelId} 不存在`)
    }
    return successResult(`已查询到关卡「${level.name}」`, {
      moduleId,
      levelId: level.id,
      name: level.name,
      desc: level.desc,
      questionCount: level.questionCount,
      types: level.types,
      min: level.min,
      max: level.max,
    })
  } catch (err) {
    console.error('[ai-mode] getLevelInfo 出错:', err.message)
    return errorResult(`查询关卡失败: ${err.message}`)
  }
}

module.exports = { getLevelInfo }
