// 主页：模块选择
const modules = require('../../modules/index.js');
const storage = require('../../core/storage.js');

Page({
  data: {
    statusBarHeight: 20,
    totalStars: 0,
    moduleCards: [], // 已开发模块（可进），运行时从注册表生成
    lockedModules: [ // 未开发占位（锁定）
      { id: 3, icon: '🏠', name: '数字搬家', desc: '位值' },
      { id: 4, icon: '🌉', name: '过河冒险', desc: '进退位' },
      { id: 5, icon: '🛒', name: '购物乐园', desc: '人民币' },
    ],
  },

  onLoad() {
    this.setData({ statusBarHeight: getApp().globalData.statusBarHeight });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const moduleCards = modules.getAll().map((m) => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      desc: m.desc,
      stars: storage.getModuleStars(m.id),
    }));
    const totalStars = moduleCards.reduce((sum, c) => sum + c.stars, 0);
    this.setData({ moduleCards, totalStars });
  },

  onModuleTap(e) {
    const id = e.currentTarget.dataset.module;
    wx.navigateTo({ url: `/pages/map/map?module=${id}` });
  },

  // 调试入口：连点跳跳 5 次解锁已开发模块全部关卡
  onFrogTap() {
    this._frogTaps = (this._frogTaps || 0) + 1;
    if (this._frogTaps >= 5) {
      this._frogTaps = 0;
      modules.getAll().forEach((m) => storage.unlockAll(m.id));
      this.refresh();
      wx.showToast({ title: '已解锁全部关卡 ⭐', icon: 'none' });
    }
  },
});
