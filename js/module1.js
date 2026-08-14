/* ============================================
   模块一：感知数量（数一数）v2
   更多鼓励反馈、连击奖励、夸张动画
   ============================================ */

const Module1 = {
  name: '数一数',
  emoji: '👀',
  levels: [
    { id: 1, name: '认识1-5', desc: '这是多少？', min: 1, max: 5, type: 'estimate' },
    { id: 2, name: '认识6-10', desc: '数量感知', min: 6, max: 10, type: 'estimate' },
    { id: 3, name: '十格框', desc: '凑满十个', min: 1, max: 10, type: 'tenframe' },
    { id: 4, name: '11-20数数', desc: '更大的数', min: 11, max: 20, type: 'estimate' },
    { id: 5, name: '估数挑战', desc: '混合练习', min: 1, max: 20, type: 'mixed' }
  ],

  items: ['🍎', '🍬', '🌟', '🐟', '🎈', '🍊', '🌸', '🐝'],

  // 鼓励语（答对时随机显示）
  encourageMessages: [
    '太棒了！', '真厉害！', '你是天才！', '好聪明！',
    '跳跳为你骄傲！', '答对啦！', '真了不起！', '太强了！',
    '完美！', '就是这样！', '太厉害了！', '满分！'
  ],

  // 连击鼓励语
  comboMessages: [
    '连击！🔥', '超级连击！⚡', '无敌连击！💥', '全对！🎊'
  ],

  currentLevel: null,
  currentQuestion: null,
  score: 0,
  totalQuestions: 0,
  correctCount: 0,
  hearts: 3,
  streak: 0, // 连续答对次数

  startLevel(levelId) {
    this.currentLevel = this.levels.find(l => l.id === levelId);
    this.score = 0;
    this.correctCount = 0;
    this.hearts = 3;
    this.streak = 0;
    this.totalQuestions = 5;

    SoundManager.startGame();
    App.showScreen('game-screen');
    App.updateGameHeader(this.currentLevel.name, 0, this.totalQuestions);
    this.renderQuestion();
  },

  renderQuestion() {
    const area = document.getElementById('game-area');
    const level = this.currentLevel;
    const randomItem = this.items[Math.floor(Math.random() * this.items.length)];
    const correctAnswer = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    const options = this.generateOptions(correctAnswer, level.max);

    this.currentQuestion = {
      item: randomItem,
      answer: correctAnswer,
      options: options,
      checked: false
    };

    if (level.type === 'tenframe') {
      this.renderTenFrame(area, correctAnswer, randomItem);
    } else {
      this.renderEstimate(area, correctAnswer, randomItem, options);
    }
  },

  renderEstimate(area, count, item, options) {
    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">这堆${item}大约有多少？</div>
        </div>
        <div class="scatter-area" id="scatter-area"></div>
        ${this.streak >= 2 ? `<div class="streak-badge pop-in">🔥 ${this.streak}连击</div>` : ''}
        <div class="options-group">
    `;

    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}个</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    this.scatterItems('scatter-area', count, item);

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  scatterItems(containerId, count, item) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const itemSize = 32;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'scatter-item pop-in';
      el.textContent = item;
      el.style.animationDelay = `${i * 0.05}s`;
      el.style.fontSize = '28px';

      const x = 10 + Math.random() * (width - itemSize - 20);
      const y = 10 + Math.random() * (height - itemSize - 20);
      el.style.left = x + 'px';
      el.style.top = y + 'px';

      container.appendChild(el);
    }
  },

  renderTenFrame(area, count, item) {
    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">把${item}放满格子</div>
        </div>
        <div class="ten-frame" id="ten-frame">
    `;

    for (let i = 0; i < 10; i++) {
      html += `<div class="ten-frame-cell" data-index="${i}"></div>`;
    }

    html += `
        </div>
        <div class="counter-display">
          <span class="counter-label">已放入：</span>
          <span id="ten-frame-count">0</span> / 10
        </div>
      </div>
    `;

    area.innerHTML = html;

    const cells = area.querySelectorAll('.ten-frame-cell');
    let filledCount = 0;

    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        if (cell.classList.contains('filled')) {
          cell.classList.remove('filled');
          cell.textContent = '';
          filledCount--;
          SoundManager.split();
        } else if (filledCount < 10) {
          cell.classList.add('filled');
          cell.textContent = item;
          filledCount++;
          SoundManager.fillCell();
        }
        document.getElementById('ten-frame-count').textContent = filledCount;

        // 十格框满了
        if (filledCount === 10) {
          SoundManager.tenFrameFull();
          App.showFeedback('✨');
        }

        // 填了正确数量
        if (filledCount === count) {
          setTimeout(() => this.showArrange(area, count, item), 800);
        }
      });
    });
  },

  showArrange(area, count, item) {
    const verifyArea = document.createElement('div');
    verifyArea.className = 'verify-area pop-in';

    const rowInfo = count > 5 ? `排了1排多${count - 5}个` : `排了${count}个`;

    // 鼓励文字
    const msg = this.encourageMessages[Math.floor(Math.random() * this.encourageMessages.length)];

    verifyArea.innerHTML = `
      <div class="encourage-text">🎉 ${msg}</div>
      <div class="verify-text">就是${count}个${item}！</div>
      <div class="verify-breakdown">一排5个，${rowInfo}</div>
    `;
    area.appendChild(verifyArea);

    this.onCorrect();
  },

  generateOptions(correct, max) {
    const options = new Set([correct]);
    const range = Math.max(max + 5, 25);

    while (options.size < 4) {
      let opt;
      if (Math.random() > 0.5) {
        opt = correct + Math.floor(Math.random() * 5) - 2;
      } else {
        opt = Math.floor(Math.random() * range) + 1;
      }
      if (opt >= 1 && opt <= range && opt !== correct) {
        options.add(opt);
      }
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
  },

  checkAnswer(btn, value) {
    if (this.currentQuestion.checked) return;
    this.currentQuestion.checked = true;

    const correct = value === this.currentQuestion.answer;

    if (correct) {
      btn.classList.add('correct');
      this.onCorrect();
    } else {
      btn.classList.add('wrong');
      this.streak = 0; // 答错重置连击
      this.onWrong();

      document.querySelectorAll('.option-btn').forEach(b => {
        if (parseInt(b.dataset.value) === this.currentQuestion.answer) {
          b.classList.add('correct');
        }
      });
    }

    document.querySelectorAll('.option-btn').forEach(b => {
      b.style.pointerEvents = 'none';
    });
  },

  onCorrect() {
    this.correctCount++;
    this.streak++;

    // 音效：连击越多越嗨
    if (this.streak >= 3) {
      SoundManager.combo(this.streak);
    } else {
      SoundManager.correct();
    }

    // 反馈动画：连击显示不同emoji
    let emoji = '🎉';
    let msg = this.encourageMessages[Math.floor(Math.random() * this.encourageMessages.length)];

    if (this.streak >= 5) {
      emoji = '🏆';
      msg = '无敌了！';
    } else if (this.streak >= 3) {
      emoji = '🔥';
      msg = this.comboMessages[Math.min(this.streak - 3, this.comboMessages.length - 1)];
    }

    App.showFeedback(emoji, msg);
    App.updateGameHeader(this.currentLevel.name, this.correctCount, this.totalQuestions);

    setTimeout(() => {
      this.score++;
      if (this.correctCount >= this.totalQuestions) {
        this.completeLevel();
      } else {
        this.renderQuestion();
      }
    }, 1200);
  },

  onWrong() {
    this.hearts--;
    SoundManager.wrong();
    App.updateHearts(this.hearts);

    // 答错也给鼓励
    const wrongEmojis = ['🤔', '💪', '😊', '🌈'];
    const wrongMsgs = ['再想想哦~', '没关系，继续加油！', '跳跳相信你！', '下一题一定行！'];
    const emoji = wrongEmojis[Math.floor(Math.random() * wrongEmojis.length)];
    const msg = wrongMsgs[Math.floor(Math.random() * wrongMsgs.length)];
    App.showFeedback(emoji, msg);

    if (this.hearts <= 0) {
      setTimeout(() => this.failLevel(), 1200);
      return;
    }

    setTimeout(() => this.renderQuestion(), 1500);
  },

  completeLevel() {
    const stars = this.hearts === 3 ? 3 : (this.hearts === 2 ? 2 : 1);
    SoundManager.levelComplete();
    App.saveProgress(1, this.currentLevel.id, stars);

    setTimeout(() => {
      App.showResult(stars, this.correctCount, this.totalQuestions);
    }, 600);
  },

  failLevel() {
    SoundManager.encourage();
    App.showResult(0, this.correctCount, this.totalQuestions);
  }
};
