// ============================================
// 生活大冒险模块测试（纯逻辑，无需 mock wx）
// 运行：node test/life.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');

const modules = require(path.join(BASE, 'modules/index'));
const life = require(path.join(BASE, 'modules/life'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

// ---------- 模块注册表 ----------
console.log('== modules 注册表 ==');
assert('get(3) 生活大冒险', modules.get('3') && modules.get('3').name === '生活大冒险');
assert('模块接口完整', ['levels', 'questions', 'renderers'].every((k) => life[k]));

// ---------- levels ----------
console.log('== life levels ==');
const all = life.levels.getAllLevels('3');
assert('6 关', all.length === 6);
assert('关卡 id 连续 1..6', all.every((l, i) => l.id === i + 1));
assert('非模块3返回空', life.levels.getAllLevels('1').length === 0);
assert('getLevel 正确', life.levels.getLevel('3', 2).name === '公交车上');
assert('getLevel 越界 null', life.levels.getLevel('3', 99) === null);

// ---------- questions ----------
console.log('== life questions ==');
let genIssues = 0;
for (let round = 0; round < 30; round++) {
  const qs = life.questions.generateLevel(all[5]); // 第 6 关混合所有题型
  qs.forEach((q) => {
    switch (q.type) {
      case 'order':
        if (q.count < 1 || q.count > 6) genIssues++;
        break;
      case 'bus':
        if (q.result < 1 || q.result > 10) genIssues++;
        // 上车: base+delta=result；下车: base-delta=result
        if (q.up ? q.base + q.delta !== q.result : q.base - q.delta !== q.result) genIssues++;
        break;
      case 'share':
        if (q.total !== q.friends * q.per || q.per < 1) genIssues++;
        if (![2, 3].includes(q.friends)) genIssues++;
        break;
      case 'shop':
        if (q.total !== q.count || q.count < 1) genIssues++;
        break;
      case 'queue':
        if (q.pos < 1 || q.pos > q.row.length) genIssues++;
        if (q.row.filter((r) => r.isTarget).length !== 1) genIssues++;
        if (q.row[q.pos - 1].emoji !== q.target) genIssues++;
        break;
    }
  });
}
assert('30 轮混合关生成无异常', genIssues === 0, 'issues=' + genIssues);

// 选项唯一且含答案
let optIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    life.questions.generateLevel(lvl).forEach((q) => {
      if (q.options) {
        if (new Set(q.options).size !== q.options.length) optIssues++;
        if (!q.options.includes(q.answer)) optIssues++;
      }
    });
  });
}
assert('选项均唯一且含答案', optIssues === 0, 'issues=' + optIssues);

// 各关卡题目数
all.forEach((lvl) => {
  const qs = life.questions.generateLevel(lvl);
  assert(`L${lvl.id} 题目数=${lvl.questionCount}`, qs.length === lvl.questionCount);
});

// ---------- renderers ----------
console.log('== life renderers ==');
let vmIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    life.questions.generateLevel(lvl).forEach((q) => {
      const vm = life.renderers.buildView(q);
      if (!vm.question || !vm.options || vm.options.length !== 4) vmIssues++;
      switch (vm.type) {
        case 'scatter': // order
          if (vm.answer !== q.count || !Array.isArray(vm.scatter)) vmIssues++;
          break;
        case 'bus':
          if (q.up) {
            if (vm.riders.length !== q.result) vmIssues++;
            if (vm.riders.filter((r) => r.status === 'on').length !== q.delta) vmIssues++;
          } else {
            if (vm.riders.length !== q.base) vmIssues++;
            if (vm.riders.filter((r) => r.status === 'off').length !== q.delta) vmIssues++;
            if (vm.riders.filter((r) => r.status === 'stay').length !== q.result) vmIssues++;
          }
          break;
        case 'share':
          if (vm.candies.length !== q.total || vm.friends.length !== q.friends) vmIssues++;
          break;
        case 'shop':
          if (vm.items.length !== q.count || vm.item !== q.item) vmIssues++;
          break;
        case 'queue':
          if (vm.row.length !== q.row.length) vmIssues++;
          break;
        default:
          vmIssues++;
      }
    });
  });
}
assert('viewModel 结构正确', vmIssues === 0, 'issues=' + vmIssues);

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
