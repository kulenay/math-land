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
    // 说明：AI 互动板块（pages/ai + cloudfunctions/aiChat）当前暂缓，
    // 为符合上架隐私要求不再初始化 wx.cloud（traceUser 会记录用户 OpenID）。
    // 以后启用 AI 时，恢复 wx.cloud.init 并确保隐私保护指引已同步更新。
  },
});
