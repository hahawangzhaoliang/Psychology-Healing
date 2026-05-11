/**
 * 知识库定时任务 API
 * 供 Vercel Cron Jobs 或外部调度系统调用
 * 数据源：Vercel Blob
 */

const express  = require('express');
const router   = express.Router();
const { updateKnowledge, getDataSources } = require('../services/knowledgeService');
const { requireVercelCron } = require('../middleware/auth');
const jsonStore = require('../services/jsonStore');

// ─── POST /api/knowledge/cron-update ─────────────────────────
// Vercel Cron 默认发 GET，但也支持 POST 手动触发

async function handleCronUpdate(req, res) {
    const startTime = Date.now();

    try {
        console.log(`[Cron] 知识库更新任务开始 (${req.method})...`);

        const stats    = await updateKnowledge();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        res.json({
            success:    true,
            message:    '知识库更新成功',
            duration:   `${duration}秒`,
            statistics: stats,
            timestamp:  new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Cron] 更新失败:', error);

        res.status(500).json({
            success:   false,
            error:     '知识库更新失败',
            code:      'UPDATE_ERROR',
            message:   error.message,
            timestamp:  new Date().toISOString(),
        });
    }
}

router.get('/cron-update',  requireVercelCron, handleCronUpdate);
router.post('/cron-update', requireVercelCron, handleCronUpdate);

// ─── GET /api/knowledge/sources ──────────────────────────────

router.get('/sources', (req, res) => {
    res.json({ success: true, data: getDataSources() });
});

// ─── GET /api/knowledge/health ───────────────────────────────

router.get('/health', async (req, res) => {
    try {
        const [exercises, knowledge, tips] = await Promise.all([
            jsonStore.count('exercises'),
            jsonStore.count('knowledge'),
            jsonStore.count('tips'),
        ]);

        res.json({
            status:    'healthy',
            timestamp: new Date().toISOString(),
            counts: {
                exercises: exercises,
                knowledge: knowledge,
                tips:      tips,
            },
        });
    } catch (error) {
        res.status(500).json({
            status:    'unhealthy',
            error:     error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

module.exports = router;
