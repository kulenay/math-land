// ============================================
// 游戏页：答题 / 反馈 / 结算
// 交互规则（设计定稿）：
//   - 星级制 + 不失败：答错温和提示、原地重试直到答对
//   - 星级 = 首答正确率（3 星全对 / 2 星 >=80% / 1 星通关）
//   - 构建题（十格阵 / 喂跳跳）无对错，完成即成功；中途改过则不计首答
// ============================================
const levels = require('../../modules/count/levels');
const questions = require('../../modules/count/questions');
const renderers = require('../../modules/count/renderers');
const storage = require('../../core/storage');
const sound = require('../../core/sound');
const star = require('../../core/star');

Page({
  data: {
    statusBarHeight: 20,
    moduleId: '1',
    levelId: 1,
    levelName: '',
    total: 0,
    questionIndex: 0,
    progress: 0,
    view: null,
    isChoice: true,     // 是否为选择题（true=点选项，false=构建题）
    locked: false,
    wrongOptions: {},   // 已试错的选项 key -> true
    plateHas: {},       // feed：虫索引 -> true（在盘上）
    feedback: null,     // { type: 'correct'|'wrong', text }
    frogMood: '😊',
    frogText: '',
    result: null,
    starList: [],
    hasNext: false,
    soundOn: true,
  },

  onLoad(options) {
    sound.init();
    const moduleId = options.module || '1';
    const levelId = parseInt(options.level || '1', 10);
    const level = levels.getLevel(moduleId, levelId);
    if (!level) {
      wx.showToast({ title: '关卡不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 900);
      return;
    }
    this.moduleId = moduleId;
    this.level = level;
    this.qs = questions.generateLevel(level);
    this.qIndex = 0;
    this.firstCorrect = 0;
    this.setData({
      moduleId,
      levelId,
      levelName: level.name,
      total: level.questionCount,
      statusBarHeight: getApp().globalData.statusBarHeight,
      soundOn: getApp().globalData.soundOn,
    });
    this.showQuestion();
  },

  showQuestion() {
    const q = this.qs[this.qIndex];
    const view = renderers.buildView(q);
    const isChoice = q.type !== 'tenframe' && q.type !== 'feed' && q.type !== 'match';
    this.q = q;
    this.removedOnce = false;
    this.setData({
      view,
      isChoice,
      questionIndex: this.qIndex + 1,
      locked: false,
      wrongOptions: {},
      plateHas: {},
      feedback: null,
      frogMood: '😊',
      frogText: q.type === 'feed' ? '点虫虫放进盘子里' : '来试试吧！',
      progress: Math.round((this.qIndex / this.total) * 100),
    });
  },

  // ---------- 选择题：点选项 ----------
  onOptionTap(e) {
    if (this.data.locked) return;
    const key = String(e.currentTarget.dataset.key);
    if (this.data.wrongOptions[key]) return; // 已试错，禁点
    const q = this.q;
    const correct = q.type === 'compare'
      ? key === q.answer
      : parseInt(key, 10) === q.answer;

    if (correct) {
      const isFirstTry = Object.keys(this.data.wrongOptions).length === 0;
      if (isFirstTry) this.firstCorrect++;
      this.advance(isFirstTry);
    } else {
      sound.play('wrong');
      this.setData({
        wrongOptions: { ...this.data.wrongOptions, [key]: true },
        locked: true,
        feedback: { type: 'wrong', text: '再数数看～' },
        frogMood: '🤗',
        frogText: '再数数看，慢慢来',
      });
      setTimeout(() => this.setData({ locked: false, feedback: null }), 700);
    }
  },

  // ---------- match：直接点堆 ----------
  onGroupTap(e) {
    if (this.data.locked) return;
    const key = String(e.currentTarget.dataset.key);
    if (this.data.wrongOptions[key]) return;
    if (parseInt(key, 10) === this.q.answerIndex) {
      const isFirstTry = Object.keys(this.data.wrongOptions).length === 0;
      if (isFirstTry) this.firstCorrect++;
      this.advance(isFirstTry);
    } else {
      sound.play('wrong');
      this.setData({
        wrongOptions: { ...this.data.wrongOptions, [key]: true },
        locked: true,
        feedback: { type: 'wrong', text: '再数数看～' },
        frogMood: '🤗',
        frogText: '这堆不是哦，再看看别的',
      });
      setTimeout(() => this.setData({ locked: false, feedback: null }), 700);
    }
  },

  // ---------- 十格阵：点格子填/取 ----------
  onCellTap(e) {
    if (this.data.locked) return;
    const view = this.data.view;
    const idx = e.currentTarget.dataset.index;
    const wasFilled = !!view.cells[idx];
    if (wasFilled) this.removedOnce = true; // 中途取出过
    const cells = view.cells.slice();
    cells[idx] = wasFilled ? 0 : 1;
    const filled = view.filled + (wasFilled ? -1 : 1);
    sound.play(wasFilled ? 'click' : 'pop');
    this.setData({ view: { ...view, cells, filled } });

    if (filled === view.target) {
      this.advance(!this.removedOnce);
    }
  },

  // ---------- 喂跳跳：点虫放盘 / 点盘放回 ----------
  onBugTap(e) {
    if (this.data.locked) return;
    const view = this.data.view;
    const idx = e.currentTarget.dataset.index;
    const onPlate = view.plate.includes(idx);
    let plate;
    if (onPlate) {
      plate = view.plate.filter((i) => i !== idx);
      this.removedOnce = true;
      sound.play('click');
    } else {
      if (view.plate.length >= view.target) return; // 已够，不能再放
      plate = [...view.plate, idx];
      sound.play('pop');
    }
    const plateHas = {};
    plate.forEach((i) => { plateHas[i] = true; });
    this.setData({ view: { ...view, plate }, plateHas });

    if (plate.length === view.target) {
      this.advance(!this.removedOnce);
    }
  },

  // ---------- 答对推进 ----------
  advance(isFirstTry) {
    this.setData({
      locked: true,
      feedback: { type: 'correct', text: isFirstTry ? '答对啦！' : '真棒！' },
      frogMood: '🎉',
      frogText: isFirstTry ? '太棒啦！' : '对了！继续加油',
    });
    sound.play('correct');
    setTimeout(() => {
      this.qIndex++;
      if (this.qIndex >= this.total) {
        this.finishLevel();
      } else {
        this.showQuestion();
      }
    }, 900);
  },

  // ---------- 通关结算 ----------
  finishLevel() {
    const stars = star.computeStars(this.firstCorrect, this.total);
    storage.saveLevelResult(this.moduleId, this.level.id, stars, this.firstCorrect);
    sound.play('win');
    const all = levels.getAllLevels(this.moduleId);
    const hasNext = this.level.id < all.length;
    this.setData({
      locked: true,
      feedback: null,
      result: {
        levelName: this.level.name,
        correct: this.firstCorrect,
        total: this.total,
      },
      starList: Array.from({ length: stars }, (_, i) => i),
      hasNext,
      frogMood: '🏆',
      frogText: '通关啦！',
    });
    // 星星逐个弹出音效
    for (let i = 0; i < stars; i++) {
      setTimeout(() => sound.play('star'), 500 + i * 350);
    }
  },

  onRetry() {
    this.qs = questions.generateLevel(this.level);
    this.qIndex = 0;
    this.firstCorrect = 0;
    this.showQuestion();
  },

  onNext() {
    wx.redirectTo({
      url: `/pages/game/game?module=${this.moduleId}&level=${this.level.id + 1}`,
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onBackMap() {
    wx.navigateBack();
  },

  onToggleSound() {
    const on = !this.data.soundOn;
    sound.setEnabled(on);
    getApp().globalData.soundOn = on;
    this.setData({ soundOn: on });
    if (on) sound.play('click');
  },

  onHide() {
    sound.stopAll();
  },

  onUnload() {
    sound.stopAll();
  },
});
