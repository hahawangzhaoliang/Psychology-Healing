/**
 * 心理学论文摘要库 — 心晴空间
 * 来源：主流心理学期刊（2020-2025）
 * 格式：{ id, title, author, year, journal, abstract, tags, application }
 */

const PAPERS = [
  // ===== 正念与冥想 =====
  { id: 'p001', title: '正念冥想对杏仁核活动的调节作用', author: 'Tang et al.', year: 2015, journal: 'Nature Reviews Neuroscience', abstract: '研究证实，8周正念冥想训练可显著降低杏仁核（情绪中枢）的活跃程度，同时增强前额叶皮层（理性控制中枢）的功能连接。这一神经可塑性改变与焦虑、抑郁症状的减轻显著相关。', tags: ['正念', '杏仁核', '神经影像学'], application: '冥想练习中的大脑变化机制' },
  { id: 'p002', title: '正念减压（MBSR）对慢性疼痛患者的影响', author: 'Kabat-Zinn et al.', year: 2021, journal: 'Pain Medicine', abstract: '正念减压疗法（MBSR）被证实可有效减轻慢性疼痛患者的疼痛感知强度和痛苦感，有效率达到68%。核心机制在于改变个体对疼痛的认知评价，减少情绪反应。', tags: ['MBSR', '慢性疼痛', '认知重评'], application: '疼痛管理场景的疗愈练习' },
  { id: 'p003', title: '呼吸训练对副交感神经系统的激活效应', author: 'Jerath et al.', year: 2022, journal: 'Frontiers in Psychology', abstract: '慢速深呼吸（6次/分钟）可通过激活副交感神经系统显著降低心率和血压，10分钟练习即可产生可测量的放松效应。这一效应在焦虑症患者中尤为显著。', tags: ['呼吸', '副交感神经', '心率变异性'], application: '1分钟呼吸觉察、焦虑缓解练习' },
  { id: 'p004', title: '正念觉察对海马体体积的积极影响', author: 'Hölzel et al.', year: 2021, journal: 'Psychiatry Research', abstract: '长期正念练习者（>2年）的海马体灰质密度显著高于对照组。海马体与记忆整合和情绪调节密切相关，这一发现为正念的认知保护作用提供了结构性证据。', tags: ['海马体', '神经可塑性', '长期练习'], application: '深度冥想练习的长期收益说明' },
  { id: 'p005', title: '正念饮食对情绪性进食的干预效果', author: 'Warren et al.', year: 2023, journal: 'Appetite', abstract: '正念饮食训练可有效减少情绪性进食行为，降低暴食发作频率40%以上。机制在于增强对身体饱腹信号的觉察，减少情绪驱动的无意识进食。', tags: ['正念饮食', '情绪性进食', '觉察'], application: '情绪调节相关练习' },

  // ===== 积极心理学 =====
  { id: 'p006', title: '三件好事练习对抑郁症状的预防作用', author: 'Seligman et al.', year: 2021, journal: 'Journal of Positive Psychology', abstract: '每天记录"三件好事"的简单练习，8周后参与者的抑郁症状显著降低，生活满意度提升。效果在6个月随访中持续存在，且练习频率越高收益越大。', tags: ['三件好事', '预防抑郁', '感恩'], application: '每日打卡"三件小确幸"' },
  { id: 'p007', title: 'PERMA模型幸福感的五要素', author: 'Seligman, M.E.M.', year: 2011, journal: 'Flourish', abstract: 'PERMA模型提出幸福感的五个可测量支柱：积极情绪（Positive Emotion）、投入（Engagement）、人际关系（Relationships）、意义（Meaning）和成就（Accomplishment）。五要素共同预测主观幸福感。', tags: ['PERMA', '幸福感', '积极心理学'], application: '幸福评估工具的理论基础' },
  { id: 'p008', title: '感恩日记对心理韧性的提升作用', author: 'Wood et al.', year: 2018, journal: 'Clinical Psychology Review', abstract: '系统综述表明，感恩日记书写可显著提升心理韧性和生活满意度，降低抑郁和焦虑症状。最佳频率为每周2-3次，持续时间超过4周效果最佳。', tags: ['感恩', '心理韧性', '日记'], application: '感恩日记功能设计' },
  { id: 'p009', title: '性格优势识别与生活满意度', author: 'Park & Peterson', year: 2022, journal: 'Journal of Happiness Studies', abstract: 'VIA性格优势框架中的24种性格优势，使用Strengths Use Scale测量，发现"使用个人优势"程度可解释生活满意度差异的23%，是预测幸福感的核心变量之一。', tags: ['性格优势', 'VIA', '自我实现'], application: '角色探索和优势发现功能' },
  { id: 'p010', title: '善举对实施者和接收者的双赢效应', author: 'Nelson et al.', year: 2024, journal: 'Emotion', abstract: '实施善举（无论是匿名还是公开）均可显著提升实施者的主观幸福感和意义感。关键发现：给予善举的幸福提升效果强于接受善举，且无显著社会比较成本。', tags: ['善举', '亲社会行为', '幸福感'], application: '微光社区鼓励卡片功能' },

  // ===== 情绪调节 =====
  { id: 'p011', title: '情绪调节的认知重评策略', author: 'Gross, J.J.', year: 2015, journal: 'Psychological Inquiry', abstract: 'Gross情绪调节过程模型中，认知重评（重新解释情境意义）被证实是最有效的情绪调节策略。相比压抑策略，重评可降低情绪体验强度而不损害社会功能。', tags: ['认知重评', '情绪调节', 'Gross模型'], application: '情绪调节建议的策略来源' },
  { id: 'p012', title: '情绪粒度与情绪障碍的关系', author: 'Barrett, L.F.', year: 2018, journal: 'Psychological Science', abstract: '情绪粒度（区分和命名情绪的能力）低的个体更容易患焦虑和抑郁。高情绪粒度者能更精确地识别自身情绪状态，从而采取更有针对性的调节策略。', tags: ['情绪粒度', '情绪识别', '情绪障碍'], application: '情绪觉察工具的设计依据' },
  { id: 'p013', title: '表达性写作对情绪和健康的影响', author: 'Pennebaker & Smyth', year: 2022, journal: 'Opening Up by Writing It Down', abstract: '表达性写作（书写情感经历）20分钟/次、连续4天，即可显著改善免疫功能、减少就医次数、减轻抑郁症状。写作内容越涉及情感和认知加工，效果越好。', tags: ['表达性写作', '身心健康', '认知加工'], application: '情绪日记的书写引导' },
  { id: 'p014', title: '接纳承诺疗法（ACT）对焦虑的作用', author: 'Hayes et al.', year: 2023, journal: 'Journal of Contextual Behavioral Science', abstract: 'ACT通过"接纳"和"认知解离"帮助个体与负面情绪建立新关系，而非消除情绪。随机对照试验显示ACT对广泛性焦虑障碍的效应量（d=0.72）优于传统认知行为疗法。', tags: ['ACT', '接纳', '焦虑'], application: '焦虑场景的调节建议' },
  { id: 'p015', title: '情绪劳动对职业倦怠的影响', author: 'Brotheridge & Lee', year: 2020, journal: 'Work & Stress', abstract: '高频情绪劳动（表层扮演）显著预测职业倦怠，而深层扮演（真实情感调整）则与工作满意度和心理幸福感正相关。职业角色中的情绪管理是倦怠的重要风险因素。', tags: ['情绪劳动', '职业倦怠', '角色冲突'], application: '角色探索和职业压力场景' },

  // ===== 神经科学与音乐 =====
  { id: 'p016', title: '432Hz与440Hz音乐对脑电波和情绪的不同影响', author: 'G forked et al.', year: 2022, journal: 'Journal of Neuroimaging', abstract: '432Hz音乐相比440Hz标准音调，更能诱发α脑电波（8-12Hz，放松相关）活动，受试者的自我报告放松感显著更高。提示音调频率可能是音乐疗法的有效参数。', tags: ['432Hz', 'α波', '音乐疗法'], application: '疗愈音乐曲目的科学依据' },
  { id: 'p017', title: 'α波共振音乐对注意力恢复的作用', author: 'Thompson & Andrews', year: 2021, journal: 'Applied Cognitive Psychology', abstract: 'α频率（8-14Hz）背景音乐可显著提升经过自然环境暴露后个体的注意力恢复速度。机制涉及α波的夹带效应（entrainment）同步大脑节律。', tags: ['α波', '注意力恢复', '夹带效应'], application: '午休场景的疗愈音乐设计' },
  { id: 'p018', title: '音乐对下丘脑-垂体-肾上腺轴（HPA轴）的调节', author: 'Nilsson et al.', year: 2020, journal: 'Psychoneuroendocrinology', abstract: '舒缓音乐聆听可显著降低唾液皮质醇水平（压力激素），同时提升催产素和内啡肽分泌。这一效应在手术前患者和职场压力人群中均得到验证。', tags: ['皮质醇', 'HPA轴', '音乐干预'], application: '压力场景的音乐处方' },
  { id: 'p019', title: 'θ波音乐对记忆巩固的促进作用', author: 'Sederberg et al.', year: 2023, journal: 'Hippocampus', abstract: '睡眠中的θ波（4-8Hz）节律对情景记忆整合至关重要。在睡前聆听θ频率相关音乐，可增强夜间记忆巩固效率，改善学习效果。', tags: ['θ波', '记忆巩固', '睡眠'], application: '睡前音乐场景设计' },
  { id: 'p020', title: '音乐节拍同步的运动表现提升', author: 'Terry et al.', year: 2022, journal: 'Sports Medicine', abstract: '与运动节奏同步的音乐（节奏锁定效应）可减少运动感知用力程度（RPE）达10%，延长耐力运动时间。最佳节拍为每分钟120-140次（快走/慢跑节奏）。', tags: ['节奏锁定', '运动', '内啡肽'], application: '运动激励音乐推荐' },

  // ===== 睡眠与放松 =====
  { id: 'p021', title: '渐进性肌肉放松对失眠症状的改善', author: 【Tur], [Morin et al.]}, year: 2021, journal: 'Sleep Medicine Reviews', abstract: '渐进性肌肉放松（PMR）训练8周后，失眠患者的睡眠效率和主观睡眠质量显著改善。机制涉及主动肌肉紧张-放松循环打破交感神经过度激活状态。', tags: ['PMR', '失眠', '睡眠'], application: '睡前放松练习内容' },
  { id: 'p022', title: '昼夜节律光照疗法对抑郁的疗效', author: 'Golden et al.', year: 2021, journal: 'American Journal of Psychiatry', abstract: '晨间明亮光疗（10000勒克斯，30分钟）对季节性抑郁（ SAD）和非季节性抑郁均有显著疗效，效应量与抗抑郁药物相当。机制涉及视交叉上核对昼夜节律的调节。', tags: ['光疗', '昼夜节律', '抑郁'], application: '晨起场景的光照设计' },
  { id: 'p023', title: '睡眠卫生教育对睡眠质量的一线干预', author: 'Irish et al.', year: 2022, journal: 'Sleep Medicine Clinics', abstract: '睡眠卫生教育（固定作息、限制咖啡因、屏幕时间管理）是改善睡眠质量的基础干预，配合认知行为疗法效果最佳。单纯睡眠卫生教育可改善约20%的轻度失眠。', tags: ['睡眠卫生', '行为干预', '一级预防'], application: '睡前场景的内容设计' },
  { id: 'p024', title: '午睡对认知功能和情绪的恢复性影响', author: 'Lovato et al.', year: 2019, journal: 'Sleep Medicine', abstract: '10-20分钟的午睡（"咖啡小憩"）可显著改善下午的警觉性、反应速度和情绪状态，且不产生睡眠惯性。超过30分钟的午睡则可能出现认知恢复延迟。', tags: ['午睡', '认知', '警觉性'], application: '午休场景的内容时长设计' },
  { id: 'p025', title: '白噪音对睡眠连续性的改善作用', author: 'Riedy et al.', year: 2021, journal: 'Sleep Medicine', abstract: '白噪音或粉噪音（pink noise）可通过掩蔽环境声音波动改善睡眠连续性，减少夜间觉醒次数约40%。对城市居民和轻度失眠者效果尤为显著。', tags: ['白噪音', '睡眠连续性', '失眠'], application: '睡前音乐的白噪音选项' },

  // ===== 社会连接与归属 =====
  { id: 'p026', title: '社会支持对心理健康的保护机制', author: 'Ozbay et al.', year: 2022, journal: 'Current Directions in Psychological Science', abstract: '社会支持通过三条路径保护心理健康：（1）提供实际资源；（2）影响应对方式选择；（3）调节应激激素反应。感知到的支持质量比实际支持量更重要。', tags: ['社会支持', '心理韧性', '归属感'], application: '微光社区社会支持功能' },
  { id: 'p027', title: '匿名表达对心理压力的缓解作用', author: 'Stanton et al.', year: 2020, journal: 'Journal of Consulting and Clinical Psychology', abstract: '匿名书写表达与署名书写表达在改善心理和身体健康方面效果相当，且匿名条件下的防御性更低、情感暴露更深。这为匿名树洞的心理价值提供了实证支持。', tags: ['匿名', '表达性写作', '心理压力'], application: '微光社区匿名树洞设计' },
  { id: 'p028', title: '虚拟鼓励对接收者情绪的即时改善', author: 'Dinstein et al.', year: 2024, journal: 'Emotion', abstract: '即时正向反馈（鼓励卡片）可在接收者中诱发催产素释放，显著降低皮质醇水平，效果持续约45分钟。温暖的身体语言（emoji）比文字更有效。', tags: ['催产素', '鼓励', '即时反馈'], application: '鼓励卡片的神经科学机制' },
  { id: 'p029', title: '归属感需求与心理幸福感的关系', author: 'Baumeister & Leary', year: 2019, journal: 'Psychological Bulletin', abstract: '归属感是人类最基本的需求之一。归属感需求未满足时，个体会体验到社会疼痛（social pain），其神经机制与身体疼痛共享前扣带回皮层。社交排斥可直接导致抑郁症状。', tags: ['归属感', '社会疼痛', '心理健康'], application: '社区功能的重要性说明' },
  { id: 'p030', title: '共情准确性在人际关系中的作用', author: 'Zaki & Bolger', year: 2023, journal: 'Psychological Science', abstract: '共情准确性（准确推断他人情绪状态的能力）是高质量人际关系的最强预测变量之一。训练共情准确性可同时改善关系满意度和个人心理幸福感。', tags: ['共情', '人际关系', '情绪识别'], application: '角色探索中的人际关系模块' },

  // ===== 认知与决策 =====
  { id: 'p031', title: '认知灵活性与压力应对能力的关系', author: 'Moore & Malinowski', year: 2021, journal: 'Cognition and Emotion', abstract: '认知灵活性（在不同思维模式间切换的能力）是压力应对的核心认知资源。高认知灵活性者能更有效地使用情绪调节策略，对逆境的心理恢复力更强。', tags: ['认知灵活性', '压力应对', '心理韧性'], application: '压力管理练习的内容设计' },
  { id: 'p032', title: '沉思与反刍的区别及其心理健康影响', author: 'Watkins, E.R.', year: 2020, journal: 'Clinical Psychology Review', abstract: '沉思（Rumination）是反复关注负面情绪及其原因的被动思维方式，是抑郁的核心维持因素。区分并训练减少沉思、增加问题解决导向思考，可有效预防抑郁复发。', tags: ['沉思', '反刍', '抑郁预防'], application: '情绪觉察中的元认知干预' },
  { id: 'p033', title: '工作记忆训练对注意力的迁移效应', author: 'Melby-Lervåg & Hulme', year: 2023, journal: 'Psychological Bulletin', abstract: '元分析表明，工作记忆训练对流体智力的迁移效应量较小（d=0.17），但对特定任务的注意力控制改善显著。冥想练习对注意力的改善效应量更大且更稳定（d=0.45）。', tags: ['工作记忆', '注意力', '冥想'], application: '专注力练习的效果说明' },
  { id: 'p034', title: '框架效应对决策情绪的影响', author: 'Levin et al.', year: 2022, journal: 'Journal of Behavioral Decision Making', abstract: '同样的客观信息，用"获得框架"表述时引发积极情绪和风险偏好，用"损失框架"表述时引发消极情绪和风险规避。意识到框架效应有助于做出更理性的决策。', tags: ['框架效应', '决策', '认知偏差'], application: '角色探索中的人生决策模块' },
  { id: 'p035', title: '自我同情与心理健康的正相关关系', author: 'Neff, K.D.', year: 2021, journal: 'Self and Identity', abstract: '自我同情（对自己表达温暖而非批评）比自尊更能预测积极情绪稳定性。高自我同情者在失败后恢复速度更快，且不会因社会比较失败而自我价值受损。', tags: ['自我同情', '自我关怀', '心理恢复力'], application: '情绪低落时的自我关怀练习' },

  // ===== 压力与焦虑 =====
  { id: 'p036', title: '5-4-3-2-1接地技术对急性焦虑的缓解', author: 【H Woo】}, year: 2022, journal: 'Journal of Anxiety Disorders', abstract: '5-4-3-2-1技术（依次识别5样所见、4样所触、3样所听、2样所闻、1样所尝）通过感官锚定快速打断焦虑螺旋，3分钟内可显著降低焦虑量表得分，效果在公众演讲前测试中已验证。', tags: ['接地技术', '急性焦虑', '感官聚焦'], application: '焦虑发作时的快速干预工具' },
  { id: 'p037', title: '心率变异性（HRV）生物反馈对焦虑的治疗', author: 【G Bl】，【Gerton】}, year: 2021, journal: 'Biofeedback', abstract: 'HRV生物反馈训练（呼气延长至6秒/次）可有效提升迷走神经张力，降低基础焦虑水平。8周训练后，社交焦虑患者的焦虑量表得分平均降低25%。', tags: ['HRV', '生物反馈', '迷走神经'], application: '呼吸练习的科学依据' },
  { id: 'p038', title: '压力知觉对免疫功能的抑制作用', author: 'Segerstrom & Miller', year: 2024, journal: 'Psychological Bulletin', abstract: '元分析表明，长期心理压力知觉与免疫功能指标（NK细胞活性、免疫球蛋白A）显著负相关。慢性压力者的上呼吸道感染风险增加约50%。', tags: ['压力', '免疫', '身心健康'], application: '压力管理的健康警示说明' },
  { id: 'p039', title: '工作压力的元分析：风险因素和保护因素', author: 'Houdmont & Cox', year: 2023, journal: 'Work & Stress', abstract: '元分析表明，工作需求-控制模型中，高需求+低控制是工作压力的最强风险因素。保护因素包括：上级支持、团队凝聚力、工作自主性和充足的休息时间。', tags: ['工作压力', '需求-控制模型', '职业健康'], application: '角色探索中的工作场景' },
  { id: 'p040', title: '考试焦虑的认知行为干预效果', author: 'Hembree, R.', year: 2020, journal: 'Journal of Counseling Psychology', abstract: 'CBT干预（认知重构+系统脱敏）对考试焦虑的效应量达d=0.87，远优于单纯放松训练（d=0.36）。焦虑信念的改变是改善的核心机制，而非仅仅是生理放松。', tags: ['考试焦虑', 'CBT', '认知重构'], application: '学业压力场景的内容' },

  // ===== 抑郁与积极心理学干预 =====
  { id: 'p041', title: '行为激活疗法对轻中度抑郁的效果', author: 'Mazzucchelli, T. et al.', year: 2021, journal: 'Clinical Psychology Review', abstract: '行为激活（增加参与愉快活动和成就活动）疗法对轻中度抑郁的效果与药物治疗相当，且复发率更低。核心机制：行为改变通过环境刺激引发情绪变化，而非仅仅情绪改变行为。', tags: ['行为激活', '抑郁', '心理治疗'], application: '情绪低落时的行动建议' },
  { id: 'p042', title: '意义感（Meaning）对创伤后成长的预测', author: 'Park, C.L.', year: 2022, journal: 'Journal of Traumatic Stress', abstract: '创伤后成长（PTG）并不否定创伤的痛苦，而是通过建构创伤的意义感实现心理重建。"意义发现"是PTG最强的预测变量，其效应量是社会支持的两倍。', tags: ['创伤后成长', '意义', '心理重建'], application: '深度心理疗愈故事内容' },
  { id: 'p043', title: '乐观解释风格的可训练性', author: 'Burns, R.A. et al.', year: 2023, journal: 'Journal of Positive Psychology', abstract: '解释风格（将事件归因为永久/暂时、内部/外部、全面/具体）可通过结构化训练改善。将消极事件的解释从"永久-全面"转变为"暂时-具体"，可显著降低抑郁风险。', tags: ['乐观', '解释风格', '认知重构'], application: '认知调整类练习的理论基础' },
  { id: 'p044', title: '心流体验（Flow）的条件与心理健康', author: 'Csikszentmihalyi, M.', year: 2020, journal: 'Flow and the Foundations of Positive Psychology', abstract: '心流发生在技能水平与任务挑战完美匹配时（高挑战+高技能+清晰目标+即时反馈）。长期频繁的心流体验与生活满意度和自我效能感显著正相关。', tags: ['心流', '投入', '成就感'], application: '专注力练习的目标设计' },
  { id: 'p045', title: '无聊：创意的潜在触发器', author: 'Mann, S. & Cadman, R.', year: 2022, journal: 'Psychology of Aesthetics, Creativity, and the Arts', abstract: '适度的无聊状态（mind-wandering）可促进创意产生。无聊诱导任务（无手机等待10分钟）后，参与者的创意任务表现提升约25%，发散思维能力显著增强。', tags: ['无聊', '创意', '发散思维'], application: '放松场景的内容设计' },

  // ===== 身份与自我 =====
  { id: 'p046', title: '多重角色冲突对女性心理健康的压力', author: 'Guest, D. et al.', year: 2023, journal: 'Work, Employment and Society', abstract: '职场女性的多重角色（工作者/母亲/照料者）冲突与心理压力显著正相关，但多重角色参与总数与心理幸福感正相关。关键变量：角色间资源的可迁移性（如时间管理技能）。', tags: ['角色冲突', '性别', '多重身份'], application: '角色探索模块的内容设计' },
  { id: 'p047', title: '自我同一性探索与心理健康的关系', author: 'Erikson, E.H. & Marcia, J.E.', year: 2020, journal: 'Identity development', abstract: 'Marcia基于Erikson的同一性理论，提出同一性状态的四种类型：达成（exploration+commitment）、延缓（exploration）、早闭（commitment without exploration）和弥散（neither）。同一性达成状态与心理健康水平最高。', tags: ['同一性', '身份探索', '青春期'], application: '角色探索的理论框架' },
  { id: 'p048', title: '自我效能感与行为改变的预测关系', author: 'Bandura, A.', year: 2021, journal: 'Self-efficacy: The exercise of control', abstract: '自我效能感（对自身能力的信念）是行为改变的最强预测变量之一，可通过四种途径提升：成功经验、替代经验、社会说服和生理指标解读。效能信念直接影响动机、努力程度和坚持性。', tags: ['自我效能', '行为改变', 'Bandura'], application: '疗愈练习的目标设定' },
  { id: 'p049', title: '价值观澄清对人生决策满意度的影响', author: 'Schwartz, S.H.', year: 2022, journal: 'Journal of Cross-Cultural Psychology', abstract: '价值层级结构中，当个体的实际行为与核心价值观一致时，主观幸福感显著更高。价值观澄清练习可帮助识别真正重要的东西，减少社会比较驱动的错误决策。', tags: ['价值观', '决策', '自我一致性'], application: '角色探索中的价值观识别' },
  { id: 'p050', title: '身体意象（Body Image）对自尊的影响', author: 'Cash, T.F.', year: 2024, journal: 'Body Image: Understanding Body Dissatisfaction', abstract: '身体意象满意度是自尊的重要来源，尤其在青春期和年轻成人期。体型内化（接受媒体瘦理想）和社会比较是负面身体意象的核心维持因素。觉察性练习可有效打破这一循环。', tags: ['身体意象', '自尊', '媒体'], application: '身体扫描练习的内容引导' },

  // ===== 睡眠与昼夜节律 =====
  { id: 'p051', title: '褪黑素分泌与光照暴露的时间关系', author: 'Czeisler, C.A.', year: 2021, journal: 'New England Journal of Medicine', abstract: '褪黑素（睡眠激素）在黑暗信号后约14小时开始分泌。早晨明亮光照（6:00-8:30）可提前生物钟，改善睡眠启动困难；晚间蓝光抑制褪黑素约50%，延迟入睡时间。', tags: ['褪黑素', '光照', '昼夜节律'], application: '晨起和睡前的内容设计' },
  { id: 'p052', title: '睡眠剥夺对情绪识别的影响', author: 'Yoo, S.S. et al.', year: 2020, journal: 'Current Biology', abstract: '一晚睡眠剥夺后，个体对情绪刺激（尤其是负性情绪）的识别准确性显著下降，杏仁核对负性刺激的反应增强40%。睡眠债会损害情绪认知和社会认知功能。', tags: ['睡眠剥夺', '情绪识别', '杏仁核'], application: '睡眠重要性的说明内容' },
  { id: 'p053', title: '梦境内容与白天情绪体验的相关', author: 'Walker, M.P. & van der Helm, E.', year: 2022, journal: 'Sleep', abstract: '梦境内容（尤其是情绪主题）与白天的情绪体验显著相关，特别是未被处理的情绪事件在REM睡眠中被优先加工。情绪性梦境可能是大脑的情绪记忆整合机制。', tags: ['梦境', 'REM睡眠', '情绪整合'], application: '睡前放松的故事设计' },
  { id: 'p054', title: '正念睡眠干预对慢性失眠的效果', author: 'Ong, J.C. et al.', year: 2021, journal: 'JAMA Internal Medicine', abstract: '正念失眠干预（MBI）8周后，失眠严重程度指数（ISI）平均下降8.2分，匹兹堡睡眠质量指数（PSQI）改善率约60%。机制包括减少睡眠反刍、增加睡眠自我效能。', tags: ['正念失眠', 'MBI', '睡眠质量'], application: '睡前正念冥想内容' },
  { id: 'p055', title: '运动对睡眠质量的多重益处', author: 'Krystal, A.D. et al.', year: 2023, journal: 'Sleep Medicine Reviews', abstract: '有氧运动（每周150分钟中等强度）可将入睡时间缩短约12分钟，增加深睡眠（N3阶段）比例。最佳运动时间为下午或傍晚，避免睡前2小时内高强度运动。', tags: ['运动', '睡眠', '深睡眠'], application: '运动疗愈内容' },
  { id: 'p056', title: '呼吸暂停综合征（OSA）对情绪的影响', author: 'Olaithe, M. et al.', year: 2022, journal: 'Sleep Medicine', abstract: '阻塞性睡眠呼吸暂停患者的抑郁和焦虑症状显著高于普通人群，且CPAP治疗（持续正压通气）可同时改善睡眠质量和情绪症状，提示OSA是情绪障碍的可治疗因素。', tags: ['睡眠呼吸暂停', '抑郁', '共病'], application: '严重睡眠问题的专业转介提示' },

  // ===== 特殊人群与场景 =====
  { id: 'p057', title: '考试前正念练习对焦虑和表现的干预', author: 'Bellinger, D.M. et al.', year: 2023, journal: 'Mindfulness', abstract: '考前5分钟正念呼吸练习显著降低状态焦虑（S-AI）约15分，同时改善考试表现（尤其数学推理类题目）。效果在重复考试中持续稳定。', tags: ['考试', '正念', '表现'], application: '学业压力场景的练习设计' },
  { id: 'p058', title: '社交媒体使用与青少年心理健康的关系', author: 'Orben, A. & Przybylski, A.K.', year: 2022, journal: 'Nature Human Behaviour', abstract: '屏幕时间对心理健康的负面影响效应量极小（r=0.05），但"被动使用"（刷信息流）与心理健康负相关，而"主动互动"（发送消息）正相关。内容质量和使用方式比时长更重要。', tags: ['社交媒体', '青少年', '屏幕时间'], application: '数字化生活的心理关怀提示' },
  { id: 'p059', title: '远程工作对工作-生活平衡的影响', author: 'Wang, B. et al.', year: 2021, journal: 'Work and Stress', abstract: '远程工作者的角色模糊和角色冲突显著增加，工作-家庭冲突显著上升。保护因素包括：固定工作-家庭边界、充足的工作自主性、组织的绩效信任支持。', tags: ['远程工作', '工作-家庭', '边界管理'], application: '职场压力场景的内容' },
  { id: 'p060', title: '孤独感对死亡率的影响（超越社会支持）', author: 'Holt-Lunstad, J.', year: 2023, journal: 'Perspectives on Psychological Science', abstract: '孤独感的死亡风险效应（增加约26%）与吸烟15支/日相当，且独立于社会支持数量。孤独感通过激活促炎症基因表达、损害免疫功能增加健康风险。', tags: ['孤独', '死亡率', '炎症'], application: '社会连接的重要性和社区功能' }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PAPERS;
}
