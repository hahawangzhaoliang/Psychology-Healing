/**
 * 知识库更新 API
 * 用于 Vercel Cron 或外部调用触发更新
 */

const express = require('express');
const router = express.Router();
const { updateKnowledge } = require('../services/knowledgeService');

// 更新密钥（从环境变量获取）
const UPDATE_SECRET = process.env.KNOWLEDGE_UPDATE_SECRET || 'your-secret-key';

/**
 * POST /api/knowledge/cron-update
 * 定时任务触发的知识库更新接口
 * 
 * 请求头:
 *   Authorization: Bearer <secret>
 * 
 * 或查询参数:
 *   ?secret=<secret>
 */
router.post('/cron-update', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // 验证密钥
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '') || req.query.secret;
        
        if (token !== UPDATE_SECRET) {
            return res.status(401).json({
                success: false,
                error: '未授权访问',
                code: 'UNAUTHORIZED'
            });
        }
        
        console.log('[Cron] 知识库更新任务开始...');
        
        // 执行更新
        const stats = await updateKnowledge();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        res.json({
            success: true,
            message: '知识库更新成功',
            duration: `${duration}秒`,
            statistics: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Cron] 更新失败:', error);
        
        res.status(500).json({
            success: false,
            error: '知识库更新失败',
            code: 'UPDATE_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/knowledge/cron-update
 * Vercel Cron Jobs 默认发送 GET 请求
 */
router.get('/cron-update', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // 验证密钥
        const token = req.query.secret;
        
        if (token !== UPDATE_SECRET) {
            return res.status(401).json({
                success: false,
                error: '未授权访问',
                code: 'UNAUTHORIZED'
            });
        }
        
        console.log('[Cron] 知识库更新任务开始 (GET)...');
        
        // 执行更新
        const stats = await updateKnowledge();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        res.json({
            success: true,
            message: '知识库更新成功',
            duration: `${duration}秒`,
            statistics: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Cron] 更新失败:', error);
        
        res.status(500).json({
            success: false,
            error: '知识库更新失败',
            code: 'UPDATE_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/knowledge/sources
 * 获取数据源列表
 */
router.get('/sources', (req, res) => {
    const { getDataSources } = require('../services/knowledgeService');
    const sources = getDataSources();
    
    res.json({
        success: true,
        data: sources
    });
});

/**
 * GET /api/knowledge/health
 * 健康检查接口
 */
router.get('/health', async (req, res) => {
    try {
        const { find } = require('../config/upstash');
        
        const [exercises, knowledge, tips] = await Promise.all([
            find('healingExercises'),
            find('psychologyKnowledge'),
            find('dailyTips')
        ]);
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            counts: {
                exercises: exercises.length,
                knowledge: knowledge.length,
                tips: tips.length
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
