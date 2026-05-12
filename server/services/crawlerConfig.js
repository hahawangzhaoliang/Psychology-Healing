/**
 * 爬虫配置管理服务
 * 存储结构：data/crawler-sources.json + data/crawler-jobs.json
 */

const jsonStore = require('./jsonStore');

const SOURCES_COLLECTION = 'crawler-sources';
const JOBS_COLLECTION = 'crawler-jobs';

// 默认内置数据源（心理学相关）
const DEFAULT_SOURCES = [
    {
        id: 'builtin_cbt_guide',
        name: 'CBT 认知行为疗法指南',
        url: 'https://www.apa.org/ptsd-guideline/treatments/cognitive-behavioral-therapy',
        type: 'text',
        category: 'knowledge',
        status: 'active',
        selector: {
            title: 'h1, .page-title',
            content: 'article, .content, main',
            date: '.date, time',
        },
        filters: {
            minContentLength: 200,
            keywords: ['CBT', 'cognitive', 'behavioral', 'therapy'],
        },
        lastCrawlAt: null,
        totalCrawled: 0,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'builtin_pp_center',
        name: '宾夕法尼亚大学积极心理学中心',
        url: 'https://ppc.sas.upenn.edu/',
        type: 'text',
        category: 'knowledge',
        status: 'active',
        selector: {
            title: 'h1, h2',
            content: '.content, article, .entry-content',
            date: '.date, time',
        },
        filters: {
            minContentLength: 200,
            keywords: ['positive psychology', 'well-being', 'flourishing'],
        },
        lastCrawlAt: null,
        totalCrawled: 0,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'builtin_arxiv_psychology',
        name: 'arXiv 心理学论文',
        url: 'https://arxiv.org/search/?query=psychology+mental+health&searchtype=all',
        type: 'paper',
        category: 'knowledge',
        status: 'active',
        paperConfig: {
            sourceType: 'arxiv',
            searchQuery: 'psychology OR cognitive OR "mental health"',
            maxResults: 50,
        },
        selector: {
            title: '.title',
            authors: '.authors a',
            abstract: '.abstract',
            publishedDate: '.dateline',
            pdfUrl: '.download-pdf a',
        },
        filters: {
            dateRange: { from: '2024-01-01', to: '2026-12-31' },
        },
        lastCrawlAt: null,
        totalCrawled: 0,
        createdAt: new Date().toISOString(),
    },
];

// ─── 数据源 CRUD ──────────────────────────────────────────

async function getAllSources() {
    try {
        const sources = await jsonStore.readData(SOURCES_COLLECTION);
        if (!sources || sources.length === 0) {
            // 异步写入，不阻塞返回（写入失败不影响读取）
            jsonStore.writeData(SOURCES_COLLECTION, DEFAULT_SOURCES).catch(e =>
                console.warn('[CrawlerConfig] 写入默认数据源失败（将使用内置数据）:', e.message)
            );
            return DEFAULT_SOURCES;
        }
        return sources;
    } catch (e) {
        console.warn('[CrawlerConfig] 读取数据源失败，返回内置默认值:', e.message);
        return DEFAULT_SOURCES;
    }
}

async function getSourceById(id) {
    const sources = await getAllSources();
    return sources.find(s => s.id === id) || null;
}

async function createSource(sourceData) {
    const sources = await getAllSources();
    const newSource = {
        id: `source_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...sourceData,
        status: sourceData.status || 'active',
        lastCrawlAt: null,
        totalCrawled: 0,
        createdAt: new Date().toISOString(),
    };
    sources.push(newSource);
    await jsonStore.writeData(SOURCES_COLLECTION, sources);
    return newSource;
}

async function updateSource(id, updates) {
    const sources = await getAllSources();
    const index = sources.findIndex(s => s.id === id);
    if (index === -1) return null;
    sources[index] = { ...sources[index], ...updates, updatedAt: new Date().toISOString() };
    await jsonStore.writeData(SOURCES_COLLECTION, sources);
    return sources[index];
}

async function deleteSource(id) {
    const sources = await getAllSources();
    const filtered = sources.filter(s => s.id !== id);
    if (filtered.length === sources.length) return false;
    await jsonStore.writeData(SOURCES_COLLECTION, filtered);
    return true;
}

// ─── 任务管理 ─────────────────────────────────────────────

async function getAllJobs() {
    const jobs = await jsonStore.readData(JOBS_COLLECTION);
    return jobs || [];
}

async function createJob(sourceId, type) {
    const jobs = await getAllJobs();
    const job = {
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sourceId,
        type,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        results: { total: 0, new: 0, duplicate: 0, failed: 0 },
        logs: [],
        createdAt: new Date().toISOString(),
    };
    jobs.push(job);
    await jsonStore.writeData(JOBS_COLLECTION, jobs);
    return job;
}

async function updateJob(id, updates) {
    const jobs = await getAllJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) return null;
    jobs[index] = { ...jobs[index], ...updates };
    await jsonStore.writeData(JOBS_COLLECTION, jobs);
    return jobs[index];
}

async function appendJobLog(jobId, message) {
    const jobs = await getAllJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    job.logs.push({ time: new Date().toISOString(), message });
    await jsonStore.writeData(JOBS_COLLECTION, jobs);
}

module.exports = {
    getAllSources,
    getSourceById,
    createSource,
    updateSource,
    deleteSource,
    getAllJobs,
    createJob,
    updateJob,
    appendJobLog,
};
