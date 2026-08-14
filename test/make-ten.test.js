// ============================================
// 凑十魔法模块测试（mock wx 不需要，纯逻辑）
// 运行：node test/make-ten.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');

const modules = require(path.join(BASE, 'modules/index'));
const makeTen = require(path.join(BASE, 'modules/make-ten'));
const { randInt } = require(path.join(BASE, 'core/rand'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

// ---------- 模块注册表 ----------
console.log('== modules 注册表 ==');
assert('get(1) 数一数', modules.get('1') && modules.get('1').name === '数一数');
assert('get(2) 凑十魔法', modules.get('2') && modules.get('2').name === '凑十魔法');
assert('get(9) 不存在返回 null', modules.get('9') === null);
assert('getAll 有 2 个已开发模块', modules.getAll().length === 2);
assert('模块接口完整', ['levels', 'questions', 'renderers'].every((k) => makeTen[k]));

// ---------- levels ----------
console.log('== make-ten levels ==');
const all = makeTen.levels.getAllLevels('2');
assert('6 关', all.length === 6);
assert('关卡 id 连续 1..6', all.every((l, i) => l.id === i + 1));
assert('模块 1 不受影响', makeTen.levels.getLevel('1', 1) === null);
assert('getLevel 正确', makeTen.levels.getLevel('2', 5).name === '凑十加法');
assert('getLevel 越界 null', makeTen.levels.getLevel('2', 99) === null);

// ---------- questions ----------
console.log('== make-ten questions ==');
let genIssues = 0;
for (let round = 0; round < 30; round++) {
  if (round % 5 === 0) console.log('  round', round); // 多轮覆盖随机
  const qs = makeTen.questions.generateLevel(all[5]); // 第 6 关混合所有题型
  qs.forEach((q) => {
    switch (q.type) {
      case 'fillten':
        if (q.filled < all[5].min || q.filled > all[5].max) genIssues++;
        break;
      case 'split': {
        if (q.options.length !== 4 || new Set(q.options).size !== 4) genIssues++;
        const [a, b] = q.answerPair;
        if (a + b !== 10 || !q.options.includes(a) || !q.options.includes(b)) genIssues++;
        break;
      }
      case 'pair': {
        if (q.options.length !== 4 || new Set(q.options).size !== 4) genIssues++;
        const sumsOk = q.pairs.every(([a, b]) => a + b === 10);
        if (!sumsOk) genIssues++;
        break;
      }
      case 'completen':
        if (q.answer !== 10 - q.a || !q.options.includes(q.answer)) genIssues++;
        break;
      case 'make10':
        if (q.answer !== q.a + q.b || !q.options.includes(q.answer)) genIssues++;
        if (q.b < 10 - q.a) genIssues++; // 凑十法边界：b 必须 ≥ 10-a
        break;
    }
  });
}
assert('30 轮混合关生成无异常', genIssues === 0, 'issues=' + genIssues);

// 选项唯一且含答案
let optIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    makeTen.questions.generateLevel(lvl).forEach((q) => {
      if (q.options && new Set(q.options).size !== q.options.length) {
        optIssues++;
      }
      if (q.options && q.type !== 'split' && q.type !== 'pair' && !q.options.includes(q.answer)) {
        optIssues++;
      }
    });
  });
}
assert('选项均唯一且含答案', optIssues === 0, 'issues=' + optIssues);

// 各关卡题目数
all.forEach((lvl) => {
  const qs = makeTen.questions.generateLevel(lvl);
  assert(`L${lvl.id} 题目数=${lvl.questionCount}`, qs.length === lvl.questionCount);
});

// ---------- renderers ----------
console.log('== make-ten renderers ==');
let vmIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    makeTen.questions.generateLevel(lvl).forEach((q) => {
      const vm = makeTen.renderers.buildView(q);
      if (!vm.question) vmIssues++;
      switch (vm.type) {
        case 'fillten':
          if (vm.cells.length !== 10 || vm.filled !== q.filled || vm.target !== 10) vmIssues++;
          if (vm.cells.slice(0, q.filled).some((c) => c !== 1)) vmIssues++;
          if (vm.cells.slice(q.filled).some((c) => c !== 0)) vmIssues++;
          break;
        case 'split':
        case 'pair':
          if (vm.options.length !== 4 || vm.options.some((o) => typeof o.key !== 'string')) vmIssues++;
          break;
        case 'completen':
          if (vm.cells.length !== 10 || vm.cells.filter((c) => c === 1).length !== q.a) vmIssues++;
          if (vm.options.length !== 4) vmIssues++;
          break;
        case 'make10':
          if (vm.cells.length !== 10 || vm.cells.filter((c) => c === 1).length !== q.a) vmIssues++;
          if (vm.extra.length !== q.b || vm.options.length !== 4) vmIssues++;
          break;
      }
    });
  });
}
assert('viewModel 结构正确', vmIssues === 0, 'issues=' + vmIssues);

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
