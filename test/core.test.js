// 数感探索乐园 - 核心逻辑测试（node 运行，mock wx）
const path = require('path');
const BASE = path.join(__dirname, '..');

let store = {};
global.wx = {
  getStorageSync: (k) => store[k] || '',
  setStorageSync: (k, v) => { store[k] = v; },
  createInnerAudioContext: () => ({ stop() {}, play() {} }),
};

const levels = require(path.join(BASE, 'modules/count/levels'));
const questions = require(path.join(BASE, 'modules/count/questions'));
const renderers = require(path.join(BASE, 'modules/count/renderers'));
const star = require(path.join(BASE, 'core/star'));
const storage = require(path.join(BASE, 'core/storage'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

console.log('== levels ==');
const all = levels.getAllLevels('1');
assert('8 关', all.length === 8);
assert('每关 questionCount=6', all.every((l) => l.questionCount === 6));
assert('关卡 id 连续 1..8', all.every((l, i) => l.id === i + 1));
assert('非模块1返回空', levels.getAllLevels('2').length === 0);
assert('getLevel 正确', levels.getLevel('1', 3).name === '认识 6~8');
assert('getLevel 越界返回 null', levels.getLevel('1', 99) === null);

console.log('== questions ==');
let optIssues = 0;
all.forEach((lvl) => {
  const qs = questions.generateLevel(lvl);
  assert('L' + lvl.id + ' 题目数=' + lvl.questionCount, qs.length === lvl.questionCount);
  qs.forEach((q) => {
    if (q.options) {
      const uniq = new Set(q.options);
      if (uniq.size !== q.options.length || !q.options.includes(q.answer)) optIssues++;
    }
    switch (q.type) {
      case 'scatter':
        assert('L' + lvl.id + ' scatter 数量范围', q.count >= lvl.min && q.count <= lvl.max); break;
      case 'tenframe':
        assert('L' + lvl.id + ' tenframe 数量范围', q.count >= lvl.min && q.count <= lvl.max); break;
      case 'subitize':
        assert('L' + lvl.id + ' subitize 1-5', q.count >= 1 && q.count <= 5); break;
      case 'feed':
        assert('L' + lvl.id + ' feed pool=count+3', q.pool === q.count + 3); break;
      case 'compare':
        assert('L' + lvl.id + ' compare 两边不等', q.left !== q.right);
        assert('L' + lvl.id + ' compare answer 正确', (q.left > q.right ? 'left' : 'right') === q.answer); break;
      case 'group':
        assert('L' + lvl.id + ' group 偶数', q.count % 2 === 0); break;
      case 'match':
        assert('L' + lvl.id + ' match 3 组互异', new Set(q.groups).size === 3);
        assert('L' + lvl.id + ' match 含 count', q.groups.includes(q.count));
        assert('L' + lvl.id + ' match answerIndex 正确', q.groups[q.answerIndex] === q.count); break;
    }
  });
});
assert('选项均唯一且含答案', optIssues === 0);

console.log('== renderers ==');
let vmIssues = 0;
all.forEach((lvl) => {
  questions.generateLevel(lvl).forEach((q) => {
    const vm = renderers.buildView(q);
    if (!vm.question || typeof vm.question !== 'string') vmIssues++;
    switch (vm.type) {
      case 'scatter':
        if (vm.scatter.length !== q.count) vmIssues++;
        if (vm.scatter.some((p) => typeof p.x !== 'number' || typeof p.y !== 'number')) vmIssues++;
        break;
      case 'tenframe':
        if (vm.cells.length !== 10 || vm.filled !== 0 || vm.target !== q.count) vmIssues++;
        break;
      case 'subitize':
        if (vm.row.length !== q.count) vmIssues++;
        break;
      case 'feed':
        if (vm.bugs.length !== q.pool || vm.plate.length !== 0) vmIssues++;
        break;
      case 'compare':
        if (vm.left.length !== q.left || vm.right.length !== q.right) vmIssues++;
        break;
      case 'group':
        if (vm.groups.length !== q.count / 2) vmIssues++;
        break;
      case 'match':
        if (vm.groups.length !== 3) vmIssues++;
        break;
    }
  });
});
assert('viewModel 结构正确', vmIssues === 0, 'issues=' + vmIssues);
const q1 = questions.generateLevel(levels.getLevel('1', 1))[0];
const vm1 = renderers.buildView(q1);
assert('选项为 {key,label}', vm1.options.every((o) => typeof o.key === 'string' && typeof o.label === 'string'));
assert('选项含正确答案 key', vm1.options.some((o) => parseInt(o.key) === q1.answer));

console.log('== star ==');
assert('全对=3星', star.computeStars(6, 6) === 3);
assert('5/6=2星', star.computeStars(5, 6) === 2);
assert('4/6=1星', star.computeStars(4, 6) === 1);
assert('0/6=1星', star.computeStars(0, 6) === 1);
assert('8/10=2星', star.computeStars(8, 10) === 2);
assert('7/10=1星', star.computeStars(7, 10) === 1);

console.log('== storage ==');
assert('初始：第1关解锁', storage.isLevelUnlocked(1, 1) === true);
assert('初始：第2关锁定', storage.isLevelUnlocked(1, 2) === false);
storage.saveLevelResult(1, 1, 2, 5);
storage.saveLevelResult(1, 1, 3, 6);
assert('取最高星', storage.getLevelStars(1, 1) === 3);
assert('通关1后解锁2', storage.isLevelUnlocked(1, 2) === true);
assert('第3关仍锁定', storage.isLevelUnlocked(1, 3) === false);
storage.saveLevelResult(1, 2, 1, 3);
assert('通关2后解锁3', storage.isLevelUnlocked(1, 3) === true);
storage.saveLevelResult(1, 3, 1, 2);
assert('模块星星总数=3+1+1=5', storage.getModuleStars(1) === 5);



// ---------- 回归：修复项 ----------
console.log('== 回归 ==');
// genCompare 边界：min===max 时生成链路不崩溃且题目可渲染
const edgeLevel = { id: 99, name: '边界', questionCount: 6, types: ['compare'], min: 5, max: 5 };
let edgeOk = true;
try {
  const edgeQs = questions.generateLevel(edgeLevel);
  if (edgeQs.length !== 6) edgeOk = false;
  edgeQs.forEach((q) => {
    if (q.left === q.right) edgeOk = false;
    const vm = renderers.buildView(q);
    if (!vm || vm.options.length !== 2) edgeOk = false;
  });
} catch (e) {
  edgeOk = false;
}
assert('compare min===max 不崩溃且两边不等', edgeOk === true);

// feed 的 plate 是索引数组（plateHas 键协议）
const feedQ = questions.generateLevel(levels.getLevel('1', 6))[0];
const feedVm = renderers.buildView(feedQ);
assert('feed plate 为索引数组', Array.isArray(feedVm.plate) && feedVm.plate.every((i) => typeof i === 'number'));

// match 题：渲染出堆区且无 options 区冲突（isChoice 协议由 game 页保证，此处验证 viewModel 完整性）
const matchQ = questions.generateLevel(levels.getLevel('1', 8)).find((q) => q.type === 'match');
const matchVm = renderers.buildView(matchQ);
assert('match viewModel 完整', matchVm && matchVm.groups.length === 3 && matchVm.options.length === 3);

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
