// 主页：模块选择 + 生活板块（数字钱包）
const modules = require('../../modules/index.js');
const storage = require('../../core/storage.js');
const wallet = require('../../core/wallet.js');

Page({
  data: {
    statusBarHeight: 20,
    totalStars: 0,
    walletBalance: '0.00',
    moduleCards: [], // 已开发模块（可进），运行时从注册表生成
    lockedModules: [ // 未开发占位（锁定）
      { id: 6, icon: '🌉', name: '过河冒险', desc: '进退位' },
      { id: 7, icon: '💎', name: '数字搬家', desc: '位值' },
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
    this.setData({
      moduleCards,
      totalStars,
      walletBalance: (wallet.load().balance / 100).toFixed(2),
    });
  },

  onModuleTap(e) {
    const id = e.currentTarget.dataset.module;
    wx.navigateTo({ url: `/pages/map/map?module=${id}` });
  },

  // 未开发模块：给个温和反馈，不让孩子干等
  onLockedTap() {
    wx.showToast({ title: '该区域建设中，敬请期待～', icon: 'none' });
  },

  // 生活板块：数字钱包
  onWalletTap() {
    wx.navigateTo({ url: '/pages/wallet/wallet' });
  },
});
