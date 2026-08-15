// ============================================
// cloudfunctions/aiChat/index.js - AI 互动云函数
// 转发到 OpenAI 兼容接口（默认 chatapi.weixin.qq.com，模型 GLM-5.2）。
// 环境变量（云函数配置）：
//   AI_API_URL  接口地址（默认 https://chatapi.weixin.qq.com/openai/v1/chat/completions）
//   AI_MODEL    模型名（默认 GLM-5.2）
//   AI_API_KEY  鉴权凭证（可选：为空则不带 Authorization 头；可填 "Bearer xxx" 或裸 key）
// ============================================
const cloud = require('wx-server-sdk');
const {
  buildSystemPrompt,
  sanitizeMessages,
  callOpenAI,
} = require('./lib');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const AI_URL = process.env.AI_API_URL || '';
const AI_MODEL = process.env.AI_MODEL || 'GLM-5.2';
const AI_API_KEY = process.env.AI_API_KEY || '';

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const messages = sanitizeMessages(event && event.messages);

  if (!messages.length) {
    return { ok: false, error: '没有可发送的消息' };
  }

  // 系统提示词永远由云函数注入，前端无法绕过（儿童安全约束）
  const full = [{ role: 'system', content: buildSystemPrompt() }].concat(messages);

  try {
    const text = await callOpenAI(full, {
      url: AI_URL,
      model: AI_MODEL,
      apiKey: AI_API_KEY,
    });
    console.log('[aiChat] openid=' + (wxContext.OPENID || 'unknown') + ' turns=' + messages.length);
    return { ok: true, text };
  } catch (e) {
    console.error('[aiChat] error:', e && e.message);
    return {
      ok: false,
      error: (e && e.message) || 'AI 老师开小差了，请稍后再试',
    };
  }
};
