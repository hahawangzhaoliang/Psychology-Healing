/**
 * 后台管理 API 路由（Vercel Blob 版）
 * 数据源：Vercel Blob（data/*.json + media/*）
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const blobStore = require('../services/blobStore');
const jsonStore = require('../services/jsonStore');

// 配置 multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

// ─── 管理员令牌校验 ───────────────────────────────────────

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

/**
 * 验证管理员令牌中间件
 * 支持：X-Admin-Token 请求头、Authorization: Bearer <token>、请求体 token
 */
function verifyToken(req, res, next) {
    // 开发环境：未设置 ADMIN_TOKEN 时跳过校验
    if (!ADMIN_TOKEN) {
        console.log('[Admin] ⚠️ ADMIN_TOKEN 未设置，跳过校验（开发环境）');
        return next();
    }

    const token = req.headers['x-admin-token']
        || (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
        || req.body?.token
        || req.query?.token;

    if (!token || token.trim() !== ADMIN_TOKEN.trim()) {
        return res.status(401).json({
            success: false,
            error: '未授权：令牌无效',
            code: 'INVALID_TOKEN',
        });
    }

    next();
}

router.post('/login', (req, res) => {
    const token = req.body.token;

    // 如果设置了 ADMIN_TOKEN，则校验令牌
    if (ADMIN_TOKEN && token && token.trim() === ADMIN_TOKEN.trim()) {
        return res.json({
            success: true,
            message: '登录成功'
        });
    }

    // 未设置 ADMIN_TOKEN 时，任何非空令牌都允许
    if (!ADMIN_TOKEN && token && token.trim()) {
        return res.json({
            success: true,
            message: '登录成功（开发模式，未校验）'
        });
    }

    return res.status(401).json({
        success: false,
        error: '请输入令牌',
        code: 'NO_TOKEN',
    });
});

// ─── 需要鉴权的路由 ──────────────────────────────────────
// 除 /login 外，所有路由都需要 token
router.use(verifyToken);

// ─── 数据接口 ────────────────────────────────────────────

// 获取统计数据
router.get('/stats', async (req, res) => {
    try {
        const stats = await jsonStore.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取所有集合信息
router.get('/collections', async (req, res) => {
    try {
        const collections = await jsonStore.listCollections();
        res.json({ success: true, data: collections });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取指定集合数据（兼容 /data/:collection 路径）
router.get('/data/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await jsonStore.paginate(collection, { page, limit });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取单条记录
router.get('/data/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const record = await jsonStore.findById(collection, id);
        if (!record) {
            return res.status(404).json({ success: false, error: '记录不存在' });
        }
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建记录
router.post('/data/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const record = await jsonStore.insert(collection, req.body);
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新记录
router.put('/data/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const record = await jsonStore.update(collection, id, req.body);
        if (!record) {
            return res.status(404).json({ success: false, error: '记录不存在' });
        }
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 删除记录
router.delete('/data/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const success = await jsonStore.remove(collection, id);
        if (!success) {
            return res.status(404).json({ success: false, error: '记录不存在' });
        }
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 批量删除
router.post('/data/:collection/batch-delete', async (req, res) => {
    try {
        const { collection } = req.params;
        const { ids } = req.body;

        if (ids && ids.includes('__clear_all__')) {
            // 清空集合
            await jsonStore.writeData(collection, []);
            return res.json({ success: true, message: '集合已清空' });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: '请提供要删除的 ID 列表' });
        }

        await jsonStore.removeMany(collection, ids);
        res.json({ success: true, message: `已删除 ${ids.length} 条记录` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 保留旧路径兼容性
router.get('/collections/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const data = await jsonStore.readData(collection);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/collections/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const data = req.body;
        await jsonStore.writeData(collection, data);
        res.json({ success: true, message: '保存成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── 媒体文件接口 ────────────────────────────────────────

// 获取媒体列表
router.get('/media/list', async (req, res) => {
    try {
        const result = await blobStore.listMedia();
        res.json({ 
            success: true, 
            data: { 
                images: result.blobs.filter(b => b.pathname.includes('images')).map(b => b.pathname.split('/').pop()),
                audio: result.blobs.filter(b => b.pathname.includes('audio')).map(b => b.pathname.split('/').pop())
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 上传媒体文件
router.post('/media/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '未选择文件' });
        }

        const file = req.file;
        const ext = file.originalname.split('.').pop().toLowerCase();
        const isImage = /^(jpg|jpeg|png|gif|webp)$/.test(ext);
        const isAudio = /^(mp3|wav|ogg|m4a)$/.test(ext);

        let result;
        if (isImage) {
            result = await blobStore.uploadImage(file.buffer, file.originalname, file.mimetype);
        } else if (isAudio) {
            result = await blobStore.uploadAudio(file.buffer, file.originalname, file.mimetype);
        } else {
            return res.status(400).json({ success: false, error: '不支持的文件类型' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 删除媒体文件
router.delete('/media/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        const pathname = type === 'images' 
            ? `media/images/${decodeURIComponent(filename)}`
            : `media/audio/${decodeURIComponent(filename)}`;
        
        await blobStore.deleteMedia(pathname);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── Blob 状态检查 ───────────────────────────────────────

router.get('/blob-status', async (req, res) => {
    try {
        const result = await blobStore.checkBlobConnection();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── 数据初始化 ─────────────────────────────────────────

router.post('/init-data', async (req, res) => {
    const fs = require('fs');
    const path = require('path');

    const dataFiles = [
        { local: 'exercises.json', collection: 'exercises' },
        { local: 'knowledge.json', collection: 'knowledge' },
        { local: 'regulation.json', collection: 'regulation' },
        { local: 'tips.json', collection: 'tips' },
    ];

    const results = [];
    const dataDir = path.join(__dirname, '../data');

    for (const { local } of dataFiles) {
        const localPath = path.join(dataDir, local);
        try {
            if (!fs.existsSync(localPath)) {
                results.push({ file: local, status: 'skipped', message: '本地文件不存在' });
                continue;
            }

            const content = fs.readFileSync(localPath, 'utf-8');
            const data = JSON.parse(content);

            await jsonStore.writeData(local.replace('.json', ''), data);
            results.push({
                file: local,
                status: 'success',
                message: `上传成功，${Array.isArray(data) ? data.length : 0} 条记录`,
            });
        } catch (error) {
            results.push({ file: local, status: 'error', message: error.message });
        }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    res.json({
        success: true,
        message: `初始化完成：${successCount}/${dataFiles.length} 个文件成功`,
        results,
    });
});

// ─── 爬虫接口（占位，防止 404）────────────────────────────

router.post('/crawl', async (req, res) => {
    res.json({ success: true, message: '爬虫功能暂未实现', data: [] });
});

router.post('/crawl/import', async (req, res) => {
    res.json({ success: true, message: '导入功能暂未实现', imported: 0 });
});

// ─── 数据导出 ────────────────────────────────────────────

router.get('/export', async (req, res) => {
    try {
        const data = await jsonStore.exportAll();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── 数据导入（完全覆盖）─────────────────────────────────

router.post('/import', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ success: false, error: '数据格式错误' });
        }

        const results = [];
        for (const [collection, items] of Object.entries(data)) {
            if (Array.isArray(items)) {
                await jsonStore.writeData(collection, items);
                results.push({ collection, count: items.length });
            }
        }

        res.json({ success: true, message: `导入完成，更新了 ${results.length} 个集合`, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
