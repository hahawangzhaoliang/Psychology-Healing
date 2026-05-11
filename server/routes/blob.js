/**
 * Blob 音频资源路由 - Vercel Blob 音频管理
 * 提供音频上传、列表、删除接口
 *
 * 注意：此路由为旧版接口，保留以备向后兼容
 * 新版媒体管理请使用 /api/admin/media/*
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const blobStore = require('../services/blobStore');

// 配置 multer（内存存储）
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowed = /audio\/(mpeg|wav|ogg|mp4|m4a)/;
        if (allowed.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型，仅支持音频文件（MP3/WAV/OGG/M4A）'));
        }
    },
});

// Blob 存储路径前缀
const BLOB_PREFIX = 'media/audio/';

/**
 * GET /api/blob/list
 * 列出所有已上传的音频文件
 */
router.get('/list', async (req, res) => {
    try {
        const { type = 'audio' } = req.query;
        const result = await blobStore.listMedia(type);

        res.json({
            success: true,
            blobs: result.blobs.map(b => ({
                pathname: b.pathname,
                url: b.url,
                size: b.size,
                uploadedAt: b.uploadedAt,
            })),
            cursor: result.cursor,
            hasMore: result.hasMore,
        });
    } catch (e) {
        console.error('[Blob] list 失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/blob/upload
 * 上传音频文件到 Vercel Blob
 * Body: multipart/form-data，字段名 file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: '请选择要上传的音频文件' });
    }

    try {
        const { originalname, mimetype, buffer } = req.file;
        const filename = `${Date.now()}_${originalname}`;

        const result = await blobStore.uploadAudio(buffer, filename, mimetype);

        res.json({
            success: true,
            filename,
            url: result.url,
            pathname: result.pathname,
            size: result.size,
        });
    } catch (e) {
        console.error('[Blob] upload 失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/blob/upload-local
 * 将本地 public/assets/audio/ 目录下的文件上传到 Blob
 * Body: { filename, category } - category 可选，默认为 'bgm'
 */
router.post('/upload-local', async (req, res) => {
    const { filename, category = 'bgm' } = req.body;

    if (!filename) {
        return res.status(400).json({ success: false, error: '缺少 filename 参数' });
    }

    // 安全校验：只允许 mp3/wav/ogg/m4a
    const ext = path.extname(filename).toLowerCase();
    if (!['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
        return res.status(400).json({ success: false, error: '不支持的文件类型' });
    }

    try {
        const localPath = path.join(
            __dirname, '../../public/assets/audio', category, filename
        );

        if (!fs.existsSync(localPath)) {
            return res.status(404).json({ success: false, error: `本地文件不存在: ${filename}` });
        }

        const fileBuffer = fs.readFileSync(localPath);
        const blobFilename = `${category}/${filename}`;

        const result = await blobStore.uploadAudio(fileBuffer, blobFilename);

        res.json({
            success: true,
            filename,
            url: result.url,
            size: result.size,
        });
    } catch (e) {
        console.error('[Blob] upload-local 失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * DELETE /api/blob/delete
 * 删除 Blob 文件
 * Body: { url }
 */
router.delete('/delete', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: '缺少 url 参数' });
    }

    try {
        await blobStore.deleteMedia(url);
        res.json({ success: true, message: '已删除' });
    } catch (e) {
        console.error('[Blob] delete 失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
