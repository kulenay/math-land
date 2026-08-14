// apis/getProgress.js - 读取模块关卡进度（星级/解锁/总星）
const { errorResult, successResult, isLevelUnlocked, getLevelStars, getModuleStars } = require('../utils/util.js')
const levelsCount = require('../utils/levels-count.js')
const levelsMakeTen = require('../utils/levels-make-ten.js')

async function getProgress(params = {}) {
  console.info('[ai-mode] getProgress 入口, params=', JSON.stringify(params))
  try {
    const moduleId = params.moduleId ? String(params.moduleId) : '1'
    // 忠实搬移主包 modules/index.js 的模块分发
    const levels = moduleId === '1' ? levelsCount : levelsMakeTen
    const all = levels.getAllLevels(moduleId)
    if (!all.length) {
      return errorResult(`模块 ${moduleId} 不存在`)
    }
    const levelsInfo = all.map((l) => ({
      levelId: l.id,
      name: l.name,
      stars: getLevelStars(moduleId, l.id),
      unlocked: isLevelUnlocked(moduleId, l.id),
    }))
    return successResult(`已读取模块${moduleId}的关卡进度`, {
      moduleId,
      totalStars: getModuleStars(moduleId),
      levels: levelsInfo,
    })
  } catch (err) {
    console.error('[ai-mode] getProgress 出错:', err.message)
    return errorResult(`读取进度失败: ${err.message}`)
  }
}

module.exports = { getProgress }
