/**
 * 5分钟充电站 · 微疗愈仪式模块（方案 B）
 * 场景化引导式微练习：晨起光呼吸 / 午休正念补水 / 黄昏情绪卸货 / 睡前身体扫描
 * 完成 → 能量 +1 → 写入用户体系（xinqing:{uid}:chargingRecords / chargingToday）
 * 依赖：window.UserStore、window._t、window.showToast（页面提供）
 */
;(function () {
    'use strict';

    /* ========== 四个场景的仪式编排（每套 5 步，全程约 5 分钟） ========== */
    const RITUALS = {
        morning: {
            emoji: '🌅',
            nameKey: 'charging_station.ritual_morning_name', zhName: '晨起 · 光呼吸',
            introKey: 'charging_station.ritual_morning_intro', zhIntro: '用 4-7-8 呼吸，接住清晨的第一道光',
            steps: [
                { icon: '🌱', titleKey: 'charging_station.ritual_morning_s1_title', zhTitle: '准备好', textKey: 'charging_station.ritual_morning_s1_text', zhText: '坐直，把手机放在一边，双手轻轻放在膝盖上', secs: 20 },
                { icon: '☀️', titleKey: 'charging_station.ritual_morning_s2_title', zhTitle: '吸气 4 秒', textKey: 'charging_station.ritual_morning_s2_text', zhText: '想象吸入清晨的光，让光抵达腹部', secs: 80 },
                { icon: '🌤️', titleKey: 'charging_station.ritual_morning_s3_title', zhTitle: '屏息 7 秒', textKey: 'charging_station.ritual_morning_s3_text', zhText: '让光在身体里静静散开，不急着做什么', secs: 80 },
                { icon: '🍃', titleKey: 'charging_station.ritual_morning_s4_title', zhTitle: '呼气 8 秒', textKey: 'charging_station.ritual_morning_s4_text', zhText: '把困意与杂念轻轻呼出', secs: 100 },
                { icon: '💫', titleKey: 'charging_station.ritual_morning_s5_title', zhTitle: '对自己说', textKey: 'charging_station.ritual_morning_s5_text', zhText: '睁开眼，在心里对今天说一句：「我可以」', secs: 15 },
            ],
        },
        noon: {
            emoji: '☀️',
            nameKey: 'charging_station.ritual_noon_name', zhName: '午休 · 正念补水',
            introKey: 'charging_station.ritual_noon_intro', zhIntro: '用一杯水的温度，把注意力带回身体',
            steps: [
                { icon: '🥛', titleKey: 'charging_station.ritual_noon_s1_title', zhTitle: '端一杯温水', textKey: 'charging_station.ritual_noon_s1_text', zhText: '双手握住杯子，感受它的温度从掌心传来', secs: 30 },
                { icon: '🌬️', titleKey: 'charging_station.ritual_noon_s2_title', zhTitle: '呼吸觉察', textKey: 'charging_station.ritual_noon_s2_text', zhText: '闭上眼睛，把注意力放在一呼一吸上，念头来了就轻轻放走', secs: 120 },
                { icon: '🫂', titleKey: 'charging_station.ritual_noon_s3_title', zhTitle: '身体扫描', textKey: 'charging_station.ritual_noon_s3_text', zhText: '从肩膀到指尖，慢慢觉察哪里紧绷，让那里松下来', secs: 70 },
                { icon: '💧', titleKey: 'charging_station.ritual_noon_s4_title', zhTitle: '喝一口水', textKey: 'charging_station.ritual_noon_s4_text', zhText: '喝下第一口，感受水经过喉咙、抵达胃里的温度', secs: 30 },
                { icon: '🌿', titleKey: 'charging_station.ritual_noon_s5_title', zhTitle: '重新出发', textKey: 'charging_station.ritual_noon_s5_text', zhText: '放下杯子，活动双肩，带着清醒回到当下', secs: 25 },
            ],
        },
        evening: {
            emoji: '🌆',
            nameKey: 'charging_station.ritual_evening_name', zhName: '黄昏 · 情绪卸货',
            introKey: 'charging_station.ritual_evening_intro', zhIntro: '把今天的消耗写下来，再轻轻放下',
            steps: [
                { icon: '✍️', titleKey: 'charging_station.ritual_evening_s1_title', zhTitle: '写下消耗', textKey: 'charging_station.ritual_evening_s1_text', zhText: '写下今天 3 件让你消耗的事，不用评价对错', secs: 100 },
                { icon: '🕯️', titleKey: 'charging_station.ritual_evening_s2_title', zhTitle: '到此为止', textKey: 'charging_station.ritual_evening_s2_text', zhText: '对每件事轻轻说一句：「今天到此为止」', secs: 60 },
                { icon: '👁️', titleKey: 'charging_station.ritual_evening_s3_title', zhTitle: '识别感受', textKey: 'charging_station.ritual_evening_s3_text', zhText: 'RAIN 第一步：此刻最明显的感受是什么？给它一个名字', secs: 45 },
                { icon: '💗', titleKey: 'charging_station.ritual_evening_s4_title', zhTitle: '允许存在', textKey: 'charging_station.ritual_evening_s4_text', zhText: '让它在心里待一会儿，不推开，也不评判', secs: 45 },
                { icon: '📮', titleKey: 'charging_station.ritual_evening_s5_title', zhTitle: '放进口袋', textKey: 'charging_station.ritual_evening_s5_text', zhText: '把纸折好放进口袋：明天再处理，现在休息', secs: 25 },
            ],
        },
        sleep: {
            emoji: '🌙',
            nameKey: 'charging_station.ritual_sleep_name', zhName: '睡前 · 身体扫描',
            introKey: 'charging_station.ritual_sleep_intro', zhIntro: '从头到脚放下今天，带着感恩入睡',
            steps: [
                { icon: '🛏️', titleKey: 'charging_station.ritual_sleep_s1_title', zhTitle: '躺好', textKey: 'charging_station.ritual_sleep_s1_text', zhText: '躺下，盖好被子，手掌朝上，让身体松下来', secs: 30 },
                { icon: '🦶', titleKey: 'charging_station.ritual_sleep_s2_title', zhTitle: '身体扫描', textKey: 'charging_station.ritual_sleep_s2_text', zhText: '从脚趾慢慢向上，觉察每一处，哪里最放松就多停一会儿', secs: 150 },
                { icon: '🌟', titleKey: 'charging_station.ritual_sleep_s3_title', zhTitle: '感恩小事', textKey: 'charging_station.ritual_sleep_s3_text', zhText: '想一件今天值得感恩的小事，无论多小', secs: 45 },
                { icon: '🙏', titleKey: 'charging_station.ritual_sleep_s4_title', zhTitle: '说声谢谢', textKey: 'charging_station.ritual_sleep_s4_text', zhText: '在心里对它说一声：「谢谢」', secs: 20 },
                { icon: '😌', titleKey: 'charging_station.ritual_sleep_s5_title', zhTitle: '沉进床垫', textKey: 'charging_station.ritual_sleep_s5_text', zhText: '让身体沉进床垫，把今天放下，晚安', secs: 30 },
            ],
        },
    };

    let currentScenario = 'morning';
    let guideTimer = null;
    let guideStepIndex = 0;
    let guideRemain = 0;
    let guideStepsDone = 0;
    let guideRunning = false;

    /* ========== 工具 ========== */
    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function getTodayRecord() {
        try {
            const t = UserStore.get('chargingToday');
            if (!t) return null;
            if (typeof t === 'string') {
                try { return JSON.parse(t); } catch (e) { return null; }
            }
            if (t.date === todayStr()) return t;
        } catch (e) { /* ignore */ }
        return null;
    }

    function getChargingRecords() {
        try { return JSON.parse(UserStore.get('chargingRecords') || '[]'); } catch (e) { return []; }
    }

    function saveChargingRecords(records) {
        try { UserStore.set('chargingRecords', JSON.stringify(records)); } catch (e) { /* ignore */ }
    }

    function ritualTotalSec(ritual) {
        return ritual.steps.reduce((sum, s) => sum + (s.secs || 0), 0);
    }

    function fmtSecs(secs) {
        const m = Math.floor(secs / 60), s = secs % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    function stepTitle(key, zh) {
        return (typeof _t === 'function') ? _t(key, zh) : (zh || '');
    }

    /* ========== 渲染：仪式预览 ========== */
    function renderRitualPreview() {
        const ritual = RITUALS[currentScenario];
        const preview = document.getElementById('ritual-preview');
        const guide = document.getElementById('ritual-guide');
        const complete = document.getElementById('ritual-complete');
        const startBtn = document.getElementById('startRitualBtn');
        if (!preview) return;

        stopGuide();

        const today = getTodayRecord();
        const stepsHtml = ritual.steps.map((s, i) => `
            <div style="display:flex;gap:0.65rem;align-items:flex-start;margin-bottom:0.45rem;">
                <span style="flex:none;width:1.6rem;height:1.6rem;border-radius:50%;background:rgba(181,143,179,0.12);display:flex;align-items:center;justify-content:center;font-size:0.85rem;">${s.icon}</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:0.85rem;font-weight:600;color:var(--theme-text);">${stepTitle(s.titleKey, s.zhTitle)}</div>
                    <div style="font-size:0.78rem;color:var(--theme-text-light);line-height:1.55;">${stepTitle(s.textKey, s.zhText)}</div>
                </div>
                <span style="flex:none;font-size:0.72rem;color:var(--theme-text-light);padding-top:0.1rem;">${fmtSecs(s.secs)}</span>
            </div>`).join('');

        if (guide) guide.style.display = 'none';
        if (complete) complete.style.display = 'none';

        if (today) {
            // 今日已完成
            preview.style.display = 'block';
            preview.innerHTML = `
                <div style="text-align:center;padding:1rem 0.25rem;">
                    <div style="font-size:2.5rem;margin-bottom:0.5rem;">✨</div>
                    <div style="font-size:1.05rem;font-weight:700;color:var(--theme-text);margin-bottom:0.4rem;">${stepTitle('charging_station.ritual_completed_title', '今日充电完成 ✨')}</div>
                    <div style="font-size:0.85rem;color:var(--theme-text-light);line-height:1.7;">${stepTitle('charging_station.ritual_completed_desc', '你刚刚给了自己 5 分钟。能量 +1，状态已记录。')}</div>
                    <div style="margin-top:1rem;font-size:0.8rem;color:#B58FB3;font-weight:600;">${stepTitle('charging_station.ritual_already', '今日已完成 ✓ 明天再来')}</div>
                </div>`;
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.style.opacity = '0.55';
                startBtn.style.cursor = 'not-allowed';
                startBtn.textContent = stepTitle('charging_station.ritual_already', '今日已完成 ✓ 明天再来');
            }
            return;
        }

        // 未完成：仪式介绍 + 步骤列表
        preview.style.display = 'block';
        preview.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:0.9rem;margin-bottom:1rem;">
                <div style="font-size:2.2rem;line-height:1;">${ritual.emoji}</div>
                <div>
                    <div style="font-size:1.05rem;font-weight:700;color:var(--theme-text);">${stepTitle(ritual.nameKey, ritual.zhName)}</div>
                    <div style="font-size:0.85rem;color:var(--theme-text-light);line-height:1.7;margin-top:0.2rem;">${stepTitle(ritual.introKey, ritual.zhIntro)}</div>
                </div>
            </div>
            <div style="font-size:0.78rem;font-weight:600;color:#B58FB3;margin-bottom:0.6rem;">${stepTitle('charging_station.ritual_steps_label', '练习步骤')} · ${stepTitle('charging_station.ritual_total', '全程约')} ${Math.round(ritualTotalSec(ritual) / 60)} ${stepTitle('charging_station.ritual_minutes', '分钟')}</div>
            ${stepsHtml}`;
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.opacity = '';
            startBtn.style.cursor = '';
            startBtn.textContent = stepTitle('charging_station.ritual_start', '开始 5 分钟充电 ⚡');
        }
    }

    /* ========== 引导流程 ========== */
    function startRitual() {
        const today = getTodayRecord();
        if (today) return;
        const preview = document.getElementById('ritual-preview');
        const guide = document.getElementById('ritual-guide');
        if (!preview || !guide) return;

        preview.style.display = 'none';
        guide.style.display = 'block';
        guideStepIndex = 0;
        guideStepsDone = 0;
        guideRunning = true;
        renderGuideStep();
    }

    function renderGuideStep() {
        const ritual = RITUALS[currentScenario];
        const guide = document.getElementById('ritual-guide');
        const steps = ritual.steps;
        if (!guide) return;

        if (guideStepIndex >= steps.length) {
            completeRitual();
            return;
        }

        const s = steps[guideStepIndex];
        const progress = Math.round((guideStepIndex / steps.length) * 100);
        guide.innerHTML = `
            <div style="margin-bottom:0.9rem;">
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.35rem;">
                    <span style="font-size:0.78rem;font-weight:600;color:#B58FB3;">${stepTitle('charging_station.ritual_step_of', '步骤')} ${guideStepIndex + 1} / ${steps.length}</span>
                    <span style="font-size:0.78rem;color:var(--theme-text-light);" id="ritual-countdown"></span>
                </div>
                <div style="height:5px;background:var(--theme-border);border-radius:3px;overflow:hidden;">
                    <div id="ritual-progress-fill" style="height:100%;width:${progress}%;background:linear-gradient(90deg,#B58FB3,#D9A7C0);border-radius:3px;transition:width 0.4s ease;"></div>
                </div>
            </div>
            <div style="text-align:center;padding:1.1rem 0.5rem 0.9rem;">
                <div style="font-size:3rem;margin-bottom:0.6rem;">${s.icon}</div>
                <div style="font-size:1.1rem;font-weight:700;color:var(--theme-text);margin-bottom:0.5rem;">${stepTitle(s.titleKey, s.zhTitle)}</div>
                <div style="font-size:0.9rem;color:var(--theme-text-light);line-height:1.8;max-width:26rem;margin:0 auto;">${stepTitle(s.textKey, s.zhText)}</div>
            </div>
            <div style="display:flex;justify-content:center;gap:0.8rem;margin-top:0.5rem;">
                <button type="button" onclick="chargingRitual.skipStep()" style="background:transparent;border:1.5px solid var(--theme-border);color:var(--theme-text-light);border-radius:999px;padding:0.55rem 1.4rem;font-size:0.85rem;cursor:pointer;transition:all 0.2s;">${stepTitle('charging_station.ritual_skip', '跳过')}</button>
                <button type="button" onclick="chargingRitual.nextStep()" style="background:linear-gradient(135deg,#B58FB3,#D9A7C0);border:none;color:#fff;border-radius:999px;padding:0.55rem 1.6rem;font-size:0.85rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(181,143,179,0.3);transition:all 0.2s;">${stepTitle('charging_station.ritual_next', '下一步')}</button>
            </div>`;

        guideRemain = s.secs;
        updateCountdown();
        clearInterval(guideTimer);
        guideTimer = setInterval(() => {
            guideRemain -= 1;
            updateCountdown();
            if (guideRemain <= 0) {
                clearInterval(guideTimer);
                guideTimer = null;
                nextStep();
            }
        }, 1000);
    }

    function updateCountdown() {
        const el = document.getElementById('ritual-countdown');
        if (el) el.textContent = fmtSecs(Math.max(0, guideRemain));
    }

    function nextStep() {
        if (!guideRunning) return;
        guideStepsDone += 1;
        guideStepIndex += 1;
        clearInterval(guideTimer);
        guideTimer = null;
        renderGuideStep();
    }

    function skipStep() {
        nextStep();
    }

    function stopGuide() {
        guideRunning = false;
        clearInterval(guideTimer);
        guideTimer = null;
    }

    /* ========== 完成仪式：能量 +1 + 记录 ========== */
    function completeRitual() {
        if (!guideRunning) return;
        stopGuide();

        const ritual = RITUALS[currentScenario];
        const preview = document.getElementById('ritual-preview');
        const guide = document.getElementById('ritual-guide');
        const complete = document.getElementById('ritual-complete');

        // 写入用户体系
        const record = {
            date: todayStr(),
            scenario: currentScenario,
            durationSec: ritualTotalSec(ritual),
            stepsDone: guideStepsDone,
            completedAt: new Date().toISOString(),
        };
        const records = getChargingRecords();
        records.push(record);
        saveChargingRecords(records);
        try { UserStore.set('chargingToday', JSON.stringify({ date: todayStr(), scenario: currentScenario, completedAt: record.completedAt })); } catch (e) { /* ignore */ }
        try { if (window.Analytics) window.Analytics.track('ritual_completed', { scenario: currentScenario }); } catch (e) { /* ignore */ }

        // 完成面板
        if (guide) guide.style.display = 'none';
        if (complete) {
            complete.style.display = 'block';
            complete.innerHTML = `
                <div style="text-align:center;padding:1.2rem 0.5rem;">
                    <div style="font-size:2.8rem;margin-bottom:0.4rem;animation:ritualPop 0.6s cubic-bezier(0.34,1.56,0.64,1);">⚡</div>
                    <div style="font-size:1.15rem;font-weight:700;color:var(--theme-text);margin-bottom:0.4rem;">${stepTitle('charging_station.ritual_completed_title', '今日充电完成 ✨')}</div>
                    <div style="font-size:0.88rem;color:var(--theme-text-light);line-height:1.75;">${stepTitle('charging_station.ritual_completed_desc', '你刚刚给了自己 5 分钟。能量 +1，状态已记录。')}</div>
                    <div style="margin-top:1rem;display:inline-flex;align-items:center;gap:0.4rem;background:rgba(181,143,179,0.12);color:#8A6B9B;border-radius:999px;padding:0.45rem 1.1rem;font-size:0.85rem;font-weight:600;">${stepTitle('charging_station.ritual_energy', '能量')} +1 ⚡</div>
                </div>`;
        }

        // 快捷按钮 → 已完成态
        const startBtn = document.getElementById('startRitualBtn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.55';
            startBtn.style.cursor = 'not-allowed';
            startBtn.textContent = stepTitle('charging_station.ritual_already', '今日已完成 ✓ 明天再来');
        }

        // 动画 keyframes（一次性注入）
        if (!document.getElementById('ritualPopKeyframes')) {
            const st = document.createElement('style');
            st.id = 'ritualPopKeyframes';
            st.textContent = '@keyframes ritualPop{0%{transform:scale(0.4);opacity:0}60%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}';
            document.head.appendChild(st);
        }

        if (typeof showToast === 'function') {
            showToast(stepTitle('charging_station.toast_complete', '充电完成，能量 +1 ⚡'), 'success');
        }
    }

    /* ========== 场景切换 ========== */
    function selectScenario(scenario) {
        if (!RITUALS[scenario]) return;
        currentScenario = scenario;
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scenario === scenario);
        });
        renderRitualPreview();
    }

    /* ========== 初始化 ========== */
    function init() {
        // 按当前时间默认推荐场景（5-11 晨起 / 11-15 午休 / 15-20 黄昏 / 其余 睡前）
        const h = new Date().getHours();
        let suggested = 'sleep';
        if (h >= 5 && h < 11) suggested = 'morning';
        else if (h >= 11 && h < 15) suggested = 'noon';
        else if (h >= 15 && h < 20) suggested = 'evening';
        currentScenario = suggested;
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scenario === suggested);
        });
        renderRitualPreview();
    }

    /* 对外暴露（内联 onclick 使用） */
    window.chargingRitual = {
        init: init,
        selectScenario: selectScenario,
        startRitual: startRitual,
        nextStep: nextStep,
        skipStep: skipStep,
        renderRitualPreview: renderRitualPreview,
    };

    /* 自动初始化（若 DOM 已就绪） */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* 词典异步加载竞态兜底：i18n 就绪后重渲染预览（英文模式首次渲染可能回退中文） */
    document.addEventListener('i18n:ready', () => {
        if (document.getElementById('ritual-preview')) renderRitualPreview();
    });
})();
