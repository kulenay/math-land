/* ============================================
   模块四：进退位感知（过河冒险）
   理解加法进位和减法退位的本质
   ============================================ */

const Module4 = {
  name: '过河冒险',
  emoji: '🌉',
  levels: [
    { id: 16, name: '合十过关', desc: '不进位加法', type: 'noCarryAdd', min: 1, max: 9 },
    { id: 17, name: '满十进一', desc: '进位加法', type: 'carryAdd', min: 5, max: 9 },
    { id: 18, name: '分糖果', desc: '不退位减法', type: 'noBorrowSub', min: 1, max: 9 },
    { id: 19, name: '拆一捆', desc: '退位减法', type: 'borrowSub', min: 3, max: 9 },
    { id: 20, name: '加减混合', desc: '综合挑战', type: 'mixed', min: 1, max: 9 }
  ],

  items: ['🐸', '🐟', '🐰', '🐶', '🐱', '🌸', '🎈'],

  encourageMessages: [
    '太棒了！', '真厉害！', '好聪明！', '跳跳为你骄傲！',
    '答对啦！', '真了不起！', '太强了！', '完美！'
  ],

  currentLevel: null,
  currentQuestion: null,
  correctCount: 0,
  totalQuestions: 5,
  hearts: 3,
  streak: 0,

  startLevel(levelId) {
    this.currentLevel = this.levels.find(l => l.id === levelId);
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
    const item = this.items[Math.floor(Math.random() * this.items.length)];

    let a, b, answer, type;

    switch (level.type) {
      case 'noCarryAdd':
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * (9 - a)) + 1; // a+b <= 10
        answer = a + b;
        type = '+';
        break;
      case 'carryAdd':
        a = Math.floor(Math.random() * 5) + 5; // 5-9
        b = Math.floor(Math.random() * 5) + 2; // 2-6
        answer = a + b;
        type = '+';
        break;
      case 'noBorrowSub':
        a = Math.floor(Math.random() * 9) + 2;
        b = Math.floor(Math.random() * a) + 1;
        answer = a - b;
        type = '-';
        break;
      case 'borrowSub':
        a = Math.floor(Math.random() * 5) + 12; // 12-16
        b = Math.floor(Math.random() * 5) + 5; // 5-9
        if (b >= a) b = a - Math.floor(Math.random() * 3) - 1;
        answer = a - b;
        type = '-';
        break;
      case 'mixed':
        if (Math.random() > 0.5) {
          a = Math.floor(Math.random() * 9) + 2;
          b = Math.floor(Math.random() * 9) + 2;
          answer = a + b;
          type = '+';
        } else {
          a = Math.floor(Math.random() * 10) + 5;
          b = Math.floor(Math.random() * a) + 1;
          answer = a - b;
          type = '-';
        }
        break;
    }

    this.currentQuestion = { a, b, answer, type, item, checked: false };

    if (type === '+') {
      this.renderAddition(area, a, b, answer, item);
    } else {
      this.renderSubtraction(area, a, b, answer, item);
    }
  },

  // ========== 加法可视化 ==========
  renderAddition(area, a, b, answer, item) {
    const carry = a + b > 10;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">桥这边有 ${a} 只${item}，桥那边有 ${b} 只</div>
          <div class="question-sub">合在一起有多少只？</div>
        </div>
        <div class="river-visual">
          <div class="river-side left">
            <div class="side-label">${a}只</div>
            <div class="side-items">
    `;

    for (let i = 0; i < Math.min(a, 10); i++) {
      html += `<span class="river-item pop-in" style="animation-delay:${i * 0.05}s">${item}</span>`;
    }
    if (a > 10) html += `<span class="more-items">+${a - 10}</span>`;

    html += `
            </div>
          </div>
          <div class="river-bridge">🌉</div>
          <div class="river-side right">
            <div class="side-label">${b}只</div>
            <div class="side-items">
    `;

    for (let i = 0; i < Math.min(b, 10); i++) {
      html += `<span class="river-item pop-in" style="animation-delay:${(a + i) * 0.05}s">${item}</span>`;
    }
    if (b > 10) html += `<span class="more-items">+${b - 10}</span>`;

    html += `
            </div>
          </div>
        </div>
        ${carry ? '<div class="carry-hint">💡 满10只可以变成1捆哦！</div>' : ''}
        <div class="options-group">
    `;

    const options = this.generateOptions(answer, 25);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}只</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 减法可视化 ==========
  renderSubtraction(area, a, b, answer, item) {
    const borrow = a > 10 && b > (a % 10);

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">原来有 ${a} 只${item}</div>
          <div class="question-sub">拿走了 ${b} 只，还剩多少？</div>
        </div>
        <div class="subtraction-visual">
          <div class="sub-all">
            <div class="sub-label">原来的${item}：</div>
            <div class="sub-items">
    `;

    for (let i = 0; i < Math.min(a, 15); i++) {
      const removed = i >= answer;
      html += `<span class="sub-item ${removed ? 'removed' : ''} pop-in" style="animation-delay:${i * 0.04}s">${item}</span>`;
    }
    if (a > 15) html += `<span class="more-items ${a - 15 > answer ? 'removed' : ''}">+${a - 15}</span>`;

    html += `
            </div>
          </div>
          <div class="sub-arrow">↓ 拿走 ${b} 只</div>
          <div class="sub-remaining">
            <div class="sub-label">剩下的：</div>
            <div class="sub-items">
    `;

    for (let i = 0; i < Math.min(answer, 15); i++) {
      html += `<span class="sub-item remaining pop-in" style="animation-delay:${(a + i) * 0.04}s">${item}</span>`;
    }

    html += `
            </div>
          </div>
        </div>
        ${borrow ? '<div class="borrow-hint">💡 不够就拆一捆！这就是借位</div>' : ''}
        <div class="options-group">
    `;

    const options = this.generateOptions(answer, 25);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}只</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 通用逻辑 ==========

  generateOptions(correct, max) {
    const options = new Set([correct]);
    while (options.size < 4) {
      let opt;
      if (Math.random() > 0.5) {
        opt = correct + Math.floor(Math.random() * 7) - 3;
      } else {
        opt = Math.floor(Math.random() * max) + 1;
      }
      if (opt >= 0 && opt <= max && opt !== correct) {
        options.add(opt);
      }
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  },

  checkAnswer(btn, value) {
    if (this.currentQuestion.checked) return;
    this.currentQuestion.checked = true;

    if (value === this.currentQuestion.answer) {
      btn.classList.add('correct');
      this.onCorrect();
    } else {
      btn.classList.add('wrong');
      this.streak = 0;
      this.onWrong();
      document.querySelectorAll('.option-btn').forEach(b => {
        if (parseInt(b.dataset.value) === this.currentQuestion.answer) {
          b.classList.add('correct');
        }
      });
    }
    document.querySelectorAll('.option-btn').forEach(b => b.style.pointerEvents = 'none');
  },

  onCorrect() {
    this.correctCount++;
    this.streak++;
    this.streak >= 3 ? SoundManager.combo(this.streak) : SoundManager.correct();

    const emoji = this.streak >= 5 ? '🏆' : this.streak >= 3 ? '🔥' : '🎉';
    const msg = this.streak >= 5 ? '无敌了！' :
      this.streak >= 3 ? '超级连击！⚡' :
      this.encourageMessages[Math.floor(Math.random() * this.encourageMessages.length)];

    App.showFeedback(emoji, msg);
    App.updateGameHeader(this.currentLevel.name, this.correctCount, this.totalQuestions);

    setTimeout(() => {
      if (this.correctCount >= this.totalQuestions) this.completeLevel();
      else this.renderQuestion();
    }, 1200);
  },

  onWrong() {
    this.hearts--;
    SoundManager.wrong();
    App.updateHearts(this.hearts);
    App.showFeedback('💪', '没关系，继续加油！');

    if (this.hearts <= 0) { setTimeout(() => this.failLevel(), 1200); return; }
    setTimeout(() => this.renderQuestion(), 1500);
  },

  completeLevel() {
    const stars = this.hearts === 3 ? 3 : (this.hearts === 2 ? 2 : 1);
    SoundManager.levelComplete();
    App.saveProgress(4, this.currentLevel.id, stars);
    setTimeout(() => App.showResult(stars, this.correctCount, this.totalQuestions), 600);
  },

  failLevel() {
    SoundManager.encourage();
    App.showResult(0, this.correctCount, this.totalQuestions);
  }
};
