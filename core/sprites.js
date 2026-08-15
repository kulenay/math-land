// ============================================
// core/sprites.js - 数字精灵系统
// 数字 1~10 角色化：每个数字是一个有名字、有颜色、有专属表情的小精灵。
// 身体由 N 个彩色圆点组成（数量即身体），在 WXML 中用纯 CSS 渲染，零图片素材。
// 答对题目数字 N 时，精灵 N 会跳出来庆祝（纯即时反馈，见 pages/game/game.js）。
// ============================================

const SPRITES = [
  { n: 1, name: '小一', color: '#ff6b6b', face: '😄', line: '我是小一！一个人也很棒' },
  { n: 2, name: '双双', color: '#ffa94d', face: '😊', line: '我是双双！好朋友成双成对' },
  { n: 3, name: '三三', color: '#ffd43b', face: '😜', line: '我是三三！三角形最稳固' },
  { n: 4, name: '四四', color: '#51cf66', face: '😋', line: '我是四四！小桌子四条腿' },
  { n: 5, name: '五五', color: '#38d9a9', face: '🤩', line: '我是五五！五角星亮晶晶' },
  { n: 6, name: '六六', color: '#4ecdc4', face: '😎', line: '我是六六！蜂巢是六边形' },
  { n: 7, name: '七七', color: '#74c0fc', face: '🥰', line: '我是七七！彩虹有七种颜色' },
  { n: 8, name: '八八', color: '#9775fa', face: '🤗', line: '我是八八！章鱼有八只脚' },
  { n: 9, name: '九九', color: '#f06595', face: '😆', line: '我是九九！九九归一大本领' },
  { n: 10, name: '十全', color: '#ff8787', face: '🥳', line: '我是十全！十全十美就是我' },
];

/** 圆点大小档位：数量多则圆点小，保证"身体"不超宽。 */
function sizeClass(n) {
  if (n >= 8) return 's';
  if (n >= 5) return 'm';
  return 'l';
}

/**
 * 取数字精灵的展示 viewModel（供 WXML 渲染身体圆点）。
 * @param {number} n 1~10
 * @returns {object|null} { n, name, color, line, dots, size }
 */
function getSprite(n) {
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  const base = SPRITES[n - 1];
  return Object.assign({}, base, {
    dots: Array.from({ length: n }, (_, i) => i),
    size: sizeClass(n),
  });
}

function getAll() {
  return SPRITES.slice();
}

module.exports = { getSprite, getAll };
