/**
 * 用户反馈相关路由
 * 使用 Upstash Search 数据库
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { insert } = require('../config/upstash');

/**
 * 提交反馈
 * POST /api/feedback
 */
router.post('/', async (req, res) => {
    try {
        const { type, content, contact } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: '请填写反馈内容',
                code: 'MISSING_CONTENT'
            });
        }
        
        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                error: '反馈内容不能超过1000字',
                code: 'CONTENT_TOO_LONG'
            });
        }
        
        const record = {
            id: uuidv4(),
            type: type || 'general',
            content: content.trim(),
            contact: contact || null,
            created_at: new Date().toISOString()
        };
        
        await insert('feedback', record);
        
        res.json({
            success: true,
            message: '感谢您的反馈，我们会认真对待每一条建议'
        });
    } catch (error) {
        console.error('提交反馈失败:', error);
        res.status(500).json({
            success: false,
            error: '提交失败，请稍后再试',
            code: 'SUBMIT_ERROR'
        });
    }
});

/**
 * 获取反馈类型
 * GET /api/feedback/types
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'bug', name: '问题反馈' },
            { id: 'suggestion', name: '功能建议' },
            { id: 'content', name: '内容反馈' },
            { id: 'general', name: '其他' }
        ]
    });
});

module.exports = router;
