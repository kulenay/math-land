// ============================================
// 时间与钱币模块测试（纯逻辑，无需 mock wx）
// 运行：node test/clock.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');

const modules = require(path.join(BASE, 'modules/index'));
const clock = require(path.join(BASE, 'modules/clock'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

// ---------- 模块注册表 ----------
console.log('== modules 注册表 ==');
assert('get(5) 时间与钱币', modules.get('5') && modules.get('5').name === '时间与钱币');
assert('模块接口完整', ['levels', 'questions', 'renderers'].every((k) => clock[k]));

// ---------- levels ----------
console.log('== clock levels ==');
const all = clock.levels.getAllLevels('5');
assert('6 关', all.length === 6);
assert('关卡 id 连续 1..6', all.every((l, i) => l.id === i + 1));
assert('非模块5返回空', clock.levels.getAllLevels('1').length === 0);
assert('getLevel 正确', clock.levels.getLevel('5', 4).name === '认识钱币');
assert('getLevel 越界 null', clock.levels.getLevel('5', 99) === null);

// ---------- questions ----------
console.log('== clock questions ==');
let genIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    clock.questions.generateLevel(lvl).forEach((q) => {
      switch (q.type) {
        case 'clock': {
          if (q.hour < 1 || q.hour > 12) genIssues++;
          const expectKey = q.half ? q.hour + ':30' : q.hour + ':00';
          if (q.answer !== expectKey) genIssues++;
          if (q.options.length !== 4) genIssues++;
          if (!q.options.some((o) => o.key === q.answer)) genIssues++;
          // label 与 key 对应
          q.options.forEach((o) => {
            const half = o.key.endsWith(':30');
            const h = parseInt(o.key, 10);
            if (o.label !== (half ? h + '点半' : h + '点')) genIssues++;
          });
          // 按关卡约束整点/半点
          if (lvl.half === false && q.half) genIssues++;
          if (lvl.half === true && !q.half) genIssues++;
          break;
        }
        case 'coin':
          if (q.options.length !== 3) genIssues++;
          if (q.coin.key !== q.answer) genIssues++;
          if (!q.options.some((o) => o.key === q.answer)) genIssues++;
          break;
        case 'money':
          if (!q.coins.length) genIssues++;
          if (!q.options.some((o) => o.key === q.answer)) genIssues++;
          break;
        case 'pay':
          if (q.enough !== (q.money >= q.price)) genIssues++;
          if (!q.options.some((o) => o.key === q.answer)) genIssues++;
          break;
      }
    });
  });
}
assert('30 轮全关生成无异常', genIssues === 0, 'issues=' + genIssues);

// L3 混合关应同时出现整点和半点
let hasWhole = false, hasHalf = false;
for (let round = 0; round < 30; round++) {
  clock.questions.generateLevel(all[2]).forEach((q) => {
    if (q.half) hasHalf = true; else hasWhole = true;
  });
}
assert('L3 混合关含整点', hasWhole);
assert('L3 混合关含半点', hasHalf);

// 选项唯一且含答案
let optIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    clock.questions.generateLevel(lvl).forEach((q) => {
      const keys = q.options.map((o) => o.key);
      if (new Set(keys).size !== keys.length) optIssues++;
      if (!keys.includes(q.answer)) optIssues++;
    });
  });
}
assert('选项均唯一且含答案', optIssues === 0, 'issues=' + optIssues);

// 各关卡题目数
all.forEach((lvl) => {
  const qs = clock.questions.generateLevel(lvl);
  assert(`L${lvl.id} 题目数=${lvl.questionCount}`, qs.length === lvl.questionCount);
});

// ---------- renderers ----------
console.log('== clock renderers ==');
assert('整点 3 点时针 90° 分针 0°',
  clock.renderers.buildView({ type: 'clock', hour: 3, half: false }).hourAngle === 90
  && clock.renderers.buildView({ type: 'clock', hour: 3, half: false }).minuteAngle === 0);
assert('半点 3 点半时针 105° 分针 180°',
  clock.renderers.buildView({ type: 'clock', hour: 3, half: true }).hourAngle === 105
  && clock.renderers.buildView({ type: 'clock', hour: 3, half: true }).minuteAngle === 180);
assert('12 点时针 0°',
  clock.renderers.buildView({ type: 'clock', hour: 12, half: false }).hourAngle === 0);

let vmIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    clock.questions.generateLevel(lvl).forEach((q) => {
      const vm = clock.renderers.buildView(q);
      if (!vm.question || !vm.options || !vm.options.length) vmIssues++;
      switch (vm.type) {
        case 'clock':
          if (typeof vm.hourAngle !== 'number' || typeof vm.minuteAngle !== 'number') vmIssues++;
          break;
        case 'coin':
          if (!vm.coin || !vm.coin.color || !vm.coin.label) vmIssues++;
          break;
        case 'money':
          if (vm.coins.length !== q.coins.length) vmIssues++;
          break;
        case 'pay':
          if (vm.coins.length !== q.money) vmIssues++;
          break;
      }
    });
  });
}
assert('viewModel 结构正确', vmIssues === 0, 'issues=' + vmIssues);

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
