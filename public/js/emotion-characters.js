/**
 * 情绪角色选择器（Emotion Character Picker）
 * 灵感参考《头脑特工队》的情绪拟人化设定 —— 把 8 种基础情绪设计成
 * 风格化、治愈系的"情绪小伙伴"角色卡片，取代原 Plutchik 情绪轮盘。
 *
 * 设计要点：
 * 1. 角色致敬（不复制角色形象）：乐乐/忧忧/怒怒/怕怕/厌厌 对应电影 5 主角气质；
 *    信信/惊惊/盼盼 为原创补充，保持 Plutchik 8 基础情绪 key 体系完整，
 *    从而与既有建议映射、情绪分析、二级情绪面板完全兼容。
 * 2. 交互：点击角色选中（最多 2 个）→ 卡片内选择「温和/强烈」→ 组合检测（复用原 8 组映射）
 * 3. 输出契约与原 EmotionWheel 一致：
 *    { emotions: [{key,name,intensity:'mild'|'strong',color}], combination: {...}|null }
 */
class EmotionCharacterPicker {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            size: options.size || 440,
            onEmotionSelect: options.onEmotionSelect || (() => {}),
            ...options
        };

        // 8 种基础情绪（名称经 i18n，默认中文）
        this.emotions = {
            joy:          { name: '喜悦', en: 'Joy',          emoji: '✨', color: '#F2C879', zh: '乐乐' },
            trust:        { name: '信任', en: 'Trust',        emoji: '🌸', color: '#A8BFA0', zh: '信信' },
            fear:         { name: '恐惧', en: 'Fear',         emoji: '⚡', color: '#B7A8C4', zh: '怕怕' },
            surprise:     { name: '惊讶', en: 'Surprise',     emoji: '🌟', color: '#D9A7C0', zh: '惊惊' },
            sadness:      { name: '悲伤', en: 'Sadness',      emoji: '💧', color: '#A5BBD6', zh: '忧忧' },
            disgust:      { name: '厌恶', en: 'Disgust',      emoji: '🍃', color: '#9DB8A5', zh: '厌厌' },
            anger:        { name: '愤怒', en: 'Anger',        emoji: '🔥', color: '#D9A09A', zh: '怒怒' },
            anticipation: { name: '期待', en: 'Anticipation', emoji: '❓', color: '#E8BE8F', zh: '盼盼' },
        };

        // 情绪组合映射（与原轮盘一致）
        this.combinations = {
            'joy+trust':             { name: '爱',     en: 'Love',         emoji: '❤️', color: '#D98B9E' },
            'trust+fear':            { name: '屈服',   en: 'Submission',   emoji: '🙇', color: '#B8B3A7' },
            'fear+surprise':         { name: '敬畏',   en: 'Awe',          emoji: '🙏', color: '#B59AC2' },
            'surprise+sadness':      { name: '不赞同', en: 'Disapproval',  emoji: '😒', color: '#D9A86B' },
            'sadness+disgust':       { name: '悔恨',   en: 'Remorse',      emoji: '😔', color: '#B39B8E' },
            'disgust+anger':         { name: '蔑视',   en: 'Contempt',     emoji: '😤', color: '#C98A84' },
            'anger+anticipation':    { name: '攻击性', en: 'Aggressiveness', emoji: '👊', color: '#D18C88' },
            'anticipation+joy':      { name: '乐观',   en: 'Optimism',     emoji: '😄', color: '#9DBE9B' },
        };

        this.order = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];

        this.selected = [];   // [{key, intensity:'mild'|'strong'}]
        this._build();
    }

    _t(key, def) {
        if (window.I18N && I18N.currentLocale === 'en') {
            const v = I18N.t(key);
            if (v && v !== key) return v;
        }
        return def;
    }

    /* 词典就绪后刷新全部翻译文本（语言切换时调用，保留选中状态） */
    refresh() {
        this.order.forEach(k => {
            const card = this.grid.querySelector(`[data-key="${k}"]`);
            if (!card) return;
            const nameEl = card.querySelector('.char-name');
            if (nameEl) nameEl.textContent = this._t('emotion.char_' + k, this.emotions[k].zh);
            card.querySelectorAll('.char-intensity button').forEach(b => {
                b.textContent = this._t('emotion.intensity_' + b.dataset.iv, b.dataset.iv === 'mild' ? '温和' : '强烈');
            });
        });
        const hint = this.container.querySelector('p');
        if (hint) hint.textContent = this._t('emotion.char_hint', '点击角色选择情绪，最多选 2 个 · 选择后可在卡片内切换「温和 / 强烈」');
    }

    _build() {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '1.25rem';

        // 角色网格
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
        grid.style.gap = '1rem';
        grid.style.maxWidth = '560px';
        grid.style.margin = '0 auto';
        grid.style.width = '100%';
        this.grid = grid;

        this.order.forEach(key => {
            grid.appendChild(this._makeCard(key));
        });
        this.container.appendChild(grid);

        // 提示行
        const hint = document.createElement('p');
        hint.textContent = this._t('emotion.char_hint', '点击角色选择情绪，最多选 2 个 · 选择后可在卡片内切换「温和 / 强烈」');
        hint.style.cssText = 'text-align:center;font-size:0.8rem;color:var(--theme-text-light);margin:0;';
        this.container.appendChild(hint);
    }

    _makeCard(key) {
        const em = this.emotions[key];
        const card = document.createElement('div');
        card.dataset.key = key;
        card.style.cssText = `
            display:flex;flex-direction:column;align-items:center;gap:0.5rem;
            padding:1rem 0.75rem 0.9rem;border-radius:18px;cursor:pointer;
            border:2px solid var(--theme-border);background:var(--theme-card);
            transition:all 0.25s var(--ease-standard, ease);
        `;
        card.innerHTML = `
            <div class="char-face" style="width:76px;height:76px;position:relative;">
                ${this._makeFace(key)}
                <span style="position:absolute;right:-4px;bottom:0;font-size:1.15rem;line-height:1;">${em.emoji}</span>
            </div>
            <span class="char-name" style="font-size:0.92rem;font-weight:600;color:var(--theme-text);">
                ${this._t('emotion.char_' + key, em.zh)}
            </span>
            <div class="char-intensity" style="display:flex;gap:0.3rem;">
                <button type="button" data-iv="mild" style="${this._pillCss('mild', key)}">${this._t('emotion.intensity_mild', '温和')}</button>
                <button type="button" data-iv="strong" style="${this._pillCss('strong', key)}">${this._t('emotion.intensity_strong', '强烈')}</button>
            </div>
        `;
        // 点卡片主体：toggle 选中（默认温和）
        const faceZone = card.querySelector('.char-face');
        faceZone.addEventListener('click', e => {
            e.stopPropagation();
            this._toggleSelect(key);
        });
        card.querySelectorAll('.char-intensity button').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._setIntensity(key, btn.dataset.iv);
            });
        });
        return card;
    }

    _pillCss(iv, key) {
        const isSel = this.selected.some(s => s.key === key && s.intensity === iv);
        const color = this.emotions[key].color;
        return `
            border:1.5px solid ${isSel ? color : 'var(--theme-border)'};
            background:${isSel ? color + '22' : 'transparent'};
            color:${isSel ? color : 'var(--theme-text-light)'};
            border-radius:999px;padding:0.2rem 0.6rem;font-size:0.72rem;cursor:pointer;
            transition:all 0.2s;
        `;
    }

    _toggleSelect(key) {
        const idx = this.selected.findIndex(s => s.key === key);
        if (idx >= 0) {
            this.selected.splice(idx, 1);
        } else {
            if (this.selected.length >= 2) this.selected.shift();
            this.selected.push({ key, intensity: 'mild' });
        }
        this._emit();
    }

    _setIntensity(key, iv) {
        const item = this.selected.find(s => s.key === key);
        if (!item) {
            if (this.selected.length >= 2) this.selected.shift();
            this.selected.push({ key, intensity: iv });
        } else {
            item.intensity = iv;
        }
        this._emit();
    }

    /* 与原 EmotionWheel 对齐的公开 API */
    getSelection() {
        const emotions = this.selected.map(s => ({
            key: s.key,
            ...this.emotions[s.key],
            name: this._emotionName(s.key),
            intensity: s.intensity,
        }));
        const combo = this.selected.length === 2
            ? this._getCombo(this.selected[0].key, this.selected[1].key) : null;
        if (combo) combo.name = this._comboName(combo);
        return { emotions, combination: combo };
    }

    /* 情绪名按语言：英文用 .en（Joy），中文用 .name（喜悦） */
    _emotionName(key) {
        const em = this.emotions[key];
        return (window.I18N && I18N.currentLocale === 'en') ? em.en : em.name;
    }

    /* 组合名按语言：英文用 combo.en（Love），中文用 combo.name（爱） */
    _comboName(combo) {
        return (window.I18N && I18N.currentLocale === 'en') ? (combo.en || combo.name) : combo.name;
    }

    reset() {
        this.selected = [];
        this._emit();
    }

    _emit() {
        // 更新卡片视觉
        this.order.forEach(k => {
            const card = this.grid.querySelector(`[data-key="${k}"]`);
            if (!card) return;
            const sel = this.selected.find(s => s.key === k);
            card.style.borderColor = sel ? this.emotions[k].color : 'var(--theme-border)';
            card.style.background = sel ? this.emotions[k].color + '14' : 'var(--theme-card)';
            card.style.transform = sel ? 'translateY(-3px)' : '';
            card.querySelectorAll('.char-intensity button').forEach(b => {
                b.style.cssText = this._pillCss(b.dataset.iv, k);
            });
        });

        const emotions = this.selected.map(s => ({
            key: s.key,
            name: this._emotionName(s.key),
            ...this.emotions[s.key],
            name: this._emotionName(s.key),
            intensity: s.intensity,
        }));
        const combo = this.selected.length === 2
            ? this._getCombo(this.selected[0].key, this.selected[1].key) : null;
        if (combo) combo.name = this._comboName(combo);
        this.options.onEmotionSelect({ emotions, combination: combo });
    }

    _getCombo(k1, k2) {
        const i1 = this.order.indexOf(k1), i2 = this.order.indexOf(k2);
        if (Math.abs(i1 - i2) !== 1 && !(i1 === 0 && i2 === 7) && !(i1 === 7 && i2 === 0)) return null;
        // 按 order 顺序规范化 key（修复原轮盘 sort 导致部分组合失效的 bug）
        const comboKey = i1 < i2 ? k1 + '+' + k2 : k2 + '+' + k1;
        const combo = this.combinations[comboKey];
        if (combo) return Object.assign({}, combo, { key: comboKey });
        return null;
    }

    /* 角色头像 SVG：治愈手绘风（圆头 + 表情 + 装饰） */
    _makeFace(key) {
        const c = this.emotions[key].color;
        const stroke = '#5B4636';
        const svg = (inner) => `
            <svg viewBox="0 0 96 96" width="76" height="76" style="display:block;filter:drop-shadow(0 4px 8px rgba(140,120,100,.18));">
                <circle cx="48" cy="46" r="34" fill="${c}" opacity="0.92"/>
                <circle cx="48" cy="46" r="34" fill="none" stroke="${stroke}" stroke-width="2.5" opacity="0.25"/>
                ${inner}
            </svg>`;
        switch (key) {
            case 'joy': return svg(`
                <path d="M34 50a14 7 0 0 0 28 0" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M38 30q-2 4 0 8M58 30q2 4 0 8" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <circle cx="40" cy="42" r="2.6" fill="${stroke}"/><circle cx="56" cy="42" r="2.6" fill="${stroke}"/>
                <path d="M22 26l4-3 4 3-4 3zM72 60l4-3 4 3-4 3z" fill="#F7E9C9"/>`);
            case 'sadness': return svg(`
                <path d="M36 56a14 7 0 0 1 24 0" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
                <circle cx="40" cy="42" r="2.6" fill="${stroke}"/><circle cx="56" cy="42" r="2.6" fill="${stroke}"/>
                <path d="M34 36q-2 3 0 6M62 36q2 3 0 6" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
                <path d="M26 30q-3 5-2 9 4-1 3-6zM70 62q3 5 2 9-4-1-3-6z" fill="#C9DDF2"/>`);
            case 'anger': return svg(`
                <path d="M33 52l30-6" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M32 60l32-2" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round"/>
                <circle cx="40" cy="41" r="2.6" fill="${stroke}"/><circle cx="56" cy="41" r="2.6" fill="${stroke}"/>
                <path d="M32 34q-2 3 0 6M64 34q2 3 0 6" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M62 24l5-7 5 7zM78 34l7-4 1 8z" fill="#F2C3B8"/>`);
            case 'fear': return svg(`
                <circle cx="40" cy="42" r="4.2" fill="#fff"/><circle cx="40" cy="42" r="2" fill="${stroke}"/>
                <circle cx="56" cy="42" r="4.2" fill="#fff"/><circle cx="56" cy="42" r="2" fill="${stroke}"/>
                <path d="M42 54q6 5 12 0" stroke="${stroke}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
                <path d="M30 60q6 6 12 0" stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>
                <path d="M20 22l5-4 5 4-5 4zM74 64l5-4 5 4-5 4z" fill="#D8C9E8"/>`);
            case 'disgust': return svg(`
                <path d="M36 56q12 6 24 0" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>
                <circle cx="40" cy="42" r="2.6" fill="${stroke}"/><circle cx="56" cy="42" r="2.6" fill="${stroke}"/>
                <path d="M40 34q2 3 0 6M56 34q-2 3 0 6" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M30 24l6 3-6 3zM70 60l6 3-6 3z" fill="#C7DDC8"/>`);
            case 'trust': return svg(`
                <path d="M36 50a14 6 0 0 0 24 0" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <circle cx="40" cy="42" r="2.6" fill="${stroke}"/><circle cx="56" cy="42" r="2.6" fill="${stroke}"/>
                <path d="M24 30l5-3 5 3-5 3zM68 54l5-3 5 3-5 3z" fill="#D3E4D2"/>`);
            case 'surprise': return svg(`
                <circle cx="40" cy="40" r="4.6" fill="#fff"/><circle cx="40" cy="40" r="2.2" fill="${stroke}"/>
                <circle cx="56" cy="40" r="4.6" fill="#fff"/><circle cx="56" cy="40" r="2.2" fill="${stroke}"/>
                <ellipse cx="48" cy="56" rx="6" ry="7" fill="#fff" stroke="${stroke}" stroke-width="2"/>
                <path d="M26 24l4-3 4 3-4 3zM70 66l4-3 4 3-4 3z" fill="#F3DCE8"/>`);
            case 'anticipation': return svg(`
                <path d="M36 52a14 6 0 0 0 24 0" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.9"/>
                <circle cx="40" cy="42" r="2.6" fill="${stroke}"/><circle cx="56" cy="42" r="2.6" fill="${stroke}"/>
                <path d="M36 35q-2 3 0 6M60 35q2 3 0 6" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M70 26l5-4 5 4-5 4zM22 58l5-4 5 4-5 4z" fill="#F3E3C0"/>`);
            default: return svg(`<circle cx="48" cy="48" r="4" fill="${stroke}"/>`);
        }
    }
}

/* 挂载到全局（沿用原 EmotionWheel 的访问方式） */
window.EmotionCharacterPicker = EmotionCharacterPicker;
