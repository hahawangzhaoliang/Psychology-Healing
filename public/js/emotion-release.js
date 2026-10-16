/* ===== 情绪释放组件（原情绪垃圾桶迁移改造版） =====
 * 用途：情绪觉察流程结束后，引导用户把情绪"轻轻放下"
 * 依赖：无（独立 IIFE）；如存在 I18N 则自动使用英文文案
 * API：
 *   EmotionRelease.init()                      初始化（注入样式+DOM）
 *   EmotionRelease.open() / close()            打开/关闭面板
 *   EmotionRelease.setEmotions(list)           注入觉察流程已选情绪 [{key,name,emoji,color}]
 */
(function () {
    'use strict';

    var STYLE_ID = 'emotion-release-styles';
    var zh = {
        title: '把这些情绪轻轻放下',
        desc: '点击选择让你困扰的情绪，然后轻轻放手',
        click_release: '点这里，轻轻放下',
        drag_hint: '或拖拽情绪球到这里',
        empty: '还没有要放下的情绪',
        success_text: '你把它放下了',
        success_sub: '情绪会来来去去，你已经做得很棒',
        select_first: '先选择一种情绪吧',
        emotions: [
            { key: 'anxious',    emoji: '😰', label: '焦虑',     colors: ['#FFB6C1', '#FF69B4'] },
            { key: 'sad',        emoji: '😢', label: '难过',     colors: ['#87CEEB', '#4682B4'] },
            { key: 'angry',      emoji: '😡', label: '愤怒',     colors: ['#FFA07A', '#FF6347'] },
            { key: 'tired',      emoji: '😴', label: '疲惫',     colors: ['#DDA0DD', '#9370DB'] },
            { key: 'frustrated', emoji: '😤', label: '挫败',     colors: ['#FF7F50', '#FF4500'] },
            { key: 'lonely',     emoji: '🙁', label: '孤独',     colors: ['#B0C4DE', '#6A5ACD'] },
            { key: 'fearful',    emoji: '😨', label: '恐惧',     colors: ['#FFD700', '#FFA500'] },
            { key: 'overwhelmed',emoji: '😵', label: '不堪重负', colors: ['#98FB98', '#2E8B57'] }
        ],
        enc: {
            anxious:    { emoji: '🕊️', text: '深呼吸，焦虑会过去的', subtext: '试着关注当下，一次只做一件事' },
            sad:        { emoji: '🌈', text: '允许自己难过，明天会更好', subtext: '每一种情绪都有它存在的意义' },
            angry:      { emoji: '🧘', text: '愤怒是正常的，让我们冷静一下', subtext: '喝口水，数到十，给自己一点空间' },
            tired:      { emoji: '😊', text: '休息一下，照顾好自己', subtext: '你已经做得很好了，值得好好休息' },
            frustrated: { emoji: '💪', text: '挫败是成长的一部分', subtext: '每次尝试都让你离成功更近一步' },
            lonely:     { emoji: '🤗', text: '你并不孤单', subtext: '世界上总有人在默默关心着你' },
            fearful:    { emoji: '🦁', text: '勇敢不是不害怕，而是带着恐惧前行', subtext: '你已经比昨天的自己更勇敢了' },
            overwhelmed:{ emoji: '🌊', text: '不堪重负时，学会说"不"', subtext: '优先级排序，一次只处理一件事' }
        }
    };
    var en = {
        title: 'Gently Let These Feelings Go',
        desc: 'Choose what is weighing on you, then release it softly',
        click_release: 'Tap here to let it go',
        drag_hint: 'or drag a feeling here',
        empty: 'Nothing to release yet',
        success_text: 'You let it go',
        success_sub: 'Feelings come and go — you are doing wonderfully',
        select_first: 'Choose a feeling first',
        emotions: [
            { key: 'anxious',    emoji: '😰', label: 'Anxious',     colors: ['#FFB6C1', '#FF69B4'] },
            { key: 'sad',        emoji: '😢', label: 'Sad',         colors: ['#87CEEB', '#4682B4'] },
            { key: 'angry',      emoji: '😡', label: 'Angry',       colors: ['#FFA07A', '#FF6347'] },
            { key: 'tired',      emoji: '😴', label: 'Tired',       colors: ['#DDA0DD', '#9370DB'] },
            { key: 'frustrated', emoji: '😤', label: 'Frustrated',  colors: ['#FF7F50', '#FF4500'] },
            { key: 'lonely',     emoji: '🙁', label: 'Lonely',      colors: ['#B0C4DE', '#6A5ACD'] },
            { key: 'fearful',    emoji: '😨', label: 'Fearful',     colors: ['#FFD700', '#FFA500'] },
            { key: 'overwhelmed',emoji: '😵', label: 'Overwhelmed', colors: ['#98FB98', '#2E8B57'] }
        ],
        enc: {
            anxious:    { emoji: '🕊️', text: 'Breathe slowly — the anxiety will pass', subtext: 'Stay with the present, one thing at a time' },
            sad:        { emoji: '🌈', text: 'It is okay to feel sad', subtext: 'Every feeling has its own meaning' },
            angry:      { emoji: '🧘', text: 'Anger is normal, let us calm down', subtext: 'Sip some water, count to ten, give yourself space' },
            tired:      { emoji: '😊', text: 'Rest well and take care of yourself', subtext: 'You have done enough — you deserve a rest' },
            frustrated: { emoji: '💪', text: 'Frustration is part of growing', subtext: 'Every try brings you one step closer' },
            lonely:     { emoji: '🤗', text: 'You are not alone', subtext: 'Somewhere, someone is quietly caring about you' },
            fearful:    { emoji: '🦁', text: 'Bravery is moving forward with fear', subtext: 'You are braver than yesterday' },
            overwhelmed:{ emoji: '🌊', text: 'When overwhelmed, learn to say no', subtext: 'Prioritize — handle one thing at a time' }
        }
    };

    function isEn() { return window.I18N && I18N.currentLocale === 'en'; }
    function lang() { return isEn() ? en : zh; }

    var emotions = null;   // null -> 使用默认列表；否则使用觉察流程注入的列表
    var panelOpen = false;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.emotion-rel-trigger {
    position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary-400, #8fb8a8), var(--color-primary-500, #6aa894));
    box-shadow: 0 4px 16px rgba(106, 168, 148, 0.35);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; cursor: pointer; z-index: 100; border: none;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.emotion-rel-trigger:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(106, 168, 148, 0.5); }
.emotion-rel-trigger.active { transform: rotate(15deg) scale(1.05); }
.emotion-rel-panel {
    position: fixed; bottom: 80px; right: 24px; width: 380px;
    max-width: calc(100vw - 48px); max-height: calc(100vh - 120px); overflow-y: auto;
    background: var(--theme-card, #ffffff);
    border-radius: var(--radius-xl, 16px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    z-index: 101; padding: 2rem;
    opacity: 0; transform: translateY(20px) scale(0.95);
    pointer-events: none; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid var(--theme-border, #e5e7eb);
}
.emotion-rel-panel.active { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
.emotion-rel-panel h3 {
    font-size: 1.1rem; font-weight: 600; color: var(--theme-text, #1f2937);
    margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;
}
.emotion-rel-panel .rel-desc { font-size: 0.85rem; color: var(--theme-text-light, #9ca3af); margin-bottom: 1rem; }
.emotion-rel-panel .close-btn {
    position: absolute; top: 16px; right: 16px; width: 32px; height: 32px;
    border-radius: 50%; border: none; background: var(--theme-bg, #f9fafb);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: var(--theme-text-light, #9ca3af); transition: all 0.2s ease;
}
.emotion-rel-panel .close-btn:hover { background: var(--color-primary-50, #f0fdf4); color: var(--color-primary-500, #6aa894); }
.emotion-rel-grid {
    display: grid !important; grid-template-columns: repeat(4, 1fr) !important;
    gap: 1.5rem 0.75rem; margin-bottom: 1.5rem; padding-bottom: 0.25rem;
}
.emotion-rel-ball { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.emotion-rel-ball .ball { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.emotion-rel-ball:hover .ball { transform: scale(1.15) translateY(-4px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); }
.emotion-rel-ball.selected .ball { transform: scale(0.9); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); opacity: 0.6; }
.emotion-rel-ball .label { font-size: 11px; color: var(--theme-text-light, #9ca3af); white-space: nowrap; line-height: 1; }
.rel-dropzone {
    text-align: center; padding: 1.5rem;
    border: 2px dashed var(--theme-border, #e5e7eb);
    border-radius: var(--radius-lg, 12px); transition: all 0.3s ease; cursor: pointer;
    background: var(--theme-bg, #f9fafb);
}
.rel-dropzone:hover, .rel-dropzone.drag-over {
    border-color: var(--color-primary-400, #8fb8a8); background: var(--color-primary-50, #f0fdf4); transform: scale(1.02);
}
.rel-dropzone.processing { animation: relShake 0.5s ease-in-out; }
@keyframes relShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.rel-dropzone .drop-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; transition: transform 0.3s ease; }
.rel-dropzone:hover .drop-icon { transform: scale(1.1); }
.rel-dropzone .drop-text { font-size: 0.85rem; color: var(--theme-text-light, #9ca3af); }
.rel-dropzone .drop-text strong { color: var(--color-primary-500, #6aa894); }
.rel-success {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0);
    background: var(--theme-card, #ffffff); border-radius: var(--radius-xl, 16px);
    padding: 2rem 3rem; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    z-index: 1000; text-align: center; opacity: 0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rel-success.active { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.rel-success .ok-emoji { font-size: 3rem; display: block; margin-bottom: 0.75rem; animation: relBounce 0.6s ease-in-out; }
@keyframes relBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.rel-success .ok-text { font-size: 1.1rem; font-weight: 600; color: var(--theme-text, #1f2937); margin-bottom: 0.5rem; }
.rel-success .ok-sub { font-size: 0.85rem; color: var(--theme-text-light, #9ca3af); line-height: 1.6; }
.rel-particle { position: fixed; pointer-events: none; z-index: 999; animation: relFly 1s ease-out forwards; }
@keyframes relFly {
    0% { opacity: 1; transform: translate(0, 0) scale(1); }
    100% { opacity: 0; transform: translate(var(--tx, 50px), var(--ty, -100px)) scale(0); }
}
`;
        document.head.appendChild(style);
    }

    function buildDom() {
        var L = lang();
        var container = document.createElement('div');
        container.id = 'emotion-release';
        container.innerHTML = `
            <button class="emotion-rel-trigger" id="emotion-rel-trigger" aria-label="release feelings">🍃</button>
            <div class="emotion-rel-panel" id="emotion-rel-panel">
                <button class="close-btn" id="close-rel-panel">✕</button>
                <h3>🍃 ${L.title}</h3>
                <p class="rel-desc">${L.desc}</p>
                <div class="emotion-rel-grid" id="emotion-rel-grid"></div>
                <div class="rel-dropzone" id="rel-dropzone">
                    <span class="drop-icon">🕊️</span>
                    <p class="drop-text"><strong>${L.click_release}</strong> · ${L.drag_hint}</p>
                </div>
            </div>
            <div class="rel-success" id="rel-success">
                <span class="ok-emoji" id="rel-ok-emoji">✨</span>
                <p class="ok-text" id="rel-ok-text"></p>
                <p class="ok-sub" id="rel-ok-sub"></p>
            </div>`;
        document.body.appendChild(container);
    }

    function renderBalls() {
        var grid = document.getElementById('emotion-rel-grid');
        if (!grid) return;
        var list = emotions || lang().emotions;
        grid.innerHTML = list.map(function (e, i) {
            return '<div class="emotion-rel-ball" data-emotion="' + e.key + '" data-idx="' + i + '" draggable="true">' +
                '<div class="ball" style="background:linear-gradient(135deg,' + e.colors[0] + ',' + e.colors[1] + ');"><span>' + e.emoji + '</span></div>' +
                '<div class="label">' + (e.label || e.name || '') + '</div></div>';
        }).join('');
        grid.querySelectorAll('.emotion-rel-ball').forEach(function (w) {
            w.addEventListener('click', function () {
                grid.querySelectorAll('.emotion-rel-ball').forEach(function (b) { b.classList.remove('selected'); });
                w.classList.add('selected');
                var label = w.querySelector('.label').textContent;
                var dz = document.getElementById('rel-dropzone');
                if (dz) dz.querySelector('.drop-text').innerHTML = '<strong>' + lang().click_release + '</strong> ' + label;
            });
            w.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('emotion', w.dataset.emotion);
                w.style.opacity = '0.5';
            });
            w.addEventListener('dragend', function () { w.style.opacity = '1'; });
        });
    }

    function setup() {
        var trigger = document.getElementById('emotion-rel-trigger');
        var panel = document.getElementById('emotion-rel-panel');
        var closeBtn = document.getElementById('close-rel-panel');
        var dropzone = document.getElementById('rel-dropzone');
        if (!trigger || !panel) return;

        trigger.addEventListener('click', function () {
            if (panel.classList.contains('active')) { closePanel(); } else { openPanel(); }
        });
        closeBtn.addEventListener('click', closePanel);
        document.addEventListener('click', function (e) {
            if (panel.classList.contains('active') && !panel.contains(e.target) && !trigger.contains(e.target)) closePanel();
        });
        if (dropzone) {
            dropzone.addEventListener('click', function () {
                var sel = panel.querySelector('.emotion-rel-ball.selected');
                if (sel) { release(sel.dataset.emotion, sel); }
                else { toast(lang().select_first, 'warning'); }
            });
            dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over'); });
            dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over'); });
            dropzone.addEventListener('drop', function (e) {
                e.preventDefault(); dropzone.classList.remove('drag-over');
                var key = e.dataTransfer.getData('emotion');
                if (key) {
                    var w = panel.querySelector('.emotion-rel-ball[data-emotion="' + key + '"]');
                    if (w) release(key, w);
                }
            });
        }
    }

    function openPanel() {
        var panel = document.getElementById('emotion-rel-panel');
        var trigger = document.getElementById('emotion-rel-trigger');
        if (!panel) return;
        renderBalls();
        panel.classList.add('active');
        trigger.classList.add('active');
        panelOpen = true;
    }

    function closePanel() {
        var panel = document.getElementById('emotion-rel-panel');
        var trigger = document.getElementById('emotion-rel-trigger');
        if (panel) panel.classList.remove('active');
        if (trigger) trigger.classList.remove('active');
        panelOpen = false;
    }

    function release(key, ballEl) {
        var dz = document.getElementById('rel-dropzone');
        var modal = document.getElementById('rel-success');
        if (!dz || !modal) return;
        dz.classList.add('processing');
        setTimeout(function () { dz.classList.remove('processing'); }, 500);

        if (ballEl) {
            var ball = ballEl.querySelector('.ball');
            if (ball) {
                ball.style.transform = 'scale(0)';
                ball.style.opacity = '0';
                setTimeout(function () {
                    ball.style.transform = 'scale(1)';
                    ball.style.opacity = '0.6';
                    ballEl.classList.remove('selected');
                }, 1200);
            }
        }
        particles(dz);
        setTimeout(function () {
            var enc = (lang().enc)[key] || { emoji: '✨', text: lang().success_text, subtext: lang().success_sub };
            var e1 = document.getElementById('rel-ok-emoji');
            var e2 = document.getElementById('rel-ok-text');
            var e3 = document.getElementById('rel-ok-sub');
            if (e1) e1.textContent = enc.emoji;
            if (e2) e2.textContent = enc.text;
            if (e3) e3.textContent = enc.subtext;
            modal.classList.add('active');
            setTimeout(function () { modal.classList.remove('active'); }, 2200);
        }, 600);
    }

    function particles(target) {
        var rect = target.getBoundingClientRect();
        var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        var emojis = ['✨', '💫', '🌟', '💖', '🕊️', '🌈'];
        for (var i = 0; i < 12; i++) {
            var p = document.createElement('div');
            p.className = 'rel-particle';
            p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            var ang = (Math.PI * 2 * i) / 12;
            var dist = 50 + Math.random() * 100;
            p.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;font-size:' + (16 + Math.random() * 12) + 'px;--tx:' + (Math.cos(ang) * dist) + 'px;--ty:' + (Math.sin(ang) * dist) + 'px;';
            document.body.appendChild(p);
            setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1000);
        }
    }

    function toast(msg, type) {
        var color = type === 'warning' ? '#F59E0B' : '#6aa894';
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);background:' + color + ';color:white;padding:0.75rem 1.5rem;border-radius:9999px;font-size:0.95rem;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,0.15);opacity:0;transition:all 0.3s;pointer-events:none;white-space:nowrap;';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
        setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, 2500);
    }

    window.EmotionRelease = {
        init: function () {
            if (document.getElementById('emotion-release')) return;
            injectStyle();
            buildDom();
            setup();
        },
        open: function () { this.init(); openPanel(); },
        close: closePanel,
        setEmotions: function (list) {
            emotions = list && list.length ? list : null;
            if (panelOpen) renderBalls();
        },
        isOpen: function () { return panelOpen; }
    };
})();
