/**
 * AdSense 自动广告接入（心晴空间 / Mind Clear Space）
 * ------------------------------------------------------------
 * 注意：当前已改为「静态 snippet」方式接入。
 * 官方 AdSense snippet 已直接写入 14 个用户页面的 <head> 中：
 *   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6203482765648217" crossorigin="anonymous"></script>
 * 这样 AdSense 验证爬虫无需执行 JS 即可在 HTML 源码中看到代码，验证成功率最高。
 *
 * 本文件保留作为备用方案：若未来需要恢复动态注入或扩展手动广告单元，可直接引用。
 *
 * 后台页排除：
 *   admin.html / settings.html 等后台管理页不放置 snippet（符合 AdSense 政策，也避免干扰管理操作）。
 *   另外内部预览页 icons-preview.html 也被排除（非面向用户的真实功能页）。
 *
 * 合规提醒：
 *   本平台为公益心理疗愈/情绪支持，请确保在 AdSense 后台开启自动广告后，
 *   不要将广告紧邻危机干预、心理援助热线等敏感区域；页面已含「非医疗诊断」免责声明。
 */
(function () {
  'use strict';

  // ====================== 在此填入真实 Publisher ID ======================
  var PUBLISHER_ID = 'ca-pub-6203482765648217'; // 已通过 AdSense 后台获取
  // =======================================================================

  // 不投放广告的页面（后台 / 内部预览）
  var EXCLUDE_PATTERNS = ['admin.html', 'settings.html', 'icons-preview.html'];

  var path = window.location.pathname || '';
  var isExcluded = EXCLUDE_PATTERNS.some(function (p) {
    return path.indexOf(p) !== -1;
  });
  if (isExcluded) return;

  // 未配置真实 ID 时跳过，避免向 Google 发送无效请求并在控制台报错
  if (!PUBLISHER_ID || PUBLISHER_ID.indexOf('XXXXXXXX') !== -1) {
    console.warn('[AdSense] 未配置真实的 PUBLISHER_ID，已跳过广告加载。请编辑 public/js/adsense.js 填入你的 ca-pub- ID。');
    return;
  }

  // 站点验证 meta（有助于 AdSense 后台自动验证网站归属，官方支持方式）
  var meta = document.createElement('meta');
  meta.name = 'google-adsense-account';
  meta.content = PUBLISHER_ID;
  document.head.appendChild(meta);

  // 注入 AdSense 自动广告脚本（官方方式：async + crossorigin）
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(PUBLISHER_ID);
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
})();
