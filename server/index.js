/**
 * 心晴空间 - 公益心理疗愈平台
 * 后端服务器入口文件
 * 支持 Vercel Serverless 部署
 *
 * 数据存储：Vercel Blob（替代 Upstash Search）
 */

const path = require('path');
// 加载 .env 文件（确保路径正确）
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 调试：确认环境变量加载
console.log('[Server] 环境变量加载检查:');
console.log('  ADMIN_TOKEN:', process.env.ADMIN_TOKEN ? '✓ 已设置 (' + process.env.ADMIN_TOKEN.substring(0, 15) + '...)' : '✗ 未设置');
console.log('  BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '✓ 已设置' : '✗ 未设置');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// CORS配置
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 压缩响应
app.use(compression());

// JSON解析
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 速率限制（Vercel 环境下禁用）
if (process.env.VERCEL !== '1') {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            error: '请求过于频繁，请稍后再试',
            code: 'RATE_LIMIT_EXCEEDED',
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);
}

// 静态文件服务（本地开发）
if (process.env.VERCEL !== '1') {
    app.use(express.static(path.join(__dirname, '../public'), {
        maxAge: '1d',
        etag: true,
    }));
}

// API路由
app.use('/api', apiRoutes);

// 健康检查
app.get('/health', async (req, res) => {
    try {
        // 检查 Blob 连接状态
        const blobStore = require('./services/blobStore');
        const blobStatus = await blobStore.checkBlobConnection();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '2.0.0',
            environment: process.env.VERCEL === '1' ? 'vercel' : 'local',
            storage: blobStatus.ok ? 'blob' : 'error',
            storageStatus: blobStatus,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});

// SPA回退（本地开发）
if (process.env.VERCEL !== '1') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
}

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message,
        code: err.code || 'INTERNAL_ERROR',
    });
});

// 本地开发启动服务器
if (process.env.VERCEL !== '1' && require.main === module) {
    async function startServer() {
        try {
            // 检查 Blob 连接
            const blobStore = require('./services/blobStore');
            const result = await blobStore.checkBlobConnection();
            if (result.ok) {
                console.log('✓ Vercel Blob 连接正常');
            } else {
                console.warn('⚠ Vercel Blob 连接异常:', result.error);
            }

            app.listen(PORT, () => {
                console.log(`✓ 服务器运行在 http://localhost:${PORT}`);
                console.log(`✓ 环境: ${process.env.NODE_ENV || 'development'}`);
                console.log(`✓ 数据存储: Vercel Blob`);
            });
        } catch (error) {
            console.error('✗ 服务器启动失败:', error);
            process.exit(1);
        }
    }

    startServer();
}

// Vercel Serverless 导出
module.exports = app;
