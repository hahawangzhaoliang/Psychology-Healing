/**
 * 后台管理 API 路由
 * 数据源：本地 JSON 文件（server/data/*.json）
 * 所有接口均需管理员鉴权（requireAdmin）
 */

const express = require('express');
const router  = express.Router();
const { requireAdmin } = require('../middleware/auth');
const jsonStore = require('../services/jsonStore');

// ─── 管理员令牌校验 ─────────────────────────────────────────

router.post('/login', (req, res) => {
    const { token } = req.body;
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken || adminToken === 'your-admin-token') {
        return res.status(500).json({
            success: false,
            error: '服务器未配置 ADMIN_TOKEN',
            code: 'CONFIG_ERROR'
        });
    }

    if (token !== adminToken) {
        return res.status(401).json({
            success: false,
            error: '令牌无效',
            code: 'INVALID_TOKEN'
        });
    }

    res.json({ success: true, message: '登录成功', token: adminToken });
});

// ─── 后续路由鉴权 ───────────────────────────────────────────

router.use(requireAdmin);

// ─── 获取所有集合信息 ───────────────────────────────────────

router.get('/collections', (req, res) => {
    const collections = Object.entries(jsonStore.COLLECTION_MAP).map(([key, info]) => ({
        key,
        fileName: info.file,
        upstashName: info.upstash,
        displayName: info.display,
        count: jsonStore.count(key)
    }));
    res.json({ success: true, data: collections });
});

// ─── 分页查询集合数据 ───────────────────────────────────────

router.get('/data/:collection', (req, res) => {
    const { collection } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort  = req.query.sort  || '';
    const order = req.query.order || 'desc';

    try {
        const result = jsonStore.paginate(collection, { page, limit, sort, order });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'QUERY_ERROR' });
    }
});

// ─── 获取单条记录 ───────────────────────────────────────────

router.get('/data/:collection/:id', (req, res) => {
    const { collection, id } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    const record = jsonStore.findById(collection, id);
    if (!record) {
        return res.status(404).json({ success: false, error: '记录不存在', code: 'NOT_FOUND' });
    }
    res.json({ success: true, data: record });
});

// ─── 新增记录 ───────────────────────────────────────────────

router.post('/data/:collection', (req, res) => {
    const { collection } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const record = jsonStore.insert(collection, req.body);
        res.json({ success: true, message: '添加成功', data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'INSERT_ERROR' });
    }
});

// ─── 更新记录 ───────────────────────────────────────────────

router.put('/data/:collection/:id', (req, res) => {
    const { collection, id } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const updated = jsonStore.update(collection, id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, error: '记录不存在', code: 'NOT_FOUND' });
        }
        res.json({ success: true, message: '更新成功', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'UPDATE_ERROR' });
    }
});

// ─── 删除记录 ───────────────────────────────────────────────

router.delete('/data/:collection/:id', (req, res) => {
    const { collection, id } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    const removed = jsonStore.remove(collection, id);
    if (!removed) {
        return res.status(404).json({ success: false, error: '记录不存在', code: 'NOT_FOUND' });
    }
    res.json({ success: true, message: '删除成功' });
});

// ─── 批量删除 ───────────────────────────────────────────────

router.post('/data/:collection/batch-delete', (req, res) => {
    const { collection } = req.params;
    const { ids } = req.body;

    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: '请提供要删除的记录ID列表', code: 'INVALID_INPUT' });
    }

    jsonStore.removeMany(collection, ids);
    res.json({ success: true, message: `成功删除 ${ids.length} 条记录` });
});

// ─── 触发爬虫（结果写入 JSON）────────────────────────────────

router.post('/crawl', async (req, res) => {
    const { source = 'all' } = req.body;

    try {
        const { runCrawler } = require('../services/knowledgeService');
        console.log(`[Admin] 手动触发爬虫，来源: ${source}`);

        const results = await runCrawler(source);

        // 为每条标记是否已存在（与现有 JSON 数据比对）
        const markDuplicates = (items, collection) => {
            const existing = jsonStore.readData(collection);
            const existingTitles = new Set(existing.map(item => item.title?.trim()));
            const existingUrls = new Set(existing.map(item => item.sourceUrl || item.url || ''));

            return items.map(item => {
                const title = item.title?.trim() || '';
                const url = item.sourceUrl || item.url || '';
                const isDuplicate = existingTitles.has(title) || (url && existingUrls.has(url));
                return {
                    ...item,
                    _duplicate: isDuplicate,
                    _duplicateReason: existingTitles.has(title) ? '标题重复' : (existingUrls.has(url) ? 'URL重复' : ''),
                    _collection: collection
                };
            });
        };

        res.json({
            success: true,
            message: '爬取完成，请选择需要入库的数据',
            data: {
                exercises: markDuplicates(results.exercises || [], 'exercises'),
                knowledge: markDuplicates(results.knowledge || [], 'knowledge'),
                tips:      markDuplicates(results.tips || [], 'tips')
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Admin] 爬虫失败:', error);
        res.status(500).json({
            success: false,
            error: '爬取失败：' + error.message,
            code: 'CRAWL_ERROR'
        });
    }
});

// ─── 将爬虫结果导入 JSON ────────────────────────────────────

router.post('/crawl/import', (req, res) => {
    const { items, collection } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: '请提供要导入的数据', code: 'INVALID_INPUT' });
    }
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const now = new Date().toISOString();
        const records = items.map(item => ({
            ...item,
            imported_at: now,
            source: item.source || 'admin-import'
        }));

        const inserted = jsonStore.insertMany(collection, records);
        res.json({
            success: true,
            message: `成功导入 ${inserted.length} 条数据`,
            data: inserted
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'IMPORT_ERROR' });
    }
});

// ─── 集合统计 ───────────────────────────────────────────────

router.get('/stats', (req, res) => {
    const stats = {};
    for (const key of Object.keys(jsonStore.COLLECTION_MAP)) {
        stats[key] = jsonStore.count(key);
    }
    res.json({ success: true, data: stats });
});

// ─── 导出全部数据为 JSON ────────────────────────────────────

router.get('/export', (req, res) => {
    try {
        const data = jsonStore.exportAll();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=knowledge-data.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'EXPORT_ERROR' });
    }
});

// ─── 导入 JSON（覆盖现有数据）────────────────────────────────

router.post('/import', (req, res) => {
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, error: '请提供有效的 JSON 数据', code: 'INVALID_INPUT' });
    }

    try {
        const results = [];
        for (const [collection, items] of Object.entries(data)) {
            if (Array.isArray(items) && jsonStore.COLLECTION_MAP[collection]) {
                jsonStore.writeData(collection, items);
                results.push({ collection, count: items.length });
            }
        }
        res.json({ success: true, message: '导入成功', data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'IMPORT_ERROR' });
    }
});

module.exports = router;
