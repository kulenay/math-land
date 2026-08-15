// 数感探索乐园 - 全局逻辑
App({
  globalData: {
    statusBarHeight: 20, // 状态栏高度，onLaunch 时计算
    soundOn: true,       // 音效开关（与存档同步）
  },

  onLaunch() {
    // 计算状态栏高度（自定义导航需要）
    try {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.globalData.statusBarHeight = win.statusBarHeight || 20;
    } catch (e) {
      this.globalData.statusBarHeight = 20;
    }

    // 读取音效设置
    const settings = wx.getStorageSync('ml_settings');
    if (settings && typeof settings.soundOn === 'boolean') {
      this.globalData.soundOn = settings.soundOn;
    }

    // 云开发初始化（AI 互动板块用；未开通云开发时静默降级）
    if (wx.cloud) {
      try {
        wx.cloud.init({ traceUser: true });
      } catch (e) {
        // 忽略：AI 板块页面会自行提示
      }
    }
  },
});
