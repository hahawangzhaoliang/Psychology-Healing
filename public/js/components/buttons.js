/**
 * buttons.js - 统一按钮组件库
 * 基于 neuroaesthetics.css 设计系统
 * 使用方式：<div id="app-btn-primary"></div> 或 JS 调用 renderButton()
 */

(function () {
  'use strict';

  /**
   * 渲染按钮
   * @param {string} containerId - 容器 ID
   * @param {object} options - 按钮配置
   * @param {string} options.text - 按钮文字（支持 i18n key，如 "flow.start"）
   * @param {string} options.variant - 变体：primary | secondary | ghost | danger | success
   * @param {string} options.size - 尺寸：sm | md | lg
   * @param {string} options.icon - 可选图标 HTML
   * @param {string} options.onclick - 点击事件
   * @param {boolean} options.disabled - 是否禁用
   * @param {string} options.type - button 类型：button | submit | reset
   * @param {string} options.dataI18n - i18n key（优先级高于 text）
   */
  function renderButton(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      text = '',
      variant = 'primary',
      size = 'md',
      icon = '',
      onclick = '',
      disabled = false,
      type = 'button',
      dataI18n = '',
      className = '',
    } = options;

    const sizeClass = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    }[size] || '';

    const variantClass = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
      success: 'btn-success',
    }[variant] || 'btn-primary';

    const i18nAttr = dataI18n ? `data-i18n="${dataI18n}"` : '';
    const disabledAttr = disabled ? 'disabled aria-disabled="true"' : '';

    // onclick：函数 → 唯一全局名；字符串 → 直接用作属性值
    let onclickAttr = '';
    if (onclick) {
      if (typeof onclick === 'function') {
        const fnName = `_btnFn_${Math.random().toString(36).slice(2, 9)}`;
        window[fnName] = onclick;
        onclickAttr = `onclick="${fnName}()"`;
      } else {
        onclickAttr = `onclick="${onclick}"`;
      }
    }

    container.innerHTML = `
      <button
        type="${type}"
        class="btn ${variantClass} ${sizeClass} ${className}"
        ${onclickAttr}
        ${disabledAttr}
        ${i18nAttr}
        data-touch-feedback
      >${icon ? `<span class="btn-icon">${icon}</span>` : ''}<span class="btn-text">${text}</span></button>
    `;
  }

  /**
   * 渲染图标按钮（仅有图标，无文字）
   */
  function renderIconButton(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      icon = '',
      variant = 'ghost',
      size = 'md',
      onclick = '',
      ariaLabel = '',
      dataI18n = '',
    } = options;

    const sizeClass = {
      sm: 'icon-btn-sm',
      md: '',
      lg: 'icon-btn-lg',
    }[size] || '';

    const i18nAttr = dataI18n ? `data-i18n="${dataI18n}"` : '';

    container.innerHTML = `
      <button
        type="button"
        class="icon-btn ${sizeClass}"
        onclick="${onclick}"
        aria-label="${ariaLabel}"
        ${i18nAttr}
        data-touch-feedback
      >${icon}</button>
    `;
  }

  // 导出到全局
  window.Buttons = { renderButton, renderIconButton };
})();
