// ============================================
// 数字钱包核心逻辑测试（mock wx）
// 运行：node test/wallet.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');

let store = {};
global.wx = {
  getStorageSync: (k) => store[k] || '',
  setStorageSync: (k, v) => { store[k] = v; },
  createInnerAudioContext: () => ({ stop() {}, play() {} }),
};

const wallet = require(path.join(BASE, 'core/wallet'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

function reset() {
  wallet.resetAll();
}

function yesterdayStr() {
  const d = new Date(Date.now() - 86400000);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// ---------- 默认状态 ----------
console.log('== 默认状态 ==');
reset();
let st = wallet.load();
assert('初始零钱 0', st.balance === 0);
assert('初始储蓄 0', st.savings === 0);
assert('默认 5 个任务', st.config.tasks.length === 5);
assert('默认 3 个消费项', st.config.spends.length === 3);
assert('默认利率 1', st.config.interestRate === 1);
assert('默认 PIN 0000', st.config.pin === '0000');

// ---------- 任务奖励 ----------
console.log('== 完成任务 ==');
reset();
st = wallet.load();
const task1 = st.config.tasks[0];
let r = wallet.completeTask(st, task1.id);
assert('完成任务加钱', r.ok && st.balance === task1.amount);
r = wallet.completeTask(st, task1.id);
assert('每任务每天一次', !r.ok && r.error.includes('今天'));
assert('历史记录入账', st.history[0].type === 'earn' && st.history[0].amount === task1.amount);
r = wallet.completeTask(st, 999);
assert('任务不存在拒绝', !r.ok);

// ---------- 消费 ----------
console.log('== 消费 ==');
reset();
st = wallet.load();
const sp1 = st.config.spends[0];
// 先挣 1 元
wallet.completeTask(st, st.config.tasks[0].id);
r = wallet.spend(st, sp1.id);
assert('消费扣钱', r.ok && st.balance === st.config.tasks[0].amount - sp1.amount);
assert('消费历史为负', st.history.find((h) => h.type === 'spend').amount === -sp1.amount);
reset();
st = wallet.load();
r = wallet.spend(st, sp1.id);
assert('余额不足拒绝', !r.ok && r.error.includes('不够'));

// ---------- 存取 ----------
console.log('== 存钱/取钱 ==');
reset();
st = wallet.load();
wallet.completeTask(st, st.config.tasks[0].id); // +100 分
r = wallet.saveMoney(st, 60);
assert('存钱 0.6 元', r.ok && st.balance === 40 && st.savings === 60);
r = wallet.saveMoney(st, 100);
assert('存钱超余额拒绝', !r.ok);
r = wallet.withdraw(st, 20);
assert('取钱 0.2 元', r.ok && st.balance === 60 && st.savings === 40);
r = wallet.withdraw(st, 9999);
assert('取钱超储蓄拒绝', !r.ok);
r = wallet.saveMoney(st, 0);
assert('金额 0 拒绝', !r.ok);
r = wallet.saveMoney(st, -50);
assert('金额负数拒绝', !r.ok);
r = wallet.saveMoney(st, 1.5);
assert('金额非整数拒绝', !r.ok);

// 1.5 元整数运算无浮点误差
reset();
st = wallet.load();
wallet.completeTask(st, st.config.tasks[0].id);
wallet.completeTask(st, st.config.tasks[1].id); // +100 +200
r = wallet.saveMoney(st, 150);
assert('150 分整数存取无误差', r.ok && st.savings === 150 && st.balance === 150);

// ---------- 复利 ----------
console.log('== 复利结息 ==');
reset();
st = wallet.load();
// 存 100 分（1 元），昨天结息 → 1% → 101
wallet.completeTask(st, st.config.tasks[0].id);
wallet.saveMoney(st, 100);
st.lastInterestDay = yesterdayStr();
wallet.settleInterest(st);
assert('单日复利 1%：100→101', st.savings === 101);
assert('历史有利息记录', st.history.some((h) => h.type === 'interest' && h.amount === 1));

// 7 天连续复利（封顶 7 天）：100 * 1.01 累加取整
reset();
st = wallet.load();
wallet.completeTask(st, st.config.tasks[0].id);
wallet.saveMoney(st, 100);
st.lastInterestDay = '2000-01-01';
wallet.settleInterest(st);
assert('久未打开最多补 7 天', st.savings === 107, 'savings=' + st.savings); // 100→101→102→…→107

// 0 储蓄不产生利息
reset();
st = wallet.load();
st.lastInterestDay = yesterdayStr();
wallet.settleInterest(st);
assert('0 储蓄无利息', st.savings === 0);

// 同日幂等
reset();
st = wallet.load();
wallet.completeTask(st, st.config.tasks[0].id);
wallet.saveMoney(st, 100);
st.lastInterestDay = wallet.todayStr();
wallet.settleInterest(st);
assert('同日不重复结息', st.savings === 100);

// ---------- 家长配置 ----------
console.log('== 家长配置 ==');
reset();
st = wallet.load();
assert('PIN 校验正确', wallet.checkPin(st, '0000') === true);
assert('PIN 校验错误', wallet.checkPin(st, '1234') === false);
r = wallet.setPin(st, '1234');
assert('修改 PIN 成功', r.ok && st.config.pin === '1234');
r = wallet.setPin(st, '12ab');
assert('非法 PIN 拒绝', !r.ok);
r = wallet.setInterestRate(st, 2.5);
assert('利率 2.5 保存', r.ok && st.config.interestRate === 2.5);
r = wallet.setInterestRate(st, 99);
assert('利率越界拒绝', !r.ok);
const before = st.config.tasks.length;
r = wallet.addTask(st, '浇花', 1.5, '🪴');
assert('新增任务成功', r.ok && st.config.tasks.length === before + 1);
assert('任务金额元转分', st.config.tasks[st.config.tasks.length - 1].amount === 150);
r = wallet.addTask(st, '', 1, '⭐');
assert('空任务名拒绝', !r.ok);
r = wallet.addTask(st, '测试', 0, '⭐');
assert('零金额拒绝', !r.ok);
wallet.removeTask(st, st.config.tasks[st.config.tasks.length - 1].id);
assert('删除任务', st.config.tasks.length === before);
const bf2 = st.config.spends.length;
wallet.addSpend(st, '买彩纸', 2, '🎨');
assert('新增消费项', st.config.spends.length === bf2 + 1);
wallet.removeSpend(st, st.config.spends[st.config.spends.length - 1].id);
assert('删除消费项', st.config.spends.length === bf2);

// ---------- 展示辅助 ----------
console.log('== 展示 ==');
assert('formatFen 100 → 1.00 元', wallet.formatFen(100) === '1.00 元');
assert('formatFen 带符号 +150 → +1.50 元', wallet.formatFen(150, true) === '+1.50 元');
assert('formatFen 负 -50 → -0.50 元', wallet.formatFen(-50) === '-0.50 元');
reset();
st = wallet.load();
wallet.completeTask(st, st.config.tasks[0].id);
const view = wallet.buildView(st);
assert('view 含余额文本', view.balanceText === '1.00');
assert('view 任务含 doneToday', view.tasks[0].doneToday === true);
assert('view 消费含金额文本', view.spends[0].amountText.startsWith('-'));

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
