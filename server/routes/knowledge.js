/**
 * 知识库API路由
 * 使用 Upstash Search 数据库
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { 
    find, 
    findById, 
    insert, 
    textSearch 
} = require('../config/upstash');
const { updateKnowledge } = require('../services/knowledgeService');

/**
 * GET /api/knowledge
 * 获取知识库概览
 */
router.get('/', async (req, res) => {
    try {
        const [exercises, knowledge, regulations, tips, quickExercises, metadata] = await Promise.all([
            find('healingExercises'),
            find('psychologyKnowledge'),
            find('emotionRegulation'),
            find('dailyTips'),
            find('quickExercises'),
            find('metadata')
        ]);
        
        const meta = metadata[0] || {};
        
        res.json({
            metadata: {
                version: meta.version || '1.0.0',
                lastUpdated: meta.lastUpdated || new Date().toISOString().split('T')[0],
                dataSource: meta.dataSource || []
            },
            statistics: {
                totalExercises: exercises.length,
                totalKnowledge: knowledge.length,
                totalRegulations: regulations.length,
                totalTips: tips.length,
                totalQuickExercises: quickExercises.length
            },
            disclaimer: '本知识库内容仅供心理健康科普参考，不构成医学诊断或治疗建议。'
        });
    } catch (error) {
        console.error('获取知识库概览失败:', error);
        res.status(500).json({
            error: '知识库数据加载失败',
            code: 'KNOWLEDGE_LOAD_ERROR'
        });
    }
});

/**
 * GET /api/knowledge/exercises
 * 获取疗愈练习列表
 */
router.get('/exercises', async (req, res) => {
    try {
        const { category, difficulty, tag, limit = 20, offset = 0 } = req.query;
        
        let exercises = await find('healingExercises');
        
        // 按分类筛选
        if (category) {
            exercises = exercises.filter(e => e.category === category);
        }
        
        // 按难度筛选
        if (difficulty) {
            exercises = exercises.filter(e => e.difficulty === difficulty);
        }
        
        // 按标签筛选
        if (tag) {
            exercises = exercises.filter(e => e.tags && e.tags.includes(tag));
        }
        
        const total = exercises.length;
        exercises = exercises.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            exercises,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('获取练习列表失败:', error);
        res.json({ exercises: [], total: 0 });
    }
});

/**
 * GET /api/knowledge/exercises/:id
 * 获取单个疗愈练习详情
 */
router.get('/exercises/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exercise = await findById('healingExercises', id);
        
        if (!exercise) {
            return res.status(404).json({
                error: '练习不存在',
                code: 'EXERCISE_NOT_FOUND'
            });
        }
        
        res.json(exercise);
    } catch (error) {
        console.error('获取练习详情失败:', error);
        res.status(404).json({
            error: '练习不存在',
            code: 'EXERCISE_NOT_FOUND'
        });
    }
});

/**
 * GET /api/knowledge/psychology
 * 获取心理知识列表
 */
router.get('/psychology', async (req, res) => {
    try {
        const { category, tag, limit = 20, offset = 0 } = req.query;
        
        let knowledge = await find('psychologyKnowledge');
        
        if (category) {
            knowledge = knowledge.filter(k => k.category === category);
        }
        
        if (tag) {
            knowledge = knowledge.filter(k => k.tags && k.tags.includes(tag));
        }
        
        const total = knowledge.length;
        knowledge = knowledge.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            knowledge,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('获取心理知识失败:', error);
        res.json({ knowledge: [], total: 0 });
    }
});

/**
 * GET /api/knowledge/emotion-regulation
 * 获取情绪调节方案
 */
router.get('/emotion-regulation', async (req, res) => {
    try {
        const { emotion } = req.query;
        
        let regulations = await find('emotionRegulation');
        
        if (emotion) {
            regulations = regulations.filter(r => r.emotion === emotion);
        }
        
        res.json({ regulations });
    } catch (error) {
        console.error('获取情绪调节方案失败:', error);
        res.json({ regulations: [] });
    }
});

/**
 * GET /api/knowledge/daily-tips
 * 获取每日提示
 */
router.get('/daily-tips', async (req, res) => {
    try {
        const { category, random, limit = 5 } = req.query;
        
        let tips = await find('dailyTips');
        
        if (category) {
            tips = tips.filter(t => t.category === category);
        }
        
        // 随机返回
        if (random === 'true') {
            tips = tips.sort(() => Math.random() - 0.5);
        }
        
        tips = tips.slice(0, parseInt(limit));
        
        res.json({ tips });
    } catch (error) {
        console.error('获取每日提示失败:', error);
        res.json({ tips: [] });
    }
});

/**
 * GET /api/knowledge/tips
 * 获取每日提示（别名）
 */
router.get('/tips', async (req, res) => {
    try {
        const { category, random, limit = 5 } = req.query;
        
        let tips = await find('dailyTips');
        
        if (category) {
            tips = tips.filter(t => t.category === category);
        }
        
        // 随机返回
        if (random === 'true') {
            tips = tips.sort(() => Math.random() - 0.5);
        }
        
        tips = tips.slice(0, parseInt(limit));
        
        res.json({ tips });
    } catch (error) {
        console.error('获取每日提示失败:', error);
        res.json({ tips: [] });
    }
});

/**
 * GET /api/knowledge/quick-exercises
 * 获取快速练习
 */
router.get('/quick-exercises', async (req, res) => {
    try {
        const { random, limit = 5 } = req.query;
        
        let exercises = await find('quickExercises');
        
        if (random === 'true') {
            exercises = exercises.sort(() => Math.random() - 0.5);
        }
        
        exercises = exercises.slice(0, parseInt(limit));
        
        res.json({ exercises });
    } catch (error) {
        console.error('获取快速练习失败:', error);
        res.json({ exercises: [] });
    }
});

/**
 * GET /api/knowledge/graph
 * 获取知识图谱数据
 */
router.get('/graph', async (req, res) => {
    try {
        const graphData = await find('knowledgeGraph');
        
        if (!graphData || graphData.length === 0) {
            return res.json({
                nodes: [],
                edges: []
            });
        }
        
        // 如果是数组，取第一个元素
        const graph = Array.isArray(graphData) ? graphData[0] : graphData;
        
        res.json({
            nodes: graph.nodes || [],
            edges: graph.edges || []
        });
    } catch (error) {
        console.error('获取知识图谱失败:', error);
        res.json({
            nodes: [],
            edges: []
        });
    }
});

/**
 * POST /api/knowledge/update
 * 手动触发知识库更新
 */
router.post('/update', async (req, res) => {
    try {
        const stats = await updateKnowledge();
        res.json({
            success: true,
            message: '知识库更新成功',
            statistics: stats
        });
    } catch (error) {
        console.error('知识库更新失败:', error);
        res.status(500).json({
            error: '知识库更新失败',
            code: 'UPDATE_ERROR',
            details: error.message
        });
    }
});

/**
 * POST /api/knowledge/exercises
 * 添加新的疗愈练习（用户贡献）
 */
router.post('/exercises', async (req, res) => {
    try {
        const exercise = {
            ...req.body,
            id: req.body.id || uuidv4(),
            source: '用户贡献',
            created_at: new Date().toISOString()
        };
        
        await insert('healingExercises', exercise);
        
        res.status(201).json({
            success: true,
            message: '练习添加成功',
            exercise
        });
    } catch (error) {
        console.error('添加练习失败:', error);
        res.status(500).json({
            error: '添加练习失败',
            code: 'INSERT_ERROR'
        });
    }
});

module.exports = router;
