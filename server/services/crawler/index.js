/**
 * 心理学内容爬虫服务 v2.0
 * 支持增量去重、数据源扩展、历史跟踪
 */

const https = require('https');
const http = require('http');
const FingerprintGenerator = require('./FingerprintGenerator');
const { CrawlHistoryManager, CrawlStatus, historyManager } = require('./CrawlHistoryManager');
const {
    SourceType,
    ContentType,
    TopicLabels,
    getAllUrls,
    getHighCredibilitySources,
    getUrlsByTopic,
    getUrlsByContentType
} = require('./DataSources');

// 爬虫配置
const CRAWLER_CONFIG = {
    // 请求间隔（毫秒）
    requestDelay: 1500,
    // 超时时间
    timeout: 20000,
    // User-Agent
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // 最大并发数
    maxConcurrent: 2,
    // 内容最小长度
    minContentLength: 50,
    // 是否启用增量模式
    incrementalMode: true,
    // 是否启用去重检查
    deduplicationEnabled: true
};

/**
 * HTTP 请求封装
 */
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': CRAWLER_CONFIG.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                ...options.headers
            },
            timeout: CRAWLER_CONFIG.timeout
        };

        const req = client.request(reqOptions, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ status: res.statusCode, data, headers: res.headers });
                } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // 处理重定向
                    const redirectUrl = new URL(res.headers.location, url).href;
                    fetch(redirectUrl, options).then(resolve).catch(reject);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * 延迟函数
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * HTML 内容解析器
 */
class HTMLParser {
    /**
     * 提取文本内容
     */
    static extractText(html, selector) {
        const patterns = {
            title: /<title[^>]*>([^<]+)<\/title>/i,
            h1: /<h1[^>]*>([^<]+)<\/h1>/gi,
            h2: /<h2[^>]*>([^<]+)<\/h2>/gi,
            h3: /<h3[^>]*>([^<]+)<\/h3>/gi,
            p: /<p[^>]*>([\s\S]*?)<\/p>/gi,
            content: /<article[^>]*>([\s\S]*?)<\/article>/i,
            description: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
        };

        if (selector && patterns[selector]) {
            const match = html.match(patterns[selector]);
            return match ? this.cleanText(match[1]) : '';
        }

        return html;
    }

    /**
     * 清理 HTML 标签
     */
    static cleanText(html) {
        return html
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 提取所有段落
     */
    static extractParagraphs(html) {
        const paragraphs = [];
        const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let match;

        while ((match = pRegex.exec(html)) !== null) {
            const text = this.cleanText(match[1]);
            if (text.length > 20) {
                paragraphs.push(text);
            }
        }

        return paragraphs;
    }

    /**
     * 提取文章标题
     */
    static extractTitle(html) {
        // 尝试多种方式提取标题
        const patterns = [
            /<h1[^>]*class=["'][^"']*article[^"']*["'][^>]*>([^<]+)<\/h1>/i,
            /<h1[^>]*>([^<]+)<\/h1>/i,
            /<title[^>]*>([^<]+)<\/title>/i
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                return this.cleanText(match[1]);
            }
        }

        return '';
    }

    /**
     * 提取描述
     */
    static extractDescription(html) {
        const patterns = [
            /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
            /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
            /<p[^>]*class=["'][^"']*summary[^"']*["'][^>]*>([\s\S]*?)<\/p>/i
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                return this.cleanText(match[1]);
            }
        }

        return '';
    }

    /**
     * 提取链接
     */
    static extractLinks(html, baseUrl) {
        const links = [];
        const aRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
        let match;

        while ((match = aRegex.exec(html)) !== null) {
            let href = match[1];
            const text = this.cleanText(match[2]);

            // 处理相对路径
            if (href.startsWith('/')) {
                href = new URL(href, baseUrl).href;
            } else if (!href.startsWith('http')) {
                continue;
            }

            // 过滤无效链接
            if (href.includes('javascript:') || href.includes('#')) {
                continue;
            }

            links.push({ href, text });
        }

        return links;
    }
}

/**
 * 增强版心理学内容爬虫
 */
class EnhancedPsychologyCrawler {
    constructor(options = {}) {
        this.config = { ...CRAWLER_CONFIG, ...options };
        this.results = {
            exercises: [],
            knowledge: [],
            tips: []
        };
        this.stats = {
            total: 0,
            success: 0,
            skipped: 0,
            failed: 0,
            new: 0
        };
        this.historyManager = historyManager;
    }

    /**
     * 检查是否需要爬取（增量模式）
     */
    shouldCrawl(data) {
        if (!this.config.incrementalMode) {
            return { needed: true, reason: '全量模式' };
        }

        return this.historyManager.checkNeedCrawl(data);
    }

    /**
     * 检查是否需要插入（去重）
     */
    shouldInsert(data) {
        if (!this.config.deduplicationEnabled) {
            return { needed: true, reason: '去重已禁用' };
        }

        const fingerprint = FingerprintGenerator.generateContentFingerprint(data);

        // 检查指纹是否已存在
        if (this.historyManager.hasFingerprint(fingerprint)) {
            return { needed: false, reason: '指纹重复', fingerprint };
        }

        // 检查标题和URL
        if (FingerprintGenerator.isLikelyDuplicate(data, {})) {
            // 检查是否在已爬取列表中
            const existingRecords = this.historyManager.getRecentSuccess(100);
            for (const record of existingRecords) {
                if (FingerprintGenerator.isLikelyDuplicate(data, { title: record.title, sourceUrl: record.url })) {
                    return { needed: false, reason: '内容相似', fingerprint };
                }
            }
        }

        return { needed: true, reason: '新内容', fingerprint };
    }

    /**
     * 爬取单个URL
     */
    async crawlUrl(urlInfo) {
        const { url, source, topic, contentType, credibility, tags } = urlInfo;

        // 1. 检查是否需要爬取
        const crawlCheck = this.shouldCrawl({ sourceUrl: url });
        if (!crawlCheck.needed && !crawlCheck.needUpdate) {
            this.stats.skipped++;
            return { status: 'skipped', reason: crawlCheck.reason, url };
        }

        // 2. 标记开始爬取
        this.historyManager.markCrawling(url);

        try {
            // 3. 请求页面
            await delay(this.config.requestDelay);
            const response = await fetch(url);

            // 4. 解析内容
            const title = HTMLParser.extractTitle(response.data);
            const paragraphs = HTMLParser.extractParagraphs(response.data);
            const description = HTMLParser.extractDescription(response.data);

            if (paragraphs.length === 0) {
                throw new Error('未提取到有效内容');
            }

            const content = paragraphs.slice(0, 5).join(' ');
            if (content.length < this.config.minContentLength) {
                throw new Error('内容过短');
            }

            // 5. 构建数据
            const data = {
                title: title || `${TopicLabels[topic]}指南`,
                content: content,
                sourceUrl: url,
                source: source,
                topic: topic,
                tags: [...(tags || []), TopicLabels[topic]]
            };

            // 6. 检查是否需要插入
            const insertCheck = this.shouldInsert(data);
            if (!insertCheck.needed) {
                this.historyManager.markSuccess(url, data);
                this.stats.skipped++;
                return { status: 'skipped', reason: insertCheck.reason, url };
            }

            // 7. 生成唯一ID（使用指纹）
            const fingerprint = FingerprintGenerator.generateContentFingerprint(data);
            const id = `crawl_${fingerprint.substring(0, 12)}_${Date.now()}`;

            // 8. 构建结果
            const result = {
                id,
                fingerprint,
                ...data,
                category: TopicLabels[topic],
                description: description || content.substring(0, 150),
                credibility,
                createdAt: new Date().toISOString()
            };

            // 9. 根据内容类型分类
            if (contentType === ContentType.EXERCISE) {
                result.exerciseData = {
                    duration: '10-15分钟',
                    difficulty: '入门',
                    steps: paragraphs.slice(0, 5).map((p, i) => `步骤${i + 1}: ${p}`),
                    benefits: ['缓解压力', '改善情绪', '提升觉察']
                };
                this.results.exercises.push(result);
            } else if (contentType === ContentType.EMOTION) {
                result.emotionData = {
                    emotion: TopicLabels[topic],
                    symptoms: [],
                    methods: [],
                    lifestyle: []
                };
                this.results.knowledge.push(result);
            } else {
                this.results.knowledge.push(result);
            }

            // 10. 标记成功
            this.historyManager.markSuccess(url, data);
            this.stats.success++;
            this.stats.new++;

            return { status: 'success', reason: '新增', url, title: result.title };

        } catch (error) {
            this.historyManager.markFailed(url, error.message);
            this.stats.failed++;
            return { status: 'failed', reason: error.message, url };
        }
    }

    /**
     * 爬取所有数据源
     */
    async crawlAll(options = {}) {
        const {
            highCredibilityOnly = false,
            topics = null,
            contentTypes = null,
            maxItems = 50
        } = options;

        console.log('\n========================================');
        console.log('🕷️  增强版爬虫启动 (v2.0 - 增量去重)');
        console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
        console.log(`📊 增量模式: ${this.config.incrementalMode ? '启用' : '禁用'}`);
        console.log(`🔍 去重检查: ${this.config.deduplicationEnabled ? '启用' : '禁用'}`);
        console.log('========================================\n');

        const startTime = Date.now();

        // 获取URL列表
        let urls = highCredibilityOnly
            ? getHighCredibilitySources()
            : getAllUrls();

        // 过滤主题
        if (topics && topics.length > 0) {
            urls = urls.filter(u => topics.includes(u.topic));
        }

        // 过滤内容类型
        if (contentTypes && contentTypes.length > 0) {
            urls = urls.filter(u => contentTypes.includes(u.contentType));
        }

        // 限制数量
        urls = urls.slice(0, maxItems);

        this.stats.total = urls.length;
        console.log(`📋 待爬取: ${urls.length} 个URL\n`);

        // 爬取统计
        const topicStats = {};

        // 批量爬取（控制并发）
        const batchSize = this.config.maxConcurrent;
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(url => this.crawlUrl(url)));

            // 打印批次结果
            results.forEach(result => {
                const topic = urls.find(u => u.url === result.url)?.topic || 'unknown';
                if (!topicStats[topic]) {
                    topicStats[topic] = { success: 0, skipped: 0, failed: 0 };
                }
                topicStats[topic][result.status]++;

                if (result.status === 'success') {
                    console.log(`  ✓ [${TopicLabels[topic] || topic}] ${result.title?.substring(0, 30)}...`);
                } else if (result.status === 'skipped') {
                    console.log(`  - [${TopicLabels[topic] || topic}] 跳过: ${result.reason}`);
                } else {
                    console.log(`  ✗ [${TopicLabels[topic] || topic}] 失败: ${result.reason}`);
                }
            });

            // 批次间延迟
            if (i + batchSize < urls.length) {
                await delay(this.config.requestDelay);
            }
        }

        // 统计信息
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n========================================');
        console.log('📊 爬取结果统计:');
        console.log(`  总计: ${this.stats.total}`);
        console.log(`  新增: ${this.stats.new}`);
        console.log(`  跳过: ${this.stats.skipped}`);
        console.log(`  失败: ${this.stats.failed}`);
        console.log(`  成功率: ${((this.stats.success / this.stats.total) * 100).toFixed(1)}%`);
        console.log('\n  按主题统计:');
        Object.entries(topicStats).forEach(([topic, stats]) => {
            console.log(`    ${TopicLabels[topic] || topic}: ✓${stats.success} -${stats.skipped} ✗${stats.failed}`);
        });
        console.log(`\n  耗时: ${duration}秒`);
        console.log('========================================\n');

        // 保存历史记录
        this.historyManager.save();

        return {
            results: this.results,
            stats: this.stats,
            topicStats,
            duration
        };
    }

    /**
     * 获取结果
     */
    getResults() {
        return this.results;
    }

    /**
     * 获取统计
     */
    getStats() {
        return {
            ...this.stats,
            historyStats: this.historyManager.getStats()
        };
    }
}

/**
 * 快速爬取（便捷方法）
 */
async function quickCrawl(options = {}) {
    const crawler = new EnhancedPsychologyCrawler();
    return await crawler.crawlAll(options);
}

/**
 * 获取数据源信息
 */
function getDataSourceInfo() {
    const stats = {
        totalUrls: getAllUrls().length,
        highCredibility: getHighCredibilitySources().length,
        bySource: {},
        byTopic: {}
    };

    getAllUrls().forEach(url => {
        if (!stats.bySource[url.source]) {
            stats.bySource[url.source] = 0;
        }
        stats.bySource[url.source]++;

        if (!stats.byTopic[url.topic]) {
            stats.byTopic[url.topic] = 0;
        }
        stats.byTopic[url.topic]++;
    });

    return stats;
}

// 导出
module.exports = {
    PsychologyCrawler: EnhancedPsychologyCrawler,
    EnhancedPsychologyCrawler,
    FingerprintGenerator,
    HTMLParser,
    historyManager,
    CrawlStatus,
    fetch,
    delay,
    CRAWLER_CONFIG,
    quickCrawl,
    getDataSourceInfo,
    // 重新导出数据源相关
    SourceType,
    ContentType,
    Topic,
    TopicLabels,
    getAllUrls,
    getUrlsByTopic,
    getUrlsByContentType,
    getHighCredibilitySources
};

// 如果直接运行
if (require.main === module) {
    console.log('\n🕷️  增强版爬虫测试\n');
    console.log('数据源信息:', getDataSourceInfo());

    quickCrawl({ maxItems: 5 }).then(results => {
        console.log('\n爬取完成!');
        console.log('结果:', JSON.stringify(results.stats, null, 2));
    }).catch(console.error);
}
