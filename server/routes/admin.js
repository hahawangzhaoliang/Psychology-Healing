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

router.post('/login', (req, res) => {
    const token = req.body.token;
    
    if (token && token.trim()) {
        return res.json({ 
            success: true, 
            message: '登录成功'
        });
    }
    
    return res.status(401).json({
        success: false,
        error: '请输入令牌',
        code: 'NO_TOKEN',
    });
});

// ─── 数据接口 ────────────────────────────────────────────

// 获取所有集合信息
router.get('/collections', async (req, res) => {
    try {
        const collections = await jsonStore.listCollections();
        res.json({ success: true, data: collections });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取指定集合数据
router.get('/collections/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const data = await jsonStore.readData(collection);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新指定集合数据
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

module.exports = router;
