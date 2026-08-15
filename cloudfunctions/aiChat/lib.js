// ============================================
// cloudfunctions/aiChat/lib.js - AI 互动纯逻辑（可本地测试）
// 不依赖 wx-server-sdk / 云环境：
//   系统提示词 / 请求体构建 / 响应解析 / 消息校验 / OpenAI 转发
// index.js 负责装配（读取环境变量、注入云上下文）。
// ============================================

const DEFAULT_URL = 'https://chatapi.weixin.qq.com/openai/v1/chat/completions';

/** 儿童安全系统提示词：把 AI 约束成"跳跳"小青蛙数学老师。 */
function buildSystemPrompt() {
  return [
    '你叫"跳跳"，是数感探索乐园里的一只小青蛙数学老师，正在给 4~8 岁的小朋友讲数学（数感启蒙：数数、比较、十格阵、凑十、找邻居、分与合、简单加减）。',
    '回答要求：',
    '1. 用最简单、最可爱、最温柔的语言，像幼儿园老师一样，多用数字小例子和比喻，可以带 emoji；',
    '2. 每次回答尽量简短（不超过 80 个字），一次只讲一个点，不一次讲太多；',
    '3. 永远鼓励小朋友，不批评、不说"错"，要说"再想想哦"；',
    '4. 绝对不使用暴力、恐怖、不健康、歧视性内容，不讨论不适合儿童的话题；',
    '5. 如果小朋友问数学以外的问题，温柔地把话题带回数学（比如"这个问题也很有趣！不过我们先把数学小谜题解决吧～"）。',
  ].join('\n');
}

/** 组装 OpenAI 兼容请求体。 */
function buildRequestBody(messages, model) {
  return JSON.stringify({
    model: model || 'GLM-5.2',
    messages,
    temperature: 0.7,
    max_tokens: 300,
  });
}

/** 解析 OpenAI 兼容响应，返回文本。 */
function parseResponse(raw) {
  const json = JSON.parse(raw);
  if (json.error) {
    throw new Error((json.error && (json.error.message || json.error.code)) || 'AI 接口返回错误');
  }
  const text = json.choices &&
    json.choices[0] &&
    json.choices[0].message &&
    json.choices[0].message.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('AI 返回为空');
  }
  return text.trim();
}

const MAX_CONTENT = 500;   // 单条消息最大字符数
const MAX_TURNS = 10;      // 最多保留的对话轮数（user+assistant 各算一条）

/**
 * 清洗前端传入的消息：只保留 user/assistant 角色、截断长度、限制条数。
 * @param {Array} raw 原始消息数组
 * @returns {Array} [{ role, content }]
 */
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const cleaned = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role === 'user' || m.role === 'assistant' ? m.role : null;
    if (!role) continue;
    let content = typeof m.content === 'string' ? m.content : '';
    content = content.slice(0, MAX_CONTENT);
    if (!content.trim()) continue;
    cleaned.push({ role, content });
  }
  return cleaned;
}

/**
 * 转发到 OpenAI 兼容接口。
 * @param {Array} messages [{ role, content }]
 * @param {object} opts { url, model, apiKey, transport }
 *   transport 可注入（默认 https.request），便于测试
 * @returns {Promise<string>} AI 回复文本
 */
function callOpenAI(messages, opts = {}) {
  const url = opts.url || DEFAULT_URL;
  const model = opts.model || 'GLM-5.2';
  const apiKey = opts.apiKey || '';
  const transport = opts.transport || require('https').request;

  const body = buildRequestBody(messages, model);
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };
  // 鉴权可配置：配置了 AI_API_KEY 才带 Authorization（Bearer 或裸 Key）
  if (apiKey) {
    headers.Authorization = apiKey.includes(' ')
      ? apiKey
      : 'Bearer ' + apiKey;
  }

  return new Promise((resolve, reject) => {
    const req = transport(url, { method: 'POST', headers, timeout: 20000 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(parseResponse(raw));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('AI 请求超时，请稍后再试')));
    req.write(body);
    req.end();
  });
}

module.exports = {
  DEFAULT_URL,
  buildSystemPrompt,
  buildRequestBody,
  parseResponse,
  sanitizeMessages,
  callOpenAI,
};
