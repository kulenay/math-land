/* ============================================
   模块一：感知数量（数一数）
   5个关卡，从1-10到11-20
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

  // 物品emoji池
  items: ['🍎', '🍬', '🌟', '🐟', '🎈', '🍊', '🌸', '🐝'],

  currentLevel: null,
  currentQuestion: null,
  score: 0,
  totalQuestions: 0,
  correctCount: 0,
  hearts: 3,

  // 开始关卡
  startLevel(levelId) {
    this.currentLevel = this.levels.find(l => l.id === levelId);
    this.score = 0;
    this.correctCount = 0;
    this.hearts = 3;
    this.totalQuestions = 5; // 每关5题

    App.showScreen('game-screen');
    App.updateGameHeader(this.currentLevel.name, 0, this.totalQuestions);
    this.renderQuestion();
  },

  // 渲染当前题目
  renderQuestion() {
    const area = document.getElementById('game-area');
    const level = this.currentLevel;
    const randomItem = this.items[Math.floor(Math.random() * this.items.length)];

    // 随机生成正确答案
    const correctAnswer = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;

    // 生成干扰选项
    const options = this.generateOptions(correctAnswer, level.max);

    this.currentQuestion = {
      item: randomItem,
      answer: correctAnswer,
      options: options
    };

    // 根据关卡类型渲染
    if (level.type === 'tenframe') {
      this.renderTenFrame(area, correctAnswer, randomItem);
    } else {
      this.renderEstimate(area, correctAnswer, randomItem, options);
    }
  },

  // 渲染估数关卡
  renderEstimate(area, count, item, options) {
    // 散落的物品
    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">这堆${item}大约有多少？</div>
        </div>
        <div class="scatter-area" id="scatter-area"></div>
        <div class="options-group">
    `;

    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}个</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    // 散落物品动画
    this.scatterItems('scatter-area', count, item);

    // 绑定按钮事件
    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // 散落物品到指定区域
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

      // 随机位置（避免重叠太严重）
      const x = 10 + Math.random() * (width - itemSize - 20);
      const y = 10 + Math.random() * (height - itemSize - 20);
      el.style.left = x + 'px';
      el.style.top = y + 'px';

      container.appendChild(el);
    }
  },

  // 渲染十格框关卡
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
        <div class="options-group">
          <button class="option-btn" data-value="${count}">${count}个${item}</button>
        </div>
      </div>
    `;

    area.innerHTML = html;

    // 让物品可拖拽
    const cells = area.querySelectorAll('.ten-frame-cell');
    let filledCount = 0;

    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        if (cell.classList.contains('filled')) {
          // 取出
          cell.classList.remove('filled');
          cell.textContent = '';
          filledCount--;
          SoundManager.split();
        } else if (filledCount < 10) {
          // 放入
          cell.classList.add('filled');
          cell.textContent = item;
          filledCount++;
          SoundManager.merge();
        }
        document.getElementById('ten-frame-count').textContent = filledCount;

        // 自动判断：填了正确数量
        if (filledCount === count) {
          setTimeout(() => this.showArrange(area, count, item), 500);
        }
      });
    });
  },

  // 展示排列验证
  showArrange(area, count, item) {
    const verifyArea = document.createElement('div');
    verifyArea.className = 'verify-area pop-in';
    verifyArea.innerHTML = `
      <div class="verify-text">就是${count}个${item}！</div>
      <div class="verify-breakdown">一排5个，${count > 5 ? '排了1排多' + (count - 5) + '个' : '排了' + count + '个'}</div>
    `;
    area.appendChild(verifyArea);

    // 答对
    this.onCorrect();
  },

  // 生成选项
  generateOptions(correct, max) {
    const options = new Set([correct]);

    while (options.size < 4) {
      let opt;
      if (Math.random() > 0.5) {
        // 邻近数字
        opt = correct + Math.floor(Math.random() * 5) - 2;
      } else {
        // 随机数字
        opt = Math.floor(Math.random() * Math.min(max + 5, 25)) + 1;
      }
      if (opt >= 1 && opt <= Math.max(max + 5, 25) && opt !== correct) {
        options.add(opt);
      }
    }

    // 打乱顺序
    return Array.from(options).sort(() => Math.random() - 0.5);
  },

  // 检查答案
  checkAnswer(btn, value) {
    if (this.currentQuestion.checked) return;
    this.currentQuestion.checked = true;

    const correct = value === this.currentQuestion.answer;

    if (correct) {
      btn.classList.add('correct');
      this.onCorrect();
    } else {
      btn.classList.add('wrong');
      this.onWrong();

      // 显示正确答案
      document.querySelectorAll('.option-btn').forEach(b => {
        if (parseInt(b.dataset.value) === this.currentQuestion.answer) {
          b.classList.add('correct');
        }
      });
    }

    // 禁用所有按钮
    document.querySelectorAll('.option-btn').forEach(b => {
      b.style.pointerEvents = 'none';
    });
  },

  // 答对处理
  onCorrect() {
    this.correctCount++;
    SoundManager.correct();
    App.showFeedback('🎉');
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

  // 答错处理
  onWrong() {
    this.hearts--;
    SoundManager.wrong();
    App.showFeedback('🤔');
    App.updateHearts(this.hearts);

    if (this.hearts <= 0) {
      setTimeout(() => this.failLevel(), 1000);
      return;
    }

    // 继续下一题
    setTimeout(() => {
      if (this.correctCount + (this.totalQuestions - this.correctCount - 1) >= this.totalQuestions) {
        // 还有机会
      }
      this.renderQuestion();
    }, 1500);
  },

  // 通关
  completeLevel() {
    const stars = this.hearts === 3 ? 3 : (this.hearts === 2 ? 2 : 1);
    SoundManager.levelComplete();

    // 保存进度
    App.saveProgress(1, this.currentLevel.id, stars);

    setTimeout(() => {
      App.showResult(stars, this.correctCount, this.totalQuestions);
    }, 500);
  },

  // 失败
  failLevel() {
    App.showResult(0, this.correctCount, this.totalQuestions);
  }
};
