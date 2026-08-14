/* ============================================
   拖拽引擎 - 支持触摸和鼠标
   ============================================ */

const DragEngine = {
  dragging: null,
  offsetX: 0,
  offsetY: 0,
  dropZones: [],
  onDropCallback: null,

  init() {
    // 触摸事件
    document.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this._onTouchEnd.bind(this));

    // 鼠标事件
    document.addEventListener('mousedown', this._onMouseDown.bind(this));
    document.addEventListener('mousemove', this._onMouseMove.bind(this));
    document.addEventListener('mouseup', this._onMouseUp.bind(this));
  },

  // 设置可拖拽元素
  makeDraggable(el, options = {}) {
    el.classList.add('item-draggable');
    el._dragOptions = options;
    el._dragId = options.id || Math.random().toString(36).substr(2, 9);
  },

  // 设置放置区域
  setDropZone(el, options = {}) {
    el.classList.add('drop-zone');
    el._dropOptions = options;
    this.dropZones.push(el);
  },

  // 清除所有放置区域
  clearDropZones() {
    this.dropZones.forEach(el => {
      el.classList.remove('drop-zone', 'active', 'success');
    });
    this.dropZones = [];
  },

  // 设置放下回调
  onDrop(callback) {
    this.onDropCallback = callback;
  },

  // ========== 触摸处理 ==========
  _onTouchStart(e) {
    const el = e.target.closest('.item-draggable');
    if (!el || el._dragOptions.disabled) return;
    e.preventDefault();
    this._startDrag(el, e.touches[0].clientX, e.touches[0].clientY);
  },

  _onTouchMove(e) {
    if (!this.dragging) return;
    e.preventDefault();
    this._moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  },

  _onTouchEnd(e) {
    if (!this.dragging) return;
    this._endDrag();
  },

  // ========== 鼠标处理 ==========
  _onMouseDown(e) {
    const el = e.target.closest('.item-draggable');
    if (!el || el._dragOptions.disabled) return;
    e.preventDefault();
    this._startDrag(el, e.clientX, e.clientY);
  },

  _onMouseMove(e) {
    if (!this.dragging) return;
    e.preventDefault();
    this._moveDrag(e.clientX, e.clientY);
  },

  _onMouseUp(e) {
    if (!this.dragging) return;
    this._endDrag();
  },

  // ========== 核心拖拽逻辑 ==========
  _startDrag(el, x, y) {
    SoundManager.drag();

    this.dragging = el;
    const rect = el.getBoundingClientRect();
    this.offsetX = x - rect.left;
    this.offsetY = y - rect.top;

    // 保存原始位置
    el._originalRect = rect;
    el._originalParent = el.parentNode;
    el._originalNextSibling = el.nextSibling;

    // 改为 fixed 定位
    el.style.position = 'fixed';
    el.style.left = (x - this.offsetX) + 'px';
    el.style.top = (y - this.offsetY) + 'px';
    el.style.width = rect.width + 'px';
    el.style.zIndex = '1000';
    el.classList.add('dragging');

    // 移到 body 下
    document.body.appendChild(el);

    // 高亮可能的放置区域
    this._highlightDropZones(x, y);
  },

  _moveDrag(x, y) {
    if (!this.dragging) return;

    this.dragging.style.left = (x - this.offsetX) + 'px';
    this.dragging.style.top = (y - this.offsetY) + 'px';

    this._highlightDropZones(x, y);
  },

  _endDrag() {
    if (!this.dragging) return;

    const el = this.dragging;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 检查是否落在放置区域
    let dropTarget = null;
    for (const zone of this.dropZones) {
      const zRect = zone.getBoundingClientRect();
      if (centerX >= zRect.left && centerX <= zRect.right &&
          centerY >= zRect.top && centerY <= zRect.bottom) {
        dropTarget = zone;
        break;
      }
    }

    if (dropTarget && this.onDropCallback) {
      SoundManager.merge();
      this.onDropCallback(el, dropTarget);
    } else {
      // 回到原位
      this._returnToOriginal(el);
    }

    // 清理
    el.classList.remove('dragging');
    this.dropZones.forEach(z => z.classList.remove('active'));
    this.dragging = null;
  },

  _highlightDropZones(x, y) {
    this.dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        zone.classList.add('active');
      } else {
        zone.classList.remove('active');
      }
    });
  },

  _returnToOriginal(el) {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.zIndex = '';

    if (el._originalNextSibling && el._originalParent) {
      el._originalParent.insertBefore(el, el._originalNextSibling);
    } else if (el._originalParent) {
      el._originalParent.appendChild(el);
    }
  },

  // 动画返回原位
  animateReturn(el) {
    el.style.transition = 'all 0.3s ease';
    this._returnToOriginal(el);
    setTimeout(() => {
      el.style.transition = '';
    }, 300);
  }
};
