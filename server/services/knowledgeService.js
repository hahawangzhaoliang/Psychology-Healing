/**
 * 知识库自动更新服务 v4.0（Vercel Blob 版）
 * 职责：增量同步预定义知识 + 触发爬虫 + 生成每日提示
 * 数据存储：Vercel Blob（通过 jsonStore 封装）
 *
 * 核心优化：
 *  - 完全移除 Upstash Search 依赖
 *  - titleIndex 初始化 bug 已修复
 *  - 四个 addXxx 方法提取公共逻辑，消除重复代码
 *  - PREDEFINED_KNOWLEDGE 迁移至 server/data/predefined-knowledge.js
 */

const jsonStore = require('./jsonStore');
const blobStore = require('./blobStore');
const { PsychologyCrawler, FingerprintGenerator } = require('./crawler');
const PREDEFINED = require('../data/predefined-knowledge');

// Upstash 集合名 → jsonStore 集合名映射
const UPSTASH_TO_STORE = {
    healingExercises:   'exercises',
    psychologyKnowledge: 'knowledge',
    emotionRegulation:  'regulation',
    dailyTips:          'tips',
};

// 集合配置
const COLLECTION_CONFIG = {
    exercises: {
        storeKey:  'exercises',
        titleKey:  'title',
        contentKey: data => data.description || data.content || '',
    },
    knowledge: {
        storeKey:  'knowledge',
        titleKey:  'title',
        contentKey: data => data.content || '',
    },
    regulation: {
        storeKey:  'regulation',
        titleKey:  data => data.title || data.emotion,
        contentKey: data => JSON.stringify(data.methods || []),
    },
    tips: {
        storeKey:  'tips',
        titleKey:  '',
        contentKey: data => data.content || '',
    },
};

// ─── 数据源元信息（供 API 展示，不用于爬取）─────────────────────

const DATA_SOURCES = {
    domestic: [
        { name: '中国科学院心理研究所', shortName: '中科院心理所', url: 'http://www.psych.ac.cn/xwzx/kyjz/', type: 'research', credibility: 'high', categories: ['研究进展', '心理健康', '认知科学'] },
        { name: '中国心理学会', shortName: '中国心理学会', url: 'http://www.cpsbeijing.org/', type: 'organization', credibility: 'high', categories: ['行业动态', '学术资讯', '心理健康'] },
        { name: '国家心理健康网', shortName: '国家心理健康网', url: 'http://www.nimh.org.cn/', type: 'government', credibility: 'high', categories: ['政策法规', '健康科普', '心理服务'] },
        { name: '北京师范大学心理学部', shortName: '北师大心理', url: 'https://psych.bnu.edu.cn/', type: 'academic', credibility: 'high', categories: ['学术研究', '人才培养', '社会服务'] },
        { name: '北京大学心理与认知科学学院', shortName: '北大心理', url: 'https://www.psy.pku.edu.cn/', type: 'academic', credibility: 'high', categories: ['科研成果', '学术交流', '心理健康'] },
    ],
    international: [
        { name: 'Nature Psychology', shortName: 'Nature', url: 'https://www.nature.com/npsych/', type: 'journal', credibility: 'highest', categories: ['研究论文', '综述', '评论'] },
        { name: 'American Psychological Association', shortName: 'APA', url: 'https://www.apa.org/', type: 'organization', credibility: 'highest', categories: ['心理学新闻', '研究概要', '实践指南'] },
        { name: 'Psychology Today', shortName: 'PsychToday', url: 'https://www.psychologytoday.com/', type: 'media', credibility: 'medium', categories: ['心理健康', '治疗', '心理科普'] },
        { name: 'World Psychiatry', shortName: 'WorldPsych', url: 'https://www.wpanet.org/', type: 'journal', credibility: 'highest', categories: ['精神医学', '全球心理健康', '研究综述'] },
    ],
};

// ─── 知识库管理器 ─────────────────────────────────────────────

class KnowledgeManager {
    constructor() {
        this.knowledgeBase = null;
        this.updateLog = [];

        // 三种去重索引（均作为实例属性声明，避免 titleIndex 未定义 bug）
        this.fingerprintIndex = new Map();
        this.urlIndex = new Map();
        this.titleIndex = new Map();
    }

    // ── 加载 & 索引 ──────────────────────────────────────────

    async loadKnowledgeBase() {
        try {
            const [exercises, knowledge, regulations, tips] = await Promise.all([
                jsonStore.readData('exercises'),
                jsonStore.readData('knowledge'),
                jsonStore.readData('regulation'),
                jsonStore.readData('tips'),
            ]);

            this.knowledgeBase = {
                exercises:   exercises   || [],
                knowledge:   knowledge   || [],
                regulation:  regulations || [],
                tips:        tips        || [],
            };

            this._buildIndexes();
            this._logCounts();
            return this.knowledgeBase;
        } catch (error) {
            console.error('加载知识库失败:', error.message);
            this.knowledgeBase = {
                exercises:  [],
                knowledge:  [],
                regulation: [],
                tips:       [],
            };
            return this.knowledgeBase;
        }
    }

    _logCounts() {
        const kb = this.knowledgeBase;
        console.log('✓ 知识库加载成功（Blob）');
        console.log(`  疗愈练习: ${kb.exercises.length} 条`);
        console.log(`  心理知识: ${kb.knowledge.length} 条`);
        console.log(`  情绪调节: ${kb.regulation.length} 条`);
        console.log(`  每日提示: ${kb.tips.length} 条`);
    }

    _buildIndexes() {
        this.fingerprintIndex.clear();
        this.urlIndex.clear();
        this.titleIndex.clear();

        const collections = ['exercises', 'knowledge', 'regulation', 'tips'];

        for (const coll of collections) {
            for (const item of (this.knowledgeBase[coll] || [])) {
                const ref = `${coll}:${item.id}`;

                if (item.fingerprint) {
                    this.fingerprintIndex.set(item.fingerprint, ref);
                }

                const url = item.sourceUrl || item.url;
                if (url) this.urlIndex.set(url, ref);

                if (item.title) {
                    const titleHash = FingerprintGenerator.generateTitleFingerprint(item.title);
                    this.titleIndex.set(titleHash, ref);
                }
            }
        }

        console.log(`  ✓ 索引构建完成: ${this.fingerprintIndex.size} 指纹, ${this.urlIndex.size} URL, ${this.titleIndex.size} 标题`);
    }

    // ── 去重检查 ──────────────────────────────────────────────

    /**
     * 智能去重：URL → 指纹 → 标题+内容
     */
    checkDuplicate(data) {
        const { title, content, sourceUrl } = data;

        if (sourceUrl && this.urlIndex.has(sourceUrl)) {
            return { isDuplicate: true, reason: 'URL已存在', existingId: this.urlIndex.get(sourceUrl) };
        }

        const fingerprint = FingerprintGenerator.generateContentFingerprint(data);
        if (this.fingerprintIndex.has(fingerprint)) {
            return { isDuplicate: true, reason: '指纹重复', existingId: this.fingerprintIndex.get(fingerprint) };
        }

        if (title) {
            const titleHash = FingerprintGenerator.generateTitleFingerprint(title);
            const existingRef = this.titleIndex.get(titleHash);
            if (existingRef) {
                const [coll, id] = existingRef.split(':');
                const existingItem = this.knowledgeBase[coll]?.find(i => i.id === id);
                if (existingItem?.content && content) {
                    if (existingItem.content.substring(0, 200) === content.substring(0, 200)) {
                        return { isDuplicate: true, reason: '内容完全相同', existingId: existingRef };
                    }
                }
            }
        }

        return { isDuplicate: false, reason: '新内容', existingId: null };
    }

    _isIdExists(collection, id) {
        return this.knowledgeBase[collection]?.some(item => item.id === id) ?? false;
    }

    // ── 通用插入（DRY 核心）─────────────────────────────────────

    /**
     * 通用增量插入
     * @param {string} collection - 集合名称（jsonStore key）
     * @param {Object} item       - 要插入的条目
     * @param {Object} fpInput    - 指纹计算的输入 { title, content, sourceUrl }
     * @param {string} logKey     - 日志用的描述字段名
     */
    async _addItem(collection, item, fpInput, logKey) {
        // 1. 去重检查
        const dup = this.checkDuplicate(fpInput);
        if (dup.isDuplicate) {
            return { added: false, reason: dup.reason, existingId: dup.existingId };
        }

        // 2. ID 检查
        if (item.id && this._isIdExists(collection, item.id)) {
            return { added: false, reason: 'ID已存在' };
        }

        // 3. 生成指纹并附加
        const fingerprint = FingerprintGenerator.generateContentFingerprint(fpInput);
        const newItem = { ...item, fingerprint, createdAt: new Date().toISOString() };

        // 4. 写入内存 + 持久化（Blob）
        this.knowledgeBase[collection].push(newItem);
        await jsonStore.insert(collection, newItem);

        // 5. 更新索引
        this.fingerprintIndex.set(fingerprint, `${collection}:${newItem.id}`);
        if (newItem.sourceUrl) this.urlIndex.set(newItem.sourceUrl, `${collection}:${newItem.id}`);
        if (newItem.title) {
            const titleHash = FingerprintGenerator.generateTitleFingerprint(newItem.title);
            this.titleIndex.set(titleHash, `${collection}:${newItem.id}`);
        }

        return { added: true, [logKey]: item[logKey] || item.id, fingerprint };
    }

    // ── 业务插入接口 ──────────────────────────────────────────

    async addHealingExercise(exercise) {
        return this._addItem(
            'exercises',
            exercise,
            { title: exercise.title, content: exercise.description || exercise.content || '', sourceUrl: exercise.sourceUrl },
            'title'
        );
    }

    async addPsychologyKnowledge(knowledge) {
        return this._addItem(
            'knowledge',
            knowledge,
            { title: knowledge.title, content: knowledge.content || '', sourceUrl: knowledge.sourceUrl },
            'title'
        );
    }

    async addEmotionRegulation(regulation) {
        return this._addItem(
            'regulation',
            regulation,
            {
                title: regulation.title || regulation.emotion,
                content: JSON.stringify(regulation.methods || []),
                sourceUrl: regulation.sourceUrl,
            },
            'emotion'
        );
    }

    async addDailyTip(tip) {
        return this._addItem(
            'tips',
            tip,
            { title: '', content: tip.content || '', sourceUrl: tip.sourceUrl },
            'content'
        );
    }

    // ── 统计 ──────────────────────────────────────────────────

    getStatistics() {
        const kb = this.knowledgeBase;
        return {
            totalItems: kb.exercises.length + kb.knowledge.length +
                        kb.regulation.length + kb.tips.length,
            exercises:         kb.exercises.length,
            knowledge:         kb.knowledge.length,
            regulations:       kb.regulation.length,
            tips:              kb.tips.length,
            indexedFingerprints: this.fingerprintIndex.size,
            indexedUrls:       this.urlIndex.size,
            updateLog:         this.updateLog,
        };
    }
}

// ─── 知识同步器 ───────────────────────────────────────────────

class KnowledgeSyncer {
    constructor(manager) {
        this.manager = manager;
    }

    async _syncCollection(items, addFn, label) {
        let added = 0;
        for (const item of items) {
            const result = await addFn.call(this.manager, item);
            if (result.added) {
                added++;
                const desc = result.title || result.emotion || '';
                if (desc) console.log(`  + ${label}: ${desc}`);
            }
        }
        return { total: items.length, added };
    }

    async syncHealingExercises()   { return this._syncCollection(PREDEFINED.healingExercises,   this.manager.addHealingExercise,   '练习'); }
    async syncPsychologyKnowledge(){ return this._syncCollection(PREDEFINED.psychologyKnowledge, this.manager.addPsychologyKnowledge,'知识'); }
    async syncEmotionRegulation()  { return this._syncCollection(PREDEFINED.emotionRegulation,   this.manager.addEmotionRegulation,  '情绪调节'); }
    async syncDailyTips()          { return this._syncCollection(PREDEFINED.dailyTips,           this.manager.addDailyTip,           '提示'); }
}

// ─── 每日内容生成器 ───────────────────────────────────────────

const TIP_TEMPLATES = [
    { content: '每天花{time}专注于{activity}，让{benefit}', category: '正念' },
    { content: '当{emotion}出现时，尝试{method}，避免{negative}', category: '认知调节' },
    { content: '{quote}——{author}', category: '心理学名言' },
];

const TIP_FILLERS = {
    time:     ['5分钟', '10分钟', '15分钟'],
    activity: ['呼吸', '冥想', '散步', '写日记'],
    benefit:  ['大脑获得休息', '情绪更加稳定', '压力得到释放'],
    emotion:  ['负面想法', '焦虑', '低落情绪'],
    method:   ['用"观察者视角"分析', '深呼吸三次', '和朋友聊聊'],
    negative: ['全盘否定自己', '陷入负面循环', '过度担忧'],
    quote: [
        '重要的不是过去发生了什么，而是你赋予它什么意义',
        '我无法选择起点，但能决定奔跑的方向',
        '允许自己有时候不坚强，也是一种勇气',
        '改变始于接纳',
        '每一次呼吸都是新的开始',
    ],
    author: ['阿德勒', '心理学家', '心晴空间'],
};

class AIContentGenerator {
    generateDailyTips(count = 3) {
        const tips = [];
        const now = Date.now();

        for (let i = 0; i < count; i++) {
            const template = TIP_TEMPLATES[Math.floor(Math.random() * TIP_TEMPLATES.length)];
            let content = template.content;

            for (const [key, values] of Object.entries(TIP_FILLERS)) {
                if (content.includes(`{${key}}`)) {
                    content = content.replace(`{${key}}`, values[Math.floor(Math.random() * values.length)]);
                }
            }

            tips.push({
                id: `tip_gen_${now}_${i}`,
                content,
                category: template.category,
                suitableTime: '随时',
                source: 'AI生成',
            });
        }

        return tips;
    }
}

// ─── 仅运行爬虫，返回结果（不自动入库）────────────────────
// source: 'all' | 'domestic' | 'international'
async function runCrawler(source = 'all') {
    const crawler = new PsychologyCrawler();

    // 根据 source 参数过滤数据源
    if (source !== 'all') {
        crawler.sources = DATA_SOURCES[source] || [];
        console.log(`[Crawler] 仅爬取来源: ${source}，共 ${crawler.sources.length} 个数据源`);
    }

    const crawlData = await crawler.crawl();

    // 为每条结果附加"是否已存在"标记，方便管理员判断
    const manager = new KnowledgeManager();
    await manager.loadKnowledgeBase();

    const markDuplicates = (items, collection) => {
        return items.map(item => {
            const dup = manager.checkDuplicate({
                title: item.title || '',
                content: item.content || item.description || '',
                sourceUrl: item.sourceUrl || item.url || '',
            });
            return {
                ...item,
                _duplicate: dup.isDuplicate,
                _duplicateReason: dup.reason,
                _collection: collection,
            };
        });
    };

    return {
        exercises: markDuplicates(crawlData.exercises || [], 'exercises'),
        knowledge: markDuplicates(crawlData.knowledge || [], 'knowledge'),
        tips:      markDuplicates(crawlData.tips      || [], 'tips'),
        timestamp: new Date().toISOString(),
    };
}

// ─── 主更新函数（写入 Vercel Blob）────────────────────────────

async function updateKnowledge() {
    const startTime = Date.now();

    console.log('\n========================================');
    console.log('📚 知识库更新（Vercel Blob 模式）');
    console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('========================================\n');

    const generator = new AIContentGenerator();

    // 集合映射：jsonStore key → 预定义数据
    const collectionMapping = {
        exercises:  PREDEFINED.healingExercises,
        knowledge:  PREDEFINED.psychologyKnowledge,
        regulation: PREDEFINED.emotionRegulation,
        tips:       PREDEFINED.dailyTips,
    };

    const results = {};

    // 1. 合并预定义数据 + 去重写入 Blob
    for (const [storeKey, predefinedItems] of Object.entries(collectionMapping)) {
        const existing = await jsonStore.readData(storeKey);
        const existingIds = new Set(existing.map(item => item.id));
        const existingTitles = new Set(existing.map(item => item.title?.trim()).filter(Boolean));

        let added = 0;
        for (const item of predefinedItems) {
            if (!existingIds.has(item.id) && !existingTitles.has(item.title?.trim())) {
                existing.push({
                    ...item,
                    source: item.source || '预定义知识库',
                    imported_at: new Date().toISOString(),
                });
                added++;
            }
        }
        await jsonStore.writeData(storeKey, existing);
        results[storeKey] = { total: existing.length, added };
        console.log(`  ✓ ${storeKey}: 现有 ${existing.length} 条，新增 +${added}`);
    }

    // 2. 生成每日新提示（避免重复）
    const existingTips = await jsonStore.readData('tips');
    const existingTipContents = new Set(existingTips.map(t => t.content?.trim()).filter(Boolean));
    const newTips = generator.generateDailyTips(3).filter(t => !existingTipContents.has(t.content?.trim()));

    for (const tip of newTips) {
        existingTips.push({
            ...tip,
            id: `tip_gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            source: 'AI 生成',
            imported_at: new Date().toISOString(),
        });
        console.log(`  + 新提示: ${tip.content.substring(0, 40)}...`);
    }

    if (newTips.length > 0) {
        await jsonStore.writeData('tips', existingTips);
        results.tips = results.tips || { total: 0, added: 0 };
        results.tips.added += newTips.length;
        results.tips.total = existingTips.length;
    }



    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const total = Object.values(results).reduce((sum, r) => sum + r.total, 0);

    console.log('\n========================================');
    console.log('📊 更新统计:');
    console.log(`  exercises:  ${results.exercises.total} 条（新增 +${results.exercises.added}）`);
    console.log(`  knowledge:  ${results.knowledge.total} 条（新增 +${results.knowledge.added}）`);
    console.log(`  regulation: ${results.regulation.total} 条（新增 +${results.regulation.added}）`);
    console.log(`  tips:       ${results.tips.total} 条（新增 +${results.tips.added}）`);
    console.log(`  总计:       ${total} 条`);
    console.log(`  耗时:       ${duration}秒`);
    console.log('========================================\n');

    return results;
}

function getDataSources() {
    return DATA_SOURCES;
}

// ─── 导出 ─────────────────────────────────────────────────────

module.exports = {
    KnowledgeManager,
    KnowledgeSyncer,
    AIContentGenerator,
    updateKnowledge,
    runCrawler,
    getDataSources,
    DATA_SOURCES,
    // 向后兼容：旧代码若引用 PREDEFINED_KNOWLEDGE 不报错
    PREDEFINED_KNOWLEDGE: PREDEFINED,
};

if (require.main === module) {
    updateKnowledge().catch(console.error);
}
