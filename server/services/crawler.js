/**
 * 心理学内容爬虫服务
 * 从权威网站抓取心理学知识，丰富知识库内容
 *
 * @deprecated 请使用 server/services/crawler/index.js
 */

const crawlerModule = require('./services/crawler');

const {
    PsychologyCrawler,
    fetch,
    HTMLParser,
    CRAWLER_CONFIG,
    quickCrawl,
    getDataSourceInfo
} = crawlerModule;

// 保持向后兼容
const PsychologyCrawlerLegacy = class extends crawlerModule.EnhancedPsychologyCrawler {
    constructor() {
        super();
        this.results = {
            exercises: [],
            knowledge: [],
            tips: []
        };
    }

    async crawl() {
        // 兼容旧接口：爬取中文来源
        await this.crawlChineseSources();
        this.generateTips();
        return this.results;
    }
};

module.exports = {
    PsychologyCrawler: PsychologyCrawlerLegacy,
    fetch,
    HTMLParser,
    CRAWLER_CONFIG,
    quickCrawl,
    getDataSourceInfo
};
