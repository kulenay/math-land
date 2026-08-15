// 关卡地图：岛屿路径
const modules = require('../../modules/index.js');
const storage = require('../../core/storage.js');

Page({
  data: {
    statusBarHeight: 20,
    moduleId: '1',
    moduleName: '数一数',
    totalStars: 0,
    nodes: [],
  },

  onLoad(options) {
    this.moduleId = options.module || '1';
    const mod = modules.get(this.moduleId);
    if (!mod) {
      wx.showToast({ title: '模块不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 900);
      return;
    }
    this.mod = mod;
    this.setData({
      statusBarHeight: getApp().globalData.statusBarHeight,
      moduleId: this.moduleId,
      moduleName: mod.name,
    });
  },

  onShow() {
    this.buildNodes();
  },

  buildNodes() {
    const all = this.mod.impl.levels.getAllLevels(this.moduleId);
    const nodes = all.map((l, i) => {
      const unlocked = storage.isLevelUnlocked(this.moduleId, l.id);
      const stars = storage.getLevelStars(this.moduleId, l.id);
      const current = unlocked && stars === 0 && (i === 0 || storage.getLevelStars(this.moduleId, all[i - 1].id) > 0);
      return {
        id: l.id,
        name: l.name,
        desc: l.desc,
        unlocked,
        stars,
        starArr: Array.from({ length: stars }, (_, i) => i),
        offset: i % 2 === 0 ? 'left' : 'right',
        current,
        done: stars > 0 && !current, // 已通关且非当前关 → 显示完成角标
      };
    });
    this.setData({
      nodes,
      totalStars: storage.getModuleStars(this.moduleId),
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onLevelTap(e) {
    const id = e.currentTarget.dataset.id;
    const node = this.data.nodes.find((n) => n.id === id);
    if (!node || !node.unlocked) {
      wx.showToast({ title: '先通过上一关哦', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/game/game?module=${this.data.moduleId}&level=${id}` });
  },
});
