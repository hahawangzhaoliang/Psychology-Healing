/**
 * 心晴空间 - 轻量匿名行为埋点（P0）
 *
 * 设计原则（隐私优先）：
 * - 不采集任何个人信息：无 Cookie、无 IP、无 User-Agent、无设备指纹
 * - 仅统计事件类型 + 页面路径，用于验证「聚焦三入口」等产品假设
 * - localStorage 队列缓冲，批量上报，失败自动重试
 *
 * 用法：
 *   Analytics.track('emotion_diary_complete');
 *   Analytics.track('relax_practice_complete', { practice: 'breathing' });
 *
 * 事件类型（与后端白名单一致）：
 *   page_view / emotion_diary_complete / relax_practice_complete / help_nav_click
 */
(function () {
  'use strict';

  var QUEUE_KEY = 'xinqing_analytics_queue';
  var MAX_QUEUE = 200;          // 队列上限，防止 localStorage 膨胀
  var ENDPOINT = '/api/analytics/events';
  var FLUSH_INTERVAL = 10000;   // 10 秒批量上报

  function loadQueue() {
    try {
      var raw = localStorage.getItem(QUEUE_KEY);
      var q = raw ? JSON.parse(raw) : [];
      return Array.isArray(q) ? q : [];
    } catch (e) {
      return [];
    }
  }

  function saveQueue(q) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) { /* localStorage 不可用时静默降级 */ }
  }

  function requeue(q) {
    if (!q || !q.length) return;
    var cur = loadQueue();
    saveQueue(q.concat(cur).slice(-MAX_QUEUE));
  }

  function post(payload) {
    var ok = false;
    try {
      if (navigator.sendBeacon) {
        ok = navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
      }
    } catch (e) { /* fall through to XHR */ }
    if (ok) return true;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function () {
        if (xhr.status >= 400) requeue(JSON.parse(payload).events);
      };
      xhr.onerror = function () { requeue(JSON.parse(payload).events); };
      xhr.send(payload);
      return true;
    } catch (e) {
      requeue(JSON.parse(payload).events);
      return false;
    }
  }

  var Analytics = {
    /** 记录一个事件（仅入队，由 flush 批量上报） */
    track: function (type, props) {
      if (!type) return;
      // 尊重用户「不追踪」偏好
      try {
        if (navigator.doNotTrack === '1' || localStorage.getItem('xinqing_analytics_off') === '1') return;
      } catch (e) { /* ignore */ }

      var page = '';
      try {
        page = (typeof location !== 'undefined' ? location.pathname : '') || '';
      } catch (e) { /* ignore */ }

      var q = loadQueue();
      q.push({
        t: String(type).slice(0, 64),
        p: page,
        x: (props && typeof props === 'object') ? props : {},
        ts: Date.now()
      });
      if (q.length > MAX_QUEUE) q = q.slice(-MAX_QUEUE);
      saveQueue(q);
    },

    /** 立即批量上报队列（成功清空，失败保留） */
    flush: function () {
      var q = loadQueue();
      if (!q.length) return;
      saveQueue([]); // 先清空，防止并发重复上报
      var payload = JSON.stringify({ events: q });
      post(payload);
    }
  };

  // 自动上报：页面加载后、每 10 秒、离开页面前
  if (typeof window !== 'undefined') {
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('load', function () {
        setTimeout(function () { Analytics.flush(); }, 2000);
      });
      window.addEventListener('beforeunload', function () { Analytics.flush(); });
      window.addEventListener('pagehide', function () { Analytics.flush(); });
      window.setInterval(function () { Analytics.flush(); }, FLUSH_INTERVAL);
    }
  }

  window.Analytics = Analytics;
})();
