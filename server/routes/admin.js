/**
 * 后台管理 API 路由
 * 所有接口均需管理员鉴权（requireAdmin）
 */

const express = require('express');
const router  = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
    insert, find, update, remove,
    paginate, count, insertMany, INDEX_NAMES
} = require('../config/upstash');
const { runCrawler } = require('../services/knowledgeService');

// ─── 管理员令牌校验（轻量登录接口）──────────────────────

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

    res.json({
        success: true,
        message: '登录成功',
        token: adminToken   // 前端存储后自行在请求中携带
    });
});

// ─── 对所有后续路由应用管理员鉴权 ───────────────────────
router.use(requireAdmin);

// ─── 获取所有集合名称 ───────────────────────────────────
router.get('/collections', (req, res) => {
    const collections = Object.entries(INDEX_NAMES).map(([key, indexName]) => ({
        key,
        indexName,
        displayName: getCollectionDisplayName(key)
    }));
    res.json({ success: true, data: collections });
});

// ─── 分页查询集合数据 ───────────────────────────────────
router.get('/data/:collection', async (req, res) => {
    const { collection } = req.params;
    if (!INDEX_NAMES[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort  = req.query.sort  || '';
    const order = req.query.order || 'desc';

    try {
        const result = await paginate(collection, {
            page,
            limit,
            sort: sort ? { [sort]: order } : undefined
        });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'QUERY_ERROR' });
    }
});

// ─── 获取单条记录 ───────────────────────────────────────
router.get('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    if (!INDEX_NAMES[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    // Upstash Search 不支持按 ID 直接获取，改为列表查询 + 过滤
    // 限制 200 条足够覆盖绝大多数场景
    try {
        const result = await paginate(collection, { page: 1, limit: 200 });
        const record = result.items.find(item => item.id === id || item._id === id);
        if (!record) {
            return res.status(404).json({ success: false, error: '记录不存在', code: 'NOT_FOUND' });
        }
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'QUERY_ERROR' });
    }
});

// ─── 新增记录 ───────────────────────────────────────────
router.post('/data/:collection', async (req, res) => {
    const { collection } = req.params;
    if (!INDEX_NAMES[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const record = await insert(collection, req.body);
        res.json({ success: true, message: '添加成功', data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'INSERT_ERROR' });
    }
});

// ─── 更新记录 ───────────────────────────────────────────
router.put('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    if (!INDEX_NAMES[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        await update(collection, { id }, req.body);
        // 更新后重新从列表中取出最新数据
        const result = await paginate(collection, { page: 1, limit: 200 });
        const updated = result.items.find(item => item.id === id || item._id === id);
        res.json({ success: true, message: '更新成功', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'UPDATE_ERROR' });
    }
});

// ─── 删除记录 ───────────────────────────────────────────
router.delete('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    if (!INDEX_NAMES[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        await remove(collection, { id });
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'DELETE_ERROR' });
    }
});

// ─── 批量删除 ───────────────────────────────────────────
router.post('/data/:collection/batch-delete', async (req, res) => {
    const { collection } = req.params;
    const { ids } = req.body;

    if (!INDEX_NAMES[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: '请提供要删除的记录ID列表', code: 'INVALID_INPUT' });
    }

    try {
        let deleted = 0;
        for (const id of ids) {
            await remove(collection, { id });
            deleted++;
        }
        res.json({ success: true, message: `成功删除 ${deleted} 条记录` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'BATCH_DELETE_ERROR' });
    }
});

// ─── 触发爬虫（返回结果，不自动入库）────────────────────
router.post('/crawl', async (req, res) => {
    const { source = 'all' } = req.body;

    try {
        console.log(`[Admin] 手动触发爬虫，来源: ${source}`);
        const results = await runCrawler(source);
        res.json({
            success: true,
            message: '爬取完成，请选择需要入库的数据',
            data: results,
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

// ─── 将爬虫结果导入数据库 ──────────────────────────────
router.post('/crawl/import', async (req, res) => {
    const { items, collection } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: '请提供要导入的数据', code: 'INVALID_INPUT' });
    }
    if (!INDEX_NAMES[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const records = items.map(item => {
            // 确保每条记录有合理的字段
            const now = new Date().toISOString();
            return {
                ...item,
                imported_at: now,
                source: item.source || 'admin-import'
            };
        });

        const inserted = await insertMany(collection, records);
        res.json({
            success: true,
            message: `成功导入 ${inserted.length} 条数据`,
            data: inserted
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'IMPORT_ERROR' });
    }
});

// ─── 集合统计信息 ───────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const stats = {};
        for (const key of Object.keys(INDEX_NAMES)) {
            stats[key] = await count(key);
        }
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'STATS_ERROR' });
    }
});

// ─── 辅助函数 ───────────────────────────────────────────

function getCollectionDisplayName(key) {
    const names = {
        emotionDiary:       '情绪日记',
        assessmentRecords:   '测评记录',
        feedback:           '用户反馈',
        visitStats:         '访问统计',
        healingExercises:   '疗愈练习',
        psychologyKnowledge:'心理学知识',
        emotionRegulation:  '情绪调节',
        dailyTips:          '每日提示',
        quickExercises:     '快速练习',
        knowledgeGraph:     '知识图谱',
        metadata:           '元数据'
    };
    return names[key] || key;
}

module.exports = router;
