// ============================================
// skills/math-land/utils/util.js
// 工具层：返回值工厂 + 本地存档逻辑
// （存档逻辑忠实搬移自主包 core/storage.js，独立分包内自持）
// ============================================

// ---------- 返回值工厂（每个 skill 都需要） ----------
function errorResult(msg) {
  return { isError: true, content: [{ type: 'text', text: msg }] }
}

function successResult(msg, structuredContent) {
  const result = { isError: false, content: [{ type: 'text', text: msg }] }
  if (structuredContent !== undefined) result.structuredContent = structuredContent
  return result
}

// ---------- 本地存档（忠实搬移自主包 core/storage.js） ----------

const KEY = 'ml_progress_v1'

function load() {
  try {
    return wx.getStorageSync(KEY) || { modules: {} }
  } catch (e) {
    return { modules: {} }
  }
}

function save(data) {
  try {
    wx.setStorageSync(KEY, data)
  } catch (e) {
    // 存储失败（如空间满）静默处理
  }
}

/** 保存关卡成绩。取历史最高星级。 */
function saveLevelResult(moduleId, levelId, stars, firstCorrect) {
  const data = load()
  const m = data.modules[String(moduleId)] || { stars: {}, completed: [], firstTry: {} }
  const key = String(levelId)
  const oldStars = m.stars[key] || 0
  m.stars[key] = Math.max(oldStars, stars)
  if (!m.completed.includes(levelId)) m.completed.push(levelId)
  m.firstTry[key] = Math.max(m.firstTry[key] || 0, firstCorrect)
  data.modules[String(moduleId)] = m
  save(data)
  return m.stars[key]
}

/** 关卡是否解锁：第 1 关永远解锁，其余需要前一关通关。 */
function isLevelUnlocked(moduleId, levelId) {
  if (levelId <= 1) return true
  const m = load().modules[String(moduleId)]
  return !!(m && m.completed.includes(levelId - 1))
}

/** 某关当前星级（0 = 未通过）。 */
function getLevelStars(moduleId, levelId) {
  const m = load().modules[String(moduleId)]
  return (m && m.stars[String(levelId)]) || 0
}

/** 某模块已获星星总数。 */
function getModuleStars(moduleId) {
  const m = load().modules[String(moduleId)]
  if (!m) return 0
  return Object.values(m.stars).reduce((a, b) => a + b, 0)
}

module.exports = {
  errorResult,
  successResult,
  saveLevelResult,
  isLevelUnlocked,
  getLevelStars,
  getModuleStars,
}
