/**
 * Plutchik情绪轮盘组件（易用版）
 * 核心改进：增大热区、清晰反馈、emoji直观显示
 */
class EmotionWheel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            size: options.size || 400,
            onEmotionSelect: options.onEmotionSelect || (() => {}),
            ...options
        };

        // 8种基本情绪（只分2个强度层级：温和 / 强烈）
        this.emotions = {
            joy:       { name: '喜悦', emoji: '😊', color: '#F2C879' },
            trust:      { name: '信任', emoji: '🤝', color: '#A8BFA0' },
            fear:       { name: '恐惧', emoji: '😨', color: '#B7A8C4' },
            surprise:   { name: '惊讶', emoji: '😲', color: '#D9A7C0' },
            sadness:    { name: '悲伤', emoji: '😢', color: '#A5BBD6' },
            disgust:    { name: '厌恶', emoji: '🤢', color: '#9DB8A5' },
            anger:      { name: '愤怒', emoji: '😠', color: '#D9A09A' },
            anticipation:{ name: '期待', emoji: '🤔', color: '#E8BE8F' },
        };

        // 情绪组合映射
        this.combinations = {
            'joy+trust':             { name: '爱',     emoji: '❤️', color: '#D98B9E' },
            'trust+fear':            { name: '屈服', emoji: '🙇', color: '#B8B3A7' },
            'fear+surprise':        { name: '敬畏', emoji: '🙏', color: '#B59AC2' },
            'surprise+sadness':    { name: '不赞同', emoji: '😒', color: '#D9A86B' },
            'sadness+disgust':    { name: '悔恨', emoji: '😔', color: '#B39B8E' },
            'disgust+anger':       { name: '蔑视', emoji: '😤', color: '#C98A84' },
            'anger+anticipation':  { name: '攻击性', emoji: '👊', color: '#D18C88' },
            'anticipation+joy':    { name: '乐观', emoji: '😄', color: '#9DBE9B' },
        };

        this.order = ['joy','trust','fear','surprise','sadness','disgust','anger','anticipation'];

        // 状态
        this.selected = [];      // 最多2个选中的情绪key
        this.hovered = null;     // 当前hover的 {key, ring}  ring: 0=外(温和) 1=内(强烈)
        this.animPhase = {};     // 点击动画用
        // 治愈系动效：点击涟漪 + 选中呼吸（rAF 仅在有动效时运行）
        this.pulse = null;       // { key, ring, start } 点击涟漪
        this._rafActive = false;
        this._breathePhase = 0;

            this._createCanvas();
            this._createTooltip();
            this._bindEvents();
            this.draw();
        }

        /* i18n 翻译辅助 */
        _t(key, defaultText) {
            if (window.I18N && I18N.currentLocale === 'en') {
                return I18N.t(key) || defaultText;
            }
            return defaultText;
        }

    /* ========== 初始化 ========== */
    _createCanvas() {
        this.canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        this.dpr = dpr;
        this.canvas.width  = this.options.size * dpr;
        this.canvas.height = this.options.size * dpr;
        this.canvas.style.width  = this.options.size + 'px';
        this.canvas.style.height = this.options.size + 'px';
        this.canvas.style.borderRadius = '50%';
        this.canvas.style.cursor = 'pointer';
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
    }

    _createTooltip() {
        this.tip = document.createElement('div');
        Object.assign(this.tip.style, {
            position: 'fixed', padding: '6px 12px', borderRadius: '8px',
            background: 'rgba(255,253,247,0.96)', color: '#6B6559',
            fontSize: '13px', fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
            pointerEvents: 'none', opacity: '0',
            transition: 'opacity 0.2s', zIndex: '99999',
            whiteSpace: 'nowrap', borderRadius: '10px',
            border: '1px solid rgba(233,196,158,0.45)',
            boxShadow: '0 4px 16px rgba(180,140,100,0.18)',
        });
        document.body.appendChild(this.tip);
    }

    _bindEvents() {
        this.canvas.addEventListener('mousemove', e => this._onHover(e));
        this.canvas.addEventListener('mouseleave', () => this._onLeave());
        this.canvas.addEventListener('click', e => this._onClick(e));
        // 移动端：touch 直接触发点击，不显示 tooltip
        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.touches[0];
            this._onClick({ clientX: t.clientX, clientY: t.clientY });
        }, { passive: false });
    }

    /* ========== 核心：命中检测 ========== */
    _hitTest(x, y) {
        const cx = this.options.size / 2;
        const cy = this.options.size / 2;
        const maxR = cx - 36;           // 外圈留边距
        const minR = maxR * 0.32;       // 中心死区

        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minR || dist > maxR) return null;

        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;

        // 与 draw() 扇区严格对齐：
        //   draw(): startA = (i-1)*PI/4, endA = i*PI/4
        //   sector i 覆盖角度 [(i-1)*PI/4, i*PI/4)
        //   所以 idx = floor(angle / (PI/4)) + 1 (mod 8)
        const sector = (Math.floor(angle / (Math.PI / 4)) + 1) % 8;
        const key = this.order[sector];

        // 2层：外圈=温和(ring=0)  内圈=强烈(ring=1)
        const ring = dist > (minR + maxR) / 2 ? 0 : 1;

        return { key, ring };
    }
    /* ========== Hover ========== */
    _onHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hit = this._hitTest(x, y);

        if (hit) {
            this.canvas.style.cursor = 'pointer';
            this.hovered = hit;
            this.draw();

            const em = this.emotions[hit.key];
            const label = hit.ring === 0 ? this._t('emotion.intensity_mild', '温和') : this._t('emotion.intensity_strong', '强烈');
            this.tip.textContent = `${em.emoji} ${this._t('emotion.' + hit.key + '_name', em.name)} · ${label}`;
            this.tip.style.left = (e.clientX + 12) + 'px';
            this.tip.style.top  = (e.clientY - 30) + 'px';
            this.tip.style.opacity = '1';
        } else {
            this._onLeave();
        }
    }

    _onLeave() {
        this.hovered = null;
        this.tip.style.opacity = '0';
        this.draw();
    }

    /* ========== 点击 ========== */
    _onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || 0) - rect.left;
        const y = (e.clientY || 0) - rect.top;
        const hit = this._hitTest(x, y);

        if (!hit) {
            // 点击中心或空白区 → 清除选择
            if (this.selected.length > 0) {
                this.selected = [];
                this.pulse = null;
                this._stopRaf();
                this.draw();
                this.options.onEmotionSelect({ emotions: [], combination: null });
            }
            return;
        }

        const id = hit.key + '|' + hit.ring;
        const idx = this.selected.findIndex(s => (s.key + '|' + s.ring) === id);

        if (idx >= 0) {
            // 已选中 → 取消
            this.selected.splice(idx, 1);
        } else {
            if (this.selected.length < 2) {
                this.selected.push({ key: hit.key, ring: hit.ring });
            } else {
                this.selected.shift();
                this.selected.push({ key: hit.key, ring: hit.ring });
            }
        }

        // 触发涟漪动效 + 选中呼吸（rAF 驱动）
        this.pulse = { key: hit.key, ring: hit.ring, start: Date.now() };
        this._startRaf();

        this.draw();

        const emotions = this.selected.map(s => ({
            key: s.key,
            ...this.emotions[s.key],
            intensity: s.ring === 0 ? 'mild' : 'strong',
        }));

        const combo = this.selected.length === 2
            ? this._getCombo(this.selected[0].key, this.selected[1].key) : null;

        this.options.onEmotionSelect({ emotions, combination: combo });
    }

        _getCombo(k1, k2) {
            const i1 = this.order.indexOf(k1), i2 = this.order.indexOf(k2);
            if (Math.abs(i1-i2) !== 1 && !(i1===0&&i2===7) && !(i1===7&&i2===0)) return null;
            const comboKey = [k1,k2].sort().join('+');
            const combo = this.combinations[comboKey];
            if (combo) return Object.assign({}, combo, { key: comboKey });
            return null;
        }

    /* ========== 治愈系动效：rAF 循环 ========== */
    _startRaf() {
        if (this._rafActive) return;
        this._rafActive = true;
        const loop = () => {
            if (!this._rafActive) return;
            const needs = this.pulse || this.selected.length > 0;
            if (!needs) { this._rafActive = false; return; }
            this._breathePhase = (Date.now() % 5600) / 5600; // 0..1 慢呼吸
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    _stopRaf() {
        this._rafActive = false;
    }

    /* ========== 绘制 ========== */
    draw() {
        const cx = this.options.size / 2;
        const cy = this.options.size / 2;
        const maxR = cx - 36;
        const minR = maxR * 0.32;
        const midR = (minR + maxR) / 2;   // 分隔内外圈
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.options.size, this.options.size);

        // 外圈光晕
        const glow = ctx.createRadialGradient(cx, cy, minR, cx, cy, maxR + 10);
        glow.addColorStop(0, 'rgba(255,224,196,0.05)');
        glow.addColorStop(1, 'rgba(90,154,138,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.options.size, this.options.size);

        // 外环柔带（两圈，模拟器物环边）
        ctx.beginPath();
        ctx.arc(cx, cy, maxR + 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,244,224,0.45)';
        ctx.lineWidth = 9;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, maxR + 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,244,224,0.22)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 绘制8个扇区 × 2层
        this.order.forEach((key, i) => {
            const em = this.emotions[key];
            const startA = (i - 0.5) * Math.PI/4 - Math.PI/8;
            const endA   = startA + Math.PI/4;

            [0, 1].forEach(ring => {
                const outerR = ring === 0 ? maxR : midR;
                const innerR = ring === 0 ? midR  : minR;

                // 基础透明度（治愈系：整体更柔和）
                const baseAlpha = ring === 0 ? 0.36 : 0.56;
                const isSelected = this.selected.some(s => s.key === key && s.ring === ring);
                const isHovered = this.hovered && this.hovered.key === key && this.hovered.ring === ring;

                // hover 微膨胀（仅外圈，幅度克制）
                let drawOuterR = outerR;
                if (isHovered && ring === 0 && !isSelected) {
                    drawOuterR = Math.min(maxR + 6, outerR + 5);
                }

                // 扇区路径
                ctx.beginPath();
                ctx.arc(cx, cy, drawOuterR, startA, endA);
                ctx.arc(cx, cy, innerR, endA, startA, true);
                ctx.closePath();

                // 柔和径向渐变：外缘略深、内缘更透，模拟柔光照射
                let fill;
                if (isSelected) {
                    const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
                    g.addColorStop(0, this._hexToRgba(em.color, 0.78));
                    g.addColorStop(1, this._hexToRgba(em.color, 0.62));
                    fill = g;
                } else if (isHovered) {
                    const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
                    g.addColorStop(0, this._hexToRgba(em.color, baseAlpha + 0.22));
                    g.addColorStop(1, this._hexToRgba(em.color, baseAlpha + 0.12));
                    fill = g;
                } else {
                    const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
                    g.addColorStop(0, this._hexToRgba(em.color, baseAlpha));
                    g.addColorStop(1, this._hexToRgba(em.color, baseAlpha + 0.06));
                    fill = g;
                }
                ctx.fillStyle = fill;
                ctx.fill();

                // 扇区之间柔和白描边（像轻柔拼贴，替代硬线条）
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1.2;
                ctx.stroke();

                // 选中：暖白柔光 + 缓慢呼吸（替代刺眼金色）
                if (isSelected) {
                    const breathe = 0.62 + 0.26 * Math.sin(this._breathePhase * Math.PI * 2);
                    ctx.save();
                    ctx.shadowColor = 'rgba(255,214,170,' + (0.55 + 0.3 * Math.sin(this._breathePhase * Math.PI * 2)).toFixed(2) + ')';
                    ctx.shadowBlur = 14 + 6 * Math.sin(this._breathePhase * Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,242,222,' + breathe.toFixed(2) + ')';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                    ctx.restore();
                    // 柔光外扩层（呼吸）
                    ctx.strokeStyle = 'rgba(255,214,170,' + (0.13 + 0.1 * Math.sin(this._breathePhase * Math.PI * 2)).toFixed(2) + ')';
                    ctx.lineWidth = 9;
                    ctx.stroke();
                }

                // Hover：暖白细边
                if (isHovered && !isSelected) {
                    ctx.strokeStyle = 'rgba(255,250,240,0.85)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // 扇区内绘 emoji（只有内层才绘，避免拥挤）
                if (ring === 1) {
                    const r = (outerR + innerR) / 2;
                    const a = startA + Math.PI / 8;
                    const ex = cx + r * Math.cos(a);
                    const ey = cy + r * Math.sin(a);
                    ctx.font = '22px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(90,80,66,0.85)';
                    ctx.fillText(em.emoji, ex + 1, ey + 1);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(em.emoji, ex, ey);
                }
            });

            // 扇区外侧标签：奶油胶囊卡（替代裸文字）
            const labelText = this._t('emotion.' + key + '_name', em.name);
            const labelR = maxR + 15;
            const labelA = (i - 0.5) * Math.PI/4;   // 扇区中间角度
            const lx = cx + labelR * Math.cos(labelA);
            const ly = cy + labelR * Math.sin(labelA);

            ctx.font = 'bold 12px "PingFang SC","Microsoft YaHei",sans-serif';
            const tw = ctx.measureText(labelText).width;
            const padX = 5;
            const capW = tw + padX * 2;
            const capH = 20;
            let capX = lx - capW / 2;
            // 夹取到画布内，避免边缘截断
            if (capX < 8) capX = 8;
            if (capX + capW > this.options.size - 8) capX = this.options.size - 8 - capW;
            const capY = ly - capH / 2;

            // 胶囊底（圆角矩形）
            const capR = capH / 2;
            ctx.beginPath();
            ctx.moveTo(capX + capR, capY);
            ctx.arcTo(capX + capW, capY, capX + capW, capY + capH, capR);
            ctx.arcTo(capX + capW, capY + capH, capX, capY + capH, capR);
            ctx.arcTo(capX, capY + capH, capX, capY, capR);
            ctx.arcTo(capX, capY, capX + capW, capY, capR);
            ctx.closePath();
            const isHovered = this.hovered && this.hovered.key === key;
            const isSelected = this.selected.some(s => s.key === key);
            ctx.fillStyle = isSelected
                ? 'rgba(255,250,240,0.98)'
                : isHovered
                    ? 'rgba(255,253,247,0.95)'
                    : 'rgba(255,253,247,0.72)';
            ctx.fill();
            ctx.strokeStyle = isSelected ? 'rgba(233,196,158,0.8)' : 'rgba(233,196,158,0.35)';
            ctx.lineWidth = isSelected ? 1.5 : 1;
            ctx.stroke();

            // 文字（胶囊内居中）
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (isSelected) {
                ctx.fillStyle = '#B08A5A';
                ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif';
            } else if (isHovered) {
                ctx.fillStyle = em.color;
            } else {
                ctx.fillStyle = '#7A7366';
            }
            ctx.fillText(labelText, capX + capW / 2, ly + 1);
        });

        // 点击涟漪：从被点扇区中心向外扩散淡出
        if (this.pulse) {
            const elapsed = (Date.now() - this.pulse.start) / 700;
            if (elapsed >= 1) {
                this.pulse = null;
            } else {
                const pEm = this.emotions[this.pulse.key];
                const pIdx = this.order.indexOf(this.pulse.key);
                const pAngle = pIdx * Math.PI / 4 - Math.PI / 8;
                const pR = (maxR + midR) / 2;
                const px = cx + pR * Math.cos(pAngle);
                const py = cy + pR * Math.sin(pAngle);
                const waveR = 6 + (maxR - minR) * 0.75 * elapsed;
                ctx.beginPath();
                ctx.arc(px, py, waveR, 0, Math.PI * 2);
                ctx.strokeStyle = this._hexToRgba(pEm.color, 0.5 * (1 - elapsed));
                ctx.lineWidth = 2.5 + 2.5 * elapsed;
                ctx.stroke();
            }
        }

        // 强度图例（空间不足时省略，文案已由 HTML 层展示，避免大尺寸溢出画布）
        const legendY = cy + maxR + 40;
        if (legendY <= this.options.size - 6) {
            ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
            ctx.fillStyle = '#A89F92';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this._t('emotion.legend', '外圈=温和 · 内圈=强烈'), cx, legendY);
        }

        // ===== 中心圆 =====
        const cR = minR - 4;
        ctx.beginPath();
        ctx.arc(cx, cy, cR, 0, Math.PI*2);
        const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cR);
        cGrad.addColorStop(0, '#FFFEF9');
        cGrad.addColorStop(1, '#F5F0E7');
        ctx.fillStyle = cGrad;
        ctx.fill();
        ctx.strokeStyle = this.selected.length > 0 ? 'rgba(233,196,158,0.9)' : 'rgba(230,224,212,0.9)';
        ctx.lineWidth = this.selected.length > 0 ? 2 : 1;
        ctx.stroke();

        // 中心内容
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.selected.length === 2) {
            const combo = this._getCombo(this.selected[0].key, this.selected[1].key);
            if (combo) {
                ctx.font = '26px sans-serif';
                ctx.fillText(combo.emoji, cx, cy - 10);
                ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei"';
                ctx.fillStyle = '#6B6559';
                ctx.fillText(this._t('emotion.combo.' + combo.key + '_name', combo.name), cx, cy + 14);
            }
        } else if (this.selected.length === 1) {
            const s = this.selected[0];
            const em = this.emotions[s.key];
            ctx.font = '30px sans-serif';
            ctx.fillText(em.emoji, cx, cy - 12);
            ctx.font = 'bold 14px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#6B6559';
            ctx.fillText(this._t('emotion.' + s.key + '_name', em.name), cx, cy + 10);
            ctx.font = '11px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#A89F92';
            ctx.fillText(s.ring === 0 ? this._t('emotion.intensity_mild', '温和') : this._t('emotion.intensity_strong', '强烈'), cx, cy + 26);
        } else {
            ctx.font = '13px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#B3AA9C';
            ctx.fillText(this._t('emotion.click_to_select', '点击扇区选择'), cx, cy - 6);
            ctx.font = '11px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#C9C1B2';
            ctx.fillText(this._t('emotion.select_two_adjacent', '可选2个相邻情绪'), cx, cy + 10);
        }
    }

    /* ========== 工具 ========== */
    _hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
    }

    reset() {
        this.selected = [];
        this.hovered = null;
        this.pulse = null;
        this._stopRaf();
        this.draw();
    }

    getSelection() {
        const emotions = this.selected.map(s => ({
            key: s.key,
            ...this.emotions[s.key],
            intensity: s.ring === 0 ? 'mild' : 'strong',
        }));
        const combo = this.selected.length === 2
            ? this._getCombo(this.selected[0].key, this.selected[1].key) : null;
        return { emotions, combination: combo };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmotionWheel;
}
