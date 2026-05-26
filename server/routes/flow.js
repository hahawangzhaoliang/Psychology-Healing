/**
 * 心流体验室 API 路由
 * 
 * 功能：
 * - 获取活动列表
 * - 心流记录 CRUD
 * - 统计数据查询
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 数据文件路径
const ACTIVITIES_FILE = path.join(__dirname, '..', 'data', 'flow-activities.json');
const RECORDS_FILE = path.join(__dirname, '..', 'data', 'flow-records.json');

/**
 * 读取 JSON 文件
 */
async function readJsonFile(filepath) {
    try {
        const data = await fs.readFile(filepath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * 写入 JSON 文件
 */
async function writeJsonFile(filepath, data) {
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * GET /api/flow/activities
 * 获取活动列表
 * 
 * 查询参数：
 * - category: 分类筛选 (creative|learning|physical|contemplative)
 * - difficulty: 难度筛选 (1-5)
 * - duration: 时长筛选 (分钟)
 */
router.get('/activities', async (req, res) => {
    try {
        const data = await readJsonFile(ACTIVITIES_FILE);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                error: '活动数据未找到',
                code: 'ACTIVITIES_NOT_FOUND'
            });
        }

        // 扁平化活动数据
        const activities = [];
        data.categories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                subcategory.activities.forEach(activity => {
                    activities.push({
                        id: activity.id,
                        name: activity.name,
                        description: activity.description,
                        duration: activity.duration,
                        difficulty: activity.difficulty,
                        category: category.id,
                        categoryName: category.name,
                        categoryIcon: category.icon,
                        subcategory: subcategory.id,
                        subcategoryName: subcategory.name,
                        tags: activity.tags,
                        benefits: activity.benefits,
                        materials: activity.materials,
                        tips: activity.tips,
                        popularity: activity.popularity,
                        avgFlowScore: activity.avgFlowScore,
                        scientificBasis: activity.scientificBasis
                    });
                });
            });
        });

        // 应用筛选
        let filtered = activities;
        
        if (req.query.category) {
            filtered = filtered.filter(a => a.category === req.query.category);
        }
        
        if (req.query.difficulty) {
            const diff = parseInt(req.query.difficulty);
            filtered = filtered.filter(a => a.difficulty === diff);
        }
        
        if (req.query.duration) {
            const dur = parseInt(req.query.duration);
            filtered = filtered.filter(a => a.duration.includes(dur));
        }

        // 按热度排序
        filtered.sort((a, b) => b.popularity - a.popularity);

        res.json({
            success: true,
            total: filtered.length,
            activities: filtered,
            categories: data.categories.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                description: c.description
            }))
        });
    } catch (error) {
        console.error('获取活动列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取活动列表失败',
            code: 'FETCH_ACTIVITIES_ERROR'
        });
    }
});

/**
 * GET /api/flow/activities/:id
 * 获取单个活动详情
 */
router.get('/activities/:id', async (req, res) => {
    try {
        const data = await readJsonFile(ACTIVITIES_FILE);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                error: '活动数据未找到',
                code: 'ACTIVITIES_NOT_FOUND'
            });
        }

        // 查找活动
        let foundActivity = null;
        data.categories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                subcategory.activities.forEach(activity => {
                    if (activity.id === req.params.id) {
                        foundActivity = {
                            ...activity,
                            category: category.id,
                            categoryName: category.name,
                            categoryIcon: category.icon,
                            subcategory: subcategory.id,
                            subcategoryName: subcategory.name
                        };
                    }
                });
            });
        });

        if (!foundActivity) {
            return res.status(404).json({
                error: '活动未找到',
                code: 'ACTIVITY_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            activity: foundActivity
        });
    } catch (error) {
        console.error('获取活动详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取活动详情失败',
            code: 'FETCH_ACTIVITY_ERROR'
        });
    }
});

/**
 * GET /api/flow/records
 * 获取心流记录列表
 * 
 * 查询参数：
 * - userId: 用户ID（可选，用于多用户场景）
 * - limit: 返回数量限制
 * - offset: 分页偏移
 */
router.get('/records', async (req, res) => {
    try {
        const data = await readJsonFile(RECORDS_FILE);
        let records = data ? (data.records || []) : [];

        // 按时间倒序
        records.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 分页
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const paginated = records.slice(offset, offset + limit);

        res.json({
            success: true,
            total: records.length,
            limit,
            offset,
            records: paginated
        });
    } catch (error) {
        console.error('获取记录列表失败:', error);
        res.status(500).json({
            error: '获取记录列表失败',
            code: 'FETCH_RECORDS_ERROR'
        });
    }
});

/**
 * POST /api/flow/records
 * 创建心流记录
 */
router.post('/records', async (req, res) => {
    try {
        const { duration, goal, activityId, scores, avgScore, diary } = req.body;

        // 验证必填字段
        if (!duration || !goal || !scores) {
            return res.status(400).json({
                error: '缺少必填字段',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // 读取现有数据
        let data = await readJsonFile(RECORDS_FILE);
        if (!data) {
            data = { records: [] };
        }

        // 创建新记录
        const newRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            duration,
            goal,
            activityId: activityId || null,
            scores,
            avgScore: avgScore || Object.values(scores).reduce((a, b) => a + b, 0) / 4,
            diary: diary || ''
        };

        data.records.unshift(newRecord);

        // 保存
        await writeJsonFile(RECORDS_FILE, data);

        res.status(201).json({
            success: true,
            record: newRecord,
            message: '心流记录已保存'
        });
    } catch (error) {
        console.error('创建记录失败:', error);
        res.status(500).json({
            error: '创建记录失败',
            code: 'CREATE_RECORD_ERROR'
        });
    }
});

/**
 * GET /api/flow/records/:id
 * 获取单条心流记录
 */
router.get('/records/:id', async (req, res) => {
    try {
        const data = await readJsonFile(RECORDS_FILE);
        const records = data ? (data.records || []) : [];

        const record = records.find(r => r.id === req.params.id);

        if (!record) {
            return res.status(404).json({
                error: '记录未找到',
                code: 'RECORD_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            record
        });
    } catch (error) {
        console.error('获取记录详情失败:', error);
        res.status(500).json({
            error: '获取记录详情失败',
            code: 'FETCH_RECORD_ERROR'
        });
    }
});

/**
 * PUT /api/flow/records/:id
 * 更新心流记录
 */
router.put('/records/:id', async (req, res) => {
    try {
        const data = await readJsonFile(RECORDS_FILE);
        if (!data || !data.records) {
            return res.status(404).json({
                error: '记录未找到',
                code: 'RECORD_NOT_FOUND'
            });
        }

        const index = data.records.findIndex(r => r.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({
                error: '记录未找到',
                code: 'RECORD_NOT_FOUND'
            });
        }

        // 更新记录
        data.records[index] = {
            ...data.records[index],
            ...req.body,
            id: req.params.id, // 防止修改ID
            updatedAt: new Date().toISOString()
        };

        await writeJsonFile(RECORDS_FILE, data);

        res.json({
            success: true,
            record: data.records[index],
            message: '记录已更新'
        });
    } catch (error) {
        console.error('更新记录失败:', error);
        res.status(500).json({
            error: '更新记录失败',
            code: 'UPDATE_RECORD_ERROR'
        });
    }
});

/**
 * DELETE /api/flow/records/:id
 * 删除心流记录
 */
router.delete('/records/:id', async (req, res) => {
    try {
        const data = await readJsonFile(RECORDS_FILE);
        if (!data || !data.records) {
            return res.status(404).json({
                error: '记录未找到',
                code: 'RECORD_NOT_FOUND'
            });
        }

        const index = data.records.findIndex(r => r.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({
                error: '记录未找到',
                code: 'RECORD_NOT_FOUND'
            });
        }

        data.records.splice(index, 1);
        await writeJsonFile(RECORDS_FILE, data);

        res.json({
            success: true,
            message: '记录已删除'
        });
    } catch (error) {
        console.error('删除记录失败:', error);
        res.status(500).json({
            error: '删除记录失败',
            code: 'DELETE_RECORD_ERROR'
        });
    }
});

/**
 * GET /api/flow/stats
 * 获取统计数据
 * 
 * 查询参数：
 * - period: 时间范围 (week|month|year)
 */
router.get('/stats', async (req, res) => {
    try {
        const data = await readJsonFile(RECORDS_FILE);
        const records = data ? (data.records || []) : [];

        const period = req.query.period || 'week';
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // 筛选时间范围内的记录
        const filtered = records.filter(r => new Date(r.date) >= startDate);

        // 计算统计数据
        const totalDuration = filtered.reduce((sum, r) => sum + r.duration, 0);
        const totalSessions = filtered.length;
        const avgScore = filtered.length > 0
            ? (filtered.reduce((sum, r) => sum + r.avgScore, 0) / filtered.length).toFixed(2)
            : 0;

        // 计算连续天数
        const streak = calculateStreak(records);

        // 活动排行
        const activityStats = {};
        filtered.forEach(r => {
            if (r.activityId) {
                if (!activityStats[r.activityId]) {
                    activityStats[r.activityId] = { count: 0, duration: 0 };
                }
                activityStats[r.activityId].count++;
                activityStats[r.activityId].duration += r.duration;
            }
        });

        const topActivities = Object.entries(activityStats)
            .map(([id, stats]) => ({ activityId: id, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            success: true,
            period,
            stats: {
                totalDuration,
                totalSessions,
                avgScore: parseFloat(avgScore),
                streak,
                topActivities
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            error: '获取统计数据失败',
            code: 'FETCH_STATS_ERROR'
        });
    }
});

/**
 * 计算连续天数
 */
function calculateStreak(records) {
    if (records.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        const hasRecord = records.some(r => {
            const recordDate = new Date(r.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === checkDate.getTime();
        });

        if (hasRecord) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    return streak;
}

module.exports = router;
