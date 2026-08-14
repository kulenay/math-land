/* ============================================
   模块二：十进制（凑十魔法）
   理解"满十进一"的十进制本质
   ============================================ */

const Module2 = {
  name: '凑十魔法',
  emoji: '📦',
  levels: [
    { id: 6, name: '糖果装盒', desc: '10个一捆', type: 'packBox', min: 11, max: 20 },
    { id: 7, name: '凑十魔法', desc: '10的分解', type: 'makeTen', min: 10, max: 10 },
    { id: 8, name: '10的分法', desc: '5种分法', type: 'splitTen', min: 10, max: 10 },
    { id: 9, name: '几十和几', desc: '11-20的组成', type: 'tensAndOnes', min: 11, max: 20 },
    { id: 10, name: '积木堆塔', desc: '10→100', type: 'blockTower', min: 10, max: 99 }
  ],

  items: ['🍎', '🍬', '⭐', '🐟', '🎈', '🍊', '🌸', '🐝'],

  encourageMessages: [
    '太棒了！', '真厉害！', '你是天才！', '好聪明！',
    '跳跳为你骄傲！', '答对啦！', '真了不起！', '太强了！'
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

    this.currentQuestion = { item, checked: false };

    switch (level.type) {
      case 'packBox': this.renderPackBox(area, item); break;
      case 'makeTen': this.renderMakeTen(area, item); break;
      case 'splitTen': this.renderSplitTen(area, item); break;
      case 'tensAndOnes': this.renderTensAndOnes(area, item); break;
      case 'blockTower': this.renderBlockTower(area, item); break;
      default: this.renderPackBox(area, item);
    }
  },

  // ========== 关卡1: 糖果装盒 ==========
  // 给定散落的物品，孩子拖动装盒，满10自动扎捆
  renderPackBox(area, item) {
    const total = 10 + Math.floor(Math.random() * 11); // 11-20
    const tens = Math.floor(total / 10);
    const ones = total % 10;

    this.currentQuestion.answer = total;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">把${item}装盒，看看有多少个</div>
        </div>
        <div class="pack-area">
          <div class="box-zone" id="box-zone">
            <div class="box-label">📦 盒子（满10自动扎捆）</div>
            <div class="box-items" id="box-items"></div>
            <div class="box-count">盒子里：<span id="box-count">0</span> / 10</div>
          </div>
          <div class="bundle-zone" id="bundle-zone"></div>
          <div class="loose-zone" id="loose-zone">
            <div class="loose-items" id="loose-items"></div>
          </div>
        </div>
        <div class="result-area" id="pack-result" style="display:none"></div>
        <div class="options-group" id="pack-options" style="display:none"></div>
      </div>
    `;

    area.innerHTML = html;

    // 放置散落物品
    const looseItems = document.getElementById('loose-items');
    let inBox = 0;
    let bundles = 0;

    for (let i = 0; i < total; i++) {
      const el = document.createElement('div');
      el.className = 'pack-item';
      el.textContent = item;
      el.dataset.index = i;
      el.addEventListener('click', () => {
        if (el.classList.contains('packed')) return;
        SoundManager.merge();
        el.classList.add('packed');

        // 移到盒子
        const boxItems = document.getElementById('box-items');
        const boxEl = document.createElement('div');
        boxEl.className = 'box-item pop-in';
        boxEl.textContent = item;
        boxItems.appendChild(boxEl);

        inBox++;
        document.getElementById('box-count').textContent = inBox;

        // 满10自动扎捆
        if (inBox === 10) {
          SoundManager.tenFrameFull();
          bundles++;
          setTimeout(() => {
            const bundleZone = document.getElementById('bundle-zone');
            const bundle = document.createElement('div');
            bundle.className = 'bundle pop-in';
            bundle.innerHTML = `🎁<span class="bundle-label">10个一捆</span>`;
            bundleZone.appendChild(bundle);
            document.getElementById('box-items').innerHTML = '';
            inBox = 0;
            document.getElementById('box-count').textContent = 0;
            SoundManager.merge();
          }, 300);
        }
      });
      looseItems.appendChild(el);
    }

    // 显示结果按钮
    setTimeout(() => {
      const looseCount = total; // 总数
      const btn = document.createElement('button');
      btn.className = 'btn-confirm';
      btn.textContent = '数完了！';
      btn.addEventListener('click', () => {
        const resultArea = document.getElementById('pack-result');
        const optionsGroup = document.getElementById('pack-options');
        resultArea.style.display = 'block';
        resultArea.innerHTML = `
          <div class="verify-area pop-in">
            <div class="verify-text">📦 有${bundles}捆，还有${total - bundles * 10}个散的</div>
            <div class="verify-breakdown">一共是 ${total} 个 ${item}</div>
          </div>
        `;

        // 选择题验证
        optionsGroup.style.display = 'flex';
        const options = this.generateOptions(total, 30);
        options.forEach(opt => {
          const optBtn = document.createElement('button');
          optBtn.className = 'option-btn';
          optBtn.dataset.value = opt;
          optBtn.textContent = `${opt}个`;
          optBtn.addEventListener('click', () => this.checkAnswer(optBtn, opt));
          optionsGroup.appendChild(optBtn);
        });
      });
      area.appendChild(btn);
    }, 500);
  },

  // ========== 关卡2: 凑十魔法 ==========
  // 选择题：几加几等于10
  renderMakeTen(area, item) {
    // 随机生成 a + ? = 10
    const a = Math.floor(Math.random() * 9) + 1;
    const answer = 10 - a;

    this.currentQuestion.answer = answer;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text"> ${item.repeat(a)} + ? = 10</div>
          <div class="question-sub">需要几个${item}才能凑成10？</div>
        </div>
        <div class="ten-frame-visual" id="make-ten-visual">
    `;

    for (let i = 0; i < 10; i++) {
      html += `<div class="ten-frame-cell ${i < a ? 'filled' : ''}" data-index="${i}">
        ${i < a ? item : ''}
      </div>`;
    }

    html += `</div>
        <div class="options-group">
    `;

    const options = this.generateOptions(answer, 10);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}个</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 关卡3: 10的分法 ==========
  // 拖动分割线把10分成两部分
  renderSplitTen(area, item) {
    const splitA = Math.floor(Math.random() * 9) + 1;
    const splitB = 10 - splitA;
    this.currentQuestion.answer = splitA;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">10个${item}可以怎么分？</div>
        </div>
        <div class="split-visual">
          <div class="split-row" id="split-row">
    `;

    for (let i = 0; i < 10; i++) {
      html += `<div class="split-item ${i < splitA ? 'left' : 'right'}">${item}</div>`;
    }

    html += `
          </div>
          <div class="split-labels">
            <span class="split-left">${splitA}个</span>
            <span class="split-right">${splitB}个</span>
          </div>
        </div>
        <div class="question-text" style="margin-top:16px">左边有几个？</div>
        <div class="options-group">
    `;

    // 选项：左边的数量，以及可能的其他分法
    const options = new Set([splitA]);
    while (options.size < 4) {
      const opt = Math.floor(Math.random() * 9) + 1;
      options.add(opt);
    }

    Array.from(options).sort(() => Math.random() - 0.5).forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}个</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 关卡4: 几十和几 ==========
  renderTensAndOnes(area, item) {
    const num = Math.floor(Math.random() * 10) + 11; // 11-20
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    this.currentQuestion.answer = num;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">这些${item}是多少？</div>
        </div>
        <div class="tens-ones-visual">
          <div class="tens-group">
            <div class="tens-label">📦 几捆（每捆10个）</div>
            <div class="tens-items">
    `;

    for (let i = 0; i < tens; i++) {
      html += `<div class="bundle-mini pop-in" style="animation-delay:${i * 0.1}s">🎁</div>`;
    }

    html += `
            </div>
          </div>
          <div class="ones-group">
            <div class="ones-label">散的</div>
            <div class="ones-items">
    `;

    for (let i = 0; i < ones; i++) {
      html += `<div class="loose-mini pop-in" style="animation-delay:${(tens + i) * 0.1}s">${item}</div>`;
    }

    html += `
            </div>
          </div>
        </div>
        <div class="options-group">
    `;

    const options = this.generateOptions(num, 25);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}个</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 关卡5: 积木堆塔 ==========
  renderBlockTower(area, item) {
    const num = (Math.floor(Math.random() * 9) + 1) * 10; // 10, 20, 30...90
    const tensCount = num / 10;
    this.currentQuestion.answer = num;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">积木塔有多少个${item}？</div>
        </div>
        <div class="tower-visual" id="tower-visual">
    `;

    for (let i = 0; i < tensCount; i++) {
      html += `<div class="tower-layer pop-in" style="animation-delay:${i * 0.15}s">
        <div class="tower-block">📦<span class="tower-num">10</span></div>
      </div>`;
    }

    html += `
        </div>
        <div class="tower-total">一共有 ${tensCount} 层，每层10个</div>
        <div class="options-group">
    `;

    const options = this.generateOptions(num, 100);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}个</button>`;
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
      if (opt >= 1 && opt <= max && opt !== correct) {
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
    App.showFeedback('💪', '没关系，跳跳相信你！');

    if (this.hearts <= 0) {
      setTimeout(() => this.failLevel(), 1200);
      return;
    }
    setTimeout(() => this.renderQuestion(), 1500);
  },

  completeLevel() {
    const stars = this.hearts === 3 ? 3 : (this.hearts === 2 ? 2 : 1);
    SoundManager.levelComplete();
    App.saveProgress(2, this.currentLevel.id, stars);
    setTimeout(() => App.showResult(stars, this.correctCount, this.totalQuestions), 600);
  },

  failLevel() {
    SoundManager.encourage();
    App.showResult(0, this.correctCount, this.totalQuestions);
  }
};
