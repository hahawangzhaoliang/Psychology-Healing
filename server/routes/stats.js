/**
 * 统计相关路由
 * 使用 Upstash Search 数据库
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { insert, find } = require('../config/upstash');

/**
 * 记录页面访问
 * POST /api/stats/visit
 */
router.post('/visit', async (req, res) => {
    try {
        const { page } = req.body;
        if (!page) {
            return res.status(400).json({
                success: false,
                error: '缺少页面信息',
                code: 'MISSING_PAGE'
            });
        }
        
        const today = new Date().toISOString().split('T')[0];
        const record = {
            id: uuidv4(),
            page,
            ip: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent'),
            date: today,
            created_at: new Date().toISOString()
        };
        
        await insert('visitStats', record);
        res.json({ success: true });
    } catch (error) {
        console.error('记录访问失败:', error);
        res.json({ success: true }); // 静默失败
    }
});

/**
 * 获取访问统计
 * GET /api/stats/overview
 */
router.get('/overview', async (req, res) => {
    try {
        const allVisits = await find('visitStats');
        const today = new Date().toISOString().split('T')[0];

        const totalVisits = allVisits.length;

        // 今日访问量
        const todayVisits = allVisits.filter(v =>
            (v.date || new Date(v.created_at).toISOString().split('T')[0]) === today
        ).length;

        // 页面访问排行
        const pageStats = {};
        allVisits.forEach(v => {
            const dateKey = v.date || today;
            const key = `${dateKey}:${v.page}`;
            if (!pageStats[key]) {
                pageStats[key] = { date: dateKey, page: v.page, count: 0, ips: new Set() };
            }
            pageStats[key].count++;
            pageStats[key].ips.add(v.ip);
        });

        const topPages = Object.values(pageStats)
            .map(({ date, page, count, ips }) => ({ date, page, count, uniqueIps: ips.size }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        res.json({
            success: true,
            data: { totalVisits, todayVisits, topPages }
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取统计失败',
            code: 'STATS_ERROR'
        });
    }
});

/**
 * 获取求助热线列表
 * GET /api/stats/hotlines
 */
router.get('/hotlines', (req, res) => {
    res.json({
        success: true,
        data: [
            { name: '全国心理援助热线', phone: '400-161-9995', hours: '24小时', description: '免费服务' },
            { name: '北京危机干预热线', phone: '010-82951332', hours: '24小时', description: '北京市心理援助热线' },
            { name: '生命热线', phone: '400-821-1215', hours: '每天10:00-22:00', description: '上海生命热线' },
            { name: '青少年心理咨询热线', phone: '12355', hours: '工作时间', description: '共青团青少年服务热线' }
        ],
        disclaimer: '如有紧急情况，请拨打120或前往最近医院急诊'
    });
});

module.exports = router;
