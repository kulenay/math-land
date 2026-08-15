// ============================================
// core/sound.js - 音效管理（InnerAudioContext）
// 每个音效一个实例，播放前先 stop，避免叠加。
// playTimes 支持连播（听音数数题型用）。
// ============================================

const NAMES = ['click', 'pop', 'correct', 'wrong', 'star', 'win'];

const instances = {};
const pendingTimers = [];
let enabled = true;

function init() {
  NAMES.forEach((name) => {
    const ctx = wx.createInnerAudioContext();
    ctx.src = `/assets/sounds/${name}.wav`;
    ctx.volume = name === 'wrong' ? 0.7 : 1; // 答错音更柔和
    instances[name] = ctx;
  });
}

/** 播放音效（尊重开关）。 */
function play(name) {
  if (!enabled || !instances[name]) return;
  const ctx = instances[name];
  try {
    ctx.stop();
    ctx.play();
  } catch (e) {
    // 音频异常时静默
  }
}

/**
 * 顺序连播 N 次音效（听音数数）。
 * @param {string} name 音效名
 * @param {number} count 播放次数
 * @param {number} interval 间隔 ms
 */
function playTimes(name, count, interval = 600) {
  if (!enabled || !instances[name]) return;
  const n = Number.isFinite(count) ? Math.max(1, Math.min(12, Math.floor(count))) : 1;
  for (let i = 0; i < n; i++) {
    pendingTimers.push(setTimeout(() => play(name), i * interval));
  }
}

function setEnabled(on) {
  enabled = !!on;
  wx.setStorageSync('ml_settings', { soundOn: enabled });
}

function isEnabled() {
  return enabled;
}

/** 停止所有音效 + 清除连播定时器（页面隐藏/卸载时调用，避免残留）。 */
function stopAll() {
  pendingTimers.splice(0).forEach(clearTimeout);
  Object.values(instances).forEach((ctx) => {
    try {
      ctx.stop();
    } catch (e) {
      // 忽略
    }
  });
}

module.exports = { init, play, playTimes, setEnabled, isEnabled, stopAll };
