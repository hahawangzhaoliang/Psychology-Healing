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
                <img src="images/companions/${companion.filename}"
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

            /* 动画类 */
            .companion-float {
                animation: companionFloatAnim 3s ease-in-out infinite;
            }
            .companion-bounce {
                animation: companionBounceAnim 1.2s ease-in-out infinite;
            }
            .companion-sway {
                animation: companionSwayAnim 2.5s ease-in-out infinite;
            }
            .companion-sway img {
                animation: companionSwayImg 2.5s ease-in-out infinite;
            }
            .companion-breathe {
                animation: companionBreatheAnim 5s ease-in-out infinite;
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
                0%, 100% { transform: scale(1); opacity: 0.95; }
                50% { transform: scale(1.1); opacity: 1; }
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
