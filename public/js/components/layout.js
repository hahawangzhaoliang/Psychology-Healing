/**
 * layout.js - 统一布局组件库
 * 基于 neuroaesthetics.css 设计系统
 */

(function () {
  'use strict';

  /**
   * 渲染页面 Hero 区（统一各页面 hero 结构）
   * @param {string} containerId - 容器 ID（通常是 #page-hero）
   * @param {object} options - 配置项
   * @param {string} options.icon - 图标 SVG HTML
   * @param {string} options.title - 标题（支持 HTML，用 data-i18n-html）
   * @param {string} options.subtitle - 副标题
   * @param {string} options.dataI18n - i18n key 前缀
   * @param {string} options.bgClass - 背景 class（默认 hero-gradient）
   */
  function renderPageHero(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      icon = '',
      title = '',
      subtitle = '',
      dataI18n = '',
      bgClass = 'hero-gradient',
    } = options;

    const titleKey = dataI18n ? `data-i18n-html="${dataI18n}.title"` : '';
    const subtitleKey = dataI18n ? `data-i18n="${dataI18n}.subtitle"` : '';

    container.innerHTML = `
      <section class="${bgClass} py-14">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 text-center stagger-child" style="--stagger-index: 0">
          ${icon ? `
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/80 shadow-sm mb-4">
              ${icon}
            </div>` : ''}
          ${title ? `<h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-3" ${titleKey}>${title}</h1>` : ''}
          ${subtitle ? `<p class="text-gray-600 max-w-xl mx-auto" ${subtitleKey}>${subtitle}</p>` : ''}
        </div>
      </section>
    `;
  }

  /**
   * 渲染 Section 容器（统一内容区块）
   * @param {string} containerId
   * @param {object} options
   * @param {string} options.title - 区块标题（可选）
   * @param {string} options.subtitle - 区块副标题（可选）
   * @param {string} bodyHtml - 区块内容 HTML（直接传入，不走 options）
   * @param {string} options.className - 额外 class
   * @param {string} options.dataI18n - i18n key 前缀
   */
  function renderSection(containerId, bodyHtml, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      title = '',
      subtitle = '',
      className = 'py-10',
      dataI18n = '',
    } = options;

    container.innerHTML = `
      <section class="${className}">
        <div class="max-w-6xl mx-auto px-4 sm:px-6">
          ${title ? `
            <div class="text-center mb-10 stagger-child" style="--stagger-index: 1">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-2" ${dataI18n ? `data-i18n="${dataI18n}.title"` : ''}>${title}</h2>
              ${subtitle ? `<p class="text-gray-600" ${dataI18n ? `data-i18n="${dataI18n}.subtitle"` : ''}>${subtitle}</p>` : ''}
            </div>` : ''}
          <div class="section-body">${bodyHtml}</div>
        </div>
      </section>
    `;
  }

  /**
   * 渲染网格布局容器
   * @param {string} containerId
   * @param {object} options
   * @param {number} options.cols - 列数（默认 3）
   * @param {number} options.colsMd - 中等屏幕列数
   * @param {number} options.colsLg - 大屏幕列数
   * @param {string} options.gap - 间距（默认 6 = 1.5rem）
   * @param {string} bodyHtml - 网格内容 HTML
   */
  function renderGrid(containerId, bodyHtml, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      cols = 1,
      colsMd = 2,
      colsLg = 3,
      gap = 6,
    } = options;

    container.innerHTML = `
      <div class="grid grid-cols-${cols} md:grid-cols-${colsMd} lg:grid-cols-${colsLg} gap-${gap}">
        ${bodyHtml}
      </div>
    `;
  }

  /**
   * 渲染 Tab 切换栏
   * @param {string} containerId
   * @param {array} tabs - [{key, label, icon?}]
   * @param {string} activeTab - 当前激活的 tab key
   * @param {function} onSwitch - 切换回调 (key) => {}
   * @param {object} options
   * @param {string} options.dataI18n - i18n key 前缀
   */
  function renderTabBar(containerId, tabs, activeTab, onSwitch, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { dataI18n = '' } = options;

    // 用 Symbol 生成唯一回调名，避免冲突
    const cbName = `_tabSwitch_${Math.random().toString(36).slice(2, 9)}`;
    window[cbName] = (key) => { if (onSwitch) onSwitch(key); };

    container.innerHTML = `
      <div class="tab-bar-container" role="tablist" aria-label="切换标签">
        <div class="tab-bar">
          ${tabs.map(tab => `
            <button class="tab-btn ${tab.key === activeTab ? 'active' : ''}"
                    role="tab"
                    aria-selected="${tab.key === activeTab}"
                    data-tab="${tab.key}"
                    onclick="${cbName}('${tab.key}')">
              ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
              <span class="tab-label" ${dataI18n ? `data-i18n="${dataI18n}.tab_${tab.key}"` : ''}>${tab.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 渲染分页控件
   * @param {string} containerId
   * @param {object} options
   * @param {number} options.current - 当前页
   * @param {number} options.total - 总页数
   * @param {function} options.onPageChange - 翻页回调 (page) => {}
   */
  function renderPagination(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { current = 1, total = 1, onPageChange = null } = options;

    if (total <= 1) {
      container.innerHTML = '';
      return;
    }

    let pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages = [1];
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    const cbName = `_pageChange_${Math.random().toString(36).slice(2, 7)}`;
    window[cbName] = (page) => { if (onPageChange) onPageChange(page); };

    container.innerHTML = `
      <nav class="pagination" aria-label="分页导航">
        <button class="page-btn page-prev" ${current <= 1 ? 'disabled' : ''}
                onclick="${cbName}(${current - 1})">‹</button>
        ${pages.map(p => {
          if (p === '...') return `<span class="page-ellipsis">…</span>`;
          return `<button class="page-btn ${p === current ? 'active' : ''}"
                   onclick="${cbName}(${p})">${p}</button>`;
        }).join('')}
        <button class="page-btn page-next" ${current >= total ? 'disabled' : ''}
                onclick="${cbName}(${current + 1})">›</button>
      </nav>
    `;
  }

  // 导出到全局
  window.Layout = { renderPageHero, renderSection, renderGrid, renderTabBar, renderPagination };
})();
