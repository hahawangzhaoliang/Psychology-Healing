/**
 * 爬虫管理 API 路由
 * 提供数据源配置 CRUD、爬取任务管理、结果查询
 */

const express = require('express');
const router = express.Router();
const crawlerConfig = require('../services/crawlerConfig');
const { CrawlerEngine } = require('../services/crawler');
const jsonStore = require('../services/jsonStore');

// ─── 数据源配置 CRUD ──────────────────────────────────────

router.get('/sources', async (req, res) => {
    try {
        const sources = await crawlerConfig.getAllSources();
        res.json({ success: true, data: sources });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/sources/:id', async (req, res) => {
    try {
        const source = await crawlerConfig.getSourceById(req.params.id);
        if (!source) return res.status(404).json({ success: false, error: '数据源不存在' });
        res.json({ success: true, data: source });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/sources', async (req, res) => {
    try {
        const source = await crawlerConfig.createSource(req.body);
        res.json({ success: true, data: source });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/sources/:id', async (req, res) => {
    try {
        const source = await crawlerConfig.updateSource(req.params.id, req.body);
        if (!source) return res.status(404).json({ success: false, error: '数据源不存在' });
        res.json({ success: true, data: source });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/sources/:id', async (req, res) => {
    try {
        const success = await crawlerConfig.deleteSource(req.params.id);
        if (!success) return res.status(404).json({ success: false, error: '数据源不存在' });
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── 爬取任务 ─────────────────────────────────────────────

router.post('/crawl/:sourceId', async (req, res) => {
    try {
        const source = await crawlerConfig.getSourceById(req.params.sourceId);
        if (!source) return res.status(404).json({ success: false, error: '数据源不存在' });

        const job = await crawlerConfig.createJob(source.id, source.type);

        res.json({ success: true, message: '爬取任务已启动', data: { jobId: job.id } });

        (async () => {
            try {
                await crawlerConfig.updateJob(job.id, { status: 'running', startedAt: new Date().toISOString() });
                await crawlerConfig.appendJobLog(job.id, `开始爬取: ${source.name}`);

                const engine = new CrawlerEngine();
                const results = await engine.crawlSource(source);

                const total = results.knowledge.length + results.images.length + results.audio.length;
                const newItems = results.knowledge.filter(i => !i._duplicate).length;

                await crawlerConfig.updateJob(job.id, {
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    results: {
                        total,
                        new: newItems,
                        duplicate: total - newItems,
                        failed: 0,
                    },
                });
                await crawlerConfig.appendJobLog(job.id, `爬取完成: ${total} 条, 新数据 ${newItems} 条`);

                await crawlerConfig.updateSource(source.id, {
                    lastCrawlAt: new Date().toISOString(),
                    totalCrawled: (source.totalCrawled || 0) + newItems,
                });

                await jsonStore.writeData('crawl-results', {
                    jobId: job.id,
                    sourceId: source.id,
                    timestamp: new Date().toISOString(),
                    ...results,
                });
            } catch (error) {
                await crawlerConfig.updateJob(job.id, {
                    status: 'failed',
                    completedAt: new Date().toISOString(),
                });
                await crawlerConfig.appendJobLog(job.id, `爬取失败: ${error.message}`);
            }
        })();
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const jobs = await crawlerConfig.getAllJobs();
        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/jobs/:id', async (req, res) => {
    try {
        const jobs = await crawlerConfig.getAllJobs();
        const job = jobs.find(j => j.id === req.params.id);
        if (!job) return res.status(404).json({ success: false, error: '任务不存在' });
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── 爬取结果 ─────────────────────────────────────────────

router.get('/results', async (req, res) => {
    try {
        const results = await jsonStore.readData('crawl-results');
        if (!results) return res.json({ success: true, data: null });
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/import', async (req, res) => {
    try {
        const { items, collection } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: '请选择要导入的数据' });
        }

        const cleanItems = items.map(({ _duplicate, _duplicateReason, _collection, ...rest }) => rest);
        const existing = await jsonStore.readData(collection);
        const merged = [...existing, ...cleanItems];
        await jsonStore.writeData(collection, merged);

        res.json({
            success: true,
            message: `成功导入 ${cleanItems.length} 条数据到 ${collection}`,
            data: { imported: cleanItems.length, total: merged.length },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
