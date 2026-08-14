// 主页：模块选择
const storage = require('../../core/storage');

Page({
  data: {
    statusBarHeight: 20,
    totalStars: 0,
    module1Stars: 0,
    lockedModules: [
      { id: 2, icon: '📦', name: '凑十魔法', desc: '十进制' },
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
    const module1Stars = storage.getModuleStars(1);
    this.setData({
      module1Stars,
      totalStars: module1Stars,
    });
  },

  onModuleTap(e) {
    const id = e.currentTarget.dataset.module;
    wx.navigateTo({ url: `/pages/map/map?module=${id}` });
  },

  // 调试入口：连点跳跳 5 次解锁全部关卡
  onFrogTap() {
    this._frogTaps = (this._frogTaps || 0) + 1;
    if (this._frogTaps >= 5) {
      this._frogTaps = 0;
      storage.unlockAll(1);
      this.refresh();
      wx.showToast({ title: '已解锁全部关卡 ⭐', icon: 'none' });
    }
  },
});
