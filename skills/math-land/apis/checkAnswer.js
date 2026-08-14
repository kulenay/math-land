// apis/checkAnswer.js - 判定作答是否正确
// 判定逻辑忠实搬移自主包 pages/game/game.js 的各题型判定分支：
//   选择题（scatter/subitize/group/completen/make10）：answer 与 question.answer 相等
//   compare：answer 为 'left'|'right'，与 question.answer 相等
//   match：answer 为堆索引，与 question.answerIndex 相等
//   split/pair（选两数凑 10）：两个数之和等于 10
//   构建题（tenframe/fillten/feed）：填充数量达到目标（fillten 目标恒 10）
const { errorResult, successResult } = require('../utils/util.js')

/** 各题型正确性判定（与主包判定条件一致） */
function judge(question, answer) {
  switch (question.type) {
    case 'compare':
      return answer === question.answer
    case 'match':
      return Number(answer) === question.answerIndex
    case 'split':
    case 'pair': {
      const list = Array.isArray(answer) ? answer : []
      return Number(list[0]) + Number(list[1]) === 10
    }
    case 'tenframe':
    case 'feed':
      return Number(answer) === Number(question.count)
    case 'fillten':
      return Number(answer) === 10 // fillten 目标恒为 10
    default: // scatter / subitize / group / completen / make10
      return Number(answer) === Number(question.answer)
  }
}

async function checkAnswer(params = {}) {
  console.info('[ai-mode] checkAnswer 入口, params=', JSON.stringify(params))
  try {
    const question = params.question
    const answer = params.answer
    if (!question || answer === undefined || answer === null) {
      return errorResult('需要 question 和 answer')
    }
    const correct = judge(question, answer)
    return successResult(correct ? '答对了！' : '答错了，再想想', {
      correct,
      questionType: question.type,
    })
  } catch (err) {
    console.error('[ai-mode] checkAnswer 出错:', err.message)
    return errorResult(`判定失败: ${err.message}`)
  }
}

module.exports = { checkAnswer }
