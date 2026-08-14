// apis/saveLevelResult.js - 保存关卡成绩（取历史最高星级）
// 导入的工具函数与注册名同名会被 V002 误判，用别名引用
const { errorResult, successResult, saveLevelResult: saveLevelResultUtil } = require('../utils/util.js')

async function saveLevelResult(params = {}) {
  console.info('[ai-mode] saveLevelResult 入口, params=', JSON.stringify(params))
  try {
    const moduleId = String(params.moduleId || '')
    const levelId = Number(params.levelId)
    const stars = Number(params.stars)
    const firstCorrect = Number(params.firstCorrect || 0)
    if (!moduleId || !levelId || !stars) {
      return errorResult('需要 moduleId、levelId 和 stars')
    }
    if (stars < 1 || stars > 3) {
      return errorResult('stars 必须在 1~3 之间')
    }
    const best = saveLevelResultUtil(moduleId, levelId, stars, firstCorrect)
    return successResult(`已保存关卡 ${moduleId}-${levelId} 的成绩（${stars} 星）`, {
      moduleId,
      levelId,
      stars,
      bestStars: best,
    })
  } catch (err) {
    console.error('[ai-mode] saveLevelResult 出错:', err.message)
    return errorResult(`保存成绩失败: ${err.message}`)
  }
}

module.exports = { saveLevelResult }
