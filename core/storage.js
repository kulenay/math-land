// ============================================
// core/storage.js - 存档封装（纯本地）
// 结构：
// {
//   modules: {
//     "1": {
//       stars: { "1": 3, "2": 2, ... },   // 每关最高星级
//       completed: [1, 2, 3],             // 已通关关卡
//       firstTry: { "1": 6, ... }         // 每关首答正确数（记录，备用）
//     }
//   }
// }
// ============================================

const KEY = 'ml_progress_v1';

function load() {
  try {
    return wx.getStorageSync(KEY) || { modules: {} };
  } catch (e) {
    return { modules: {} };
  }
}

function save(data) {
  try {
    wx.setStorageSync(KEY, data);
  } catch (e) {
    // 存储失败（如空间满）静默处理
  }
}

/**
 * 保存关卡成绩。取历史最高星级。
 * @param {number} moduleId
 * @param {number} levelId
 * @param {number} stars 1~3
 * @param {number} firstCorrect 首答正确题数
 */
function saveLevelResult(moduleId, levelId, stars, firstCorrect) {
  const data = load();
  const m = data.modules[String(moduleId)] || { stars: {}, completed: [], firstTry: {} };
  const key = String(levelId);
  const oldStars = m.stars[key] || 0;
  m.stars[key] = Math.max(oldStars, stars);
  if (!m.completed.includes(levelId)) m.completed.push(levelId);
  m.firstTry[key] = Math.max(m.firstTry[key] || 0, firstCorrect);
  data.modules[String(moduleId)] = m;
  save(data);
  return m.stars[key];
}

/** 关卡是否解锁：第 1 关永远解锁，其余需要前一关通关。 */
function isLevelUnlocked(moduleId, levelId) {
  if (levelId <= 1) return true;
  const m = load().modules[String(moduleId)];
  return !!(m && m.completed.includes(levelId - 1));
}

/** 某关当前星级（0 = 未通过）。 */
function getLevelStars(moduleId, levelId) {
  const m = load().modules[String(moduleId)];
  return (m && m.stars[String(levelId)]) || 0;
}

/** 某模块已获星星总数。 */
function getModuleStars(moduleId) {
  const m = load().modules[String(moduleId)];
  if (!m) return 0;
  return Object.values(m.stars).reduce((a, b) => a + b, 0);
}

/** 清空全部进度（调试/重置用）。 */
function resetAll() {
  save({ modules: {} });
}

/** 调试用：解锁某模块全部关卡并给满星（连点主页跳跳触发）。 */
function unlockAll(moduleId) {
  const data = load();
  const m = data.modules[String(moduleId)] || { stars: {}, completed: [], firstTry: {} };
  const mod = require('../modules/index').get(moduleId);
  if (!mod) return;
  mod.impl.levels.getAllLevels(moduleId).forEach((l) => {
    m.stars[String(l.id)] = 3;
    if (!m.completed.includes(l.id)) m.completed.push(l.id);
    m.firstTry[String(l.id)] = m.firstTry[String(l.id)] || 6;
  });
  data.modules[String(moduleId)] = m;
  save(data);
}

module.exports = {
  saveLevelResult,
  isLevelUnlocked,
  getLevelStars,
  getModuleStars,
  resetAll,
  unlockAll,
};
