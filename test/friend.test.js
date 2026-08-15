// ============================================
// 数字好朋友模块测试（纯逻辑，无需 mock wx）
// 运行：node test/friend.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');

const modules = require(path.join(BASE, 'modules/index'));
const friend = require(path.join(BASE, 'modules/friend'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

// ---------- 模块注册表 ----------
console.log('== modules 注册表 ==');
assert('get(4) 数字好朋友', modules.get('4') && modules.get('4').name === '数字好朋友');
assert('模块接口完整', ['levels', 'questions', 'renderers'].every((k) => friend[k]));

// ---------- levels ----------
console.log('== friend levels ==');
const all = friend.levels.getAllLevels('4');
assert('6 关', all.length === 6);
assert('关卡 id 连续 1..6', all.every((l, i) => l.id === i + 1));
assert('非模块4返回空', friend.levels.getAllLevels('1').length === 0);
assert('getLevel 正确', friend.levels.getLevel('4', 2).name === '找邻居');
assert('getLevel 越界 null', friend.levels.getLevel('4', 99) === null);

// ---------- questions ----------
console.log('== friend questions ==');
let genIssues = 0;
for (let round = 0; round < 30; round++) {
  const qs = friend.questions.generateLevel(all[5]); // 第 6 关混合所有题型
  qs.forEach((q) => {
    switch (q.type) {
      case 'soundcount':
        if (q.count < 1 || q.count > 6) genIssues++;
        break;
      case 'neighbor': {
        if (q.n < 2 || q.n > 9) genIssues++;
        const [lo, hi] = q.pair;
        if (lo !== q.n - 1 || hi !== q.n + 1) genIssues++;
        if (!q.options.includes(lo) || !q.options.includes(hi)) genIssues++;
        if (q.options.includes(q.n)) genIssues++; // 自己不是自己的邻居
        break;
      }
      case 'splitnum': {
        const [a, b] = q.answerPair;
        if (a + b !== q.total || a === b) genIssues++;
        if (!q.options.includes(a) || !q.options.includes(b)) genIssues++;
        // 唯一正确答案对：任意两个选项相加 = total 的只有 (a,b)
        let pairs = 0;
        for (let i = 0; i < q.options.length; i++) {
          for (let j = i + 1; j < q.options.length; j++) {
            if (q.options[i] + q.options[j] === q.total) pairs++;
          }
        }
        if (pairs !== 1) genIssues++;
        break;
      }
      case 'sign':
        if (q.left < 1 || q.left > 10 || q.right < 1 || q.right > 10) genIssues++;
        if (q.answer !== (q.left > q.right ? '>' : q.left < q.right ? '<' : '=')) genIssues++;
        if (!q.options.includes(q.answer)) genIssues++;
        break;
    }
  });
}
assert('30 轮混合关生成无异常', genIssues === 0, 'issues=' + genIssues);

// 选项唯一且含答案
let optIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    friend.questions.generateLevel(lvl).forEach((q) => {
      if (q.options) {
        if (new Set(q.options).size !== q.options.length) optIssues++;
        if (q.type === 'neighbor' || q.type === 'splitnum') {
          if (!q.answerPair.every((v) => q.options.includes(v))) optIssues++;
        } else if (!q.options.includes(q.answer)) {
          optIssues++;
        }
      }
    });
  });
}
assert('选项均唯一且含答案', optIssues === 0, 'issues=' + optIssues);

// 各关卡题目数
all.forEach((lvl) => {
  const qs = friend.questions.generateLevel(lvl);
  assert(`L${lvl.id} 题目数=${lvl.questionCount}`, qs.length === lvl.questionCount);
});

// ---------- renderers ----------
console.log('== friend renderers ==');
let vmIssues = 0;
for (let round = 0; round < 30; round++) {
  all.forEach((lvl) => {
    friend.questions.generateLevel(lvl).forEach((q) => {
      const vm = friend.renderers.buildView(q);
      if (!vm.question || !vm.options || vm.options.length !== 4) {
        if (q.type !== 'sign') vmIssues++;
      }
      switch (vm.type) {
        case 'soundcount':
          if (vm.options.length !== 4) vmIssues++;
          break;
        case 'neighbor':
          if (vm.mode !== 'set' || vm.pair[0] !== q.n - 1 || vm.pair[1] !== q.n + 1) vmIssues++;
          break;
        case 'splitnum':
          if (vm.mode !== 'sum' || vm.target !== q.total) vmIssues++;
          break;
        case 'sign':
          if (vm.left.length !== q.left || vm.right.length !== q.right) vmIssues++;
          if (!vm.options.some((o) => o.key === q.answer)) vmIssues++;
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
