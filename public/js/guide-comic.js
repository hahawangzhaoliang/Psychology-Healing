/**
 * 漫画风格引导系统
 * Comic-style Guide System
 * 
 * 功能：
 * 1. 5步引导帮助用户理解心流概念
 * 2. 漫画风格SVG插画
 * 3. 支持上一步/下一步/跳过
 * 4. 记录用户完成状态（localStorage）
 */

const GuideComic = {
    currentStep: 0,
    totalSteps: 5,
    
    // 引导步骤数据
    steps: [
        {
            id: 1,
            title: '欢迎来到心流体验室',
            icon: '🎯',
            text: '心流（Flow）是一种完全沉浸、忘记时间的专注状态。在这里，你将通过探索感兴趣的活动，体验这种美妙的感受。',
            comic: 'step1'
        },
        {
            id: 2,
            title: '选择你感兴趣的领域',
            icon: '🔍',
            text: '浏览不同的兴趣领域（如写作、绘画、编程、音乐等），找到那个让你眼睛发亮的方向。不要担心选择"正确"的领域，重要的是你的好奇心。',
            comic: 'step2'
        },
        {
            id: 3,
            title: '设定一个具体目标',
            icon: '🎯',
            text: '为这次体验设定一个清晰、可实现的小目标。比如"写出100字"、"画一个简单的图案"、"完成一个小功能"。目标要稍微有挑战性，但不会让你焦虑。',
            comic: 'step3'
        },
        {
            id: 4,
            title: '开始专注体验',
            icon: '⏱️',
            text: '点击"开始体验"按钮，选择一个环境音（可选），然后全身心投入你的活动。15-60分钟后，你会感受到心流的愉悦。记得在体验后记录你的感受！',
            comic: 'step4'
        },
        {
            id: 5,
            title: '回顾与成长',
            icon: '📝',
            text: '每次体验后，花2分钟记录你的感受。随着记录增多，你会发现自己更容易进入心流状态，也会更了解自己的热情所在。开始你的心流之旅吧！',
            comic: 'step5'
        }
    ],

        // 引导步骤数据（英文版）
        stepsEn: [
            {
                id: 1,
                title: 'Welcome to Flow Experience Room',
                icon: '🎯',
                text: 'Flow is a state of complete immersion where you lose track of time. Here, you will experience this wonderful feeling through exploring activities that interest you.',
                comic: 'step1'
            },
            {
                id: 2,
                title: 'Choose Your Area of Interest',
                icon: '🔍',
                text: 'Browse different interest areas (writing, drawing, coding, music, etc.) and find the direction that makes your eyes light up. Don\'t worry about choosing the "right" area — what matters is your curiosity.',
                comic: 'step2'
            },
            {
                id: 3,
                title: 'Set a Specific Goal',
                icon: '🎯',
                text: 'Set a clear, achievable small goal for this experience. For example: "write 100 words", "draw a simple pattern", "complete a small feature". The goal should be slightly challenging but not anxiety-inducing.',
                comic: 'step3'
            },
            {
                id: 4,
                title: 'Start Focused Experience',
                icon: '⏱️',
                text: 'Click the "Start Experience" button, choose an ambient sound (optional), then fully immerse yourself in your activity. After 15-60 minutes, you\'ll feel the joy of flow. Remember to record your feelings after the experience!',
                comic: 'step4'
            },
            {
                id: 5,
                title: 'Review and Grow',
                icon: '📝',
                text: 'After each experience, spend 2 minutes recording your feelings. As you accumulate records, you\'ll find it easier to enter flow state and better understand where your passion lies. Start your flow journey now!',
                comic: 'step5'
            }
        ],

    // 漫画SVG生成函数
    comicSVGs: {
        step1: () => `
            <svg class="guide-comic-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- 背景圆形光环 -->
                <circle cx="100" cy="100" r="80" fill="url(#step1Gradient)" opacity="0.3"/>
                
                <!-- 人物头部 -->
                <circle cx="100" cy="80" r="25" fill="#FFD1A4"/>
                
                <!-- 身体 -->
                <rect x="80" y="105" width="40" height="50" rx="10" fill="#5cb8a8"/>
                
                <!-- 心流光环 -->
                <circle cx="100" cy="100" r="60" fill="none" stroke="url(#flowGradient)" stroke-width="3" stroke-dasharray="10 5" opacity="0.6">
                    <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="10s" repeatCount="indefinite"/>
                </circle>
                
                <!-- 星星装饰 -->
                <text x="40" y="50" font-size="20" opacity="0.6">✨</text>
                <text x="150" y="60" font-size="16" opacity="0.5">💫</text>
                <text x="30" y="150" font-size="18" opacity="0.4">⭐</text>
                
                <!-- 思考气泡 -->
                <path d="M 140 40 Q 160 30, 170 50 Q 175 70, 155 75 Q 140 80, 135 65 Z" fill="white" stroke="#ccc" stroke-width="1.5"/>
                <text x="148" y="62" font-size="14" fill="#5cb8a8">${_t('guide.step1_flow', 'Flow!')}</text>
                
                <defs>
                    <linearGradient id="step1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#7eddd1;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#fde68a;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#5cb8a8;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
                    </linearGradient>
                </defs>
            </svg>
        `,
        
        step2: () => `
            <svg class="guide-comic-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- 背景 -->
                <rect x="10" y="10" width="180" height="180" rx="20" fill="#f0fdfa" opacity="0.5"/>
                
                <!-- 领域图标 - 写作 -->
                <rect x="30" y="40" width="50" height="50" rx="10" fill="white" stroke="#5cb8a8" stroke-width="2"/>
                <text x="55" y="72" font-size="24" text-anchor="middle">✍️</text>
                
                <!-- 领域图标 - 绘画 -->
                <rect x="120" y="40" width="50" height="50" rx="10" fill="white" stroke="#f59e0b" stroke-width="2"/>
                <text x="145" y="72" font-size="24" text-anchor="middle">🎨</text>
                
                <!-- 领域图标 - 编程 -->
                <rect x="30" y="110" width="50" height="50" rx="10" fill="white" stroke="#a78bfa" stroke-width="2"/>
                <text x="55" y="142" font-size="24" text-anchor="middle">💻</text>
                
                <!-- 领域图标 - 音乐 -->
                <rect x="120" y="110" width="50" height="50" rx="10" fill="white" stroke="#5cb8a8" stroke-width="2"/>
                <text x="145" y="142" font-size="24" text-anchor="middle">🎵</text>
                
                <!-- 放大镜 -->
                <circle cx="165" cy="35" r="15" fill="none" stroke="#4b5563" stroke-width="3"/>
                <line x1="176" y1="46" x2="185" y2="55" stroke="#4b5563" stroke-width="3" stroke-linecap="round"/>
            </svg>
        `,
        
        step3: () => `
            <svg class="guide-comic-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- 目标卡片 -->
                <rect x="40" y="30" width="120" height="140" rx="15" fill="white" stroke="#5cb8a8" stroke-width="2"/>
                
                <!-- 标题 -->
                <text x="100" y="60" font-size="14" font-weight="bold" text-anchor="middle" fill="#2d5a5a">${_t('guide.step3_goal', 'My Goal')}</text>
                
                <!-- 目标内容 -->
                <text x="60" y="85" font-size="11" fill="#374151">${_t('guide.step3_example1', '☐ Write 100 words')}</text>
                <text x="60" y="105" font-size="11" fill="#374151">${_t('guide.step3_example2', '☐ Draw a pattern')}</text>
                <text x="60" y="125" font-size="11" fill="#374151">${_t('guide.step3_example3', '☐ Complete a small feature')}</text>
                
                <!-- 进度条 -->
                <rect x="60" y="140" width="80" height="8" rx="4" fill="#e5e7eb"/>
                <rect x="60" y="140" width="40" height="8" rx="4" fill="#5cb8a8"/>
                
                <!-- 打勾 -->
                <circle cx="160" cy="170" r="15" fill="#5cb8a8"/>
                <path d="M 153 170 L 158 175 L 167 165" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        
        step4: () => `
            <svg class="guide-comic-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- 计时器 -->
                <circle cx="100" cy="70" r="40" fill="none" stroke="#e5e7eb" stroke-width="6"/>
                <circle cx="100" cy="70" r="40" fill="none" stroke="#5cb8a8" stroke-width="6" 
                    stroke-dasharray="251.2" stroke-dashoffset="62.8" stroke-linecap="round"
                    transform="rotate(-90 100 70)">
                </circle>
                <text x="100" y="78" font-size="20" font-weight="bold" text-anchor="middle" fill="#2d5a5a">15:00</text>
                
                <!-- 环境音图标 -->
                <circle cx="60" cy="140" r="18" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
                <text x="60" y="146" font-size="16" text-anchor="middle">🎵</text>
                
                <circle cx="100" cy="140" r="18" fill="#f0fdfa" stroke="#5cb8a8" stroke-width="2"/>
                <text x="100" y="146" font-size="16" text-anchor="middle">🌧️</text>
                
                <circle cx="140" cy="140" r="18" fill="#f5f3ff" stroke="#a78bfa" stroke-width="2"/>
                <text x="140" y="146" font-size="16" text-anchor="middle">🔥</text>
                
                <!-- 专注波纹 -->
                <circle cx="100" cy="70" r="50" fill="none" stroke="#7eddd1" stroke-width="1" opacity="0.3">
                    <animate attributeName="r" from="50" to="70" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `,
        
        step5: () => `
            <svg class="guide-comic-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- 日记本 -->
                <rect x="50" y="30" width="100" height="140" rx="8" fill="var(--color-warm-50)" stroke="var(--color-warm-400)" stroke-width="2"/>
                
                <!-- 日记线条 -->
                <line x1="65" y1="60" x2="135" y2="60" stroke="var(--color-gray-300)" stroke-width="1"/>
                <line x1="65" y1="80" x2="135" y2="80" stroke="var(--color-gray-300)" stroke-width="1"/>
                <line x1="65" y1="100" x2="135" y2="100" stroke="var(--color-gray-300)" stroke-width="1"/>
                <line x1="65" y1="120" x2="135" y2="120" stroke="var(--color-gray-300)" stroke-width="1"/>
                
                <!-- 文字 -->
                <text x="70" y="75" font-size="10" fill="var(--theme-text-light)">${_t('guide.step5_diary1', 'Entered flow state today...')}</text>
                <text x="70" y="95" font-size="10" fill="var(--theme-text-light)">${_t('guide.step5_diary2', 'Time flew by...')}</text>
                <text x="70" y="115" font-size="10" fill="var(--theme-text-light)">${_t('guide.step5_diary3', 'Want to try next...')}</text>
                
                <!-- 星星评分 -->
                <text x="70" y="145" font-size="14" fill="var(--color-warm-500)">★ ★ ★ ★ ☆</text>
                
                <!-- 成长箭头 -->
                <path d="M 160 80 L 160 50 L 175 50" stroke="var(--color-primary-500)" stroke-width="3" fill="none" stroke-linecap="round"/>
                <polygon points="175,45 180,55 170,55" fill="var(--color-primary-500)"/>
                
                <!-- 装饰 -->
                <text x="30" y="170" font-size="16" opacity="0.5">📈</text>
                <text x="160" y="170" font-size="16" opacity="0.5">🌱</text>
            </svg>
        `
    },
    
    // 初始化引导
    init() {
        // 检查是否已经完成引导
        const guideCompleted = localStorage.getItem('flowGuideCompleted');
        if (guideCompleted === 'true') {
            return;
        }
        
        // 创建引导HTML
        this.createGuideHTML();
        
        // 显示引导
        setTimeout(() => {
            this.showGuide();
        }, 1000);
    },
    
    // 创建引导HTML结构
    createGuideHTML() {
        const guideHTML = `
            <div class="guide-overlay" id="guideOverlay">
                <div class="guide-card">
                    <div class="guide-illustration" id="guideIllustration">
                        <!-- SVG插画将在这里动态插入 -->
                    </div>
                    
                    <div class="guide-steps" id="guideSteps">
                        <!-- 步骤指示器将在这里动态生成 -->
                    </div>
                    
                    <div class="guide-content">
                        <div class="guide-step-title" id="guideStepTitle"></div>
                        <div class="guide-step-text" id="guideStepText"></div>
                    </div>
                    
                    <div class="guide-actions">
                        <button class="guide-btn guide-btn-skip" id="guideSkipBtn" onclick="GuideComic.skip()">
                            ${_t('guide.skip', 'Skip Guide')}
                        </button>
                        <button class="guide-btn guide-btn-prev guide-btn-hidden" id="guidePrevBtn" onclick="GuideComic.prevStep()">
                            ${_t('guide.prev', '← Previous')}
                        </button>
                        <button class="guide-btn guide-btn-next" id="guideNextBtn" onclick="GuideComic.nextStep()">
                            ${_t('guide.next', 'Next Step →')}
                        </button>
                    </div>
                    
                    <div class="guide-progress" id="guideProgress"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', guideHTML);
        
        // 生成步骤指示器
        this.generateStepDots();
        
        // 显示第一步
        this.showStep(0);
    },
    
    // 生成步骤指示器
    generateStepDots() {
        const stepsContainer = document.getElementById('guideSteps');
        let dotsHTML = '';
        
        for (let i = 0; i < this.totalSteps; i++) {
            dotsHTML += `<div class="guide-step-dot ${i === 0 ? 'active' : ''}" onclick="GuideComic.goToStep(${i})"></div>`;
        }
        
        stepsContainer.innerHTML = dotsHTML;
    },
    
    // 显示引导
    showGuide() {
        const overlay = document.getElementById('guideOverlay');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    },
    
    // 隐藏引导
    hideGuide() {
        const overlay = document.getElementById('guideOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // 记录已完成引导
        localStorage.setItem('flowGuideCompleted', 'true');
    },
    
    // 显示指定步骤
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) {
            return;
        }
        
        this.currentStep = stepIndex;
        const step = this.getSteps()[stepIndex];
        
        // 更新插画
        const illustration = document.getElementById('guideIllustration');
        illustration.innerHTML = this.comicSVGs[step.comic]();
        
        // 更新标题和文本
        document.getElementById('guideStepTitle').innerHTML = `
            <div class="guide-step-icon">${step.icon}</div>
            <span>${step.title}</span>
        `;
        document.getElementById('guideStepText').textContent = step.text;
        
        // 更新步骤指示器
        this.updateStepDots();
        
        // 更新按钮状态
        this.updateButtons();
        
        // 更新进度条
        this.updateProgress();
    },

    // 获取当前语言的步骤数据
    getSteps() {
        return window.I18N && window.I18N.currentLocale === 'en' && this.stepsEn ? this.stepsEn : this.steps;
    },

    // 更新步骤指示器
    updateStepDots() {
        const dots = document.querySelectorAll('.guide-step-dot');
        
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            
            if (index === this.currentStep) {
                dot.classList.add('active');
            } else if (index < this.currentStep) {
                dot.classList.add('completed');
            }
        });
    },
    
    // 更新按钮状态
    updateButtons() {
        const prevBtn = document.getElementById('guidePrevBtn');
        const nextBtn = document.getElementById('guideNextBtn');
        const skipBtn = document.getElementById('guideSkipBtn');
        
        // 上一步按钮
        if (this.currentStep === 0) {
            prevBtn.classList.add('guide-btn-hidden');
        } else {
            prevBtn.classList.remove('guide-btn-hidden');
        }
        
        // 下一步/开始体验按钮
        if (this.currentStep === this.totalSteps - 1) {
            nextBtn.textContent = _t('guide.start', 'Start Experience 🚀');
            nextBtn.className = 'guide-btn guide-btn-start';
            nextBtn.onclick = () => this.complete();
        } else {
            nextBtn.textContent = _t('guide.next', 'Next Step →');
            nextBtn.className = 'guide-btn guide-btn-next';
            nextBtn.onclick = () => this.nextStep();
        }
    },
    
    // 更新进度条
    updateProgress() {
        const progress = document.getElementById('guideProgress');
        const percentage = ((this.currentStep + 1) / this.totalSteps) * 100;
        progress.style.width = `${percentage}%`;
    },
    
    // 下一步
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.showStep(this.currentStep + 1);
        }
    },
    
    // 上一步
    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    },
    
    // 跳转到指定步骤
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.totalSteps) {
            this.showStep(stepIndex);
        }
    },
    
    // 跳过引导
    skip() {
        if (confirm(_t('guide.skip_confirm', 'Are you sure to skip the guide? You can revisit it later in settings.'))) {
            this.hideGuide();
        }
    },
    
    // 完成引导
    complete() {
        this.hideGuide();
        
        // 显示成功提示
        this.showCompletionMessage();
    },
    
    // 显示完成提示
    showCompletionMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-500));
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideDown 0.5s var(--ease-standard);
            font-weight: 600;
        `;
        message.textContent = _t('guide.complete', '🎉 Guide complete! Start your flow journey!');
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideUp 0.5s var(--ease-standard) forwards';
            setTimeout(() => message.remove(), 500);
        }, 3000);
        
        // 添加动画样式
        if (!document.getElementById('guideMessageStyles')) {
            const style = document.createElement('style');
            style.id = 'guideMessageStyles';
            style.textContent = `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // 重置引导（用于测试或重新查看）
    reset() {
        localStorage.removeItem('flowGuideCompleted');
        location.reload();
    }
};

// 页面加载完成后初始化引导
document.addEventListener('DOMContentLoaded', () => {
    // 延迟1秒显示引导，让用户先看到页面
    setTimeout(() => {
        GuideComic.init();
    }, 1000);
});
