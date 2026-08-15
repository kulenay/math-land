// ============================================
// 游戏页：答题 / 反馈 / 结算
// 交互规则（设计定稿）：
//   - 星级制 + 不失败：答错温和提示、原地重试直到答对
//   - 星级 = 首答正确率（3 星全对 / 2 星 >=80% / 1 星通关）
//   - 构建题（十格阵 / 喂跳跳）无对错，完成即成功；中途改过则不计首答
// ============================================
const modules = require('../../modules/index.js');
const storage = require('../../core/storage.js');
const sound = require('../../core/sound.js');
const star = require('../../core/star.js');
const sprites = require('../../core/sprites.js');

// ============================================
// 跳跳反馈词库：随机取词防连续重复，反馈更有温度
// ============================================
const FROG_WORDS = {
  correct: ['太棒啦！', '真厉害！', '答对啦！', '哇，好聪明！', '没错，就是它！', '棒棒哒！'],
  correctRetry: ['对了！继续加油', '真棒！再来一题', '答对啦，坚持住！'],
  wrong: ['再数数看，慢慢来', '没关系，再试试', '深呼吸，再看一眼', '你一定可以的'],
  groupWrong: ['这堆不是哦，再看看别的', '再数数看，找找那一堆'],
  pickWrong: ['这两个数凑不成 10 哦', '再想想哪两个数凑成 10'],
  complete: ['通关啦！', '完成咯！', '好样的，全部过关！'],
  guide: ['来试试吧！', '准备好了吗？', '一起数一数吧！'],
};

/** 随机取词，避免与上一次相同（列表 ≤1 时直接返回） */
function pickWord(list, last) {
  if (!list || !list.length) return '';
  if (list.length <= 1) return list[0];
  let w = list[Math.floor(Math.random() * list.length)];
  while (w === last) {
    w = list[Math.floor(Math.random() * list.length)];
  }
  return w;
}

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
    correctKey: null,   // 答对时短暂高亮的选项 key
    plateHas: {},       // feed：虫索引 -> true（在盘上）
    picked: {},        // pair/split：第一次选中的 { key, value }（恒为对象，避免 WXML null 访问）
    matched: {},        // pair：已配对的选项 key -> true
    shakeKey: null,     // 配对失败的抖动提示 key
    feedback: null,     // { type: 'correct'|'wrong', text }
    frogMood: '😊',
    frogText: '',
    sprite: null,       // 答对时的数字精灵 viewModel（庆祝动画）
    result: null,
    starList: [],
    hasNext: false,
    soundOn: true,
  },

  onLoad(options) {
    sound.init();
    const moduleId = options.module || '1';
    const levelId = parseInt(options.level || '1', 10);
    const mod = modules.get(moduleId);
    if (!mod) {
      wx.showToast({ title: '模块不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 900);
      return;
    }
    const level = mod.impl.levels.getLevel(moduleId, levelId);
    if (!level) {
      wx.showToast({ title: '关卡不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 900);
      return;
    }
    this.moduleId = moduleId;
    this.mod = mod;
    this.level = level;
    this.total = level.questionCount;
    this.qs = mod.impl.questions.generateLevel(level);
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

  // 跳跳说话：随机取词并记录，避免连续重复
  pickFrog(list) {
    this._lastFrog = pickWord(list, this._lastFrog);
    return this._lastFrog;
  },

  showQuestion() {
    const q = this.qs[this.qIndex];
    const view = this.mod.impl.renderers.buildView(q);
    // 选择题白名单（渲染底部选项区）；其余走构建/点选交互
    const CHOICE_TYPES = ['scatter', 'order', 'subitize', 'compare', 'group', 'completen', 'make10', 'bus', 'share', 'shop', 'queue', 'soundcount', 'sign', 'clock', 'coin', 'money', 'pay'];
    const isChoice = CHOICE_TYPES.includes(q.type);
    this.q = q;
    this.removedOnce = false;
    this._pickMistake = false;
    this.setData({
      view,
      isChoice,
      questionIndex: this.qIndex + 1,
      locked: false,
      wrongOptions: {},
      correctKey: null,
      plateHas: {},
      picked: {},
      matched: {},
      shakeKey: null,
      feedback: null,
      sprite: null,
      result: null,
      starList: [],
      frogMood: '😊',
      frogText: q.type === 'feed' ? '点虫虫放进盘子里' : this.pickFrog(FROG_WORDS.guide),
      progress: Math.round((this.qIndex / this.total) * 100),
    });
    // 听音数数：题目出现后自动播放一次
    if (q.type === 'soundcount') {
      setTimeout(() => sound.playTimes('click', q.count, 600), 400);
    }
  },

  // ---------- scatter 新交互：框选计数 ----------
  // 选区状态：{ visible, startX, startY, left, top, width, height, wrong }
  scatterTouchStart(e) {
    if (this.data.locked) return;
    if (this.data.view.type !== 'scatter' || this.data.view.interactionMode !== 'drag-select') return;
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    this._scatterTouchStart = { x: startX, y: startY, time: Date.now() };
    // 重置所有项选中/飞行状态（避免 ...item spread 触发 babel runtime）
    const resetScatter = this.data.view.scatter.map(function (item) {
      return Object.assign({}, item, { selected: false, flown: false });
    });
    this.setData({
      scatterSelectRect: { visible: true, left: 0, top: 0, width: 0, height: 0, wrong: false },
      'view.scatter': resetScatter,
      scatterNumberPopup: { visible: false, number: 0, delay: 0 },
    });
  },

  scatterTouchMove(e) {
    if (this.data.locked || !this._scatterTouchStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this._scatterTouchStart.x;
    const dy = touch.clientY - this._scatterTouchStart.y;
    // 用 selectQuery 获取 scatter-area 真实宽高，换算为百分比坐标
    // 这里先用屏幕宽度近似，后续可优化
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const pctX = (dx / screenWidth) * 100;
    const pctY = (dy / screenWidth) * 100;
    const left = Math.min(0, pctX);
    const top = Math.min(0, pctY);
    const width = Math.abs(pctX);
    const height = Math.abs(pctY);
    this.setData({
      scatterSelectRect: { visible: true, left: left, top: top, width: width, height: height, wrong: false },
    });
    this._updateScatterSelection(left, top, width, height);
  },

  scatterTouchEnd(e) {
    if (this.data.locked || !this._scatterTouchStart) return;
    const duration = Date.now() - this._scatterTouchStart.time;
    this._scatterTouchStart = null;
    if (duration < 100) {
      this.setData({ scatterSelectRect: { visible: false, left: 0, top: 0, width: 0, height: 0, wrong: false } });
      return;
    }
    var selectedCount = 0;
    for (var i = 0; i < this.data.view.scatter.length; i++) {
      if (this.data.view.scatter[i].selected) selectedCount++;
    }
    var correctCount = this.data.view.answer;
    if (selectedCount === correctCount && selectedCount > 0) {
      this._triggerScatterFlyIn(selectedCount);
    } else {
      this._triggerScatterWrong(selectedCount, correctCount);
    }
  },

  scatterTouchCancel(e) {
    this._scatterTouchStart = null;
    this.setData({ scatterSelectRect: { visible: false, left: 0, top: 0, width: 0, height: 0, wrong: false } });
  },

  // 更新框选内的物品选中状态
  _updateScatterSelection(left, top, width, height) {
    var scatter = this.data.view.scatter;
    var right = left + width;
    var bottom = top + height;
    var updated = scatter.map(function (item) {
      var inRect = item.x >= left && item.x <= right && item.y >= top && item.y <= bottom;
      if (inRect !== item.selected) {
        return Object.assign({}, item, { selected: inRect });
      }
      return item;
    });
    this.setData({ 'view.scatter': updated });
  },

  // 答对：选中项飞向中心聚合，弹出数字
  _triggerScatterFlyIn(count) {
    var scatter = this.data.view.scatter;
    var centerX = 50;
    var centerY = 50;
    var flownScatter = scatter.map(function (item) {
      if (!item.selected) return item;
      var dx = centerX - item.x;
      var dy = centerY - item.y;
      // 关键：先设置 from 状态（flyScale=1, flyOpacity=1, flyTx=0, flyTy=0），下一帧再过渡到目标
      return Object.assign({}, item, {
        flown: true,
        flyTx: 0,
        flyTy: 0,
        flyScale: 1,
        flyOpacity: 1,
        flyDuration: 0,
        // 目标值存放在 data- 属性供 setTimeout 后应用
        _targetTx: dx,
        _targetTy: dy,
        _targetScale: 0.3,
        _targetOpacity: 0,
        _targetDuration: 500,
      });
    });
    this.setData({ 'view.scatter': flownScatter });
    sound.play('pop');
    var self = this;
    // 下一帧应用真正的目标值，触发 CSS transition
    setTimeout(function () {
      var toFly = self.data.view.scatter.map(function (item) {
        if (!item.selected) return item;
        return Object.assign({}, item, {
          flyTx: item._targetTx,
          flyTy: item._targetTy,
          flyScale: item._targetScale,
          flyOpacity: item._targetOpacity,
          flyDuration: item._targetDuration,
        });
      });
      self.setData({ 'view.scatter': toFly });
    }, 16);
    // 动画结束后显示数字
    setTimeout(function () {
      self.setData({
        scatterNumberPopup: { visible: true, number: count, delay: 0 },
        scatterSelectRect: { visible: false, left: 0, top: 0, width: 0, height: 0, wrong: false },
      });
      sound.play('correct');
      setTimeout(function () {
        var isFirstTry = Object.keys(self.data.wrongOptions).length === 0;
        if (isFirstTry) self.firstCorrect++;
        self.advance(isFirstTry);
      }, 600);
    }, 550);
  },

  // 答错：选区变红抖动，跳跳鼓励
  _triggerScatterWrong(selectedCount, correctCount) {
    sound.play('wrong');
    var rect = Object.assign({}, this.data.scatterSelectRect, { wrong: true });
    this.setData({
      locked: true,
      scatterSelectRect: rect,
      feedback: { type: 'wrong', text: selectedCount === 0 ? '框选一下试试～' : '数到了 ' + selectedCount + ' 个，再数数看' },
      frogMood: '🤗',
      frogText: this.pickFrog(FROG_WORDS.wrong),
    });
    var self = this;
    setTimeout(function () {
      var resetScatter = self.data.view.scatter.map(function (item) {
        return Object.assign({}, item, { selected: false });
      });
      self.setData({
        locked: false,
        scatterSelectRect: { visible: false, left: 0, top: 0, width: 0, height: 0, wrong: false },
        feedback: null,
        'view.scatter': resetScatter,
      });
    }, 1000);
  },

  // ---------- 选择题：点选项 ----------
  onOptionTap(e) {
    if (this.data.locked) return;
    const key = String(e.currentTarget.dataset.key);
    if (this.data.wrongOptions[key]) return; // 已试错，禁点
    const q = this.q;
    // 字符串答案（compare 左右 / sign 符号 / clock 时间 / coin·money 金额 / pay 够不够）
    // 与数字答案（parseInt）统一处理
    const correct = typeof q.answer === 'string'
      ? key === q.answer
      : parseInt(key, 10) === q.answer;

    if (correct) {
      const isFirstTry = Object.keys(this.data.wrongOptions).length === 0;
      if (isFirstTry) this.firstCorrect++;
      // 答对选项短暂高亮（正面反馈，900ms 后随下一题清除）
      this.setData({ correctKey: key });
      this.advance(isFirstTry);
    } else {
      sound.play('wrong');
      const wo = Object.assign({}, this.data.wrongOptions);
      wo[key] = true;
      this.setData({
        wrongOptions: wo,
        locked: true,
        feedback: { type: 'wrong', text: '再数数看～' },
        frogMood: '🤗',
        frogText: this.pickFrog(FROG_WORDS.wrong),
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
      this.setData({ correctKey: key }); // 点中的堆短暂高亮
      this.advance(isFirstTry);
    } else {
      sound.play('wrong');
      const wo = Object.assign({}, this.data.wrongOptions);
      wo[key] = true;
      this.setData({
        wrongOptions: wo,
        locked: true,
        feedback: { type: 'wrong', text: '再数数看～' },
        frogMood: '🤗',
        frogText: this.pickFrog(FROG_WORDS.groupWrong),
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
    const newView = Object.assign({}, view, { cells, filled });
    this.setData({ view: newView });

    if (filled === view.target) {
      const isFirstTry = !this.removedOnce;
      if (isFirstTry) this.firstCorrect++;
      this.advance(isFirstTry);
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
      plate = view.plate.concat(idx);
      sound.play('pop');
    }
    const plateHas = {};
    plate.forEach((i) => { plateHas[i] = true; });
    const newView = Object.assign({}, view, { plate });
    this.setData({ view: newView, plateHas });

    if (plate.length === view.target) {
      const isFirstTry = !this.removedOnce;
      if (isFirstTry) this.firstCorrect++;
      this.advance(isFirstTry);
    }
  },

  // ---------- pair/split/neighbor/splitnum：点两个数 ----------
  // 判定模式：pair 配对凑 10；split/splitnum 两数和 = target（sum）；
  //           neighbor 两数恰为前后邻居（set）。
  onPickTap(e) {
    if (this.data.locked) return;
    const key = String(e.currentTarget.dataset.key);
    const q = this.q;
    if (q.type === 'pair' && this.data.matched[key]) return; // 已配对不可再点
    const picked = this.data.picked;

    // 第一次选择 / 取消选择
    if (!picked.key) {
      this.setData({ picked: { key, value: parseInt(key, 10) } });
      sound.play('click');
      return;
    }
    if (picked.key === key) {
      this.setData({ picked: {} });
      sound.play('click');
      return;
    }

    const val2 = parseInt(key, 10);

    if (q.type === 'pair') {
      if (picked.value + val2 === 10) {
        const matched = Object.assign({}, this.data.matched);
        matched[picked.key] = true;
        matched[key] = true;
        sound.play('pop');
        this.setData({ picked: {}, matched });
        const allMatched = q.options.every((o) => matched[String(o)]);
        if (allMatched) {
          const isFirstTry = !this._pickMistake;
          if (isFirstTry) this.firstCorrect++;
          setTimeout(() => this.advance(isFirstTry), 400);
        }
      } else {
        this.pickWrong(picked.key, '它们凑不成 10 哦', '找找加起来等于 10 的两个数');
      }
      return;
    }

    // sum 模式：两数和 = target（split 默认 10，splitnum 为 total）
    // set 模式：两数恰为 pair 的两个（neighbor）
    let correct = false;
    if (q.mode === 'set') {
      const got = [picked.value, val2].sort((a, b) => a - b);
      const want = q.pair.slice().sort((a, b) => a - b);
      correct = got[0] === want[0] && got[1] === want[1];
    } else {
      const target = q.target || 10;
      correct = picked.value + val2 === target;
    }

    if (correct) {
      const isFirstTry = !this._pickMistake;
      if (isFirstTry) this.firstCorrect++;
      this.advance(isFirstTry);
    } else if (q.mode === 'set') {
      this.pickWrong(picked.key, '再想想，它的邻居是谁？', `${q.n} 的邻居是 ${q.n - 1} 和 ${q.n + 1} 哦`);
    } else {
      const target = q.target || 10;
      this.pickWrong(picked.key, `再想想哪两个数凑成 ${target}`, `${target} 可以分成哪两个数？`);
    }
  },

  // 听音数数：再听一次（重听不扣首答）
  onReplaySound() {
    if (this.data.locked) return;
    const q = this.q;
    if (!q || q.type !== 'soundcount') return;
    sound.playTimes('click', q.count, 600);
  },

  // 选两数答错：抖动提示 + 重置选择 + 提示自动消退
  pickWrong(shakeKey, text, frogText) {
    this._pickMistake = true;
    sound.play('wrong');
    this.setData({
      picked: {},
      shakeKey,
      feedback: { type: 'wrong', text },
      frogMood: '🤗',
      frogText,
    });
    // 只清抖动标记；错误提示 1.2s 后自动消退，
    // 且仅当当前 feedback 仍为本条 wrong 提示时才清除，避免竞态误清答对的正确反馈
    setTimeout(() => this.setData({ shakeKey: null }), 700);
    setTimeout(() => {
      const cur = this.data.feedback;
      if (cur && cur.type === 'wrong' && cur.text === text) {
        this.setData({ feedback: null });
      }
    }, 1200);
  },

  // ---------- 答对推进 ----------
  advance(isFirstTry) {
    // 答对数字 N（1~10）时，数字精灵 N 跳出来庆祝（纯粹的即时反馈）
    // 选择题取 q.answer；构建题（十格阵/喂跳跳）取 view.target（完成的数量）
    let ans = this.q && this.q.answer;
    if (!(typeof ans === 'number' && ans >= 1 && ans <= 10)) {
      const t = this.data.view && this.data.view.target;
      if (typeof t === 'number' && t >= 1 && t <= 10) ans = t;
    }
    let sprite = null;
    if (typeof ans === 'number' && ans >= 1 && ans <= 10) {
      sprite = sprites.getSprite(ans);
    }
    this.setData({
      locked: true,
      sprite,
      feedback: { type: 'correct', text: isFirstTry ? '答对啦！' : '真棒！' },
      frogMood: '🎉',
      frogText: this.pickFrog(isFirstTry ? FROG_WORDS.correct : FROG_WORDS.correctRetry),
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
    const oldStars = storage.getLevelStars(this.moduleId, this.level.id);
    const stars = star.computeStars(this.firstCorrect, this.total);
    storage.saveLevelResult(this.moduleId, this.level.id, stars, this.firstCorrect);
    sound.play('win');
    const all = this.mod.impl.levels.getAllLevels(this.moduleId);
    const hasNext = this.level.id < all.length;
    const isPerfect = stars === 3 && oldStars < 3; // 首次满星：特别表现
    this.setData({
      locked: true,
      feedback: null,
      result: {
        levelName: this.level.name,
        correct: this.firstCorrect,
        total: this.total,
        perfect: isPerfect,
        title: isPerfect ? '完美通关！' : `${this.level.name} 完成！`,
      },
      starList: Array.from({ length: stars }, (_, i) => i),
      hasNext,
      progress: 100,
      frogMood: isPerfect ? '🌟' : '🏆',
      frogText: this.pickFrog(FROG_WORDS.complete),
    });
    // 星星逐个弹出音效
    for (let i = 0; i < stars; i++) {
      setTimeout(() => sound.play('star'), 500 + i * 350);
    }
    // 自动跳转：展示星星后自动进下一关 / 回地图（按钮仍可提前点击）
    this.clearAutoJump();
    this._autoJumpTimer = setTimeout(() => {
      if (hasNext) {
        this.onNext();
      } else {
        this.onBackMap();
      }
    }, 2400);
  },

  clearAutoJump() {
    if (this._autoJumpTimer) {
      clearTimeout(this._autoJumpTimer);
      this._autoJumpTimer = null;
    }
  },

  onRetry() {
    this.clearAutoJump();
    this.qs = this.mod.impl.questions.generateLevel(this.level);
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
    this.clearAutoJump();
    sound.stopAll();
  },

  onUnload() {
    this.clearAutoJump();
    sound.stopAll();
  },
});
