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
                // 覆盖 neuroaesthetics.css 中的 CSS 变量
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

        this.emotionData = {
            happiness: { icon: '😊', title: '幸福感', quote: '幸福不是拥有最好的一切，而是把当下的一切都变得最好。' },
            calm:      { icon: '🧘', title: '平静',   quote: '让心静下来，如同清澈的湖水，映照出真实的自己。' },
            courage:   { icon: '🦁', title: '勇气',   quote: '勇气不是没有恐惧，而是即使恐惧也能前行。' },
            gratitude: { icon: '🙏', title: '感恩',   quote: '感恩生活中的每一份美好，它们都在滋养着你的心灵。' },
            anxiety:   { icon: '🌿', title: '焦虑',   quote: '焦虑只是提醒你，有些事情需要被看见和接纳。深呼吸，慢慢来。' },
            sadness:   { icon: '🌧️', title: '悲伤',  quote: '悲伤是爱的代价，允许自己难过，也是一种温柔。' }
        };

        this.teaEncouragements = [
            '一切都会好起来的 🌸', '你比自己想象的更强大 💪',
            '慢下来，享受这一刻 🌿', '给自己一个微笑 😊',
            '你值得被爱 💕', '今天也很棒呢 ✨',
            '休息一下也没关系 🌙', '保持呼吸，感受当下 🧘'
        ];

        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeSwitcher();
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;

        // 批量设置所有 CSS 变量，让整站颜色跟随主题
        Object.entries(theme.vars).forEach(([key, val]) => {
            root.style.setProperty(key, val);
        });

        // 设置 body class 与 data-theme
        document.body.className = document.body.className
            .replace(/\btheme-\S+/g, '').trim();
        document.body.classList.add(`theme-${themeName}`);
        document.body.setAttribute('data-theme', themeName);

        // 更新 hero 渐变（如果当前是首页）
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
                }
                .emotion-bookshelf {
                    position: fixed; bottom: 20px; left: 20px;
                    pointer-events: auto; cursor: pointer;
                    transition: transform 0.3s ease;
                }
                .emotion-bookshelf:hover { transform: scale(1.05); }
                .bookshelf-body {
                    width: 120px; height: 140px;
                    background: linear-gradient(180deg, #C4A882 0%, #A68B5B 100%);
                    border-radius: 8px 8px 4px 4px; padding: 8px 6px;
                    display: flex; flex-direction: column; gap: 6px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.2);
                    position: relative;
                }
                .bookshelf-body::before {
                    content:''; position:absolute; top:0; left:0; right:0;
                    height:8px; background:#8B7355; border-radius:8px 8px 0 0;
                }
                .book-row { display:flex; gap:4px; justify-content:center; margin-top:8px; }
                .book {
                    width:22px; height:32px; border-radius:2px; cursor:pointer;
                    transition:transform 0.2s ease; box-shadow:1px 1px 3px rgba(0,0,0,0.2);
                }
                .book:hover { transform:translateY(-8px) rotate(-5deg); }
                .book-happiness{background:linear-gradient(180deg,#FFE4B5,#FFD700);}
                .book-calm    {background:linear-gradient(180deg,#87CEEB,#4169E1);}
                .book-courage {background:linear-gradient(180deg,#FFA07A,#FF6347);}
                .book-gratitude{background:linear-gradient(180deg,#98FB98,#32CD32);}
                .book-anxiety {background:linear-gradient(180deg,#DDA0DD,#9370DB);}
                .book-sadness {background:linear-gradient(180deg,#B0C4DE,#6495ED);}
                .bookshelf-label {
                    text-align:center; font-size:10px; color:#8B7355; margin-top:4px; font-weight:600;
                }
                .desk-lamp {
                    position:fixed; bottom:20px; right:120px;
                    pointer-events:auto; cursor:pointer; transition:transform 0.3s ease;
                }
                .desk-lamp:hover { transform:scale(1.08); }
                .lamp-shade {
                    width:60px; height:40px;
                    background:linear-gradient(180deg,#FFF8DC,#FAEBD7);
                    border-radius:50% 50% 0 0/100% 100% 0 0; position:relative;
                    box-shadow:0 0 30px rgba(255,215,0,0.3); transition:all 0.3s ease;
                }
                .lamp-glow {
                    position:absolute; bottom:-20px; left:50%; transform:translateX(-50%);
                    width:80px; height:60px;
                    background:radial-gradient(ellipse,rgba(255,215,0,0.4) 0%,transparent 70%);
                    pointer-events:none; transition:all 0.3s ease;
                }
                .lamp-stand {
                    width:8px; height:50px; background:linear-gradient(90deg,#8B7355,#A68B5B,#8B7355);
                    margin:0 auto; border-radius:2px;
                }
                .lamp-base {
                    width:40px; height:8px; background:linear-gradient(180deg,#A68B5B,#8B7355);
                    margin:0 auto; border-radius:4px;
                }
                .lamp-label { text-align:center; font-size:10px; color:#8B7355; margin-top:4px; font-weight:600; }
                .energy-indicator {
                    position:fixed; bottom:170px; right:100px;
                    background:rgba(255,255,255,0.95); padding:8px 16px; border-radius:20px;
                    box-shadow:0 4px 15px rgba(0,0,0,0.1); font-size:12px; color:#8B7355;
                    pointer-events:none;
                }
                .energy-bars { display:flex; gap:3px; margin-top:4px; }
                .energy-bar {
                    width:16px; height:6px; background:#E8E8E8; border-radius:3px;
                    transition:background 0.3s ease;
                }
                .energy-bar.active { background:linear-gradient(90deg,#FFD700,#FFA500); }
                .tea-cup {
                    position:fixed; bottom:20px; right:40px;
                    pointer-events:auto; cursor:pointer; transition:transform 0.3s ease;
                }
                .tea-cup:hover { transform:scale(1.1) rotate(-5deg); }
                .cup-body {
                    width:40px; height:35px;
                    background:linear-gradient(180deg,#FFFFFF,#F5F5F5);
                    border-radius:0 0 50% 50%/0 0 100% 100%;
                    position:relative; box-shadow:2px 3px 8px rgba(0,0,0,0.1);
                }
                .cup-body::before {
                    content:''; position:absolute; top:5px; left:5px; right:5px; height:20px;
                    background:linear-gradient(180deg,#8B4513,#A0522D);
                    border-radius:0 0 50% 50%/0 0 100% 100%;
                }
                .cup-handle {
                    position:absolute; right:-12px; top:8px; width:15px; height:20px;
                    border:4px solid #F5F5F5; border-left:none; border-radius:0 10px 10px 0;
                }
                .cup-steam { position:absolute; top:-15px; left:50%; transform:translateX(-50%); display:flex; gap:4px; }
                .steam-line {
                    width:2px; height:12px; background:rgba(200,200,200,0.6); border-radius:2px;
                    animation:steam 2s ease-in-out infinite;
                }
                .steam-line:nth-child(2){animation-delay:0.3s;height:15px;}
                .steam-line:nth-child(3){animation-delay:0.6s;}
                @keyframes steam {
                    0%,100%{opacity:0.3;transform:translateY(0) scaleY(1);}
                    50%{opacity:0.8;transform:translateY(-5px) scaleY(1.2);}
                }
                .cup-label { text-align:center; font-size:10px; color:#8B7355; margin-top:4px; font-weight:600; }
                .emotion-card-popup {
                    position:fixed; top:50%; left:50%;
                    transform:translate(-50%,-50%) scale(0.8);
                    background:white; padding:24px; border-radius:16px;
                    box-shadow:0 20px 60px rgba(0,0,0,0.2); max-width:320px;
                    z-index:200; opacity:0; pointer-events:none;
                    transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                }
                .emotion-card-popup.show {
                    opacity:1; transform:translate(-50%,-50%) scale(1); pointer-events:auto;
                }
                .emotion-card-popup .close-btn {
                    position:absolute; top:12px; right:12px; width:28px; height:28px;
                    border-radius:50%; background:#f0f0f0; border:none; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    font-size:16px; color:#666; transition:background 0.2s;
                }
                .emotion-card-popup .close-btn:hover{background:#e0e0e0;}
                .emotion-card-icon{font-size:48px;text-align:center;margin-bottom:12px;}
                .emotion-card-title{font-size:18px;font-weight:700;color:#4A4A4A;text-align:center;margin-bottom:8px;}
                .emotion-card-quote{font-size:14px;color:#666;text-align:center;line-height:1.6;font-style:italic;}
                .emotion-card-action{margin-top:16px;text-align:center;}
                .emotion-card-action button{
                    background:linear-gradient(135deg,#E8B87D,#D4956A);color:white;border:none;
                    padding:10px 20px;border-radius:20px;cursor:pointer;font-size:14px;font-weight:600;
                    transition:transform 0.2s,box-shadow 0.2s;
                }
                .emotion-card-action button:hover{transform:scale(1.05);box-shadow:0 4px 15px rgba(232,184,125,0.4);}
                .popup-overlay {
                    position:fixed;top:0;left:0;width:100%;height:100%;
                    background:rgba(0,0,0,0.3);z-index:199;
                    opacity:0;pointer-events:none;transition:opacity 0.3s ease;
                }
                .popup-overlay.show{opacity:1;pointer-events:auto;}
            </style>
            <div class="home-bg-overlay"></div>
            <div class="energy-indicator">
                <span>🌟 心理能量</span>
                <div class="energy-bars">
                    <div class="energy-bar active"></div>
                    <div class="energy-bar active"></div>
                    <div class="energy-bar active"></div>
                    <div class="energy-bar"></div>
                    <div class="energy-bar"></div>
                </div>
            </div>
            <div class="emotion-bookshelf" onclick="themeManager.openBookshelf()">
                <div class="bookshelf-body">
                    <div class="book-row">
                        <div class="book book-happiness" onclick="event.stopPropagation();themeManager.openEmotionCard('happiness')"></div>
                        <div class="book book-calm"      onclick="event.stopPropagation();themeManager.openEmotionCard('calm')"></div>
                        <div class="book book-courage"   onclick="event.stopPropagation();themeManager.openEmotionCard('courage')"></div>
                    </div>
                    <div class="book-row">
                        <div class="book book-gratitude" onclick="event.stopPropagation();themeManager.openEmotionCard('gratitude')"></div>
                        <div class="book book-anxiety"   onclick="event.stopPropagation();themeManager.openEmotionCard('anxiety')"></div>
                        <div class="book book-sadness"   onclick="event.stopPropagation();themeManager.openEmotionCard('sadness')"></div>
                    </div>
                </div>
                <div class="bookshelf-label">📚 情绪书架</div>
            </div>
            <div class="desk-lamp" onclick="themeManager.toggleLamp()">
                <div class="lamp-shade" id="lampShade"><div class="lamp-glow" id="lampGlow"></div></div>
                <div class="lamp-stand"></div>
                <div class="lamp-base"></div>
                <div class="lamp-label">💡 台灯</div>
            </div>
            <div class="tea-cup" onclick="themeManager.sipTea()">
                <div class="cup-steam">
                    <div class="steam-line"></div>
                    <div class="steam-line"></div>
                    <div class="steam-line"></div>
                </div>
                <div class="cup-body"><div class="cup-handle"></div></div>
                <div class="cup-label">☕ 静心茶</div>
            </div>
            <div class="popup-overlay" onclick="themeManager.closePopup()"></div>
            <div class="emotion-card-popup" id="emotionCardPopup">
                <button class="close-btn" onclick="themeManager.closePopup()">✕</button>
                <div class="emotion-card-icon"  id="cardIcon"></div>
                <div class="emotion-card-title" id="cardTitle"></div>
                <div class="emotion-card-quote" id="cardQuote"></div>
                <div class="emotion-card-action"><button onclick="themeManager.closePopup()">我知道了</button></div>
            </div>
        `;
        document.body.appendChild(container);
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
                    position:fixed; bottom:20px; right:20px;
                    width:80px; height:100px; z-index:10; cursor:pointer; transition:all 0.3s ease;
                }
                .trash-bin:hover{transform:scale(1.05);}
                .trash-bin.active{transform:scale(1.15);}
                .trash-body {
                    width:70px; height:80px;
                    background:linear-gradient(135deg,#C8D4E0,#A8B8C8);
                    border-radius:5px 5px 10px 10px; margin:0 auto; position:relative;
                }
                .trash-lid {
                    width:80px; height:15px;
                    background:linear-gradient(135deg,#B8C8D8,#98A8B8);
                    border-radius:5px; margin:0 auto 5px; transition:all 0.3s ease;
                }
                .trash-bin.active .trash-lid{transform:rotate(-30deg);transform-origin:left center;}
                .trash-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:20px;}
                .work-tip {
                    position:fixed; bottom:130px; left:20px;
                    font-size:12px; color:#4a6080;
                    background:rgba(255,255,255,0.9); padding:6px 12px;
                    border-radius:12px; box-shadow:0 2px 8px rgba(60,100,160,0.1);
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
                <button class="game-btn" onclick="window.location.href='games.html'">🎮 放松游戏</button>
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
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    /* ===== 台灯 ===== */
    toggleLamp() {
        this.lampLevel = (this.lampLevel % 5) + 1;
        const shade = document.getElementById('lampShade');
        const glow  = document.getElementById('lampGlow');
        const bars  = document.querySelectorAll('.energy-bar');
        const brightness = 0.2 + this.lampLevel * 0.15;
        const glowSize   = 30 + this.lampLevel * 10;

        if (shade) shade.style.boxShadow = `0 0 ${glowSize}px rgba(255,215,0,${brightness})`;
        if (glow)  { glow.style.opacity = brightness; glow.style.width = `${60 + this.lampLevel * 10}px`; }
        bars.forEach((bar, i) => bar.classList.toggle('active', i < this.lampLevel));

        const msgs = { 1:'调暗一些，让自己休息...', 2:'柔和的灯光，适合放松', 3:'适中的亮度，刚刚好', 4:'明亮一些，更有能量', 5:'满满的能量，充满动力！' };
        this.showHomeToast(msgs[this.lampLevel]);
    }

    /* ===== 情绪书架 ===== */
    openBookshelf() {
        this.showHomeToast('📚 点击任意一本书，开启一段心灵之旅');
    }

    openEmotionCard(emotion) {
        const data = this.emotionData[emotion];
        if (!data) return;
        document.getElementById('cardIcon').textContent  = data.icon;
        document.getElementById('cardTitle').textContent = data.title;
        document.getElementById('cardQuote').textContent = data.quote;
        document.querySelector('.popup-overlay').classList.add('show');
        document.getElementById('emotionCardPopup').classList.add('show');
    }

    closePopup() {
        document.querySelector('.popup-overlay')?.classList.remove('show');
        document.getElementById('emotionCardPopup')?.classList.remove('show');
    }

    /* ===== 静心茶 ===== */
    sipTea() {
        const msg = this.teaEncouragements[Math.floor(Math.random() * this.teaEncouragements.length)];
        this.showHomeToast(msg);
        const cup = document.querySelector('.tea-cup');
        if (cup) {
            cup.style.transform = 'rotate(-10deg)';
            setTimeout(() => { cup.style.transform = ''; }, 250);
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
        // 移除旧元素
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

        // 切换下拉
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.toggle('show');
            btn.classList.toggle('open', isOpen);
        });

        // 点击选项
        menu.querySelectorAll('.theme-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const theme = item.dataset.theme;
                this.applyTheme(theme);
                menu.classList.remove('show');
                btn.classList.remove('open');
            });
        });

        // 点击外部关闭
        document.addEventListener('click', () => {
            menu.classList.remove('show');
            btn.classList.remove('open');
        });

        // 同步主题变更
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
