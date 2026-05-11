/**
 * Blob 路由 - Vercel Blob 音频资源管理
 * 提供上传、列表、删除接口
 */
const express = require('express');
const router = express.Router();
const { put, list, del } = require('@vercel/blob');
const { requireSecret } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Blob 存储路径前缀
const BLOB_PREFIX = 'audio/';

/**
 * GET /api/blob/list
 * 列出所有已上传的音频文件
 */
router.get('/list', async (req, res) => {
    try {
        const { prefix = BLOB_PREFIX, cursor } = req.query;
        const options = { prefix };
        if (cursor) options.cursor = cursor;

        const result = await list(options);

        res.json({
            success: true,
            blobs: result.blobs.map(b => ({
                pathname: b.pathname,
                url: b.url,
                downloadUrl: b.downloadUrl,
                size: b.size,
                uploadedAt: b.uploadedAt
            })),
            cursor: result.cursor,
            hasMore: result.hasMore
        });
    } catch (e) {
        console.error('[Blob] list 失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * POST /api/blob/upload
 * 上传音频文件到 Vercel Blob（需要鉴权）
 * Body: multipart/form-data，字段名 file
 * 或 JSON: { filename, category }  — 用于服务端直接从 public/assets/audio/ 上传
 */
router.post('/upload-local', requireSecret, async (req, res) => {
    try {
        const { filename, category = 'bgm' } = req.body;
        if (!filename) {
            return res.status(400).json({ success: false, error: '缺少 filename 参数' });
        }

        // 安全校验：只允许 mp3/wav/ogg
        const ext = path.extname(filename).toLowerCase();
        if (!['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
            return res.status(400).json({ success: false, error: '不支持的文件类型' });
        }

        const localPath = path.join(
            __dirname, '../../public/assets/audio', category, filename
        );

        if (!fs.existsSync(localPath)) {
            return res.status(404).json({ success: false, error: `本地文件不存在: ${filename}` });
        }

        const fileBuffer = fs.readFileSync(localPath);
        const blobPath = `${BLOB_PREFIX}${category}/${filename}`;

        const blob = await put(blobPath, fileBuffer, {
            access: 'public',
            contentType: ext === '.mp3' ? 'audio/mpeg' : 'audio/ogg',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        res.json({
            success: true,
            filename,
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            size: blob.size
        });
    } catch (e) {
        console.error('[Blob] upload-local 失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * DELETE /api/blob/delete
 * 删除 Blob 文件（需要鉴权）
 * Body: { url }
 */
router.delete('/delete', requireSecret, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: '缺少 url 参数' });
        }
        await del(url);
        res.json({ success: true, message: '已删除' });
    } catch (e) {
        console.error('[Blob] delete 失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
