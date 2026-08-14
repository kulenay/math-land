// ============================================
// 游戏页完整流程测试（mock wx + Page）
// 覆盖：通关结算（曾因 this.total 未赋值崩溃）、
//       首答计数、答错重试、自动跳转下一关/回地图
// 运行：node test/game-flow.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');

let store = {};
const calls = { redirectTo: [], navigateBack: 0 };
global.wx = {
  getStorageSync: (k) => store[k] || '',
  setStorageSync: (k, v) => { store[k] = v; },
  createInnerAudioContext: () => ({ stop() {}, play() {} }),
  navigateTo: () => {},
  redirectTo: (o) => calls.redirectTo.push(o.url),
  navigateBack: () => { calls.navigateBack++; },
  showToast: () => {},
};
let pageCfg = null;
global.Page = (cfg) => { pageCfg = cfg; };
global.getApp = () => ({ globalData: { statusBarHeight: 20, soundOn: true } });

require(path.join(BASE, 'pages/game/game.js'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function newInst() {
  const inst = Object.assign({}, pageCfg);
  inst.data = JSON.parse(JSON.stringify(pageCfg.data));
  inst.setData = function (patch) { Object.assign(this.data, patch); };
  return inst;
}

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

/** 答当前题：点正确选项（构建题直接模拟到目标） */
async function answerCurrent(inst, correct) {
  const view = inst.data.view;
  if (view.type === 'tenframe' || view.type === 'feed') {
    // 构建题：模拟填到目标（无取出）
    const target = view.target;
    for (let n = 0; n < target; n++) {
      if (view.type === 'tenframe') {
        const idx = view.cells.findIndex((c) => c === 0);
        inst.onCellTap.call(inst, { currentTarget: { dataset: { index: idx } } });
      } else {
        const idx = view.bugs.findIndex((_, i) => !view.plate.includes(i));
        inst.onBugTap.call(inst, { currentTarget: { dataset: { index: idx } } });
      }
      await sleep(60);
    }
  } else if (view.type === 'match') {
    // match 是点堆交互，按 answerIndex 判定
    const key = correct ? String(inst.q.answerIndex) : '0';
    inst.onGroupTap.call(inst, { currentTarget: { dataset: { key } } });
    await sleep(30);
  } else {
    const key = correct ? String(inst.q.answer) : 'wrong';
    inst.onOptionTap.call(inst, { currentTarget: { dataset: { key } } });
    await sleep(30);
  }
  await sleep(1000); // 等 advance 的 900ms timer
}

(async () => {
  // 场景 A：第 1 关全对
  console.log('== 场景 A：第1关全对 ==');
  calls.redirectTo = [];
  const a = newInst();
  a.onLoad.call(a, { module: '1', level: '1' });
  for (let i = 0; i < 6; i++) await answerCurrent(a, true);
  assert('通关后 result 弹出', a.data.result !== null);
  assert('全对 firstCorrect=6', a.firstCorrect === 6);
  assert('全对 3 星', a.data.starList.length === 3);
  assert('第1关 hasNext=true', a.data.hasNext === true);
  assert('进度条满', a.data.progress === 100);
  assert('存档已写入（第1关3星）', store.ml_progress_v1 && store.ml_progress_v1.modules['1'].stars['1'] === 3);
  await sleep(2600); // 等自动跳转 2400ms
  assert('自动跳转到第2关', calls.redirectTo.length === 1 && calls.redirectTo[0].includes('level=2'));

  // 场景 B：第 1 关第一题答错再答对
  console.log('== 场景 B：第1关首题答错 ==');
  const b = newInst();
  b.onLoad.call(b, { module: '1', level: '1' });
  await answerCurrent(b, false); // 点错误选项 → 温和重试
  assert('答错后仍在本关（重试）', b.data.questionIndex === 1 && b.data.result === null);
  await answerCurrent(b, true); // 重试答对
  for (let i = 1; i < 6; i++) await answerCurrent(b, true);
  assert('首题答错 firstCorrect=5', b.firstCorrect === 5);
  assert('5/6 → 2 星', b.data.starList.length === 2);

  // 场景 C：第 8 关（最后一关）通关 → 自动回地图
  console.log('== 场景 C：最后一关通关 ==');
  calls.navigateBack = 0;
  const c = newInst();
  c.onLoad.call(c, { module: '1', level: '8' });
  for (let i = 0; i < 6; i++) await answerCurrent(c, true);
  assert('最后一关 hasNext=false', c.data.hasNext === false);
  await sleep(2600);
  assert('自动回地图', calls.navigateBack === 1);

  // 场景 D：不存在的关卡
  console.log('== 场景 D：非法关卡 ==');
  const d = newInst();
  d.onLoad.call(d, { module: '1', level: '99' });
  assert('非法关卡不崩溃', true);

  console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();
