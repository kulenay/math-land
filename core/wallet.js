// ============================================
// core/wallet.js - 数字钱包（财商启蒙）
// 零钱 + 储蓄罐：完成任务挣钱、消费花钱、储蓄吃复利利息。
// 金额一律用「分」存储（整数运算，避免浮点误差），展示时转元。
// 数据模型（ml_wallet）：
// {
//   balance: 0,            // 零钱（分）
//   savings: 0,            // 储蓄（分）
//   lastInterestDay: '',   // 上次结息日 'YYYY-MM-DD'
//   history: [],           // { time, type: earn|spend|save|withdraw|interest, amount(分), desc }
//   done: {},              // taskId -> 'YYYY-MM-DD'（任务最近完成日，每日一次）
//   config: { pin, interestRate, tasks: [], spends: [] }
// }
// ============================================

const KEY = 'ml_wallet';
const MAX_INTEREST_DAYS = 7; // 久未打开最多补 7 天利息，防止暴涨

// 默认配置（家长可在设置页调整）
const DEFAULT_CONFIG = {
  pin: '0000',
  interestRate: 1, // 每天利息（百分比，1 = 1%/天）
  tasks: [
    { id: 1, emoji: '🧹', name: '扫地', amount: 100 },
    { id: 2, emoji: '🧺', name: '叠衣服', amount: 200 },
    { id: 3, emoji: '🍽️', name: '摆碗筷', amount: 50 },
    { id: 4, emoji: '📚', name: '整理书桌', amount: 100 },
    { id: 5, emoji: '🗑️', name: '倒垃圾', amount: 50 },
  ],
  spends: [
    { id: 1, emoji: '📱', name: '玩手机 30 分钟', amount: 100 },
    { id: 2, emoji: '🍭', name: '吃一颗糖', amount: 50 },
    { id: 3, emoji: '🧸', name: '买小玩具', amount: 500 },
  ],
};

let cached = null;

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayDiff(fromStr, toStr) {
  const f = new Date(fromStr + 'T00:00:00Z').getTime();
  const t = new Date(toStr + 'T00:00:00Z').getTime();
  return Math.round((t - f) / 86400000);
}

function cloneConfig(cfg) {
  return {
    pin: (cfg && cfg.pin) || '0000',
    interestRate: Number.isFinite(cfg && cfg.interestRate) ? cfg.interestRate : 1,
    tasks: (cfg && cfg.tasks || []).map((t) => Object.assign({}, t)),
    spends: (cfg && cfg.spends || []).map((s) => Object.assign({}, s)),
  };
}

function defaultState() {
  return {
    balance: 0,
    savings: 0,
    lastInterestDay: '',
    history: [],
    done: {},
    config: cloneConfig(DEFAULT_CONFIG),
  };
}

function load() {
  if (cached) return cached;
  let raw = null;
  try {
    raw = wx.getStorageSync(KEY);
  } catch (e) { /* 忽略 */ }
  const st = raw && typeof raw === 'object' ? raw : defaultState();
  // 兼容旧存档缺字段
  if (!st.config) st.config = cloneConfig(DEFAULT_CONFIG);
  if (!st.history) st.history = [];
  if (!st.done) st.done = {};
  if (!Number.isFinite(st.balance)) st.balance = 0;
  if (!Number.isFinite(st.savings)) st.savings = 0;
  cached = st;
  return st;
}

function save() {
  try {
    wx.setStorageSync(KEY, cached);
  } catch (e) { /* 存储失败静默 */ }
}

/** 重载（外部改动后调用；测试用）。 */
function reload() {
  cached = null;
  return load();
}

/** 清空钱包（家长重置用）。 */
function resetAll() {
  cached = defaultState();
  save();
  return cached;
}

// ---------- 利息（复利） ----------

/** 每日结息：跨天则按复利计算储蓄利息（savings × rate%，日复利）。 */
function settleInterest(state) {
  const today = todayStr();
  if (!state.lastInterestDay) {
    state.lastInterestDay = today;
    return state;
  }
  if (state.lastInterestDay === today) return state;
  const days = Math.min(Math.max(dayDiff(state.lastInterestDay, today), 1), MAX_INTEREST_DAYS);
  const rate = Math.max(0, Number.isFinite(state.config.interestRate) ? state.config.interestRate : 1);
  let total = state.savings;
  for (let i = 0; i < days; i++) {
    if (total <= 0) break;
    const interest = Math.floor((total * rate) / 100); // 分向下取整
    if (interest <= 0) break;
    total += interest;
    state.history.push({
      time: Date.now(),
      type: 'interest',
      amount: interest,
      desc: `储蓄利息 +${rate}%（复利）`,
    });
  }
  state.savings = total;
  state.lastInterestDay = today;
  return state;
}

// ---------- 交易 ----------

/** 完成任务领取奖励（每个任务每天一次）。 */
function completeTask(state, taskId) {
  const task = state.config.tasks.find((t) => t.id === taskId);
  if (!task) return { ok: false, error: '任务不存在' };
  if (state.done[String(taskId)] === todayStr()) {
    return { ok: false, error: '今天已经完成过啦' };
  }
  state.balance += task.amount;
  state.done[String(taskId)] = todayStr();
  state.history.push({ time: Date.now(), type: 'earn', amount: task.amount, desc: task.name });
  return { ok: true, amount: task.amount };
}

/** 消费扣钱（余额不足拒绝）。 */
function spend(state, spendId) {
  const s = state.config.spends.find((x) => x.id === spendId);
  if (!s) return { ok: false, error: '消费项不存在' };
  const amount = Math.abs(s.amount);
  if (state.balance < amount) {
    return { ok: false, error: '钱不够哦，先去完成任务挣钱吧！' };
  }
  state.balance -= amount;
  state.history.push({ time: Date.now(), type: 'spend', amount: -amount, desc: s.name });
  return { ok: true, amount: -amount };
}

/** 存钱进储蓄罐（零钱 → 储蓄）。 */
function saveMoney(state, amount) {
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: '金额不对' };
  if (state.balance < amount) return { ok: false, error: '零钱不够' };
  state.balance -= amount;
  state.savings += amount;
  state.history.push({ time: Date.now(), type: 'save', amount: -amount, desc: '存入储蓄罐' });
  return { ok: true };
}

/** 从储蓄罐取钱（储蓄 → 零钱）。 */
function withdraw(state, amount) {
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: '金额不对' };
  if (state.savings < amount) return { ok: false, error: '储蓄不够' };
  state.savings -= amount;
  state.balance += amount;
  state.history.push({ time: Date.now(), type: 'withdraw', amount, desc: '从储蓄罐取出' });
  return { ok: true };
}

// ---------- 家长配置 ----------

function setPin(state, pin) {
  if (!/^\d{4}$/.test(String(pin))) return { ok: false, error: 'PIN 需为 4 位数字' };
  state.config.pin = String(pin);
  return { ok: true };
}

function setInterestRate(state, rate) {
  const r = Number(rate);
  if (!Number.isFinite(r) || r < 0 || r > 20) return { ok: false, error: '利率需在 0~20 之间' };
  state.config.interestRate = Math.round(r * 10) / 10;
  return { ok: true };
}

function addTask(state, name, amount, emoji) {
  const n = String(name || '').trim().slice(0, 12);
  const a = Math.round(Number(amount) * 100); // 元 → 分
  if (!n) return { ok: false, error: '任务名不能为空' };
  if (!Number.isFinite(a) || a < 1) return { ok: false, error: '奖励金额需大于 0' };
  const id = state.config.tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  state.config.tasks.push({ id, emoji: emoji || '⭐', name: n, amount: a });
  return { ok: true };
}

function removeTask(state, taskId) {
  state.config.tasks = state.config.tasks.filter((t) => t.id !== taskId);
  return { ok: true };
}

function addSpend(state, name, amount, emoji) {
  const n = String(name || '').trim().slice(0, 12);
  const a = Math.round(Number(amount) * 100);
  if (!n) return { ok: false, error: '名称不能为空' };
  if (!Number.isFinite(a) || a < 1) return { ok: false, error: '金额需大于 0' };
  const id = state.config.spends.reduce((m, s) => Math.max(m, s.id), 0) + 1;
  state.config.spends.push({ id, emoji: emoji || '💰', name: n, amount: a });
  return { ok: true };
}

function removeSpend(state, spendId) {
  state.config.spends = state.config.spends.filter((s) => s.id !== spendId);
  return { ok: true };
}

/** 校验 PIN。 */
function checkPin(state, pin) {
  return String(pin) === state.config.pin;
}

// ---------- 展示辅助 ----------

/** 分 → "1.35 元"（保留 2 位，正数带 +）。 */
function formatFen(fen, sign = false) {
  const v = (fen / 100).toFixed(2);
  if (sign && fen > 0) return '+' + v + ' 元';
  if (fen < 0) return v + ' 元';
  return v + ' 元';
}

/** 储蓄主页 viewModel（供钱包页渲染）。 */
function buildView(state) {
  const today = todayStr();
  const tasks = state.config.tasks.map((t) => ({
    id: t.id,
    emoji: t.emoji,
    name: t.name,
    amount: t.amount,
    amountText: '+' + (t.amount / 100).toFixed(2) + ' 元',
    doneToday: state.done[String(t.id)] === today,
  }));
  const spends = state.config.spends.map((s) => ({
    id: s.id,
    emoji: s.emoji,
    name: s.name,
    amount: s.amount,
    amountText: '-' + (s.amount / 100).toFixed(2) + ' 元',
  }));
  const history = state.history.slice(-20).reverse().map((h) => ({
    type: h.type,
    desc: h.desc,
    amountText: formatFen(h.amount, true),
    timeText: formatTime(h.time),
  }));
  return {
    balance: state.balance,
    balanceText: (state.balance / 100).toFixed(2),
    savings: state.savings,
    savingsText: (state.savings / 100).toFixed(2),
    interestRate: state.config.interestRate,
    tasks,
    spends,
    history,
  };
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// 便捷入口：进入钱包时先结息再返回 viewModel
function open() {
  const state = load();
  settleInterest(state);
  save();
  return buildView(state);
}

module.exports = {
  KEY,
  DEFAULT_CONFIG,
  load,
  reload,
  resetAll,
  settleInterest,
  completeTask,
  spend,
  saveMoney,
  withdraw,
  setPin,
  setInterestRate,
  addTask,
  removeTask,
  addSpend,
  removeSpend,
  checkPin,
  formatFen,
  buildView,
  open,
  todayStr,
  dayDiff,
};
