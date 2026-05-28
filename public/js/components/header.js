/**
 * 通用导航栏组件
 * 用法：在 </body> 前引入此文件，然后调用 renderHeader(options)
 *
 * 依赖：i18n.js（需在 header.js 之前加载）
 *
 * 示例：
 *   <script src="js/i18n.js"></script>
 *   <script src="js/components/header.js"></script>
 *   <script>
 *     renderHeader({ currentPage: 'about' });
 *   </script>
 */

(function () {
  'use strict';

  // ========== 导航配置 ==========
  const NAV_ITEMS = [
    { key: 'nav.home',       href: 'index.html',           label: '首页' },
    { key: 'nav.relax',      href: 'relax.html',           label: '疗愈练习' },
    { key: 'nav.emotion',    href: 'emotion.html',         label: '情绪觉察' },
    {
      key: 'nav.flow',
      href: 'flow-experience.html',
      label: '心流体验'
    },
    { key: 'nav.knowledge',  href: 'knowledge-graph.html', label: '知识图谱' },
    { key: 'nav.about',      href: 'about.html',           label: '关于我们' },
    { key: 'nav.companion',  href: 'companion.html',       label: '我的伙伴' },
  ];

  // ========== 渲染导航栏 ==========
  function renderHeader(options) {
    const opts = Object.assign({
      currentPage: '',       // 当前页面标识，如 'about' 'index'
      showLangSwitcher: true,
      target: '#app-header' // 挂载点选择器
    }, options);

    const mount = document.querySelector(opts.target);
    if (!mount) {
      console.error('[header.js] 找不到挂载点：' + opts.target);
      return;
    }

    // ---- 桌面导航链接 ----
    const desktopLinks = NAV_ITEMS.map(function (item) {
      const isActive = isCurrentPage(item.href, opts.currentPage);
      let style = 'color:var(--theme-text-light);text-decoration:none;transition:color 0.2s;';
      if (isActive) {
        style = 'color:var(--color-primary-500);font-weight:500;text-decoration:none;';
      }
      return '<a href="' + item.href + '" style="' + style + '" ' +
        'onmouseover="this.style.color=\'var(--color-primary-500)\'" ' +
        'onmouseout="this.style.color=\'' + (isActive ? 'var(--color-primary-500)' : 'var(--theme-text-light)') + '\'" ' +
        'data-i18n="' + item.key + '">' + item.label + '</a>';
    }).join('');

    // ---- 移动端菜单链接 ----
    const mobileLinks = NAV_ITEMS.map(function (item) {
      const isActive = isCurrentPage(item.href, opts.currentPage);
      let cls = '';
      if (isActive) cls = ' class="active"';
      return '<a href="' + item.href + '"' + cls + ' data-i18n="' + item.key + '">' + item.label + '</a>';
    }).join('');

    // ---- 语言切换器容器 ----
    const switcherDesktop = opts.showLangSwitcher
      ? '<div class="i18n-switcher" style="display:flex;align-items:center;margin-left:0.5rem;"></div>'
      : '';
    const switcherMobile = opts.showLangSwitcher
      ? '<div class="i18n-switcher" style="padding:0.5rem 0;"></div>'
      : '';

    // ---- 组装完整 HTML（与现有页面结构完全一致）----
    const html = `
    <nav class="navbar" id="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="nav-logo">
          <div style="width:32px;height:32px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-500));display:flex;align-items:center;justify-content:center;">
            <svg style="width:20px;height:20px;color:white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </div>
          <span style="font-weight:600;color:var(--theme-text);">心晴空间</span>
        </a>

        <div class="desktop-nav">
          ${desktopLinks}
          ${switcherDesktop}
        </div>

        <button onclick="toggleMobileMenu()" style="display:flex;padding:0.5rem;color:var(--theme-text-light);background:none;border:none;cursor:pointer;" class="md:hidden" aria-label="打开菜单">
          <svg style="width:24px;height:24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <div id="mobileMenu" class="mobile-menu">
        ${mobileLinks}
        ${switcherMobile}
      </div>
    </nav>`;

    mount.innerHTML = html;

    // ---- 如果 i18n 已就绪，存储原文并渲染切换器 ----
    if (window.I18N && typeof window.I18N.storeOriginals === 'function') {
      window.I18N.storeOriginals();
    }
    if (window.I18N && typeof window.I18N.renderSwitcher === 'function') {
      window.I18N.renderSwitcher();
    }

    // ---- 导航栏滚动效果 ----
    bindNavbarScroll();
  }

  // ========== 工具函数 ==========

  /** 判断 href 是否匹配当前页面 */
  function isCurrentPage(href, currentPage) {
    if (!currentPage) return false;
    // 支持两种匹配方式：
    // 1. currentPage === 'about' 匹配 href="about.html"
    // 2. currentPage === 'about.html' 精确匹配
    if (href === currentPage) return true;
    const pageName = href.replace(/\.html$/, '');
    return pageName === currentPage;
  }

  /** 切换移动端菜单（全局函数，供 onclick 调用） */
  window.toggleMobileMenu = function () {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    menu.classList.toggle('open');
  };

  function bindNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    function onScroll() {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ========== 暴露全局 API ==========
  window.renderHeader = renderHeader;
})();
