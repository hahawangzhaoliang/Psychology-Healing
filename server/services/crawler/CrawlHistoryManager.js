/**
 * 爬取历史管理器
 * 跟踪已爬取的URL和内容指纹状态，支持增量爬取
 */

const fs = require('fs');
const path = require('path');
const FingerprintGenerator = require('./FingerprintGenerator');

// 历史记录文件路径
const HISTORY_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const HISTORY_FILE = path.join(HISTORY_DIR, 'crawl_history.json');

/**
 * 爬取状态枚举
 */
const CrawlStatus = {
    PENDING: 'pending',           // 待爬取
    IN_PROGRESS: 'in_progress',   // 爬取中
    SUCCESS: 'success',           // 成功
    FAILED: 'failed',             // 失败
    SKIPPED: 'skipped'            // 跳过（已存在）
};

/**
 * 爬取历史管理器类
 */
class CrawlHistoryManager {
    constructor() {
        // 内存缓存：Map<url, historyRecord>
        this.cache = new Map();
        // 指纹到URL的映射：Map<fingerprint, url>
        this.fingerprintIndex = new Map();
        // 脏标记（有修改需要保存）
        this.dirty = false;
        // 加载历史记录
        this.load();
    }

    /**
     * 加载历史记录
     */
    load() {
        try {
            if (fs.existsSync(HISTORY_FILE)) {
                const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
                const data = JSON.parse(content);

                // 重建内存索引
                if (Array.isArray(data)) {
                    data.forEach(record => {
                        if (record.url) {
                            this.cache.set(this.normalizeUrl(record.url), record);
                            if (record.fingerprint) {
                                this.fingerprintIndex.set(record.fingerprint, record.url);
                            }
                        }
                    });
                }

                console.log(`✓ 加载爬取历史: ${this.cache.size} 条记录`);
            }
        } catch (error) {
            console.error('加载爬取历史失败:', error.message);
        }
    }

    /**
     * 保存历史记录到文件
     */
    save() {
        if (!this.dirty) return;

        try {
            // 确保目录存在
            if (!fs.existsSync(HISTORY_DIR)) {
                fs.mkdirSync(HISTORY_DIR, { recursive: true });
            }

            const records = Array.from(this.cache.values());
            const content = JSON.stringify(records, null, 2);

            // 原子写入
            fs.writeFileSync(HISTORY_FILE + '.tmp', content, 'utf-8');
            fs.renameSync(HISTORY_FILE + '.tmp', HISTORY_FILE);

            this.dirty = false;
            console.log(`✓ 保存爬取历史: ${records.length} 条记录`);
        } catch (error) {
            console.error('保存爬取历史失败:', error.message);
        }
    }

    /**
     * 规范化URL
     */
    normalizeUrl(url) {
        return FingerprintGenerator.normalizeUrl(url);
    }

    /**
     * 检查URL是否已爬取
     * @param {string} url
     * @returns {boolean}
     */
    hasCrawled(url) {
        const normalized = this.normalizeUrl(url);
        const record = this.cache.get(normalized);
        return record && record.status === CrawlStatus.SUCCESS;
    }

    /**
     * 检查内容指纹是否已存在
     * @param {string} fingerprint
     * @returns {boolean}
     */
    hasFingerprint(fingerprint) {
        return this.fingerprintIndex.has(fingerprint);
    }

    /**
     * 检查URL并获取其记录
     * @param {string} url
     * @returns {Object|null}
     */
    getRecord(url) {
        const normalized = this.normalizeUrl(url);
        return this.cache.get(normalized) || null;
    }

    /**
     * 检查数据是否需要更新
     * @param {Object} data - 包含 sourceUrl, content, title 的对象
     * @returns {Object} { needCrawl: boolean, needUpdate: boolean, reason: string }
     */
    checkNeedCrawl(data) {
        const { sourceUrl, content, title } = data;
        const normalizedUrl = this.normalizeUrl(sourceUrl);
        const record = this.cache.get(normalizedUrl);

        // URL从未爬取
        if (!record) {
            return {
                needCrawl: true,
                needUpdate: false,
                reason: 'URL未爬取'
            };
        }

        // URL爬取失败，允许重试
        if (record.status === CrawlStatus.FAILED) {
            return {
                needCrawl: true,
                needUpdate: false,
                reason: '上次爬取失败，允许重试'
            };
        }

        // URL爬取成功，检查指纹
        if (record.status === CrawlStatus.SUCCESS) {
            const currentFingerprint = FingerprintGenerator.generateContentFingerprint({
                title: title || '',
                content: content || '',
                sourceUrl: sourceUrl
            });

            // 指纹相同，内容未变
            if (record.fingerprint === currentFingerprint) {
                return {
                    needCrawl: false,
                    needUpdate: false,
                    reason: '内容未变化'
                };
            }

            // 指纹不同，内容已更新
            return {
                needCrawl: false,
                needUpdate: true,
                reason: '内容已更新，需要刷新',
                oldFingerprint: record.fingerprint,
                newFingerprint: currentFingerprint
            };
        }

        return {
            needCrawl: true,
            needUpdate: false,
            reason: '未知状态'
        };
    }

    /**
     * 记录爬取开始
     * @param {string} url
     */
    markCrawling(url) {
        const normalized = this.normalizeUrl(url);
        const existing = this.cache.get(normalized);

        const record = {
            url: normalized,
            status: CrawlStatus.IN_PROGRESS,
            startTime: new Date().toISOString(),
            attempts: (existing?.attempts || 0) + 1
        };

        this.cache.set(normalized, record);
        this.dirty = true;
    }

    /**
     * 记录爬取成功
     * @param {string} url
     * @param {Object} data - 包含 title, content
     */
    markSuccess(url, data) {
        const normalized = this.normalizeUrl(url);
        const fingerprint = FingerprintGenerator.generateContentFingerprint({
            title: data.title || '',
            content: data.content || '',
            sourceUrl: url
        });

        const existing = this.cache.get(normalized);

        const record = {
            url: normalized,
            status: CrawlStatus.SUCCESS,
            fingerprint,
            title: data.title || '',
            successTime: new Date().toISOString(),
            startTime: existing?.startTime || new Date().toISOString(),
            attempts: existing?.attempts || 1,
            duration: existing?.startTime
                ? Date.now() - new Date(existing.startTime).getTime()
                : 0
        };

        // 更新索引
        this.cache.set(normalized, record);
        if (fingerprint) {
            this.fingerprintIndex.set(fingerprint, normalized);
        }
        this.dirty = true;
    }

    /**
     * 记录爬取失败
     * @param {string} url
     * @param {string} error - 错误信息
     */
    markFailed(url, error = '') {
        const normalized = this.normalizeUrl(url);
        const existing = this.cache.get(normalized);

        const record = {
            url: normalized,
            status: CrawlStatus.FAILED,
            error: error.substring(0, 200),
            failedTime: new Date().toISOString(),
            startTime: existing?.startTime,
            attempts: (existing?.attempts || 0) + 1
        };

        this.cache.set(normalized, record);
        this.dirty = true;
    }

    /**
     * 记录跳过（内容已存在）
     * @param {string} url
     * @param {string} fingerprint
     */
    markSkipped(url, fingerprint) {
        const normalized = this.normalizeUrl(url);

        const record = {
            url: normalized,
            status: CrawlStatus.SKIPPED,
            fingerprint,
            skippedTime: new Date().toISOString()
        };

        this.cache.set(normalized, record);
        this.dirty = true;
    }

    /**
     * 获取统计信息
     * @returns {Object}
     */
    getStats() {
        const stats = {
            total: this.cache.size,
            success: 0,
            failed: 0,
            pending: 0,
            inProgress: 0,
            skipped: 0,
            lastCrawlTime: null,
            successRate: 0
        };

        let lastSuccess = null;

        this.cache.forEach(record => {
            switch (record.status) {
                case CrawlStatus.SUCCESS:
                    stats.success++;
                    if (!lastSuccess || record.successTime > lastSuccess) {
                        lastSuccess = record.successTime;
                    }
                    break;
                case CrawlStatus.FAILED:
                    stats.failed++;
                    break;
                case CrawlStatus.PENDING:
                    stats.pending++;
                    break;
                case CrawlStatus.IN_PROGRESS:
                    stats.inProgress++;
                    break;
                case CrawlStatus.SKIPPED:
                    stats.skipped++;
                    break;
            }
        });

        stats.lastCrawlTime = lastSuccess;
        stats.successRate = stats.total > 0
            ? ((stats.success / stats.total) * 100).toFixed(1) + '%'
            : '0%';

        return stats;
    }

    /**
     * 获取最近N条成功记录
     * @param {number} limit
     * @returns {Array}
     */
    getRecentSuccess(limit = 10) {
        const records = Array.from(this.cache.values())
            .filter(r => r.status === CrawlStatus.SUCCESS)
            .sort((a, b) => {
                const timeA = a.successTime || a.startTime || '';
                const timeB = b.successTime || b.startTime || '';
                return timeB.localeCompare(timeA);
            })
            .slice(0, limit);

        return records;
    }

    /**
     * 清理过期记录
     * @param {number} days - 保留最近多少天的记录
     */
    cleanup(days = 30) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        let removed = 0;

        this.cache.forEach((record, url) => {
            const time = record.successTime || record.failedTime || record.startTime;
            if (time && new Date(time).getTime() < cutoff) {
                // 只清理失败记录
                if (record.status === CrawlStatus.FAILED) {
                    this.cache.delete(url);
                    if (record.fingerprint) {
                        this.fingerprintIndex.delete(record.fingerprint);
                    }
                    removed++;
                }
            }
        });

        if (removed > 0) {
            this.dirty = true;
            this.save();
            console.log(`✓ 清理过期记录: ${removed} 条`);
        }

        return removed;
    }

    /**
     * 导出所有URL列表
     * @param {string} status - 可选，按状态筛选
     * @returns {Array}
     */
    exportUrls(status = null) {
        const records = Array.from(this.cache.values());
        if (status) {
            return records
                .filter(r => r.status === status)
                .map(r => r.url);
        }
        return records.map(r => r.url);
    }

    /**
     * 批量检查URL是否已爬取
     * @param {Array<string>} urls
     * @returns {Map<string, boolean>}
     */
    batchCheck(urls) {
        const result = new Map();
        urls.forEach(url => {
            result.set(url, this.hasCrawled(url));
        });
        return result;
    }

    /**
     * 析构函数，确保数据保存
     */
    destroy() {
        if (this.dirty) {
            this.save();
        }
    }
}

// 创建单例实例
const historyManager = new CrawlHistoryManager();

// 确保进程退出时保存
process.on('exit', () => {
    historyManager.destroy();
});

process.on('SIGINT', () => {
    historyManager.destroy();
    process.exit(0);
});

module.exports = {
    CrawlHistoryManager,
    CrawlStatus,
    historyManager
};
