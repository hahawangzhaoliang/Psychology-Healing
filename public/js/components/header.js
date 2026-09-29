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
    { key: 'nav.help',       href: 'crisis-support.html',  label: '心理求助' },
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

        <!-- 用户档案徽章（P2） -->
        <div style="position:relative;margin-left:0.5rem;">
          <button onclick="UserMenu.toggle(event)" style="display:flex;align-items:center;gap:0.375rem;padding:0.375rem 0.75rem;border-radius:var(--radius-full);border:1px solid var(--theme-border);background:var(--theme-card);color:var(--theme-text);font-size:0.85rem;cursor:pointer;transition:all 0.2s;max-width:11rem;" title="我的档案">
            <span id="userBadgeEmoji" style="font-size:1rem;">🌟</span>
            <span id="userBadgeName" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">微光旅人</span>
            <svg style="width:12px;height:12px;flex-shrink:0;color:var(--theme-text-light);" fill="none" stroke="currentColor" viewBox="0 0 12 12"><path d="M3 5l3 3 3-3"/></svg>
          </button>
          <div id="userMenu" style="display:none;position:absolute;right:0;top:calc(100% + 6px);background:var(--theme-card);border:1px solid var(--theme-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);padding:0.875rem;min-width:13rem;z-index:100;">
            <div style="font-size:0.8rem;font-weight:600;color:var(--theme-text);margin-bottom:0.5rem;" data-i18n="user.menu_title">我的本地档案</div>
            <div style="font-size:0.8rem;color:var(--theme-text-light);margin-bottom:0.25rem;">
              <span data-i18n="user.member_since">建立于</span> <span id="userCreatedAt">—</span>
            </div>
            <div style="font-size:0.75rem;color:var(--theme-text-light);margin-bottom:0.75rem;font-family:monospace;" id="userUid">—</div>
            <button onclick="UserMenu.newProfile()" style="width:100%;padding:0.5rem 0.75rem;border-radius:var(--radius-full);border:1px solid var(--theme-border);background:var(--theme-bg);color:var(--theme-text);font-size:0.8rem;cursor:pointer;transition:all 0.2s;margin-bottom:0.375rem;" data-i18n="user.new_profile">新建档案</button>
            <button onclick="UserMenu.openManager()" style="width:100%;padding:0.5rem 0.75rem;border-radius:var(--radius-full);border:none;background:var(--color-primary-100);color:var(--color-primary-700);font-size:0.8rem;font-weight:600;cursor:pointer;transition:all 0.2s;" data-i18n="user.manage_profile">档案管理</button>
          </div>
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
        <div style="padding:0.75rem 1.25rem;border-top:1px solid var(--theme-border);display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:var(--theme-text-light);">
          <span style="font-size:1.1rem;" id="userBadgeEmojiM">🌟</span>
          <span id="userBadgeNameM">微光旅人</span>
          <button onclick="UserMenu.openManager()" style="margin-left:0.5rem;padding:0.25rem 0.625rem;border-radius:var(--radius-full);border:1px solid var(--color-primary-300);background:var(--color-primary-100);color:var(--color-primary-700);font-size:0.75rem;font-weight:600;cursor:pointer;" data-i18n="user.manage_profile">档案管理</button>
          <button onclick="UserMenu.newProfile()" style="margin-left:auto;padding:0.25rem 0.625rem;border-radius:var(--radius-full);border:1px solid var(--theme-border);background:transparent;color:var(--theme-text);font-size:0.75rem;cursor:pointer;" data-i18n="user.new_profile">新建档案</button>
        </div>
      </div>
    </nav>`;

    mount.innerHTML = html;
    mountProfileModal();

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

    // ---- 轻量匿名埋点（P0）：自动 page_view + 求助入口点击 ----
    bindAnalytics();

    // ---- 修复：固定导航遮挡内容 —— 同步 body 顶部内边距 ----
    bindNavbarPadding();

    // ---- 用户档案徽章（P2） ----
    renderUserBadge();
  }

  // ========== 用户档案徽章（P2） ==========
  function renderUserBadge() {
    if (!window.UserStore) return;
    try {
      var profile = UserStore.profile();
      var isEn = !!(I18N && I18N.currentLocale === 'en');
      var displayName = profile.name || '微光旅人';
      if (isEn && displayName === '微光旅人') displayName = 'Wanderer';
      var emojiEl = document.getElementById('userBadgeEmoji');
      var nameEl = document.getElementById('userBadgeName');
      if (emojiEl) emojiEl.textContent = profile.emoji || '🌟';
      if (nameEl) nameEl.textContent = displayName;
      var emojiM = document.getElementById('userBadgeEmojiM');
      var nameM = document.getElementById('userBadgeNameM');
      if (emojiM) emojiM.textContent = profile.emoji || '🌟';
      if (nameM) nameM.textContent = displayName;
      var createdEl = document.getElementById('userCreatedAt');
      if (createdEl && profile.createdAt) {
        createdEl.textContent = new Date(profile.createdAt).toLocaleDateString();
      }
      var uidEl = document.getElementById('userUid');
      if (uidEl) uidEl.textContent = 'UID ' + profile.uid.slice(0, 8);
    } catch (e) { /* ignore */ }
  }

  // 档案管理弹层（单例，挂载到 body）
  function mountProfileModal() {
    if (document.getElementById('profileModal')) return;
    var modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(60,50,40,0.28);backdrop-filter:blur(2px);z-index:9999;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = '' +
      '<div style="background:var(--theme-card);border:1px solid var(--theme-border);border-radius:var(--radius-xl);box-shadow:var(--shadow-lg);width:100%;max-width:26rem;max-height:86vh;overflow:auto;padding:1.25rem;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">' +
          '<div style="font-size:1rem;font-weight:700;color:var(--theme-text);" data-i18n="user.manage_profile">档案管理</div>' +
          '<button onclick="UserMenu.closeManager()" style="border:none;background:none;color:var(--theme-text-light);font-size:1.2rem;cursor:pointer;padding:0.25rem 0.5rem;" aria-label="关闭">✕</button>' +
        '</div>' +
        '<div style="margin-bottom:1.25rem;">' +
          '<div style="font-size:0.85rem;font-weight:600;color:var(--theme-text);margin-bottom:0.5rem;" data-i18n="user.edit_self">编辑当前档案</div>' +
          '<input id="profileNameInput" type="text" maxlength="20" style="width:100%;padding:0.5rem 0.75rem;border-radius:var(--radius-lg);border:1px solid var(--theme-border);background:var(--theme-bg);color:var(--theme-text);font-size:0.9rem;box-sizing:border-box;margin-bottom:0.5rem;" placeholder="昵称">' +
          '<div style="font-size:0.75rem;color:var(--theme-text-light);margin-bottom:0.375rem;" data-i18n="user.choose_emoji">选择头像</div>' +
          '<div id="profileEmojiPicker" style="display:flex;flex-wrap:wrap;gap:0.375rem;margin-bottom:0.625rem;"></div>' +
          '<button onclick="UserMenu.saveEdit()" style="width:100%;padding:0.5rem 0.75rem;border-radius:var(--radius-full);border:none;background:var(--color-primary-500);color:#fff;font-size:0.85rem;font-weight:600;cursor:pointer;" data-i18n="user.save">保存</button>' +
        '</div>' +
        '<div style="border-top:1px solid var(--theme-border);padding-top:0.875rem;">' +
          '<div style="font-size:0.85rem;font-weight:600;color:var(--theme-text);margin-bottom:0.5rem;" data-i18n="user.profile_list">本机档案</div>' +
          '<div id="profileList" style="display:flex;flex-direction:column;gap:0.5rem;"></div>' +
          '<button onclick="UserMenu.newProfile()" style="width:100%;margin-top:0.75rem;padding:0.5rem 0.75rem;border-radius:var(--radius-full);border:1px dashed var(--color-primary-300);background:transparent;color:var(--color-primary-600);font-size:0.85rem;font-weight:600;cursor:pointer;" data-i18n="user.new_profile">＋ 新建档案</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    // 动态挂载的元素不会被页面初始化时的 i18n 扫描覆盖，mount 后立即应用一次
    if (window.I18N && I18N.currentLocale === 'en' && typeof I18N.applyTranslations === 'function') {
      I18N.applyTranslations();
    }
  }

  var EMOJI_OPTIONS = ['🌟', '🌙', '🌸', '🍀', '🦋', '🐰', '☁️', '🌈', '⭐', '🍃', '🐱', '💧'];
  var _profileEmoji = '🌟';

  // 用户菜单全局接口
  window.UserMenu = {
    toggle: function (e) {
      if (e && e.stopPropagation) e.stopPropagation();
      var menu = document.getElementById('userMenu');
      if (!menu) return;
      var show = menu.style.display !== 'block';
      menu.style.display = show ? 'block' : 'none';
      if (show) {
        setTimeout(function () {
          document.addEventListener('click', UserMenu.hide, { once: true });
        }, 0);
      }
    },
    hide: function () {
      var menu = document.getElementById('userMenu');
      if (menu) menu.style.display = 'none';
    },
    newProfile: function () {
      if (!window.UserStore) return;
      var ok = confirm(I18N && I18N.currentLocale === 'en'
        ? 'This will create a new local profile. Your current profile data stays saved on this device. Continue?'
        : '将开启一个新的本地档案。当前档案的数据仍会保留在本地，不会丢失。确定继续吗？');
      if (!ok) return;
      UserStore.newProfile();
      window.location.reload();
    },
    openManager: function () {
      if (!window.UserStore) return;
      mountProfileModal();
      var cur = UserStore.profile();
      var nameEl = document.getElementById('profileNameInput');
      if (nameEl) nameEl.value = cur.name || '微光旅人';
      _profileEmoji = cur.emoji || '🌟';
      renderEmojiPicker();
      renderProfiles();
      var modal = document.getElementById('profileModal');
      modal.style.display = 'flex';
    },
    closeManager: function () {
      var modal = document.getElementById('profileModal');
      if (modal) modal.style.display = 'none';
    },
    saveEdit: function () {
      if (!window.UserStore) return;
      var nameEl = document.getElementById('profileNameInput');
      var name = nameEl ? nameEl.value : '';
      UserStore.updateProfile(name, _profileEmoji);
      renderUserBadge();
      renderProfiles();
      var saved = document.getElementById('profileNameInput');
      if (saved) saved.blur();
      alert(I18N && I18N.currentLocale === 'en' ? 'Profile updated.' : '档案已更新');
    },
    switchTo: function (uid) {
      if (!window.UserStore) return;
      var changed = UserStore.switchProfile(uid);
      if (changed) window.location.reload();
    },
    pickEmoji: function (emoji) {
      _profileEmoji = emoji;
      renderEmojiPicker();
    },
    // 供外部（如设置页切语言）刷新徽章显示
    refreshBadge: function () { renderUserBadge(); }
  };

  function renderEmojiPicker() {
    var box = document.getElementById('profileEmojiPicker');
    if (!box) return;
    box.innerHTML = EMOJI_OPTIONS.map(function (e) {
      var active = e === _profileEmoji;
      return '<button onclick="UserMenu.pickEmoji(\'' + e + '\')" style="font-size:1.25rem;width:2.5rem;height:2.5rem;border-radius:var(--radius-full);border:1px solid ' + (active ? 'var(--color-primary-400)' : 'var(--theme-border)') + ';background:' + (active ? 'var(--color-primary-100)' : 'var(--theme-bg)') + ';cursor:pointer;transition:all 0.15s;line-height:1;">' + e + '</button>';
    }).join('');
  }

  function renderProfiles() {
    var box = document.getElementById('profileList');
    if (!box || !window.UserStore) return;
    var cur = UserStore.profile();
    var list = UserStore.listProfiles();
    var isEn = !!(I18N && I18N.currentLocale === 'en');
    var currentLabel = isEn ? ' Current' : ' 当前';
    var switchLabel = isEn ? 'Switch' : '切换';
    box.innerHTML = list.map(function (p) {
      var isCur = p.uid === cur.uid;
      var created = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString(isEn ? 'en-US' : 'zh-CN')
        : '—';
      var countLabel = p.recordCount + (isEn ? ' records' : ' 条记录');
      var displayName = (isEn && p.name === '微光旅人') ? 'Wanderer' : p.name;
      return '<div style="display:flex;align-items:center;gap:0.625rem;padding:0.625rem 0.75rem;border-radius:var(--radius-lg);border:1px solid ' + (isCur ? 'var(--color-primary-300)' : 'var(--theme-border)') + ';background:' + (isCur ? 'var(--color-primary-100)' : 'var(--theme-card)') + ';">' +
        '<span style="font-size:1.4rem;">' + p.emoji + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:0.85rem;font-weight:600;color:var(--theme-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + displayName + (isCur ? ' <span style="color:var(--color-primary-600);font-weight:700;">' + currentLabel + '</span>' : '') + '</div>' +
          '<div style="font-size:0.7rem;color:var(--theme-text-light);">' + created + ' · ' + countLabel + '</div>' +
        '</div>' +
        (isCur ? '' : '<button onclick="UserMenu.switchTo(\'' + p.uid + '\')" style="padding:0.3rem 0.75rem;border-radius:var(--radius-full);border:1px solid var(--color-primary-300);background:var(--theme-card);color:var(--color-primary-600);font-size:0.75rem;cursor:pointer;">' + switchLabel + '</button>') +
      '</div>';
    }).join('');
  }

  // ========== 轻量匿名埋点（P0） ==========
  // 隐私优先：仅事件类型 + 页面路径，无 Cookie / IP / UA
  function bindAnalytics() {
    function ensureAnalytics(cb) {
      if (window.Analytics) {
        if (typeof cb === 'function') cb();
        return;
      }
      var s = document.createElement('script');
      s.src = 'js/analytics.js';
      s.async = true;
      s.onload = function () { if (typeof cb === 'function') cb(); };
      s.onerror = function () { /* 埋点不可用时静默降级，不影响页面 */ };
      document.head.appendChild(s);
    }

    // 1. 自动记录页面访问
    ensureAnalytics(function () {
      if (window.Analytics) window.Analytics.track('page_view');
    });

    // 2. 求助入口点击（委托监听，覆盖导航 / 页脚 / 内容中的所有危机页链接）
    document.addEventListener('click', function (e) {
      var target = e.target;
      var link = target && target.closest
        ? target.closest('a[href$="crisis-support.html"], a[href^="tel:"]')
        : null;
      if (link && window.Analytics) {
        var page = '';
        try { page = location.pathname || ''; } catch (err) { /* ignore */ }
        window.Analytics.track('help_nav_click', { from: page });
      }
    });
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
    // 菜单展开后导航变高，同步 body 顶部内边距，避免内容被遮
    const navbar = document.getElementById('navbar');
    if (navbar) document.body.style.paddingTop = navbar.offsetHeight + 'px';
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

  /**
   * 修复 fixed 导航遮挡内容：
   * 导航 position:fixed 脱离文档流，页面内容从视口顶部开始，
   * 顶部 64px 被导航盖住。这里把导航实际高度同步为 body 的 padding-top，
   * 使内容整体下移，且移动端菜单展开 / 窗口尺寸变化时自动跟随。
   */
  function bindNavbarPadding() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    function sync() {
      document.body.style.paddingTop = navbar.offsetHeight + 'px';
    }

    sync();

    // 优先用 ResizeObserver：菜单展开收起、字体变化、窗口 resize 都会触发
    if (typeof ResizeObserver === 'function') {
      try {
        const ro = new ResizeObserver(sync);
        ro.observe(navbar);
        return;
      } catch (err) { /* fallback 到 resize 监听 */ }
    }
    window.addEventListener('resize', sync, { passive: true });
  }

  // ========== 暴露全局 API ==========
  window.renderHeader = renderHeader;
})();
