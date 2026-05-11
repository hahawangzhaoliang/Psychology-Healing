/**
 * 后台管理 API 路由（最小化版）
 */

const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const token = req.body.token;
    
    if (token && token.trim()) {
        return res.json({ 
            success: true, 
            message: '登录成功',
            debug: {
                envTokenSet: !!process.env.ADMIN_TOKEN,
            }
        });
    }
    
    return res.status(401).json({
        success: false,
        error: '请输入令牌',
        code: 'NO_TOKEN',
    });
});

router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API 正常工作',
        env: {
            ADMIN_TOKEN: process.env.ADMIN_TOKEN ? '已设置' : '未设置',
        }
    });
});

module.exports = router;
