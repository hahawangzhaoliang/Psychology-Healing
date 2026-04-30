/**
 * 扩展数据源配置
 * 包含国内外权威心理学网站和学术资源
 */

/**
 * 数据源类型
 */
const SourceType = {
    INTERNATIONAL: 'international',   // 国际权威机构
    DOMESTIC: 'domestic',             // 国内权威机构
    ACADEMIC: 'academic',             // 学术期刊
    MEDIA: 'media',                    // 媒体平台
    HEALTH: 'health'                  // 健康网站
};

/**
 * 内容类型
 */
const ContentType = {
    KNOWLEDGE: 'knowledge',           // 心理知识
    EXERCISE: 'exercise',             // 疗愈练习
    TIP: 'tip',                       // 小贴士
    EMOTION: 'emotion'                // 情绪调节
};

/**
 * 主题分类
 */
const Topic = {
    ANXIETY: 'anxiety',
    DEPRESSION: 'depression',
    MINDFULNESS: 'mindfulness',
    STRESS: 'stress',
    SLEEP: 'sleep',
    RELATIONSHIP: 'relationship',
    SELF_ESTEEM: 'self-esteem',
    TRAUMA: 'trauma',
    CBT: 'cbt',
    EMOTION: 'emotion',
    GROWTH: 'growth',
    COPING: 'coping'
};

/**
 * 主题映射（英文 -> 中文）
 */
const TopicLabels = {
    [Topic.ANXIETY]: '焦虑',
    [Topic.DEPRESSION]: '抑郁',
    [Topic.MINDFULNESS]: '正念',
    [Topic.STRESS]: '压力管理',
    [Topic.SLEEP]: '睡眠',
    [Topic.RELATIONSHIP]: '人际关系',
    [Topic.SELF_ESTEEM]: '自尊',
    [Topic.TRAUMA]: '创伤',
    [Topic.CBT]: '认知行为',
    [Topic.EMOTION]: '情绪',
    [Topic.GROWTH]: '个人成长',
    [Topic.COPING]: '应对策略'
};

/**
 * 国际权威来源
 */
const INTERNATIONAL_SOURCES = [
    // Psychology Today
    {
        name: 'Psychology Today',
        shortName: 'PsychToday',
        type: SourceType.MEDIA,
        credibility: 'high',
        baseUrl: 'https://www.psychologytoday.com',
        topics: [
            { path: '/us/basics/anxiety', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/us/basics/depression', topic: Topic.DEPRESSION, contentType: ContentType.KNOWLEDGE },
            { path: '/us/basics/mindfulness', topic: Topic.MINDFULNESS, contentType: ContentType.EXERCISE },
            { path: '/us/basics/stress', topic: Topic.STRESS, contentType: ContentType.KNOWLEDGE },
            { path: '/us/basics/sleep', topic: Topic.SLEEP, contentType: ContentType.KNOWLEDGE },
            { path: '/us/basics/self-esteem', topic: Topic.SELF_ESTEEM, contentType: ContentType.KNOWLEDGE },
            { path: '/us/basics/relationships', topic: Topic.RELATIONSHIP, contentType: ContentType.EMOTION },
            { path: '/us/basics/emotions', topic: Topic.EMOTION, contentType: ContentType.EMOTION }
        ],
        tags: ['心理学', '心理健康', '治疗']
    },
    // American Psychological Association
    {
        name: 'American Psychological Association',
        shortName: 'APA',
        type: SourceType.INTERNATIONAL,
        credibility: 'highest',
        baseUrl: 'https://www.apa.org',
        topics: [
            { path: '/topics/anxiety', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/topics/depression', topic: Topic.DEPRESSION, contentType: ContentType.KNOWLEDGE },
            { path: '/topics/stress', topic: Topic.STRESS, contentType: ContentType.KNOWLEDGE },
            { path: '/topics/resilience', topic: Topic.GROWTH, contentType: ContentType.KNOWLEDGE },
            { path: '/topics/emotion', topic: Topic.EMOTION, contentType: ContentType.EMOTION },
            { path: '/topics/mindfulness', topic: Topic.MINDFULNESS, contentType: ContentType.EXERCISE },
            { path: '/topics/relationships', topic: Topic.RELATIONSHIP, contentType: ContentType.EMOTION },
            { path: '/topics/trauma', topic: Topic.TRAUMA, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['APA', '心理学研究', '循证']
    },
    // Mayo Clinic
    {
        name: 'Mayo Clinic',
        shortName: 'Mayo',
        type: SourceType.HEALTH,
        credibility: 'highest',
        baseUrl: 'https://www.mayoclinic.org',
        topics: [
            { path: '/diseases-conditions/anxiety/symptoms-causes/syc-20350361', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/diseases-conditions/depression/symptoms-causes/syc-20356097', topic: Topic.DEPRESSION, contentType: ContentType.KNOWLEDGE },
            { path: '/tests-procedures/stress-management/basics/procedure/pcc-20484667', topic: Topic.STRESS, contentType: ContentType.EXERCISE },
            { path: '/diseases-conditions/insomnia/symptoms-causes/syc-20355167', topic: Topic.SLEEP, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['健康', '医疗', '症状']
    },
    // NIH Mental Health
    {
        name: 'National Institute of Mental Health',
        shortName: 'NIMH',
        type: SourceType.INTERNATIONAL,
        credibility: 'highest',
        baseUrl: 'https://www.nimh.nih.gov',
        topics: [
            { path: '/health/topics/anxiety-disorders', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/health/topics/depression', topic: Topic.DEPRESSION, contentType: ContentType.KNOWLEDGE },
            { path: '/health/topics/stress', topic: Topic.STRESS, contentType: ContentType.KNOWLEDGE },
            { path: '/health/topics/post-traumatic-stress-disorder-and-ptsd', topic: Topic.TRAUMA, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['NIH', '心理健康', '研究']
    },
    // Verywell Mind
    {
        name: 'Verywell Mind',
        shortName: 'Verywell',
        type: SourceType.MEDIA,
        credibility: 'medium',
        baseUrl: 'https://www.verywellmind.com',
        topics: [
            { path: '/what-is-anxiety-2584218', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/understanding-depression-4770651', topic: Topic.DEPRESSION, contentType: ContentType.KNOWLEDGE },
            { path: '/stress-management-tips-3145190', topic: Topic.STRESS, contentType: ContentType.EXERCISE },
            { path: '/cognitive-behavioral-therapy-cbt-2795847', topic: Topic.CBT, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['心理健康', '自助', '治疗']
    },
    // Healthline
    {
        name: 'Healthline',
        shortName: 'Healthline',
        type: SourceType.HEALTH,
        credibility: 'high',
        baseUrl: 'https://www.healthline.com',
        topics: [
            { path: '/mental-health/anxiety', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/mental-health/depression', topic: Topic.DEPRESSION, contentType: ContentType.KNOWLEDGE },
            { path: '/mental-health/meditation-benefits', topic: Topic.MINDFULNESS, contentType: ContentType.EXERCISE },
            { path: '/mental-health/stress-relief', topic: Topic.STRESS, contentType: ContentType.EXERCISE }
        ],
        tags: ['健康', '心理健康', '生活方式']
    }
];

/**
 * 国内权威来源
 */
const DOMESTIC_SOURCES = [
    // 中国科学院心理研究所
    {
        name: '中国科学院心理研究所',
        shortName: '中科院心理所',
        type: SourceType.DOMESTIC,
        credibility: 'highest',
        baseUrl: 'http://www.psych.ac.cn',
        topics: [
            { path: '/xwzx/kyjz/', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/xwzx/tpxw/', topic: Topic.GROWTH, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['科研', '心理学', '中科院']
    },
    // 中国心理学会
    {
        name: '中国心理学会',
        shortName: '中国心理学会',
        type: SourceType.DOMESTIC,
        credibility: 'highest',
        baseUrl: 'http://www.cpsbeijing.org',
        topics: [
            { path: '/index.html', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['学会', '心理学', '学术']
    },
    // 简单心理
    {
        name: '简单心理',
        shortName: '简单心理',
        type: SourceType.MEDIA,
        credibility: 'high',
        baseUrl: 'https://www.jiandankexin.com',
        topics: [
            { path: '/learn', topic: Topic.GROWTH, contentType: ContentType.KNOWLEDGE },
            { path: '/article', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['心理咨询', '心理健康', '科普']
    },
    // 壹心理
    {
        name: '壹心理',
        shortName: '壹心理',
        type: SourceType.MEDIA,
        credibility: 'high',
        baseUrl: 'https://www.xinli001.com',
        topics: [
            { path: '/info', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE },
            { path: '/article', topic: Topic.EMOTION, contentType: ContentType.EMOTION }
        ],
        tags: ['心理', '情感', '咨询']
    },
    // KnowYourself
    {
        name: 'KnowYourself',
        shortName: 'KY',
        type: SourceType.MEDIA,
        credibility: 'high',
        baseUrl: 'https://www.knowyourself.cc',
        topics: [
            { path: '/category/whatis', topic: Topic.GROWTH, contentType: ContentType.KNOWLEDGE },
            { path: '/category/selfcare', topic: Topic.EMOTION, contentType: ContentType.EXERCISE }
        ],
        tags: ['自我探索', '心理成长', '人际关系']
    },
    // 北京师范大学心理学部
    {
        name: '北京师范大学心理学部',
        shortName: '北师大心理',
        type: SourceType.DOMESTIC,
        credibility: 'highest',
        baseUrl: 'https://psych.bnu.edu.cn',
        topics: [
            { path: '/zxzx/kyjz/', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['学术', '心理学', '教育']
    },
    // 心理学报
    {
        name: '心理学报',
        shortName: '心理学报',
        type: SourceType.ACADEMIC,
        credibility: 'highest',
        baseUrl: 'http://journal.psych.ac.cn/xlxb/',
        topics: [
            { path: '/cn/current', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['学术', '研究', '论文']
    }
];

/**
 * 学术期刊来源
 */
const ACADEMIC_SOURCES = [
    {
        name: 'Nature Human Behaviour',
        shortName: 'Nature Hum Behav',
        type: SourceType.ACADEMIC,
        credibility: 'highest',
        baseUrl: 'https://www.nature.com/nathumbehav/',
        topics: [
            { path: '/latest-research', topic: Topic.GROWTH, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['Nature', '科研', '行为科学']
    },
    {
        name: 'Lancet Psychiatry',
        shortName: 'Lancet Psych',
        type: SourceType.ACADEMIC,
        credibility: 'highest',
        baseUrl: 'https://www.thelancet.com/journals/lanpsy/home',
        topics: [
            { path: '/currentissue', topic: Topic.ANXIETY, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['Lancet', '精神科', '临床']
    },
    {
        name: 'PubMed Psychology',
        shortName: 'PubMed',
        type: SourceType.ACADEMIC,
        credibility: 'highest',
        baseUrl: 'https://pubmed.ncbi.nlm.nih.gov',
        topics: [
            { path: '/?term=psychology+mental+health', topic: Topic.GROWTH, contentType: ContentType.KNOWLEDGE }
        ],
        tags: ['PubMed', '医学', '文献']
    }
];

/**
 * 获取所有数据源
 */
function getAllSources() {
    return {
        [SourceType.INTERNATIONAL]: INTERNATIONAL_SOURCES,
        [SourceType.DOMESTIC]: DOMESTIC_SOURCES,
        [SourceType.ACADEMIC]: ACADEMIC_SOURCES
    };
}

/**
 * 获取所有URL列表
 */
function getAllUrls() {
    const urls = [];

    [...INTERNATIONAL_SOURCES, ...DOMESTIC_SOURCES, ...ACADEMIC_SOURCES].forEach(source => {
        source.topics.forEach(topic => {
            const url = `${source.baseUrl}${topic.path}`;
            urls.push({
                url,
                source: source.shortName,
                topic: topic.topic,
                contentType: topic.contentType,
                credibility: source.credibility,
                tags: source.tags
            });
        });
    });

    return urls;
}

/**
 * 根据主题获取相关URL
 */
function getUrlsByTopic(topic) {
    return getAllUrls().filter(item => item.topic === topic);
}

/**
 * 根据内容类型获取URL
 */
function getUrlsByContentType(contentType) {
    return getAllUrls().filter(item => item.contentType === contentType);
}

/**
 * 获取高可信度来源
 */
function getHighCredibilitySources() {
    return getAllUrls().filter(item =>
        item.credibility === 'highest' || item.credibility === 'high'
    );
}

/**
 * 数据源统计
 */
function getSourceStats() {
    const all = getAllUrls();
    return {
        total: all.length,
        byType: {
            [SourceType.INTERNATIONAL]: INTERNATIONAL_SOURCES.length,
            [SourceType.DOMESTIC]: DOMESTIC_SOURCES.length,
            [SourceType.ACADEMIC]: ACADEMIC_SOURCES.length
        },
        byTopic: Object.keys(Topic).reduce((acc, t) => {
            acc[t] = all.filter(item => item.topic === t).length;
            return acc;
        }, {}),
        byCredibility: {
            highest: all.filter(item => item.credibility === 'highest').length,
            high: all.filter(item => item.credibility === 'high').length,
            medium: all.filter(item => item.credibility === 'medium').length
        }
    };
}

module.exports = {
    SourceType,
    ContentType,
    Topic,
    TopicLabels,
    INTERNATIONAL_SOURCES,
    DOMESTIC_SOURCES,
    ACADEMIC_SOURCES,
    getAllSources,
    getAllUrls,
    getUrlsByTopic,
    getUrlsByContentType,
    getHighCredibilitySources,
    getSourceStats
};
