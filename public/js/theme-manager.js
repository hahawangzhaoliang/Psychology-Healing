/**
 * 主题管理器
 * 支持三种主题：家、工作、娱乐
 * 修复：类结构、CSS变量映射
 */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'home';
        this._themeListenerBound = false;

        this.themes = {
            home: {
                name: '家', nameEn: 'Home', icon: '🏠',
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
                name: '工作', nameEn: 'Work', icon: '💼',
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
                name: '娱乐', nameEn: 'Entertainment', icon: '🎮',
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

        this.init();
    }

    themeName(key) {
        const t = this.themes[key];
        if (!t) return key;
        const isEn = window.I18N && I18N.currentLocale === 'en';
        return isEn ? (t.nameEn || t.name || key) : (t.name || key);
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
     * 从 JSON 文件加载文本数据（各自独立，一个失败不影响其他）
     */
    async loadTextData() {
        // 加载情绪数据
        try {
            const res = await fetch('data/emotions.json?v=' + ((window.I18N && I18N.langPackVersion) || Date.now()));
            const emotions = await res.json();
            this.emotionData = emotions.emotions || {};
            console.log('[ThemeManager] emotions.json 加载成功');
        } catch (e) {
            console.warn('[ThemeManager] emotions.json 加载失败:', e.message);
        }

        console.log('[ThemeManager] 文本数据加载完成');
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        // P1：切换时临时启用颜色过渡（结束后移除，不影响日常 hover 手感）
        root.classList.add('theme-switching');
        clearTimeout(this._themeTransitionTimer);
        this._themeTransitionTimer = setTimeout(function () {
            root.classList.remove('theme-switching');
        }, 600);
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
                .popup-overlay {
                    position:fixed;top:0;left:0;width:100%;height:100%;
                    background:rgba(0,0,0,0.4);z-index:199;
                    opacity:0;pointer-events:none;transition:opacity 0.3s ease;
                }
                .popup-overlay.show{opacity:1;pointer-events:auto;}
                .popup-card {
                    position:fixed; top:50%; left:50%;
                    transform:translate(-50%,-50%) scale(0.85);
                    background:var(--theme-card, #ffffff); padding:28px; border-radius:24px;
                    box-shadow:0 25px 80px rgba(0,0,0,0.25); max-width:400px;
                    width:92%; z-index:200; opacity:0; pointer-events:none;
                    transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
                    max-height:85vh; overflow-y:auto;
                }
                .popup-card.show {
                    opacity:1; transform:translate(-50%,-50%) scale(1); pointer-events:auto;
                }
                .empathy-btn {
                    position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #E8B87D, #D4956A);
                    box-shadow: 0 4px 16px rgba(212, 149, 106, 0.35);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; z-index: 100; border: none;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .empathy-btn:hover { transform: scale(1.1) rotate(-6deg); box-shadow: 0 6px 24px rgba(212, 149, 106, 0.5); }
                .empathy-card { text-align: center; padding: 6px 0 0; }
                .empathy-card .big-emoji { font-size: 52px; margin-bottom: 14px; }
                .empathy-card .prompt {
                    font-size: 15px; color: var(--theme-text, #4a3728); line-height: 1.8;
                    background: var(--color-warm-50, #fdf8f3); border-radius: 14px;
                    padding: 16px 18px; margin-bottom: 14px; border-left: 3px solid #D4956A;
                }
                .empathy-card .meta { font-size: 12px; color: var(--theme-text-light, #8b7355); margin-bottom: 16px; }
                .empathy-card .done-btn {
                    background: linear-gradient(135deg, #E8B87D, #D4956A);
                    color: #fff; border: none; padding: 11px 30px; border-radius: 25px;
                    cursor: pointer; font-size: 14px; font-weight: 600;
                    transition: all 0.2s ease;
                }
                .empathy-card .done-btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(212, 149, 106, 0.4); }
                .empathy-card .done-btn.done { background: #a8b8a0; cursor: default; }
                .empathy-card .done-msg {
                    font-size: 14px; color: #6B8F7C; font-weight: 600; margin-top: 14px;
                }
                .popup-card .close-btn {
                    position:absolute; top:14px; right:14px; width:32px; height:32px;
                    border-radius:50%; background:var(--theme-bg, #fdf8f3); border:none; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    font-size:18px; color:var(--theme-text-light, #8b7355); transition:background 0.2s;
                }
                .popup-card .close-btn:hover{background:var(--theme-border, #e8d5c0);}
                .popup-card h3 {
                    font-size:18px; color:var(--theme-text, #4a3728); margin:0 0 20px;
                    text-align:center; padding-right:40px;
                }
                .emotion-display { text-align:center; padding:10px 0; }
                .emotion-display .icon{font-size:64px;margin-bottom:16px;}
                .emotion-display .title{font-size:22px;font-weight:700;color:var(--theme-text, #4a3728);margin-bottom:12px;}
                .emotion-display .quote{font-size:15px;color:var(--theme-text-light, #8b7355);line-height:1.7;font-style:italic;margin-bottom:20px;}
                .emotion-display button{
                    background:linear-gradient(135deg,var(--color-primary-400,#d4956a),var(--color-primary-500,#c07a50));color:white;border:none;
                    padding:12px 28px;border-radius:25px;cursor:pointer;font-size:14px;font-weight:600;
                    transition:all 0.2s ease;
                }
                .emotion-display button:hover{transform:scale(1.05);box-shadow:0 6px 20px rgba(232,184,125,0.4);}
                @media(max-width:640px){
                    .home-toolbar { right:8px; gap:6px; }
                    .energy-indicator { right:8px; bottom:16px; padding:8px 12px; }
                    .popup-card { padding:20px; border-radius:20px; }
                }
            </style>
            <div class="home-bg-overlay" id="homeBgOverlay"></div>
            <div class="popup-overlay" id="popupOverlay" onclick="themeManager.closePopup()"></div>
            <div class="popup-card" id="emotionCardPopup">
                <button class="close-btn" onclick="themeManager.closePopup()">✕</button>
                <div class="emotion-display">
                    <div class="icon" id="cardIcon">😊</div>
                    <div class="title" id="cardTitle" data-i18n="widget.emotion_title">幸福感</div>
                    <div class="quote" id="cardQuote" data-i18n="widget.emotion_quote">幸福不是拥有最好的一切，而是把当下的一切都变得最好。</div>
                    <button onclick="themeManager.closePopup()" data-i18n="widget.got_it">我知道了</button>
                </div>
            </div>
            <button class="empathy-btn" id="empathy-btn" data-i18n-title="widget.empathy_btn" title="家庭共情练习卡" aria-label="家庭共情练习卡"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/></svg></button>
            <div class="popup-card" id="empathyPopup">
                <button class="close-btn" onclick="themeManager.closePopup()">✕</button>
                <div class="empathy-card">
                    <div style="font-size:16px;font-weight:700;color:var(--theme-text, #4a3728);margin-bottom:4px;" id="empathyTitle" data-i18n="widget.empathy_title">💞 今日共情小卡</div>
                    <div style="font-size:12px;color:var(--theme-text-light, #8b7355);margin-bottom:16px;" id="empathySub" data-i18n="widget.empathy_sub">一次小小的对话，让心更近</div>
                    <div class="big-emoji" id="empathyEmoji">🕊️</div>
                    <div class="prompt" id="empathyPrompt" data-i18n="widget.empathy_prompt">问问家人，今天最让你安心的一件事是什么？</div>
                    <div class="meta" id="empathyMeta" data-i18n="widget.empathy_meta">试着用温柔的语气，和家人聊一聊</div>
                    <button class="done-btn" id="empathyDoneBtn" data-i18n="widget.empathy_done" onclick="themeManager.empathyComplete()">✓ 已完成</button>
                    <div class="done-msg" id="empathyDoneMsg" data-i18n="widget.empathy_done_msg" style="display:none;">真好，你们的对话让今天有了温度</div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        this.initEmpathy();
    }

    /* ===== 娱乐主题 - 柔和光晕 + 解压小游戏工具栏 ===== */
    createEntertainmentEffects() {
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <style>
                .ent-bg-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background:
                        radial-gradient(ellipse at 72% 22%, rgba(255,183,197,0.16) 0%, transparent 55%),
                        radial-gradient(ellipse at 22% 82%, rgba(46,190,154,0.10) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(255,214,231,0.08) 0%, transparent 60%);
                    pointer-events: none; z-index: -1;
                    transition: background 0.5s ease;
                }
                .ent-game-btn {
                    position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--color-primary-400, #8fb8a8), var(--color-primary-500, #20a882));
                    box-shadow: 0 4px 16px rgba(32, 168, 130, 0.35);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px; cursor: pointer; z-index: 100; border: none;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .ent-game-btn:hover { transform: scale(1.1) rotate(-6deg); box-shadow: 0 6px 24px rgba(32, 168, 130, 0.5); }
                .ent-game-menu {
                    position: fixed; bottom: 82px; right: 24px; z-index: 101;
                    background: var(--theme-card, #ffffff);
                    border: 1px solid var(--theme-border, #b8e8d8);
                    border-radius: 16px; padding: 0.9rem;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                    display: none; width: 236px;
                }
                .ent-game-menu.active { display: block; }
                .ent-game-menu h4 {
                    margin: 0 0 0.6rem; font-size: 0.9rem; font-weight: 700;
                    color: var(--theme-text, #1a3530);
                }
                .ent-game-item {
                    display: flex; align-items: center; gap: 0.5rem;
                    width: 100%; text-align: left; padding: 0.55rem 0.7rem;
                    border: none; background: transparent; border-radius: 10px;
                    cursor: pointer; font-size: 0.85rem; font-weight: 600;
                    color: var(--theme-text, #1a3530);
                    transition: background 0.15s ease;
                }
                .ent-game-item:hover { background: var(--color-warm-50, #f0fdf9); }
            </style>
            <div class="ent-bg-overlay"></div>
            <button class="ent-game-btn" id="ent-game-btn" aria-label="解压小游戏"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h4M8 10v4"/><path d="M15 11h.01M18 13h.01"/><path d="M17.3 5H6.7a3.7 3.7 0 0 0-3.6 4.6l1.3 5.2A3.7 3.7 0 0 0 8 18h8a3.7 3.7 0 0 0 3.6-3.2l1.3-5.2A3.7 3.7 0 0 0 17.3 5z"/></svg></button>
            <div class="ent-game-menu" id="ent-game-menu">
                <h4 id="ent-game-title">解压小游戏</h4>
                <button class="ent-game-item" data-game="snake"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 4a8 8 0 0 1 8 8"/><circle cx="4" cy="12" r="2" fill="currentColor"/><path d="M20 12c0 4-3.2 8-8 8s-8-4-8-8"/></svg><span>软糖蛇蛇</span></button>
                <button class="ent-game-item" data-game="bubble"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="17" cy="8" r="4"/><path d="M8 21a4.5 4.5 0 0 0 4.5-4.5A4.5 4.5 0 0 0 8 12a4.5 4.5 0 0 0-4.5 4.5A4.5 4.5 0 0 0 8 21z"/><circle cx="17" cy="8" r="1.2" fill="currentColor"/></svg><span>泡泡轻拍</span></button>
                <button class="ent-game-item" data-game="star"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8-6.1-3.5-6.1 3.5 1.4-6.8L2.2 9.1l6.9-.8z"/></svg><span>星星收集</span></button>
                <button class="ent-game-item" data-game="cloud"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M17.5 19a4.5 4.5 0 0 0 .42-8.98A6 6 0 0 0 6.1 11.5 4 4 0 0 0 7.5 19h10z"/></svg><span>云朵泡泡</span></button>
            </div>
        `;
        document.body.appendChild(container);

        // 工具栏交互（games.js 未加载时动态注入）
        const btn = document.getElementById('ent-game-btn');
        const menu = document.getElementById('ent-game-menu');
        if (btn && menu) {
            btn.addEventListener('click', () => {
                const isEn = window.I18N && window.I18N.currentLocale === 'en';
                const title = document.getElementById('ent-game-title');
                if (title) title.textContent = isEn ? 'Tiny Games' : '解压小游戏';
                menu.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (menu.classList.contains('active') && !menu.contains(e.target) && !btn.contains(e.target)) {
                    menu.classList.remove('active');
                }
            });
            menu.querySelectorAll('.ent-game-item').forEach(item => {
                item.addEventListener('click', () => {
                    menu.classList.remove('active');
                    const name = item.dataset.game;
                    const open = () => {
                        if (window.openGame) { window.openGame(name); }
                        else { this.showToast('小游戏组件加载中，请稍候…', 'info'); }
                    };
                    if (window.openGame) { open(); }
                    else {
                        const s = document.createElement('script');
                        s.src = 'js/games.js?v=4';
                        s.onload = open;
                        document.head.appendChild(s);
                    }
                });
            });
        }
    }

    /* ===== 工作主题 - 静谧氛围 ===== */
    createWorkEffects() {
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <style>
                .work-bg-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background:
                        radial-gradient(ellipse at 72% 22%, rgba(61,122,191,0.14) 0%, transparent 55%),
                        radial-gradient(ellipse at 22% 82%, rgba(93,158,214,0.08) 0%, transparent 50%);
                    pointer-events: none; z-index: -1;
                    transition: background 0.5s ease;
                }
            </style>
            <div class="work-bg-overlay"></div>
        `;
        document.body.appendChild(container);
    }




    /* ===== 家庭共情练习卡 ===== */
    initEmpathy() {
        const btn = document.getElementById('empathy-btn');
        if (btn) {
            btn.addEventListener('click', () => this.toggleEmpathy());
        }
        // 每日一卡 + 完成状态
        this._empathyCards = [
            { zh: '问问家人，今天最让你安心的一件事是什么？', en: 'Ask your family: what was the most reassuring moment today?', emoji: '🕊️' },
            { zh: '告诉家人一件你今天特别欣赏 TA 的小事。', en: 'Tell your family one small thing you truly appreciated about them today.', emoji: '🌷' },
            { zh: '和家人分享一个今天让你微笑的瞬间。', en: 'Share a moment that made you smile today.', emoji: '🌤️' },
            { zh: '认真听家人说两分钟，不打断、不建议。', en: 'Listen to your family for two minutes — no interrupting, no advice.', emoji: '👂' },
            { zh: '给家人一个十秒的拥抱，感受彼此的温度。', en: "Give your family a ten-second hug and feel each other's warmth.", emoji: '🤗' },
            { zh: '和家人聊聊明天最期待的一件小事。', en: 'Talk about one small thing you are both looking forward to tomorrow.', emoji: '🌱' },
            { zh: '和家人回忆一件一起度过的开心小事。', en: 'Recall a small happy memory you shared together.', emoji: '📖' },
            { zh: '对家人说一句今天最想感谢的话。', en: 'Say one grateful thing to your family today.', emoji: '💛' },
            { zh: '问问家人，此刻最需要的是什么？', en: 'Ask your family what they need most right now.', emoji: '💧' },
            { zh: '放下手机，和家人一起安静地待五分钟。', en: 'Put down your phone and sit quietly with your family for five minutes.', emoji: '🕯️' },
        ];
    }

    toggleEmpathy() {
        const isEn = window.I18N && window.I18N.currentLocale === 'en';
        // 每日一卡（按日期索引，同一天同一张）
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const day = Math.floor((now - start) / 86400000);
        const card = this._empathyCards[day % this._empathyCards.length];
        const today = now.toISOString().slice(0, 10);
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem('xinqing_empathy') || '{}'); } catch (e) {}
        const doneToday = saved.date === today && saved.done;

        document.getElementById('empathyEmoji').textContent = card.emoji;
        document.getElementById('empathyPrompt').textContent = isEn ? card.en : card.zh;
        document.getElementById('empathyTitle').textContent = isEn ? '💞 Today\'s Empathy Card' : '💞 今日共情小卡';
        document.getElementById('empathySub').textContent = isEn ? 'A small conversation brings hearts closer' : '一次小小的对话，让心更近';
        document.getElementById('empathyMeta').textContent = isEn ? 'Try a gentle tone and share with your family' : '试着用温柔的语气，和家人聊一聊';
        const btn = document.getElementById('empathyDoneBtn');
        const msg = document.getElementById('empathyDoneMsg');
        if (doneToday) {
            btn.textContent = isEn ? '✓ Done' : '✓ 已完成';
            btn.classList.add('done');
            btn.disabled = true;
            msg.style.display = 'block';
            msg.textContent = isEn ? 'Lovely — your conversation warmed today' : '真好，你们的对话让今天有了温度';
        } else {
            btn.textContent = isEn ? '✓ Mark Done' : '✓ 已完成';
            btn.classList.remove('done');
            btn.disabled = false;
            msg.style.display = 'none';
        }
        document.getElementById('empathyPopup')?.classList.add('show');
        document.getElementById('popupOverlay')?.classList.add('show');
    }

    empathyComplete() {
        const isEn = window.I18N && window.I18N.currentLocale === 'en';
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        try { localStorage.setItem('xinqing_empathy', JSON.stringify({ date: today, done: true })); } catch (e) {}
        const btn = document.getElementById('empathyDoneBtn');
        const msg = document.getElementById('empathyDoneMsg');
        if (btn) { btn.textContent = isEn ? '✓ Done' : '✓ 已完成'; btn.classList.add('done'); btn.disabled = true; }
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = isEn ? 'Lovely — your conversation warmed today' : '真好，你们的对话让今天有了温度';
        }
    }

    /* ===== 情绪卡片 ===== */
    openEmotionCard(emotion) {
        const data = this.emotionData[emotion];
        if (!data) return;
        document.getElementById('cardIcon').textContent  = data.icon;
        document.getElementById('cardTitle').textContent = data.title;
        document.getElementById('cardQuote').textContent = data.quote;

    }

    closePopup() {
        document.getElementById('popupOverlay')?.classList.remove('show');
        document.getElementById('emotionCardPopup')?.classList.remove('show');
        document.getElementById('empathyPopup')?.classList.remove('show');
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
                @media(max-width:768px){
                    .theme-dropdown-wrap{top:10px;right:64px;}
                    .theme-dropdown-btn{padding:5px 9px;border-radius:50%;}
                    .theme-dropdown-btn .label{display:none;}
                }
                /* P1：主题切换时的颜色过渡 */
                .theme-switching, .theme-switching * {
                    transition: background-color 0.45s ease, color 0.45s ease, border-color 0.45s ease !important;
                }
            </style>
            <div class="theme-dropdown-btn" id="themeDropdownBtn">
                <span class="icon">${this.themes[this.currentTheme]?.icon || '🏠'}</span>
                <span class="label">${this.themeName(this.currentTheme)}</span>
                <span class="arrow">▾</span>
            </div>
            <div class="theme-dropdown-menu" id="themeDropdownMenu">
                <div class="theme-dropdown-item ${this.currentTheme==='home'?'active':''}" data-theme="home">
                    <span class="dot" style="background:linear-gradient(135deg,#E8B87D,#D4956A)"></span>
                    <span>🏠 ${this.themeName('home')}</span>
                </div>
                <div class="theme-dropdown-item ${this.currentTheme==='work'?'active':''}" data-theme="work">
                    <span class="dot" style="background:linear-gradient(135deg,#6B9BD1,#4A7FB8)"></span>
                    <span>💼 ${this.themeName('work')}</span>
                </div>
                <div class="theme-dropdown-item ${this.currentTheme==='entertainment'?'active':''}" data-theme="entertainment">
                    <span class="dot" style="background:linear-gradient(135deg,#2ebe9a,#F5A9B8)"></span>
                    <span>🎮 ${this.themeName('entertainment')}</span>
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

        if (!this._localeListenerBound) {
            this._localeListenerBound = true;
            // P1：语言切换时同步刷新主题按钮名称
            document.addEventListener('localeChanged', () => {
                const btnEl = document.getElementById('themeDropdownBtn');
                if (btnEl) btnEl.querySelector('.label').textContent = this.themeName(this.currentTheme);
            });
        }

        if (!this._themeListenerBound) {
            this._themeListenerBound = true;
            window.addEventListener('themeChanged', (e) => {
                const theme = this.themes[e.detail.theme];
                if (!theme) return;
                const btnEl = document.getElementById('themeDropdownBtn');
                const menuEl = document.getElementById('themeDropdownMenu');
                if (btnEl) {
                    btnEl.querySelector('.icon').textContent  = theme.icon;
                    btnEl.querySelector('.label').textContent = this.themeName(e.detail.theme);
                }
                if (menuEl) {
                    menuEl.querySelectorAll('.theme-dropdown-item').forEach(i => {
                        i.classList.toggle('active', i.dataset.theme === e.detail.theme);
                    });
                }
            });
        }
    }
}

// 全局实例
window.themeManager = new ThemeManager();


