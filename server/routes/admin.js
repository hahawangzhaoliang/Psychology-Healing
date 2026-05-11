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

// ─── 管理员令牌校验 ───────────────────────────────────────

router.post('/login', (req, res) => {
    const { token } = req.body;
    // 优先使用环境变量中的 ADMIN_TOKEN，否则使用默认值用于本地开发
    const adminToken = process.env.ADMIN_TOKEN || 'xinqing-admin-2026';

    if (token !== adminToken) {
        return res.status(401).json({
            success: false,
            error: '令牌无效',
            code: 'INVALID_TOKEN',
        });
    }

    res.json({ success: true, message: '登录成功', token: adminToken });
});

// ─── 后续路由鉴权 ───────────────────────────────────────

router.use(require('../middleware/auth').requireAdmin);

// ─── 获取所有集合信息 ─────────────────────────────────────

router.get('/collections', async (req, res) => {
    try {
        const collections = await jsonStore.listCollections();
        const overview = {};
        for (const [name, info] of Object.entries(collections)) {
            overview[name] = {
                ...info,
                data: undefined,  // 不返回具体数据，只返回元信息
            };
        }
        res.json({ success: true, data: overview });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'COLLECTIONS_ERROR' });
    }
});

// ─── 获取指定集合的数据 ────────────────────────────────────

router.get('/collections/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const data = await jsonStore.readCollection(collection);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'COLLECTION_READ_ERROR' });
    }
});

// ─── 更新指定集合的数据 ────────────────────────────────────

router.put('/collections/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const data = req.body;
        await jsonStore.writeCollection(collection, data);
        res.json({ success: true, message: '保存成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'COLLECTION_WRITE_ERROR' });
    }
});

// ─── 媒体文件列表 ────────────────────────────────────────

router.get('/media/list', async (req, res) => {
    try {
        const { images, audio } = await blobStore.listMedia();
        res.json({ success: true, data: { images, audio } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'MEDIA_LIST_ERROR' });
    }
});

// ─── 媒体文件上传 ────────────────────────────────────────

router.post('/media/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '未选择文件', code: 'NO_FILE' });
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
            return res.status(400).json({ success: false, error: '不支持的文件类型', code: 'INVALID_FILE_TYPE' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'MEDIA_UPLOAD_ERROR' });
    }
});

// ─── 媒体文件删除 ────────────────────────────────────────

router.delete('/media/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        const decodedFilename = decodeURIComponent(filename);
        const pathname = type === 'images'
            ? `${blobStore.MEDIA_IMAGE_PREFIX}${decodedFilename}`
            : `${blobStore.MEDIA_AUDIO_PREFIX}${decodedFilename}`;

        await blobStore.deleteMedia(pathname);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, code: 'MEDIA_DELETE_ERROR' });
    }
});

// ─── 获取媒体文件 URL ─────────────────────────────────────

router.get('/media/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
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
    const dataDir = path.join(__dirname, '..', 'data');

    for (const { local } of dataFiles) {
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
            const result = await put(blobPath, Buffer.from(content, 'utf-8'), {
                contentType: 'application/json; charset=utf-8',
                access: 'public',
            });

            results.push({
                file: local,
                status: 'success',
                message: `上传成功，${Array.isArray(data) ? data.length : 0} 条记录`,
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
