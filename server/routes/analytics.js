/**
 * 轻量匿名行为埋点路由（P0）
 *
 * 设计说明：
 * - 事件按「日期 + 类型 + 页面」聚合成计数，写入 Vercel Blob（jsonStore）
 * - 不接收、不存储任何个人身份信息（无 IP / UA / Cookie 落盘）
 * - 前端 localStorage 队列 10s 批量上报，此处幂等聚合
 * - 并发说明：Serverless 多实例下 read-modify-write 存在理论竞态，
 *   公益项目初期流量下可接受；后续可迁移到 Redis 原子计数（P1）
 *
 * 端点：
 *   POST /api/analytics/events  上报事件（批量）
 *   GET  /api/analytics/summary 聚合概览（管理员，近 30 天）
 */

const express = require('express');
const router = express.Router();
const jsonStore = require('../services/jsonStore');
const blobStore = require('../services/blobStore');
const { requireAdmin } = require('../middleware/auth');

// 事件类型白名单（与前端 analytics.js 保持一致）
const ALLOWED_TYPES = new Set([
    'page_view',
    'emotion_diary_complete',
    'relax_practice_complete',
    'help_nav_click',
    'cbt_thought_record',
    'assessment_start',
    'assessment_complete',
    'first_aid_view',
    'first_aid_method_open',
    'community_ttm_reco',
    'community_ttm_reco_click',
    'user_profile_init',
]);

const MAX_EVENTS_PER_REQUEST = 200;
const WRITE_TIMEOUT_MS = 8000;

/**
 * POST /api/analytics/events
 * body: { events: [{ t: 'page_view', p: '/index.html', x: {...}, ts: 123 }] }
 */
router.post('/events', async (req, res) => {
    try {
        const body = req.body || {};
        const events = Array.isArray(body.events) ? body.events : [];
        if (!events.length) {
            return res.status(400).json({ success: false, error: '缺少事件', code: 'MISSING_EVENTS' });
        }

        // 过滤白名单 + 字段清洗
        const clean = events
            .filter(e => e && typeof e.t === 'string' && ALLOWED_TYPES.has(e.t))
            .slice(0, MAX_EVENTS_PER_REQUEST);

        if (!clean.length) {
            return res.json({ success: true, received: 0 });
        }

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const collection = 'analytics-' + date; // -> analytics-2026-09-24.json

        // 读取当日聚合（数组结构 [{ key, type, page, count, date }]）
        let daily = [];
        try {
            daily = await jsonStore.readData(collection);
        } catch (e) {
            daily = []; // 首日或读失败时从空开始
        }
        if (!Array.isArray(daily)) daily = [];

        const counts = {};
        daily.forEach(row => {
            if (row && row.key) counts[row.key] = Number(row.count) || 0;
        });

        clean.forEach(e => {
            let page = String(e.p || '').replace(/\\/g, '/');
            page = page.split('/').pop() || 'unknown';
            if (!page || page === '') page = 'unknown';
            const key = `${e.t}:${page}`;
            counts[key] = (counts[key] || 0) + 1;
        });

        const rows = Object.keys(counts).map(k => {
            const sep = k.indexOf(':');
            return {
                key: k,
                type: k.slice(0, sep),
                page: k.slice(sep + 1),
                count: counts[k],
                date,
            };
        }).sort((a, b) => a.key.localeCompare(b.key));

        // 写入带超时兜底：存储慢/不可用时快速响应，避免前端挂起
        try {
            await withTimeout(jsonStore.writeData(collection, rows), WRITE_TIMEOUT_MS);
        } catch (writeErr) {
            console.warn('[Analytics] 当日聚合写入超时/失败（事件已接收）:', writeErr.message);
            return res.status(202).json({ success: true, received: clean.length, persisted: false });
        }

        res.json({ success: true, received: clean.length, persisted: true });
    } catch (error) {
        console.error('[Analytics] 事件写入失败:', error.message);
        res.status(500).json({ success: false, error: '埋点写入失败', code: 'ANALYTICS_ERROR' });
    }
});

/** Promise 限时：超时抛错，防止外部存储慢拖垮接口 */
function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('存储写入超时(' + ms + 'ms)'));
        }, ms);
        promise.then(
            v => { clearTimeout(timer); resolve(v); },
            e => { clearTimeout(timer); reject(e); }
        );
    });
}

/**
 * GET /api/analytics/summary?adminToken=xxx
 * 返回近 30 天聚合计数（供后续看板使用）
 */
router.get('/summary', requireAdmin, async (req, res) => {
    try {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push('analytics-' + d.toISOString().split('T')[0]);
        }

        // 直读 Blob + 并行：绕过 Redis 缓存层，避免 30 天串行超时累积
        const totals = {};
        await Promise.all(days.map(async (collection) => {
            try {
                const rows = await blobStore.readJsonFromBlob(collection + '.json');
                if (!Array.isArray(rows)) return; // 该日无数据
                rows.forEach(row => {
                    if (!row || !row.key) return;
                    totals[row.key] = (totals[row.key] || 0) + (Number(row.count) || 0);
                });
            } catch (e) {
                // 单日读取失败跳过，不影响其余日期
            }
        }));

        const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
        res.json({ success: true, data: { totals, grandTotal, days: days.length } });
    } catch (error) {
        console.error('[Analytics] 概览读取失败:', error.message);
        res.status(500).json({ success: false, error: '埋点概览读取失败', code: 'ANALYTICS_SUMMARY_ERROR' });
    }
});

module.exports = router;
