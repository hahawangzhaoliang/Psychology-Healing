/**
 * 心理学内容爬虫服务
 * 从权威网站抓取心理学知识，丰富知识库内容
 *
 * @deprecated 请使用 server/services/crawler/index.js
 */

const crawlerModule = require('./crawler/index');

const {
    PsychologyCrawler,
    EnhancedPsychologyCrawler,
    fetch,
    HTMLParser,
    CRAWLER_CONFIG,
    quickCrawl,
    getDataSourceInfo
} = crawlerModule;

// 保持向后兼容 - 使用组合而非继承
class PsychologyCrawlerLegacy {
    constructor() {
        this.enhanced = new EnhancedPsychologyCrawler();
        this.results = {
            exercises: [],
            knowledge: [],
            tips: []
        };
    }

    async crawl() {
        const results = await this.enhanced.crawlAll();
        this.results = results;
        return this.results;
    }

    getResults() {
        return this.results;
    }
}

module.exports = {
    PsychologyCrawler: PsychologyCrawlerLegacy,
    EnhancedPsychologyCrawler,
    fetch,
    HTMLParser,
    CRAWLER_CONFIG,
    quickCrawl,
    getDataSourceInfo
};
