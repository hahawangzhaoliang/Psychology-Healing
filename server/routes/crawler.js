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
    let job = null;
    
    try {
        console.log(`[Crawler] 收到爬取请求: ${req.params.sourceId}`);
        
        const source = await crawlerConfig.getSourceById(req.params.sourceId);
        if (!source) return res.status(404).json({ success: false, error: '数据源不存在' });
        
        console.log(`[Crawler] 找到数据源: ${source.name}`);

        // 创建任务（包含写入验证）
        job = await crawlerConfig.createJob(source.id, source.type);
        console.log(`[Crawler] 任务创建成功: ${job.id}`);
        
        // 再次验证任务存在
        const verifyJobs = await crawlerConfig.getAllJobs();
        const jobExists = verifyJobs.some(j => j.id === job.id);
        console.log(`[Crawler] 任务验证: ${jobExists ? '存在' : '不存在'} (共 ${verifyJobs.length} 个任务)`);
        
        if (!jobExists) {
            return res.status(500).json({ success: false, error: '任务创建失败，无法持久化' });
        }

        // 发送成功响应
        res.json({ success: true, message: '爬取任务已启动', data: { jobId: job.id } });

        // 异步执行爬取（不影响响应）
        processCrawlJob(job.id, source).catch(err => {
            console.error(`[Crawler] 后台爬取出错: ${err.message}`);
        });
        
    } catch (error) {
        console.error(`[Crawler] 任务创建失败: ${error.message}`);
        res.status(500).json({ success: false, error: '任务创建失败: ' + error.message });
    }
});

// 独立的异步爬取函数
async function processCrawlJob(jobId, source) {
    try {
        console.log(`[Crawler] 后台任务 ${jobId} 开始执行`);
        
        await crawlerConfig.updateJob(jobId, { status: 'running', startedAt: new Date().toISOString() });
        await crawlerConfig.appendJobLog(jobId, `开始爬取: ${source.name}`);

        const engine = new CrawlerEngine();
        console.log(`[Crawler] 任务 ${jobId} 调用爬虫引擎...`);
        
        const results = await engine.crawlSource(source);
        console.log(`[Crawler] 任务 ${jobId} 爬取完成，结果:`, {
            knowledge: results.knowledge.length,
            images: results.images.length,
            audio: results.audio.length
        });

        const total = results.knowledge.length + results.images.length + results.audio.length;
        const newItems = results.knowledge.filter(i => !i._duplicate).length;

        await crawlerConfig.updateJob(jobId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            results: { total, new: newItems, duplicate: total - newItems, failed: 0 },
        });
        await crawlerConfig.appendJobLog(jobId, `爬取完成: ${total} 条, 新数据 ${newItems} 条`);

        await crawlerConfig.updateSource(source.id, {
            lastCrawlAt: new Date().toISOString(),
            totalCrawled: (source.totalCrawled || 0) + newItems,
        });

        await jsonStore.writeData('crawl-results', {
            jobId, sourceId: source.id,
            timestamp: new Date().toISOString(),
            ...results,
        });
        
        console.log(`[Crawler] 任务 ${jobId} 全部完成`);
    } catch (error) {
        console.error(`[Crawler] 任务 ${jobId} 执行失败:`, error.message);
        try {
            await crawlerConfig.updateJob(jobId, {
                status: 'failed',
                completedAt: new Date().toISOString(),
            });
            await crawlerConfig.appendJobLog(jobId, `爬取失败: ${error.message}`);
        } catch (e) {
            console.error(`[Crawler] 更新失败状态出错:`, e.message);
        }
    }
}

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
        // 直接读取 crawl-results.json（存储的是对象，不是数组）
        const blobStore = require('../services/blobStore');
        const results = await blobStore.readJsonFromBlob('crawl-results.json');
        
        if (!results || (Array.isArray(results) && results.length === 0)) {
            return res.json({ success: true, data: null });
        }
        res.json({ success: true, data: results });
    } catch (error) {
        // 文件不存在时返回 null
        if (error.message && error.message.includes('does not exist')) {
            return res.json({ success: true, data: null });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/import', async (req, res) => {
    try {
        const { items, collection } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: '请选择要导入的数据' });
        }

        // 转换爬虫数据 → 前端页面期望的格式
        const transformed = items.map(item => {
            const { _duplicate, _duplicateReason, _collection, _resultType, sourceUrl, sourceName, crawledAt, publishedDate, ...rest } = item;

            // 1. category：将集合名/英文映射为中文分类
            const categoryMap = {
                'knowledge':       '心理科学',
                'psychology':      '心理科学',
                'CBT':            '临床心理',
                'cognitive':       '临床心理',
                'positive':        '积极心理',
                'neuroscience':   '神经科学',
                'sleep':          '睡眠心理',
                '压力':            '压力管理',
                'stress':         '压力管理',
            };
            let cat = rest.category || '';
            if (categoryMap[cat.toLowerCase()]) {
                cat = categoryMap[cat.toLowerCase()];
            } else if (!['神经科学','临床心理','心理科学','睡眠心理','压力管理','积极心理'].includes(cat)) {
                // 无法识别的分类，根据 tags/title 猜测
                const text = `${rest.title} ${(rest.tags||[]).join(' ')}`.toLowerCase();
                if (text.includes('sleep') || text.includes('睡眠')) cat = '睡眠心理';
                else if (text.includes('stress') || text.includes('压力')) cat = '压力管理';
                else if (text.includes('positive') || text.includes('积极')) cat = '积极心理';
                else if (text.includes('neuro') || text.includes('神经')) cat = '神经科学';
                else if (text.includes('cbt') || text.includes('临床') || text.includes('therapy')) cat = '临床心理';
                else cat = '心理科学';
            }

            // 2. source：合并 sourceName + sourceUrl
            let source = rest.source || '';
            if (!source) {
                if (sourceName && sourceUrl) source = `${sourceName}（${sourceUrl}）`;
                else source = sourceName || sourceUrl || '未知来源';
            }

            // 3. keyPoints：从 content 提取前 3 句作为要点
            let keyPoints = rest.keyPoints || [];
            if ((!keyPoints || keyPoints.length === 0) && rest.content) {
                const sentences = rest.content
                    .split(/[。！？\n]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 10);
                keyPoints = sentences.slice(0, 3);
            }

            return {
                ...rest,
                category: cat,
                source,
                keyPoints,
                // 保留原标题和内容，确保前端能渲染
                title: rest.title,
                content: rest.content,
                tags: rest.tags || [],
            };
        });

        // 使用 insertMany 自动设置 created_at / updated_at
        const inserted = await jsonStore.insertMany(collection, transformed);

        res.json({
            success: true,
            message: `成功导入 ${inserted.length} 条数据到 ${collection}`,
            data: { imported: inserted.length, total: (await jsonStore.readData(collection)).length },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
