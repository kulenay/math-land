// apis/computeStars.js - 按首答正确率计算星级（1~3 星）
// 逻辑忠实搬移自主包 core/star.js
const { errorResult, successResult } = require('../utils/util.js')

/** 内部纯函数（与注册名区分，满足已注册接口必须为 async 的校验） */
function calcStars(firstCorrect, total) {
  if (total <= 0) return 1
  if (firstCorrect >= total) return 3
  if (firstCorrect / total >= 0.8) return 2
  return 1
}

async function computeStars(params = {}) {
  console.info('[ai-mode] computeStars 入口, params=', JSON.stringify(params))
  try {
    const firstCorrect = Number(params.firstCorrect)
    const total = Number(params.total)
    if (!Number.isFinite(firstCorrect) || !Number.isFinite(total) || total <= 0) {
      return errorResult('需要有效的 firstCorrect 和 total（total > 0）')
    }
    const stars = calcStars(firstCorrect, total)
    return successResult(`本次闯关获得 ${stars} 星`, { stars, firstCorrect, total })
  } catch (err) {
    console.error('[ai-mode] computeStars 出错:', err.message)
    return errorResult(`计算星级失败: ${err.message}`)
  }
}

module.exports = { computeStars }
