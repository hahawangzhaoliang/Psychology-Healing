/**
 * forms.js - 统一表单组件库
 * 基于 neuroaesthetics.css 设计系统
 */

(function () {
  'use strict';

  /**
   * 渲染输入框
   * @param {string} containerId - 容器 ID
   * @param {object} options - 配置项
   * @param {string} options.type - 类型：text | email | password | textarea | select | checkbox | radio
   * @param {string} options.name - 字段名
   * @param {string} options.value - 值
   * @param {string} options.placeholder - 占位符
   * @param {string} options.label - 标签文字
   * @param {string} options.hint - 提示文字
   * @param {boolean} options.required - 是否必填
   * @param {boolean} options.disabled - 是否禁用
   * @param {string} options.dataI18n - i18n key 前缀
   * @param {function} options.onInput - 输入回调
   * @param {string} options.rows - textarea 行数（仅 textarea）
   * @param {array} options.options - select/radio/checkbox 选项 [{value, label, checked}]
   */
  function renderInput(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      type = 'text',
      name = '',
      value = '',
      placeholder = '',
      label = '',
      hint = '',
      required = false,
      disabled = false,
      dataI18n = '',
      onInput = null,
      rows = 3,
      options: selectOptions = [],
    } = options;

    const i18nAttr = dataI18n ? `data-i18n="${dataI18n}"` : '';
    const id = `input-${name}-${Math.random().toString(36).slice(2, 7)}`;
    const requiredAttr = required ? 'required' : '';
    const disabledAttr = disabled ? 'disabled' : '';

    // onInput：函数 → 唯一全局名；字符串 → 直接用作属性值
    let onInputAttr = '';
    if (onInput) {
      if (typeof onInput === 'function') {
        const fnName = `_inputFn_${Math.random().toString(36).slice(2, 9)}`;
        window[fnName] = onInput;
        onInputAttr = fnName;
      } else {
        onInputAttr = onInput;
      }
    }

    let inputHtml = '';

    const getOnInputText = (arg) => onInputAttr ? `oninput="${onInputAttr}(${arg})"` : '';
    const getOnChangeText = (arg) => onInputAttr ? `onchange="${onInputAttr}(${arg})"` : '';

    switch (type) {
      case 'textarea':
        inputHtml = `
          <textarea id="${id}" name="${name}" rows="${rows}"
                   placeholder="${placeholder}" ${requiredAttr} ${disabledAttr}
                   class="form-textarea"
                   ${getOnInputText('this.value')}
                   ${i18nAttr}></textarea>`;
        break;

      case 'select':
        const optionsHtml = selectOptions.map(opt => `
          <option value="${opt.value}" ${opt.checked ? 'selected' : ''}>${opt.label}</option>
        `).join('');
        inputHtml = `
          <select id="${id}" name="${name}" class="form-select"
                  ${requiredAttr} ${disabledAttr}
                  ${getOnChangeText('this.value')}>
            ${placeholder ? `<option value="" disabled ${!value ? 'selected' : ''}>${placeholder}</option>` : ''}
            ${optionsHtml}
          </select>`;
        break;

      case 'checkbox':
        inputHtml = `
          <div class="form-checkbox-group">
            ${selectOptions.map((opt, i) => `
              <label class="form-checkbox-label">
                <input type="checkbox" name="${name}" value="${opt.value}"
                       class="form-checkbox" ${opt.checked ? 'checked' : ''}
                       ${disabledAttr}
                       ${getOnChangeText('this')}>
                <span class="form-checkbox-custom"></span>
                <span class="form-checkbox-text">${opt.label}</span>
              </label>
            `).join('')}
          </div>`;
        break;

      case 'radio':
        inputHtml = `
          <div class="form-radio-group">
            ${selectOptions.map((opt, i) => `
              <label class="form-radio-label">
                <input type="radio" name="${name}" value="${opt.value}"
                       class="form-radio" ${opt.checked ? 'checked' : ''}
                       ${requiredAttr} ${disabledAttr}
                       ${getOnChangeText('this.value')}>
                <span class="form-radio-custom"></span>
                <span class="form-radio-text">${opt.label}</span>
              </label>
            `).join('')}
          </div>`;
        break;

      default: // text, email, password, number
        inputHtml = `
          <input type="${type}" id="${id}" name="${name}" value="${value}"
                 placeholder="${placeholder}" ${requiredAttr} ${disabledAttr}
                 class="form-input"
                 ${getOnInputText('this.value')}
                 ${i18nAttr}>`;
    }

    container.innerHTML = `
      <div class="form-group">
        ${label ? `<label for="${id}" class="form-label" ${dataI18n ? `data-i18n="${dataI18n}.label"` : ''}>${label}${required ? ' <span class="form-required">*</span>' : ''}</label>` : ''}
        ${inputHtml}
        ${hint ? `<p class="form-hint" ${dataI18n ? `data-i18n="${dataI18n}.hint"` : ''}>${hint}</p>` : ''}
      </div>
    `;
  }

  /**
   * 渲染搜索框
   * @param {string} containerId
   * @param {object} options
   */
  function renderSearchBox(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      placeholder = '搜索...',
      onSearch = null,
      dataI18n = '',
    } = options;

    const i18nAttr = dataI18n ? `data-i18n="${dataI18n}"` : '';

    container.innerHTML = `
      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
        <input type="text" class="search-input" placeholder="${placeholder}"
               ${i18nAttr}
               ${onSearch ? `oninput="${onSearch}(this.value)"` : ''}>
      </div>
    `;
  }

  // 导出到全局
  window.Forms = { renderInput, renderSearchBox };
})();
