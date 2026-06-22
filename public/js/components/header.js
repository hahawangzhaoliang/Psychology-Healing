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
    {
      key: 'nav.practice',
      label: '心理练习',
      children: [
        { key: 'nav.relax',   href: 'relax.html',           label: '疗愈练习' },
        { key: 'nav.emotion', href: 'emotion.html',         label: '情绪觉察' },
        { key: 'nav.flow',    href: 'flow-experience.html', label: '心流体验' },
      ]
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

    // ---- 生成单个导航链接 HTML（支持子菜单） ----
    function renderNavLink(item, isMobile) {
      // 有子菜单
      if (item.children && item.children.length > 0) {
        // 判断是否有子页面是当前页面
        const hasActiveChild = item.children.some(function (child) {
          return isCurrentPage(child.href, opts.currentPage);
        });
        const isParentActive = hasActiveChild;

        if (isMobile) {
          // 移动端：直接渲染为普通链接 + 子链接
          let html = '<div class="mobile-nav-group">';
          html += '<div class="mobile-nav-parent" data-i18n="' + item.key + '">' + item.label + '</div>';
          html += '<div class="mobile-nav-children">';
          html += item.children.map(function (child) {
            const childActive = isCurrentPage(child.href, opts.currentPage);
            let cls = '';
            if (childActive) cls = ' class="active"';
            return '<a href="' + child.href + '"' + cls + ' data-i18n="' + child.key + '">' + child.label + '</a>';
          }).join('');
          html += '</div></div>';
          return html;
        } else {
          // 桌面端：下拉菜单
          let cls = 'nav-dropdown-trigger';
          if (isParentActive) cls += ' active-parent';
          let html = '<div class="' + cls + '">';
          html += '<button class="nav-dropdown-btn" aria-haspopup="true" aria-expanded="false">';
          html += '<span data-i18n="' + item.key + '">' + item.label + '</span>';
          html += '<svg class="nav-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5l3 3 3-3"/></svg>';
          html += '</button>';
          html += '<div class="nav-dropdown-menu">';
          html += item.children.map(function (child) {
            const childActive = isCurrentPage(child.href, opts.currentPage);
            let childCls = 'nav-dropdown-item';
            if (childActive) childCls += ' active';
            return '<a href="' + child.href + '" class="' + childCls + '" data-i18n="' + child.key + '">' + child.label + '</a>';
          }).join('');
          html += '</div></div>';
          return html;
        }
      }

      // 普通链接（无子菜单）
      const isActive = isCurrentPage(item.href, opts.currentPage);
      let style = 'color:var(--theme-text-light);text-decoration:none;transition:color 0.2s;';
      if (isActive) {
        style = 'color:var(--color-primary-500);font-weight:500;text-decoration:none;';
      }
      const href = item.href || '#';
      const label = item.label || '';
      const key = item.key || '';

      if (isMobile) {
        let cls = '';
        if (isActive) cls = ' class="active"';
        return '<a href="' + href + '"' + cls + ' data-i18n="' + key + '">' + label + '</a>';
      } else {
        return '<a href="' + href + '" style="' + style + '" ' +
          'onmouseover="this.style.color=\'var(--color-primary-500)\'" ' +
          'onmouseout="this.style.color=\'' + (isActive ? 'var(--color-primary-500)' : 'var(--theme-text-light)') + '\'" ' +
          'data-i18n="' + key + '">' + label + '</a>';
      }
    }

    // ---- 桌面导航链接 ----
    const desktopLinks = NAV_ITEMS.map(function (item) {
      return renderNavLink(item, false);
    }).join('');

    // ---- 移动端菜单链接 ----
    const mobileLinks = NAV_ITEMS.map(function (item) {
      return renderNavLink(item, true);
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
          <img src="assets/images/icons/favicon.png" alt="心晴空间" style="width:48px;height:48px;border-radius:var(--radius-md);object-fit:cover;flex-shrink:0;">
          <span style="font-weight:600;color:var(--theme-text);" data-i18n="footer.brand">心晴空间</span>
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
    // ---- 关键：渲染完成后，如果当前是英文模式，立即应用翻译 ----
    if (window.I18N && window.I18N.currentLocale === 'en' && typeof window.I18N.applyTranslations === 'function') {
      window.I18N.applyTranslations();
    }

    // ---- 导航栏滚动效果 ----
    bindNavbarScroll();

    // ---- 下拉菜单交互 ----
    bindDropdowns();

    // ---- 动态注入 Favicon（公共化，无需逐页手动添加）----
    // 仅当页面未设置 favicon 时才注入，避免覆盖 cat-game 等有特殊 favicon 的页面
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.href = 'assets/images/icons/favicon.png';
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
    }
  }

  // ========== 下拉菜单交互 ==========
  function bindDropdowns() {
    // 桌面端：鼠标悬停 + 点击
    const triggers = document.querySelectorAll('.nav-dropdown-trigger');
    triggers.forEach(function (trigger) {
      const btn = trigger.querySelector('.nav-dropdown-btn');
      const menu = trigger.querySelector('.nav-dropdown-menu');
      if (!btn || !menu) return;

      let timeoutId = null;

      function openMenu() {
        clearTimeout(timeoutId);
        // 关闭其他打开的菜单
        document.querySelectorAll('.nav-dropdown-trigger.open').forEach(function (t) {
          if (t !== trigger) t.classList.remove('open');
        });
        trigger.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }

      function closeMenu() {
        timeoutId = setTimeout(function () {
          trigger.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }, 150);
      }

      trigger.addEventListener('mouseenter', openMenu);
      trigger.addEventListener('mouseleave', closeMenu);

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (trigger.classList.contains('open')) {
          closeMenu();
          clearTimeout(timeoutId);
          trigger.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          openMenu();
        }
      });

      // 菜单内鼠标操作
      menu.addEventListener('mouseenter', function () { clearTimeout(timeoutId); });
      menu.addEventListener('mouseleave', closeMenu);
    });

    // 点击页面其他地方关闭菜单
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-dropdown-trigger')) {
        document.querySelectorAll('.nav-dropdown-trigger.open').forEach(function (t) {
          t.classList.remove('open');
          const b = t.querySelector('.nav-dropdown-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // 移动端：点击父级展开/收起子菜单
    document.querySelectorAll('.mobile-nav-parent').forEach(function (parent) {
      parent.addEventListener('click', function () {
        const group = parent.parentElement;
        if (group) {
          group.classList.toggle('open');
        }
      });
    });
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
