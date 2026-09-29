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
  var PROFILES_KEY = 'xinqing_profiles'; // 档案元信息库 { uid: {name, emoji, createdAt} }
  var DATA_KEYS_FOR_COUNT = ['emotionRecords', 'cbtRecords', 'relaxRecords', 'assessmentResults', 'communityPosts', 'checkins', 'flow-records', 'userRoles'];

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

  // ---------- 档案元信息库 ----------
  function readProfilesMap() {
    var m = tryParse(localStorage.getItem(PROFILES_KEY), {});
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
  }
  function saveProfileMeta(profile) {
    if (!profile || !profile.uid) return;
    try {
      var m = readProfilesMap();
      m[profile.uid] = {
        name: profile.name || '微光旅人',
        emoji: profile.emoji || '🌟',
        createdAt: profile.createdAt || new Date().toISOString()
      };
      localStorage.setItem(PROFILES_KEY, JSON.stringify(m));
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
      saveProfileMeta(profile);
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
      // 先把当前档案元信息入库（避免新建后旧档案信息丢失）
      saveProfileMeta(ensureProfile());
      var profile = {
        uid: genUid(),
        name: '微光旅人',
        emoji: '🌟',
        createdAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        saveProfileMeta(profile);
      } catch (e) { /* ignore */ }
      emitAnalytics('user_profile_init');
      return profile;
    },
    /** 列出本机全部档案（含元信息 + 数据条数概览） */
    listProfiles: function () {
      var map = readProfilesMap();
      var uidSet = {};
      // 当前档案兜底
      var cur = tryParse(localStorage.getItem(PROFILE_KEY), null);
      if (cur && cur.uid) uidSet[cur.uid] = true;
      // 元信息库中的档案（即使暂无数据也要列出，保证档案列表完整）
      Object.keys(map).forEach(function (uid) { if (uid) uidSet[uid] = true; });
      // 扫描数据键前缀收集所有 uid
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i) || '';
          if (k.indexOf(PREFIX) === 0) {
            var uid = k.slice(PREFIX.length).split(':')[0];
            if (uid) uidSet[uid] = true;
          }
        }
      } catch (e) { /* ignore */ }
      var out = [];
      Object.keys(uidSet).forEach(function (uid) {
        var meta = map[uid] || {};
        var count = 0;
        DATA_KEYS_FOR_COUNT.forEach(function (dk) {
          try {
            var raw = localStorage.getItem(PREFIX + uid + ':' + dk);
            if (!raw) return;
            var arr = tryParse(raw, null);
            if (Array.isArray(arr)) count += arr.length;
          } catch (e) { /* ignore */ }
        });
        out.push({
          uid: uid,
          name: meta.name || '微光旅人',
          emoji: meta.emoji || '🌟',
          createdAt: meta.createdAt || null,
          recordCount: count
        });
      });
      return out;
    },
    /** 切换到指定档案（当前档案指针切换，数据天然按 uid 隔离） */
    switchProfile: function (uid) {
      if (!uid) return false;
      var cur = tryParse(localStorage.getItem(PROFILE_KEY), null);
      if (cur && cur.uid === uid) return false;
      var map = readProfilesMap();
      var meta = map[uid];
      var profile = {
        uid: uid,
        name: meta ? meta.name : '微光旅人',
        emoji: meta ? meta.emoji : '🌟',
        createdAt: meta ? meta.createdAt : new Date().toISOString()
      };
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) { /* ignore */ }
      emitAnalytics('profile_switch');
      return true;
    },
    /** 更新当前档案昵称/头像 */
    updateProfile: function (name, emoji) {
      var cur = ensureProfile();
      if (name !== undefined && name !== null && name.trim() !== '') cur.name = name.trim().slice(0, 20);
      if (emoji !== undefined && emoji !== null && emoji.trim() !== '') cur.emoji = emoji.trim();
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(cur));
        saveProfileMeta(cur);
      } catch (e) { /* ignore */ }
      emitAnalytics('profile_update');
      return cur;
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
