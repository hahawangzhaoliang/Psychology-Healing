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
            joy:       { name: '喜悦', emoji: '😊', color: '#FFD700' },
            trust:      { name: '信任', emoji: '🤝', color: '#7CB342' },
            fear:       { name: '恐惧', emoji: '😨', color: '#5C6BC0' },
            surprise:   { name: '惊讶', emoji: '😲', color: '#AB47BC' },
            sadness:    { name: '悲伤', emoji: '😢', color: '#42A5F5' },
            disgust:    { name: '厌恶', emoji: '🤢', color: '#66BB6A' },
            anger:      { name: '愤怒', emoji: '😠', color: '#EF5350' },
            anticipation:{ name: '期待', emoji: '🤔', color: '#FFA726' },
        };

        // 情绪组合映射
        this.combinations = {
            'joy+trust':             { name: '爱',     emoji: '❤️' },
            'trust+fear':            { name: '屈服', emoji: '🙇' },
            'fear+surprise':        { name: '敬畏', emoji: '🙏' },
            'surprise+sadness':    { name: '不赞同', emoji: '😒' },
            'sadness+disgust':    { name: '悔恨', emoji: '😔' },
            'disgust+anger':       { name: '蔑视', emoji: '😤' },
            'anger+anticipation':  { name: '攻击性', emoji: '👊' },
            'anticipation+joy':    { name: '乐观', emoji: '😄' },
        };

        this.order = ['joy','trust','fear','surprise','sadness','disgust','anger','anticipation'];

        // 状态
        this.selected = [];      // 最多2个选中的情绪key
        this.hovered = null;     // 当前hover的 {key, ring}  ring: 0=外(温和) 1=内(强烈)
        this.animPhase = {};     // 点击动画用

        this._createCanvas();
        this._createTooltip();
        this._bindEvents();
        this.draw();
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
            background: 'rgba(0,0,0,0.8)', color: '#fff',
            fontSize: '13px', fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
            pointerEvents: 'none', opacity: '0',
            transition: 'opacity 0.2s', zIndex: '99999',
            whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
        const minR = maxR * 0.32;       // 中心死区（缩小，增大可点击区）

        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minR || dist > maxR) return null;

        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;

        const sector = Math.floor((angle + Math.PI/8) / (Math.PI/4)) % 8;
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
            const label = hit.ring === 0 ? '温和' : '强烈';
            this.tip.textContent = `${em.emoji} ${em.name} · ${label}`;
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

        // 触发短暂动画
        this.animPhase[hit.key + '|' + hit.ring] = 1;
        setTimeout(() => {
            delete this.animPhase[hit.key + '|' + hit.ring];
            this.draw();
        }, 200);

        this.draw();

        const emotions = this.selected.map(s => ({
            key: s.key,
            ...this.emotions[s.key],
            intensity: s.ring === 0 ? '温和' : '强烈',
        }));

        const combo = this.selected.length === 2
            ? this._getCombo(this.selected[0].key, this.selected[1].key) : null;

        this.options.onEmotionSelect({ emotions, combination: combo });
    }

    _getCombo(k1, k2) {
        const i1 = this.order.indexOf(k1), i2 = this.order.indexOf(k2);
        if (Math.abs(i1-i2) !== 1 && !(i1===0&&i2===7) && !(i1===7&&i2===0)) return null;
        const key = [k1,k2].sort().join('+');
        return this.combinations[key] || null;
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
        glow.addColorStop(0, 'rgba(90,154,138,0.04)');
        glow.addColorStop(1, 'rgba(90,154,138,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.options.size, this.options.size);

        // 绘制8个扇区 × 2层
        this.order.forEach((key, i) => {
            const em = this.emotions[key];
            const startA = (i - 0.5) * Math.PI/4 - Math.PI/8;
            const endA   = startA + Math.PI/4;

            [0, 1].forEach(ring => {
                const outerR = ring === 0 ? maxR : midR;
                const innerR = ring === 0 ? midR  : minR;

                // 基础颜色
                const baseAlpha = ring === 0 ? 0.45 : 0.72;
                let fill = this._hexToRgba(em.color, baseAlpha);

                // Hover 高亮
                if (this.hovered && this.hovered.key === key && this.hovered.ring === ring) {
                    fill = this._hexToRgba(em.color, Math.min(1, baseAlpha + 0.28));
                }

                // 选中状态
                const isSelected = this.selected.some(s => s.key === key && s.ring === ring);
                if (isSelected) {
                    fill = this._hexToRgba(em.color, 0.85);
                }

                // 绘制扇区
                ctx.beginPath();
                ctx.arc(cx, cy, outerR, startA, endA);
                ctx.arc(cx, cy, innerR, endA, startA, true);
                ctx.closePath();
                ctx.fillStyle = fill;
                ctx.fill();

                // 选中：金色边框 + 光晕
                if (isSelected) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(255,215,0,0.25)';
                    ctx.lineWidth = 10;
                    ctx.stroke();
                }

                // Hover：白色边框
                if (this.hovered && this.hovered.key === key && this.hovered.ring === ring) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // 扇区内绘 emoji（只有内层才绘，避免拥挤）
                if (ring === 1) {
                    const r = (outerR + innerR) / 2;
                    const a = startA + Math.PI / 8;
                    const ex = cx + r * Math.cos(a);
                    const ey = cy + r * Math.sin(a);
                    ctx.font = '20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(em.emoji, ex, ey);
                }
            });

            // 扇区外侧标签（情绪名称）
            const labelR = maxR + 22;
            const labelA = (i - 0.5) * Math.PI/4;   // 扇区中间角度
            const lx = cx + labelR * Math.cos(labelA);
            const ly = cy + labelR * Math.sin(labelA);

            ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 如果选中或 hover，改变颜色
            const isHovered = this.hovered && this.hovered.key === key;
            const isSelected = this.selected.some(s => s.key === key);
            if (isSelected) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 14px "PingFang SC","Microsoft YaHei",sans-serif';
            } else if (isHovered) {
                ctx.fillStyle = em.color;
            } else {
                ctx.fillStyle = '#555';
            }
            ctx.fillText(em.name, lx, ly);

            // 强度小标签（外层温和 / 内层强烈）
            const labelR2 = maxR + 22;
            const smallA = labelA;
            const sx = cx + (labelR2 + 14) * Math.cos(smallA);
            const sy = cy + (labelR2 + 14) * Math.sin(smallA);
            ctx.font = '10px "PingFang SC","Microsoft YaHei",sans-serif';
            ctx.fillStyle = '#aaa';
            ctx.fillText('温和→强烈', sx, sy);
        });

        // ===== 中心圆 =====
        const cR = minR - 4;
        ctx.beginPath();
        ctx.arc(cx, cy, cR, 0, Math.PI*2);
        const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cR);
        cGrad.addColorStop(0, '#ffffff');
        cGrad.addColorStop(1, '#f5f5f5');
        ctx.fillStyle = cGrad;
        ctx.fill();
        ctx.strokeStyle = this.selected.length > 0 ? '#FFD700' : '#e0e0e0';
        ctx.lineWidth = this.selected.length > 0 ? 2.5 : 1;
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
                ctx.fillStyle = '#333';
                ctx.fillText(combo.name, cx, cy + 14);
            }
        } else if (this.selected.length === 1) {
            const s = this.selected[0];
            const em = this.emotions[s.key];
            ctx.font = '30px sans-serif';
            ctx.fillText(em.emoji, cx, cy - 12);
            ctx.font = 'bold 14px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#333';
            ctx.fillText(em.name, cx, cy + 10);
            ctx.font = '11px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#888';
            ctx.fillText(s.ring === 0 ? '温和' : '强烈', cx, cy + 26);
        } else {
            ctx.font = '13px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#bbb';
            ctx.fillText('点击扇区选择', cx, cy - 6);
            ctx.font = '11px "PingFang SC","Microsoft YaHei"';
            ctx.fillStyle = '#ccc';
            ctx.fillText('可选2个相邻情绪', cx, cy + 10);
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
        this.draw();
    }

    getSelection() {
        const emotions = this.selected.map(s => ({
            key: s.key,
            ...this.emotions[s.key],
            intensity: s.ring === 0 ? '温和' : '强烈',
        }));
        const combo = this.selected.length === 2
            ? this._getCombo(this.selected[0].key, this.selected[1].key) : null;
        return { emotions, combination: combo };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmotionWheel;
}
