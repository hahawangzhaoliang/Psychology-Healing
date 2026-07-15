/**
 * 通用页脚组件
 * 用法：在 </body> 前引入此文件，然后调用 renderFooter(options)
 *
 * 依赖：i18n.js（需在 footer.js 之前加载）
 *
 * 示例：
 *   <script src="js/components/footer.js"></script>
 *   <script>
 *     renderFooter();
 *   </script>
 */

(function () {
  'use strict';

  // ========== 页脚导航配置 ==========
  const FEATURE_LINKS = [
    { key: 'footer.link_healing',  href: 'relax.html',           label: '疗愈练习' },
    { key: 'footer.link_flow',     href: 'flow-experience.html', label: '心流体验' },
    { key: 'footer.link_emotion',  href: 'emotion.html',         label: '情绪觉察' },
    { key: 'footer.link_knowledge',href: 'knowledge-graph.html', label: '知识图谱' },
  ];

  const ABOUT_LINKS = [
    { key: 'footer.link_about',      href: 'about.html',           label: '平台介绍' },
    { key: 'footer.link_disclaimer', href: 'about.html#disclaimer',label: '免责声明' },
    { key: 'footer.link_privacy',    href: 'privacy-policy.html',  label: '隐私政策' },
    { key: 'footer.link_crisis',     href: 'crisis-support.html',  label: '心理危机求助' },
  ];

  // ========== 渲染页脚 ==========
  function renderFooter(options) {
    const opts = Object.assign({
      target: '#app-footer' // 挂载点选择器
    }, options);

    const mount = document.querySelector(opts.target);
    if (!mount) {
      console.error('[footer.js] 找不到挂载点：' + opts.target);
      return;
    }

    // ---- 功能链接 ----
    const featureLinks = FEATURE_LINKS.map(function (item) {
      return '<li><a href="' + item.href + '" style="color:inherit;text-decoration:none;transition:color 0.2s;" ' +
        'onmouseover="this.style.color=\'var(--color-primary-500)\'" ' +
        'onmouseout="this.style.color=\'inherit\'" ' +
        'data-i18n="' + item.key + '">' + item.label + '</a></li>';
    }).join('');

    // ---- 关于链接 ----
    const aboutLinks = ABOUT_LINKS.map(function (item) {
      return '<li><a href="' + item.href + '" style="color:inherit;text-decoration:none;transition:color 0.2s;" ' +
        'onmouseover="this.style.color=\'var(--color-primary-500)\'" ' +
        'onmouseout="this.style.color=\'inherit\'" ' +
        'data-i18n="' + item.key + '">' + item.label + '</a></li>';
    }).join('');

    // ---- 组装完整 HTML ----
    const html = `
    <footer class="footer">
      <div class="footer-inner">
        <div style="display:grid;gap:2rem;" class="sm:grid-cols-2 lg:grid-cols-4">
          <!-- 品牌简介 -->
          <div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
              <div style="width:32px;height:32px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-500));display:flex;align-items:center;justify-content:center;">
                <svg style="width:20px;height:20px;color:white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <span style="font-weight:600;color:var(--theme-text);" data-i18n="footer.brand">心晴空间</span>
            </div>
            <p style="font-size:0.875rem;color:var(--theme-text-light);line-height:1.6;" data-i18n-html="footer.brand_desc">
              公益心理疗愈平台<br>碎片化疗愈，陪伴你的每一刻
            </p>
          </div>

          <!-- 核心功能 -->
          <div>
            <h4 style="font-weight:500;color:var(--theme-text);margin-bottom:1rem;" data-i18n="footer.features_title">核心功能</h4>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem;font-size:0.875rem;color:var(--theme-text-light);">
              ${featureLinks}
            </ul>
          </div>

          <!-- 关于我们 -->
          <div>
            <h4 style="font-weight:500;color:var(--theme-text);margin-bottom:1rem;" data-i18n="footer.about_title">关于我们</h4>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem;font-size:0.875rem;color:var(--theme-text-light);">
              ${aboutLinks}
            </ul>
          </div>

          <!-- 求助热线 -->
          <div>
            <h4 style="font-weight:500;color:var(--theme-text);margin-bottom:1rem;" data-i18n="footer.hotline_title">求助热线</h4>
            <p style="font-size:0.875rem;color:var(--theme-text-light);margin-bottom:0.5rem;" data-i18n="footer.hotline_label">全国心理援助热线</p>
            <p style="font-size:1.05rem;font-weight:600;color:var(--color-primary-500);">400-161-9995</p>
            <p style="font-size:0.75rem;color:var(--theme-text-light);margin-top:0.25rem;" data-i18n="footer.hotline_note">24小时免费服务</p>
            <a href="crisis-support.html" style="font-size:0.75rem;color:var(--color-primary-500);text-decoration:none;display:inline-block;margin-top:0.4rem;" data-i18n="footer.hotline_more">更多求助资源 →</a>
          </div>
        </div>

        <div style="border-top:1px solid var(--theme-border);padding-top:2rem;margin-top:2rem;">
          <div style="background:var(--color-warm-50);border-radius:var(--radius-lg);padding:1rem;margin-bottom:1.5rem;">
            <p style="font-size:0.75rem;color:var(--theme-text-light);line-height:1.6;text-align:center;" data-i18n="footer.disclaimer">
              本平台为公益性质的心理健康科普与情绪陪伴服务平台，不提供任何形式的医学诊断或心理治疗服务。如有严重心理困扰，请及时寻求专业帮助。
            </p>
          </div>
          <p style="text-align:center;font-size:0.875rem;color:var(--theme-text-light);" data-i18n="footer.copyright">
            © 2026 心晴空间 · 公益心理疗愈平台 · 碎片化疗愈，陪伴你的每一刻
          </p>
        </div>
      </div>
    </footer>`;

    mount.innerHTML = html;

    // ---- 如果 i18n 已就绪，存储原文并应用翻译 ----
    if (window.I18N && typeof window.I18N.storeOriginals === 'function') {
      window.I18N.storeOriginals();
    }
    if (window.I18N && window.I18N.currentLocale === 'en' && typeof window.I18N.applyTranslations === 'function') {
      window.I18N.applyTranslations();
    }
  }

  // ========== 暴露全局 API ==========
  window.renderFooter = renderFooter;
})();
