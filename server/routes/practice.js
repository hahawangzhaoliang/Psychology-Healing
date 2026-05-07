/**
 * 疗愈练习记录路由
 * 记录用户的练习历史和统计
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { insert, find, paginate } = require('../config/upstash');

/**
 * 记录练习完成
 * POST /api/practice/record
 */
router.post('/record', async (req, res) => {
    try {
        const { 
            practiceType, 
            duration, 
            userId, 
            feedback, 
            mood 
        } = req.body;
        
        if (!practiceType) {
            return res.status(400).json({
                success: false,
                error: '请选择练习类型',
                code: 'MISSING_PRACTICE_TYPE'
            });
        }
        
        const record = {
            id: uuidv4(),
            userId: userId || null,
            practiceType,  // 'breathing', 'body-scan', 'meditation', 'relaxation'
            duration: duration || 0,
            feedback: feedback || null,
            mood: mood || null,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        await insert('practiceRecords', record);
        
        res.json({
            success: true,
            data: { 
                id: record.id,
                message: '练习记录保存成功'
            }
        });
    } catch (error) {
        console.error('记录练习失败:', error);
        res.status(500).json({
            success: false,
            error: '保存记录失败',
            code: 'SAVE_ERROR'
        });
    }
});

/**
 * 获取练习历史
 * GET /api/practice/history
 */
router.get('/history', async (req, res) => {
    try {
        const { userId, limit = 20, page = 1 } = req.query;
        
        const query = userId ? { userId } : {};
        const result = await paginate('practiceRecords', {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { completedAt: 'desc' },
            query
        });
        
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('获取练习历史失败:', error);
        res.status(500).json({
            success: false,
            error: '获取历史记录失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 获取练习统计
 * GET /api/practice/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const { userId, days = 30 } = req.query;
        
        const allRecords = await find('practiceRecords');
        
        // 过滤时间范围
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        let filtered = allRecords.filter(r => 
            new Date(r.completedAt) >= cutoffDate
        );
        
        // 按用户过滤
        if (userId) {
            filtered = filtered.filter(r => r.userId === userId);
        }
        
        // 统计各类型练习
        const typeStats = {};
        let totalDuration = 0;
        
        filtered.forEach(r => {
            typeStats[r.practiceType] = (typeStats[r.practiceType] || 0) + 1;
            totalDuration += r.duration || 0;
        });
        
        res.json({
            success: true,
            data: {
                totalSessions: filtered.length,
                totalDuration,
                averageDuration: filtered.length > 0 
                    ? Math.round(totalDuration / filtered.length) 
                    : 0,
                typeStats,
                recentSessions: filtered.slice(0, 5)
            }
        });
    } catch (error) {
        console.error('获取练习统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取统计失败',
            code: 'STATS_ERROR'
        });
    }
});

/**
 * 获取练习类型列表
 * GET /api/practice/types
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        data: [
            { 
                id: 'breathing', 
                name: '呼吸觉察', 
                duration: '1分钟',
                description: '快速平静神经系统',
                benefits: ['降低心率', '减少焦虑', '提升专注']
            },
            { 
                id: 'body-scan', 
                name: '身体扫描', 
                duration: '3分钟',
                description: '增强身体觉察',
                benefits: ['放松肌肉', '减少紧张', '改善睡眠']
            },
            { 
                id: 'meditation', 
                name: '正念冥想', 
                duration: '5分钟',
                description: '提升注意力稳定性',
                benefits: ['减少走神', '提升记忆', '情绪调节']
            },
            { 
                id: 'relaxation', 
                name: '深度放松', 
                duration: '7分钟',
                description: '进入放松警觉状态',
                benefits: ['改变脑电波', '深度放松', '压力释放']
            }
        ]
    });
});

module.exports = router;
