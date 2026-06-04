/**
 * 虚拟动物陪伴组件
 * 在页面左上角显示用户选择的虚拟动物，提供温暖的陪伴感
 * 每个动物都有独特的个性、故事背景和口头禅
 */

(function() {
    'use strict';

    // ========== API数据加载 ==========
    let companionsData = null;
    let useAPI = true;
    let apiCompanions = null; // 存储从API加载的伙伴数据

    async function loadCompanionData() {
        // 不再请求不存在的 API，直接使用内置数据
        useAPI = false;
        apiCompanions = null;
        companionsData = null;
        return false;
    }

    // 根据ID获取伙伴数据（优先API，降级到本地）
    function getCompanionById(id) {
        // 优先检查语言设置
        if (window.I18N && window.I18N.currentLocale === 'en' && companionsEn && companionsEn[id]) {
            return companionsEn[id];
        }
        // 优先使用API数据
        if (apiCompanions && apiCompanions[id]) {
            return apiCompanions[id];
        }
        // 降级到本地数据
        if (companions && companions[id]) {
            return companions[id];
        }
        return null;
    }

    // ========== 动物数据（12个形象） ==========
    const companions = {

        // ① 爱心兔兔 — 爱心守护者
        'rabbit': {
            name: '爱心兔兔',
            filename: '爱心兔兔.png',
            animation: 'bounce',
            color: '#E879A9',   // 粉红色调
            shadow: 'rgba(232, 121, 169, 0.35)',
            story: '来自爱之森林的守护兔，胸前总是发着温暖的粉红光芒。她相信每一颗心都值得被珍爱，每一滴眼泪都能化为成长的养分。',
            tagline: '你值得被好好疼爱 💕',
            messages: [
                '今天也超级可爱呢！',
                '累了就靠一会儿，我在这里 💕',
                '你的感受很重要，我都听见啦',
                '要记得，你已经很棒了！',
                '世界和我都爱你哦 ✨',
                '今天心情怎么样？我愿意听 🌸',
                '给自己一个拥抱吧 🤗',
                '爱自己是终身浪漫的开始 💗',
                '想哭就哭，泪水是心的语言',
                '每天都要元气满满！'
            ],
            greetings: [
                '陪你一起 💕',
                '有我在 🌸',
                '想我了吗？',
                '今天也要爱自己 💗'
            ]
        },

        // ② 金毛陪伴犬 — 无言的拥抱
        'dog': {
            name: '金毛陪伴犬',
            filename: '金毛陪伴犬.png',
            animation: 'sway',
            color: '#E8A838',   // 暖金色调
            shadow: 'rgba(232, 168, 56, 0.35)',
            story: '曾经在无数个深夜默默守候在主人床边的大金毛，离开汪星球后化为一缕阳光，永远守在你身边。它不懂复杂的道理，只懂得：你在，我就安心。',
            tagline: '你在，我就安心 🐾',
            messages: [
                '累了吗？休息一下吧 🌿',
                '不管怎样，我都陪着你',
                '你做得很好，真的',
                '有什么心事想说吗？我听',
                '不需要理由，你本来就很重要',
                '我在这里，不走的',
                '今天辛苦啦，摸摸头 🐾',
                '抱抱你，无条件的',
                '世界很复杂，但你可以简单',
                '我会一直在的'
            ],
            greetings: [
                '陪你一起 🐾',
                '想你了！',
                '你在真好',
                '有我在 🌿'
            ]
        },

        // ③ 困困猫咪 — 慵懒治愈师
        'cat': {
            name: '困困猫咪',
            filename: '困困猫咪.png',
            animation: 'breathe',
            color: '#9B8EC4',   // 薰衣草紫调
            shadow: 'rgba(155, 142, 196, 0.35)',
            story: '一只总是睁不开眼睛的小猫咪，来自梦的边缘。它告诉你：不必每时每刻都充满能量，困了就睡，休息也是前进的一部分。',
            tagline: '困了就睡吧，醒来又是美好的一天 🌙',
            messages: [
                '困了吗？眯一会儿也没关系 😴',
                '慢下来也没关系的',
                '呼吸，放松，我在',
                '今天已经很努力了',
                '要不要听听白噪音？',
                '伸个懒腰吧～',
                '休息不是懒惰，是充电 🔋',
                '梦里有好事发生哦',
                '我陪你，什么都不用做',
                '慢一点也可以的 ✨'
            ],
            greetings: [
                '陪你一起 🌙',
                '睡个好觉',
                '在呢 🐱',
                '做个好梦'
            ]
        },

        // ④ 绿光灵狐 — 智慧引路人
        'fox': {
            name: '绿光灵狐',
            filename: '绿光灵狐.png',
            animation: 'sway',
            color: '#4DB87A',   // 森林绿调
            shadow: 'rgba(77, 184, 122, 0.35)',
            story: '穿梭于现实与梦境边界的灵狐，双眼闪烁着古老的绿光。它看过太多迷失方向的灵魂，学会了用最温柔的方式，点亮你心里那盏被遗忘的灯。',
            tagline: '心有微光，不惧夜长 ✨',
            messages: [
                '那件事，想通了吗？',
                '答案就在你心里',
                '每个选择都是对的，因为你在成长',
                '困惑是智慧的起点',
                '你不是一个人，我在这里',
                '深呼吸，让心静一静',
                '相信你的直觉',
                '今天学到了什么？',
                '困难是化了妆的礼物 🎁',
                '抬头看看，天没塌'
            ],
            greetings: [
                '陪你一起 ✨',
                '心灯不灭',
                '我在这里',
                '智慧与你同在 🌿'
            ]
        },

        // ⑤ 暖光刺猬 — 柔软的心
        'hedgehog': {
            name: '暖光刺猬',
            filename: '暖光刺猬.png',
            animation: 'breathe',
            color: '#D4894A',   // 焦糖暖调
            shadow: 'rgba(212, 137, 74, 0.35)',
            story: '浑身是刺的小刺猬，却有一颗最柔软的心。它教会你：可以保护自己，也可以敞开心扉——刺是铠甲，爱是本能。',
            tagline: '刺是铠甲，爱也是 🦔',
            messages: [
                '不用时刻坚强，偶尔脆弱也可以',
                '你已经很有勇气了',
                '疼了就说，我会轻一点',
                '保护自己不是错',
                '心软不是弱点，是力量',
                '你的感受很重要',
                '慢慢来，不着急 🦔',
                '有些事，说出来就好了',
                '你比自己以为的更强大',
                '别忘了对自己温柔一点'
            ],
            greetings: [
                '陪你一起 🌰',
                '在呢，不孤单',
                '刺猬也有软肚肚 🐾',
                '你值得被温柔以待'
            ]
        },

        // ⑥ 漂浮柯基 — 快乐制造机
        'corgi': {
            name: '漂浮柯基',
            filename: '漂浮柯基.png',
            animation: 'float',
            color: '#F5A623',   // 明快橙调
            shadow: 'rgba(245, 166, 35, 0.35)',
            story: '永远飘在空中的小柯基，因为太快乐了所以脚都不需要沾地。它不懂什么叫「不应该开心」，它的使命就是让你嘴角上扬。',
            tagline: '不开心吗？来，让我想想办法！☀️',
            messages: [
                '笑一个嘛！',
                '你笑起来真好看 😊',
                '今天有什么好事？',
                '来，跟我做个小运动！',
                '快乐是可以练习的 ✨',
                '我来了就不许难过！',
                '世界上有很多小事值得开心',
                '摇摇尾巴给你看 🐕',
                '今天的你好可爱！',
                '没有什么是笑一笑解决不了的'
            ],
            greetings: [
                '陪你一起 ☀️',
                '开心点！',
                '我来啦 🐶',
                '今天也要元气满满！'
            ]
        },

        // ⑦ 水波水獭 — 情绪调色盘
        'otter': {
            name: '水波水獭',
            filename: '水波水獭.png',
            animation: 'float',
            color: '#5CB8D4',   // 清澈蓝调
            shadow: 'rgba(92, 184, 212, 0.35)',
            story: '来自情绪之湖的小水獭，能感知每一滴水的情绪。它不评判任何感受，只是静静陪伴你趟过焦虑、愤怒、悲伤，最后一起看见湖面的光。',
            tagline: '每一种情绪都值得被看见 💧',
            messages: [
                '今天感受怎么样？',
                '说出来吧，我听着',
                '焦虑来了，它也会走的',
                '你的情绪是有效的信号',
                '悲伤不是软弱，是深刻',
                '愤怒也可以，但要注意身体',
                '深呼吸三次，跟我一起 💧',
                '感受存在，就是活着',
                '情绪是客人，让它来，也让它走',
                '你在，就很好'
            ],
            greetings: [
                '陪你一起 💧',
                '今天感觉怎么样？',
                '在呢，随时说',
                '情绪不分好坏 💙'
            ]
        },

        // ⑧ 水晶小象 — 记忆收藏家
        'elephant': {
            name: '水晶小象',
            filename: '水晶小象.png',
            animation: 'sway',
            color: '#8B9EC9',   // 水晶蓝调
            shadow: 'rgba(139, 158, 201, 0.35)',
            story: '透明如水晶的小象，记忆中装满了所有被遗忘的美好瞬间。当你在黑暗中找不到自己时，它会用那些碎片帮你拼出完整的画面。',
            tagline: '别忘了，你曾经也闪闪发光 ✨',
            messages: [
                '还记得那次你很勇敢的事吗？',
                '你比自己记得的更厉害',
                '那些困难，你都跨过来了',
                '别否定过去的自己',
                '每一步都算数 🌟',
                '你值得被记住',
                '美好的事一直在发生',
                '记起自己的好吧 ✨',
                '失败也是宝贵的记忆',
                '你从来不是一个人'
            ],
            greetings: [
                '陪你一起 ✨',
                '我来提醒你美好的事',
                '记得吗？',
                '记忆里全是你的闪光'
            ]
        },

        // ⑨ 星海鲸鱼 — 宇宙级陪伴
        'whale': {
            name: '星海鲸鱼',
            filename: '星海鲸鱼.png',
            animation: 'float',
            color: '#4A90D9',   // 深海蓝调
            shadow: 'rgba(74, 144, 217, 0.35)',
            story: '在意识宇宙中遨游的蓝鲸，见过无数星系的诞生与消亡，却依然被每一个小小人类的梦想打动。它告诉你：在这个浩瀚宇宙中，你是独特而珍贵的存在。',
            tagline: '在宇宙的尺度下，你的问题都有答案 🌌',
            messages: [
                '你知道吗？宇宙在乎你',
                '在这个大大的世界里，你很特别',
                '一切都会好起来的',
                '仰望星空，想想自己的渺小与伟大',
                '你很重要，比你知道的更重要',
                '人生很长，也很短',
                '我们都是星尘 🪐',
                '没有什么过不去',
                '你不是孤单的旅行者',
                '这一刻，你在这里，这就是奇迹'
            ],
            greetings: [
                '陪你一起 🌌',
                '宇宙与你同在',
                '仰望星空吧',
                '你也是星星 ✨'
            ]
        },

        // ⑩ 音乐企鹅 — 节奏疗愈师
        'penguin': {
            name: '音乐企鹅',
            filename: '音乐企鹅.png',
            animation: 'bounce',
            color: '#5BC8C8',   // 治愈青调
            shadow: 'rgba(91, 200, 200, 0.35)',
            story: '来自冰川深处的企鹅，会唱一种古老的心跳之歌。它知道，音乐是灵魂的语言——当言语无法抵达的地方，旋律可以。',
            tagline: '让音乐疗愈你 🎵',
            messages: [
                '想听首歌吗？🎵',
                '跟着节奏深呼吸',
                '音乐是灵魂的药',
                '有没有一首歌让你想起美好的事？',
                '让心随着节拍跳动',
                '哼出来吧，没人在听',
                '生活需要一些BGM 🎶',
                '这一刻，让音乐陪着你',
                '你的心跳就是最好的节奏',
                '跟着旋律，忘掉烦恼'
            ],
            greetings: [
                '陪你一起 🎵',
                '来听听心跳',
                '音乐响起来 🎶',
                '节拍与你同在'
            ]
        },

        // ⑪ 云朵小羊 — 天空幻想家
        'sheep': {
            name: '云朵小羊',
            filename: '云朵小羊.png',
            animation: 'float',
            color: '#B8D4E8',   // 天空蓝调
            shadow: 'rgba(184, 212, 232, 0.35)',
            story: '在云端草地漫步的小羊，背上背着整个天空的梦。它知道，幻想不是逃避，而是灵魂在舞蹈——偶尔飞一飞，是为了更好地落地。',
            tagline: '做一场白日梦吧，天空不收费 ☁️',
            messages: [
                '闭上眼睛，发个呆吧 ☁️',
                '想象一件让你开心的事',
                '白日梦是灵魂的假期',
                '天空那么大，你的烦恼很小',
                '今天想做什么梦？',
                '幻想不是逃避，是休息',
                '来，跟我一起数云朵',
                '你值得一个美好的幻想',
                '慢一点，世界不会跑掉',
                '放空也是一种生产力'
            ],
            greetings: [
                '陪你一起 ☁️',
                '来做梦吧',
                '云在等你',
                '幻想时间到'
            ]
        },

        // ⑫ 竹林熊猫 — 竹林隐士
        'panda': {
            name: '竹林熊猫',
            filename: '竹林熊猫.png',
            animation: 'breathe',
            color: '#7DB87D',   // 竹绿调
            shadow: 'rgba(125, 184, 125, 0.35)',
            story: '住在竹林深处的隐士熊猫，看似懒洋洋实则通透。它说：最好的修行不是苦行僧式的坚持，而是学会在该放下时放下，在该慢时慢下来。',
            tagline: '慢一点也没关系，竹子生长本来就很慢 🎋',
            messages: [
                '深呼吸，慢慢来',
                '竹子生长也是慢慢来的 🎋',
                '放慢脚步也是一种智慧',
                '今天不赶时间',
                '休息是为了走更远的路',
                '不要被效率绑架了',
                '慢活是一种能力',
                '静下来，听听竹叶的声音',
                '你不需要一直冲刺',
                '大熊猫每天吃吃睡睡，也很棒'
            ],
            greetings: [
                '陪你一起 🎋',
                '慢慢来',
                '竹林很安静',
                '不着急，我等你'
            ]
        }
    };

    // English version of companions data
    const companionsEn = {
        // ① Love Rabbit
        'rabbit': {
            name: 'Love Rabbit',
            filename: '爱心兔兔.png',
            animation: 'bounce',
            color: '#E879A9',
            shadow: 'rgba(232, 121, 169, 0.35)',
            story: 'A guardian rabbit from the Forest of Love, always glowing with warm pink light on her chest. She believes every heart deserves to be cherished, and every tear can turn into nourishment for growth.',
            tagline: 'You deserve to be loved 💕',
            messages: [
                'You are super cute today too!',
                'Tired? Rest a while, I\'m here 💕',
                'Your feelings matter, I hear them all',
                'Remember, you\'re already amazing!',
                'The world and I both love you ✨',
                'How are you feeling today? I\'m here to listen 🌸',
                'Give yourself a hug 🤗',
                'Loving yourself is the beginning of a lifelong romance 💗',
                'Cry if you want to, tears are the language of the heart',
                'Be full of energy every day!'
            ],
            greetings: [
                'Accompanying you 💕',
                'I\'m here 🌸',
                'Miss me?',
                'Love yourself today too 💗'
            ]
        },
        // ② Golden Retriever
        'dog': {
            name: 'Golden Retriever',
            filename: '金毛陪伴犬.png',
            animation: 'sway',
            color: '#E8A838',
            shadow: 'rgba(232, 168, 56, 0.35)',
            story: 'A golden retriever who silently kept watch by its owner\'s bedside through countless late nights. After leaving the Dog Star, it transformed into a ray of sunshine, forever by your side.',
            tagline: 'I\'m here, so you\'re at peace 🐾',
            messages: [
                'Tired? Take a break 🌿',
                'No matter what, I\'m with you',
                'You\'re doing great, really',
                'Want to talk? I\'m listening',
                'No reason needed, you matter',
                'I\'m here, not going anywhere',
                'You worked hard today, head pat 🐾',
                'Hugging you, unconditionally',
                'The world is complex, but you can be simple',
                'I\'ll always be here'
            ],
            greetings: [
                'Accompanying you 🐾',
                'Missed you!',
                'So glad you\'re here',
                'I\'m here 🌿'
            ]
        },
        // ③ Sleepy Cat
        'cat': {
            name: 'Sleepy Cat',
            filename: '困困猫咪.png',
            animation: 'breathe',
            color: '#9B8EC4',
            shadow: 'rgba(155, 142, 196, 0.35)',
            story: 'A little cat that can never quite open its eyes, from the edge of dreams. It tells you: you don\'t need to be full of energy every moment. It\'s okay to sleep, rest is also part of moving forward.',
            tagline: 'Sleep if you\'re sleepy, tomorrow will be another beautiful day 🌙',
            messages: [
                'Sleepy? Nap a bit, it\'s okay 😴',
                'Slowing down is okay too',
                'Breathe, relax, I\'m here',
                'You\'ve worked hard enough today',
                'Want to listen to white noise?',
                'Stretch~',
                'Rest is not laziness, it\'s recharging 🔋',
                'Good things happen in dreams too',
                'I\'m with you, nothing to do',
                'It\'s okay to go slow ✨'
            ],
            greetings: [
                'Accompanying you 🌙',
                'Sleep well',
                'I\'m here 🐱',
                'Sweet dreams'
            ]
        },
        // ④ Green Light Fox
        'fox': {
            name: 'Green Light Fox',
            filename: '绿光灵狐.png',
            animation: 'sway',
            color: '#4DB87A',
            shadow: 'rgba(77, 184, 122, 0.35)',
            story: 'A spirit fox wandering the boundary between reality and dreams, with ancient green light flickering in its eyes. It has seen too many lost souls, and learned to use the gentlest way to light the forgotten lamp in your heart.',
            tagline: 'Your heart has a glimmer, fear not the long night ✨',
            messages: [
                'That thing, figured it out yet?',
                'The answer is in your heart',
                'Every choice is right, because you\'re growing',
                'Confusion is the starting point of wisdom',
                'You\'re not alone, I\'m here',
                'Breathe deeply, let your heart calm down',
                'Trust your intuition',
                'What did you learn today?',
                'Difficulty is a gift in disguise 🎁',
                'Look up, the sky hasn\'t fallen'
            ],
            greetings: [
                'Accompanying you ✨',
                'The heart lamp never goes out',
                'I\'m here',
                'Wisdom is with you 🌿'
            ]
        },
        // ⑤ Warm Glow Hedgehog
        'hedgehog': {
            name: 'Warm Glow Hedgehog',
            filename: '暖光刺猬.png',
            animation: 'breathe',
            color: '#D4894A',
            shadow: 'rgba(212, 137, 74, 0.35)',
            story: 'A little hedgehog covered in spines, yet with the softest heart. It teaches you: you can protect yourself and still open your heart—spines are armor, love is instinct.',
            tagline: 'Spines are armor, love is too 🦔',
            messages: [
                'No need to be strong all the time, it\'s okay to be vulnerable',
                'You already have so much courage',
                'Hurting? Tell me, I\'ll be gentle',
                'Protecting yourself is not wrong',
                'Being soft-hearted is not a weakness, it\'s strength',
                'Your feelings matter',
                'Take it slow, no rush 🦔',
                'Some things, just saying them helps',
                'You are stronger than you think',
                'Don\'t forget to be gentle with yourself'
            ],
            greetings: [
                'Accompanying you 🌰',
                'I\'m here, you\'re not alone',
                'Hedgehog also has soft belly 🐾',
                'You deserve to be treated gently'
            ]
        },
        // ⑥ Floating Corgi
        'corgi': {
            name: 'Floating Corgi',
            filename: '漂浮柯基.png',
            animation: 'float',
            color: '#F5A623',
            shadow: 'rgba(245, 166, 35, 0.35)',
            story: 'A little corgi that floats in the air forever, because it\'s so happy it doesn\'t need to touch the ground. It doesn\'t understand what "shouldn\'t be happy" means—its mission is to make your mouth curl up.',
            tagline: 'Not happy? Come, let me think of something! ☀️',
            messages: [
                'Give me a smile!',
                'You look so good when you smile 😊',
                'What good thing happened today?',
                'Come, do a little exercise with me!',
                'Happiness can be practiced ✨',
                'I\'m here, no more sadness allowed!',
                'There are so many little things in the world worth being happy about',
                'Wag my tail for you to see 🐕',
                'You look so cute today!',
                'There is nothing that a smile can\'t fix'
            ],
            greetings: [
                'Accompanying you ☀️',
                'Be happy!',
                'I\'m here 🐶',
                'Be full of energy today too!'
            ]
        },
        // ⑦ Water Otter
        'otter': {
            name: 'Water Otter',
            filename: '水波水獭.png',
            animation: 'float',
            color: '#5CB8D4',
            shadow: 'rgba(92, 184, 212, 0.35)',
            story: 'A little otter from the Lake of Emotions, who can sense the mood of every drop of water. It doesn\'t judge any feelings, just quietly accompanies you through anxiety, anger, sadness, until together you see the light on the lake\'s surface.',
            tagline: 'Every emotion deserves to be seen 💧',
            messages: [
                'How are you feeling today?',
                'Say it, I\'m listening',
                'Anxiety will come and go',
                'Your emotions are valid signals',
                'Sadness is not weakness, it\'s depth',
                'Anger is okay too, just watch your body',
                'Breathe deeply three times, follow me 💧',
                'Feeling present is being alive',
                'Emotions are guests, let them come and go',
                'You being here is enough'
            ],
            greetings: [
                'Accompanying you 💧',
                'How are you feeling today?',
                'I\'m here, ready to listen anytime',
                'Emotions have no good or bad 💙'
            ]
        },
        // ⑧ Crystal Elephant
        'elephant': {
            name: 'Crystal Elephant',
            filename: '水晶小象.png',
            animation: 'sway',
            color: '#8B9EC9',
            shadow: 'rgba(139, 158, 201, 0.35)',
            story: 'A little elephant transparent as crystal, memory filled with all forgotten beautiful moments. When you can\'t find yourself in the darkness, it will use those fragments to help you piece together the complete picture.',
            tagline: 'Don\'t forget, you once shined brightly too ✨',
            messages: [
                'Remember that time you were brave?',
                'You are more amazing than you remember',
                'Those difficulties, you\'ve crossed them all',
                'Don\'t deny your past self',
                'Every step counts 🌟',
                'You deserve to be remembered',
                'Beautiful things are always happening',
                'Remember your own goodness ✨',
                'Failure is also precious memory',
                'You were never alone'
            ],
            greetings: [
                'Accompanying you ✨',
                'I\'m here to remind you of beautiful things',
                'Remember?',
                'Full of beautiful memories'
            ]
        },
        // ⑨ Star Whale
        'whale': {
            name: 'Star Whale',
            filename: '星海鯨.png',
            animation: 'float',
            color: '#4A90D9',
            shadow: 'rgba(74, 144, 217, 0.35)',
            story: 'A blue whale wandering in the universe of consciousness, who has seen the birth and death of countless galaxies, yet still moved by every tiny human dream. It tells you: in this vast universe, you are unique and precious.',
            tagline: 'On the scale of the universe, your questions all have answers 🌌',
            messages: [
                'You know what? The universe cares about you',
                'In this big world, you are especially special',
                'Everything will get better',
                'Look up at the starry sky, think about your smallness and greatness',
                'You matter, more than you know',
                'Life is long, and also short',
                'We are all stardust 🪐',
                'Nothing is impassable',
                'You are not a lone traveler',
                'This moment, you are here, this is a miracle'
            ],
            greetings: [
                'Accompanying you 🌌',
                'The universe is with you',
                'Look up at the starry sky',
                'You are also a star ✨'
            ]
        },
        // ⑩ Music Penguin
        'penguin': {
            name: 'Music Penguin',
            filename: '音乐企鹅.png',
            animation: 'bounce',
            color: '#5BC8C8',
            shadow: 'rgba(91, 200, 200, 0.35)',
            story: 'A penguin from the deep glacier, who can sing an ancient heartbeat song. It knows that music is the language of the soul—where words cannot reach, melody can.',
            tagline: 'Let music heal you 🎵',
            messages: [
                'Want to listen to a song? 🎵',
                'Breathe with the rhythm',
                'Music is medicine for the soul',
                'Is there a song that reminds you of something good?',
                'Let your heart beat with the rhythm',
                'Hum it out, no one is listening',
                'Life needs some BGM 🎶',
                'This moment, let music accompany you',
                'Your heartbeat is the best rhythm',
                'Follow the melody, forget your worries'
            ],
            greetings: [
                'Accompanying you 🎵',
                'Come listen to the heartbeat',
                'Music is playing 🎶',
                'Rhythm is with you'
            ]
        },
        // ⑩ Cloud Sheep
        'sheep': {
            name: 'Cloud Sheep',
            filename: '云朵小羊.png',
            animation: 'float',
            color: '#B8D4E8',
            shadow: 'rgba(184, 212, 232, 0.35)',
            story: 'A little sheep wandering in the cloud meadow, carrying the entire sky\'s dreams on its back. It knows that fantasy is not escape, but the soul dancing—occasionally flying is to better land.',
            tagline: 'Have a daydream, the sky doesn\'t charge ☁️',
            messages: [
                'Close your eyes, zone out a bit ☁️',
                'Imagine something that makes you happy',
                'Daydreaming is a vacation for the soul',
                'The sky is so big, your worries are small',
                'What do you want to dream about today?',
                'Fantasy is not escape, it\'s rest',
                'Come, count the clouds with me',
                'You deserve a beautiful fantasy',
                'Slow down, the world won\'t run away',
                'Letting your mind wander is also productive'
            ],
            greetings: [
                'Accompanying you ☁️',
                'Come dream',
                'The clouds are waiting for you',
                'Fantasy time'
            ]
        },
        // ⑫ Bamboo Panda
        'panda': {
            name: 'Bamboo Panda',
            filename: '竹林熊猫.png',
            animation: 'breathe',
            color: '#7DB87D',
            shadow: 'rgba(125, 184, 125, 0.35)',
            story: 'A hermit panda living deep in the bamboo forest, seemingly lazy but truly transparent. It says: the best practice is not ascetic persistence, but learning to let go when you should, and slow down when you should.',
            tagline: 'It\'s okay to go slow, bamboo grows slowly too 🎋',
            messages: [
                'Breathe deeply, take it slow',
                'Bamboo grows slowly too 🎋',
                'Slowing down is also wisdom',
                'No need to rush today',
                'Rest is to go further',
                'Don\'t let efficiency enslave you',
                'Slow living is a skill',
                'Quiet down, listen to the bamboo leaves',
                'You don\'t need to sprint all the time',
                'Giant pandas eat and sleep, and they\'re great too'
            ],
            greetings: [
                'Accompanying you 🎋',
                'Take it slow',
                'The bamboo forest is very quiet',
                'No rush, I\'ll wait for you'
            ]
        }
    };

    let companionWidget = null;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    // 创建陪伴组件
    function createCompanionWidget() {
        // 检查是否已选择动物
        const savedId = localStorage.getItem('xinqing_companion');
        if (!savedId) return;
        
        // 优先从API数据获取，降级到本地
        const companion = getCompanionById(savedId);
        if (!companion) return;
        
        // 检查是否已存在
        if (document.getElementById('companionWidget')) return;
        
        // 创建组件容器
        companionWidget = document.createElement('div');
        companionWidget.id = 'companionWidget';
        companionWidget.innerHTML = `
            <div class="companion-avatar ${'companion-' + companion.animation}" id="companionAvatar">
                <img src="assets/images/companions/${companion.filename}"
                     alt="${companion.name}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><text y=%2248%22 font-size=%2248%22>🐾</text></svg>'">
            </div>
            <div class="companion-speech" id="companionSpeech">
                <p class="companion-name">${companion.name}</p>
                <p class="companion-message">${companion.tagline}</p>
            </div>
        `;

        // 动态设置主题色
        addStyles(companion.color, companion.shadow);
        
        // 添加到页面
        document.body.appendChild(companionWidget);
        
        // 初始化拖拽
        initDrag();
        
        // 添加点击交互
        initClickInteraction();
        
        // 添加随机问候
        scheduleRandomGreeting();
    }
    
    // 添加CSS样式（动态颜色）
    function addStyles(color, shadow) {
        if (document.getElementById('companionWidgetStyles')) {
            // 已存在则更新颜色变量
            const style = document.getElementById('companionWidgetStyles');
            style.textContent = style.textContent
                .replace(/--companion-color:[^;]+;/g, `--companion-color: ${color};`)
                .replace(/--companion-shadow:[^;]+;/g, `--companion-shadow: ${shadow};`);
            return;
        }

        const style = document.createElement('style');
        style.id = 'companionWidgetStyles';
        style.textContent = `
            :root {
                --companion-color: ${color};
                --companion-shadow: ${shadow};
            }
            #companionWidget {
                position: fixed;
                top: 80px;
                left: 20px;
                z-index: 9999;
                cursor: grab;
                transition: transform 0.3s ease, opacity 0.3s ease;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            #companionWidget:hover {
                transform: scale(1.05);
            }

            #companionWidget.dragging {
                cursor: grabbing;
                opacity: 0.9;
            }

            .companion-avatar {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                background: white;
                box-shadow: 0 4px 20px var(--companion-shadow);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border: 3px solid var(--companion-color);
                opacity: 0.95;
            }

            .companion-avatar img {
                width: 56px;
                height: 56px;
                object-fit: contain;
            }

            .companion-speech {
                background: white;
                border-radius: 16px;
                padding: 12px 16px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                max-width: 200px;
                position: relative;
                opacity: 0;
                transform: translateX(-10px);
                transition: all 0.3s ease;
            }

            .companion-speech::before {
                content: '';
                position: absolute;
                left: -8px;
                top: 50%;
                transform: translateY(-50%);
                border: 8px solid transparent;
                border-right-color: white;
            }

            #companionWidget:hover .companion-speech,
            .companion-speech.show {
                opacity: 1;
                transform: translateX(0);
            }

            .companion-name {
                font-weight: 600;
                color: var(--companion-color);
                font-size: 14px;
                margin-bottom: 2px;
            }

            .companion-message {
                font-size: 13px;
                color: #555;
                white-space: normal;
                line-height: 1.4;
            }

            /* 动画类 — 节奏放缓，更助放松 */
            .companion-float {
                animation: companionFloatAnim 5s ease-in-out infinite;
            }
            .companion-bounce {
                animation: companionBounceAnim 2s ease-in-out infinite;
            }
            .companion-sway {
                animation: companionSwayAnim 4s ease-in-out infinite;
            }
            .companion-sway img {
                animation: companionSwayImg 4s ease-in-out infinite;
            }
            .companion-breathe {
                animation: companionBreatheAnim 12s ease-in-out infinite;
            }

            @keyframes companionFloatAnim {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(4deg); }
            }
            @keyframes companionBounceAnim {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-8px) scale(1.06); }
            }
            @keyframes companionSwayAnim {
                0%, 100% { transform: translateX(0) rotate(-4deg); }
                50% { transform: translateX(6px) rotate(4deg); }
            }
            @keyframes companionBreatheAnim {
                /* 12s 完整呼吸周期 */
                /* 0-35%: 吸气 4.2s → 放大+变深 */
                0%   { transform: scale(1);    opacity: 0.92; }
                35%  { transform: scale(1.12); opacity: 1;    }

                /* 35-50%: 屏息 1.8s → 保持 */
                50%  { transform: scale(1.12); opacity: 1;    }

                /* 50-85%: 呼气 4.2s → 缩小+变浅（呼气更长更放松）*/
                85%  { transform: scale(1);    opacity: 0.92; }

                /* 85-100%: 屏息 1.8s → 保持 */
                100% { transform: scale(1);    opacity: 0.92; }
            }

            /* 点击特效 */
            .companion-click-effect {
                position: absolute;
                pointer-events: none;
                animation: clickPop 0.6s ease-out forwards;
                font-size: 18px;
            }

            @keyframes clickPop {
                0% { transform: scale(0) translate(-50%, -50%); opacity: 1; }
                100% { transform: scale(2) translate(-50%, -50%); opacity: 0; }
            }

            /* 问候气泡 */
            .companion-greeting {
                position: absolute;
                top: 80px;
                left: 0;
                background: white;
                border-radius: 12px;
                padding: 8px 14px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                font-size: 12px;
                color: #555;
                white-space: nowrap;
                border-left: 3px solid var(--companion-color);
                animation: greetingPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both, greetingFade 0.4s ease-out 2.6s forwards;
            }

            @keyframes greetingPop {
                0% { transform: scale(0) translateY(10px); opacity: 0; }
                100% { transform: scale(1) translateY(0); opacity: 1; }
            }

            @keyframes greetingFade {
                to { opacity: 0; transform: translateY(-8px); }
            }

            /* 移动端适配 */
            @media (max-width: 768px) {
                #companionWidget {
                    top: 70px;
                    left: 12px;
                }
                .companion-avatar {
                    width: 52px;
                    height: 52px;
                }
                .companion-avatar img {
                    width: 44px;
                    height: 44px;
                }
                .companion-speech {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 初始化拖拽
    function initDrag() {
        const avatar = document.getElementById('companionAvatar');
        if (!avatar) return;
        
        avatar.addEventListener('mousedown', startDrag);
        avatar.addEventListener('touchstart', startDrag, { passive: false });
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
    
    function startDrag(e) {
        if (e.target.closest('.companion-speech')) return;
        
        isDragging = true;
        companionWidget.classList.add('dragging');
        
        const rect = companionWidget.getBoundingClientRect();
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        dragOffset.x = clientX - rect.left;
        dragOffset.y = clientY - rect.top;
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        let x = clientX - dragOffset.x;
        let y = clientY - dragOffset.y;
        
        // 边界限制
        x = Math.max(0, Math.min(window.innerWidth - 80, x));
        y = Math.max(0, Math.min(window.innerHeight - 80, y));
        
        companionWidget.style.left = x + 'px';
        companionWidget.style.top = y + 'px';
        companionWidget.style.right = 'auto';
        companionWidget.style.bottom = 'auto';
        
        e.preventDefault();
    }
    
    function endDrag() {
        isDragging = false;
        if (companionWidget) {
            companionWidget.classList.remove('dragging');
        }
    }
    
    // 初始化点击交互
    function initClickInteraction() {
        const avatar = document.getElementById('companionAvatar');
        if (!avatar) return;

        const savedId = localStorage.getItem('xinqing_companion');
        const companion = getCompanionById(savedId);

        // 备用通用语料（以防 companion 未定义）
        const fallbackMessages = ['你好呀！', '今天感觉怎么样？', '我在陪你 🌟', '加油！', '休息一下吧'];
        const messages = companion ? companion.messages : fallbackMessages;

        // 专属特效表情（每个动物不同）
        const effectEmojis = {
            rabbit:   ['💕', '🌸', '💗', '✨', '🐰'],
            dog:      ['🐾', '🌿', '💛', '✨', '🐕'],
            cat:      ['🌙', '😴', '💤', '🐱', '☁️'],
            fox:      ['✨', '🌿', '💚', '🍃', '🦊'],
            hedgehog: ['🌰', '🦔', '💛', '🍂', '✨'],
            corgi:    ['☀️', '🐶', '💛', '🎾', '✨'],
            otter:    ['💧', '🌊', '💙', '✨', '🦦'],
            elephant: ['✨', '💎', '🩵', '🌟', '🐘'],
            whale:    ['🌌', '✨', '💙', '🪐', '🐋'],
            penguin:  ['🎵', '🎶', '💙', '❄️', '🐧'],
            sheep:    ['☁️', '🐑', '🤍', '🌤️', '✨'],
            panda:    ['🎋', '🐼', '💚', '🍃', '✨']
        };
        const emojis = effectEmojis[savedId] || ['✨', '💕', '🌟'];

        avatar.addEventListener('click', () => {
            // 添加点击特效
            const effect = document.createElement('div');
            effect.className = 'companion-click-effect';
            effect.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
            effect.style.left = '50%';
            effect.style.top = '50%';
            effect.style.transform = 'translate(-50%, -50%)';
            avatar.appendChild(effect);
            setTimeout(() => effect.remove(), 600);

            // 更新专属语料
            const speech = document.getElementById('companionSpeech');
            if (speech) {
                const msgEl = speech.querySelector('.companion-message');
                const idx = Math.floor(Math.random() * messages.length);
                msgEl.textContent = messages[idx];
                speech.classList.add('show');
                setTimeout(() => speech.classList.remove('show'), 3500);
            }
        });
    }

    // 随机问候
    function scheduleRandomGreeting() {
        const showGreeting = () => {
            const savedId = localStorage.getItem('xinqing_companion');
            if (!savedId || isDragging || !companionWidget) return;

            const companion = getCompanionById(savedId);
            const fallbackGreetings = ['陪你一起 🌟', '有我在 🌸', '加油！'];
            const greetings = companion ? companion.greetings : fallbackGreetings;

            const greeting = document.createElement('div');
            greeting.className = 'companion-greeting';
            greeting.textContent = greetings[Math.floor(Math.random() * greetings.length)];
            companionWidget.appendChild(greeting);

            setTimeout(() => greeting.remove(), 3000);
        };

        // 每隔45秒随机显示问候（降低频率，避免打扰）
        setInterval(() => {
            if (Math.random() > 0.4) {
                showGreeting();
            }
        }, 45000);

        // 3分钟后首次问候（缩短等待时间）
        setTimeout(showGreeting, 180000);
    }
    
    // 初始化
    async function init() {
        // 先尝试加载API数据
        await loadCompanionData();
        
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createCompanionWidget);
        } else {
            createCompanionWidget();
        }
    }
    
    // 暴露给全局
    window.CompanionWidget = {
        refresh: createCompanionWidget
    };
    
    init();
})();
