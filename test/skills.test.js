// ============================================
// skills/math-land 原子接口逻辑 execute（mock wx）
// 模拟 wx.modelContext 注册 + 逐个调用 7 个接口，
// 验证返回结构（isError/content/structuredContent）与业务正确性。
// 运行：node test/skills.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');
const SKILL = path.join(BASE, 'skills/math-land');

// ---- mock wx ----
let store = {};
const registered = {};
global.wx = {
  getStorageSync: (k) => store[k] || '',
  setStorageSync: (k, v) => { store[k] = v; },
  modelContext: {
    registerAPI: (name, fn) => { registered[name] = fn; },
  },
};

require(path.join(SKILL, 'index.js'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

/** 调用接口并断言通过判据（status 对应 invokeResult） */
async function call(name, args) {
  const fn = registered[name];
  assert(`${name} 已注册`, typeof fn === 'function');
  return await fn(args || {});
}

(async () => {
  console.log('== 注册完整性 ==');
  const expect = ['getProgress', 'getLevelInfo', 'generateQuestion', 'checkAnswer', 'computeStars', 'saveLevelResult', 'toggleSound'];
  assert(`7 个接口全部注册`, expect.every((n) => typeof registered[n] === 'function'), JSON.stringify(Object.keys(registered)));

  console.log('== getProgress ==');
  let r = await call('getProgress', {});
  assert('默认模块1返回进度', r.isError === false && r.structuredContent.moduleId === '1', JSON.stringify(r));
  assert('进度含 8 关', r.structuredContent.levels.length === 8);

  console.log('== getProgress 模块2 ==');
  r = await call('getProgress', { moduleId: '2' });
  assert('模块2含 6 关', r.structuredContent.levels.length === 6);

  console.log('== getLevelInfo ==');
  r = await call('getLevelInfo', { moduleId: '1', levelId: 1 });
  assert('关卡1信息', r.isError === false && r.structuredContent.name === '认识 1~3', JSON.stringify(r.structuredContent));
  r = await call('getLevelInfo', { moduleId: '1', levelId: 99 });
  assert('关卡不存在报错', r.isError === true);
  r = await call('getLevelInfo', { moduleId: '9', levelId: 1 });
  assert('模块不存在报错', r.isError === true);

  console.log('== generateQuestion ==');
  r = await call('generateQuestion', { moduleId: '1', levelId: 1 });
  assert('生成数一数题目', r.isError === false && r.structuredContent.question.type === 'scatter', JSON.stringify(r.structuredContent.question));
  const question = r.structuredContent.question;
  r = await call('generateQuestion', { moduleId: '2', levelId: 5 });
  assert('生成凑十题目', r.isError === false && r.structuredContent.question.type === 'make10');

  console.log('== checkAnswer ==');
  r = await call('checkAnswer', { question, answer: question.answer });
  assert('答对判定', r.isError === false && r.structuredContent.correct === true);
  r = await call('checkAnswer', { question, answer: (question.answer + 1) || 999 });
  assert('答错判定', r.structuredContent.correct === false);
  // compare 题型
  r = await call('checkAnswer', { question: { type: 'compare', answer: 'left' }, answer: 'left' });
  assert('compare 对', r.structuredContent.correct === true);
  // split 题型
  r = await call('checkAnswer', { question: { type: 'split' }, answer: [3, 7] });
  assert('split 凑十对', r.structuredContent.correct === true);
  r = await call('checkAnswer', { question: { type: 'split' }, answer: [3, 4] });
  assert('split 错', r.structuredContent.correct === false);
  // fillten 题型（目标恒 10）
  r = await call('checkAnswer', { question: { type: 'fillten' }, answer: 10 });
  assert('fillten 满十对', r.structuredContent.correct === true);
  // 缺参数报错
  r = await call('checkAnswer', {});
  assert('缺参数报错', r.isError === true);

  console.log('== computeStars ==');
  r = await call('computeStars', { firstCorrect: 6, total: 6 });
  assert('全对 3 星', r.structuredContent.stars === 3);
  r = await call('computeStars', { firstCorrect: 5, total: 6 });
  assert('5/6 2 星', r.structuredContent.stars === 2);
  r = await call('computeStars', { firstCorrect: 0, total: 6 });
  assert('0/6 1 星', r.structuredContent.stars === 1);

  console.log('== saveLevelResult ==');
  r = await call('saveLevelResult', { moduleId: '1', levelId: 1, stars: 3, firstCorrect: 6 });
  assert('保存 3 星', r.isError === false && r.structuredContent.bestStars === 3);
  r = await call('getProgress', { moduleId: '1' });
  assert('进度反映新星级', r.structuredContent.levels[0].stars === 3);
  r = await call('saveLevelResult', { moduleId: '1', levelId: 1, stars: 2 });
  assert('低星不覆盖', r.structuredContent.bestStars === 3);
  r = await call('saveLevelResult', { moduleId: '1', levelId: 1, stars: 5 });
  assert('星级越界报错', r.isError === true);

  console.log('== toggleSound ==');
  r = await call('toggleSound', { on: false });
  assert('关闭音效', r.isError === false && r.structuredContent.soundOn === false);
  r = await call('toggleSound', {});
  assert('查询状态（关）', r.structuredContent.soundOn === false);
  r = await call('toggleSound', { on: true });
  assert('开启音效', r.structuredContent.soundOn === true);

  console.log('== 未知接口 ==');
  assert('未注册接口不存在', typeof registered['notExist'] === 'undefined');

  console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('❌ 崩溃:', e); process.exit(1); });
