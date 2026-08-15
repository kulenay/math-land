// ============================================
// AI 互动云函数核心逻辑测试（纯逻辑 + mock transport，无需云环境）
// 运行：node test/ai.test.js
// ============================================
const path = require('path');
const BASE = path.join(__dirname, '..');

const ai = require(path.join(BASE, 'cloudfunctions/aiChat/lib'));

let pass = 0, fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  OK', name); }
  else { fail++; console.log('  FAIL', name, extra || ''); }
}

// ---------- 系统提示词 ----------
console.log('== buildSystemPrompt ==');
const prompt = ai.buildSystemPrompt();
assert('包含角色设定（跳跳/小青蛙）', prompt.includes('跳跳') && prompt.includes('小青蛙'));
assert('包含儿童安全约束', prompt.includes('不') && prompt.includes('emoji'));
assert('包含鼓励要求（不说"错"）', prompt.includes('再想想') || prompt.includes('鼓励'));

// ---------- 请求体 ----------
console.log('== buildRequestBody ==');
const body = JSON.parse(ai.buildRequestBody(
  [{ role: 'user', content: '7+8 等于多少？' }],
  'GLM-5.2',
));
assert('模型正确', body.model === 'GLM-5.2');
assert('消息透传', body.messages.length === 1 && body.messages[0].content === '7+8 等于多少？');
assert('有 temperature', typeof body.temperature === 'number');

// ---------- 响应解析 ----------
console.log('== parseResponse ==');
assert('正常响应取 content',
  ai.parseResponse(JSON.stringify({ choices: [{ message: { content: ' 等于 15！ ' } }] })) === '等于 15！');
let threw = false;
try { ai.parseResponse(JSON.stringify({ error: { message: 'invalid key' } })); } catch (e) { threw = e.message === 'invalid key'; }
assert('错误响应抛错', threw);
threw = false;
try { ai.parseResponse(JSON.stringify({ choices: [] })); } catch (e) { threw = true; }
assert('空 choices 抛错', threw);
threw = false;
try { ai.parseResponse('not json'); } catch (e) { threw = true; }
assert('非法 JSON 抛错', threw);

// ---------- 消息清洗 ----------
console.log('== sanitizeMessages ==');
assert('非数组返回空', ai.sanitizeMessages(null).length === 0);
const clean = ai.sanitizeMessages([
  { role: 'user', content: '你好' },
  { role: 'system', content: '想注入的系统提示' }, // system 被过滤（提示词只由云函数注入）
  { role: 'assistant', content: '我是跳跳' },
  { role: 'admin', content: '越权' },
  { role: 'user', content: '' },
  { role: 'user', content: 123 },
]);
assert('只保留 user/assistant', clean.length === 2);
assert('system 无法注入', !clean.some((m) => m.role === 'system'));
const long = ai.sanitizeMessages([{ role: 'user', content: 'x'.repeat(600) }]);
assert('超长截断到 500', long[0].content.length === 500);
const many = ai.sanitizeMessages(
  Array.from({ length: 20 }, (_, i) => ({ role: 'user', content: 'm' + i })),
);
assert('限制最多 10 条（取最后 10 条）', many.length === 10 && many[0].content === 'm10');

// ---------- 转发（mock transport） ----------
console.log('== callOpenAI ==');
function fakeTransport(respondWith, capture) {
  return (url, opts, cb) => {
    capture.url = url;
    capture.headers = opts.headers;
    process.nextTick(() => {
      cb({
        on: (evt, fn) => {
          if (evt === 'data') fn(typeof respondWith === 'string' ? respondWith : JSON.stringify(respondWith));
          if (evt === 'end') fn();
        },
      });
    });
    return { write() {}, end() {}, on() {}, destroy() {} };
  };
}

(async () => {
  // 带 key：Authorization 头
  let cap = {};
  const r1 = await ai.callOpenAI([{ role: 'user', content: 'hi' }], {
    url: 'https://test.example/v1/chat/completions',
    model: 'GLM-5.2',
    apiKey: 'sk-123',
    transport: fakeTransport({ choices: [{ message: { content: '你好呀！' } }] }, cap),
  });
  assert('带 key 时返回文本', r1 === '你好呀！');
  assert('带 key 时 Authorization 头正确', cap.headers.Authorization === 'Bearer sk-123');
  assert('请求 URL 正确', cap.url === 'https://test.example/v1/chat/completions');

  // 不带 key：无 Authorization 头
  cap = {};
  const r2 = await ai.callOpenAI([{ role: 'user', content: 'hi' }], {
    transport: fakeTransport({ choices: [{ message: { content: 'ok' } }] }, cap),
  });
  assert('不带 key 也返回文本', r2 === 'ok');
  assert('不带 key 时无 Authorization 头', !cap.headers.Authorization);

  // 预填 "Bearer xxx" 形式直接透传
  cap = {};
  await ai.callOpenAI([{ role: 'user', content: 'hi' }], {
    apiKey: 'Bearer custom-token',
    transport: fakeTransport({ choices: [{ message: { content: 'ok' } }] }, cap),
  });
  assert('"Bearer xxx" 形式直接透传', cap.headers.Authorization === 'Bearer custom-token');

  // 接口错误 → 抛出且信息友好
  let errMsg = '';
  try {
    await ai.callOpenAI([{ role: 'user', content: 'hi' }], {
      transport: fakeTransport({ error: { message: 'rate limited' } }, {}),
    });
  } catch (e) {
    errMsg = e.message;
  }
  assert('接口错误信息透出', errMsg === 'rate limited');

  console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();
