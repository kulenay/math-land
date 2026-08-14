// apis/toggleSound.js - 查询/切换音效开关
// 逻辑忠实搬移自主包 core/sound.js 的 setEnabled 部分
const { errorResult, successResult } = require('../utils/util.js')

async function toggleSound(params = {}) {
  console.info('[ai-mode] toggleSound 入口, params=', JSON.stringify(params))
  try {
    const current = wx.getStorageSync('ml_settings') || {}
    let enabled = current.soundOn !== false // 主包默认开启
    if (params.on !== undefined) {
      enabled = !!params.on
      wx.setStorageSync('ml_settings', { soundOn: enabled })
    }
    return successResult(enabled ? '音效已开启' : '音效已关闭', { soundOn: enabled })
  } catch (err) {
    console.error('[ai-mode] toggleSound 出错:', err.message)
    return errorResult(`音效设置失败: ${err.message}`)
  }
}

module.exports = { toggleSound }
