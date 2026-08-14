/* ============================================
   模块三：位值（数字搬家）
   理解个位、十位、百位的概念
   ============================================ */

const Module3 = {
  name: '数字搬家',
  emoji: '🏠',
  levels: [
    { id: 11, name: '数字搬家', desc: '个位十位', type: 'numberHouse', min: 11, max: 99 },
    { id: 12, name: '积木对应', desc: '看积木写数', type: 'blockToNum', min: 11, max: 99 },
    { id: 13, name: '数字拆解', desc: '拆开看看', type: 'numberSplit', min: 11, max: 99 },
    { id: 14, name: '读数比赛', desc: '读出来', type: 'readNum', min: 11, max: 99 },
    { id: 15, name: '看图写数', desc: '综合挑战', type: 'pictureToNum', min: 11, max: 99 }
  ],

  items: ['🍎', '🍬', '⭐', '🐟', '🎈'],

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

    const num = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    this.currentQuestion = { num, item, checked: false };

    switch (level.type) {
      case 'numberHouse': this.renderNumberHouse(area, num, item); break;
      case 'blockToNum': this.renderBlockToNum(area, num, item); break;
      case 'numberSplit': this.renderNumberSplit(area, num, item); break;
      case 'readNum': this.renderReadNum(area, num, item); break;
      case 'pictureToNum': this.renderPictureToNum(area, num, item); break;
      default: this.renderNumberHouse(area, num, item);
    }
  },

  // ========== 关卡1: 数字房子 ==========
  // 把数字拖到正确的房间（个位/十位）
  renderNumberHouse(area, num, item) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">数字 ${num} 住在哪个房间？</div>
        </div>
        <div class="number-house">
          <div class="house-row">
            <div class="house room-tens">
              <div class="room-label">十位</div>
              <div class="room-number" id="room-tens">?</div>
              <div class="room-emoji">${'📦'.repeat(Math.min(tens, 9))}</div>
            </div>
            <div class="house room-ones">
              <div class="room-label">个位</div>
              <div class="room-number" id="room-ones">?</div>
              <div class="room-emoji">${item.repeat(Math.min(ones, 9))}</div>
            </div>
          </div>
        </div>
        <div class="question-sub">十位是几？个位是几？</div>
        <div class="options-group">
    `;

    // 选项是两个数字组合
    const correctStr = `${tens}${ones}`;
    const options = new Set([correctStr]);
    while (options.size < 4) {
      const rTens = Math.floor(Math.random() * 10);
      const rOnes = Math.floor(Math.random() * 10);
      const opt = `${rTens}${rOnes}`;
      if (opt !== correctStr && parseInt(opt) > 0) {
        options.add(opt);
      }
    }

    Array.from(options).sort(() => Math.random() - 0.5).forEach(opt => {
      const display = `${opt[0]}(十位) ${opt[1]}(个位)`;
      html += `<button class="option-btn" data-value="${opt}">${display}</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        this.checkAnswer(btn, val === correctStr ? num : -1);
        // 显示实际数字
        document.getElementById('room-tens').textContent = tens;
        document.getElementById('room-ones').textContent = ones;
      });
    });
  },

  // ========== 关卡2: 积木对应 ==========
  renderBlockToNum(area, num, item) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">这些积木代表什么数字？</div>
        </div>
        <div class="blocks-visual">
          <div class="blocks-tens">
            <div class="blocks-label">📦 十位</div>
            <div class="blocks-row">
    `;

    for (let i = 0; i < tens; i++) {
      html += `<div class="block-ten pop-in" style="animation-delay:${i * 0.1}s">📦</div>`;
    }

    html += `
            </div>
          </div>
          <div class="blocks-ones">
            <div class="blocks-label">${item} 个位</div>
            <div class="blocks-row">
    `;

    for (let i = 0; i < ones; i++) {
      html += `<div class="block-one pop-in" style="animation-delay:${(tens + i) * 0.1}s">${item}</div>`;
    }

    html += `
            </div>
          </div>
        </div>
        <div class="options-group">
    `;

    const options = this.generateOptions(num, 99);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 关卡3: 数字拆解器 ==========
  renderNumberSplit(area, num, item) {
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">把 ${num} 拆开看看</div>
        </div>
        <div class="split-visual">
          <div class="number-big pop-in">${num}</div>
          <div class="split-arrow">↓ 拆开</div>
          <div class="split-parts">
            <div class="split-part pop-in" style="animation-delay:0.2s">
              <div class="part-number">${tens}</div>
              <div class="part-label">${'📦'.repeat(Math.floor(num / 10))}</div>
            </div>
            <div class="split-plus">+</div>
            <div class="split-part pop-in" style="animation-delay:0.4s">
              <div class="part-number">${ones}</div>
              <div class="part-label">${item.repeat(ones)}</div>
            </div>
          </div>
        </div>
        <div class="question-sub">${num} = ${tens} + ${ones}</div>
        <div class="options-group">
    `;

    const options = new Set();
    options.add(`${tens}+${ones}`);
    while (options.size < 4) {
      const rTens = (Math.floor(Math.random() * 10)) * 10;
      const rOnes = Math.floor(Math.random() * 10);
      const opt = `${rTens}+${rOnes}`;
      if (opt !== `${tens}+${ones}` && rTens + rOnes > 0 && rTens + rOnes <= 99) {
        options.add(opt);
      }
    }

    Array.from(options).sort(() => Math.random() - 0.5).forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const parts = btn.dataset.value.split('+');
        const sum = parseInt(parts[0]) + parseInt(parts[1]);
        this.checkAnswer(btn, sum === num ? num : -1);
      });
    });
  },

  // ========== 关卡4: 读数比赛 ==========
  renderReadNum(area, num, item) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    const numStr = num < 20 ?
      ['十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九'][num - 10] :
      `${['', '', '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十'][tens]}${ones > 0 ? ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][ones] : ''}`;

    this.currentQuestion.readAnswer = numStr;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">这个数字怎么读？</div>
          <div class="number-big">${num}</div>
        </div>
        <div class="options-group">
    `;

    const options = new Set([numStr]);
    const allReadings = ['十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九',
      '二十', '二十一', '二十二', '三十', '三十五', '四十', '四十二', '五十', '五十五', '六十', '七十', '八十', '九十'];

    while (options.size < 4) {
      const opt = allReadings[Math.floor(Math.random() * allReadings.length)];
      if (opt !== numStr) options.add(opt);
    }

    Array.from(options).sort(() => Math.random() - 0.5).forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, btn.dataset.value === numStr ? num : -1));
    });
  },

  // ========== 关卡5: 看图写数 ==========
  renderPictureToNum(area, num, item) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">数一数，是多少？</div>
        </div>
        <div class="picture-num-visual">
          <div class="picture-tens">
    `;

    for (let i = 0; i < tens; i++) {
      html += `<div class="picture-bundle pop-in" style="animation-delay:${i * 0.1}s">🎁</div>`;
    }

    html += `
          </div>
          <div class="picture-ones">
    `;

    for (let i = 0; i < ones; i++) {
      html += `<div class="picture-item pop-in" style="animation-delay:${(tens + i) * 0.1}s">${item}</div>`;
    }

    html += `
          </div>
        </div>
        <div class="options-group">
    `;

    const options = this.generateOptions(num, 99);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}</button>`;
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
        opt = correct + Math.floor(Math.random() * 11) - 5;
      } else {
        opt = Math.floor(Math.random() * max) + 1;
      }
      if (opt >= 1 && opt <= max && opt !== correct) {
        options.add(opt);
      }
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  },

  checkAnswer(btn, value) {
    if (this.currentQuestion.checked) return;
    this.currentQuestion.checked = true;

    if (value === this.currentQuestion.num || value === this.currentQuestion.readAnswer) {
      btn.classList.add('correct');
      this.onCorrect();
    } else {
      btn.classList.add('wrong');
      this.streak = 0;
      this.onWrong();
      document.querySelectorAll('.option-btn').forEach(b => {
        if (b.dataset.value == this.currentQuestion.num ||
            b.dataset.value == this.currentQuestion.readAnswer) {
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
    App.saveProgress(3, this.currentLevel.id, stars);
    setTimeout(() => App.showResult(stars, this.correctCount, this.totalQuestions), 600);
  },

  failLevel() {
    SoundManager.encourage();
    App.showResult(0, this.correctCount, this.totalQuestions);
  }
};
