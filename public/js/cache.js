/**
 * 全局 API 缓存模块
 * 所有页面共用，减少 Blob 请求次数
 * 
 * 使用方式：
 *   import { cachedFetch } from './cache.js';
 *   const data = await cachedFetch('/api/knowledge/graph');
 * 
 * 强制刷新：
 *   const data = await cachedFetch('/api/knowledge/graph', { bypassCache: true });
 */

const CACHE_TTL = 5 * 60 * 1000;  // 5 分钟
const CACHE_PREFIX = 'xq_cache_';

/**
 * 生成缓存 key（方法 + 路径）
 */
function getCacheKey(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    return CACHE_PREFIX + method + ':' + path;
}

/**
 * 读取缓存，自动检查过期
 * @returns {any|null} 缓存的数据，未命中或已过期返回 null
 */
function getCache(path, options = {}) {
    try {
        const key = getCacheKey(path, options);
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() - entry.ts > CACHE_TTL) {
            sessionStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

/**
 * 写入缓存
 */
function setCache(path, options = {}, data) {
    try {
        const key = getCacheKey(path, options);
        sessionStorage.setItem(key, JSON.stringify({
            ts: Date.now(),
            data
        }));
    } catch {
        // sessionStorage 满了，忽略
    }
}

/**
 * 清除缓存
 * @param {string} [pathPattern] - 正则模式，不传则清除全部
 */
function clearCache(pathPattern) {
    if (!pathPattern) {
        Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
        });
        return;
    }
    const regex = new RegExp(pathPattern);
    Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX) && regex.test(k)) {
            sessionStorage.removeItem(k);
        }
    });
}

/**
 * 带智能缓存的 fetch 封装
 * @param {string} path - API 路径（自动拼接 API_BASE）
 * @param {Object} [options] - fetch 选项
 * @param {boolean} [options.useCache=true] - 是否启用缓存（仅 GET）
 * @param {boolean} [options.bypassCache=false] - 是否绕过缓存
 * @returns {Promise<any>}
 */
async function cachedFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const useCache = options.useCache !== false && method === 'GET';
    const bypassCache = options.bypassCache === true;

    // 检查缓存
    if (useCache && !bypassCache) {
        const cached = getCache(path, options);
        if (cached) {
            console.log(`[缓存命中] GET ${path}`);
            return cached;
        }
    }

    // 实际请求
    const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : '/api';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

        // 写入缓存（仅 GET）
        if (useCache) {
            setCache(path, options, data);
            console.log(`[缓存写入] GET ${path}`);
        }

        return data;
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error('请求超时（15秒），请检查网络或 Blob 存储状态');
        throw e;
    }
}

// 导出（兼容普通 script 标签和 ES module）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCache, setCache, clearCache, cachedFetch };
} else {
    window.Cache = { getCache, setCache, clearCache, cachedFetch };
}
