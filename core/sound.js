// ============================================
// core/sound.js - 音效管理（InnerAudioContext）
// 每个音效一个实例，播放前先 stop，避免叠加。
// ============================================

const NAMES = ['click', 'pop', 'correct', 'wrong', 'star', 'win'];

const instances = {};
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

function setEnabled(on) {
  enabled = !!on;
  wx.setStorageSync('ml_settings', { soundOn: enabled });
}

function isEnabled() {
  return enabled;
}

/** 停止所有音效（页面隐藏/卸载时调用，避免残留）。 */
function stopAll() {
  Object.values(instances).forEach((ctx) => {
    try {
      ctx.stop();
    } catch (e) {
      // 忽略
    }
  });
}

module.exports = { init, play, setEnabled, isEnabled, stopAll };
