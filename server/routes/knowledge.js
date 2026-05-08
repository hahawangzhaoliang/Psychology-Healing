/**
 * 知识库 API 路由 v2.0
 * 优化点：
 *  - 消除 /daily-tips 与 /tips 重复实现（提取 _buildTipsHandler）
 *  - 使用 parsePagination 中间件统一分页参数解析
 *  - 错误响应统一使用 { success, error, code } 格式
 */

const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const { find, findById, insert, textSearch } = require('../config/upstash');
const { updateKnowledge } = require('../services/knowledgeService');
const { parsePagination, requireFields } = require('../middleware/validate');

// ─── 公共分页辅助 ─────────────────────────────────────────────

function applyFilters(items, filters = {}) {
    let result = items;
    for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        if (key === 'tag') {
            result = result.filter(item => item.tags && item.tags.includes(value));
        } else {
            result = result.filter(item => item[key] === value);
        }
    }
    return result;
}

function slicePage(items, pagination) {
    const { limit, offset } = pagination;
    return {
        data: items.slice(offset, offset + limit),
        total: items.length,
        limit,
        offset
    };
}

// ─── GET /api/knowledge ───────────────────────────────────────

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
                version:     meta.version     || '1.0.0',
                lastUpdated: meta.lastUpdated || new Date().toISOString().split('T')[0],
                dataSource:  meta.dataSource  || []
            },
            statistics: {
                totalExercises:     exercises.length,
                totalKnowledge:     knowledge.length,
                totalRegulations:   regulations.length,
                totalTips:          tips.length,
                totalQuickExercises: quickExercises.length
            },
            disclaimer: '本知识库内容仅供心理健康科普参考，不构成医学诊断或治疗建议。'
        });
    } catch (error) {
        console.error('获取知识库概览失败:', error);
        res.status(500).json({ success: false, error: '知识库数据加载失败', code: 'KNOWLEDGE_LOAD_ERROR' });
    }
});

// ─── GET /api/knowledge/exercises ────────────────────────────

router.get('/exercises', parsePagination(), async (req, res) => {
    try {
        const { category, difficulty, tag } = req.query;

        let items = await find('healingExercises');
        items = applyFilters(items, { category, difficulty, tag });

        const { data, total, limit, offset } = slicePage(items, req.pagination);

        res.json({ exercises: data, total, limit, offset });
    } catch (error) {
        console.error('获取练习列表失败:', error);
        res.json({ exercises: [], total: 0 });
    }
});

// ─── GET /api/knowledge/exercises/:id ────────────────────────

router.get('/exercises/:id', async (req, res) => {
    try {
        const exercise = await findById('healingExercises', req.params.id);

        if (!exercise) {
            return res.status(404).json({ success: false, error: '练习不存在', code: 'EXERCISE_NOT_FOUND' });
        }

        res.json(exercise);
    } catch (error) {
        console.error('获取练习详情失败:', error);
        res.status(404).json({ success: false, error: '练习不存在', code: 'EXERCISE_NOT_FOUND' });
    }
});

// ─── GET /api/knowledge/psychology ───────────────────────────

router.get('/psychology', parsePagination(), async (req, res) => {
    try {
        const { category, tag } = req.query;

        let items = await find('psychologyKnowledge');
        items = applyFilters(items, { category, tag });

        const { data, total, limit, offset } = slicePage(items, req.pagination);

        res.json({ knowledge: data, total, limit, offset });
    } catch (error) {
        console.error('获取心理知识失败:', error);
        res.json({ knowledge: [], total: 0 });
    }
});

// ─── GET /api/knowledge/emotion-regulation ───────────────────

router.get('/emotion-regulation', async (req, res) => {
    try {
        let regulations = await find('emotionRegulation');

        if (req.query.emotion) {
            regulations = regulations.filter(r => r.emotion === req.query.emotion);
        }

        res.json({ regulations });
    } catch (error) {
        console.error('获取情绪调节方案失败:', error);
        res.json({ regulations: [] });
    }
});

// ─── GET /api/knowledge/daily-tips  &  /tips（合并） ─────────

function buildTipsHandler() {
    return async (req, res) => {
        try {
            const { category, random, limit: rawLimit = '5' } = req.query;
            const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 5));

            let tips = await find('dailyTips');

            if (category) tips = tips.filter(t => t.category === category);
            if (random === 'true') tips = tips.sort(() => Math.random() - 0.5);

            res.json({ tips: tips.slice(0, limit) });
        } catch (error) {
            console.error('获取每日提示失败:', error);
            res.json({ tips: [] });
        }
    };
}

router.get('/daily-tips', buildTipsHandler());
router.get('/tips',       buildTipsHandler()); // 兼容旧客户端

// ─── GET /api/knowledge/quick-exercises ──────────────────────

router.get('/quick-exercises', async (req, res) => {
    try {
        const { random, limit: rawLimit = '5' } = req.query;
        const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 5));

        let exercises = await find('quickExercises');
        if (random === 'true') exercises = exercises.sort(() => Math.random() - 0.5);

        res.json({ exercises: exercises.slice(0, limit) });
    } catch (error) {
        console.error('获取快速练习失败:', error);
        res.json({ exercises: [] });
    }
});

// ─── GET /api/knowledge/graph ─────────────────────────────────

router.get('/graph', async (req, res) => {
    try {
        const graphData = await find('knowledgeGraph');
        const graph = Array.isArray(graphData) ? graphData[0] : graphData;

        res.json({
            nodes: graph?.nodes || [],
            edges: graph?.edges || []
        });
    } catch (error) {
        console.error('获取知识图谱失败:', error);
        res.json({ nodes: [], edges: [] });
    }
});

// ─── GET /api/knowledge/search ────────────────────────────────

router.get('/search', async (req, res) => {
    try {
        const { q, type, limit: rawLimit = '10' } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, error: '搜索词不能少于2个字符', code: 'INVALID_QUERY' });
        }

        const limit = Math.min(50, parseInt(rawLimit, 10) || 10);

        const collections = type ? [type] : ['healingExercises', 'psychologyKnowledge'];
        const searches = await Promise.all(
            collections.map(coll => textSearch(coll, q.trim(), { limit }).then(r => r.map(i => ({ ...i, _type: coll }))))
        );

        const results = searches.flat().sort((a, b) => (b._score || 0) - (a._score || 0)).slice(0, limit);

        res.json({ results, query: q, total: results.length });
    } catch (error) {
        console.error('搜索失败:', error);
        res.status(500).json({ success: false, error: '搜索失败', code: 'SEARCH_ERROR' });
    }
});

// ─── POST /api/knowledge/update ──────────────────────────────

router.post('/update', async (req, res) => {
    try {
        const stats = await updateKnowledge();
        res.json({ success: true, message: '知识库更新成功', statistics: stats });
    } catch (error) {
        console.error('知识库更新失败:', error);
        res.status(500).json({ success: false, error: '知识库更新失败', code: 'UPDATE_ERROR', details: error.message });
    }
});

// ─── POST /api/knowledge/exercises（用户贡献） ────────────────

router.post('/exercises', requireFields('title', 'category'), async (req, res) => {
    try {
        const exercise = {
            ...req.body,
            id:         req.body.id || uuidv4(),
            source:     '用户贡献',
            created_at: new Date().toISOString()
        };

        await insert('healingExercises', exercise);

        res.status(201).json({ success: true, message: '练习添加成功', exercise });
    } catch (error) {
        console.error('添加练习失败:', error);
        res.status(500).json({ success: false, error: '添加练习失败', code: 'INSERT_ERROR' });
    }
});

module.exports = router;
