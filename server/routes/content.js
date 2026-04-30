/**
 * 内容相关路由
 * 使用 Upstash Search 数据库
 */

const express = require('express');
const router = express.Router();
const { find, findById, textSearch } = require('../config/upstash');

/**
 * 获取疗愈练习列表
 * GET /api/content/exercises
 */
router.get('/exercises', async (req, res) => {
    try {
        const exercises = await find('healingExercises');
        
        const data = exercises.map(ex => ({
            id: ex.id,
            title: ex.title,
            category: ex.category,
            duration: ex.duration,
            difficulty: ex.difficulty,
            description: ex.description,
            benefits: ex.benefits,
            tags: ex.tags
        }));
        
        res.json({
            success: true,
            data,
            disclaimer: '本内容仅供参考，不作为医学建议'
        });
    } catch (error) {
        console.error('获取练习列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取练习列表失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取单个练习详情
 * GET /api/content/exercises/:id
 */
router.get('/exercises/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exercise = await findById('healingExercises', id);
        
        if (!exercise) {
            return res.status(404).json({
                success: false,
                error: '练习不存在',
                code: 'NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: exercise,
            disclaimer: '本内容仅供参考，不作为医学建议'
        });
    } catch (error) {
        console.error('获取练习详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取练习详情失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取心理知识列表
 * GET /api/content/knowledge
 */
router.get('/knowledge', async (req, res) => {
    try {
        const knowledge = await find('psychologyKnowledge');
        
        const data = knowledge.map(k => ({
            id: k.id,
            title: k.title,
            category: k.category,
            source: k.source,
            keyPoints: k.keyPoints,
            tags: k.tags
        }));
        
        res.json({
            success: true,
            data,
            disclaimer: '本内容仅供参考，不作为医学建议'
        });
    } catch (error) {
        console.error('获取知识列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取知识列表失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取情绪调节方案
 * GET /api/content/regulation
 */
router.get('/regulation', async (req, res) => {
    try {
        const regulation = await find('emotionRegulation');
        
        res.json({
            success: true,
            data: regulation,
            disclaimer: '本内容仅供参考，不作为医学建议。如有严重心理困扰，请寻求专业帮助。'
        });
    } catch (error) {
        console.error('获取调节方案失败:', error);
        res.status(500).json({
            success: false,
            error: '获取调节方案失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取每日提示
 * GET /api/content/daily-tips
 */
router.get('/daily-tips', async (req, res) => {
    try {
        const tips = await find('dailyTips');
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        res.json({
            success: true,
            data: {
                today: randomTip,
                all: tips
            }
        });
    } catch (error) {
        console.error('获取每日提示失败:', error);
        res.status(500).json({
            success: false,
            error: '获取每日提示失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取快速练习
 * GET /api/content/quick-exercises
 */
router.get('/quick-exercises', async (req, res) => {
    try {
        const exercises = await find('quickExercises');
        
        res.json({
            success: true,
            data: exercises
        });
    } catch (error) {
        console.error('获取快速练习失败:', error);
        res.status(500).json({
            success: false,
            error: '获取快速练习失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取统计数据
 * GET /api/content/statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const stats = await find('metadata');
        const metadata = stats[0] || {};
        
        res.json({
            success: true,
            data: metadata.statistics || {},
            source: metadata.dataSource || []
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            error: '获取统计数据失败',
            code: 'FETCH_ERROR'
        });
    }
});

module.exports = router;
