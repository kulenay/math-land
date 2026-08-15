// 家长设置：PIN 解锁后管理任务/消费项/利率/改 PIN/重置
const wallet = require('../../core/wallet.js');

Page({
  data: {
    statusBarHeight: 20,
    locked: true,          // PIN 未解锁
    pin: '',
    pinError: '',
    tasks: [],
    spends: [],
    interestRate: 1,
    // 新增表单
    taskName: '',
    taskAmount: '1',
    taskEmoji: '⭐',
    spendName: '',
    spendAmount: '1',
    spendEmoji: '🎮',
    // 改 PIN
    newPin: '',
  },

  onLoad() {
    this.setData({ statusBarHeight: getApp().globalData.statusBarHeight });
  },

  // ---------- PIN 解锁 ----------
  onPinInput(e) {
    this.setData({ pin: e.detail.value, pinError: '' });
  },

  onPinConfirm() {
    const st = wallet.load();
    if (wallet.checkPin(st, this.data.pin)) {
      this.setData({ locked: false });
      this.refresh();
    } else {
      this.setData({ pinError: 'PIN 不对，再试一次', pin: '' });
    }
  },

  refresh() {
    const st = wallet.load();
    this.setData({
      tasks: st.config.tasks.map((t) => ({
        id: t.id,
        emoji: t.emoji,
        name: t.name,
        amountText: '+' + (t.amount / 100).toFixed(2) + ' 元',
      })),
      spends: st.config.spends.map((s) => ({
        id: s.id,
        emoji: s.emoji,
        name: s.name,
        amountText: '-' + (s.amount / 100).toFixed(2) + ' 元',
      })),
      interestRate: st.config.interestRate,
    });
  },

  // ---------- 任务管理 ----------
  onTaskInput(e) {
    this.setData({ taskName: e.detail.value });
  },
  onTaskAmount(e) {
    this.setData({ taskAmount: e.detail.value });
  },
  onTaskEmoji(e) {
    this.setData({ taskEmoji: e.detail.value });
  },
  onAddTask() {
    const r = wallet.addTask(wallet.load(), this.data.taskName, this.data.taskAmount, this.data.taskEmoji);
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' });
      return;
    }
    this.setData({ taskName: '', taskAmount: '1', taskEmoji: '⭐' });
    this.refresh();
    wx.showToast({ title: '已添加任务', icon: 'none' });
  },
  onRemoveTask(e) {
    const id = Number(e.currentTarget.dataset.id);
    wx.showModal({
      title: '删除任务',
      content: '确定删除这个任务吗？',
      confirmText: '删除',
      success: (res) => {
        if (!res.confirm) return;
        wallet.removeTask(wallet.load(), id);
        this.refresh();
      },
    });
  },

  // ---------- 消费管理 ----------
  onSpendInput(e) {
    this.setData({ spendName: e.detail.value });
  },
  onSpendAmount(e) {
    this.setData({ spendAmount: e.detail.value });
  },
  onSpendEmoji(e) {
    this.setData({ spendEmoji: e.detail.value });
  },
  onAddSpend() {
    const r = wallet.addSpend(wallet.load(), this.data.spendName, this.data.spendAmount, this.data.spendEmoji);
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' });
      return;
    }
    this.setData({ spendName: '', spendAmount: '1', spendEmoji: '🎮' });
    this.refresh();
    wx.showToast({ title: '已添加消费项', icon: 'none' });
  },
  onRemoveSpend(e) {
    const id = Number(e.currentTarget.dataset.id);
    wx.showModal({
      title: '删除消费项',
      content: '确定删除吗？',
      confirmText: '删除',
      success: (res) => {
        if (!res.confirm) return;
        wallet.removeSpend(wallet.load(), id);
        this.refresh();
      },
    });
  },

  // ---------- 利率 ----------
  onRateInput(e) {
    this.setData({ interestRate: e.detail.value });
  },
  onSaveRate() {
    const r = wallet.setInterestRate(wallet.load(), this.data.interestRate);
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' });
      return;
    }
    this.refresh();
    wx.showToast({ title: '利率已保存', icon: 'none' });
  },

  // ---------- 改 PIN ----------
  onNewPin(e) {
    this.setData({ newPin: e.detail.value });
  },
  onSavePin() {
    const r = wallet.setPin(wallet.load(), this.data.newPin);
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' });
      return;
    }
    this.setData({ newPin: '' });
    wx.showToast({ title: 'PIN 已更新', icon: 'none' });
  },

  // ---------- 重置 ----------
  onReset() {
    wx.showModal({
      title: '重置钱包',
      content: '清空余额、储蓄和所有记录？此操作不可恢复！',
      confirmText: '重置',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (!res.confirm) return;
        wallet.resetAll();
        this.refresh();
        wx.showToast({ title: '钱包已重置', icon: 'none' });
      },
    });
  },

  onBack() {
    wx.navigateBack();
  },
});
