/**
 * 后台管理 API 路由（最小化调试版）
 * 只保留登录接口，不依赖 blobStore/jsonStore
 */

const express = require('express');
const router = express.Router();

// ─── 管理员令牌校验 ───────────────────────────────────────

router.post('/login', (req, res) => {
    const { token } = req.body;
    
    // 调试信息
    const envToken = process.env.ADMIN_TOKEN;
    const hasEnvToken = !!envToken;
    
    console.log('========== 登录调试 ==========');
    console.log('process.env.ADMIN_TOKEN:', envToken ? '已设置' : '未设置');
    console.log('envToken 值:', envToken);
    console.log('收到的 token:', token);
    console.log('hasEnvToken:', hasEnvToken);
    console.log('token === envToken:', token === envToken);
    console.log('================================');
    
    // 接受任意非空 token 用于调试
    if (token && token.trim()) {
        return res.json({ 
            success: true, 
            message: '登录成功',
            debug: {
                envTokenSet: hasEnvToken,
                envToken: hasEnvToken ? envToken.substring(0, 10) + '...' : null,
                receivedToken: token.substring(0, 10) + '...',
            }
        });
    }
    
    return res.status(401).json({
        success: false,
        error: '请输入令牌',
        code: 'NO_TOKEN',
    });
});

// ─── 测试接口 ───────────────────────────────────────────

router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API 正常工作',
        env: {
            ADMIN_TOKEN: process.env.ADMIN_TOKEN ? '已设置' : '未设置',
            BLOB_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? '已设置' : '未设置',
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
        }
    });
});

module.exports = router;
