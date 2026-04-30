/**
 * API路由入口
 */

const express = require('express');
const router = express.Router();

const emotionRoutes = require('./emotion');
const assessmentRoutes = require('./assessment');
const contentRoutes = require('./content');
const feedbackRoutes = require('./feedback');
const statsRoutes = require('./stats');
const knowledgeRoutes = require('./knowledge');
const cronRoutes = require('./cron');

// API版本信息
router.get('/', (req, res) => {
    res.json({
        name: '心晴空间 API',
        version: '1.0.0',
        description: '公益心理疗愈平台API服务',
        endpoints: {
            emotion: '/api/emotion',
            assessment: '/api/assessment',
            content: '/api/content',
            feedback: '/api/feedback',
            stats: '/api/stats',
            knowledge: '/api/knowledge',
            cron: '/api/knowledge/cron-update'
        },
        disclaimer: '本平台为公益性质的心理健康科普与情绪陪伴服务平台，不提供任何形式的医学诊断或心理治疗服务。'
    });
});

// 子路由
router.use('/emotion', emotionRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/content', contentRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/stats', statsRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/knowledge', cronRoutes);

module.exports = router;
