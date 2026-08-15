// 数字钱包主页（孩子使用）：余额 / 储蓄罐（复利）/ 今日任务 / 消费 / 历史
const wallet = require('../../core/wallet.js');

Page({
  data: {
    statusBarHeight: 20,
    balanceText: '0.00',
    savingsText: '0.00',
    interestRate: 1,
    tasks: [],
    spends: [],
    history: [],
    // 存/取钱步进器
    saveAmount: 100,   // 分
    withdrawAmount: 100,
  },

  onLoad() {
    this.setData({ statusBarHeight: getApp().globalData.statusBarHeight });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const view = wallet.open();
    this.setData(Object.assign({}, view, {
      saveAmount: 100,
      withdrawAmount: 100,
    }));
  },

  // ---------- 任务奖励 ----------
  onTaskTap(e) {
    const id = Number(e.currentTarget.dataset.id);
    const r = wallet.completeTask(wallet.load(), id);
    if (r.ok) {
      wx.showToast({ title: `太棒了！+${(r.amount / 100).toFixed(2)} 元`, icon: 'none' });
      this.refresh();
    } else {
      wx.showToast({ title: r.error, icon: 'none' });
    }
  },

  // ---------- 消费 ----------
  onSpendTap(e) {
    const id = Number(e.currentTarget.dataset.id);
    const s = wallet.load().config.spends.find((x) => x.id === id);
    if (!s) return;
    wx.showModal({
      title: '确认消费',
      content: `${s.emoji} ${s.name}，要花 ${(s.amount / 100).toFixed(2)} 元，确定吗？`,
      confirmText: '确定',
      cancelText: '再想想',
      success: (res) => {
        if (!res.confirm) return;
        const r = wallet.spend(wallet.load(), id);
        if (r.ok) {
          wx.showToast({ title: '已支付', icon: 'none' });
        } else {
          wx.showToast({ title: r.error, icon: 'none' });
        }
        this.refresh();
      },
    });
  },

  // ---------- 存/取钱（步进器） ----------
  onSaveStep(e) {
    const delta = Number(e.currentTarget.dataset.delta);
    const next = Math.max(0, this.data.saveAmount + delta);
    this.setData({ saveAmount: next });
  },

  onSaveAll() {
    const st = wallet.load();
    this.setData({ saveAmount: st.balance });
  },

  onDoSave() {
    const r = wallet.saveMoney(wallet.load(), this.data.saveAmount);
    if (!r.ok) wx.showToast({ title: r.error, icon: 'none' });
    this.refresh();
  },

  onWithdrawStep(e) {
    const delta = Number(e.currentTarget.dataset.delta);
    const next = Math.max(0, this.data.withdrawAmount + delta);
    this.setData({ withdrawAmount: next });
  },

  onWithdrawAll() {
    const st = wallet.load();
    this.setData({ withdrawAmount: st.savings });
  },

  onDoWithdraw() {
    const r = wallet.withdraw(wallet.load(), this.data.withdrawAmount);
    if (!r.ok) wx.showToast({ title: r.error, icon: 'none' });
    this.refresh();
  },

  // ---------- 家长设置 ----------
  onSettings() {
    wx.navigateTo({ url: '/pages/wallet/settings' });
  },

  onBack() {
    wx.navigateBack();
  },
});
