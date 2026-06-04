/**
 * VIA 性格优势测评引擎
 * 基于 2026 年 Validated Short Form (48 题，每优势 2 题)
 * 参考：Casali et al. (2026). Validity of a very short measure of character strengths
 *        Peterson & Seligman (2004). Character Strengths and Virtues
 */

const VIAInventory = (() => {
    'use strict';

    // ========== 24 项性格优势定义 ==========
    const STRENGTHS = [
        // 一、智慧与知识（Wisdom & Knowledge）
        { id: 'creativity',        cn: '创造力',       en: 'Creativity',        virtue: 'wisdom',        virtueCn: '智慧与知识' },
        { id: 'curiosity',         cn: '好奇心',       en: 'Curiosity',        virtue: 'wisdom',        virtueCn: '智慧与知识' },
        { id: 'judgment',          cn: '判断力',       en: 'Judgment',         virtue: 'wisdom',        virtueCn: '智慧与知识' },
        { id: 'love_of_learning',  cn: '热爱学习',     en: 'Love of Learning',  virtue: 'wisdom',        virtueCn: '智慧与知识' },
        { id: 'perspective',       cn: '洞察力',       en: 'Perspective',      virtue: 'wisdom',        virtueCn: '智慧与知识' },

        // 二、勇气（Courage）
        { id: 'bravery',           cn: '勇敢',         en: 'Bravery',          virtue: 'courage',       virtueCn: '勇气' },
        { id: 'perseverance',      cn: '毅力',         en: 'Perseverance',     virtue: 'courage',       virtueCn: '勇气' },
        { id: 'honesty',           cn: '真诚',         en: 'Honesty',          virtue: 'courage',       virtueCn: '勇气' },
        { id: 'zest',              cn: '热情',         en: 'Zest',             virtue: 'courage',       virtueCn: '勇气' },

        // 三、仁爱（Humanity）
        { id: 'love',              cn: '爱',           en: 'Love',             virtue: 'humanity',      virtueCn: '仁爱' },
        { id: 'kindness',          cn: '善良',         en: 'Kindness',         virtue: 'humanity',      virtueCn: '仁爱' },
        { id: 'social_intelligence', cn: '社会智慧',   en: 'Social Intelligence', virtue: 'humanity',  virtueCn: '仁爱' },

        // 四、正义（Justice）
        { id: 'teamwork',          cn: '团队合作',     en: 'Teamwork',         virtue: 'justice',       virtueCn: '正义' },
        { id: 'fairness',          cn: '公平',         en: 'Fairness',         virtue: 'justice',       virtueCn: '正义' },
        { id: 'leadership',        cn: '领导力',       en: 'Leadership',       virtue: 'justice',       virtueCn: '正义' },

        // 五、节制（Temperance）
        { id: 'forgiveness',       cn: '宽恕',         en: 'Forgiveness',      virtue: 'temperance',    virtueCn: '节制' },
        { id: 'humility',          cn: '谦逊',         en: 'Humility',         virtue: 'temperance',    virtueCn: '节制' },
        { id: 'prudence',          cn: '谨慎',         en: 'Prudence',         virtue: 'temperance',    virtueCn: '节制' },
        { id: 'self_regulation',   cn: '自我调节',     en: 'Self-Regulation',  virtue: 'temperance',    virtueCn: '节制' },

        // 六、超越（Transcendence）
        { id: 'appreciation_of_beauty', cn: '欣赏美', en: 'Appreciation of Beauty', virtue: 'transcendence', virtueCn: '超越' },
        { id: 'gratitude',         cn: '感恩',         en: 'Gratitude',        virtue: 'transcendence', virtueCn: '超越' },
        { id: 'hope',              cn: '希望',         en: 'Hope',             virtue: 'transcendence', virtueCn: '超越' },
        { id: 'humor',            cn: '幽默',         en: 'Humor',           virtue: 'transcendence', virtueCn: '超越' },
        { id: 'spirituality',      cn: '灵性',         en: 'Spirituality',     virtue: 'transcendence', virtueCn: '超越' },
    ];

    // ========== 48 道测评题目（每优势 2 题）==========
    // 基于 VIA-48 研究重新措辞，避免版权问题
    // 量表：1 = 非常不像我，5 = 非常像我
    const ITEMS = [
        // 1. 创造力
        { id: 'c1', strength: 'creativity',  text: '我喜欢找到做事情的新方法', textEn: 'I find new ways of doing things' },
        { id: 'c2', strength: 'creativity',  text: '我善于用创新的方式解决问题', textEn: 'I come up with original solutions to problems' },
        // 2. 好奇心
        { id: 'c3', strength: 'curiosity',  text: '我对这个世界充满好奇，想知道更多', textEn: 'I am curious about many things in the world' },
        { id: 'c4', strength: 'curiosity',  text: '我喜欢探索新话题和新想法', textEn: 'I enjoy exploring new topics and ideas' },
        // 3. 判断力
        { id: 'c5', strength: 'judgment',  text: '我做决定前会仔细权衡各方观点', textEn: 'I weigh all sides before making a decision' },
        { id: 'c6', strength: 'judgment',  text: '我善于批判性地思考问题的本质', textEn: 'I think critically about the core of a problem' },
        // 4. 热爱学习
        { id: 'c7', strength: 'love_of_learning', text: '我喜欢深入学习我感兴趣的领域', textEn: 'I enjoy deep diving into topics that interest me' },
        { id: 'c8', strength: 'love_of_learning', text: '我总是想学到更多新知识和技能', textEn: 'I always want to learn more new knowledge and skills' },
        // 5. 洞察力
        { id: 'c9',  strength: 'perspective', text: '朋友们常说我能给出明智的建议', textEn: 'Friends often say I give wise advice' },
        { id: 'c10', strength: 'perspective', text: '我能从多个角度看待人生困境', textEn: 'I can see life challenges from multiple angles' },
        // 6. 勇敢
        { id: 'c11', strength: 'bravery',  text: '即使害怕，我也会做我认为正确的事', textEn: 'I do what I believe is right even when I am afraid' },
        { id: 'c12', strength: 'bravery',  text: '我敢于在他人不敢发声时表达意见', textEn: 'I speak up when others are afraid to do so' },
        // 7. 毅力
        { id: 'c13', strength: 'perseverance', text: '我一旦开始就会坚持完成目标', textEn: 'Once I start, I persist until I reach my goal' },
        { id: 'c14', strength: 'perseverance', text: '面对困难时我不会轻易放弃', textEn: 'I do not give up easily when facing difficulties' },
        // 8. 真诚
        { id: 'c15', strength: 'honesty',  text: '我对自己和他人都坦诚相待', textEn: 'I am honest with myself and with others' },
        { id: 'c16', strength: 'honesty',  text: '我说的和做的是一致的', textEn: 'My words and actions are consistent' },
        // 9. 热情
        { id: 'c17', strength: 'zest',  text: '我对生活充满活力和热情', textEn: 'I approach life with energy and enthusiasm' },
        { id: 'c18', strength: 'zest',  text: '我做喜欢的事情时全神贯注、精力充沛', textEn: 'I feel energized and fully engaged in what I love' },
        // 10. 爱
        { id: 'c19', strength: 'love',  text: '与亲近的人相处时我感到最幸福', textEn: 'I feel happiest when I am with loved ones' },
        { id: 'c20', strength: 'love',  text: '我重视并投入维护亲密关系', textEn: 'I value and invest in close relationships' },
        // 11. 善良
        { id: 'c21', strength: 'kindness',  text: '我主动帮助需要帮助的人', textEn: 'I actively help people who need assistance' },
        { id: 'c22', strength: 'kindness',  text: '为他人做善事让我感到快乐', textEn: 'Doing kind things for others makes me happy' },
        // 12. 社会智慧
        { id: 'c23', strength: 'social_intelligence', text: '我能敏锐地感知他人的情绪和动机', textEn: 'I am sensitive to other people\'s emotions and motivations' },
        { id: 'c24', strength: 'social_intelligence', text: '我善于在不同社交场合中得体应对', textEn: 'I know how to behave appropriately in different social situations' },
        // 13. 团队合作
        { id: 'c25', strength: 'teamwork',  text: '作为团队成员，我乐于尽我的一份力', textEn: 'As a team member, I am happy to do my part' },
        { id: 'c26', strength: 'teamwork',  text: '我重视团队共同目标胜过个人成就', textEn: 'I value team goals over individual recognition' },
        // 14. 公平
        { id: 'c27', strength: 'fairness',  text: '我对待所有人都不带偏见', textEn: 'I treat all people without prejudice' },
        { id: 'c28', strength: 'fairness',  text: '即使对我不喜欢的人，我也给予公平对待', textEn: 'I am fair to people I do not particularly like' },
        // 15. 领导力
        { id: 'c29', strength: 'leadership',  text: '我能鼓励团队成员共同努力实现目标', textEn: 'I can encourage team members to work together toward a goal' },
        { id: 'c30', strength: 'leadership',  text: '我善于在团队中分配任务并协调合作', textEn: 'I am good at assigning tasks and coordinating teamwork' },
        // 16. 宽恕
        { id: 'c31', strength: 'forgiveness',  text: '我愿意原谅那些伤害过我的人', textEn: 'I am willing to forgive those who have hurt me' },
        { id: 'c32', strength: 'forgiveness',  text: '我不会被过去的伤害定义现在的关系', textEn: 'I do not let past hurts define my current relationships' },
        // 17. 谦逊
        { id: 'c33', strength: 'humility',  text: '我不喜欢炫耀自己的成就', textEn: 'I do not like to show off my accomplishments' },
        { id: 'c34', strength: 'humility',  text: '我承认自己的局限，也认可他人的贡献', textEn: 'I acknowledge my limitations and recognize others\' contributions' },
        // 18. 谨慎
        { id: 'c35', strength: 'prudence',  text: '我做决定前会仔细考虑可能的后果', textEn: 'I carefully consider possible consequences before deciding' },
        { id: 'c36', strength: 'prudence',  text: '我不急于行动，而是先深思熟虑', textEn: 'I do not act hastily; I think things through first' },
        // 19. 自我调节
        { id: 'c37', strength: 'self_regulation', text: '我能控制自己的冲动和情绪', textEn: 'I can control my impulses and emotions' },
        { id: 'c38', strength: 'self_regulation', text: '即使面对诱惑，我也能坚持自己的原则', textEn: 'Even when faced with temptation, I stick to my principles' },
        // 20. 欣赏美
        { id: 'c39', strength: 'appreciation_of_beauty', text: '生活中的美（自然、艺术、人性）常让我感动', textEn: 'Beauty in life (nature, art, humanity) often moves me' },
        { id: 'c40', strength: 'appreciation_of_beauty', text: '我会在日常中特意留意和欣赏美好的事物', textEn: 'I make a point of noticing and appreciating beautiful things in daily life' },
        // 21. 感恩
        { id: 'c41', strength: 'gratitude',  text: '我常常对生活中的美好事物心存感激', textEn: 'I often feel grateful for the good things in my life' },
        { id: 'c42', strength: 'gratitude',  text: '我会主动向帮助过我的人表达感谢', textEn: 'I actively express thanks to people who have helped me' },
        // 22. 希望
        { id: 'c43', strength: 'hope',  text: '我相信未来会更好，并为此努力', textEn: 'I believe the future will be better and I work toward it' },
        { id: 'c44', strength: 'hope',  text: '即使现在困难，我也对未来抱有期待', textEn: 'Even when things are difficult now, I remain hopeful about the future' },
        // 23. 幽默
        { id: 'c45', strength: 'humor',  text: '我喜欢用幽默让他人笑起来', textEn: 'I like to use humor to make others laugh' },
        { id: 'c46', strength: 'humor',  text: '我能在困难时刻找到可以笑对的事情', textEn: 'I can find something to laugh about even in difficult moments' },
        // 24. 灵性
        { id: 'c47', strength: 'spirituality',  text: '我相信生活中有比我自己更大的意义', textEn: 'I believe there is a meaning larger than myself in life' },
        { id: 'c48', strength: 'spirituality',  text: '我的生活和选择受到内心信念的指引', textEn: 'My life and choices are guided by my inner beliefs' },
    ];

    // ========== 结果解读模板 ==========
    const INTERPRETATIONS = {
        creativity: {
            cn: '你有丰富的想象力和创新思维。试着用创造力解决日常问题，或从事需要创意表达的活动。',
            en: 'You have rich imagination and innovative thinking. Try using creativity to solve everyday problems or engage in creative expression.',
            apply: ['用新角度解决老问题', '尝试艺术创作（写作/绘画/音乐）', '在团队中担任「创意担当」'],
            applyEn: ['Solve old problems from new angles', 'Try artistic creation (writing/art/music)', 'Be the "creative thinker" in your team'],
        },
        curiosity: {
            cn: '你的好奇心是探索世界的引擎。保持提问的习惯，每天学一点新东西。',
            en: 'Your curiosity is the engine that drives exploration. Keep asking questions and learn something new every day.',
            apply: ['每天花 15 分钟探索一个陌生话题', '拜访从未去过的城市角落', '把「我不知道，让我查一下」变成口头禅'],
            applyEn: ['Spend 15 min daily exploring an unfamiliar topic', 'Visit a part of your city you\'ve never been to', 'Make "I don\'t know, let me look it up" your mantra'],
        },
        judgment: {
            cn: '你善于理性分析、权衡利弊。在信息过载的时代，你的判断力是宝贵的「防伪探测器」。',
            en: 'You excel at rational analysis and weighing pros and cons. In an age of information overload, your judgment is a valuable "fake-detector".',
            apply: ['在重要决定前列出正反论据', '帮助朋友理清思路（但不替他们做决定）', '练习区分「事实」和「观点」'],
            applyEn: ['List pros & cons before important decisions', 'Help friends clarify their thinking (without deciding for them)', 'Practice distinguishing "fact" from "opinion"'],
        },
        love_of_learning: {
            cn: '学习对你而言不是任务，而是乐趣。把这种热爱传递给他人——教是最好的学。',
            en: 'Learning is not a chore for you, it\'s a joy. Pass this love on to others — teaching is the best way to learn.',
            apply: ['报名一门你一直好奇但没时间学的课程', '加入读书俱乐部或学习小组', '把学到的东西教给别人（费曼技巧）'],
            applyEn: ['Sign up for a course you\'ve been curious about', 'Join a book club or study group', 'Teach what you learn to someone else (Feynman technique)'],
        },
        perspective: {
            cn: '你拥有「长镜头」——能在混乱中看到全局。朋友向你求助时，你的建议往往击中要害。',
            en: 'You have "long lens" vision — you can see the big picture in the midst of chaos. When friends seek your advice, it often hits the nail on the head.',
            apply: ['主动在团队中担任「观察者」角色', '写反思日记，记录你对人生困境的洞察', '在 mentoring 关系中分享你的智慧'],
            applyEn: ['Volunteer as the "observer" in team discussions', 'Keep a reflection journal of your insights on life challenges', 'Share your wisdom in mentoring relationships'],
        },
        bravery: {
            cn: '你愿意为正确的事站出来，即使这会让你不舒服。勇敢不是不害怕，而是带着恐惧前行。',
            en: 'You are willing to stand up for what is right, even when it makes you uncomfortable. Bravery is not absence of fear, but moving forward with it.',
            apply: ['每周做一件「有点害怕但知道是对的」的事', '在看到不公时，礼貌但坚定地发声', '尝试你一直想做但不敢尝试的事'],
            applyEn: ['Do one thing each week that scares you but you know is right', 'When you see injustice, speak up politely but firmly', 'Try something you\'ve always wanted to do but were afraid to'],
        },
        perseverance: {
            cn: '你的毅力让你在他人放弃后还能继续。记住：进步比完美更重要——「完成」好过「完美」。',
            en: 'Your perseverance keeps you going when others quit. Remember: progress > perfection — "done" is better than "perfect".',
            apply: ['把大目标拆成小步骤，每完成一步就庆祝', '在想放弃时，问自己「再试一次会怎样？」', '记录你的「坚持日志」，回顾已经走过的路'],
            applyEn: ['Break big goals into tiny steps; celebrate each completion', 'When you want to quit, ask "what if I try one more time?"', 'Keep a "persistence log" to review how far you\'ve come'],
        },
        honesty: {
            cn: '你的真诚让人感到安全——人们知道你不会玩弄心机。真诚不代表毫无保留，而是言行一致。',
            en: 'Your honesty makes people feel safe — they know you won\'t play games. Honesty doesn\'t mean no filter; it means alignment between words and actions.',
            apply: ['练习「温和的诚实」——说真话，但用善意包裹', '当你犯了错，主动承认（这反而会赢得尊重）', '观察你是否在某些场合「表演」——试着更真实地表达'],
            applyEn: ['Practice "gentle honesty" — tell the truth, but wrap it in kindness', 'When you make a mistake, own it (this earns respect)', 'Notice when you\'re "performing" — try expressing more authentically'],
        },
        zest: {
            cn: '你的热情是有感染力的！你走进房间时，气氛会变亮。记住也要给自己充电——热情的人也需要休息。',
            en: 'Your enthusiasm is contagious! When you walk into a room, the mood brightens. Remember to recharge yourself too — passionate people need rest.',
            apply: ['每天做一件让你「眼睛发光」的事', '在你的社交圈中担任「能量提供者」', '注意你的能量消耗者——适度设界限'],
            applyEn: ['Do one thing daily that makes your "eyes light up"', 'Be the "energy giver" in your social circle', 'Notice your energy drainers — set boundaries as needed'],
        },
        love: {
            cn: '你懂得建立和维系深层关系。爱不是依赖，而是两个独立的人选择彼此陪伴。继续培育你生命中的重要关系。',
            en: 'You know how to build and maintain deep relationships. Love is not dependency — it\'s two whole people choosing to walk together. Keep nurturing the important relationships in your life.',
            apply: ['每周安排一次「高质量相处时间」', '练习主动表达爱（不只是心里想，要说出来/做出来）', '学会接受他人的爱——接受爱也是一种爱的表达'],
            applyEn: ['Schedule one "quality time" session per week', 'Practice actively expressing love (not just feeling it)', 'Learn to receive love from others — receiving is also a form of love'],
        },
        kindness: {
            cn: '你的善良不是软弱，而是一种力量。善良需要有边界——否则会耗尽自己。试着把善良当作「有意识的选择」。',
            en: 'Your kindness is not weakness, it\'s strength. Kindness needs boundaries — otherwise it depletes you. Try treating kindness as "a conscious choice".',
            apply: ['每天做一件随机善事（帮陌生人按电梯、给同事倒咖啡）', '练习说「不」而不感到内疚', '观察你的善良是否被利用——善良不等于当受气包'],
            applyEn: ['Do one random act of kindness daily (hold the elevator, refill coffee)', 'Practice saying "no" without feeling guilty', 'Notice if your kindness is being exploited — kindness ≠ doormat'],
        },
        social_intelligence: {
            cn: '你有一种「社交雷达」——能敏锐地感知房间里的情绪气氛。用这个天赋帮助他人感到被看见。',
            en: 'You have "social radar" — you can sensitively pick up the emotional temperature in a room. Use this gift to help others feel seen.',
            apply: ['在会议/聚会中，主动关注那个被忽略的人', '练习「反映式倾听」——先复述对方的话，再回应', '观察不同文化/群体的社交规范，提升跨文化社交智慧'],
            applyEn: ['In meetings/gatherings, actively notice the person being left out', 'Practice "reflective listening" — paraphrase before responding', 'Observe social norms across cultures/groups to build cross-cultural social intelligence'],
        },
        teamwork: {
            cn: '你在团队中不是那个抢功劳的人，而是让每个人都发光的人。好的团队合作不只是「配合」，更是「让彼此变得更好」。',
            en: 'In a team, you\'re not the one stealing credit — you\'re the one who makes everyone else shine. Good teamwork is not just "cooperating" — it\'s "making each other better".',
            apply: ['主动在团队中担任「连接器」角色', '当团队成功时，公开认可他人的贡献', '帮助新成员融入团队（你曾经也是新人）'],
            applyEn: ['Volunteer as the "connector" in team settings', 'When the team succeeds, publicly acknowledge others\' contributions', 'Help new members integrate into the team (you were once new too)'],
        },
        fairness: {
            cn: '你对公平的敏感度让你在需要公正决策的角色中表现出色。公平不代表「一刀切」——真正的公平是「给每个人他们真正需要的」。',
            en: 'Your sensitivity to fairness makes you excellent in roles requiring impartial decisions. Fairness doesn\'t mean "one size fits all" — true fairness is "giving each person what they actually need".',
            apply: ['当你做决策时，问自己「最弱势的人会怎么受影响？」', '阅读关于正义理论的书籍（如迈克尔·桑德尔的《公正》）', '在日常中注意无意识的偏见（我们每个人都会有）'],
            applyEn: ['When making decisions, ask "how would the most vulnerable person be affected?"', 'Read about theories of justice (e.g., Michael Sandel\'s "Justice")', 'Notice unconscious biases in daily life (we all have them)'],
        },
        leadership: {
            cn: '你的领导力不是关于权力，而是关于服务。真正的领导者不是那个嗓门最大的人，而是那个让团队找到方向的人。',
            en: 'Your leadership is not about power, it\'s about service. A true leader is not the loudest voice — it\'s the person who helps the team find its direction.',
            apply: ['主动在小组项目中担任协调者', '练习「服务型领导」——问团队「你们需要我做什么？」', '观察你欣赏的领导者，提炼他们的特质'],
            applyEn: ['Volunteer as coordinator in group projects', 'Practice "servant leadership" — ask the team "what do you need from me?"', 'Observe leaders you admire and distill their qualities'],
        },
        forgiveness: {
            cn: '你的宽恕不是忘记，而是选择不再让过去的伤害继续伤害你。宽恕是给自己的一份礼物——不是给那个伤害你的人的。',
            en: 'Your forgiveness is not about forgetting — it\'s about choosing not to let past hurts keep hurting you. Forgiveness is a gift you give yourself — not the person who hurt you.',
            apply: ['写一封「不寄出的信」——把你对那个人的感受全部写下来，然后烧掉/撕掉', '练习区分「宽恕」和「信任」——你可以宽恕一个人，但不一定再信任他们', '每天释放一个小小的怨恨（不一定是大事，可能是今天的堵车）'],
            applyEn: ['Write a "letter you don\'t send" — pour out all feelings, then burn/tear it', 'Practice distinguishing "forgiveness" from "trust" — you can forgive without trusting again', 'Release one small resentment daily (not just big hurts — maybe today\'s traffic jam)'],
        },
        humility: {
            cn: '你的谦逊让你容易被亲近——人们不觉得他们在你面前需要「表演」。谦逊不是低估自己，而是准确地看待自己。',
            en: 'Your humility makes you approachable — people don\'t feel they need to "perform" around you. Humility is not undervaluing yourself, it\'s seeing yourself accurately.',
            apply: ['每天承认一个自己的局限或错误（这其实是力量的表现）', '当别人夸你时，说「谢谢」，而不是「哪里哪里」', '主动在对话中问他人「你觉得呢？」——真心想知道他们的想法'],
            applyEn: ['Acknowledge one of your limitations or mistakes daily (this is actually a sign of strength)', 'When someone compliments you, say "thank you" instead of "no no no"', 'Ask "what do you think?" in conversations — genuinely want to know'],
        },
        prudence: {
            cn: '你的谨慎让你在冲动的世界里保持清醒。谨慎不代表不敢冒险——而是「知道什么时候该冒险，什么时候该等待」。',
            en: 'Your prudence keeps you clear-headed in an impulsive world. Prudence doesn\'t mean not taking risks — it means "knowing when to take risks and when to wait".',
            apply: ['做大决定前，给自己 24 小时「冷却期」', '练习「预先反思」——想象最坏的情况，并想好应对方案', '帮助冲动的朋友慢下来（你的谨慎可以平衡他们的冲动）'],
            applyEn: ['Give yourself a 24-hour "cooling period" before big decisions', 'Practice "pre-flection" — imagine the worst case and plan for it', 'Help impulsive friends slow down (your prudence balances their impulsivity)'],
        },
        self_regulation: {
            cn: '你的自我调节能力让你在情绪风暴中保持锚定。这不是压抑情绪——而是「感受它，但不被它驱动」。',
            en: 'Your self-regulation lets you stay anchored in emotional storms. This isn\'t about suppressing emotions — it\'s about "feeling it, but not being driven by it".',
            apply: ['当你感到强烈情绪时，先数到 10 再行动', '建立「情绪检查点」——每天三次暂停，问自己「我现在感受如何？」', '练习「刺激-反应间隙」——在外界刺激和你的反应之间，插入一个意识空间'],
            applyEn: ['When you feel a strong emotion, count to 10 before acting', 'Build "emotion checkpoints" — pause 3x daily and ask "what am I feeling right now?"', 'Practice the "stimulus-response gap" — insert a space of awareness between trigger and reaction'],
        },
        appreciation_of_beauty: {
            cn: '你能看见别人忽略的美。这不是「文艺矫情」——而是一种深层的「在场感」。美是心流的入口之一。',
            en: 'You can see beauty that others miss. This isn\'t about being "artistically pretentious" — it\'s about deep "presence". Beauty is one of the gateways to flow.',
            apply: ['每天「美学散步」5 分钟——不带目的地观察周围的美', '创建一个「美之物清单」——记录让你感动的事物', '分享你发现的美（发照片给朋友、在社交媒体上分享）'],
            applyEn: ['Take a 5-min "aesthetic walk" daily — observe beauty around you without an agenda', 'Create a "beauty inventory" — list things that move you', 'Share the beauty you notice (send a photo to a friend, post on social media)'],
        },
        gratitude: {
            cn: '你的感恩不是客套，而是真心。研究显示，每天写 3 件好事的人，幸福感在 6 个月后显著提升。',
            en: 'Your gratitude is not politeness — it\'s genuine. Research shows people who write down 3 good things daily have significantly higher well-being 6 months later.',
            apply: ['每天睡前记录 3 件好事（不超过 1 分钟）', '每周给一个人发一条「感恩短信」', '当你感到抱怨冲动时，先想一件你可以感恩的事'],
            applyEn: ['Record 3 good things before bed each night (takes < 1 min)', 'Send one "gratitude text" to someone each week', 'When you feel the urge to complain, first think of one thing you\'re grateful for'],
        },
        hope: {
            cn: '你的希望感不是盲目的乐观，而是一种「我相信未来可以更好，并且我愿意为之努力」的态度。希望 = 目标 + 路径 + 意志力。',
            en: 'Your hope is not blind optimism — it\'s the attitude of "I believe the future can be better, and I\'m willing to work for it". Hope = goals + pathways + willpower.',
            apply: ['把大希望拆成小希望（「希望自己更健康」→「希望这周走 3 次步」）', '创建一个「希望可视化板」——贴满代表你希望的图片/文字', '当你感到绝望时，问自己「一年后，这件事还会这么糟糕吗？」'],
            applyEn: ['Break big hopes into small hopes ("hope to be healthier" → "hope to walk 3x this week")', 'Create a "hope vision board" — fill it with images/words representing your hopes', 'When you feel hopeless, ask "will this still feel this bad a year from now?"'],
        },
        humor: {
            cn: '你的幽默感是抗压的利器。幽默不是嘲笑别人，而是和别人一起笑——包括笑自己。自嘲是自信的表现。',
            en: 'Your sense of humor is a powerful stress-buster. Humor isn\'t about mocking others — it\'s about laughing with people, including laughing at yourself. Self-deprecation is a sign of confidence.',
            apply: ['每天找一个可以笑对的瞬间（堵车？至少你可以听喜欢的播客）', '和朋友们分享好笑的故事（包括你自己的囧事）', '练习「重组框架」——把「糟糕的情况」重新讲成「好笑的情况」'],
            applyEn: ['Find one moment daily to laugh at life (traffic jam? at least you can listen to your favorite podcast)', 'Share funny stories with friends (including your own embarrassments)', 'Practice "reframing" — retell a "terrible situation" as a "funny situation"'],
        },
        spirituality: {
            cn: '你的灵性让你在混乱的世界里有锚点。灵性不一定是宗教——它可以是对生命意义的探索、与自然的连接、或对「比自己更大的存在」的感知。',
            en: 'Your spirituality gives you an anchor in a chaotic world. Spirituality isn\'t necessarily religion — it can be exploration of life\'s meaning, connection with nature, or sensing "something larger than yourself".',
            apply: ['每周花 30 分钟在安静中独处（不带手机）', '写「意义日记」——记录那些让你感到「活着真好」的瞬间', '与自然深度连接（爬山、看海、观察星空）'],
            applyEn: ['Spend 30 minutes in quiet solitude weekly (no phone)', 'Keep a "meaning journal" — record moments when you felt "glad to be alive"', 'Connect deeply with nature (hike, watch the ocean, stargaze)'],
        },
    };

    // ========== 核心方法 ==========

    /**
     * 开始测评
     * @returns {Object} - { items: 题目列表, totalItems: 总数 }
     */
    function startAssessment() {
        const isEn = _isEnglish();
        const shuffled = _shuffleArray([...ITEMS]);
        return {
            items: shuffled,
            totalItems: shuffled.length,
        };
    }

    /**
     * 计分：计算 24 项优势的分数
     * @param {Array} answers - [{ itemId, score }]，score: 1-5
     * @returns {Object} - { scores: [{ id, cn, en, virtue, score, percentile }], signatureStrengths: [top5], fullRanking: [24 项全排名] }
     */
    function calculateScores(answers) {
        // 1. 计算每项优势的平均分（每优势 2 题）
        const strengthScores = {};
        const strengthCounts = {};

        STRENGTHS.forEach(s => {
            strengthScores[s.id] = 0;
            strengthCounts[s.id] = 0;
        });

        answers.forEach(answer => {
            const item = ITEMS.find(i => i.id === answer.itemId);
            if (item) {
                strengthScores[item.strength] += answer.score;
                strengthCounts[item.strength] += 1;
            }
        });

        // 平均分为总分/2（每优势 2 题，每题 1-5 分，所以单项分数范围 2-10，平均分范围 1-5）
        const scores = STRENGTHS.map(s => {
            const total = strengthScores[s.id];
            const count = strengthCounts[s.id] || 1;
            const avg = total / 2; // 2 题的总分除以 2 = 平均分（1-5 分制）
            return {
                ...s,
                rawScore: total,        // 2 题总分（2-10）
                averageScore: avg,         // 平均分（1-5）
                percentage: Math.round((avg - 1) / 4 * 100),  // 转换为百分比（0-100%）
            };
        });

        // 2. 排序（高分在前）
        const sorted = [...scores].sort((a, b) => b.averageScore - a.averageScore);

        // 3. 签名优势（Top 5）
        const signatureStrengths = sorted.slice(0, 5);

        // 4. 按美德分类
        const byVirtue = {};
        sorted.forEach(s => {
            if (!byVirtue[s.virtue]) byVirtue[s.virtue] = [];
            byVirtue[s.virtue].push(s);
        });

        return {
            scores: sorted,
            signatureStrengths,
            byVirtue,
            totalScore: scores.reduce((sum, s) => sum + s.averageScore, 0),
        };
    }

    /**
     * 获取某项优势的解读
     */
    function getInterpretation(strengthId) {
        const interp = INTERPRETATIONS[strengthId];
        const isEn = _isEnglish();
        if (!interp) return null;
        return {
            summary: isEn ? interp.en : interp.cn,
            apply: isEn ? interp.applyEn : interp.apply,
        };
    }

    /**
     * 生成完整报告
     */
    function generateReport(scores) {
        const isEn = _isEnglish();
        const result = calculateScores(scores);
        
        const report = {
            signatureStrengths: result.signatureStrengths.map((s, i) => ({
                rank: i + 1,
                name: isEn ? s.en : s.cn,
                virtue: isEn ? s.virtue.charAt(0).toUpperCase() + s.virtue.slice(1) : s.virtueCn,
                score: s.averageScore,
                percentage: s.percentage,
                interpretation: getInterpretation(s.id),
            })),
            fullRanking: result.scores.map((s, i) => ({
                rank: i + 1,
                id: s.id,
                name: isEn ? s.en : s.cn,
                virtue: isEn ? s.virtue : s.virtueCn,
                score: s.averageScore,
                percentage: s.percentage,
            })),
            byVirtue: {},
        };

        // 按美德分类（只取每个美德下的最高分优势）
        Object.keys(result.byVirtue).forEach(virtueKey => {
            const virtueCn = result.byVirtue[virtueKey][0].virtueCn;
            const virtueEn = result.byVirtue[virtueKey][0].virtue.charAt(0).toUpperCase() + result.byVirtue[virtueKey][0].virtue.slice(1);
            report.byVirtue[virtueKey] = {
                name: isEn ? virtueEn : virtueCn,
                topStrength: {
                    name: isEn ? result.byVirtue[virtueKey][0].en : result.byVirtue[virtueKey][0].cn,
                    score: result.byVirtue[virtueKey][0].averageScore,
                },
                allStrengths: result.byVirtue[virtueKey].map(s => ({
                    name: isEn ? s.en : s.cn,
                    score: s.averageScore,
                })),
            };
        });

        return report;
    }

    // ========== 工具方法 ==========

    function _isEnglish() {
        if (window.I18N && I18N.currentLocale === 'en') return true;
        if (document.documentElement.lang === 'en') return true;
        if (localStorage.getItem('xinqing_locale') === 'en') return true;
        return false;
    }

    function _shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ========== 公开 API ==========
    return {
        STRENGTHS,
        ITEMS,
        INTERPRETATIONS,
        startAssessment,
        calculateScores,
        getInterpretation,
        generateReport,
    };
})();

// 挂载到全局
if (typeof window !== 'undefined') {
    window.VIAInventory = VIAInventory;
}
