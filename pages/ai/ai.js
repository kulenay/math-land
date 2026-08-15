// AI 互动板块：问跳跳（AI 数学小老师）
// 通过云函数 aiChat 转发到 OpenAI 兼容接口（GLM-5.2）
const PRESETS = [
  { q: '7 + 8 等于多少？', icon: '➕' },
  { q: '什么是十格阵？', icon: '🔟' },
  { q: '5 可以分成几和几？', icon: '✂️' },
  { q: '我数到 10，然后呢？', icon: '🔢' },
  { q: '给我出一道简单的题', icon: '📝' },
];

Page({
  data: {
    statusBarHeight: 20,
    cloudReady: true,
    messages: [],       // { role: 'user' | 'assistant', text, loading }
    input: '',
    loading: false,
    presets: PRESETS,
    scrollTo: '',
  },

  onLoad() {
    this.setData({ statusBarHeight: getApp().globalData.statusBarHeight });
    if (!wx.cloud) {
      this.setData({
        cloudReady: false,
        messages: [{
          role: 'assistant',
          text: '当前基础库不支持云开发，请升级微信后重试（或检查是否已开通云开发）。',
        }],
      });
    }
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  // 点预设问题
  onPresetTap(e) {
    const q = e.currentTarget.dataset.q;
    if (!q || this.data.loading) return;
    this.send(q);
  },

  // 点发送按钮
  onSend() {
    const text = this.data.input.trim();
    if (!text || this.data.loading) return;
    this.setData({ input: '' });
    this.send(text);
  },

  // 发送一条消息并请求 AI
  send(text) {
    const history = this.data.messages.map((m) => ({
      role: m.role,
      content: m.text,
    }));
    const messages = this.data.messages.concat([{ role: 'user', text }]);
    this.setData({
      messages: messages.concat([{ role: 'assistant', text: '', loading: true }]),
      loading: true,
    });
    this.scrollBottom();

    wx.cloud.callFunction({
      name: 'aiChat',
      data: { messages: history.concat([{ role: 'user', content: text }]) },
    })
      .then((res) => {
        const r = res.result || {};
        const list = this.data.messages.slice();
        const last = list[list.length - 1];
        if (last && last.loading) {
          last.loading = false;
          last.text = r.ok ? r.text : (r.error || 'AI 老师开小差了，再试一次吧～');
        }
        this.setData({ messages: list, loading: false });
        this.scrollBottom();
      })
      .catch(() => {
        const list = this.data.messages.slice();
        const last = list[list.length - 1];
        if (last && last.loading) {
          last.loading = false;
          last.text = '连接 AI 老师失败，请检查云函数是否已部署。';
        }
        this.setData({ messages: list, loading: false });
        this.scrollBottom();
      });
  },

  scrollBottom() {
    const len = this.data.messages.length;
    this.setData({ scrollTo: 'msg-' + Math.max(0, len - 1) });
  },

  onBack() {
    wx.navigateBack();
  },
});
