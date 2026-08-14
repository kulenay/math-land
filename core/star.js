// ============================================
// core/star.js - 星级判定
// 规则（设计定稿）：
//   - 全对            -> 3 星
//   - 首答正确率 >= 80% -> 2 星
//   - 通关            -> 1 星
// 每关题数由关卡配置决定，规则按比例计算。
// ============================================

/**
 * @param {number} firstCorrect 首答正确的题数
 * @param {number} total 总题数
 * @returns {number} 1 ~ 3
 */
function computeStars(firstCorrect, total) {
  if (total <= 0) return 1;
  if (firstCorrect >= total) return 3;
  if (firstCorrect / total >= 0.8) return 2;
  return 1;
}

module.exports = { computeStars };
