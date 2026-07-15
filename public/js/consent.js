/*
 * Consent Management Platform (CMP) — Google Consent Mode v2
 * ------------------------------------------------------------
 * - Sets default-denied consent for EEA / UK / CH users (granted elsewhere).
 * - Shows a calm, bilingual consent banner only when consent is required.
 * - Persists the choice in localStorage and updates Google tags via gtag().
 * - Defers to Google's certified Funding Choices CMP if it is enabled in
 *   the AdSense account (window.googlefc present), so the two never double
 *   up. The Funding Choices script is loaded alongside this file in <head>.
 *
 * This satisfies the EU User Consent Policy / DMA signalling layer. For full
 * certification you may enable "Privacy & messaging" in AdSense, which makes
 * Funding Choices the active CMP; this banner simply stays dormant.
 */
(function () {
  'use strict';

  // ---------- 1. Consent Mode v2 default consent ----------
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var EEA_REGIONS = [
    'AT','BE','BG','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU',
    'IE','IS','IT','LI','LT','LU','LV','MT','NL','NO','PL','PT','RO','SE','SI','SK','GB'
  ];

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'region': EEA_REGIONS,
    'wait_for_update': 500
  });

  // ---------- 2. Helpers ----------
  function fundingChoicesActive() {
    return (typeof window.googlefc !== 'undefined') && !!window.googlefc;
  }

  var STORAGE_KEY = 'xinqing_cmp_consent_v1';

  function readStored() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch (e) { return null; }
  }

  function applyConsent(c) {
    gtag('consent', 'update', {
      'ad_storage': c.ad_storage,
      'ad_user_data': c.ad_user_data,
      'ad_personalization': c.ad_personalization,
      'analytics_storage': c.analytics_storage
    });
  }

  function saveConsent(c) {
    c.ts = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch (e) {}
  }

  function getLocale() {
    try { if (window.I18N && window.I18N.currentLocale === 'en') return 'en'; } catch (e) {}
    return 'zh';
  }

  var I18N = {
    zh: {
      title: '我们使用 Cookie 与广告',
      desc: '为维持本公益心理平台的免费运转，我们可能在您同意的前提下展示 Google 广告并使用 Cookie。您可随时在「隐私政策」中更改选择。',
      accept: '接受全部',
      reject: '拒绝全部',
      manage: '管理偏好',
      save: '保存偏好',
      link: '隐私政策',
      manage_title: '管理您的偏好',
      cat_personalized: '个性化广告',
      cat_personalized_desc: '根据您的兴趣展示相关广告（含跨站数据）',
      cat_storage: '广告存储',
      cat_storage_desc: '在您设备上保存广告相关 Cookie',
      cat_analytics: '数据分析',
      cat_analytics_desc: '了解页面使用情况以持续改进服务'
    },
    en: {
      title: 'We use cookies & ads',
      desc: 'To keep this non-profit mental-health platform free, we may show Google ads and use cookies with your consent. You can change your choice anytime in our Privacy Policy.',
      accept: 'Accept all',
      reject: 'Reject all',
      manage: 'Manage',
      save: 'Save preferences',
      link: 'Privacy Policy',
      manage_title: 'Manage your preferences',
      cat_personalized: 'Personalized ads',
      cat_personalized_desc: 'Show relevant ads based on your interests (cross-site data)',
      cat_storage: 'Ad storage',
      cat_storage_desc: 'Store ad-related cookies on your device',
      cat_analytics: 'Analytics',
      cat_analytics_desc: 'Understand usage to keep improving the service'
    }
  };

  // ---------- 3. Banner UI ----------
  function toggleMarkup(key, label, desc) {
    return '<label class="cmp-toggle">' +
             '<input type="checkbox" data-cmp-toggle="' + key + '" checked />' +
             '<span class="cmp-toggle-text"><strong>' + label + '</strong>' +
             '<small>' + desc + '</small></span>' +
           '</label>';
  }

  function showBanner() {
    var L = I18N[getLocale()];
    var overlay = document.createElement('div');
    overlay.id = 'cmp-banner';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'false');
    overlay.setAttribute('aria-label', L.title);
    overlay.innerHTML =
      '<div class="cmp-card">' +
        '<div class="cmp-body">' +
          '<h2 class="cmp-title">' + L.title + '</h2>' +
          '<p class="cmp-desc">' + L.desc + '</p>' +
          '<a class="cmp-link" href="privacy-policy.html" target="_blank" rel="noopener">' + L.link + ' →</a>' +
        '</div>' +
        '<div class="cmp-actions">' +
          '<button class="cmp-btn cmp-btn-ghost" data-cmp="manage">' + L.manage + '</button>' +
          '<button class="cmp-btn cmp-btn-ghost" data-cmp="reject">' + L.reject + '</button>' +
          '<button class="cmp-btn cmp-btn-primary" data-cmp="accept">' + L.accept + '</button>' +
        '</div>' +
        '<div class="cmp-manage" hidden>' +
          '<h3 class="cmp-manage-title">' + L.manage_title + '</h3>' +
          toggleMarkup('personalized', L.cat_personalized, L.cat_personalized_desc) +
          toggleMarkup('storage', L.cat_storage, L.cat_storage_desc) +
          toggleMarkup('analytics', L.cat_analytics, L.cat_analytics_desc) +
          '<button class="cmp-btn cmp-btn-primary cmp-save" data-cmp="save">' + L.save + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('[data-cmp="accept"]').addEventListener('click', function () {
      var all = { ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted', analytics_storage:'granted' };
      applyConsent(all); saveConsent(all); dismiss(overlay);
    });
    overlay.querySelector('[data-cmp="reject"]').addEventListener('click', function () {
      var none = { ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied' };
      applyConsent(none); saveConsent(none); dismiss(overlay);
    });
    overlay.querySelector('[data-cmp="manage"]').addEventListener('click', function () {
      overlay.querySelector('.cmp-manage').hidden = false;
      overlay.querySelector('.cmp-actions').style.display = 'none';
    });
    overlay.querySelector('[data-cmp="save"]').addEventListener('click', function () {
      var personalized = overlay.querySelector('[data-cmp-toggle="personalized"]').checked;
      var c = {
        ad_user_data: personalized ? 'granted' : 'denied',
        ad_personalization: personalized ? 'granted' : 'denied',
        ad_storage: overlay.querySelector('[data-cmp-toggle="storage"]').checked ? 'granted' : 'denied',
        analytics_storage: overlay.querySelector('[data-cmp-toggle="analytics"]').checked ? 'granted' : 'denied'
      };
      applyConsent(c); saveConsent(c); dismiss(overlay);
    });
    // move focus to the dialog for accessibility
    var firstBtn = overlay.querySelector('.cmp-btn-primary');
    if (firstBtn) firstBtn.focus();
  }

  function dismiss(el) {
    el.classList.add('cmp-hide');
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 400);
  }

  // ---------- 4. Region detection -> show only when needed ----------
  function detectRegionThenShow() {
    var done = false;
    function show() { if (!done) { done = true; showBanner(); } }
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); show(); }, 2000); // safe fallback: show if geo is slow/unavailable
    fetch('https://get.geojs.io/v1/ip/country.json', { signal: ctrl.signal, cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        clearTimeout(t);
        var cc = (d.country_code || d.country || '').toUpperCase();
        if (EEA_REGIONS.indexOf(cc) !== -1) show();
        // Non-EEA: default already granted by the region rule -> no banner.
      })
      .catch(function () { clearTimeout(t); show(); }); // geo failed -> be safe, show banner
  }

  // ---------- 5. Boot ----------
  function boot() {
    if (fundingChoicesActive()) return; // Google's certified CMP handles consent
    var stored = readStored();
    if (stored) { applyConsent(stored); return; }
    detectRegionThenShow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-render banner if the user switches language while it is open.
  document.addEventListener('localeChanged', function () {
    var b = document.getElementById('cmp-banner');
    if (b) { var p = b.parentNode; if (p) p.removeChild(b); showBanner(); }
  });

  // If Funding Choices activates slightly after this script, remove our banner.
  setTimeout(function () {
    if (fundingChoicesActive()) {
      var b = document.getElementById('cmp-banner');
      if (b && b.parentNode) b.parentNode.removeChild(b);
    }
  }, 2500);
})();
