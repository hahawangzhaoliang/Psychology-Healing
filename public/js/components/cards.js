/**
 * cards.js - 统一卡片组件库
 * 基于 neuroaesthetics.css 设计系统
 */

(function () {
  'use strict';

  /**
   * 渲染通用卡片容器
   * @param {string} containerId - 容器 ID
   * @param {object} options - 配置项
   * @param {string} options.variant - 变体：default | stat | article | activity
   * @param {string} options.title - 卡片标题（可选）
   * @param {string} options.subtitle - 副标题（可选）
   * @param {string} options.content - 卡片内容 HTML
   * @param {string} options.footer - 卡片底部 HTML（可选）
   * @param {string} options.onclick - 点击回调（可选，使卡片可点击）
   * @param {string} options.className - 额外 class
   * @param {string} options.dataI18n - i18n key 前缀（可选）
   */
  function renderCard(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      variant = 'default',
      title = '',
      subtitle = '',
      content = '',
      footer = '',
      onclick = '',
      className = '',
      dataI18n = '',
    } = options;

    // variant 直接映射为 CSS 类，default → ''（无额外类）
    const variantMap = { default: '', stat: 'card-stat', article: 'card-article', activity: 'card-activity' };
    const variantClass = variantMap[variant] || '';
    const clickClass = onclick ? 'card-clickable' : '';
    const i18nAttr = dataI18n ? `data-i18n="${dataI18n}"` : '';
    let onclickAttr = '';
    if (onclick) {
      if (typeof onclick === 'function') {
        const fnName = `_cardFn_${Math.random().toString(36).slice(2, 9)}`;
        window[fnName] = onclick;
        onclickAttr = `onclick="${fnName}()"`;
      } else {
        onclickAttr = `onclick="${onclick}"`;
      }
    }

    container.innerHTML = `
      <div class="card ${variantClass} ${clickClass} ${className}"
           ${onclickAttr}
           ${i18nAttr}
           data-touch-feedback>
        ${title ? `<div class="card-header">
          <h3 class="card-title" ${dataI18n ? `data-i18n="${dataI18n}.title"` : ''}>${title}</h3>
          ${subtitle ? `<p class="card-subtitle" ${dataI18n ? `data-i18n="${dataI18n}.subtitle"` : ''}>${subtitle}</p>` : ''}
        </div>` : ''}
        <div class="card-body">${content}</div>
        ${footer ? `<div class="card-footer">${footer}</div>` : ''}
      </div>
    `;
  }

  /**
   * 渲染统计卡片（用于仪表盘、概览页）
   * @param {string} containerId
   * @param {object} options
   * @param {string} options.icon - 图标 HTML
   * @param {string|number} options.value - 数值
   * @param {string} options.unit - 单位（如 "次", "min"）
   * @param {string} options.label - 标签文字
   * @param {string} options.trend - 趋势：up | down | neutral（可选）
   * @param {string} options.trendValue - 趋势值（如 "+12%"）
   * @param {string} options.dataI18n - i18n key 前缀
   */
  function renderStatCard(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      icon = '',
      value = '0',
      unit = '',
      label = '',
      trend = 'neutral',
      trendValue = '',
      dataI18n = '',
    } = options;

    const trendClass = `trend-${trend}`;
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

    container.innerHTML = `
      <div class="card card-stat" ${dataI18n ? `data-i18n="${dataI18n}"` : ''}>
        <div class="stat-icon">${icon}</div>
        <div class="stat-info">
          <div class="stat-value">
            <span class="stat-number">${value}</span>
            ${unit ? `<span class="stat-unit" data-i18n="${dataI18n ? dataI18n + '.' : ''}unit">${unit}</span>` : ''}
          </div>
          <div class="stat-label" ${dataI18n ? `data-i18n="${dataI18n}.label"` : ''}>${label}</div>
        </div>
        ${trendValue ? `<div class="stat-trend ${trendClass}">${trendIcon} ${trendValue}</div>` : ''}
      </div>
    `;
  }

  /**
   * 渲染文章/内容卡片
   * @param {string} containerId
   * @param {object} options
   * @param {string} options.image - 图片 URL（可选）
   * @param {string} options.category - 分类标签
   * @param {string} options.title - 标题
   * @param {string} options.excerpt - 摘要
   * @param {string} options.date - 日期（可选）
   * @param {string} options.onclick - 点击回调
   * @param {string} options.dataI18n - i18n key 前缀
   */
  function renderArticleCard(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      image = '',
      category = '',
      title = '',
      excerpt = '',
      date = '',
      onclick = '',
      dataI18n = '',
    } = options;

    container.innerHTML = `
      <div class="card card-article card-clickable"
           onclick="${onclick}"
           data-touch-feedback>
        ${image ? `<div class="card-image"><img src="${image}" alt="${title}" loading="lazy"></div>` : ''}
        <div class="card-body">
          ${category ? `<span class="card-category" data-i18n="${dataI18n ? dataI18n + '.category' : ''}">${category}</span>` : ''}
          <h3 class="card-title" ${dataI18n ? `data-i18n="${dataI18n}.title"` : ''}>${title}</h3>
          <p class="card-excerpt" ${dataI18n ? `data-i18n="${dataI18n}.excerpt"` : ''}>${excerpt}</p>
          ${date ? `<time class="card-date">${date}</time>` : ''}
        </div>
      </div>
    `;
  }

  // 导出到全局
  window.Cards = { renderCard, renderStatCard, renderArticleCard };
})();
