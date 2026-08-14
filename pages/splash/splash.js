// 启动页
Page({
  data: {
    statusBarHeight: 20,
  },

  onLoad() {
    this.setData({ statusBarHeight: getApp().globalData.statusBarHeight });
  },

  onStart() {
    wx.redirectTo({ url: '/pages/home/home' });
  },
});
