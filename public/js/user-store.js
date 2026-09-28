/**
 * 心晴空间 - 轻量本地用户体系（P2）
 *
 * 设计原则：
 * - 无账号、无后端：仅用 localStorage 建立「本地档案」概念，隔离用户数据
 * - 用户数据键统一前缀：xinqing:{uid}:{key}
 * - 自动迁移旧版全局键（emotionRecords/cbtRecords/... ）到当前档案作用域，不丢数据
 * - 全站页面只需把数据读写从 localStorage 换成 UserStore.get/set
 *
 * 用法：
 *   UserStore.get('emotionRecords')   // 读当前档案数据（无则 null，与 getItem 同语义）
 *   UserStore.set('relaxRecords', str) // 写当前档案数据
 *   UserStore.profile()               // { uid, name, emoji, createdAt }
 *   UserStore.newProfile()            // 新建档案（生成新 uid；旧数据保留在原档案名下）
 *
 * 加载即执行：ensureProfile() + migrateLegacy()，保证页面脚本运行时数据已就绪。
 */
(function () {
  'use strict';

  var PREFIX = 'xinqing:';
  var PROFILE_KEY = 'xinqing_profile';
  var LEGACY_KEYS = [
    'emotionRecords', 'cbtRecords', 'relaxRecords',
    'assessmentResults', 'communityPosts', 'checkins',
    'flow-records', 'userRoles'
  ];
  var MIGRATED_FLAG_PREFIX = 'xinqing_migrated:';

  // ---------- 工具 ----------
  function genUid() {
    var s = '';
    var chars = '0123456789abcdef';
    for (var i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * 16)];
    return s;
  }

  function tryParse(str, fallback) {
    try { return str ? JSON.parse(str) : fallback; } catch (e) { return fallback; }
  }

  // ---------- 匿名埋点辅助（Analytics 未就绪时入队等待，对齐 analytics.js 队列结构） ----------
  function emitAnalytics(type) {
    try {
      if (window.Analytics && window.Analytics.track) { window.Analytics.track(type); return; }
      var q = tryParse(localStorage.getItem('xinqing_analytics_queue'), []);
      if (!Array.isArray(q)) q = [];
      q.push({ t: type, p: (typeof location !== 'undefined' ? location.pathname : '') || '', x: {}, ts: Date.now() });
      localStorage.setItem('xinqing_analytics_queue', JSON.stringify(q.slice(-200)));
    } catch (e) { /* ignore */ }
  }

  // ---------- 档案 ----------
  function ensureProfile() {
    var saved = tryParse(localStorage.getItem(PROFILE_KEY), null);
    if (saved && saved.uid) return saved;
    // 创建新档案
    var profile = {
      uid: genUid(),
      name: '微光旅人',
      emoji: '🌟',
      createdAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      // 埋点：档案初始化（匿名，仅计数；Analytics 未就绪则入队）
      emitAnalytics('user_profile_init');
    } catch (e) { /* ignore */ }
    return profile;
  }

  // ---------- 旧数据迁移（幂等） ----------
  function migrateLegacy(uid) {
    var migrated = localStorage.getItem(MIGRATED_FLAG_PREFIX + uid);
    if (migrated === '1') return;
    var moved = false;
    LEGACY_KEYS.forEach(function (key) {
      var raw = localStorage.getItem(key);
      if (raw !== null) {
        // 只在目标键不存在时并入，避免覆盖已有用户数据
        var target = PREFIX + uid + ':' + key;
        if (localStorage.getItem(target) === null) {
          localStorage.setItem(target, raw);
          moved = true;
        }
      }
    });
    try { localStorage.setItem(MIGRATED_FLAG_PREFIX + uid, '1'); } catch (e) { /* ignore */ }
    // 迁移日志（便于调试，不落任何个人信息）
    if (moved) console.log('[UserStore] 已迁移旧版本地数据到当前档案', uid.slice(0, 4) + '...');
  }

  // ---------- 公开 API ----------
  var UserStore = {
    /** 当前档案 */
    profile: function () { return ensureProfile(); },
    /** 读取用户数据（与 localStorage.getItem 同语义，无则 null） */
    get: function (key) {
      var uid = ensureProfile().uid;
      return localStorage.getItem(PREFIX + uid + ':' + key);
    },
    /** 写入用户数据 */
    set: function (key, value) {
      var uid = ensureProfile().uid;
      try { localStorage.setItem(PREFIX + uid + ':' + key, value); } catch (e) { /* ignore */ }
    },
    /** 删除用户数据 */
    remove: function (key) {
      var uid = ensureProfile().uid;
      try { localStorage.removeItem(PREFIX + uid + ':' + key); } catch (e) { /* ignore */ }
    },
    /** 新建档案（生成新 uid；旧数据保留在原档案名下，不会丢失） */
    newProfile: function () {
      var profile = {
        uid: genUid(),
        name: '微光旅人',
        emoji: '🌟',
        createdAt: new Date().toISOString()
      };
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
      emitAnalytics('user_profile_init');
      return profile;
    },
    /** 手动触发旧数据迁移（幂等；正常情况下加载即自动执行） */
    migrateLegacy: function () {
      migrateLegacy(ensureProfile().uid);
    }
  };

  // ---------- 加载即执行 ----------
  try {
    var profile = ensureProfile();
    migrateLegacy(profile.uid);
  } catch (e) { /* localStorage 不可用时静默降级 */ }

  window.UserStore = UserStore;
})();
