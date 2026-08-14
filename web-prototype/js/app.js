/* ============================================
   数感探索乐园 - 主逻辑
   ============================================ */

const App = {
  modules: [Module1],
  currentModule: null,
  currentLevel: null,
  progress: {},

  // 初始化
  init() {
    // 加载进度
    this.loadProgress();

    // 初始化引擎
    SoundManager.init();
    DragEngine.init();

    // 绑定事件
    this.bindEvents();

    // 更新首页星星
    this.updateHomeStars();
  },

  // 绑定全局事件
  bindEvents() {
    // 开始按钮
    document.getElementById('btn-start').addEventListener('click', () => {
      SoundManager.resume();
      SoundManager.click();
      this.showScreen('home-screen');
    });

    // 模块卡片
    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', () => {
        const moduleId = parseInt(card.dataset.module);
        if (card.classList.contains('locked')) {
          SoundManager.wrong();
          return;
        }
        SoundManager.click();
        this.openModule(moduleId);
      });
    });

    // 返回主页
    document.getElementById('btn-back-home').addEventListener('click', () => {
      SoundManager.click();
      this.showScreen('home-screen');
      this.updateHomeStars();
    });

    // 返回关卡列表
    document.getElementById('btn-back-levels').addEventListener('click', () => {
      SoundManager.click();
      this.showScreen('level-screen');
    });

    // 结算页按钮
    document.getElementById('btn-retry').addEventListener('click', () => {
      SoundManager.click();
      this.startLevel(this.currentLevel.id);
    });

    document.getElementById('btn-next').addEventListener('click', () => {
      SoundManager.click();
      const nextId = this.currentLevel.id + 1;
      const module = this.modules.find(m => m.name === this.currentModule.name);
      if (nextId <= module.levels.length) {
        this.startLevel(nextId);
      } else {
        this.showScreen('home-screen');
      }
    });

    document.getElementById('btn-home').addEventListener('click', () => {
      SoundManager.click();
      this.showScreen('home-screen');
      this.updateHomeStars();
    });
  },

  // 切换屏幕
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  },

  // 打开模块
  openModule(moduleId) {
    this.currentModule = this.modules.find(m => m.levels[0]?.id > (moduleId - 1) * 5);
    if (!this.currentModule) return;

    // 更新关卡页标题
    document.getElementById('level-module-title').textContent = this.currentModule.emoji + ' ' + this.currentModule.name;

    // 渲染关卡路径
    this.renderLevelPath();

    this.showScreen('level-screen');
  },

  // 渲染关卡路径
  renderLevelPath() {
    const path = document.getElementById('level-path');
    const module = this.currentModule;
    const progress = this.getModuleProgress(1);

    let html = '';

    module.levels.forEach((level, index) => {
      const levelProgress = progress[level.id];
      const isCompleted = levelProgress && levelProgress.stars > 0;
      const isCurrent = !isCompleted && (index === 0 || progress[level.id - 1]);
      const isLocked = !isCompleted && !isCurrent;

      // 节点
      let nodeClass = 'level-node';
      if (isCompleted) nodeClass += ' completed';
      else if (isCurrent) nodeClass += ' current';
      else nodeClass += ' locked';

      html += `
        <div class="${nodeClass}" data-level="${level.id}" ${isLocked ? '' : 'onclick="App.startLevel(' + level.id + ')"'}>
          <span>${level.id}</span>
          ${isCompleted ? '<div class="level-node-stars">' + '⭐'.repeat(levelProgress.stars) + '</div>' : ''}
        </div>
      `;

      // 连接线（不是最后一个）
      if (index < module.levels.length - 1) {
        html += `<div class="level-connector ${isCompleted ? 'completed' : ''}"></div>`;
      }
    });

    path.innerHTML = html;
  },

  // 开始关卡
  startLevel(levelId) {
    this.currentLevel = this.currentModule.levels.find(l => l.id === levelId);
    this.currentModule.startLevel(levelId);
  },

  // 更新游戏头部
  updateGameHeader(name, current, total) {
    document.getElementById('game-level-name').textContent = name;
    document.getElementById('game-progress').textContent = `${current} / ${total}`;
  },

  // 更新生命值
  updateHearts(count) {
    const hearts = document.getElementById('game-hearts');
    hearts.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.textContent = '❤️';
      if (i >= count) span.classList.add('lost');
      hearts.appendChild(span);
    }
  },

  // 显示反馈动画
  showFeedback(emoji) {
    const feedback = document.getElementById('game-feedback');
    feedback.textContent = emoji;
    feedback.classList.add('show');
    setTimeout(() => feedback.classList.remove('show'), 800);
  },

  // 显示结算页
  showResult(stars, correct, total) {
    const emoji = document.getElementById('result-emoji');
    const title = document.getElementById('result-title');
    const starsEl = document.getElementById('result-stars');
    const message = document.getElementById('result-message');

    if (stars > 0) {
      emoji.textContent = '🎉';
      title.textContent = '太棒了！';
      starsEl.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '⭐';
        if (i < stars) star.style.opacity = '1';
        starsEl.appendChild(star);
      }
      message.textContent = `答对了 ${correct}/${total} 题，获得 ${stars} 颗星！`;
      document.getElementById('btn-next').style.display = 'block';
    } else {
      emoji.textContent = '💪';
      title.textContent = '继续加油！';
      starsEl.innerHTML = '☆☆☆';
      message.textContent = `答对了 ${correct}/${total} 题，再试一次吧！`;
      document.getElementById('btn-next').style.display = 'none';
    }

    this.showScreen('result-screen');
  },

  // 保存进度
  saveProgress(moduleId, levelId, stars) {
    if (!this.progress[moduleId]) this.progress[moduleId] = {};

    const existing = this.progress[moduleId][levelId] || { stars: 0 };
    if (stars > existing.stars) {
      this.progress[moduleId][levelId] = {
        stars: stars,
        timestamp: Date.now()
      };
    }

    try {
      localStorage.setItem('mathland_progress', JSON.stringify(this.progress));
    } catch (e) {
      console.warn('保存进度失败:', e);
    }
  },

  // 加载进度
  loadProgress() {
    try {
      const saved = localStorage.getItem('mathland_progress');
      if (saved) {
        this.progress = JSON.parse(saved);
      }
    } catch (e) {
      this.progress = {};
    }
  },

  // 获取模块进度
  getModuleProgress(moduleId) {
    return this.progress[moduleId] || {};
  },

  // 获取总星星数
  getTotalStars() {
    let total = 0;
    for (const moduleId in this.progress) {
      for (const levelId in this.progress[moduleId]) {
        total += this.progress[moduleId][levelId].stars;
      }
    }
    return total;
  },

  // 更新首页星星显示
  updateHomeStars() {
    document.getElementById('total-stars').textContent = this.getTotalStars();

    // 更新模块解锁状态
    const module1Stars = this.getModuleProgress(1);
    const module1Complete = Object.keys(module1Stars).length >= 3; // 完成3关解锁下一模块

    document.querySelectorAll('.module-card').forEach(card => {
      const moduleId = parseInt(card.dataset.module);
      if (moduleId === 1) return; // 模块一始终解锁

      if (module1Complete || moduleId <= 1) {
        card.classList.remove('locked');
        const lock = card.querySelector('.module-lock');
        if (lock) lock.remove();
      }
    });
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
