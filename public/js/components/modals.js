/**
 * modals.js - 统一模态框组件库
 * 基于 neuroaesthetics.css 设计系统
 *
 * 使用方式：
 *   Modals.show('my-modal', { title: '提示', content: '<p>内容</p>' });
 *   Modals.hide('my-modal');
 */

(function () {
  'use strict';

  const activeModals = new Set();

  /**
   * 显示模态框
   * @param {string} modalId - 模态框 ID
   * @param {object} options - 配置项
   * @param {string} options.title - 标题
   * @param {string} options.content - 内容 HTML
   * @param {string} options.size - 尺寸：sm | md | lg | full
   * @param {boolean} options.closable - 是否可关闭（默认 true）
   * @param {function} options.onClose - 关闭回调
   */
  function show(modalId, options = {}) {
    const {
      title = '',
      content = '',
      size = 'md',
      closable = true,
      onClose = null,
    } = options;

    // 如果模态框已存在，先移除
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const sizeClass = `modal-${size}`;

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    if (title) overlay.setAttribute('aria-label', title);

    overlay.innerHTML = `
      <div class="modal-container ${sizeClass}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          ${closable ? `<button class="modal-close" onclick="Modals.hide('${modalId}')" aria-label="关闭">&times;</button>` : ''}
        </div>
        <div class="modal-body">${content}</div>
      </div>
    `;

    // 点击遮罩层关闭
    if (closable) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hide(modalId);
      });
    }

    // ESC 关闭
    const escHandler = (e) => {
      if (e.key === 'Escape') hide(modalId);
    };
    document.addEventListener('keydown', escHandler);

    // 保存 onClose 回调
    overlay._onClose = onClose;
    overlay._escHandler = escHandler;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 入场动画
    requestAnimationFrame(() => {
      overlay.classList.add('modal-visible');
    });

    activeModals.add(modalId);
    return overlay;
  }

  /**
   * 关闭模态框
   * @param {string} modalId
   */
  function hide(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;

    overlay.classList.remove('modal-visible');
    overlay.classList.add('modal-closing');

    // 执行关闭回调
    if (overlay._onClose) overlay._onClose();

    // 移除 ESC 监听
    if (overlay._escHandler) {
      document.removeEventListener('keydown', overlay._escHandler);
    }

    setTimeout(() => {
      overlay.remove();
      activeModals.delete(modalId);
      // 如果没有活跃模态框，恢复滚动
      if (activeModals.size === 0) {
        document.body.style.overflow = '';
      }
    }, 300);

    return true;
  }

  /**
   * 显示确认对话框
   * @param {object} options
   * @param {string} options.title - 标题
   * @param {string} options.message - 提示信息
   * @param {string} options.confirmText - 确认按钮文字
   * @param {string} options.cancelText - 取消按钮文字
   * @param {function} options.onConfirm - 确认回调
   * @param {function} options.onCancel - 取消回调
   * @param {string} options.variant - 确认按钮变体：primary | danger
   */
  function confirm(options = {}) {
    const {
      title = '确认操作',
      message = '',
      confirmText = '确认',
      cancelText = '取消',
      onConfirm = () => {},
      onCancel = () => {},
      variant = 'primary',
    } = options;

    const modalId = `modal-confirm-${Date.now()}`;

    // 用唯一全局函数名，避免 toString() 序列化问题
    const confirmFnName = `_confirmFn_${Math.random().toString(36).slice(2, 9)}`;
    const cancelFnName = `_cancelFn_${Math.random().toString(36).slice(2, 9)}`;
    window[confirmFnName] = () => { if (window.Modals && Modals.hide) Modals.hide(modalId); onConfirm(); };
    window[cancelFnName] = () => { if (window.Modals && Modals.hide) Modals.hide(modalId); onCancel(); };

    const content = `
      <div class="confirm-message">${message}</div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" onclick="${cancelFnName}()">${cancelText}</button>
        <button class="btn btn-${variant}" onclick="${confirmFnName}()">${confirmText}</button>
      </div>
    `;

    return show(modalId, { title, content, size: 'sm', closable: true });
  }

  /**
   * 显示 Toast 通知
   * @param {string} message - 通知内容
   * @param {string} type - 类型：success | error | warning | info
   * @param {number} duration - 显示时长（ms）
   */
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `
      <span class="toast-icon">${getToastIcon(type)}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toastEl);

    requestAnimationFrame(() => {
      toastEl.classList.add('toast-visible');
    });

    setTimeout(() => {
      toastEl.classList.remove('toast-visible');
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  }

  function getToastIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type] || icons.info;
  }

  // 导出到全局
  window.Modals = { show, hide, confirm, toast };
})();
