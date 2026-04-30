/**
 * 内容指纹生成器
 * 使用 SHA-256 哈希生成内容唯一标识，用于数据去重
 */

const crypto = require('crypto');

// 指纹配置
const FINGERPRINT_CONFIG = {
    // 指纹长度（16位hex = 64bit，适合短ID）
    fingerprintLength: 16,
    // URL指纹长度
    urlFingerprintLength: 12,
    // 标题指纹长度
    titleFingerprintLength: 8,
    // 用于生成指纹的字段
    fields: ['title', 'content', 'sourceUrl']
};

/**
 * 指纹生成器类
 */
class FingerprintGenerator {
    /**
     * 生成完整的内容指纹
     * @param {Object} data - 包含 title, content, sourceUrl 的对象
     * @returns {Object} 包含各种指纹的对象
     */
    static generate(data) {
        const { title = '', content = '', sourceUrl = '' } = data;

        return {
            // 主指纹：基于内容生成
            fingerprint: this.generateContentFingerprint(data),
            // URL指纹
            urlFingerprint: this.generateUrlFingerprint(sourceUrl),
            // 标题指纹
            titleFingerprint: this.generateTitleFingerprint(title),
            // 组合指纹（用于增强去重）
            compositeFingerprint: this.generateCompositeFingerprint(data)
        };
    }

    /**
     * 生成内容指纹（主要去重依据）
     * 策略：结合标题 + 内容前500字 + 来源URL
     * @param {Object} data
     * @returns {string} 16位十六进制指纹
     */
    static generateContentFingerprint(data) {
        const { title = '', content = '', sourceUrl = '' } = data;

        // 规范化内容：去除多余空白、特殊字符
        const normalizedContent = this.normalizeText(content);
        const normalizedTitle = this.normalizeText(title);

        // 取内容前500字 + 标题 + URL
        const contentPrefix = normalizedContent.substring(0, 500);
        const fingerprintSource = `${normalizedTitle}|${contentPrefix}|${sourceUrl}`;

        return this.hash(fingerprintSource);
    }

    /**
     * 生成URL指纹
     * @param {string} url
     * @returns {string}
     */
    static generateUrlFingerprint(url) {
        if (!url) return '';
        const normalized = this.normalizeUrl(url);
        return this.hash(normalized, FINGERPRINT_CONFIG.urlFingerprintLength);
    }

    /**
     * 生成标题指纹
     * @param {string} title
     * @returns {string}
     */
    static generateTitleFingerprint(title) {
        if (!title) return '';
        const normalized = this.normalizeText(title);
        return this.hash(normalized, FINGERPRINT_CONFIG.titleFingerprintLength);
    }

    /**
     * 生成组合指纹（用于精确匹配）
     * @param {Object} data
     * @returns {string}
     */
    static generateCompositeFingerprint(data) {
        const contentFp = this.generateContentFingerprint(data);
        const urlFp = this.generateUrlFingerprint(data.sourceUrl || '');
        const titleFp = this.generateTitleFingerprint(data.title || '');
        return `${contentFp}_${urlFp}_${titleFp}`;
    }

    /**
     * 计算字符串哈希
     * @param {string} input
     * @param {number} length - 截取长度，默认16位
     * @returns {string}
     */
    static hash(input, length = FINGERPRINT_CONFIG.fingerprintLength) {
        const normalized = this.normalizeText(input);
        const fullHash = crypto
            .createHash('sha256')
            .update(normalized)
            .digest('hex');
        return fullHash.substring(0, length);
    }

    /**
     * 规范化文本（用于哈希计算）
     * @param {string} text
     * @returns {string}
     */
    static normalizeText(text) {
        if (!text) return '';
        return text
            // Unicode正规化
            .normalize('NFC')
            // 移除多余空白
            .replace(/\s+/g, ' ')
            // 转小写
            .toLowerCase()
            // 移除常见HTML实体
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            // 移除特殊字符（保留中文、英文、数字、基础标点）
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?;:、。，！？；：''""（）【】()[\]（）]/g, '')
            .trim();
    }

    /**
     * 规范化URL
     * @param {string} url
     * @returns {string}
     */
    static normalizeUrl(url) {
        if (!url) return '';
        try {
            const parsed = new URL(url);
            // 移除查询参数和锚点（它们不重要）
            return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.toLowerCase();
        } catch {
            return url.toLowerCase();
        }
    }

    /**
     * 快速检查两个对象是否可能重复
     * @param {Object} data1
     * @param {Object} data2
     * @returns {boolean}
     */
    static isLikelyDuplicate(data1, data2) {
        // 检查标题是否相同
        const title1 = this.normalizeText(data1.title || '');
        const title2 = this.normalizeText(data2.title || '');
        if (title1 && title2 && title1 === title2) {
            return true;
        }

        // 检查URL是否相同
        const url1 = this.normalizeUrl(data1.sourceUrl || data1.url || '');
        const url2 = this.normalizeUrl(data2.sourceUrl || data2.url || '');
        if (url1 && url2 && url1 === url2) {
            return true;
        }

        return false;
    }

    /**
     * 为爬取项目生成唯一ID
     * 格式：{prefix}_{fingerprint}_{timestamp}
     * @param {Object} data - 包含 type, title 等字段
     * @param {string} prefix - ID前缀，如 'exercise', 'knowledge'
     * @returns {string}
     */
    static generateId(data, prefix = 'item') {
        const fp = this.generateContentFingerprint(data);
        const timestamp = Date.now();
        return `${prefix}_${fp}_${timestamp}`;
    }

    /**
     * 从已存在的ID中提取指纹
     * @param {string} id - 格式如 'exercise_a1b2c3d4e5f6_1234567890'
     * @returns {string|null} 指纹部分或null
     */
    static extractFingerprintFromId(id) {
        if (!id) return null;
        const match = id.match(/^[a-z_]+_([a-z0-9]+)_\d+$/);
        return match ? match[1] : null;
    }
}

module.exports = FingerprintGenerator;
