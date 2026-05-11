/**
 * 后台管理 API 路由（Vercel Blob 版）
 * 数据源：Vercel Blob（data/*.json + media/*）
 * 所有接口均需管理员鉴权（requireAdmin）
 */

const express = require('express');
const router  = express.Router();
const multer = require('multer'); // 用于处理 multipart/form-data
const blobStore = require('../services/blobStore');
const jsonStore = require('../services/jsonStore');

// 配置 multer（内存存储，用于文件上传）
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 限制
    fileFilter: (req, file, cb) => {
        // 允许图片和音频
        const allowed = /image\/(jpeg|png|gif|webp)|audio\/(mpeg|wav|ogg|mp4)/;
        if (allowed.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型，仅支持图片（JPEG/PNG/GIF/WebP）和音频（MP3/WAV/OGG）'));
        }
    },
});

// ─── 管理员令牌校验 ─────────────────────────────────────────

router.post('/login', (req, res) => {
    const { token } = req.body;
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken || adminToken === 'your-admin-token') {
        return res.status(500).json({
            success: false,
            error: '服务器未配置 ADMIN_TOKEN',
            code: 'CONFIG_ERROR',
        });
    }

    if (token !== adminToken) {
        return res.status(401).json({
            success: false,
            error: '令牌无效',
            code: 'INVALID_TOKEN',
        });
    }

    res.json({ success: true, message: '登录成功', token: adminToken });
});

// ─── 后续路由鉴权 ───────────────────────────────────────────

router.use(require('../middleware/auth').requireAdmin);

// ─── 获取所有集合信息 ───────────────────────────────────────

router.get('/collections', async (req, res) => {
    try {
        const collections = await jsonStore.listCollections();
        res.json({ success: true, data: collections });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'COLLECTION_ERROR' });
    }
});

// ─── 分页查询集合数据 ───────────────────────────────────────

router.get('/data/:collection', async (req, res) => {
    const { collection } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort  = req.query.sort  || '';
    const order = req.query.order || 'desc';

    try {
        const result = await jsonStore.paginate(collection, { page, limit, sort, order });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'QUERY_ERROR' });
    }
});

// ─── 获取单条记录 ───────────────────────────────────────────

router.get('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const record = await jsonStore.findById(collection, id);
        if (!record) {
            return res.status(404).json({ success: false, error: '记录不存在', code: 'NOT_FOUND' });
        }
        res.json({ success: true, data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'QUERY_ERROR' });
    }
});

// ─── 新增记录 ───────────────────────────────────────────────

router.post('/data/:collection', async (req, res) => {
    const { collection } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const record = await jsonStore.insert(collection, req.body);
        res.json({ success: true, message: '添加成功', data: record });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'INSERT_ERROR' });
    }
});

// ─── 更新记录 ───────────────────────────────────────────────

router.put('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const updated = await jsonStore.update(collection, id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, error: '记录不存在', code: 'NOT_FOUND' });
        }
        res.json({ success: true, message: '更新成功', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'UPDATE_ERROR' });
    }
});

// ─── 删除记录 ───────────────────────────────────────────────

router.delete('/data/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }

    try {
        const removed = await jsonStore.remove(collection, id);
        if (!removed) {
            return res.status(404).json({ success: false, error: '记录不存在', code: 'NOT_FOUND' });
        }
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'DELETE_ERROR' });
    }
});

// ─── 批量删除 ───────────────────────────────────────────────

router.post('/data/:collection/batch-delete', async (req, res) => {
    const { collection } = req.params;
    const { ids } = req.body;

    if (!jsonStore.COLLECTION_MAP[collection]) {
        return res.status(400).json({ success: false, error: '未知集合', code: 'UNKNOWN_COLLECTION' });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: '请提供要删除的记录ID列表', code: 'INVALID_INPUT' });
    }

    try {
        await jsonStore.removeMany(collection, ids);
        res.json({ success: true, message: `成功删除 ${ids.length} 条记录` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'DELETE_ERROR' });
    }
});

// ─── 触发爬虫（结果写入 Blob）────────────────────────────────

router.post('/crawl', async (req, res) => {
    const { source = 'all' } = req.body;

    try {
        const { runCrawler } = require('../services/knowledgeService');
        console.log(`[Admin] 手动触发爬虫，来源: ${source}`);

        const results = await runCrawler(source);

        // 为每条标记是否已存在
        const markDuplicates = (items, collection) => {
            const existing = await jsonStore.readData(collection);
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
                    _collection: collection,
                };
            });
        };

        const [exercises, knowledge, tips] = await Promise.all([
            markDuplicates(results.exercises || [], 'exercises'),
            markDuplicates(results.knowledge || [], 'knowledge'),
            markDuplicates(results.tips || [], 'tips'),
        ]);

        res.json({
            success: true,
            message: '爬取完成，请选择需要入库的数据',
            data: { exercises, knowledge, tips },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Admin] 爬虫失败:', error);
        res.status(500).json({
            success: false,
            error: '爬取失败：' + error.message,
            code: 'CRAWL_ERROR',
        });
    }
});

// ─── 将爬虫结果导入 Blob ────────────────────────────────────

router.post('/crawl/import', async (req, res) => {
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
            source: item.source || 'admin-import',
        }));

        const inserted = await jsonStore.insertMany(collection, records);
        res.json({
            success: true,
            message: `成功导入 ${inserted.length} 条数据`,
            data: inserted,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'IMPORT_ERROR' });
    }
});

// ─── 集合统计 ───────────────────────────────────────────────

router.get('/stats', async (req, res) => {
    try {
        const stats = await jsonStore.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'STATS_ERROR' });
    }
});

// ─── 导出全部数据为 JSON ────────────────────────────────────

router.get('/export', async (req, res) => {
    try {
        const data = await jsonStore.exportAll();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=knowledge-data.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'EXPORT_ERROR' });
    }
});

// ─── 导入 JSON（覆盖现有数据）────────────────────────────────

router.post('/import', async (req, res) => {
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, error: '请提供有效的 JSON 数据', code: 'INVALID_INPUT' });
    }

    try {
        const results = [];
        for (const [collection, items] of Object.entries(data)) {
            if (Array.isArray(items) && jsonStore.COLLECTION_MAP[collection]) {
                await jsonStore.writeData(collection, items);
                results.push({ collection, count: items.length });
            }
        }
        res.json({ success: true, message: '导入成功', data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'IMPORT_ERROR' });
    }
});

// ─── 媒体文件管理 API ───────────────────────────────────────

/**
 * GET /api/admin/media/list
 * 列出所有媒体文件（图片/音频）
 */
router.get('/media/list', async (req, res) => {
    const { type = 'all' } = req.query;

    try {
        const [images, audio] = await Promise.all([
            type === 'audio' ? Promise.resolve({ blobs: [] }) : blobStore.listMedia('images'),
            type === 'images' ? Promise.resolve({ blobs: [] }) : blobStore.listMedia('audio'),
        ]);

        res.json({
            success: true,
            data: {
                images: images.blobs || [],
                audio:  audio.blobs  || [],
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'MEDIA_LIST_ERROR' });
    }
});

/**
 * POST /api/admin/media/upload
 * 上传图片或音频到 Blob
 * Body: multipart/form-data（fieldname: 'file'）
 *        + 可选 'type' = 'image' | 'audio'（自动检测 mimetype）
 */
router.post('/media/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: '请选择要上传的文件', code: 'NO_FILE' });
    }

    try {
        const { originalname, mimetype, buffer } = req.file;
        const fileExt = originalname.split('.').pop();
        const timestamp = Date.now();
        const filename = `${timestamp}_${originalname}`;

        let result;
        if (mimetype.startsWith('image/')) {
            result = await blobStore.uploadImage(buffer, filename, mimetype);
        } else if (mimetype.startsWith('audio/')) {
            result = await blobStore.uploadAudio(buffer, filename, mimetype);
        } else {
            return res.status(400).json({ success: false, error: '不支持的文件类型', code: 'INVALID_FILE_TYPE' });
        }

        res.json({
            success: true,
            message: '上传成功',
            data: {
                url:      result.url,
                pathname: result.pathname,
                size:     result.size,
                filename,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'UPLOAD_ERROR' });
    }
});

/**
 * DELETE /api/admin/media/:type/:filename
 * 删除媒体文件
 * type: 'images' | 'audio'
 * filename: Blob pathname 或 URL 编码的文件名
 */
router.delete('/media/:type/:filename', async (req, res) => {
    const { type, filename } = req.params;

    if (!['images', 'audio'].includes(type)) {
        return res.status(400).json({ success: false, error: '无效的文件类型', code: 'INVALID_TYPE' });
    }

    try {
        const decodedFilename = decodeURIComponent(filename);
        // 构建 Blob pathname
        const pathname = type === 'images'
            ? `${blobStore.MEDIA_IMAGE_PREFIX}${decodedFilename}`
            : `${blobStore.MEDIA_AUDIO_PREFIX}${decodedFilename}`;

        await blobStore.deleteMedia(pathname);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'DELETE_ERROR' });
    }
});

/**
 * GET /api/admin/media/:type/:filename
 * 获取媒体文件的 Blob URL（用于前端显示）
 * 实际返回重定向或直接返回 URL
 */
router.get('/media/:type/:filename', async (req, res) => {
    const { type, filename } = req.params;

    try {
        const decodedFilename = decodeURIComponent(filename);
        const pathname = type === 'images'
            ? `${blobStore.MEDIA_IMAGE_PREFIX}${decodedFilename}`
            : `${blobStore.MEDIA_AUDIO_PREFIX}${decodedFilename}`;

        const blob = await blobStore.get(pathname);
        if (!blob) {
            return res.status(404).json({ success: false, error: '文件不存在', code: 'NOT_FOUND' });
        }

        // 重定向到 Blob URL
        res.redirect(blob.url);
    } catch (error) {
        if (error.message?.includes('not found') || error.message?.includes('404')) {
            return res.status(404).json({ success: false, error: '文件不存在', code: 'NOT_FOUND' });
        }
        res.status(500).json({ success: false, error: error.message, code: 'MEDIA_ERROR' });
    }
});

// ─── Blob 连接状态检查 ──────────────────────────────────────

router.get('/blob-status', async (req, res) => {
    try {
        const result = await blobStore.checkBlobConnection();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'BLOB_STATUS_ERROR' });
    }
});

// ─── 数据初始化 ─────────────────────────────────────────────
// 从 server/data/*.json 上传到 Blob（仅内容数据，不含用户数据）

router.post('/init-data', async (req, res) => {
    const fs = require('fs');
    const path = require('path');

    // 只初始化内容数据文件（不含用户生成的隐私数据）
    const dataFiles = [
        { local: 'exercises.json', collection: 'exercises' },
        { local: 'knowledge.json', collection: 'knowledge' },
        { local: 'regulation.json', collection: 'regulation' },
        { local: 'tips.json', collection: 'tips' },
    ];

    const results = [];
    const dataDir = path.join(__dirname, '../../server/data');

    for (const { local, collection } of dataFiles) {
        const localPath = path.join(dataDir, local);
        try {
            if (!fs.existsSync(localPath)) {
                results.push({ file: local, status: 'skipped', message: '本地文件不存在' });
                continue;
            }

            const content = fs.readFileSync(localPath, 'utf-8');
            const data = JSON.parse(content);

            // 上传到 Blob
            const blobPath = `data/${local}`;
            const { put } = require('@vercel/blob');
            const result = await put(blobPath, content, {
                contentType: 'application/json',
                access: 'public',
            });

            results.push({
                file: local,
                status: 'success',
                message: `上传成功，${data.length || 0} 条记录`,
                url: result.url,
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

module.exports = router;
