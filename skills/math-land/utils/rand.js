// ============================================
// core/rand.js - 公共随机工具（多模块共用）
// ============================================

function randInt(min, max) {
  // 防御：非法参数（NaN/undefined）回退到安全范围，min>max 时交换
  if (!Number.isFinite(min)) min = 1;
  if (!Number.isFinite(max)) max = 10;
  if (min > max) { const t = min; min = max; max = t; }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFrom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

/**
 * 生成 4 个选项（含正确答案），邻近数字为主、远数字为辅。
 * @param {number} correct 正确答案
 * @param {number} spread 干扰数字偏离范围
 * @param {number} minVal 选项最小值（默认 1）
 */
function genOptions(correct, spread = 3, minVal = 1) {
  if (!Number.isFinite(correct)) correct = 5; // 防御：NaN 永不匹配，会死循环
  if (!Number.isFinite(spread)) spread = 3;
  if (!Number.isFinite(minVal)) minVal = 1;
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < 4 && guard < 60) {
    guard++;
    const opt = Math.random() > 0.5
      ? correct + randInt(-2, 2)            // 邻近
      : correct + randInt(-spread, spread); // 稍远
    if (opt >= minVal && !set.has(opt)) set.add(opt);
  }
  let fallback = Math.max(correct + 5, 5);
  let guard2 = 0;
  while (set.size < 4 && guard2 < 100) {
    guard2++;
    const opt = randInt(minVal, fallback);
    if (!set.has(opt)) set.add(opt);
  }
  return shuffle(Array.from(set));
}

module.exports = { randInt, shuffle, pickFrom, genOptions };
