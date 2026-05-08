/**
 * 知识库自动更新服务 v3.0
 * 职责：增量同步预定义知识 + 触发爬虫 + 生成每日提示
 * 核心优化：
 *  - titleIndex 初始化 bug 修复（原版 titleIndex 未作为实例属性声明）
 *  - 四个 addXxx 方法提取公共逻辑，消除 ~150 行重复代码
 *  - PREDEFINED_KNOWLEDGE 迁移至 server/data/predefined-knowledge.js
 */

const { insert, find } = require('../config/upstash');
const { PsychologyCrawler, FingerprintGenerator } = require('./crawler');
const PREDEFINED = require('../data/predefined-knowledge');

// ─── 数据源元信息（供 API 展示，不用于爬取） ─────────────────────

const DATA_SOURCES = {
    domestic: [
        { name: '中国科学院心理研究所', shortName: '中科院心理所', url: 'http://www.psych.ac.cn/xwzx/kyjz/', type: 'research', credibility: 'high', categories: ['研究进展', '心理健康', '认知科学'] },
        { name: '中国心理学会', shortName: '中国心理学会', url: 'http://www.cpsbeijing.org/', type: 'organization', credibility: 'high', categories: ['行业动态', '学术资讯', '心理健康'] },
        { name: '国家心理健康网', shortName: '国家心理健康网', url: 'http://www.nimh.org.cn/', type: 'government', credibility: 'high', categories: ['政策法规', '健康科普', '心理服务'] },
        { name: '北京师范大学心理学部', shortName: '北师大心理', url: 'https://psych.bnu.edu.cn/', type: 'academic', credibility: 'high', categories: ['学术研究', '人才培养', '社会服务'] },
        { name: '北京大学心理与认知科学学院', shortName: '北大心理', url: 'https://www.psy.pku.edu.cn/', type: 'academic', credibility: 'high', categories: ['科研成果', '学术交流', '心理健康'] }
    ],
    international: [
        { name: 'Nature Psychology', shortName: 'Nature', url: 'https://www.nature.com/npsych/', type: 'journal', credibility: 'highest', categories: ['研究论文', '综述', '评论'] },
        { name: 'American Psychological Association', shortName: 'APA', url: 'https://www.apa.org/', type: 'organization', credibility: 'highest', categories: ['心理学新闻', '研究概要', '实践指南'] },
        { name: 'Psychology Today', shortName: 'PsychToday', url: 'https://www.psychologytoday.com/', type: 'media', credibility: 'medium', categories: ['心理健康', '治疗', '心理科普'] },
        { name: 'World Psychiatry', shortName: 'WorldPsych', url: 'https://www.wpanet.org/', type: 'journal', credibility: 'highest', categories: ['精神医学', '全球心理健康', '研究综述'] }
    ]
};

// 集合名称与字段映射
const COLLECTION_CONFIG = {
    healingExercises: {
        collection: 'healingExercises',
        titleKey: 'title',
        contentKey: data => data.description || data.content || ''
    },
    psychologyKnowledge: {
        collection: 'psychologyKnowledge',
        titleKey: 'title',
        contentKey: data => data.content || ''
    },
    emotionRegulation: {
        collection: 'emotionRegulation',
        titleKey: data => data.title || data.emotion,
        contentKey: data => JSON.stringify(data.methods || [])
    },
    dailyTips: {
        collection: 'dailyTips',
        titleKey: '',   // tips 不按标题去重
        contentKey: data => data.content || ''
    }
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

    // ── 加载 & 索引 ───────────────────────────────────────────

    async loadKnowledgeBase() {
        try {
            const [exercises, knowledge, regulations, tips] = await Promise.all([
                find('healingExercises'),
                find('psychologyKnowledge'),
                find('emotionRegulation'),
                find('dailyTips')
            ]);

            this.knowledgeBase = {
                healingExercises:  exercises   || [],
                psychologyKnowledge: knowledge || [],
                emotionRegulation: regulations || [],
                dailyTips: tips               || []
            };

            this._buildIndexes();

            this._logCounts();
            return this.knowledgeBase;
        } catch (error) {
            console.error('加载知识库失败:', error.message);
            this.knowledgeBase = {
                healingExercises: [],
                psychologyKnowledge: [],
                emotionRegulation: [],
                dailyTips: []
            };
            return this.knowledgeBase;
        }
    }

    _logCounts() {
        const kb = this.knowledgeBase;
        console.log('✓ 知识库加载成功');
        console.log(`  疗愈练习: ${kb.healingExercises.length} 条`);
        console.log(`  心理知识: ${kb.psychologyKnowledge.length} 条`);
        console.log(`  情绪调节: ${kb.emotionRegulation.length} 条`);
        console.log(`  每日提示: ${kb.dailyTips.length} 条`);
    }

    _buildIndexes() {
        this.fingerprintIndex.clear();
        this.urlIndex.clear();
        this.titleIndex.clear();

        const collections = ['healingExercises', 'psychologyKnowledge', 'emotionRegulation', 'dailyTips'];

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

    // ── 通用插入（DRY 核心） ──────────────────────────────────

    /**
     * 通用增量插入
     * @param {string} collection - 集合名称
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

        // 4. 写入内存 + 持久化
        this.knowledgeBase[collection].push(newItem);
        await insert(collection, newItem);

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
            'healingExercises',
            exercise,
            { title: exercise.title, content: exercise.description || exercise.content || '', sourceUrl: exercise.sourceUrl },
            'title'
        );
    }

    async addPsychologyKnowledge(knowledge) {
        return this._addItem(
            'psychologyKnowledge',
            knowledge,
            { title: knowledge.title, content: knowledge.content || '', sourceUrl: knowledge.sourceUrl },
            'title'
        );
    }

    async addEmotionRegulation(regulation) {
        return this._addItem(
            'emotionRegulation',
            regulation,
            {
                title: regulation.title || regulation.emotion,
                content: JSON.stringify(regulation.methods || []),
                sourceUrl: regulation.sourceUrl
            },
            'emotion'
        );
    }

    async addDailyTip(tip) {
        return this._addItem(
            'dailyTips',
            tip,
            { title: '', content: tip.content || '', sourceUrl: tip.sourceUrl },
            'content'
        );
    }

    // ── 统计 ──────────────────────────────────────────────────

    getStatistics() {
        const kb = this.knowledgeBase;
        return {
            totalItems: kb.healingExercises.length + kb.psychologyKnowledge.length +
                        kb.emotionRegulation.length + kb.dailyTips.length,
            exercises:         kb.healingExercises.length,
            knowledge:         kb.psychologyKnowledge.length,
            regulations:       kb.emotionRegulation.length,
            tips:              kb.dailyTips.length,
            indexedFingerprints: this.fingerprintIndex.size,
            indexedUrls:       this.urlIndex.size,
            updateLog:         this.updateLog
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
    { content: '{quote}——{author}', category: '心理学名言' }
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
        '每一次呼吸都是新的开始'
    ],
    author: ['阿德勒', '心理学家', '心晴空间']
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
                source: 'AI生成'
            });
        }

        return tips;
    }
}

// ─── 主更新函数 ───────────────────────────────────────────────

async function updateKnowledge() {
    const startTime = Date.now();

    console.log('\n========================================');
    console.log('📚 知识库每日增量更新');
    console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('========================================\n');

    const manager  = new KnowledgeManager();
    const syncer   = new KnowledgeSyncer(manager);
    const generator = new AIContentGenerator();

    // 1. 加载现有知识库
    console.log('📖 加载现有知识库...');
    await manager.loadKnowledgeBase();

    // 2. 同步预定义知识（增量）
    console.log('\n📥 同步权威知识库...');
    console.log('\n  疗愈练习:');
    const exercisesResult  = await syncer.syncHealingExercises();
    console.log('\n  心理知识:');
    const knowledgeResult  = await syncer.syncPsychologyKnowledge();
    console.log('\n  情绪调节:');
    const regulationsResult = await syncer.syncEmotionRegulation();
    console.log('\n  每日提示:');
    const tipsResult       = await syncer.syncDailyTips();

    // 3. 爬取外部资源
    console.log('\n🕷️ 爬取外部资源...');
    const crawlResult = { exercises: 0, knowledge: 0, tips: 0 };

    try {
        const crawler = new PsychologyCrawler();
        const crawlData = await crawler.crawl();

        for (const exercise of crawlData.exercises) {
            if ((await manager.addHealingExercise(exercise)).added) {
                crawlResult.exercises++;
                console.log(`  + 爬取练习: ${exercise.title}`);
            }
        }

        for (const knowledge of crawlData.knowledge) {
            if ((await manager.addPsychologyKnowledge(knowledge)).added) {
                crawlResult.knowledge++;
                console.log(`  + 爬取知识: ${knowledge.title}`);
            }
        }

        for (const tip of crawlData.tips) {
            if ((await manager.addDailyTip(tip)).added) crawlResult.tips++;
        }

        console.log(`\n  爬取统计: 练习 +${crawlResult.exercises}, 知识 +${crawlResult.knowledge}, 小贴士 +${crawlResult.tips}`);
    } catch (error) {
        console.log(`  爬取失败: ${error.message}`);
    }

    // 4. 生成每日新内容
    console.log('\n🤖 生成每日新内容...');
    const newTips = generator.generateDailyTips(3);
    let generatedTips = 0;
    for (const tip of newTips) {
        if ((await manager.addDailyTip(tip)).added) {
            generatedTips++;
            console.log(`  + 新提示: ${tip.content.substring(0, 30)}...`);
        }
    }

    // 5. 输出统计
    const stats = manager.getStatistics();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n========================================');
    console.log('📊 更新统计:');
    console.log(`  预定义练习: +${exercisesResult.added}/${exercisesResult.total}`);
    console.log(`  预定义知识: +${knowledgeResult.added}/${knowledgeResult.total}`);
    console.log(`  预定义调节: +${regulationsResult.added}/${regulationsResult.total}`);
    console.log(`  预定义提示: +${tipsResult.added}/${tipsResult.total}`);
    console.log(`  爬取练习:   +${crawlResult.exercises}`);
    console.log(`  爬取知识:   +${crawlResult.knowledge}`);
    console.log(`  爬取小贴士: +${crawlResult.tips}`);
    console.log(`  生成小贴士: +${generatedTips}`);
    console.log(`\n  知识库总量: ${stats.totalItems} 条`);
    console.log(`  耗时: ${duration}秒`);
    console.log('========================================\n');

    return stats;
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
    getDataSources,
    DATA_SOURCES,
    // 向后兼容：旧代码若引用 PREDEFINED_KNOWLEDGE 不报错
    PREDEFINED_KNOWLEDGE: PREDEFINED
};

if (require.main === module) {
    updateKnowledge().catch(console.error);
}
