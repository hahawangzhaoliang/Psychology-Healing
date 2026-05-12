/**
 * 通用爬虫引擎 v4.0
 * 支持：文本、图片、音频、论文、书籍分类爬取
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

// ─── HTTP 客户端（保留并增强）─────────────────────────────

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; PsychologyBot/4.0; +https://psychology-healing.app)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

class HTTPClient {
    static get(url, options = {}) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const timeout = options.timeout || 15000;
            const timer = setTimeout(() => reject(new Error('请求超时')), timeout);

            protocol.get(url, { headers: { ...DEFAULT_HEADERS, ...options.headers } }, (res) => {
                clearTimeout(timer);
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    const data = Buffer.concat(chunks).toString('utf8');
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ data, statusCode: res.statusCode, headers: res.headers });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
                    }
                });
            }).on('error', err => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }
}

// ─── 内容解析器（增强）────────────────────────────────────

class ContentParser {
    static extractText(html) {
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    static extractTitle(html) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) return titleMatch[1].trim();
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        return h1Match ? h1Match[1].trim() : '';
    }

    static extractBySelector(html, selector) {
        if (!selector) return '';
        
        const attrMatch = selector.match(/^(.+)@(.+)$/);
        if (attrMatch) {
            const [, sel, attr] = attrMatch;
            const regex = this._selectorToRegex(sel);
            const match = html.match(regex);
            if (match) {
                const attrMatch2 = match[0].match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
                return attrMatch2 ? attrMatch2[1] : '';
            }
            return '';
        }

        const regex = this._selectorToRegex(selector);
        const match = html.match(regex);
        if (!match) return '';
        return this.extractText(match[1] || match[0]).trim();
    }

    static extractAllBySelector(html, selector) {
        const results = [];
        const regex = this._selectorToRegex(selector, true);
        let match;
        while ((match = regex.exec(html)) !== null) {
            results.push(this.extractText(match[1] || match[0]).trim());
        }
        return results;
    }

    static _selectorToRegex(selector, global = false) {
        let pattern;
        if (selector.startsWith('.')) {
            const className = selector.slice(1);
            pattern = `class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<`;
        } else if (selector.startsWith('#')) {
            const id = selector.slice(1);
            pattern = `id=["']${id}["'][^>]*>([\\s\\S]*?)<`;
        } else {
            pattern = `<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`;
        }
        return new RegExp(pattern, global ? 'gi' : 'i');
    }

    static extractImages(html, baseUrl) {
        const images = [];
        const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            let src = match[1];
            if (src.startsWith('/')) {
                const base = new URL(baseUrl);
                src = `${base.protocol}//${base.host}${src}`;
            } else if (!src.startsWith('http')) {
                try { src = new URL(src, baseUrl).href; } catch { continue; }
            }
            const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
            images.push({ url: src, alt: altMatch ? altMatch[1] : '', type: 'image' });
        }
        return images;
    }

    static extractAudio(html, baseUrl) {
        const audio = [];
        const audioRegex = /<audio[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = audioRegex.exec(html)) !== null) {
            let src = match[1];
            if (!src.startsWith('http')) try { src = new URL(src, baseUrl).href; } catch { continue; }
            audio.push({ url: src, type: 'audio' });
        }
        const linkRegex = /<a[^>]+href=["']([^"']+\.(mp3|wav|ogg|m4a))["'][^>]*>([\s\S]*?)<\/a>/gi;
        while ((match = linkRegex.exec(html)) !== null) {
            let src = match[1];
            if (!src.startsWith('http')) try { src = new URL(src, baseUrl).href; } catch { continue; }
            audio.push({ url: src, type: 'audio', title: this.extractText(match[3]) });
        }
        return audio;
    }

    static extractKeywords(text, maxKeywords = 10) {
        const words = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
        const freq = {};
        for (const word of words) {
            freq[word] = (freq[word] || 0) + 1;
        }
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxKeywords)
            .map(([word]) => word);
    }

    static extractKeyPoints(content, maxPoints = 3) {
        if (!content) return [];
        return content
            .split(/[。！？\n]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10)
            .slice(0, maxPoints);
    }
}

// ─── 指纹生成器（保留）────────────────────────────────────

class FingerprintGenerator {
    static generateContentFingerprint(data) {
        const raw = `${data.title || ''}|${data.content || ''}|${data.sourceUrl || ''}`;
        return crypto.createHash('md5').update(raw).digest('hex');
    }

    static generateTitleFingerprint(title) {
        const normalized = String(title).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();
        return crypto.createHash('md5').update(normalized).digest('hex');
    }
}

// ─── 过滤器 ───────────────────────────────────────────────

class ContentFilter {
    static apply(item, filters = {}) {
        if (filters.minContentLength) {
            const content = item.content || item.abstract || '';
            if (content.length < filters.minContentLength) return false;
        }

        if (filters.keywords && filters.keywords.length > 0) {
            const text = `${item.title || ''} ${item.content || item.abstract || ''}`.toLowerCase();
            const hasKeyword = filters.keywords.some(kw => text.includes(kw.toLowerCase()));
            if (!hasKeyword) return false;
        }

        if (filters.dateRange && item.publishedDate) {
            const date = new Date(item.publishedDate);
            if (filters.dateRange.from && date < new Date(filters.dateRange.from)) return false;
            if (filters.dateRange.to && date > new Date(filters.dateRange.to)) return false;
        }

        return true;
    }
}

// ─── 通用网页爬虫 ─────────────────────────────────────────

class GenericWebCrawler {
    constructor(source) {
        this.source = source;
        this.results = { text: [], images: [], audio: [], papers: [], books: [] };
    }

    async crawl() {
        console.log(`[Crawler] 开始爬取: ${this.source.name} (${this.source.url})`);
        
        try {
            const response = await HTTPClient.get(this.source.url);
            const html = response.data;

            switch (this.source.type) {
                case 'text':
                    await this._crawlText(html);
                    break;
                case 'image':
                    await this._crawlImages(html);
                    break;
                case 'audio':
                    await this._crawlAudio(html);
                    break;
                case 'paper':
                    await this._crawlPapers(html);
                    break;
                case 'book':
                    await this._crawlBooks(html);
                    break;
                case 'mixed':
                    await this._crawlText(html);
                    await this._crawlImages(html);
                    await this._crawlAudio(html);
                    break;
                default:
                    await this._crawlText(html);
            }

            console.log(`[Crawler] 爬取完成: 文本 ${this.results.text.length}, 图片 ${this.results.images.length}, 音频 ${this.results.audio.length}`);
            return this.results;
        } catch (error) {
            console.error(`[Crawler] 爬取失败: ${error.message}`);
            throw error;
        }
    }

    async _crawlText(html) {
        const selector = this.source.selector || {};
        const title = ContentParser.extractBySelector(html, selector.title) || ContentParser.extractTitle(html);
        const content = ContentParser.extractBySelector(html, selector.content) || ContentParser.extractText(html);
        const date = ContentParser.extractBySelector(html, selector.date);

        if (!title || !content) return;

        const item = {
            id: `crawl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: title.substring(0, 200),
            content: content.substring(0, 5000),
            sourceUrl: this.source.url,
            sourceName: this.source.name,
            source: this.source.name || this.source.url || '',
            publishedDate: date || new Date().toISOString(),
            category: this.source.category || 'knowledge',
            tags: ContentParser.extractKeywords(content, 5),
            keyPoints: ContentParser.extractKeyPoints(content, 3),
            crawledAt: new Date().toISOString(),
            _collection: this.source.category || 'knowledge',
        };

        if (ContentFilter.apply(item, this.source.filters)) {
            this.results.text.push(item);
        }
    }

    async _crawlImages(html) {
        const images = ContentParser.extractImages(html, this.source.url);
        for (const img of images) {
            const item = {
                id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                title: img.alt || '未命名图片',
                url: img.url,
                sourceUrl: this.source.url,
                sourceName: this.source.name,
                type: 'image',
                crawledAt: new Date().toISOString(),
                _collection: 'media',
            };
            this.results.images.push(item);
        }
    }

    async _crawlAudio(html) {
        const audio = ContentParser.extractAudio(html, this.source.url);
        for (const aud of audio) {
            const item = {
                id: `audio_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                title: aud.title || '未命名音频',
                url: aud.url,
                sourceUrl: this.source.url,
                sourceName: this.source.name,
                type: 'audio',
                crawledAt: new Date().toISOString(),
                _collection: 'media',
            };
            this.results.audio.push(item);
        }
    }

    async _crawlPapers(html) {
        const selector = this.source.selector || {};
        const title = ContentParser.extractBySelector(html, selector.title) || ContentParser.extractTitle(html);
        const authors = ContentParser.extractAllBySelector(html, selector.authors || '').join(', ');
        const abstract = ContentParser.extractBySelector(html, selector.abstract);
        const date = ContentParser.extractBySelector(html, selector.publishedDate);
        const pdfUrl = ContentParser.extractBySelector(html, selector.pdfUrl);

        if (!title) return;

        const item = {
            id: `paper_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: title.substring(0, 300),
            authors: authors || '未知作者',
            abstract: abstract ? abstract.substring(0, 2000) : '',
            sourceUrl: this.source.url,
            sourceName: this.source.name,
            source: this.source.name || '',
            publishedDate: date || new Date().toISOString(),
            pdfUrl: pdfUrl || '',
            category: '学术论文',
            tags: ContentParser.extractKeywords(abstract || title, 8),
            keyPoints: ContentParser.extractKeyPoints(abstract || title, 3),
            crawledAt: new Date().toISOString(),
            _collection: 'knowledge',
            _nodeType: 'paper',
        };

        if (ContentFilter.apply(item, this.source.filters)) {
            this.results.papers.push(item);
        }
    }

    async _crawlBooks(html) {
        const selector = this.source.selector || {};
        const title = ContentParser.extractBySelector(html, selector.title) || ContentParser.extractTitle(html);
        const author = ContentParser.extractBySelector(html, selector.author);
        const publisher = ContentParser.extractBySelector(html, selector.publisher);
        const summary = ContentParser.extractBySelector(html, selector.summary);
        const rating = ContentParser.extractBySelector(html, selector.rating);

        if (!title) return;

        const item = {
            id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: title.substring(0, 200),
            author: author || '未知作者',
            publisher: publisher || '',
            summary: summary ? summary.substring(0, 3000) : '',
            sourceUrl: this.source.url,
            sourceName: this.source.name,
            source: this.source.name || '',
            rating: rating || '',
            category: '心理学书籍',
            tags: ContentParser.extractKeywords(summary || title, 5),
            keyPoints: ContentParser.extractKeyPoints(summary || title, 3),
            crawledAt: new Date().toISOString(),
            _collection: 'knowledge',
            _nodeType: 'book',
        };

        if (ContentFilter.apply(item, this.source.filters)) {
            this.results.books.push(item);
        }
    }
}

// ─── 去重检查 ─────────────────────────────────────────────

async function checkDuplicates(items, collection) {
    const jsonStore = require('./jsonStore');
    const existing = await jsonStore.readData(collection);
    const existingFingerprints = new Set(
        existing.map(item => FingerprintGenerator.generateTitleFingerprint(item.title))
    );

    return items.map(item => {
        const fp = FingerprintGenerator.generateTitleFingerprint(item.title);
        const isDup = existingFingerprints.has(fp);
        return {
            ...item,
            _duplicate: isDup,
            _duplicateReason: isDup ? '标题已存在' : null,
        };
    });
}

// ─── 主入口 ───────────────────────────────────────────────

class CrawlerEngine {
    async crawlSource(source) {
        const crawler = new GenericWebCrawler(source);
        const results = await crawler.crawl();

        const allItems = [
            ...results.text,
            ...results.papers,
            ...results.books,
        ];

        const deduped = await checkDuplicates(allItems, source.category || 'knowledge');

        return {
            exercises: [],
            knowledge: deduped,
            tips: [],
            images: results.images,
            audio: results.audio,
        };
    }
}

module.exports = {
    CrawlerEngine,
    GenericWebCrawler,
    HTTPClient,
    ContentParser,
    FingerprintGenerator,
    ContentFilter,
    checkDuplicates,
};
