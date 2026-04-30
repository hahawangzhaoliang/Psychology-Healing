/**
 * 情绪日记相关路由
 * 使用 Upstash Search 数据库
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { insert, find, paginate } = require('../config/upstash');

/**
 * 获取情绪日记列表
 * GET /api/emotion/diary
 */
router.get('/diary', async (req, res) => {
    try {
        const { limit = 10, page = 1, user_id } = req.query;
        
        const query = user_id ? { user_id } : {};
        const result = await paginate('emotionDiary', {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { created_at: 'desc' },
            query
        });
        
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
            disclaimer: '本记录仅供参考，不作为医学诊断依据'
        });
    } catch (error) {
        console.error('获取情绪日记失败:', error);
        res.status(500).json({
            success: false,
            error: '获取记录失败',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * 创建情绪日记
 * POST /api/emotion/diary
 */
router.post('/diary', async (req, res) => {
    try {
        const { emotion, emotion_level, content, tags, user_id } = req.body;
        
        if (!emotion) {
            return res.status(400).json({
                success: false,
                error: '请选择情绪类型',
                code: 'MISSING_EMOTION'
            });
        }
        
        const record = {
            id: uuidv4(),
            user_id: user_id || null,
            emotion,
            emotion_level: emotion_level || 5,
            content: content || '',
            tags: tags || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        await insert('emotionDiary', record);
        
        res.json({
            success: true,
            data: { id: record.id },
            message: '记录成功'
        });
    } catch (error) {
        console.error('创建情绪日记失败:', error);
        res.status(500).json({
            success: false,
            error: '保存失败，请稍后再试',
            code: 'SAVE_ERROR'
        });
    }
});

/**
 * 获取情绪统计
 * GET /api/emotion/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const { user_id, days = 30 } = req.query;
        
        const allRecords = await find('emotionDiary');
        
        // 过滤时间范围
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        let filtered = allRecords.filter(r => 
            new Date(r.created_at) >= cutoffDate
        );
        
        // 按用户过滤
        if (user_id) {
            filtered = filtered.filter(r => r.user_id === user_id);
        }
        
        // 统计各情绪数量
        const emotionStats = {};
        const levelStats = {};
        
        filtered.forEach(r => {
            emotionStats[r.emotion] = (emotionStats[r.emotion] || 0) + 1;
            if (r.emotion_level) {
                levelStats[r.emotion] = (levelStats[r.emotion] || []);
                levelStats[r.emotion].push(r.emotion_level);
            }
        });
        
        // 计算平均等级
        const stats = Object.entries(emotionStats).map(([emotion, count]) => {
            const levels = levelStats[emotion] || [];
            const avgLevel = levels.length > 0 
                ? (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1)
                : 0;
            
            return {
                emotion,
                count,
                avg_level: parseFloat(avgLevel)
            };
        }).sort((a, b) => b.count - a.count);
        
        res.json({
            success: true,
            data: stats,
            total: filtered.length,
            disclaimer: '统计数据仅供参考，不作为医学诊断依据'
        });
    } catch (error) {
        console.error('获取情绪统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取统计失败',
            code: 'STATS_ERROR'
        });
    }
});

/**
 * 获取情绪类型列表
 * GET /api/emotion/types
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'calm', name: '平静', emoji: '😌', category: 'positive' },
            { id: 'anxious', name: '焦虑', emoji: '😰', category: 'negative' },
            { id: 'sad', name: '低落', emoji: '😔', category: 'negative' },
            { id: 'tired', name: '疲惫', emoji: '😴', category: 'neutral' },
            { id: 'angry', name: '愤怒', emoji: '😤', category: 'negative' },
            { id: 'confused', name: '迷茫', emoji: '🤔', category: 'neutral' },
            { id: 'grateful', name: '感恩', emoji: '😊', category: 'positive' },
            { id: 'hopeful', name: '期待', emoji: '🌟', category: 'positive' }
        ]
    });
});

module.exports = router;
