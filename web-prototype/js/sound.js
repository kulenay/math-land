/* ============================================
   音效管理器 - 用 Web Audio API 合成音效
   无需外部音频文件，纯代码生成
   ============================================ */

const SoundManager = {
  ctx: null,
  enabled: true,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // 答对音效 - 上升音阶
  correct() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.15, 'sine', 0.3), i * 100);
    });
  },

  // 答错音效 - 轻柔下降
  wrong() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(330, 0.2, 'sine', 0.2);
    setTimeout(() => this._playTone(262, 0.3, 'sine', 0.15), 150);
  },

  // 点击音效
  click() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(800, 0.05, 'sine', 0.1);
  },

  // 拖拽音效
  drag() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(440, 0.08, 'sine', 0.1);
  },

  // 通关音乐
  levelComplete() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    const notes = [523, 587, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.2, 'sine', 0.25), i * 120);
    });
  },

  // 星星音效
  star() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(1200, 0.1, 'sine', 0.15);
    setTimeout(() => this._playTone(1500, 0.15, 'sine', 0.2), 100);
  },

  // 组合音效 - 合并
  merge() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(440, 0.1, 'triangle', 0.2);
    setTimeout(() => this._playTone(660, 0.15, 'triangle', 0.25), 80);
  },

  // 拆分音效
  split() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(660, 0.1, 'triangle', 0.2);
    setTimeout(() => this._playTone(440, 0.15, 'triangle', 0.25), 80);
  },

  _playTone(freq, duration, type = 'sine', volume = 0.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};
