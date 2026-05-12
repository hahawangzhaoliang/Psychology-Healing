/**
 * 主题管理器
 * 支持三种主题：家、工作、娱乐
 * 修复：类结构、CSS变量映射
 */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'home';
        this.lampLevel = 3;

        this.themes = {
            home: {
                name: '家', icon: '🏠',
                vars: {
                    '--color-primary-50':  '#fdf8f0',
                    '--color-primary-100': '#f8e8cc',
                    '--color-primary-200': '#f0d0a0',
                    '--color-primary-300': '#e5b87a',
                    '--color-primary-400': '#d4956a',
                    '--color-primary-500': '#c07a50',
                    '--color-primary-600': '#a8613a',
                    '--color-primary-700': '#8b4a28',
                    '--color-warm-50':     '#fdfbf9',
                    '--color-warm-100':    '#f5e6d3',
                    '--color-warm-200':    '#e8d5c4',
                    '--theme-bg':          '#fdf8f3',
                    '--theme-card':        '#ffffff',
                    '--theme-text':        '#4a3728',
                    '--theme-text-light':  '#8b7355',
                    '--theme-border':      '#e8d5c0',
                    '--shadow-sm':  '0 2px 8px rgba(180,120,80,0.10)',
                    '--shadow-md':  '0 4px 16px rgba(180,120,80,0.14)',
                    '--shadow-lg':  '0 8px 32px rgba(180,120,80,0.18)',
                }
            },
            work: {
                name: '工作', icon: '💼',
                vars: {
                    '--color-primary-50':  '#f0f6ff',
                    '--color-primary-100': '#daeafc',
                    '--color-primary-200': '#b0d0f5',
                    '--color-primary-300': '#80b4e8',
                    '--color-primary-400': '#5592d4',
                    '--color-primary-500': '#3d7abf',
                    '--color-primary-600': '#2a62a8',
                    '--color-primary-700': '#1a4e90',
                    '--color-warm-50':     '#f5f8fc',
                    '--color-warm-100':    '#e8eef6',
                    '--color-warm-200':    '#d0dcea',
                    '--theme-bg':          '#f5f8fc',
                    '--theme-card':        '#ffffff',
                    '--theme-text':        '#1e2d3d',
                    '--theme-text-light':  '#4a6080',
                    '--theme-border':      '#d0dcea',
                    '--shadow-sm':  '0 2px 8px rgba(60,100,160,0.08)',
                    '--shadow-md':  '0 4px 16px rgba(60,100,160,0.12)',
                    '--shadow-lg':  '0 8px 32px rgba(60,100,160,0.16)',
                }
            },
            entertainment: {
                name: '娱乐', icon: '🎮',
                vars: {
                    '--color-primary-50':  '#f0fdf8',
                    '--color-primary-100': '#ccf5e8',
                    '--color-primary-200': '#99e8d0',
                    '--color-primary-300': '#5dd4b5',
                    '--color-primary-400': '#2ebe9a',
                    '--color-primary-500': '#20a882',
                    '--color-primary-600': '#158f6b',
                    '--color-primary-700': '#0c7458',
                    '--color-warm-50':     '#fff0f5',
                    '--color-warm-100':    '#ffd6e7',
                    '--color-warm-200':    '#ffb3d1',
                    '--theme-bg':          '#f0fdf9',
                    '--theme-card':        '#ffffff',
                    '--theme-text':        '#1a3530',
                    '--theme-text-light':  '#4a7a6a',
                    '--theme-border':      '#b8e8d8',
                    '--shadow-sm':  '0 2px 8px rgba(30,160,120,0.10)',
                    '--shadow-md':  '0 4px 16px rgba(30,160,120,0.14)',
                    '--shadow-lg':  '0 8px 32px rgba(30,160,120,0.18)',
                }
            }
        };

        // 数据将在 init() 中从 JSON 文件异步加载
        this.emotionData = {};
        this.teaEncouragements = [];
        this.petNames = [];
        this.petEmojis = [];
        this.petMoodTexts = [];
        this.petGreetings = [];
        this.petInteractions = {};
        this.knowledgeLibrary = {};
        this.knowledgeCategories = {};

        this.init();
    }

    init() {
        // 异步加载外部数据
        this.loadTextData();
        
        this.applyTheme(this.currentTheme);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createThemeSwitcher());
        } else {
            this.createThemeSwitcher();
        }
    }

    /**
     * 从 JSON 文件加载文本数据
     */
    async loadTextData() {
        try {
            const [emotions, companions, encouragements, knowledge] = await Promise.all([
                fetch('data/emotions.json').then(r => r.json()),
                fetch('data/companions.json').then(r => r.json()),
                fetch('data/encouragements.json').then(r => r.json()),
                fetch('data/knowledge.json').then(r => r.json())
            ]);

            // 填充情绪数据
            this.emotionData = emotions.emotions || {};

            // 填充静心茶语录
            this.teaEncouragements = encouragements.tea || [];

            // 填充宠物数据
            if (companions.companions) {
                this.petNames     = companions.companions.map(c => c.name);
                this.petEmojis    = companions.companions.map(c => c.emoji);
                this.petMoodTexts = companions.companions.map(c => c.mood);
                this.petGreetings = companions.companions.map(c => c.greeting);
            }
            this.petInteractions = companions.interactions || {};

            // 填充知识库
            this.knowledgeLibrary = knowledge.articles || {};

            // 构建分类索引
            this.knowledgeCategories = {};
            Object.entries(this.knowledgeLibrary).forEach(([key, item]) => {
                const cat = item.category || '其他';
                if (!this.knowledgeCategories[cat]) this.knowledgeCategories[cat] = [];
                this.knowledgeCategories[cat].push({ key, ...item });
            });

            console.log('[ThemeManager] 文本数据加载完成');
        } catch (e) {
            console.error('[ThemeManager] 数据加载失败:', e);
        }
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme.vars).forEach(([key, val]) => {
            root.style.setProperty(key, val);
        });

        document.body.className = document.body.className
            .replace(/\btheme-\S+/g, '').trim();
        document.body.classList.add(`theme-${themeName}`);
        document.body.setAttribute('data-theme', themeName);

        this._updateHeroGradient(themeName);

        localStorage.setItem('theme', themeName);
        this.currentTheme = themeName;

        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, themeData: theme }
        }));

        this.applyThemeEffects(themeName);
    }

    _updateHeroGradient(themeName) {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        const gradients = {
            home:          'linear-gradient(160deg, #fdf8f0 0%, #f8e8cc 40%, #f0d0a0 100%)',
            work:          'linear-gradient(160deg, #f0f6ff 0%, #daeafc 40%, #b0d0f5 100%)',
            entertainment: 'linear-gradient(160deg, #f0fdf8 0%, #ccf5e8 40%, #99e8d0 100%)'
        };
        hero.style.background = gradients[themeName] || '';
    }

    applyThemeEffects(themeName) {
        const old = document.getElementById('theme-effects');
        if (old) old.remove();

        switch (themeName) {
            case 'home':          this.createHomeEffects();          break;
            case 'work':          this.createWorkEffects();          break;
            case 'entertainment': this.createEntertainmentEffects(); break;
        }
    }

    /* ===== 家的主题 ===== */
    createHomeEffects() {
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <style>
                .home-bg-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(ellipse at 80% 20%, rgba(232,184,125,0.12) 0%, transparent 50%),
                                radial-gradient(ellipse at 20% 80%, rgba(168,196,212,0.10) 0%, transparent 50%);
                    pointer-events: none; z-index: -1;
                    transition: background 0.5s ease;
                }
                .home-toolbar {
                    position:fixed; right:12px; top:50%;
                    transform:translateY(-50%);
                    display:flex; flex-direction:column; gap:8px;
                    z-index:100;
                }
                .tool-btn {
                    width:52px; height:52px; border-radius:16px;
                    background:rgba(255,255,255,0.95);
                    border:2px solid rgba(255,255,255,0.8);
                    cursor:pointer; position:relative;
                    display:flex; align-items:center; justify-content:center;
                    box-shadow:0 4px 15px rgba(0,0,0,0.12);
                    transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    backdrop-filter:blur(10px);
                }
                .tool-btn:hover {
                    transform:scale(1.12);
                    box-shadow:0 8px 25px rgba(0,0,0,0.18);
                }
                .tool-btn:active { transform:scale(0.95); }
                .tool-btn .icon { font-size:26px; line-height:1; }
                .tool-btn .tooltip {
                    position:absolute; right:62px; top:50%;
                    transform:translateY(-50%);
                    background:rgba(74,55,40,0.95);
                    color:white; padding:6px 12px; border-radius:10px;
                    font-size:12px; white-space:nowrap;
                    opacity:0; pointer-events:none;
                    transition:opacity 0.2s ease;
                }
                .tool-btn:hover .tooltip { opacity:1; }
                .tool-lamp { overflow:visible; }
                .tool-lamp .lamp-glow-ring {
                    position:absolute; inset:-8px;
                    border-radius:20px;
                    background:radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%);
                    opacity:0; transition:all 0.4s ease;
                    pointer-events:none;
                }
                .tool-lamp.level-1 .lamp-glow-ring{opacity:0.3;}
                .tool-lamp.level-2 .lamp-glow-ring{opacity:0.5;}
                .tool-lamp.level-3 .lamp-glow-ring{opacity:0.7;}
                .tool-lamp.level-4 .lamp-glow-ring{opacity:0.85;}
                .tool-lamp.level-5 .lamp-glow-ring{opacity:1;box-shadow:0 0 20px rgba(255,215,0,0.6);}
                .tool-tea .steam-anim {
                    position:absolute; top:-10px; left:50%;
                    transform:translateX(-50%); display:flex; gap:3px;
                }
                .tool-tea .steam-anim span {
                    width:3px; height:8px; background:rgba(150,150,150,0.6);
                    border-radius:3px; animation:steam-bounce 2s ease-in-out infinite;
                }
                .tool-tea .steam-anim span:nth-child(2){animation-delay:0.3s;height:10px;}
                .tool-tea .steam-anim span:nth-child(3){animation-delay:0.6s;}
                @keyframes steam-bounce {
                    0%,100%{opacity:0.4;transform:translateY(0) scaleX(1);}
                    50%{opacity:0.9;transform:translateY(-5px) scaleX(1.2);}
                }
                .energy-indicator {
                    position:fixed; right:12px; bottom:20px;
                    background:rgba(255,255,255,0.95); padding:10px 16px;
                    border-radius:18px; box-shadow:0 6px 20px rgba(0,0,0,0.1);
                    font-size:12px; color:#8B7355; z-index:100;
                    backdrop-filter:blur(10px);
                }
                .energy-label { display:flex; align-items:center; gap:6px; margin-bottom:8px; font-weight:600; }
                .energy-bars { display:flex; gap:4px; }
                .energy-bar {
                    width:18px; height:8px; background:#E8E8E8; border-radius:4px;
                    transition:all 0.3s ease;
                }
                .energy-bar.active { background:linear-gradient(90deg,#FFD700,#FFA500); }
                .energy-bar.active:nth-child(1){animation:glow-pulse 1.5s ease-in-out infinite;}
                @keyframes glow-pulse {
                    0%,100%{box-shadow:0 0 5px rgba(255,215,0,0.3);}
                    50%{box-shadow:0 0 12px rgba(255,215,0,0.6);}
                }
                .popup-overlay {
                    position:fixed;top:0;left:0;width:100%;height:100%;
                    background:rgba(0,0,0,0.4);z-index:199;
                    opacity:0;pointer-events:none;transition:opacity 0.3s ease;
                }
                .popup-overlay.show{opacity:1;pointer-events:auto;}
                .popup-card {
                    position:fixed; top:50%; left:50%;
                    transform:translate(-50%,-50%) scale(0.85);
                    background:white; padding:28px; border-radius:24px;
                    box-shadow:0 25px 80px rgba(0,0,0,0.25); max-width:400px;
                    width:92%; z-index:200; opacity:0; pointer-events:none;
                    transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
                    max-height:85vh; overflow-y:auto;
                }
                .popup-card.show {
                    opacity:1; transform:translate(-50%,-50%) scale(1); pointer-events:auto;
                }
                .popup-card .close-btn {
                    position:absolute; top:14px; right:14px; width:32px; height:32px;
                    border-radius:50%; background:#f0f0f0; border:none; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    font-size:18px; color:#666; transition:background 0.2s;
                }
                .popup-card .close-btn:hover{background:#e0e0e0;}
                .popup-card h3 {
                    font-size:18px; color:#4A4A4A; margin:0 0 20px;
                    text-align:center; padding-right:40px;
                }
                .knowledge-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
                .knowledge-card {
                    background:linear-gradient(135deg,#FFF8F0,#FFF0E6);
                    border-radius:14px; padding:16px; text-align:center;
                    cursor:pointer; transition:all 0.25s ease;
                    border:2px solid transparent;
                }
                .knowledge-card:hover {
                    transform:translateY(-5px);
                    box-shadow:0 10px 25px rgba(0,0,0,0.12);
                    border-color:#E8B87D;
                }
                .knowledge-card .emoji { font-size:36px; margin-bottom:10px; }
                .knowledge-card .title { font-size:14px; font-weight:700; color:#4A4A4A; margin-bottom:6px; }
                .knowledge-card .desc { font-size:11px; color:#8B7355; line-height:1.5; }
                .knowledge-card:nth-child(1){background:linear-gradient(135deg,#FFF8E1,#FFE4B5);}
                .knowledge-card:nth-child(2){background:linear-gradient(135deg,#E8F5E9,#C8E6C9);}
                .knowledge-card:nth-child(3){background:linear-gradient(135deg,#E3F2FD,#BBDEFB);}
                .knowledge-card:nth-child(4){background:linear-gradient(135deg,#F3E5F5,#E1BEE7);}
                .knowledge-card:nth-child(5){background:linear-gradient(135deg,#FFF0F5,#FFE4EC);}
                .knowledge-card:nth-child(6){background:linear-gradient(135deg,#E0F7FA,#B2EBF2);}
                .emotion-display { text-align:center; padding:10px 0; }
                .emotion-display .icon{font-size:64px;margin-bottom:16px;}
                .emotion-display .title{font-size:22px;font-weight:700;color:#4A4A4A;margin-bottom:12px;}
                .emotion-display .quote{font-size:15px;color:#666;line-height:1.7;font-style:italic;margin-bottom:20px;}
                .emotion-display button{
                    background:linear-gradient(135deg,#E8B87D,#D4956A);color:white;border:none;
                    padding:12px 28px;border-radius:25px;cursor:pointer;font-size:14px;font-weight:600;
                    transition:all 0.2s ease;
                }
                .emotion-display button:hover{transform:scale(1.05);box-shadow:0 6px 20px rgba(232,184,125,0.4);}
                .pet-interaction { text-align:center; }
                .pet-avatar {
                    width:100px; height:100px; margin:0 auto 16px;
                    border-radius:50%; overflow:hidden;
                    border:4px solid #E8B87D;
                    box-shadow:0 8px 25px rgba(0,0,0,0.15);
                    position:relative; cursor:pointer;
                    transition:all 0.3s ease;
                }
                .pet-avatar:hover { transform:scale(1.08); }
                .pet-avatar img { width:100%; height:100%; object-fit:cover; }
                .pet-avatar .pet-action {
                    position:absolute; inset:0;
                    display:flex; align-items:center; justify-content:center;
                    background:rgba(0,0,0,0.3); opacity:0;
                    transition:opacity 0.2s;
                    font-size:32px;
                }
                .pet-avatar:hover .pet-action { opacity:1; }
                .pet-name { font-size:18px; font-weight:700; color:#4A4A4A; margin-bottom:4px; }
                .pet-mood { font-size:13px; color:#8B7355; margin-bottom:16px; }
                .pet-msg {
                    background:#FFF8F0; padding:14px 18px; border-radius:14px;
                    font-size:14px; color:#4A4A4A; line-height:1.6;
                    margin-bottom:16px; position:relative;
                }
                .pet-msg::before {
                    content:''; position:absolute; top:-8px; left:50%;
                    transform:translateX(-50%);
                    border-left:8px solid transparent;
                    border-right:8px solid transparent;
                    border-bottom:8px solid #FFF8F0;
                }
                .pet-actions { display:flex; gap:10px; justify-content:center; }
                .pet-action-btn {
                    padding:10px 18px; border-radius:20px;
                    background:#FFF; border:2px solid #E8D5C0;
                    cursor:pointer; font-size:13px; font-weight:600;
                    color:#8B7355; transition:all 0.2s ease;
                    display:flex; align-items:center; gap:6px;
                }
                .pet-action-btn:hover {
                    background:#E8B87D; border-color:#E8B87D;
                    color:white; transform:translateY(-2px);
                }
                @media(max-width:640px){
                    .home-toolbar { right:8px; gap:6px; }
                    .tool-btn { width:48px; height:48px; border-radius:14px; }
                    .tool-btn .icon { font-size:24px; }
                    .tool-btn .tooltip { display:none; }
                    .energy-indicator { right:8px; bottom:16px; padding:8px 12px; }
                    .popup-card { padding:20px; border-radius:20px; }
                    .knowledge-grid { grid-template-columns:repeat(2,1fr); gap:10px; }
                    .knowledge-card { padding:12px; }
                    .knowledge-card .emoji { font-size:28px; }
                    .knowledge-card .title { font-size:13px; }
                }
            </style>
            <div class="home-bg-overlay" id="homeBgOverlay"></div>
            <div class="energy-indicator">
                <div class="energy-label"><span>🌟</span><span>心理能量</span></div>
                <div class="energy-bars" id="energyBars">
                    <div class="energy-bar active"></div>
                    <div class="energy-bar active"></div>
                    <div class="energy-bar active"></div>
                    <div class="energy-bar"></div>
                    <div class="energy-bar"></div>
                </div>
            </div>
            <div class="home-toolbar">
                <div class="tool-btn tool-knowledge" onclick="themeManager.toggleKnowledge()">
                    <span class="icon">📖</span>
                    <span class="tooltip">疗愈知识</span>
                </div>
                <div class="tool-btn tool-lamp" id="toolLamp" onclick="themeManager.toggleLamp()">
                    <span class="icon">💡</span>
                    <div class="lamp-glow-ring"></div>
                    <span class="tooltip">台灯</span>
                </div>
                <div class="tool-btn tool-pet" onclick="themeManager.togglePet()">
                    <span class="icon">🐰</span>
                    <span class="tooltip">宠物伙伴</span>
                </div>
                <div class="tool-btn tool-tea" onclick="themeManager.sipTea()">
                    <span class="icon">☕</span>
                    <div class="steam-anim"><span></span><span></span><span></span></div>
                    <span class="tooltip">静心茶</span>
                </div>
            </div>
            <div class="popup-overlay" id="popupOverlay" onclick="themeManager.closePopup()"></div>
            <div class="popup-card" id="knowledgePopup">
                <button class="close-btn" onclick="themeManager.closePopup()">✕</button>
                <h3>📖 疗愈知识</h3>
                <div class="knowledge-grid">
                    <div class="knowledge-card" onclick="themeManager.showKnowledgeDetail('breathing')">
                        <div class="emoji">🌬️</div>
                        <div class="title">呼吸放松</div>
                        <div class="desc">4-7-8呼吸法<br>平复焦虑</div>
                    </div>
                    <div class="knowledge-card" onclick="themeManager.showKnowledgeDetail('gratitude')">
                        <div class="emoji">🙏</div>
                        <div class="title">感恩练习</div>
                        <div class="desc">每日三件好事<br>提升幸福感</div>
                    </div>
                    <div class="knowledge-card" onclick="themeManager.showKnowledgeDetail('body-scan')">
                        <div class="emoji">🧘</div>
                        <div class="title">身体扫描</div>
                        <div class="desc">觉察身体感受<br>释放紧绷</div>
                    </div>
                    <div class="knowledge-card" onclick="themeManager.showKnowledgeDetail('self-compassion')">
                        <div class="emoji">💕</div>
                        <div class="title">自我慈悲</div>
                        <div class="desc">善待自己<br>像朋友般关怀</div>
                    </div>
                    <div class="knowledge-card" onclick="themeManager.showKnowledgeDetail('grounding')">
                        <div class="emoji">🌱</div>
                        <div class="title">5-4-3-2-1</div>
                        <div class="desc">感官接地法<br>应对恐慌</div>
                    </div>
                    <div class="knowledge-card" onclick="themeManager.showKnowledgeDetail('positive')">
                        <div class="emoji">✨</div>
                        <div class="title">积极日记</div>
                        <div class="desc">记录美好瞬间<br>重塑思维</div>
                    </div>
                </div>
            </div>
            <div class="popup-card" id="knowledgeDetailPopup">
                <button class="close-btn" onclick="themeManager.backToKnowledge()">←</button>
                <h3 id="knowledgeTitle">🌬️ 呼吸放松</h3>
                <div class="knowledge-content" id="knowledgeContent"></div>
            </div>
            <div class="popup-card" id="emotionCardPopup">
                <button class="close-btn" onclick="themeManager.closePopup()">✕</button>
                <div class="emotion-display">
                    <div class="icon" id="cardIcon">😊</div>
                    <div class="title" id="cardTitle">幸福感</div>
                    <div class="quote" id="cardQuote">幸福不是拥有最好的一切，而是把当下的一切都变得最好。</div>
                    <button onclick="themeManager.closePopup()">我知道了</button>
                </div>
            </div>
            <div class="popup-card" id="petPopup">
                <button class="close-btn" onclick="themeManager.closePopup()">✕</button>
                <div class="pet-interaction">
                    <div class="pet-avatar" onclick="themeManager.petInteract('pat')">
                        <img src="images/companions/爱心兔兔.png" alt="宠物" onerror="this.parentElement.innerHTML='<span style=font-size:60px>🐰</span>'">
                        <div class="pet-action">🐰</div>
                    </div>
                    <div class="pet-name" id="petName">爱心兔兔</div>
                    <div class="pet-mood" id="petMood">✨ 心情愉悦</div>
                    <div class="pet-msg" id="petMsg">嗨～看到你真开心！今天过得怎么样？</div>
                    <div class="pet-actions">
                        <button class="pet-action-btn" onclick="themeManager.petInteract('pat')">👋 打招呼</button>
                        <button class="pet-action-btn" onclick="themeManager.petInteract('hug')">🤗 抱抱</button>
                        <button class="pet-action-btn" onclick="themeManager.petInteract('play')">🎾 玩耍</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }

    /* ===== 切换知识弹窗 ===== */
    toggleKnowledge() {
        document.getElementById('knowledgePopup')?.classList.add('show');
        document.getElementById('popupOverlay')?.classList.add('show');
    }

    /* ===== 显示知识详情 ===== */
    showKnowledgeDetail(key) {
        const data = this.knowledgeLibrary[key];
        if (!data) return;
        document.getElementById('knowledgeTitle').innerHTML = data.title;
        document.getElementById('knowledgeContent').innerHTML = data.content;
        document.getElementById('knowledgePopup')?.classList.remove('show');
        document.getElementById('knowledgeDetailPopup')?.classList.add('show');
    }

    /* ===== 返回知识列表 ===== */
    backToKnowledge() {
        document.getElementById('knowledgeDetailPopup')?.classList.remove('show');
        document.getElementById('knowledgePopup')?.classList.add('show');
    }

    /* ===== 切换宠物弹窗 ===== */
    togglePet() {
        const petIdx = Math.floor(Math.random() * this.petNames.length);
        const petName = this.petNames[petIdx] || '爱心兔兔';
        const petEmoji = this.petEmojis[petIdx] || '🐰';
        const petMood = this.petMoodTexts[petIdx] || '✨ 心情愉悦';
        const petMsg = this.petGreetings[petIdx] || '嗨～看到你真开心！';
        
        document.getElementById('petName').textContent = petName;
        document.getElementById('petMood').textContent = petMood;
        document.getElementById('petMsg').textContent = petMsg;
        
        // 更新宠物头像
        const petAvatar = document.querySelector('#petPopup .pet-avatar');
        if (petAvatar) {
            const img = petAvatar.querySelector('img');
            const action = petAvatar.querySelector('.pet-action');
            if (img) {
                img.src = `images/companions/${petName}.png`;
                img.alt = petName;
            }
            if (action) action.textContent = petEmoji;
        }
        document.getElementById('petPopup')?.classList.add('show');
        document.getElementById('popupOverlay')?.classList.add('show');
    }

    /* ===== 宠物互动 ===== */
    petInteract(action) {
        const data = this.petInteractions[action];
        if (!data || !data.messages) return;
        const msg = data.messages[Math.floor(Math.random() * data.messages.length)];
        document.getElementById('petMsg').textContent = msg;
        document.getElementById('petMood').textContent = data.mood;
    }

    /* ===== 工作主题 ===== */
    createWorkEffects() {
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <style>
                .emotion-balls {
                    position:fixed; bottom:20px; left:20px;
                    display:flex; gap:12px; z-index:10;
                }
                .emotion-ball {
                    width:50px; height:50px; border-radius:50%; cursor:grab;
                    transition:all 0.3s ease; display:flex; align-items:center;
                    justify-content:center; font-size:24px;
                    box-shadow:0 4px 12px rgba(0,0,0,0.1);
                }
                .emotion-ball:hover{transform:scale(1.1);}
                .emotion-ball:active{cursor:grabbing;}
                .emotion-ball.anxious{background:linear-gradient(135deg,#FFB6C1,#FF69B4);}
                .emotion-ball.sad    {background:linear-gradient(135deg,#87CEEB,#4682B4);}
                .emotion-ball.angry  {background:linear-gradient(135deg,#FFA07A,#FF6347);}
                .emotion-ball.tired  {background:linear-gradient(135deg,#DDA0DD,#9370DB);}
                .trash-bin {
                    position:fixed; bottom:16px; right:16px;
                    width:56px; height:70px; z-index:10; cursor:pointer; transition:all 0.3s ease;
                }
                .trash-bin:hover{transform:scale(1.08);}
                .trash-bin.active{transform:scale(1.12);}
                .trash-body {
                    width:48px; height:55px;
                    background:linear-gradient(135deg,#C8D4E0,#A8B8C8);
                    border-radius:4px 4px 8px 8px; margin:0 auto; position:relative;
                }
                .trash-lid {
                    width:56px; height:12px;
                    background:linear-gradient(135deg,#B8C8D8,#98A8B8);
                    border-radius:4px; margin:0 auto 4px; transition:all 0.3s ease;
                }
                .trash-bin.active .trash-lid{transform:rotate(-30deg);transform-origin:left center;}
                .trash-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:14px;}
                .work-tip {
                    position:fixed; bottom:95px; left:12px;
                    font-size:11px; color:#4a6080;
                    background:rgba(255,255,255,0.9); padding:5px 10px;
                    border-radius:10px; box-shadow:0 2px 8px rgba(60,100,160,0.1);
                }
            </style>
            <div class="emotion-balls">
                <div class="emotion-ball anxious" draggable="true" data-emotion="anxious">😰</div>
                <div class="emotion-ball sad"     draggable="true" data-emotion="sad">😢</div>
                <div class="emotion-ball angry"   draggable="true" data-emotion="angry">😡</div>
                <div class="emotion-ball tired"   draggable="true" data-emotion="tired">😴</div>
            </div>
            <div class="work-tip">拖动情绪球 → 垃圾桶，释放压力</div>
            <div class="trash-bin" id="trash-bin">
                <div class="trash-lid"></div>
                <div class="trash-body"><div class="trash-label">🗑️</div></div>
            </div>
        `;
        document.body.appendChild(container);
        this.setupDragAndDrop();
    }

    /* ===== 娱乐主题 ===== */
    createEntertainmentEffects() {
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;"></canvas>
            <style>
                .game-entrance{position:fixed;bottom:20px;right:20px;z-index:10;}
                .game-btn{
                    background:linear-gradient(135deg,#2ebe9a,#20a882);color:white;
                    padding:15px 25px;border-radius:25px;border:none;cursor:pointer;
                    font-size:16px;font-weight:600;
                    box-shadow:0 4px 15px rgba(46,190,154,0.35);transition:all 0.3s ease;
                }
                .game-btn:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(46,190,154,0.45);}
            </style>
            <div class="game-entrance">
                <button class="game-btn" onclick="window.location.href='cat-game.html'">🎮 放松游戏</button>
            </div>
        `;
        document.body.appendChild(container);
        this.startParticles();
    }

    /* ===== 拖拽交互 ===== */
    setupDragAndDrop() {
        const balls = document.querySelectorAll('.emotion-ball');
        const trashBin = document.getElementById('trash-bin');

        balls.forEach(ball => {
            ball.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('emotion', ball.dataset.emotion);
                ball.style.opacity = '0.5';
            });
            ball.addEventListener('dragend', () => { ball.style.opacity = '1'; });
        });

        if (trashBin) {
            trashBin.addEventListener('dragover', (e) => {
                e.preventDefault();
                trashBin.classList.add('active');
            });
            trashBin.addEventListener('dragleave', () => {
                trashBin.classList.remove('active');
            });
            trashBin.addEventListener('drop', (e) => {
                e.preventDefault();
                const emotion = e.dataTransfer.getData('emotion');
                trashBin.classList.remove('active');
                const ball = document.querySelector(`[data-emotion="${emotion}"]`);
                if (ball) {
                    ball.style.transform = 'scale(0)';
                    ball.style.opacity = '0';
                    setTimeout(() => { ball.style.transform = 'scale(1)'; ball.style.opacity = '1'; }, 1200);
                }
                this.showEncouragement(emotion);
            });
        }
    }

    showEncouragement(emotion) {
        const msgs = {
            anxious: '深呼吸，焦虑会过去的 💪',
            sad:     '允许自己难过，明天会更好 🌈',
            angry:   '愤怒是正常的，让我们冷静一下 🧘',
            tired:   '休息一下，照顾好自己 😊'
        };
        const toast = document.createElement('div');
        Object.assign(toast.style, {
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            background: 'white', padding: '20px 30px',
            borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            zIndex: '1000', fontSize: '18px'
        });
        toast.textContent = msgs[emotion] || '你做得很好！';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    /* ===== 粒子动画 ===== */
    startParticles() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 1,
            color: Math.random() > 0.5 ? '#2ebe9a' : '#F5A9B8',
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5
        }));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX; p.y += p.speedY;
                if (p.x < 0 || p.x > canvas.width)  p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height)  p.speedY *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.6;
                ctx.fill();
            });
            requestAnimationFrame(animate);
        };
        animate();
        window.addEventListener('resize', () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    /* ===== 台灯 ===== */
    toggleLamp() {
        this.lampLevel = (this.lampLevel % 5) + 1;
        const toolLamp = document.getElementById('toolLamp');
        const bars  = document.querySelectorAll('.energy-bar');
        const bgOverlay = document.getElementById('homeBgOverlay');

        toolLamp?.classList.remove('level-1','level-2','level-3','level-4','level-5');
        toolLamp?.classList.add(`level-${this.lampLevel}`);

        bars.forEach((bar, i) => bar.classList.toggle('active', i < this.lampLevel));

        if (bgOverlay) {
            const opacities = [0, 0.15, 0.25, 0.4, 0.55, 0.7];
            bgOverlay.style.background = `
                radial-gradient(ellipse at 80% 20%, rgba(232,184,125,${opacities[this.lampLevel]}) 0%, transparent 50%),
                radial-gradient(ellipse at 20% 80%, rgba(168,196,212,${opacities[this.lampLevel] * 0.7}) 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(255,215,0,${opacities[this.lampLevel] * 0.3}) 0%, transparent 40%)
            `;
        }

        const msgs = { 1:'调暗一些，让自己休息...', 2:'柔和的灯光，适合放松', 3:'适中的亮度，刚刚好', 4:'明亮一些，更有能量', 5:'满满的能量，充满动力！' };
        this.showHomeToast(msgs[this.lampLevel]);
    }

    /* ===== 情绪卡片 ===== */
    openEmotionCard(emotion) {
        const data = this.emotionData[emotion];
        if (!data) return;
        document.getElementById('cardIcon').textContent  = data.icon;
        document.getElementById('cardTitle').textContent = data.title;
        document.getElementById('cardQuote').textContent = data.quote;
        document.getElementById('knowledgePopup')?.classList.remove('show');
        document.getElementById('emotionCardPopup').classList.add('show');
    }

    closePopup() {
        document.getElementById('popupOverlay')?.classList.remove('show');
        document.getElementById('emotionCardPopup')?.classList.remove('show');
        document.getElementById('knowledgePopup')?.classList.remove('show');
        document.getElementById('knowledgeDetailPopup')?.classList.remove('show');
        document.getElementById('petPopup')?.classList.remove('show');
    }

    /* ===== 静心茶 ===== */
    sipTea() {
        const msg = this.teaEncouragements[Math.floor(Math.random() * this.teaEncouragements.length)];
        this.showHomeToast(msg);
        const btn = document.querySelector('.tool-tea');
        if (btn) {
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => { btn.style.transform = ''; }, 200);
        }
    }

    /* ===== Toast 提示 ===== */
    showHomeToast(message) {
        document.querySelector('.home-toast')?.remove();
        const toast = document.createElement('div');
        toast.className = 'home-toast';
        Object.assign(toast.style, {
            position: 'fixed', bottom: '200px', left: '50%',
            transform: 'translateX(-50%) translateY(10px)',
            background: 'white', padding: '12px 24px', borderRadius: '25px',
            boxShadow: '0 6px 25px rgba(232,184,125,0.3)', fontSize: '14px',
            color: '#8B7355', zIndex: '300', opacity: '0', whiteSpace: 'nowrap',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)'
        });
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /* ===== 顶部主题下拉切换 ===== */
    createThemeSwitcher() {
        document.getElementById('theme-switcher')?.remove();
        document.querySelector('.theme-dropdown-wrap')?.remove();

        const wrap = document.createElement('div');
        wrap.className = 'theme-dropdown-wrap';
        wrap.innerHTML = `
            <style>
                .theme-dropdown-wrap {
                    position:fixed; top:12px; right:20px; z-index:10000;
                    font-family: inherit;
                }
                .theme-dropdown-btn {
                    display:flex; align-items:center; gap:6px;
                    padding:6px 14px; border-radius:20px;
                    background:rgba(255,255,255,0.92);
                    border:1.5px solid var(--theme-border, #e8d5c0);
                    cursor:pointer; font-size:13px; font-weight:600;
                    color:var(--theme-text, #4a3728);
                    box-shadow:0 2px 10px rgba(0,0,0,0.08);
                    transition:all 0.2s ease; user-select:none;
                    backdrop-filter:blur(8px);
                }
                .theme-dropdown-btn:hover {
                    box-shadow:0 4px 16px rgba(0,0,0,0.12);
                    transform:translateY(-1px);
                }
                .theme-dropdown-btn .arrow {
                    transition:transform 0.2s ease; font-size:10px;
                }
                .theme-dropdown-btn.open .arrow {
                    transform:rotate(180deg);
                }
                .theme-dropdown-menu {
                    position:absolute; top:calc(100% + 6px); right:0;
                    background:rgba(255,255,255,0.96);
                    border:1.5px solid var(--theme-border, #e8d5c0);
                    border-radius:12px; padding:6px; min-width:140px;
                    box-shadow:0 8px 30px rgba(0,0,0,0.12);
                    backdrop-filter:blur(12px);
                    opacity:0; transform:translateY(-6px);
                    pointer-events:none;
                    transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .theme-dropdown-menu.show {
                    opacity:1; transform:translateY(0);
                    pointer-events:auto;
                }
                .theme-dropdown-item {
                    display:flex; align-items:center; gap:8px;
                    padding:8px 12px; border-radius:8px;
                    cursor:pointer; font-size:13px; font-weight:500;
                    color:var(--theme-text, #4a3728);
                    transition:background 0.15s ease;
                }
                .theme-dropdown-item:hover {
                    background:rgba(0,0,0,0.05);
                }
                .theme-dropdown-item.active {
                    background:var(--color-primary-50, #fdf8f0);
                    color:var(--color-primary-600, #a8613a);
                    font-weight:600;
                }
                .theme-dropdown-item .dot {
                    width:8px; height:8px; border-radius:50%; flex-shrink:0;
                }
                @media(max-width:640px){
                    .theme-dropdown-wrap{top:8px;right:12px;}
                    .theme-dropdown-btn{font-size:12px;padding:5px 10px;}
                }
            </style>
            <div class="theme-dropdown-btn" id="themeDropdownBtn">
                <span class="icon">🏠</span>
                <span class="label">家</span>
                <span class="arrow">▾</span>
            </div>
            <div class="theme-dropdown-menu" id="themeDropdownMenu">
                <div class="theme-dropdown-item ${this.currentTheme==='home'?'active':''}" data-theme="home">
                    <span class="dot" style="background:linear-gradient(135deg,#E8B87D,#D4956A)"></span>
                    <span>🏠 家</span>
                </div>
                <div class="theme-dropdown-item ${this.currentTheme==='work'?'active':''}" data-theme="work">
                    <span class="dot" style="background:linear-gradient(135deg,#6B9BD1,#4A7FB8)"></span>
                    <span>💼 工作</span>
                </div>
                <div class="theme-dropdown-item ${this.currentTheme==='entertainment'?'active':''}" data-theme="entertainment">
                    <span class="dot" style="background:linear-gradient(135deg,#2ebe9a,#F5A9B8)"></span>
                    <span>🎮 娱乐</span>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);

        const btn  = document.getElementById('themeDropdownBtn');
        const menu = document.getElementById('themeDropdownMenu');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.toggle('show');
            btn.classList.toggle('open', isOpen);
        });

        menu.querySelectorAll('.theme-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const theme = item.dataset.theme;
                this.applyTheme(theme);
                menu.classList.remove('show');
                btn.classList.remove('open');
            });
        });

        document.addEventListener('click', () => {
            menu.classList.remove('show');
            btn.classList.remove('open');
        });

        window.addEventListener('themeChanged', (e) => {
            const theme = this.themes[e.detail.theme];
            if (!theme) return;
            btn.querySelector('.icon').textContent  = theme.icon;
            btn.querySelector('.label').textContent = theme.name;
            menu.querySelectorAll('.theme-dropdown-item').forEach(i => {
                i.classList.toggle('active', i.dataset.theme === e.detail.theme);
            });
        });
    }
}

// 全局实例
window.themeManager = new ThemeManager();
