/**
 * 主题管理器
 * 支持三种主题：家、工作、娱乐
 */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'home';
        this.themes = {
            home: {
                name: '家',
                icon: '🏠',
                colors: {
                    primary: '#E8B87D',      // 暖米黄
                    secondary: '#A8C4D4',    // 浅灰蓝
                    background: '#FDF8F3',   // 温暖背景
                    card: '#FFFFFF',
                    text: '#4A4A4A',
                    accent: '#D4956A'
                },
                description: '温馨舒适的家，给你安全感'
            },
            work: {
                name: '工作',
                icon: '💼',
                colors: {
                    primary: '#6B9BD1',      // 浅蓝
                    secondary: '#C8D4E0',    // 银灰
                    background: '#F5F8FC',   // 清爽背景
                    card: '#FFFFFF',
                    text: '#3A3A3A',
                    accent: '#4A7FB8'
                },
                description: '专注高效的工作空间'
            },
            entertainment: {
                name: '娱乐',
                icon: '🎮',
                colors: {
                    primary: '#7DD3C0',      // 薄荷绿
                    secondary: '#F5A9B8',    // 珊瑚粉
                    background: '#F0FDF9',   // 清新背景
                    card: '#FFFFFF',
                    text: '#3A3A3A',
                    accent: '#5AB89F'
                },
                description: '轻松愉快的娱乐时光'
            }
        };
        
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
        const colors = theme.colors;
        
        // 应用CSS变量
        root.style.setProperty('--theme-primary', colors.primary);
        root.style.setProperty('--theme-secondary', colors.secondary);
        root.style.setProperty('--theme-background', colors.background);
        root.style.setProperty('--theme-card', colors.card);
        root.style.setProperty('--theme-text', colors.text);
        root.style.setProperty('--theme-accent', colors.accent);
        
        // 添加主题类名
        document.body.className = `theme-${themeName}`;
        
        // 保存到本地存储
        localStorage.setItem('theme', themeName);
        this.currentTheme = themeName;
        
        // 触发主题切换事件
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeName, themeData: theme }
        }));
        
        // 应用特殊效果
        this.applyThemeEffects(themeName);
    }
    
    applyThemeEffects(themeName) {
        // 移除旧的主题效果容器
        const oldContainer = document.getElementById('theme-effects');
        if (oldContainer) {
            oldContainer.remove();
        }
        
        // 根据主题添加特殊效果
        switch(themeName) {
            case 'home':
                this.createHomeEffects();
                break;
            case 'work':
                this.createWorkEffects();
                break;
            case 'entertainment':
                this.createEntertainmentEffects();
                break;
        }
    }
    
    createHomeEffects() {
        // 家的主题：温馨的窗帘背景和台灯
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <style>
                .home-curtain {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 200px;
                    height: 100%;
                    background: linear-gradient(to left, rgba(232, 184, 125, 0.15), transparent);
                    pointer-events: none;
                    z-index: -1;
                }
                .home-curtain::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 50px;
                    width: 150px;
                    height: 100%;
                    background: linear-gradient(to left, rgba(168, 196, 212, 0.1), transparent);
                }
                .home-lamp {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 80px;
                    height: 120px;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .lamp-shade {
                    width: 70px;
                    height: 45px;
                    background: linear-gradient(135deg, #FFE4B5, #DEB887);
                    border-radius: 50% 50% 0 0;
                    position: relative;
                    border: 3px solid #CD853F;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3);
                }
                .lamp-shade::before {
                    content: '';
                    position: absolute;
                    top: 8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 50px;
                    height: 3px;
                    background: #CD853F;
                    border-radius: 2px;
                }
                .home-lamp:hover .lamp-shade {
                    box-shadow: 0 0 30px rgba(255, 200, 100, 0.6), 0 4px 12px rgba(0,0,0,0.2);
                }
                .lamp-stand {
                    width: 6px;
                    height: 50px;
                    background: linear-gradient(to right, #8B4513, #A0522D, #8B4513);
                    margin: 0 auto;
                    border-radius: 3px;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.1);
                }
                .lamp-base {
                    width: 50px;
                    height: 12px;
                    background: linear-gradient(to bottom, #A0522D, #8B4513);
                    margin: 0 auto;
                    border-radius: 3px;
                    border: 2px solid #6B4423;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .lamp-light {
                    position: absolute;
                    bottom: -120px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 180px;
                    height: 180px;
                    background: radial-gradient(circle, rgba(255, 220, 150, 0.4), transparent 70%);
                    pointer-events: none;
                    opacity: 1;
                    transition: opacity 0.5s ease;
                }
                .lamp-light.off {
                    opacity: 0;
                }
                .lamp-icon {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 28px;
                    opacity: 1;
                    transition: opacity 0.3s ease;
                }
                .home-lamp.off .lamp-icon {
                    opacity: 0.4;
                }
                .home-lamp.off .lamp-shade {
                    opacity: 0.7;
                }
                .night-sky {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 0;
                    opacity: 0;
                    transition: opacity 1s ease;
                }
                .night-sky.active {
                    opacity: 1;
                }
                .star {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: white;
                    border-radius: 50%;
                    animation: twinkle 2s ease-in-out infinite;
                    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                .firefly {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: radial-gradient(circle, #FFE4B5, transparent);
                    border-radius: 50%;
                    animation: float 6s ease-in-out infinite;
                    box-shadow: 0 0 10px rgba(255, 228, 181, 0.6);
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
                    25% { transform: translate(20px, -30px) scale(1.1); opacity: 1; }
                    50% { transform: translate(-10px, -50px) scale(0.9); opacity: 0.8; }
                    75% { transform: translate(15px, -20px) scale(1.05); opacity: 1; }
                }
                .moon {
                    position: fixed;
                    top: 50px;
                    left: 50px;
                    width: 80px;
                    height: 80px;
                    background: radial-gradient(circle at 30% 30%, #FFF9E6, #FFE4B5);
                    border-radius: 50%;
                    box-shadow: 0 0 40px rgba(255, 249, 230, 0.4), 0 0 80px rgba(255, 228, 181, 0.2);
                    opacity: 0;
                    transition: opacity 1.5s ease;
                    pointer-events: none;
                    z-index: 1;
                }
                .moon.active {
                    opacity: 1;
                }
                .home-bookshelf {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    display: flex;
                    gap: 8px;
                    z-index: 10;
                }
                .book {
                    width: 20px;
                    height: 60px;
                    border-radius: 2px;
                }
                .book:hover {
                    transform: translateY(-5px);
                }
                .book:nth-child(1) { background: #E8B87D; height: 55px; }
                .book:nth-child(2) { background: #A8C4D4; height: 65px; }
                .book:nth-child(3) { background: #D4956A; height: 58px; }
                .book:nth-child(4) { background: #C4A484; height: 62px; }
                .book:nth-child(5) { background: #B8A088; height: 60px; }
            </style>
            <div class="home-curtain"></div>
            <div class="home-lamp" onclick="themeManager.toggleLamp()">
                <div class="lamp-shade">
                    <div class="lamp-icon">💡</div>
                    <div class="lamp-light" id="lamp-light"></div>
                </div>
                <div class="lamp-stand"></div>
                <div class="lamp-base"></div>
            </div>
            <div class="home-bookshelf">
                <div class="book" onclick="themeManager.openBook(0)"></div>
                <div class="book" onclick="themeManager.openBook(1)"></div>
                <div class="book" onclick="themeManager.openBook(2)"></div>
                <div class="book" onclick="themeManager.openBook(3)"></div>
                <div class="book" onclick="themeManager.openBook(4)"></div>
            </div>
        `;
        document.body.appendChild(container);
        
        this.lampOn = true;
    }
    
    createWorkEffects() {
        // 工作主题：情绪小球垃圾桶
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <style>
                .emotion-balls {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    display: flex;
                    gap: 12px;
                    z-index: 10;
                }
                .emotion-ball {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    cursor: grab;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .emotion-ball:hover {
                    transform: scale(1.1);
                }
                .emotion-ball:active {
                    cursor: grabbing;
                }
                .emotion-ball.anxious { background: linear-gradient(135deg, #FFB6C1, #FF69B4); }
                .emotion-ball.sad { background: linear-gradient(135deg, #87CEEB, #4682B4); }
                .emotion-ball.angry { background: linear-gradient(135deg, #FFA07A, #FF6347); }
                .emotion-ball.tired { background: linear-gradient(135deg, #DDA0DD, #9370DB); }
                
                .trash-bin {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 80px;
                    height: 100px;
                    z-index: 10;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .trash-bin:hover {
                    transform: scale(1.05);
                }
                .trash-bin.active {
                    transform: scale(1.15);
                }
                .trash-body {
                    width: 70px;
                    height: 80px;
                    background: linear-gradient(135deg, #C8D4E0, #A8B8C8);
                    border-radius: 5px 5px 10px 10px;
                    margin: 0 auto;
                    position: relative;
                }
                .trash-lid {
                    width: 80px;
                    height: 15px;
                    background: linear-gradient(135deg, #B8C8D8, #98A8B8);
                    border-radius: 5px;
                    margin: 0 auto 5px;
                    transition: all 0.3s ease;
                }
                .trash-bin.active .trash-lid {
                    transform: rotate(-30deg);
                    transform-origin: left center;
                }
                .trash-label {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 20px;
                }
            </style>
            <div class="emotion-balls">
                <div class="emotion-ball anxious" draggable="true" data-emotion="anxious">😰</div>
                <div class="emotion-ball sad" draggable="true" data-emotion="sad">😢</div>
                <div class="emotion-ball angry" draggable="true" data-emotion="angry">😡</div>
                <div class="emotion-ball tired" draggable="true" data-emotion="tired">😴</div>
            </div>
            <div class="trash-bin" id="trash-bin">
                <div class="trash-lid"></div>
                <div class="trash-body">
                    <div class="trash-label">🗑️</div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        
        this.setupDragAndDrop();
    }
    
    createEntertainmentEffects() {
        // 娱乐主题：动态粒子背景
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <canvas id="particle-canvas" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;"></canvas>
            <style>
                .game-entrance {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10;
                }
                .game-btn {
                    background: linear-gradient(135deg, #7DD3C0, #5AB89F);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 25px;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(125, 211, 192, 0.3);
                    transition: all 0.3s ease;
                }
                .game-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(125, 211, 192, 0.4);
                }
            </style>
            <div class="game-entrance">
                <button class="game-btn" onclick="window.location.href='games.html'">
                    🎮 放松游戏
                </button>
            </div>
        `;
        document.body.appendChild(container);
        
        this.startParticles();
    }
    
    toggleLamp() {
        const light = document.getElementById('lamp-light');
        const lamp = document.querySelector('.home-lamp');
        if (light && lamp) {
            this.lampOn = !this.lampOn;
            light.classList.toggle('off', !this.lampOn);
            lamp.classList.toggle('off', !this.lampOn);
            
            // 关灯效果：星空、萤火虫、月亮
            if (!this.lampOn) {
                this.createNightSky();
                this.createMoon();
                this.playRelaxingMusic();
            } else {
                this.removeNightSky();
                this.removeMoon();
                this.stopRelaxingMusic();
            }
        }
    }
    
    createNightSky() {
        // 创建星空背景
        let nightSky = document.getElementById('night-sky');
        if (!nightSky) {
            nightSky = document.createElement('div');
            nightSky.id = 'night-sky';
            nightSky.className = 'night-sky';
            
            // 添加星星
            for (let i = 0; i < 50; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 2 + 's';
                nightSky.appendChild(star);
            }
            
            // 添加萤火虫
            for (let i = 0; i < 15; i++) {
                const firefly = document.createElement('div');
                firefly.className = 'firefly';
                firefly.style.left = Math.random() * 100 + '%';
                firefly.style.top = Math.random() * 100 + '%';
                firefly.style.animationDelay = Math.random() * 6 + 's';
                firefly.style.animationDuration = (4 + Math.random() * 4) + 's';
                nightSky.appendChild(firefly);
            }
            
            document.body.appendChild(nightSky);
        }
        
        setTimeout(() => nightSky.classList.add('active'), 50);
    }
    
    removeNightSky() {
        const nightSky = document.getElementById('night-sky');
        if (nightSky) {
            nightSky.classList.remove('active');
            setTimeout(() => nightSky.remove(), 1000);
        }
    }
    
    createMoon() {
        let moon = document.getElementById('night-moon');
        if (!moon) {
            moon = document.createElement('div');
            moon.id = 'night-moon';
            moon.className = 'moon';
            document.body.appendChild(moon);
        }
        setTimeout(() => moon.classList.add('active'), 50);
    }
    
    removeMoon() {
        const moon = document.getElementById('night-moon');
        if (moon) {
            moon.classList.remove('active');
            setTimeout(() => moon.remove(), 1500);
        }
    }
    
    playRelaxingMusic() {
        // 创建或获取音频元素
        let audio = document.getElementById('relaxing-music');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'relaxing-music';
            audio.loop = true;
            audio.volume = 0.3;
            
            // 使用免费的放松音乐（如果没有本地文件，使用在线资源）
            // 这里使用一个占位URL，实际应该使用本地音频文件
            audio.src = 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3';
            
            document.body.appendChild(audio);
        }
        
        audio.play().catch(err => {
            console.log('自动播放被阻止，需要用户交互');
        });
    }
    
    stopRelaxingMusic() {
        const audio = document.getElementById('relaxing-music');
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
    
    openBook(index) {
        const books = [
            { title: '正念的力量', content: '每一刻的觉察，都是对自己的温柔...' },
            { title: '情绪日记', content: '记录今天的小确幸...' },
            { title: '呼吸指南', content: '吸气，感受生命的能量...' },
            { title: '放松手册', content: '让身体慢慢放松...' },
            { title: '成长之路', content: '每一步都是进步...' }
        ];
        
        const book = books[index];
        alert(`📖 ${book.title}\n\n${book.content}`);
    }
    
    setupDragAndDrop() {
        const balls = document.querySelectorAll('.emotion-ball');
        const trashBin = document.getElementById('trash-bin');
        
        balls.forEach(ball => {
            ball.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('emotion', ball.dataset.emotion);
                ball.style.opacity = '0.5';
            });
            
            ball.addEventListener('dragend', (e) => {
                ball.style.opacity = '1';
            });
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
                
                // 动画效果：小球消失
                const ball = document.querySelector(`[data-emotion="${emotion}"]`);
                if (ball) {
                    ball.style.transform = 'scale(0)';
                    ball.style.opacity = '0';
                    setTimeout(() => {
                        ball.style.transform = 'scale(1)';
                        ball.style.opacity = '1';
                    }, 1000);
                }
                
                // 显示鼓励信息
                this.showEncouragement(emotion);
            });
        }
    }
    
    showEncouragement(emotion) {
        const messages = {
            anxious: '深呼吸，焦虑会过去的 💪',
            sad: '允许自己难过，明天会更好 🌈',
            angry: '愤怒是正常的，让我们冷静一下 🧘',
            tired: '休息一下，照顾好自己 😊'
        };
        
        const msg = messages[emotion] || '你做得很好！';
        
        // 创建提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 18px;
            animation: fadeInOut 2s ease;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    }
    
    startParticles() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const particleCount = 50;
        
        // 创建粒子
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                color: Math.random() > 0.5 ? '#7DD3C0' : '#F5A9B8',
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5
            });
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // 边界检测
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
                
                // 绘制粒子
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = 0.6;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
        
        // 窗口大小改变时调整canvas
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
    
    createThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.id = 'theme-switcher';
        switcher.innerHTML = `
            <style>
                #theme-switcher {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .theme-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 3px solid white;
                    cursor: pointer;
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .theme-btn:hover {
                    transform: scale(1.1);
                }
                .theme-btn.active {
                    border-color: var(--theme-primary);
                    box-shadow: 0 0 0 3px rgba(var(--theme-primary), 0.3);
                }
                .theme-btn.home { background: linear-gradient(135deg, #E8B87D, #D4956A); }
                .theme-btn.work { background: linear-gradient(135deg, #6B9BD1, #4A7FB8); }
                .theme-btn.entertainment { background: linear-gradient(135deg, #7DD3C0, #F5A9B8); }
                
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            </style>
            <button class="theme-btn home ${this.currentTheme === 'home' ? 'active' : ''}" 
                    onclick="themeManager.applyTheme('home')" title="家">🏠</button>
            <button class="theme-btn work ${this.currentTheme === 'work' ? 'active' : ''}" 
                    onclick="themeManager.applyTheme('work')" title="工作">💼</button>
            <button class="theme-btn entertainment ${this.currentTheme === 'entertainment' ? 'active' : ''}" 
                    onclick="themeManager.applyTheme('entertainment')" title="娱乐">🎮</button>
        `;
        
        document.body.appendChild(switcher);
        
        // 监听主题切换，更新按钮状态
        window.addEventListener('themeChanged', (e) => {
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`.theme-btn.${e.detail.theme}`).classList.add('active');
        });
    }
}

// 初始化主题管理器
const themeManager = new ThemeManager();
