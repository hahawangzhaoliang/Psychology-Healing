/**
 * 虚拟动物陪伴组件
 * 在页面右下角显示用户选择的虚拟动物，提供温暖的陪伴感
 */

(function() {
    'use strict';
    
    // 动物数据
    const companions = {
        'otter': { name: '海洋水獭', filename: '海洋水獭.png', animation: 'float', emoji: '🦦' },
        'penguin': { name: '极光企鹅', filename: '极光企鹅.png', animation: 'bounce', emoji: '🐧' },
        'fox': { name: '森林灵狐', filename: '森林灵狐.png', animation: 'sway', emoji: '🦊' },
        'turtle': { name: '时光龟龟', filename: '时光龟龟.png', animation: 'breathe', emoji: '🐢' },
        'rabbit': { name: '甜心兔兔', filename: '甜心兔兔.png', animation: 'bounce', emoji: '🐰' },
        'sheep': { name: '云朵绵羊', filename: '云朵绵羊.png', animation: 'float', emoji: '🐑' }
    };
    
    let companionWidget = null;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    // 创建陪伴组件
    function createCompanionWidget() {
        // 检查是否已选择动物
        const savedId = localStorage.getItem('xinqing_companion');
        if (!savedId || !companions[savedId]) return;
        
        const companion = companions[savedId];
        
        // 检查是否已存在
        if (document.getElementById('companionWidget')) return;
        
        // 创建组件容器
        companionWidget = document.createElement('div');
        companionWidget.id = 'companionWidget';
        companionWidget.innerHTML = `
            <div class="companion-avatar ${'companion-' + companion.animation}" id="companionAvatar">
                <img src="images/companions/${companion.filename}" 
                     alt="${companion.name}"
                     onerror="this.parentElement.innerHTML='<span class=\\'text-4xl\\'>${companion.emoji}</span>'">
            </div>
            <div class="companion-speech" id="companionSpeech">
                <p class="companion-name">${companion.name}</p>
                <p class="companion-message">陪你一起 🌟</p>
            </div>
        `;
        
        // 添加样式
        addStyles();
        
        // 添加到页面
        document.body.appendChild(companionWidget);
        
        // 初始化拖拽
        initDrag();
        
        // 添加点击交互
        initClickInteraction();
        
        // 添加随机问候
        scheduleRandomGreeting();
    }
    
    // 添加CSS样式
    function addStyles() {
        if (document.getElementById('companionWidgetStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'companionWidgetStyles';
        style.textContent = `
            #companionWidget {
                position: fixed;
                bottom: 100px;
                right: 20px;
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
                box-shadow: 0 4px 20px rgba(92, 184, 168, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border: 3px solid rgba(92, 184, 168, 0.3);
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
                max-width: 160px;
                position: relative;
                opacity: 0;
                transform: translateX(10px);
                transition: all 0.3s ease;
            }
            
            .companion-speech::before {
                content: '';
                position: absolute;
                right: -8px;
                top: 50%;
                transform: translateY(-50%);
                border: 8px solid transparent;
                border-left-color: white;
            }
            
            #companionWidget:hover .companion-speech,
            .companion-speech.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .companion-name {
                font-weight: 600;
                color: #5cb8a8;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .companion-message {
                font-size: 13px;
                color: #666;
                white-space: nowrap;
            }
            
            /* 动画类 */
            .companion-float {
                animation: companionFloatAnim 3s ease-in-out infinite;
            }
            .companion-bounce {
                animation: companionBounceAnim 1s ease-in-out infinite;
            }
            .companion-sway {
                animation: companionSwayAnim 2s ease-in-out infinite;
            }
            .companion-sway img {
                animation: companionSwayImg 2s ease-in-out infinite;
            }
            .companion-breathe {
                animation: companionBreatheAnim 4s ease-in-out infinite;
            }
            
            @keyframes companionFloatAnim {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-8px) rotate(3deg); }
            }
            @keyframes companionBounceAnim {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-6px) scale(1.05); }
            }
            @keyframes companionSwayAnim {
                0%, 100% { transform: translateX(0) rotate(-3deg); }
                50% { transform: translateX(5px) rotate(3deg); }
            }
            @keyframes companionBreatheAnim {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
            }
            
            /* 点击特效 */
            .companion-click-effect {
                position: absolute;
                pointer-events: none;
                animation: clickPop 0.6s ease-out forwards;
            }
            
            @keyframes clickPop {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
            
            /* 问候气泡 */
            .companion-greeting {
                position: absolute;
                bottom: 80px;
                right: 0;
                background: white;
                border-radius: 12px;
                padding: 8px 12px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                font-size: 12px;
                color: #666;
                white-space: nowrap;
                animation: greetingPop 0.3s ease-out, greetingFade 0.3s ease-out 2.7s forwards;
            }
            
            @keyframes greetingPop {
                0% { transform: scale(0) translateY(10px); opacity: 0; }
                100% { transform: scale(1) translateY(0); opacity: 1; }
            }
            
            @keyframes greetingFade {
                to { opacity: 0; transform: translateY(-5px); }
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                #companionWidget {
                    bottom: 90px;
                    right: 16px;
                }
                .companion-avatar {
                    width: 56px;
                    height: 56px;
                }
                .companion-avatar img {
                    width: 48px;
                    height: 48px;
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
        const companion = companions[savedId];
        
        const messages = [
            '今天也要好好爱自己 💕',
            '你已经很棒了！',
            '休息一下吧 🌸',
            '加油，你可以的！',
            '记得喝水哦 💧',
            '深呼吸，放轻松',
            '我在这里陪着你',
            '今天感觉怎么样？',
            '要开心哦 ✨'
        ];
        
        avatar.addEventListener('click', () => {
            // 添加点击特效
            const effect = document.createElement('div');
            effect.className = 'companion-click-effect';
            effect.innerHTML = ['💕', '✨', '🌟', '💗'][Math.floor(Math.random() * 4)];
            effect.style.left = '50%';
            effect.style.top = '50%';
            avatar.appendChild(effect);
            setTimeout(() => effect.remove(), 600);
            
            // 更新问候语
            const speech = document.getElementById('companionSpeech');
            if (speech) {
                const msgEl = speech.querySelector('.companion-message');
                msgEl.textContent = messages[Math.floor(Math.random() * messages.length)];
                speech.classList.add('show');
                setTimeout(() => speech.classList.remove('show'), 3000);
            }
        });
    }
    
    // 随机问候
    function scheduleRandomGreeting() {
        const showGreeting = () => {
            const savedId = localStorage.getItem('xinqing_companion');
            if (!savedId || isDragging) return;
            
            const greetings = [
                '陪你一起 💕',
                '加油！🌟',
                '有我在 🌸',
                '别忘了休息 💧'
            ];
            
            const greeting = document.createElement('div');
            greeting.className = 'companion-greeting';
            greeting.textContent = greetings[Math.floor(Math.random() * greetings.length)];
            companionWidget.appendChild(greeting);
            
            setTimeout(() => greeting.remove(), 3000);
        };
        
        // 每隔30-60秒显示一次问候
        setInterval(() => {
            if (Math.random() > 0.5) {
                showGreeting();
            }
        }, 30000);
        
        // 5分钟后首次问候
        setTimeout(showGreeting, 300000);
    }
    
    // 初始化
    function init() {
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
