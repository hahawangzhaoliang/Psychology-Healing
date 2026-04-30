/**
 * 知识库自动更新服务 v2.0
 * 从权威网站获取心理学知识，每日增量更新
 * 支持指纹去重，避免重复插入
 */

const { insert, find, findById } = require('../config/upstash');
const { PsychologyCrawler, FingerprintGenerator } = require('./crawler');

// 权威数据源配置
const DATA_SOURCES = {
    // 国内权威机构
    domestic: [
        {
            name: '中国科学院心理研究所',
            shortName: '中科院心理所',
            url: 'http://www.psych.ac.cn/xwzx/kyjz/',
            type: 'research',
            credibility: 'high',
            categories: ['研究进展', '心理健康', '认知科学']
        },
        {
            name: '中国心理学会',
            shortName: '中国心理学会',
            url: 'http://www.cpsbeijing.org/',
            type: 'organization',
            credibility: 'high',
            categories: ['行业动态', '学术资讯', '心理健康']
        },
        {
            name: '国家心理健康网',
            shortName: '国家心理健康网',
            url: 'http://www.nimh.org.cn/',
            type: 'government',
            credibility: 'high',
            categories: ['政策法规', '健康科普', '心理服务']
        },
        {
            name: '北京师范大学心理学部',
            shortName: '北师大心理',
            url: 'https://psych.bnu.edu.cn/',
            type: 'academic',
            credibility: 'high',
            categories: ['学术研究', '人才培养', '社会服务']
        },
        {
            name: '北京大学心理与认知科学学院',
            shortName: '北大心理',
            url: 'https://www.psy.pku.edu.cn/',
            type: 'academic',
            credibility: 'high',
            categories: ['科研成果', '学术交流', '心理健康']
        }
    ],
    // 国际权威期刊
    international: [
        {
            name: 'Nature Psychology',
            shortName: 'Nature',
            url: 'https://www.nature.com/npsych/',
            type: 'journal',
            credibility: 'highest',
            categories: ['研究论文', '综述', '评论']
        },
        {
            name: 'American Psychological Association',
            shortName: 'APA',
            url: 'https://www.apa.org/',
            type: 'organization',
            credibility: 'highest',
            categories: ['心理学新闻', '研究概要', '实践指南']
        },
        {
            name: 'Psychology Today',
            shortName: 'PsychToday',
            url: 'https://www.psychologytoday.com/',
            type: 'media',
            credibility: 'medium',
            categories: ['心理健康', '治疗', '心理科普']
        },
        {
            name: 'World Psychiatry',
            shortName: 'WorldPsych',
            url: 'https://www.wpanet.org/',
            type: 'journal',
            credibility: 'highest',
            categories: ['精神医学', '全球心理健康', '研究综述']
        }
    ]
};

// 预定义知识库（基于权威来源）
const PREDEFINED_KNOWLEDGE = {
    healingExercises: [
        {
            id: 'exercise_mindfulness_001',
            title: '正念呼吸冥想',
            category: '正念冥想',
            duration: '10-15分钟',
            difficulty: '入门',
            description: '通过专注呼吸来培养当下觉察力，减少杂念，提升情绪调节能力。研究表明8周正念练习可显著降低焦虑和抑郁症状。',
            steps: [
                '找一个安静舒适的地方坐下',
                '闭上眼睛，将注意力集中在呼吸上',
                '感受空气进入鼻腔、充满肺部、再缓缓呼出',
                '当注意力分散时，温和地将其带回呼吸',
                '持续练习10-15分钟'
            ],
            benefits: ['降低焦虑水平', '提升专注力', '改善睡眠质量', '增强情绪调节能力'],
            neuroscienceBasis: '研究表明正念冥想可增加前额叶皮层厚度，降低杏仁核活跃度，增强大脑默认模式网络的调节能力。',
            suitableFor: ['焦虑人群', '压力大的人群', '睡眠障碍者', '希望提升专注力的人'],
            tags: ['正念', '呼吸', '入门', '焦虑', '压力'],
            source: '哈佛医学院研究、Nature Psychology 2023年综述'
        },
        {
            id: 'exercise_breathing_001',
            title: '4-7-8呼吸放松法',
            category: '呼吸练习',
            duration: '5-10分钟',
            difficulty: '入门',
            description: '由Andrew Weil博士开发的呼吸技术，通过特定的呼吸节奏激活副交感神经系统，快速诱导放松状态。',
            steps: [
                '用鼻子吸气4秒',
                '屏住呼吸7秒',
                '用嘴缓慢呼气8秒',
                '重复4个循环'
            ],
            benefits: ['快速降低心率', '缓解焦虑', '改善睡眠', '降低血压'],
            neuroscienceBasis: '延长呼气时间可激活迷走神经，触发副交感神经反应，降低应激激素水平。',
            suitableFor: ['急性焦虑', '失眠', '高血压', '考前紧张'],
            tags: ['呼吸', '放松', '焦虑', '睡眠', '快速'],
            source: 'Andrew Weil博士、哈佛医学院'
        },
        {
            id: 'exercise_pmrt_001',
            title: '渐进式肌肉放松训练',
            category: '身体放松',
            duration: '15-20分钟',
            difficulty: '入门',
            description: '通过系统性地紧张和放松身体各部位肌肉群，帮助识别和释放身体紧张，有效缓解焦虑和失眠。',
            steps: [
                '找一个安静的地方躺下或坐下',
                '从脚趾开始，紧绷肌肉5秒',
                '突然放松，感受紧张与放松的对比',
                '依次向上：小腿、大腿、腹部、胸部、手臂、肩膀、面部',
                '全程保持深呼吸'
            ],
            benefits: ['缓解肌肉紧张', '改善睡眠', '降低焦虑', '减轻慢性疼痛'],
            neuroscienceBasis: '通过本体感觉反馈，帮助大脑识别紧张状态并学习主动放松，降低交感神经活跃度。',
            suitableFor: ['慢性紧张', '失眠', '焦虑症', '慢性疼痛患者'],
            tags: ['肌肉放松', '身体扫描', '焦虑', '睡眠', '入门'],
            source: 'Edmund Jacobson博士、美国心理学会'
        },
        {
            id: 'exercise_grounding_001',
            title: '5-4-3-2-1接地技术',
            category: '情绪调节',
            duration: '3-5分钟',
            difficulty: '入门',
            description: '一种快速有效的接地技术，通过调动五感将注意力从焦虑思维中拉回当下，特别适合处理恐慌发作和急性焦虑。',
            steps: [
                '说出5个你能看到的东西',
                '说出4个你能触摸到的东西',
                '说出3个你能听到的声音',
                '说出2个你能闻到的气味',
                '说出1个你能尝到的味道'
            ],
            benefits: ['快速缓解恐慌', '回到当下', '打断焦虑循环', '增强现实感'],
            neuroscienceBasis: '通过激活感觉皮层，分散杏仁核的过度活跃，帮助大脑重新建立与现实环境的连接。',
            suitableFor: ['恐慌发作', '解离症状', '创伤后应激', '急性焦虑'],
            tags: ['接地', '恐慌', '焦虑', '快速', '五感'],
            source: '创伤治疗领域、美国心理学会'
        },
        {
            id: 'exercise_journal_001',
            title: '情绪日记书写',
            category: '表达性写作',
            duration: '15-20分钟',
            difficulty: '入门',
            description: '通过书写表达内心感受和想法，帮助整理情绪、获得洞察。研究表明表达性写作可改善心理健康。',
            steps: [
                '找一个安静的时间和地点',
                '写下当前的感受和想法',
                '不要担心语法和拼写，自由书写',
                '可以描述事件、感受、以及你的理解',
                '写完后可以选择保存或销毁'
            ],
            benefits: ['情绪释放', '获得洞察', '减少反刍思维', '提升自我认知'],
            neuroscienceBasis: '表达性写作可降低杏仁核活跃度，增强前额叶对情绪的调节，减少心理压力的生理影响。',
            suitableFor: ['情绪困扰', '压力大', '抑郁情绪', '希望自我探索的人'],
            tags: ['日记', '写作', '情绪', '自我探索'],
            source: 'James Pennebaker博士研究、APA'
        },
        {
            id: 'exercise_cbt_001',
            title: '认知重构练习',
            category: '认知行为',
            duration: '10-15分钟',
            difficulty: '中级',
            description: '认知行为疗法(CBT)的核心技术，帮助识别和挑战负面自动思维，建立更平衡的思考方式。',
            steps: [
                '识别引发情绪的情境',
                '写下你的自动思维',
                '评估这个想法的证据（支持/反对）',
                '问自己：有没有其他可能的解释？',
                '形成一个更平衡的想法'
            ],
            benefits: ['减少负面思维', '改善情绪', '增强认知灵活性', '预防抑郁复发'],
            neuroscienceBasis: 'CBT可增强前额叶皮层活动，改善其与杏仁核的连接，增强认知对情绪的自上而下调节。',
            suitableFor: ['抑郁情绪', '焦虑思维', '完美主义', '自我批评'],
            tags: ['CBT', '认知', '思维', '抑郁', '焦虑'],
            source: 'Aaron Beck博士、认知行为治疗学会'
        },
        {
            id: 'exercise_gratitude_001',
            title: '感恩日记练习',
            category: '积极心理学',
            duration: '5-10分钟',
            difficulty: '入门',
            description: '积极心理学的经典练习，通过每天记录感恩的事物，培养积极情绪，提升幸福感。',
            steps: [
                '每天睡前花5分钟',
                '写下今天值得感恩的3件事',
                '具体描述为什么感恩',
                '感受感恩的情绪',
                '坚持21天以上'
            ],
            benefits: ['提升幸福感', '改善睡眠', '增强人际关系', '减少负面情绪'],
            neuroscienceBasis: '感恩练习可增加多巴胺和血清素分泌，增强前额叶积极情绪相关区域的活动。',
            suitableFor: ['抑郁情绪', '负面思维', '希望提升幸福感的人'],
            tags: ['感恩', '积极心理学', '幸福', '入门'],
            source: 'Martin Seligman博士、积极心理学中心'
        },
        {
            id: 'exercise_bodyscan_001',
            title: '身体扫描冥想',
            category: '正念冥想',
            duration: '15-30分钟',
            difficulty: '入门',
            description: 'MBSR(正念减压)的核心练习，通过系统性地将注意力游走于身体各部位，培养身心觉察力。',
            steps: [
                '平躺，闭上眼睛',
                '从脚趾开始，注意那里的感觉',
                '缓慢向上移动注意力：脚、小腿、膝盖、大腿...',
                '经过腹部、胸部、双手、双臂',
                '最后到达头部，感受整个身体'
            ],
            benefits: ['深度放松', '改善睡眠', '增强身体觉察', '缓解慢性疼痛'],
            neuroscienceBasis: '身体扫描可增强岛叶活动，改善大脑与身体的连接，降低应激反应。',
            suitableFor: ['失眠', '慢性疼痛', '压力', '身心分离感'],
            tags: ['身体扫描', 'MBSR', '正念', '放松', '睡眠'],
            source: 'Jon Kabat-Zinn博士、麻省大学医学院正念中心'
        }
    ],
    
    psychologyKnowledge: [
        {
            id: 'knowledge_anxiety_001',
            title: '焦虑的神经科学机制',
            category: '神经科学',
            source: 'Nature Reviews Neuroscience 2023',
            keyPoints: [
                '焦虑涉及杏仁核过度活跃和前额叶调节不足',
                '长期焦虑可导致海马体体积减小',
                '焦虑的遗传贡献率约为30-40%',
                '认知行为疗法可改变大脑连接模式'
            ],
            content: '焦虑障碍是最常见的精神健康问题之一。从神经科学角度看，焦虑涉及大脑恐惧回路（杏仁核、海马体、前扣带回）的过度活跃，以及前额叶皮层对情绪调节能力的下降。研究表明，有效的治疗（如CBT、正念冥想）可以增强前额叶与杏仁核的功能连接，改善情绪调节能力。',
            tags: ['焦虑', '神经科学', '杏仁核', 'CBT'],
            references: ['Nature Reviews Neuroscience', 'American Journal of Psychiatry']
        },
        {
            id: 'knowledge_depression_001',
            title: '抑郁症的综合理解',
            category: '临床心理',
            source: 'World Psychiatry 2024',
            keyPoints: [
                '抑郁症是生物-心理-社会因素共同作用的结果',
                '全球约2.8亿人受抑郁症影响',
                '早期识别和干预可显著改善预后',
                '运动、社交、规律作息是有效的自我管理策略'
            ],
            content: '抑郁症是一种常见的心境障碍，表现为持续的情绪低落、兴趣减退、精力不足等。其成因复杂，涉及神经递质失衡（血清素、去甲肾上腺素、多巴胺）、遗传易感性、早期创伤、慢性压力等多种因素。治疗需要综合药物、心理治疗和生活方式调整。',
            tags: ['抑郁', '临床心理', '治疗', '心理健康'],
            references: ['World Psychiatry', 'Lancet Psychiatry']
        },
        {
            id: 'knowledge_mindfulness_001',
            title: '正念冥想的科学证据',
            category: '心理科学',
            source: 'JAMA Psychiatry 2023',
            keyPoints: [
                '正念冥想对焦虑、抑郁有中等效应量的改善',
                '8周MBSR课程可改变大脑结构和功能',
                '正念练习可降低炎症标志物水平',
                '效果与抗抑郁药物相当，复发率更低'
            ],
            content: '正念冥想是一种培养当下觉察的心理训练方法。大量研究证实其对心理健康有显著益处。一项发表在JAMA Psychiatry的研究显示，8周正念减压课程在预防抑郁症复发方面与抗抑郁药物同样有效，且副作用更少。神经影像学研究发现，长期正念练习者的大脑在注意力、情绪调节相关区域表现出更强的功能和结构连接。',
            tags: ['正念', '冥想', '研究证据', '心理健康'],
            references: ['JAMA Psychiatry', 'Psychiatry Research']
        },
        {
            id: 'knowledge_sleep_001',
            title: '睡眠与心理健康的关系',
            category: '睡眠心理',
            source: 'Sleep Medicine Reviews 2024',
            keyPoints: [
                '睡眠不足会显著增加抑郁和焦虑风险',
                '失眠往往是心理健康问题的早期信号',
                '改善睡眠可显著提升心理健康水平',
                '认知行为治疗失眠(CBT-I)是首选非药物干预'
            ],
            content: '睡眠与心理健康密切相关。研究表明，失眠患者患抑郁症的风险是正常人的3-5倍。睡眠不足会影响情绪调节、认知功能和应激反应。好消息是，改善睡眠质量可以显著提升心理健康水平。认知行为治疗失眠(CBT-I)是目前证据最充分的非药物治疗，效果持久且无药物副作用。',
            tags: ['睡眠', '失眠', '心理健康', 'CBT-I'],
            references: ['Sleep Medicine Reviews', 'Journal of Clinical Sleep Medicine']
        },
        {
            id: 'knowledge_stress_001',
            title: '压力的身心影响与应对',
            category: '压力管理',
            source: 'Annual Review of Psychology 2023',
            keyPoints: [
                '慢性压力可导致皮质醇长期升高，损害身心健康',
                '压力反应涉及HPA轴激活和交感神经兴奋',
                '社会支持是缓冲压力的重要保护因素',
                '规律运动、正念练习可有效降低压力反应'
            ],
            content: '压力是身体对挑战性情境的自然反应。短期压力可增强适应能力，但长期慢性压力会损害心血管系统、免疫系统和心理健康。有效的压力管理包括：建立社会支持网络、规律运动、正念练习、时间管理、以及学会设定界限。研究表明，将压力视为挑战而非威胁的心态转变，可以改变压力对身体的生理影响。',
            tags: ['压力', 'HPA轴', '应对策略', '心理健康'],
            references: ['Annual Review of Psychology', 'Psychoneuroendocrinology']
        },
        {
            id: 'knowledge_resilience_001',
            title: '心理韧性的培养',
            category: '积极心理',
            source: 'American Psychologist 2023',
            keyPoints: [
                '心理韧性是可以学习和培养的能力',
                '核心要素包括：乐观、认知灵活性、社会支持',
                '逆境经历配合有效应对可增强韧性',
                '自我效能感是韧性的重要预测因素'
            ],
            content: '心理韧性指个体在面对逆境时能够适应和恢复的能力。研究表明，韧性不是固定的人格特质，而是可以通过学习和练习培养的能力。培养韧性的关键包括：建立积极的社会关系、培养成长型思维、发展问题解决技能、保持身体健康、以及寻找生活的意义和目标。',
            tags: ['韧性', '积极心理', '适应', '成长'],
            references: ['American Psychologist', 'Journal of Positive Psychology']
        }
    ],
    
    emotionRegulation: [
        {
            id: 'regulation_anxiety_001',
            emotion: '焦虑',
            symptoms: ['心慌', '紧张', '注意力分散', '睡眠障碍', '肌肉紧张', '坐立不安'],
            methods: [
                { name: '腹式呼吸', duration: '5-15分钟', description: '缓慢深呼吸，吸气时腹部鼓起，呼气时收缩，激活副交感神经' },
                { name: '正念冥想', duration: '10-15分钟', description: '将注意力温和地锚定在呼吸或身体感受上，培养不评判的觉察' },
                { name: '认知重构', duration: '10-20分钟', description: '识别和挑战灾难化思维，建立更平衡的认知' },
                { name: '渐进式肌肉放松', duration: '15-20分钟', description: '系统性地紧张和放松肌肉群，释放身体紧张' }
            ],
            lifestyle: [
                '保持规律作息，避免熬夜',
                '每日适度运动如散步、瑜伽',
                '减少咖啡因和酒精摄入',
                '建立稳定的日常结构',
                '练习时间管理，避免过度承诺'
            ],
            whenToSeekHelp: '当焦虑持续影响日常生活、工作或人际关系超过2周，或伴有恐慌发作时，建议寻求专业帮助'
        },
        {
            id: 'regulation_depression_001',
            emotion: '抑郁',
            symptoms: ['情绪低落', '兴趣减退', '精力不足', '自我否定', '睡眠问题', '食欲改变'],
            methods: [
                { name: '行为激活', duration: '每日30分钟', description: '即使不想动，也安排小活动，逐步增加积极体验' },
                { name: '正念练习', duration: '10-15分钟', description: '专注呼吸感受当下，用"观察者视角"分析负面想法' },
                { name: '运动疗愈', duration: '每周3-5次，每次30分钟', description: '有氧运动如快走、慢跑或游泳，促进内啡肽分泌' },
                { name: '感恩日记', duration: '每日5分钟', description: '记录每天值得感恩的事，培养积极关注' }
            ],
            lifestyle: [
                '保持固定睡眠时间表',
                '培养一项兴趣爱好',
                '避免过度沉浸于负面思维',
                '保持适度的社交联系',
                '设定小目标，庆祝小成就'
            ],
            whenToSeekHelp: '当低落情绪持续超过2周，影响日常功能，或出现自我伤害念头时，请立即寻求专业帮助'
        },
        {
            id: 'regulation_stress_001',
            emotion: '压力',
            symptoms: ['疲劳', '烦躁', '注意力下降', '睡眠问题', '身体紧张', '情绪波动'],
            methods: [
                { name: '时间管理', duration: '每日规划', description: '区分重要紧急，学会说"不"，设定合理目标' },
                { name: '身体扫描', duration: '15-20分钟', description: '系统性地觉察身体各部位，释放紧张' },
                { name: '运动释放', duration: '30分钟', description: '通过运动释放压力激素，促进内啡肽分泌' },
                { name: '社交支持', duration: '适时', description: '与信任的人交流，获得情感支持和不同视角' }
            ],
            lifestyle: [
                '建立工作与生活的界限',
                '安排休息和娱乐时间',
                '培养放松的爱好',
                '保持规律运动',
                '练习正念或冥想'
            ],
            whenToSeekHelp: '当压力导致持续的身心症状，影响工作表现或人际关系时，建议寻求专业帮助'
        },
        {
            id: 'regulation_anger_001',
            emotion: '愤怒',
            symptoms: ['心跳加速', '肌肉紧张', '冲动行为', '言语攻击', '事后后悔'],
            methods: [
                { name: '暂停技术', duration: '即时', description: '感到愤怒时，离开现场，给自己冷静时间' },
                { name: '深呼吸', duration: '即时', description: '进行几次深呼吸，激活副交感神经，降低生理唤醒' },
                { name: '认知重构', duration: '冷静后', description: '分析愤怒背后的想法，寻找替代解释' },
                { name: '表达训练', duration: '适时', description: '学习用"我"语句表达感受和需求，而非指责' }
            ],
            lifestyle: [
                '识别愤怒的早期信号',
                '建立健康的情绪宣泄渠道',
                '练习同理心和换位思考',
                '保证充足睡眠',
                '减少酒精摄入'
            ],
            whenToSeekHelp: '当愤怒频繁失控，导致人际关系或工作问题，或伴有暴力倾向时，建议寻求专业帮助'
        }
    ],
    
    dailyTips: [
        { id: 'tip_mindful_001', content: '每天花5分钟专注于呼吸，让大脑获得一次简单的"重启"', category: '正念', suitableTime: '早晨或睡前' },
        { id: 'tip_cognitive_001', content: '当负面想法出现时，尝试用"观察者视角"分析，避免全盘否定自己', category: '认知调节', suitableTime: '情绪波动时' },
        { id: 'tip_motivation_001', content: '我无法选择起点，但能决定奔跑的方向', category: '自我激励', suitableTime: '遇到挫折时' },
        { id: 'tip_quote_001', content: '重要的不是过去发生了什么，而是你赋予它什么意义——阿德勒', category: '心理学名言', suitableTime: '反思时' },
        { id: 'tip_selfcare_001', content: '照顾好自己不是自私，而是更好地照顾他人的前提', category: '自我关怀', suitableTime: '感到疲惫时' },
        { id: 'tip_anxiety_001', content: '焦虑是对未来的担忧，把注意力带回当下，一次只处理一件事', category: '焦虑管理', suitableTime: '焦虑时' },
        { id: 'tip_sleep_001', content: '睡前一小时放下手机，给大脑一个"关机"的信号', category: '睡眠健康', suitableTime: '睡前' },
        { id: 'tip_gratitude_001', content: '每晚写下三件感恩的事，培养积极关注', category: '感恩练习', suitableTime: '睡前' },
        { id: 'tip_boundary_001', content: '学会说"不"是保护自己边界的重要能力', category: '边界设定', suitableTime: '面对请求时' },
        { id: 'tip_emotion_001', content: '所有情绪都是合理的，允许自己感受，但不被情绪控制', category: '情绪接纳', suitableTime: '情绪强烈时' },
        { id: 'tip_social_001', content: '真诚的连接比数量更重要，质量胜于数量的社交更有益心理健康', category: '人际关系', suitableTime: '社交时' },
        { id: 'tip_growth_001', content: '失败不是终点，而是学习和成长的机会', category: '成长心态', suitableTime: '面对失败时' }
    ]
};

/**
 * 知识库管理器 v2.0
 * 支持指纹去重
 */
class KnowledgeManager {
    constructor() {
        this.knowledgeBase = null;
        this.updateLog = [];
        // 指纹索引：用于快速去重检查
        this.fingerprintIndex = new Map();
        // URL索引
        this.urlIndex = new Map();
    }

    /**
     * 加载现有知识库
     */
    async loadKnowledgeBase() {
        try {
            const [exercises, knowledge, regulations, tips] = await Promise.all([
                find('healingExercises'),
                find('psychologyKnowledge'),
                find('emotionRegulation'),
                find('dailyTips')
            ]);

            this.knowledgeBase = {
                healingExercises: exercises || [],
                psychologyKnowledge: knowledge || [],
                emotionRegulation: regulations || [],
                dailyTips: tips || []
            };

            // 构建索引以加速去重检查
            this.buildIndexes();

            console.log('✓ 知识库加载成功');
            console.log(`  疗愈练习: ${this.knowledgeBase.healingExercises.length} 条`);
            console.log(`  心理知识: ${this.knowledgeBase.psychologyKnowledge.length} 条`);
            console.log(`  情绪调节: ${this.knowledgeBase.emotionRegulation.length} 条`);
            console.log(`  每日提示: ${this.knowledgeBase.dailyTips.length} 条`);

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

    /**
     * 构建索引以加速去重检查
     */
    buildIndexes() {
        this.fingerprintIndex.clear();
        this.urlIndex.clear();

        const collections = ['healingExercises', 'psychologyKnowledge', 'emotionRegulation', 'dailyTips'];

        collections.forEach(collection => {
            (this.knowledgeBase[collection] || []).forEach(item => {
                // 索引指纹
                if (item.fingerprint) {
                    this.fingerprintIndex.set(item.fingerprint, `${collection}:${item.id}`);
                }

                // 索引URL
                if (item.sourceUrl || item.url) {
                    const url = item.sourceUrl || item.url;
                    this.urlIndex.set(url, `${collection}:${item.id}`);
                }

                // 索引标题（用于模糊去重）
                if (item.title) {
                    const titleHash = FingerprintGenerator.generateTitleFingerprint(item.title);
                    if (!this.titleIndex) this.titleIndex = new Map();
                    this.titleIndex.set(titleHash, `${collection}:${item.id}`);
                }
            });
        });

        console.log(`  ✓ 索引构建完成: ${this.fingerprintIndex.size} 指纹, ${this.urlIndex.size} URL`);
    }

    /**
     * 生成内容指纹
     */
    generateFingerprint(data) {
        return FingerprintGenerator.generateContentFingerprint(data);
    }

    /**
     * 检查条目是否已存在（基于ID）
     */
    isExists(collection, id) {
        return this.knowledgeBase[collection]?.some(item => item.id === id);
    }

    /**
     * 检查指纹是否已存在
     */
    hasFingerprint(fingerprint) {
        return this.fingerprintIndex.has(fingerprint);
    }

    /**
     * 检查URL是否已存在
     */
    hasUrl(url) {
        return this.urlIndex.has(url);
    }

    /**
     * 智能去重检查
     * @param {Object} data - 包含 title, content, sourceUrl 等字段
     * @returns {Object} { isDuplicate: boolean, reason: string, existingId: string }
     */
    checkDuplicate(data) {
        const { title, content, sourceUrl } = data;

        // 1. 检查URL
        if (sourceUrl && this.hasUrl(sourceUrl)) {
            const existing = this.urlIndex.get(sourceUrl);
            return { isDuplicate: true, reason: 'URL已存在', existingId: existing };
        }

        // 2. 检查指纹
        const fingerprint = this.generateFingerprint(data);
        if (this.hasFingerprint(fingerprint)) {
            const existing = this.fingerprintIndex.get(fingerprint);
            return { isDuplicate: true, reason: '指纹重复', existingId: existing };
        }

        // 3. 检查标题相似度（可选，更严格的去重）
        if (title) {
            const titleHash = FingerprintGenerator.generateTitleFingerprint(title);
            if (this.titleIndex?.has(titleHash)) {
                const existing = this.titleIndex.get(titleHash);
                // 检查内容是否也相似
                const [coll, id] = existing.split(':');
                const existingItem = this.knowledgeBase[coll]?.find(i => i.id === id);
                if (existingItem && existingItem.content) {
                    // 简单的内容相似度检查
                    const existingContent = existingItem.content.substring(0, 200);
                    const newContent = content?.substring(0, 200);
                    if (existingContent === newContent) {
                        return { isDuplicate: true, reason: '内容完全相同', existingId: existing };
                    }
                }
            }
        }

        return { isDuplicate: false, reason: '新内容', existingId: null };
    }

    /**
     * 添加疗愈练习（增量，支持指纹去重）
     */
    async addHealingExercise(exercise) {
        // 生成指纹
        const fingerprint = this.generateFingerprint({
            title: exercise.title,
            content: exercise.description || exercise.content || '',
            sourceUrl: exercise.sourceUrl
        });

        // 检查去重
        const duplicateCheck = this.checkDuplicate(exercise);
        if (duplicateCheck.isDuplicate) {
            return { added: false, reason: duplicateCheck.reason, existingId: duplicateCheck.existingId };
        }

        // 检查ID
        if (this.isExists('healingExercises', exercise.id)) {
            return { added: false, reason: 'ID已存在' };
        }

        const newExercise = {
            ...exercise,
            fingerprint,
            createdAt: new Date().toISOString()
        };

        this.knowledgeBase.healingExercises.push(newExercise);
        await insert('healingExercises', newExercise);

        // 更新索引
        this.fingerprintIndex.set(fingerprint, `healingExercises:${newExercise.id}`);
        if (newExercise.sourceUrl) {
            this.urlIndex.set(newExercise.sourceUrl, `healingExercises:${newExercise.id}`);
        }

        return { added: true, title: exercise.title, fingerprint };
    }

    /**
     * 添加心理知识（增量，支持指纹去重）
     */
    async addPsychologyKnowledge(knowledge) {
        // 生成指纹
        const fingerprint = this.generateFingerprint({
            title: knowledge.title,
            content: knowledge.content || '',
            sourceUrl: knowledge.sourceUrl
        });

        // 检查去重
        const duplicateCheck = this.checkDuplicate(knowledge);
        if (duplicateCheck.isDuplicate) {
            return { added: false, reason: duplicateCheck.reason, existingId: duplicateCheck.existingId };
        }

        // 检查ID
        if (this.isExists('psychologyKnowledge', knowledge.id)) {
            return { added: false, reason: 'ID已存在' };
        }

        const newKnowledge = {
            ...knowledge,
            fingerprint,
            createdAt: new Date().toISOString()
        };

        this.knowledgeBase.psychologyKnowledge.push(newKnowledge);
        await insert('psychologyKnowledge', newKnowledge);

        // 更新索引
        this.fingerprintIndex.set(fingerprint, `psychologyKnowledge:${newKnowledge.id}`);
        if (newKnowledge.sourceUrl) {
            this.urlIndex.set(newKnowledge.sourceUrl, `psychologyKnowledge:${newKnowledge.id}`);
        }

        return { added: true, title: knowledge.title, fingerprint };
    }

    /**
     * 添加情绪调节方案（增量，支持指纹去重）
     */
    async addEmotionRegulation(regulation) {
        // 生成指纹
        const fingerprint = this.generateFingerprint({
            title: regulation.title || regulation.emotion,
            content: JSON.stringify(regulation.methods || []),
            sourceUrl: regulation.sourceUrl
        });

        // 检查去重
        const duplicateCheck = this.checkDuplicate(regulation);
        if (duplicateCheck.isDuplicate) {
            return { added: false, reason: duplicateCheck.reason, existingId: duplicateCheck.existingId };
        }

        // 检查ID
        if (this.isExists('emotionRegulation', regulation.id)) {
            return { added: false, reason: 'ID已存在' };
        }

        const newRegulation = {
            ...regulation,
            fingerprint,
            createdAt: new Date().toISOString()
        };

        this.knowledgeBase.emotionRegulation.push(newRegulation);
        await insert('emotionRegulation', newRegulation);

        // 更新索引
        this.fingerprintIndex.set(fingerprint, `emotionRegulation:${newRegulation.id}`);

        return { added: true, emotion: regulation.emotion, fingerprint };
    }

    /**
     * 添加每日提示（增量，支持指纹去重）
     */
    async addDailyTip(tip) {
        // 生成指纹
        const fingerprint = this.generateFingerprint({
            title: '',
            content: tip.content || '',
            sourceUrl: tip.sourceUrl
        });

        // 检查去重（针对内容）
        if (this.fingerprintIndex.has(fingerprint)) {
            return { added: false, reason: '内容重复', existingId: this.fingerprintIndex.get(fingerprint) };
        }

        // 检查ID
        if (this.isExists('dailyTips', tip.id)) {
            return { added: false, reason: 'ID已存在' };
        }

        const newTip = {
            ...tip,
            fingerprint,
            createdAt: new Date().toISOString()
        };

        this.knowledgeBase.dailyTips.push(newTip);
        await insert('dailyTips', newTip);

        // 更新索引
        this.fingerprintIndex.set(fingerprint, `dailyTips:${newTip.id}`);

        return { added: true, content: tip.content.substring(0, 30), fingerprint };
    }

    /**
     * 批量去重检查
     * @param {string} collection - 集合名称
     * @param {Array} items - 待检查的条目
     * @returns {Object} { duplicates: [], newItems: [] }
     */
    batchCheckDuplicates(collection, items) {
        const duplicates = [];
        const newItems = [];

        items.forEach(item => {
            const duplicateCheck = this.checkDuplicate(item);
            if (duplicateCheck.isDuplicate) {
                duplicates.push({ item, ...duplicateCheck });
            } else {
                newItems.push(item);
            }
        });

        return { duplicates, newItems, duplicateCount: duplicates.length, newCount: newItems.length };
    }

    /**
     * 获取统计信息
     */
    getStatistics() {
        return {
            totalItems: this.knowledgeBase.healingExercises.length +
                        this.knowledgeBase.psychologyKnowledge.length +
                        this.knowledgeBase.emotionRegulation.length +
                        this.knowledgeBase.dailyTips.length,
            exercises: this.knowledgeBase.healingExercises.length,
            knowledge: this.knowledgeBase.psychologyKnowledge.length,
            regulations: this.knowledgeBase.emotionRegulation.length,
            tips: this.knowledgeBase.dailyTips.length,
            indexedFingerprints: this.fingerprintIndex.size,
            indexedUrls: this.urlIndex.size,
            updateLog: this.updateLog
        };
    }
}

/**
 * 知识同步器 - 从预定义知识库同步
 */
class KnowledgeSyncer {
    constructor(manager) {
        this.manager = manager;
    }

    /**
     * 同步疗愈练习
     */
    async syncHealingExercises() {
        const exercises = PREDEFINED_KNOWLEDGE.healingExercises;
        let added = 0;
        
        for (const exercise of exercises) {
            const result = await this.manager.addHealingExercise(exercise);
            if (result.added) {
                added++;
                console.log(`  + 练习: ${result.title}`);
            }
        }
        
        return { total: exercises.length, added };
    }

    /**
     * 同步心理知识
     */
    async syncPsychologyKnowledge() {
        const knowledge = PREDEFINED_KNOWLEDGE.psychologyKnowledge;
        let added = 0;
        
        for (const item of knowledge) {
            const result = await this.manager.addPsychologyKnowledge(item);
            if (result.added) {
                added++;
                console.log(`  + 知识: ${result.title}`);
            }
        }
        
        return { total: knowledge.length, added };
    }

    /**
     * 同步情绪调节方案
     */
    async syncEmotionRegulation() {
        const regulations = PREDEFINED_KNOWLEDGE.emotionRegulation;
        let added = 0;
        
        for (const regulation of regulations) {
            const result = await this.manager.addEmotionRegulation(regulation);
            if (result.added) {
                added++;
                console.log(`  + 情绪调节: ${result.emotion}`);
            }
        }
        
        return { total: regulations.length, added };
    }

    /**
     * 同步每日提示
     */
    async syncDailyTips() {
        const tips = PREDEFINED_KNOWLEDGE.dailyTips;
        let added = 0;
        
        for (const tip of tips) {
            const result = await this.manager.addDailyTip(tip);
            if (result.added) {
                added++;
            }
        }
        
        return { total: tips.length, added };
    }
}

/**
 * AI内容生成器 - 生成每日新内容
 */
class AIContentGenerator {
    generateDailyTips(count = 3) {
        const templates = [
            { content: '每天花{time}专注于{activity}，让{benefit}', category: '正念' },
            { content: '当{emotion}出现时，尝试{method}，避免{negative}', category: '认知调节' },
            { content: '{quote}——{author}', category: '心理学名言' }
        ];
        
        const fillers = {
            time: ['5分钟', '10分钟', '15分钟'],
            activity: ['呼吸', '冥想', '散步', '写日记'],
            benefit: ['大脑获得休息', '情绪更加稳定', '压力得到释放'],
            emotion: ['负面想法', '焦虑', '低落情绪'],
            method: ['用"观察者视角"分析', '深呼吸三次', '和朋友聊聊'],
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
        
        const tips = [];
        for (let i = 0; i < count; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            let content = template.content;
            
            Object.keys(fillers).forEach(key => {
                if (content.includes(`{${key}}`)) {
                    const values = fillers[key];
                    content = content.replace(`{${key}}`, values[Math.floor(Math.random() * values.length)]);
                }
            });
            
            tips.push({
                id: `tip_gen_${Date.now()}_${i}`,
                content,
                category: template.category,
                suitableTime: '随时',
                source: 'AI生成'
            });
        }
        
        return tips;
    }
}

/**
 * 主更新函数 - 每日增量更新
 */
async function updateKnowledge() {
    const startTime = Date.now();
    
    console.log('\n========================================');
    console.log('📚 知识库每日增量更新');
    console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('========================================\n');
    
    const manager = new KnowledgeManager();
    const syncer = new KnowledgeSyncer(manager);
    const generator = new AIContentGenerator();
    
    // 1. 加载现有知识库
    console.log('📖 加载现有知识库...');
    await manager.loadKnowledgeBase();
    
    // 2. 同步预定义知识（增量）
    console.log('\n📥 同步权威知识库...');
    
    console.log('\n  疗愈练习:');
    const exercisesResult = await syncer.syncHealingExercises();
    
    console.log('\n  心理知识:');
    const knowledgeResult = await syncer.syncPsychologyKnowledge();
    
    console.log('\n  情绪调节:');
    const regulationsResult = await syncer.syncEmotionRegulation();
    
    console.log('\n  每日提示:');
    const tipsResult = await syncer.syncDailyTips();
    
    // 3. 爬取外部资源
    console.log('\n🕷️ 爬取外部资源...');
    let crawlResult = { exercises: 0, knowledge: 0, tips: 0 };
    
    try {
        const crawler = new PsychologyCrawler();
        const crawlData = await crawler.crawl();
        
        // 保存爬取的疗愈练习
        for (const exercise of crawlData.exercises) {
            const result = await manager.addHealingExercise(exercise);
            if (result.added) {
                crawlResult.exercises++;
                console.log(`  + 爬取练习: ${exercise.title}`);
            }
        }
        
        // 保存爬取的心理知识
        for (const knowledge of crawlData.knowledge) {
            const result = await manager.addPsychologyKnowledge(knowledge);
            if (result.added) {
                crawlResult.knowledge++;
                console.log(`  + 爬取知识: ${knowledge.title}`);
            }
        }
        
        // 保存爬取的小贴士
        for (const tip of crawlData.tips) {
            const result = await manager.addDailyTip(tip);
            if (result.added) {
                crawlResult.tips++;
            }
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
        const result = await manager.addDailyTip(tip);
        if (result.added) {
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
    console.log(`  爬取练习: +${crawlResult.exercises}`);
    console.log(`  爬取知识: +${crawlResult.knowledge}`);
    console.log(`  爬取小贴士: +${crawlResult.tips}`);
    console.log(`  生成小贴士: +${generatedTips}`);
    console.log(`\n  知识库总量: ${stats.totalItems} 条`);
    console.log(`  耗时: ${duration}秒`);
    console.log('========================================\n');
    
    return stats;
}

/**
 * 获取数据源列表
 */
function getDataSources() {
    return DATA_SOURCES;
}

// 导出
module.exports = {
    KnowledgeManager,
    KnowledgeSyncer,
    AIContentGenerator,
    updateKnowledge,
    getDataSources,
    DATA_SOURCES,
    PREDEFINED_KNOWLEDGE
};

// 如果直接运行
if (require.main === module) {
    updateKnowledge().catch(console.error);
}
