/* ============================================
   音效管理器 v2 - 夸张鼓励风格
   更响亮、更欢快、更有成就感
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

  // ========== 答对音效 ==========
  // 夸张的上升音阶 + 欢呼感
  correct() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    // 快速上升琶音 C-E-G-C（像庆祝）
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.15, 'square', 0.15), i * 60);
    });
    // 加一个低音"蹦"
    setTimeout(() => this._playTone(220, 0.1, 'sine', 0.3), 0);
    // 最后一个音拉长
    setTimeout(() => this._playTone(1047, 0.4, 'sine', 0.2), 300);
  },

  // ========== 答错音效 ==========
  // 温柔的"哦~"，不刺耳，鼓励再来
  wrong() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    // 下降音但柔和
    this._playTone(400, 0.25, 'sine', 0.2);
    setTimeout(() => this._playTone(320, 0.35, 'sine', 0.15), 200);
    // 加一个温柔的"叮"
    setTimeout(() => this._playTone(880, 0.1, 'triangle', 0.1), 500);
  },

  // ========== 点击音效 ==========
  click() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(900, 0.06, 'sine', 0.12);
    this._playTone(1200, 0.04, 'sine', 0.08);
  },

  // ========== 拖拽音效 ==========
  drag() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(500, 0.08, 'triangle', 0.12);
  },

  // ========== 通关音乐 ==========
  // 胜利号角！超级夸张
  levelComplete() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    // 第一段：快速上升
    const fanfare1 = [523, 523, 523, 698, 880, 784, 698, 880, 1047];
    const durations1 = [0.12, 0.12, 0.12, 0.12, 0.25, 0.12, 0.12, 0.25, 0.5];
    let time = 0;
    fanfare1.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, durations1[i], 'square', 0.12), time);
      setTimeout(() => this._playTone(freq * 0.5, durations1[i], 'sine', 0.15), time); // 低八度叠加
      time += durations1[i] * 800;
    });
    // 最后长音收尾
    setTimeout(() => {
      this._playTone(1047, 0.6, 'sine', 0.25);
      this._playTone(1319, 0.6, 'sine', 0.2);
      this._playTone(1568, 0.6, 'sine', 0.15);
    }, time + 100);
  },

  // ========== 星星音效 ==========
  // 魔法闪烁感
  star() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    const twinkle = [1200, 1500, 1800, 2400];
    twinkle.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.12, 'sine', 0.15 - i * 0.02), i * 80);
    });
  },

  // ========== 合并/吸附音效 ==========
  merge() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    // "啵"的一声
    this._playTone(600, 0.08, 'sine', 0.25);
    setTimeout(() => this._playTone(900, 0.12, 'sine', 0.2), 60);
    setTimeout(() => this._playTone(1200, 0.15, 'triangle', 0.15), 100);
  },

  // ========== 拆分音效 ==========
  split() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(800, 0.08, 'sine', 0.2);
    setTimeout(() => this._playTone(500, 0.12, 'sine', 0.18), 60);
  },

  // ========== 连续答对奖励音 ==========
  // 每连续答对3题触发，越来越嗨
  combo(streak) {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    const baseFreq = 600 + streak * 100;
    // 快速上升音阶
    for (let i = 0; i < streak; i++) {
      setTimeout(() => {
        this._playTone(baseFreq + i * 150, 0.1, 'square', 0.1);
        this._playTone((baseFreq + i * 150) * 1.5, 0.1, 'sine', 0.08);
      }, i * 50);
    }
    // 最后"叮！"
    setTimeout(() => this._playTone(2000, 0.2, 'sine', 0.2), streak * 50);
  },

  // ========== 鼓励音效 ==========
  // "加油！"的感觉
  encourage() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    // 跳跃的音符
    this._playTone(523, 0.12, 'triangle', 0.2);
    setTimeout(() => this._playTone(659, 0.12, 'triangle', 0.2), 120);
    setTimeout(() => this._playTone(784, 0.12, 'triangle', 0.2), 240);
    setTimeout(() => this._playTone(1047, 0.25, 'triangle', 0.25), 360);
  },

  // ========== 开始游戏音效 ==========
  startGame() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    const notes = [392, 440, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.15, 'sine', 0.15), i * 80);
    });
  },

  // ========== 选对物品音效 ==========
  selectCorrect() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(880, 0.08, 'sine', 0.18);
    setTimeout(() => this._playTone(1100, 0.12, 'sine', 0.15), 70);
  },

  // ========== 空格填满音效 ==========
  fillCell() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    this._playTone(700, 0.06, 'sine', 0.15);
    setTimeout(() => this._playTone(1000, 0.08, 'triangle', 0.12), 50);
  },

  // ========== 十格框满音效 ==========
  tenFrameFull() {
    this.resume();
    if (!this.ctx || !this.enabled) return;
    // 欢快的完成音
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.2, 'sine', 0.2), i * 100);
    });
    setTimeout(() => this._playTone(1319, 0.4, 'sine', 0.25), 400);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  _playTone(freq, duration, type = 'sine', volume = 0.2) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + 0.01);
    } catch(e) {}
  }
};
