/* ============================================
   模块五：购物乐园（人民币）
   理解元角分的十进制关系
   ============================================ */

const Module5 = {
  name: '购物乐园',
  emoji: '🛒',
  levels: [
    { id: 21, name: '认识钱', desc: '元角分', type: 'recognizeMoney' },
    { id: 22, name: '钱的换算', desc: '1元=10角', type: 'convertMoney' },
    { id: 23, name: '凑钱买', desc: '凑够才能买', type: 'gatherMoney' },
    { id: 24, name: '找零', desc: '买东西找零', type: 'makeChange' },
    { id: 25, name: '超市采购', desc: '综合挑战', type: 'shopping' }
  ],

  // 商品
  products: [
    { name: '🍎苹果', price: 5, emoji: '🍎' },
    { name: '🎈气球', price: 3, emoji: '🎈' },
    { name: '🍬棒棒糖', price: 2, emoji: '🍬' },
    { name: '✏️铅笔', price: 4, emoji: '✏️' },
    { name: '📓本子', price: 6, emoji: '📓' },
    { name: '🧃果汁', price: 8, emoji: '🧃' },
    { name: '🍪饼干', price: 7, emoji: '🍪' },
    { name: '🎨画笔', price: 9, emoji: '🎨' },
  ],

  encourageMessages: [
    '太棒了！', '真厉害！', '好聪明！', '跳跳为你骄傲！',
    '答对啦！', '真了不起！', '太强了！', '小老板真棒！'
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

    switch (level.type) {
      case 'recognizeMoney': this.renderRecognize(area); break;
      case 'convertMoney': this.renderConvert(area); break;
      case 'gatherMoney': this.renderGather(area); break;
      case 'makeChange': this.renderChange(area); break;
      case 'shopping': this.renderShopping(area); break;
      default: this.renderRecognize(area);
    }
  },

  // ========== 关卡1: 认识钱 ==========
  renderRecognize(area) {
    // 随机展示一种面值，问是多少钱
    const denominations = [
      { value: 1, unit: '元', type: 'bill', emoji: '💴' },
      { value: 5, unit: '角', type: 'coin', emoji: '🪙' },
      { value: 1, unit: '角', type: 'coin', emoji: '🪙' },
      { value: 2, unit: '角', type: 'coin', emoji: '🪙' },
      { value: 5, unit: '元', type: 'bill', emoji: '💴' },
    ];

    const denom = denominations[Math.floor(Math.random() * denominations.length)];
    this.currentQuestion.answer = denom.value;
    this.currentQuestion.unit = denom.unit;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">这是多少钱？</div>
        </div>
        <div class="money-display">
          <div class="money-item big pop-in">
            <span class="money-emoji">${denom.emoji}</span>
            <span class="money-value">${denom.value} ${denom.unit}</span>
          </div>
        </div>
        <div class="options-group">
    `;

    const options = new Set([`${denom.value}${denom.unit}`]);
    const allCombos = ['1角', '2角', '5角', '1元', '2元', '5元'];
    while (options.size < 4) {
      const opt = allCombos[Math.floor(Math.random() * allCombos.length)];
      options.add(opt);
    }

    Array.from(options).sort(() => Math.random() - 0.5).forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.checkMoneyAnswer(btn, btn.dataset.value, `${denom.value}${denom.unit}`);
      });
    });
  },

  // ========== 关卡2: 钱的换算 ==========
  renderConvert(area) {
    // 1元=?角 或 1角=?分
    const conversions = [
      { from: '1元', toValue: 10, toUnit: '角', question: '1元可以换几个1角？', answer: 10 },
      { from: '1角', toValue: 10, toUnit: '分', question: '1角可以换几个1分？', answer: 10 },
      { from: '5角', toValue: 5, toUnit: '角', question: '1元可以换几个5角？', answer: 2 },
      { from: '2角', toValue: 5, toUnit: '角', question: '1元可以换几个2角？', answer: 5 },
    ];

    const conv = conversions[Math.floor(Math.random() * conversions.length)];
    this.currentQuestion.answer = conv.answer;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">${conv.question}</div>
        </div>
        <div class="convert-visual">
          <div class="convert-from pop-in">
            <div class="convert-emoji">💴</div>
            <div class="convert-label">${conv.from}</div>
          </div>
          <div class="convert-arrow">→</div>
          <div class="convert-to" id="convert-to">
    `;

    // 显示待填充的位置
    for (let i = 0; i < Math.min(conv.answer, 10); i++) {
      html += `<div class="convert-slot pop-in" style="animation-delay:${i * 0.08}s">🪙</div>`;
    }
    if (conv.answer > 10) html += `<div class="more-slots">+${conv.answer - 10}</div>`;

    html += `
          </div>
        </div>
        <div class="question-sub">需要${conv.toUnit}的数量</div>
        <div class="options-group">
    `;

    const options = this.generateOptions(conv.answer, 15);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}个</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 关卡3: 凑钱买东西 ==========
  renderGather(area) {
    const product = this.products[Math.floor(Math.random() * this.products.length)];
    const wallet = this.generateWallet(product.price);

    this.currentQuestion.answer = product.price;
    this.currentQuestion.wallet = wallet;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">想买${product.name}，钱够吗？</div>
        </div>
        <div class="shop-visual">
          <div class="product-display pop-in">
            <div class="product-emoji">${product.emoji}</div>
            <div class="product-price">${product.price}角</div>
          </div>
          <div class="wallet-display">
            <div class="wallet-label">你的钱包：</div>
            <div class="wallet-items">
    `;

    wallet.forEach((coin, i) => {
      html += `<div class="wallet-coin pop-in" style="animation-delay:${i * 0.1}s">${coin}角</div>`;
    });

    html += `
            </div>
            <div class="wallet-total">一共：${wallet.reduce((a, b) => a + b, 0)}角</div>
          </div>
        </div>
        <div class="question-sub">钱包里的钱够买吗？</div>
        <div class="options-group">
    `;

    const total = wallet.reduce((a, b) => a + b, 0);
    html += `<button class="option-btn" data-value="yes">够！</button>`;
    html += `<button class="option-btn" data-value="no">不够！</button>`;
    html += `<button class="option-btn" data-value="exact">刚刚好！</button>`;

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        let userAnswer;
        if (btn.dataset.value === 'yes') userAnswer = total > product.price ? 1 : -1;
        else if (btn.dataset.value === 'no') userAnswer = total < product.price ? 1 : -1;
        else userAnswer = total === product.price ? 1 : -1;
        this.checkAnswer(btn, userAnswer === 1 ? product.price : -1);
      });
    });
  },

  generateWallet(targetPrice) {
    const coins = [1, 2, 5];
    let wallet = [];
    let total = 0;

    // 确保钱包总额 >= 目标价格（有概率不够）
    const enough = Math.random() > 0.3;

    if (enough) {
      while (total < targetPrice) {
        const coin = coins[Math.floor(Math.random() * coins.length)];
        wallet.push(coin);
        total += coin;
      }
    } else {
      while (total < targetPrice - 1) {
        const coin = coins[Math.floor(Math.random() * coins.length)];
        wallet.push(coin);
        total += coin;
      }
    }

    return wallet;
  },

  // ========== 关卡4: 买东西找零 ==========
  renderChange(area) {
    const product = this.products[Math.floor(Math.random() * this.products.length)];
    const paid = Math.ceil(product.price / 5) * 5; // 凑到最近的5角或1元
    const change = paid - product.price;

    this.currentQuestion.answer = change;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">买${product.name}，付了${paid}角</div>
          <div class="question-sub">应该找回多少钱？</div>
        </div>
        <div class="change-visual">
          <div class="change-row">
            <div class="change-item pop-in">
              <div class="change-emoji">${product.emoji}</div>
              <div class="change-price">${product.price}角</div>
            </div>
            <div class="change-paid pop-in" style="animation-delay:0.1s">
              <div class="change-emoji">💴</div>
              <div class="change-price">${paid}角</div>
            </div>
          </div>
          <div class="change-formula pop-in" style="animation-delay:0.2s">
            ${paid}角 - ${product.price}角 = ?角
          </div>
        </div>
        <div class="options-group">
    `;

    const options = this.generateOptions(change, 10);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}角</button>`;
    });

    html += `</div></div>`;
    area.innerHTML = html;

    area.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn, parseInt(btn.dataset.value)));
    });
  },

  // ========== 关卡5: 超市采购 ==========
  renderShopping(area) {
    // 随机选2个商品
    const shuffled = [...this.products].sort(() => Math.random() - 0.5);
    const item1 = shuffled[0];
    const item2 = shuffled[1];
    const totalPrice = item1.price + item2.price;

    this.currentQuestion.answer = totalPrice;

    let html = `
      <div class="game-container">
        <div class="question-area">
          <div class="question-text">超市购物</div>
        </div>
        <div class="shopping-visual">
          <div class="shopping-list">
            <div class="shopping-item pop-in">
              <span>${item1.emoji} ${item1.name}</span>
              <span>${item1.price}角</span>
            </div>
            <div class="shopping-item pop-in" style="animation-delay:0.1s">
              <span>${item2.emoji} ${item2.name}</span>
              <span>${item2.price}角</span>
            </div>
          </div>
          <div class="shopping-total pop-in" style="animation-delay:0.2s">
            一共要花多少钱？
          </div>
        </div>
        <div class="options-group">
    `;

    const options = this.generateOptions(totalPrice, 20);
    options.forEach(opt => {
      html += `<button class="option-btn" data-value="${opt}">${opt}角</button>`;
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

  checkMoneyAnswer(btn, value, correct) {
    if (this.currentQuestion.checked) return;
    this.currentQuestion.checked = true;

    if (value === correct) {
      btn.classList.add('correct');
      this.onCorrect();
    } else {
      btn.classList.add('wrong');
      this.streak = 0;
      this.onWrong();
      document.querySelectorAll('.option-btn').forEach(b => {
        if (b.dataset.value === correct) b.classList.add('correct');
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
    App.saveProgress(5, this.currentLevel.id, stars);
    setTimeout(() => App.showResult(stars, this.correctCount, this.totalQuestions), 600);
  },

  failLevel() {
    SoundManager.encourage();
    App.showResult(0, this.correctCount, this.totalQuestions);
  }
};
