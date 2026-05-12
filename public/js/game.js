/**
 * 喵趣消消乐 - 游戏核心逻辑（优化版）
 * 修复：combo 重置时机、目标进度读取顺序、下落动画范围、swap 冗余、双击交换
 * 新增：AudioManager（Web Audio API 合成音效 + BGM）、VibrationManager
 */

// ═══════════════════════════════════════════════════
//  音效管理模块 AudioManager
// ═══════════════════════════════════════════════════
const AudioManager = {
    ctx: null,
    masterGain: null,
    bgmGain: null,
    sfxGain: null,
    muted: false,
    bgmPlaying: false,
    bgmTimers: [],
    bgmLoopTimeout: null,

    // C大调五声音阶音符频率（Hz）
    notes: {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
        G4: 392.00, A4: 440.00, B4: 493.88,
        C5: 523.25, E5: 659.26, G5: 783.99,
    },

    /** 首次用户交互后初始化 AudioContext */
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.muted ? 0 : 1;
            this.masterGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.18;
            this.bgmGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.7;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('AudioContext 初始化失败', e);
        }
    },

    /** 切换静音 */
    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(
                this.muted ? 0 : 1, this.ctx.currentTime, 0.05
            );
        }
        return this.muted;
    },

    /** 创建 OscillatorNode 辅助 */
    _createOsc(type, freq, startTime, endTime, gainPeak, output) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);
        osc.connect(gain);
        gain.connect(output || this.sfxGain);
        osc.start(startTime);
        osc.stop(endTime + 0.05);
        return osc;
    },

    /** 播放音效 */
    playSFX(type, extra) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;

        switch (type) {
            case 'meow':
                this._playMeow(t);
                break;
            case 'bell':
                this._playBell(t);
                break;
            case 'yarn':
                this._playYarn(t);
                break;
            case 'match': {
                // 随机三种消除音效
                const sfxList = ['meow', 'bell', 'yarn'];
                this.playSFX(sfxList[Math.floor(Math.random() * sfxList.length)]);
                break;
            }
            case 'combo':
                this._playCombo(t, extra || 1);
                break;
            case 'swap':
                this._playSwap(t);
                break;
            case 'bomb':
                this._playBomb(t);
                break;
            case 'shuffle':
                this._playShuffle(t);
                break;
            case 'hint':
                this._playHint(t);
                break;
            case 'win':
                this._playWin(t);
                break;
            case 'lose':
                this._playLose(t);
                break;
            default:
                break;
        }
    },

    /** 🐱 软萌喵呜：正弦波 200→600Hz 上扬 */
    _playMeow(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(580, t + 0.2);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.35);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.04);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);
    },

    /** 🔔 铃铛：高频短促正弦波 + 泛音 */
    _playBell(t) {
        // 基音
        this._createOsc('sine', 880, t, t + 0.18, 0.5);
        // 泛音（稍低音量）
        this._createOsc('sine', 1320, t, t + 0.12, 0.2);
        // 高次泛音
        this._createOsc('sine', 2200, t, t + 0.08, 0.1);
    },

    /** 🧶 毛线球：低频柔和噪声 */
    _playYarn(t) {
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        filter.Q.value = 1.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.28);
    },

    /** 🎵 连击升调铃声 */
    _playCombo(t, combo) {
        const baseFreq = 523.25; // C5
        const step = Math.min(combo - 1, 5) * 100;
        this._createOsc('sine', baseFreq + step, t, t + 0.2, 0.6);
        this._createOsc('sine', (baseFreq + step) * 1.5, t + 0.05, t + 0.18, 0.3);
        if (combo >= 3) {
            this._createOsc('sine', (baseFreq + step) * 2, t + 0.1, t + 0.2, 0.2);
        }
    },

    /** 🔀 交换音：短促上滑音 */
    _playSwap(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.linearRampToValueAtTime(500, t + 0.1);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
    },

    /** 💥 炸弹音：低频爆炸感下降 */
    _playBomb(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);
        // 噪声层增加爆炸感
        this._playYarn(t);
    },

    /** 🔮 洗牌音：快速音阶序列 */
    _playShuffle(t) {
        const freqs = [261, 329, 392, 523, 392, 329];
        freqs.forEach((freq, i) => {
            this._createOsc('sine', freq, t + i * 0.06, t + i * 0.06 + 0.1, 0.3);
        });
    },

    /** 💡 提示音：柔和双音 */
    _playHint(t) {
        this._createOsc('sine', 523.25, t, t + 0.2, 0.4);
        this._createOsc('sine', 659.26, t + 0.1, t + 0.3, 0.35);
    },

    /** 🎉 胜利旋律：C-E-G-C 琶音 */
    _playWin(t) {
        const melody = [261.63, 329.63, 392.00, 523.25, 659.26, 783.99];
        melody.forEach((freq, i) => {
            this._createOsc('sine', freq, t + i * 0.12, t + i * 0.12 + 0.25, 0.45);
        });
    },

    /** 😢 失败音：下降旋律 */
    _playLose(t) {
        const melody = [392.00, 349.23, 329.63, 261.63];
        melody.forEach((freq, i) => {
            this._createOsc('sine', freq, t + i * 0.18, t + i * 0.18 + 0.3, 0.4);
        });
    },

    // ─── 背景音乐 ────────────────────────────────

    /** 启动 BGM（轻柔钢琴琶音循环） */
    startBGM() {
        if (!this.ctx || this.bgmPlaying) return;
        this.bgmPlaying = true;
        this._scheduleBGMLoop();
    },

    /** 停止 BGM */
    stopBGM() {
        this.bgmPlaying = false;
        this.bgmTimers.forEach(id => clearTimeout(id));
        this.bgmTimers = [];
        if (this.bgmLoopTimeout) {
            clearTimeout(this.bgmLoopTimeout);
            this.bgmLoopTimeout = null;
        }
    },

    /** BGM 调度循环（C大调暖音琶音） */
    _scheduleBGMLoop() {
        if (!this.bgmPlaying || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // 每次播放一组和弦/琶音序列
        const t = this.ctx.currentTime;
        // 琶音序列 - 模拟轻柔钢琴
        const phrases = [
            // 第一句：C和弦上行
            [{ f: 261.63, dt: 0,    dur: 1.0 },
             { f: 329.63, dt: 0.25, dur: 0.8 },
             { f: 392.00, dt: 0.5,  dur: 0.8 },
             { f: 523.25, dt: 0.75, dur: 1.2 }],
            // 第二句：G和弦
            [{ f: 392.00, dt: 0,    dur: 1.0 },
             { f: 493.88, dt: 0.25, dur: 0.8 },
             { f: 587.33, dt: 0.5,  dur: 0.8 },
             { f: 392.00, dt: 0.75, dur: 1.0 }],
            // 第三句：Am和弦
            [{ f: 440.00, dt: 0,    dur: 1.0 },
             { f: 523.25, dt: 0.3,  dur: 0.8 },
             { f: 659.26, dt: 0.6,  dur: 1.0 },
             { f: 440.00, dt: 0.9,  dur: 0.8 }],
            // 第四句：F→C 回落
            [{ f: 349.23, dt: 0,    dur: 0.8 },
             { f: 392.00, dt: 0.2,  dur: 0.8 },
             { f: 329.63, dt: 0.5,  dur: 0.8 },
             { f: 261.63, dt: 0.8,  dur: 1.5 }],
        ];

        let totalDuration = 0;
        phrases.forEach(phrase => {
            phrase.forEach(({ f, dt, dur }) => {
                const noteT = t + totalDuration + dt;
                this._playBGMNote(f, noteT, dur);
            });
            totalDuration += 1.6;
        });

        // 低音衬底（木吉他低音弦模拟）
        this._playBassLine(t);

        const loopDuration = totalDuration * 1000 + 200;
        this.bgmLoopTimeout = setTimeout(() => {
            if (this.bgmPlaying) this._scheduleBGMLoop();
        }, loopDuration);
    },

    /** 播放单个 BGM 音符 */
    _playBGMNote(freq, startTime, duration) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 低通滤波让声音更柔和
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2200;

        osc.type = 'triangle'; // 三角波模拟钢琴泛音
        osc.frequency.value = freq;

        osc2.type = 'sine'; // 纯正弦作泛音叠加
        osc2.frequency.value = freq * 2;

        const gain2 = this.ctx.createGain();
        gain2.gain.value = 0.08;

        // ADSR 包络
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.65, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.12);
        gain.gain.setValueAtTime(0.35, startTime + duration - 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        osc2.connect(gain2);
        gain2.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        osc2.start(startTime);
        osc2.stop(startTime + duration + 0.05);
    },

    /** 低音衬底（模拟木吉他拨弦） */
    _playBassLine(t) {
        if (!this.ctx) return;
        const bassNotes = [
            { f: 65.41,  dt: 0 },   // C2
            { f: 98.00,  dt: 1.6 }, // G2
            { f: 110.00, dt: 3.2 }, // A2
            { f: 87.31,  dt: 4.8 }, // F2
        ];
        bassNotes.forEach(({ f, dt }) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0, t + dt);
            gain.gain.linearRampToValueAtTime(0.4, t + dt + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dt + 1.4);
            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start(t + dt);
            osc.stop(t + dt + 1.5);
        });
    },
};

// ═══════════════════════════════════════════════════
//  震动管理模块 VibrationManager
// ═══════════════════════════════════════════════════
const VibrationManager = {
    enabled: true,

    vibrateMatch() {
        if (this.enabled) navigator.vibrate?.(15);
    },
    vibrateCombo(combo) {
        if (this.enabled) navigator.vibrate?.(Math.min(15 + combo * 5, 50));
    },
    vibrateBomb() {
        if (this.enabled) navigator.vibrate?.(100);
    },
    vibrateWin() {
        if (this.enabled) navigator.vibrate?.([200, 100, 200]);
    },
    vibrateLose() {
        if (this.enabled) navigator.vibrate?.([100, 50, 100]);
    },
    toggleVibration() {
        this.enabled = !this.enabled;
        return this.enabled;
    },
};

// ═══════════════════════════════════════════════════
//  设置持久化
// ═══════════════════════════════════════════════════
function loadSettings() {
    return {
        muted: localStorage.getItem('cat-game-muted') === 'true',
        vibration: localStorage.getItem('cat-game-vibration') !== 'false',
    };
}

function saveSettings() {
    localStorage.setItem('cat-game-muted', AudioManager.muted);
    localStorage.setItem('cat-game-vibration', VibrationManager.enabled);
}

// ═══════════════════════════════════════════════════
//  统一音效入口 playSound
// ═══════════════════════════════════════════════════
function playSound(type, extra) {
    AudioManager.playSFX(type, extra);
    // 同步震动反馈
    switch (type) {
        case 'match': case 'meow': case 'bell': case 'yarn':
            VibrationManager.vibrateMatch(); break;
        case 'combo':
            VibrationManager.vibrateCombo(extra || 1); break;
        case 'bomb':
            VibrationManager.vibrateBomb(); break;
        case 'win':
            VibrationManager.vibrateWin(); break;
        case 'lose':
            VibrationManager.vibrateLose(); break;
        default: break;
    }
}

// ═══════════════════════════════════════════════════
//  游戏核心配置
// ═══════════════════════════════════════════════════
const CONFIG = {
    BOARD_COLS: 6,
    BOARD_ROWS: 8,
    CAT_TYPES: 11,
    MATCH_MIN: 3,
    BASE_SCORE: 10,
    COMBO_MULTIPLIER: 1.5,
    ANIMATION_DURATION: 300,
};

/** 消除形状类型（用于决定生成哪种特殊道具） */
const MATCH_SHAPE = {
    LINE3:  'line3',   // 3消 → 普通消除
    LINE4:  'line4',   // 4消 → 猫咪爱心 💖（3×3爆炸）
    LINE5:  'line5',   // 5+消 → 呼噜抱枕 🛏️（整行+整列）
    L_SHAPE: 'l',      // L型消 → 零食礼盒 🎁（区域爆炸+buff）
    CROSS:  'cross',   // 十字消 → 零食礼盒 🎁（区域爆炸+buff）
};

const CAT_TYPES = [
    { id: 1, name: '橘猫', file: '橘猫.png' },
    { id: 2, name: '白猫', file: '白猫.png' },
    { id: 3, name: '豹猫', file: '豹猫.png' },
    { id: 4, name: '布偶猫', file: '布偶猫.png' },
    { id: 5, name: '黑猫', file: '黑猫.png' },
    { id: 6, name: '虎斑猫', file: '虎斑猫.png' },
    { id: 7, name: '蓝猫', file: '蓝猫.png' },
    { id: 8, name: '缅因猫', file: '缅因猫.png' },
    { id: 9, name: '拿破仑', file: '拿破仑.png' },
    { id: 10, name: '斯芬克斯猫', file: '斯芬克斯猫.png' },
    { id: 11, name: '暹罗猫', file: '暹罗猫.png' },
];

const SPECIAL_TYPES = {
    PAW: 'paw',
    BOW: 'bow',
    CROWN: 'crown',
    // 新增治愈系特殊道具（特殊道具系统 Task 将完整实现）
    HEART:  'heart',   // 猫咪爱心 💖 — 4消生成
    PILLOW: 'pillow',  // 呼噜抱枕 🛏️ — 5消生成
    GIFT:   'gift',    // 零食礼盒 🎁 — L型/十字消生成
};

// ═══════════════════════════════════════════════════
//  治愈 Buff 系统（BuffManager）
// ═══════════════════════════════════════════════════

/**
 * Buff 类型定义
 * - PURR:    呼噜结界 — 3回合内得分×2，音效变呼噜声，屏幕边缘睡猫动效
 * - SNACK:   零食投喂 — 点击任意单元直接消除，吧唧嘴动画+"好吃"气泡
 * - CUDDLE:  抱团取暖 — 随机2只猫咪组队，消除时额外生成道具+贴贴动画
 */
const BUFF_TYPES = {
    PURR: {
        id: 'purr',
        name: '呼噜结界',
        icon: '💤',
        description: '3回合内得分翻倍，伴随呼噜声',
        duration: 3,           // 持续消除次数
        scoreMultiplier: 2,
        color: '#C8A8E9',
    },
    SNACK: {
        id: 'snack',
        name: '零食投喂',
        icon: '😋',
        description: '点击任意格子直接消除',
        duration: 1,
        scoreMultiplier: 1,
        color: '#FFD93D',
    },
    CUDDLE: {
        id: 'cuddle',
        name: '抱团取暖',
        icon: '🤗',
        description: '猫咪组队，消除额外生成道具',
        duration: 2,
        scoreMultiplier: 1.5,
        color: '#FF6B9D',
    },
};

/**
 * Buff 管理器
 */
const BuffManager = {
    activeBuffs: [],        // 当前激活的 buff 数组（支持叠加）
    cuddlePairs: [],        // 抱团取暖的猫咪配对 [{catType, partnerType}]
    snackMode: false,       // 是否处于零食投喂模式
    purrMode: false,        // 是否处于呼噜结界模式

    /**
     * 获取当前得分倍率（所有 buff 叠加）
     */
    getScoreMultiplier() {
        return this.activeBuffs.reduce((mult, buff) => {
            return mult * (BUFF_TYPES[buff.type].scoreMultiplier || 1);
        }, 1);
    },

    /**
     * 激活一个 buff
     */
    activateBuff(type) {
        const buffDef = BUFF_TYPES[type];
        if (!buffDef) return;

        // 检查是否已有同类型 buff，有则刷新持续时间
        const existing = this.activeBuffs.find(b => b.type === type);
        if (existing) {
            existing.remaining = buffDef.duration;
            existing.total = buffDef.duration;
        } else {
            this.activeBuffs.push({
                type: type,
                remaining: buffDef.duration,
                total: buffDef.duration,
            });
        }

        // 更新模式标记
        this.updateModeFlags();

        // 触发 buff 激活特效
        this.onBuffActivate(type);

        // 更新 UI
        this.updateBuffUI();
    },

    /**
     * 触发随机 buff（用于零食礼盒）
     */
    triggerRandomBuff() {
        const types = Object.keys(BUFF_TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.activateBuff(randomType);
    },

    /**
     * 每次消除后调用，减少 buff 剩余回合
     */
    onMatchEnd() {
        let changed = false;

        this.activeBuffs = this.activeBuffs.filter(buff => {
            buff.remaining--;
            if (buff.remaining <= 0) {
                this.onBuffExpire(buff.type);
                changed = true;
                return false;
            }
            return true;
        });

        if (changed) {
            this.updateModeFlags();
            this.updateBuffUI();
        }
    },

    /**
     * 更新模式标记
     */
    updateModeFlags() {
        this.purrMode = this.activeBuffs.some(b => b.type === 'PURR');
        this.snackMode = this.activeBuffs.some(b => b.type === 'SNACK');

        // 抱团取暖：随机选择2只猫咪组队
        if (this.activeBuffs.some(b => b.type === 'CUDDLE') && this.cuddlePairs.length === 0) {
            this.generateCuddlePairs();
        } else if (!this.activeBuffs.some(b => b.type === 'CUDDLE')) {
            this.cuddlePairs = [];
        }
    },

    /**
     * 生成抱团取暖的猫咪配对
     */
    generateCuddlePairs() {
        const catTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // 随机打乱
        for (let i = catTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [catTypes[i], catTypes[j]] = [catTypes[j], catTypes[i]];
        }
        // 两两配对
        this.cuddlePairs = [];
        for (let i = 0; i < catTypes.length - 1; i += 2) {
            this.cuddlePairs.push({
                catA: catTypes[i],
                catB: catTypes[i + 1],
            });
        }
        // 触发贴贴动画
        showCuddleAnimation();
    },

    /**
     * 检查某只猫咪是否处于抱团状态
     */
    isCatInCuddle(catType) {
        return this.cuddlePairs.some(pair => pair.catA === catType || pair.catB === catType);
    },

    /**
     * 获取猫咪的搭档
     */
    getCuddlePartner(catType) {
        const pair = this.cuddlePairs.find(p => p.catA === catType || p.catB === catType);
        return pair ? (pair.catA === catType ? pair.catB : pair.catA) : null;
    },

    /**
     * Buff 激活时的特效
     */
    onBuffActivate(type) {
        const buffDef = BUFF_TYPES[type];

        switch (type) {
            case 'PURR':
                showPurrEffect();
                playSound('purr');
                break;
            case 'SNACK':
                showSnackEffect();
                playSound('bell');
                break;
            case 'CUDDLE':
                showCuddleAnimation();
                playSound('meow');
                break;
        }

        // 显示 buff 获得提示
        showBuffNotification(buffDef);
    },

    /**
     * Buff 到期时的清理
     */
    onBuffExpire(type) {
        switch (type) {
            case 'PURR':
                hidePurrEffect();
                break;
            case 'SNACK':
                hideSnackEffect();
                break;
            case 'CUDDLE':
                hideCuddleEffect();
                break;
        }
    },

    /**
     * 更新 Buff UI 显示
     */
    updateBuffUI() {
        const container = document.getElementById('buff-container');
        if (!container) return;

        container.innerHTML = '';
        this.activeBuffs.forEach(buff => {
            const buffDef = BUFF_TYPES[buff.type];
            const el = document.createElement('div');
            el.className = 'buff-item';
            el.innerHTML = `
                <span class="buff-icon">${buffDef.icon}</span>
                <span class="buff-turns">${buff.remaining}</span>
            `;
            el.style.background = buffDef.color;
            container.appendChild(el);
        });
    },

    /**
     * 重置（关卡切换时）
     */
    reset() {
        this.activeBuffs = [];
        this.cuddlePairs = [];
        this.snackMode = false;
        this.purrMode = false;
        hidePurrEffect();
        hideSnackEffect();
        hideCuddleEffect();
        this.updateBuffUI();
    },
};

const OBSTACLE_TYPES = {
    CAN: 'can',
    YARN: 'yarn',
    SLEEP: 'sleep',
    FOOD: 'food',
};

// ═══════════════════════════════════════════════════
//  猫咪小请求系统（Cat Request System）
// ═══════════════════════════════════════════════════

/**
 * 请求类型定义
 * - COLLECT: 收集指定数量的某类猫咪
 * - FIND_PILLOW: 找到枕头（消除特定猫咪）
 - FEED_FISH: 喂小鱼干（收集小鱼干道具）
 * - CUDDLE: 让两只猫咪贴贴（消除配对猫咪）
 */
const REQUEST_TYPES = {
    COLLECT: 'collect',           // 收集猫咪
    FIND_PILLOW: 'find_pillow',   // 找枕头
    FEED_FISH: 'feed_fish',       // 喂小鱼干
    CUDDLE: 'cuddle',             // 猫咪贴贴
};

/**
 * 请求模板库 - 每个请求包含猫咪对话、目标描述
 */
const REQUEST_TEMPLATES = {
    [REQUEST_TYPES.COLLECT]: [
        { catType: 1, dialog: '喵~ 能帮我找些小伙伴吗？', desc: '收集橘猫', targetCount: 8 },
        { catType: 2, dialog: '我想和同伴们一起玩耍~', desc: '收集白猫', targetCount: 8 },
        { catType: 3, dialog: '可以帮我召集一些朋友吗？', desc: '收集豹猫', targetCount: 8 },
        { catType: 4, dialog: '喵呜~ 想要更多小伙伴！', desc: '收集布偶猫', targetCount: 8 },
        { catType: 5, dialog: '好孤单呀，能找些朋友来吗？', desc: '收集黑猫', targetCount: 8 },
        { catType: 6, dialog: '想要一个热闹的聚会~', desc: '收集虎斑猫', targetCount: 8 },
        { catType: 7, dialog: '能帮我找些玩伴吗？', desc: '收集蓝猫', targetCount: 8 },
        { catType: 8, dialog: '喵~ 想要更多猫咪朋友！', desc: '收集缅因猫', targetCount: 8 },
        { catType: 9, dialog: '想和大家一起玩~', desc: '收集拿破仑', targetCount: 8 },
        { catType: 10, dialog: '能帮我找些朋友吗？', desc: '收集斯芬克斯猫', targetCount: 8 },
        { catType: 11, dialog: '想要更多小伙伴！', desc: '收集暹罗猫', targetCount: 8 },
    ],
    [REQUEST_TYPES.FIND_PILLOW]: [
        { catType: 1, dialog: '我找不到我的枕头了，能帮我找找吗？', desc: '帮橘猫找枕头', targetCount: 5 },
        { catType: 3, dialog: '我的枕头不见了喵...', desc: '帮豹猫找枕头', targetCount: 5 },
        { catType: 5, dialog: '想要软软的枕头睡觉觉~', desc: '帮黑猫找枕头', targetCount: 5 },
        { catType: 6, dialog: '枕头跑掉了，能帮我找回来吗？', desc: '帮虎斑猫找枕头', targetCount: 5 },
    ],
    [REQUEST_TYPES.FEED_FISH]: [
        { catType: 2, dialog: '肚子饿啦~ 想吃小鱼干！', desc: '喂白猫吃小鱼干', targetCount: 6 },
        { catType: 4, dialog: '喵呜~ 小鱼干最棒了！', desc: '喂布偶猫吃小鱼干', targetCount: 6 },
        { catType: 7, dialog: '有好吃的吗？想要小鱼干~', desc: '喂蓝猫吃小鱼干', targetCount: 6 },
        { catType: 11, dialog: '饿了饿了，想吃小鱼干喵~', desc: '喂暹罗猫吃小鱼干', targetCount: 6 },
    ],
    [REQUEST_TYPES.CUDDLE]: [
        { catType: 1, dialog: '想和小伙伴贴贴~ 能帮我们凑一对吗？', desc: '让橘猫和小伙伴贴贴', targetCount: 4 },
        { catType: 5, dialog: '想要抱抱~ 帮我找个朋友吧！', desc: '让黑猫和小伙伴贴贴', targetCount: 4 },
        { catType: 4, dialog: '贴贴最温暖了，能帮我们吗？', desc: '让布偶猫和小伙伴贴贴', targetCount: 4 },
    ],
};

/**
 * 请求完成后的感谢语
 */
const THANKS_MESSAGES = [
    '谢谢你！你是最棒的朋友！',
    '喵呜~ 太感谢了！',
    '好开心！谢谢你帮我！',
    '你真好！猫咪爱你！',
    '哇！谢谢你！蹭蹭~',
    '太棒了！你是猫咪的救星！',
];

/**
 * 请求完成后的动作描述
 */
const CAT_ACTIONS = [
    { action: '蹭屏幕', emoji: '🐱💨' },
    { action: '舔爪子', emoji: '🐱👅' },
    { action: '打滚', emoji: '🐱🌀' },
    { action: '摇尾巴', emoji: '🐱〰️' },
    { action: '眨眼睛', emoji: '🐱😉' },
];

// ═══════════════════════════════════════════════════
//  猫咪亲密度系统（Cat Affinity System）
// ═══════════════════════════════════════════════════

/**
 * 亲密度等级配置
 */
const AFFINITY_LEVELS = {
    1: { name: '陌生人', minExp: 0, maxExp: 20, bonus: 1 },
    2: { name: '认识', minExp: 20, maxExp: 50, bonus: 1.1 },
    3: { name: '熟悉', minExp: 50, maxExp: 100, bonus: 1.2 },
    4: { name: '友好', minExp: 100, maxExp: 200, bonus: 1.3 },
    5: { name: '亲密', minExp: 200, maxExp: 350, bonus: 1.5 },
    6: { name: '挚友', minExp: 350, maxExp: 500, bonus: 1.7 },
    7: { name: '家人', minExp: 500, maxExp: Infinity, bonus: 2 },
};

/**
 * 亲密度管理器
 */
const AffinityManager = {
    /**
     * 获取某只猫咪的亲密度数据
     * @param {number} catType - 猫咪类型 1-9
     * @returns {Object} { level, exp, unlockedStories }
     */
    getCatAffinity(catType) {
        const key = `cat_affinity_${catType}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            return JSON.parse(saved);
        }
        return { level: 1, exp: 0, unlockedStories: [] };
    },

    /**
     * 保存亲密度数据
     * @param {number} catType - 猫咪类型
     * @param {Object} data - 亲密度数据
     */
    saveCatAffinity(catType, data) {
        const key = `cat_affinity_${catType}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    /**
     * 增加亲密度经验
     * @param {number} catType - 猫咪类型
     * @param {number} exp - 经验值
     * @returns {Object} { leveledUp, newLevel, oldLevel, unlockedStory }
     */
    addExp(catType, exp) {
        const affinity = this.getCatAffinity(catType);
        const oldLevel = affinity.level;
        affinity.exp += exp;

        // 检查升级
        let newLevel = oldLevel;
        for (let lvl = oldLevel + 1; lvl <= 7; lvl++) {
            if (affinity.exp >= AFFINITY_LEVELS[lvl].minExp) {
                newLevel = lvl;
            } else {
                break;
            }
        }

        let unlockedStory = null;
        if (newLevel > oldLevel) {
            affinity.level = newLevel;
            // 解锁新剧情
            unlockedStory = this.unlockStory(catType, newLevel);
        }

        this.saveCatAffinity(catType, affinity);

        return {
            leveledUp: newLevel > oldLevel,
            newLevel,
            oldLevel,
            unlockedStory,
            currentExp: affinity.exp,
        };
    },

    /**
     * 解锁剧情
     * @param {number} catType - 猫咪类型
     * @param {number} level - 等级
     * @returns {Object|null} 解锁的剧情
     */
    unlockStory(catType, level) {
        const affinity = this.getCatAffinity(catType);
        const storyId = `story_${catType}_${level}`;

        if (!affinity.unlockedStories.includes(storyId)) {
            affinity.unlockedStories.push(storyId);
            this.saveCatAffinity(catType, affinity);
            return CAT_STORIES[catType]?.find(s => s.unlockLevel === level) || null;
        }
        return null;
    },

    /**
     * 获取猫咪的得分加成
     * @param {number} catType - 猫咪类型
     * @returns {number} 加成倍数
     */
    getScoreBonus(catType) {
        const affinity = this.getCatAffinity(catType);
        return AFFINITY_LEVELS[affinity.level]?.bonus || 1;
    },

    /**
     * 获取升级到下一级所需经验
     * @param {number} catType - 猫咪类型
     * @returns {number} 还需多少经验
     */
    getExpToNextLevel(catType) {
        const affinity = this.getCatAffinity(catType);
        const currentLevel = affinity.level;
        const nextLevel = currentLevel + 1;

        if (nextLevel > 7) return 0;
        return AFFINITY_LEVELS[nextLevel].minExp - affinity.exp;
    },

    /**
     * 获取所有猫咪的亲密度排行
     * @returns {Array} 按亲密度排序的猫咪数组
     */
    getAffinityRanking() {
        const rankings = [];
        for (let catType = 1; catType <= CONFIG.CAT_TYPES; catType++) {
            const affinity = this.getCatAffinity(catType);
            rankings.push({
                catType,
                ...affinity,
                catInfo: CAT_TYPES[catType - 1],
            });
        }
        return rankings.sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.exp - a.exp;
        });
    },

    /**
     * 重置所有亲密度（调试用）
     */
    resetAll() {
        for (let catType = 1; catType <= CONFIG.CAT_TYPES; catType++) {
            localStorage.removeItem(`cat_affinity_${catType}`);
        }
    },
};

/**
 * 猫咪剧情库
 */
const CAT_STORIES = {
    1: [ // 橘猫
        { id: 'story_1_2', unlockLevel: 2, title: '初次相识', content: '这只橘猫看起来很害羞，但当你靠近时，它会轻轻地蹭你的手指。' },
        { id: 'story_1_4', unlockLevel: 4, title: '美食诱惑', content: '橘猫带你找到了它藏小鱼干的地方，它愿意和你分享！' },
        { id: 'story_1_6', unlockLevel: 6, title: '温暖午后', content: '橘猫最喜欢在你的腿上打盹，发出满足的呼噜声。' },
    ],
    2: [ // 白猫
        { id: 'story_2_2', unlockLevel: 2, title: '纯洁天使', content: '白猫像一个小天使，它的出现让周围都变得明亮。' },
        { id: 'story_2_4', unlockLevel: 4, title: '治愈之源', content: '抚摸白猫时，你会感到内心的烦恼都被抚平了。' },
        { id: 'story_2_6', unlockLevel: 6, title: '永恒友谊', content: '白猫承诺会永远陪伴你，无论风雨。' },
    ],
    3: [ // 豹猫
        { id: 'story_3_2', unlockLevel: 2, title: '野性之美', content: '豹猫保留着一丝野性，但对你却格外温柔。' },
        { id: 'story_3_4', unlockLevel: 4, title: '狩猎教学', content: '豹猫想教你狩猎技巧，虽然你并不需要...' },
        { id: 'story_3_6', unlockLevel: 6, title: '丛林之王', content: '在豹猫心中，你就是它的丛林之王。' },
    ],
    4: [ // 布偶猫
        { id: 'story_4_2', unlockLevel: 2, title: '软萌玩偶', content: '布偶猫柔软得像玩偶，抱起来特别舒服。' },
        { id: 'story_4_4', unlockLevel: 4, title: '跟随者', content: '布偶猫会像小狗一样跟随你，走到哪里跟到哪里。' },
        { id: 'story_4_6', unlockLevel: 6, title: '无条件的爱', content: '布偶猫给予你无条件的爱，这是世界上最珍贵的礼物。' },
    ],
    5: [ // 黑猫
        { id: 'story_5_2', unlockLevel: 2, title: '神秘访客', content: '黑猫总是在意想不到的时候出现，带来神秘的气息。' },
        { id: 'story_5_4', unlockLevel: 4, title: '幸运符', content: '自从认识了黑猫，你觉得生活中多了很多小幸运。' },
        { id: 'story_5_6', unlockLevel: 6, title: '守护之灵', content: '黑猫成为了你的守护灵，在黑暗中为你照亮前路。' },
    ],
    6: [ // 虎斑猫
        { id: 'story_6_2', unlockLevel: 2, title: '条纹魅力', content: '虎斑猫身上的条纹像艺术品一样美丽。' },
        { id: 'story_6_4', unlockLevel: 4, title: '活泼好动', content: '虎斑猫精力充沛，总是邀请你一起玩耍。' },
        { id: 'story_6_6', unlockLevel: 6, title: '最佳玩伴', content: '虎斑猫成为了你最好的玩伴，每一天都充满欢乐。' },
    ],
    7: [ // 蓝猫
        { id: 'story_7_2', unlockLevel: 2, title: '温柔巨人', content: '蓝猫体型较大，但性格却出奇地温柔。' },
        { id: 'story_7_4', unlockLevel: 4, title: '安静陪伴', content: '蓝猫不喜欢吵闹，它更喜欢静静地陪在你身边。' },
        { id: 'story_7_6', unlockLevel: 6, title: '坚实依靠', content: '当你需要依靠时，蓝猫会用它温暖的身体给你力量。' },
    ],
    8: [ // 缅因猫
        { id: 'story_8_2', unlockLevel: 2, title: '贵族气质', content: '缅因猫有着与生俱来的贵族气质，举止优雅。' },
        { id: 'story_8_4', unlockLevel: 4, title: '温柔巨兽', content: '虽然体型庞大，但缅因猫的内心却像小猫一样柔软。' },
        { id: 'story_8_6', unlockLevel: 6, title: '忠诚守护', content: '缅因猫会用它庞大的身躯守护你的每一个梦境。' },
    ],
    9: [ // 拿破仑
        { id: 'story_9_2', unlockLevel: 2, title: '短腿萌物', content: '拿破仑的小短腿跑起来特别可爱，让人忍俊不禁。' },
        { id: 'story_9_4', unlockLevel: 4, title: '勇敢之心', content: '虽然腿短，但拿破仑有着一颗勇敢无畏的心。' },
        { id: 'story_9_6', unlockLevel: 6, title: '快乐源泉', content: '拿破仑总能用它独特的方式给你带来快乐。' },
    ],
    10: [ // 斯芬克斯猫
        { id: 'story_10_2', unlockLevel: 2, title: '独特外表', content: '斯芬克斯猫没有毛发的外表让它与众不同。' },
        { id: 'story_10_4', unlockLevel: 4, title: '温暖触感', content: '摸斯芬克斯猫的感觉很特别，温暖而柔软。' },
        { id: 'story_10_6', unlockLevel: 6, title: '深情厚谊', content: '斯芬克斯猫对主人的感情特别深厚，忠诚而专一。' },
    ],
    11: [ // 暹罗猫
        { id: 'story_11_2', unlockLevel: 2, title: '优雅贵族', content: '暹罗猫举止优雅，仿佛来自遥远的皇家宫廷。' },
        { id: 'story_11_4', unlockLevel: 4, title: '话痨模式', content: '暹罗猫开始和你聊天，用不同的叫声表达各种情绪。' },
        { id: 'story_11_6', unlockLevel: 6, title: '心灵感应', content: '你们之间仿佛有了心灵感应，它总能知道你的心情。' },
    ],
};

// ═══════════════════════════════════════════════════
//  猫咪蹭屏互动系统（Cat Interaction System）
// ═══════════════════════════════════════════════════

/**
 * 猫咪蹭屏互动管理器
 * 功能：
 * - 消除后概率触发猫咪蹭屏
 * - 支持4个方向蹭入（左/右/上/下）
 * - 互动按钮：摸头/挠下巴/喂零食
 * - 互动后增加亲密度
 */
const CatInteractionManager = {
    // 触发概率配置（根据连击数调整）
    TRIGGER_CHANCE: {
        base: 0.15,      // 基础概率 15%
        comboBonus: 0.05, // 每连击增加 5%
        max: 0.40        // 最大概率 40%
    },

    // 互动配置
    INTERACTIONS: {
        pet: {
            id: 'pet',
            name: '摸头',
            emoji: '🤚',
            affinityGain: { min: 2, max: 4 },
            responses: ['喵~', '呼噜呼噜~', '好舒服~', '再摸一下嘛~'],
            sound: 'purr'
        },
        chin: {
            id: 'chin',
            name: '挠下巴',
            emoji: '🤏',
            affinityGain: { min: 3, max: 5 },
            responses: ['喵喵喵！', '好痒~', '喜欢~', '最爱你了~'],
            sound: 'purr'
        },
        snack: {
            id: 'snack',
            name: '喂零食',
            emoji: '🐟',
            affinityGain: { min: 5, max: 8 },
            responses: ['好吃！', ' yummy~', '还要还要~', '最好吃了~'],
            sound: 'meow',
            cost: 1  // 消耗1个爱心饼干
        }
    },

    // 当前活跃的蹭屏实例
    activeRub: null,

    // 冷却时间（毫秒）
    cooldown: 5000,
    lastTriggerTime: 0,

    /**
     * 尝试触发蹭屏互动
     * @param {number} combo - 当前连击数
     * @returns {boolean} 是否成功触发
     */
    tryTrigger(combo = 0) {
        const now = Date.now();
        if (now - this.lastTriggerTime < this.cooldown) return false;
        if (this.activeRub) return false; // 已有活跃蹭屏

        // 计算触发概率
        let chance = this.TRIGGER_CHANCE.base + (combo * this.TRIGGER_CHANCE.comboBonus);
        chance = Math.min(chance, this.TRIGGER_CHANCE.max);

        if (Math.random() < chance) {
            this.triggerRub();
            return true;
        }
        return false;
    },

    /**
     * 触发蹭屏效果
     */
    triggerRub() {
        this.lastTriggerTime = Date.now();

        // 随机选择一只猫咪（优先选择亲密度较高的）
        const catType = this.selectCatForRub();
        const side = this.selectRandomSide();

        this.showRubScreen(catType, side);
    },

    /**
     * 选择要蹭屏的猫咪
     * 优先选择亲密度较高的猫咪
     */
    selectCatForRub() {
        const affinities = [];
        for (let i = 1; i <= 9; i++) {
            const affinity = AffinityManager.getCatAffinity(i);
            affinities.push({ type: i, level: affinity.level, exp: affinity.exp });
        }

        // 按亲密度排序，高亲密度有更高权重
        affinities.sort((a, b) => (b.level * 100 + b.exp) - (a.level * 100 + a.exp));

        // 70%概率选择前3名，30%完全随机
        if (Math.random() < 0.7 && affinities[0].level > 1) {
            const top3 = affinities.slice(0, 3);
            return top3[Math.floor(Math.random() * top3.length)].type;
        }
        return Math.floor(Math.random() * 9) + 1;
    },

    /**
     * 随机选择蹭入方向
     */
    selectRandomSide() {
        const sides = ['left', 'right', 'top', 'bottom'];
        return sides[Math.floor(Math.random() * sides.length)];
    },

    /**
     * 显示蹭屏效果
     * @param {number} catType - 猫咪类型
     * @param {string} side - 蹭入方向
     */
    showRubScreen(catType, side) {
        const catInfo = CAT_TYPES[catType - 1];
        this.activeRub = { catType, side, startTime: Date.now() };

        // 创建蹭屏层
        const rubLayer = document.createElement('div');
        rubLayer.id = 'cat-interaction-layer';
        rubLayer.className = `rub-side-${side}`;

        // 创建猫咪元素
        const catElement = document.createElement('div');
        catElement.className = 'rub-cat-container';
        catElement.innerHTML = `
            <div class="rub-cat-avatar">
                <img src="assets/images/cats/${catInfo.file}" alt="${catInfo.name}" onerror="this.style.display='none'">
            </div>
            <div class="rub-cat-bubble">${this.getRandomGreeting(catType)}</div>
        `;

        // 创建互动按钮
        const interactionPanel = document.createElement('div');
        interactionPanel.className = 'interaction-panel';

        Object.values(this.INTERACTIONS).forEach(interaction => {
            const btn = document.createElement('button');
            btn.className = 'interaction-btn';
            btn.dataset.interaction = interaction.id;

            // 检查是否有足够的饼干喂零食
            if (interaction.id === 'snack' && gameState.cookies < interaction.cost) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }

            btn.innerHTML = `
                <span class="interaction-emoji">${interaction.emoji}</span>
                <span class="interaction-name">${interaction.name}</span>
                ${interaction.cost ? `<span class="interaction-cost">-${interaction.cost}🍪</span>` : ''}
            `;

            btn.addEventListener('click', () => this.handleInteraction(interaction, catType));
            interactionPanel.appendChild(btn);
        });

        rubLayer.appendChild(catElement);
        rubLayer.appendChild(interactionPanel);
        document.body.appendChild(rubLayer);

        // 播放蹭屏音效
        AudioManager.playSFX('meow');

        // 自动关闭（如果用户没有互动）
        this.autoCloseTimer = setTimeout(() => {
            this.closeRubScreen();
        }, 8000);
    },

    /**
     * 获取随机问候语
     */
    getRandomGreeting(catType) {
        const greetings = [
            '喵~',
            '蹭蹭~',
            '陪我玩嘛~',
            '摸摸我~',
            '好无聊呀~',
            '想你了~'
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    },

    /**
     * 处理互动
     * @param {Object} interaction - 互动配置
     * @param {number} catType - 猫咪类型
     */
    handleInteraction(interaction, catType) {
        // 清除自动关闭定时器
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }

        // 检查饼干消耗
        if (interaction.cost && gameState.cookies < interaction.cost) {
            this.showFeedback('饼干不够啦~', 'warning');
            return;
        }

        // 扣除饼干
        if (interaction.cost) {
            gameState.cookies -= interaction.cost;
            updateUI();
        }

        // 计算亲密度增加
        const expGain = Math.floor(
            Math.random() * (interaction.affinityGain.max - interaction.affinityGain.min + 1)
        ) + interaction.affinityGain.min;

        // 增加亲密度
        const result = AffinityManager.addExp(catType, expGain);

        // 显示反馈
        const response = interaction.responses[Math.floor(Math.random() * interaction.responses.length)];
        this.showInteractionFeedback(response, expGain, result.leveledUp);

        // 播放音效
        AudioManager.playSFX(interaction.sound);

        // 如果升级了，延迟显示升级弹窗
        if (result.leveledUp) {
            setTimeout(() => {
                showAffinityLevelUp(catType, result.newLevel, result.unlockedStory);
            }, 1500);
        }

        // 延迟关闭
        setTimeout(() => {
            this.closeRubScreen();
        }, 2000);
    },

    /**
     * 显示互动反馈
     */
    showInteractionFeedback(response, expGain, leveledUp) {
        const layer = document.getElementById('cat-interaction-layer');
        if (!layer) return;

        // 隐藏互动按钮
        const panel = layer.querySelector('.interaction-panel');
        if (panel) panel.style.display = 'none';

        // 更新气泡内容
        const bubble = layer.querySelector('.rub-cat-bubble');
        if (bubble) {
            bubble.innerHTML = `
                ${response}
                <div class="exp-gain">+${expGain} 亲密度</div>
                ${leveledUp ? '<div class="level-up-hint">✨ 升级啦！</div>' : ''}
            `;
            bubble.classList.add('feedback-active');
        }

        // 添加爱心飘出效果
        this.createFloatingHearts(layer);
    },

    /**
     * 创建飘出爱心
     */
    createFloatingHearts(container) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'floating-heart';
                heart.textContent = '💖';
                heart.style.left = `${40 + Math.random() * 20}%`;
                heart.style.animationDelay = `${Math.random() * 0.3}s`;
                container.appendChild(heart);
                setTimeout(() => heart.remove(), 1500);
            }, i * 100);
        }
    },

    /**
     * 关闭蹭屏
     */
    closeRubScreen() {
        const layer = document.getElementById('cat-interaction-layer');
        if (layer) {
            layer.classList.add('rub-exit');
            setTimeout(() => {
                layer.remove();
                this.activeRub = null;
            }, 500);
        }
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
    },

    /**
     * 显示反馈提示
     */
    showFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `interaction-feedback ${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
};

// ═══════════════════════════════════════════════════
//  家园养成系统（Home System）
// ═══════════════════════════════════════════════════

/**
 * 装饰物品配置
 * 类型：furniture（家具）、toy（玩具）、plant（植物）、background（背景）
 */
const DECORATION_ITEMS = {
    // 阳光阳台主题
    balcony: {
        id: 'balcony',
        name: '阳光阳台',
        description: '温暖的阳光洒满整个阳台，猫咪们最喜欢在这里晒太阳',
        theme: 'balcony',
        items: [
            { id: 'balcony_floor', name: '木质地板', type: 'background', icon: '🪵', cost: 0, default: true, description: '温暖的木质地板' },
            { id: 'balcony_sunbed', name: '猫咪躺椅', type: 'furniture', icon: '🛋️', cost: 50, description: '舒适的躺椅，适合晒太阳' },
            { id: 'balcony_plant', name: '猫草盆栽', type: 'plant', icon: '🪴', cost: 30, description: '新鲜的猫草，猫咪的最爱' },
            { id: 'balcony_toy', name: '毛线球', type: 'toy', icon: '🧶', cost: 20, description: '经典的猫咪玩具' },
            { id: 'balcony_bowl', name: '精致食盆', type: 'furniture', icon: '🥣', cost: 40, description: '漂亮的陶瓷食盆' },
            { id: 'balcony_curtain', name: '蕾丝窗帘', type: 'background', icon: '🪟', cost: 60, description: '飘逸的蕾丝窗帘' },
        ]
    },
    // 花园草坪主题
    garden: {
        id: 'garden',
        name: '花园草坪',
        description: '绿意盎然的花园，让猫咪尽情奔跑嬉戏',
        theme: 'garden',
        items: [
            { id: 'garden_grass', name: '青青草坪', type: 'background', icon: '🌿', cost: 0, default: true, description: '柔软的绿色草坪' },
            { id: 'garden_tree', name: '大树', type: 'plant', icon: '🌳', cost: 80, description: '可以提供阴凉的大树' },
            { id: 'garden_flower', name: '花丛', type: 'plant', icon: '🌸', cost: 35, description: '五颜六色的花丛' },
            { id: 'garden_tunnel', name: '猫隧道', type: 'toy', icon: '🔲', cost: 45, description: '可以钻来钻去的隧道' },
            { id: 'garden_fountain', name: '小喷泉', type: 'furniture', icon: '⛲', cost: 100, description: '潺潺流水的小喷泉' },
            { id: 'garden_butterfly', name: '蝴蝶装饰', type: 'toy', icon: '🦋', cost: 25, description: '会动的蝴蝶装饰' },
        ]
    },
    // 温暖窝窝主题
    cozy: {
        id: 'cozy',
        name: '温暖窝窝',
        description: '温馨舒适的室内空间，给猫咪一个安心的家',
        theme: 'cozy',
        items: [
            { id: 'cozy_carpet', name: '毛绒地毯', type: 'background', icon: '🟫', cost: 0, default: true, description: '柔软的毛绒地毯' },
            { id: 'cozy_bed', name: '猫窝', type: 'furniture', icon: '🛏️', cost: 70, description: '温暖舒适的猫窝' },
            { id: 'cozy_scratch', name: '猫抓板', type: 'toy', icon: '📋', cost: 30, description: '保护家具的猫抓板' },
            { id: 'cozy_lamp', name: '小夜灯', type: 'furniture', icon: '🛋️', cost: 40, description: '温暖的小夜灯' },
            { id: 'cozy_pillow', name: '抱枕堆', type: 'furniture', icon: '🟦', cost: 35, description: '软绵绵的抱枕堆' },
            { id: 'cozy_cushion', name: '窗台垫', type: 'furniture', icon: '🟨', cost: 25, description: '放在窗台的软垫' },
        ]
    }
};

/**
 * 家园系统管理器
 * 功能：
 * - 管理已解锁的装饰
 * - 购买新装饰
 * - 布置家园场景
 * - 切换主题
 */
const HomeSystem = {
    // 当前激活的主题
    currentTheme: 'balcony',

    // 已购买的装饰（按主题分类）
    purchasedItems: {},

    // 当前布置的装饰（按位置）
    placedItems: {},

    // 家园等级
    homeLevel: 1,

    // 家园经验
    homeExp: 0,

    /**
     * 初始化家园系统
     */
    init() {
        this.loadHomeData();
        // 确保每个主题都有默认物品
        Object.keys(DECORATION_ITEMS).forEach(themeId => {
            if (!this.purchasedItems[themeId]) {
                this.purchasedItems[themeId] = [];
            }
            // 添加默认物品
            const defaultItems = DECORATION_ITEMS[themeId].items.filter(item => item.default);
            defaultItems.forEach(item => {
                if (!this.purchasedItems[themeId].includes(item.id)) {
                    this.purchasedItems[themeId].push(item.id);
                }
            });
        });
    },

    /**
     * 从 localStorage 加载家园数据
     */
    loadHomeData() {
        const saved = localStorage.getItem('home_system_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.currentTheme = data.currentTheme || 'balcony';
            this.purchasedItems = data.purchasedItems || {};
            this.placedItems = data.placedItems || {};
            this.homeLevel = data.homeLevel || 1;
            this.homeExp = data.homeExp || 0;
        }
    },

    /**
     * 保存家园数据到 localStorage
     */
    saveHomeData() {
        const data = {
            currentTheme: this.currentTheme,
            purchasedItems: this.purchasedItems,
            placedItems: this.placedItems,
            homeLevel: this.homeLevel,
            homeExp: this.homeExp
        };
        localStorage.setItem('home_system_data', JSON.stringify(data));
    },

    /**
     * 获取当前主题
     */
    getCurrentTheme() {
        return DECORATION_ITEMS[this.currentTheme];
    },

    /**
     * 切换主题
     */
    switchTheme(themeId) {
        if (DECORATION_ITEMS[themeId]) {
            this.currentTheme = themeId;
            this.saveHomeData();
            return true;
        }
        return false;
    },

    /**
     * 获取所有可用主题
     */
    getAllThemes() {
        return Object.values(DECORATION_ITEMS);
    },

    /**
     * 获取已购买的装饰列表
     */
    getPurchasedItems(themeId = null) {
        const theme = themeId || this.currentTheme;
        const itemIds = this.purchasedItems[theme] || [];
        const themeItems = DECORATION_ITEMS[theme].items;
        return itemIds.map(id => themeItems.find(item => item.id === id)).filter(Boolean);
    },

    /**
     * 获取未购买的装饰列表
     */
    getUnpurchasedItems(themeId = null) {
        const theme = themeId || this.currentTheme;
        const purchasedIds = this.purchasedItems[theme] || [];
        const themeItems = DECORATION_ITEMS[theme].items;
        return themeItems.filter(item => !purchasedIds.includes(item.id));
    },

    /**
     * 购买装饰
     * @param {string} itemId - 装饰ID
     * @returns {Object} { success, message, remainingCookies }
     */
    purchaseItem(itemId) {
        const theme = this.getCurrentTheme();
        const item = theme.items.find(i => i.id === itemId);

        if (!item) {
            return { success: false, message: '装饰不存在' };
        }

        if (this.purchasedItems[this.currentTheme]?.includes(itemId)) {
            return { success: false, message: '已经购买过了' };
        }

        if (gameState.cookies < item.cost) {
            return { success: false, message: '爱心饼干不足' };
        }

        // 扣除饼干
        gameState.cookies -= item.cost;
        updateUI();

        // 添加到已购买
        if (!this.purchasedItems[this.currentTheme]) {
            this.purchasedItems[this.currentTheme] = [];
        }
        this.purchasedItems[this.currentTheme].push(itemId);

        // 增加家园经验
        this.addHomeExp(10);

        this.saveHomeData();

        return {
            success: true,
            message: `成功购买 ${item.name}！`,
            remainingCookies: gameState.cookies
        };
    },

    /**
     * 放置装饰
     */
    placeItem(itemId, position) {
        if (!this.purchasedItems[this.currentTheme]?.includes(itemId)) {
            return false;
        }

        this.placedItems[position] = itemId;
        this.saveHomeData();
        return true;
    },

    /**
     * 移除装饰
     */
    removeItem(position) {
        delete this.placedItems[position];
        this.saveHomeData();
    },

    /**
     * 获取指定位置的装饰
     */
    getItemAtPosition(position) {
        const itemId = this.placedItems[position];
        if (!itemId) return null;

        const theme = this.getCurrentTheme();
        return theme.items.find(item => item.id === itemId);
    },

    /**
     * 增加家园经验
     */
    addHomeExp(exp) {
        this.homeExp += exp;
        // 升级检查（每100经验升一级）
        const newLevel = Math.floor(this.homeExp / 100) + 1;
        if (newLevel > this.homeLevel) {
            this.homeLevel = newLevel;
            return true; // 升级了
        }
        return false;
    },

    /**
     * 获取家园等级信息
     */
    getHomeLevelInfo() {
        const expToNext = this.homeLevel * 100;
        const currentLevelExp = (this.homeLevel - 1) * 100;
        const progress = this.homeExp - currentLevelExp;
        const need = expToNext - currentLevelExp;

        return {
            level: this.homeLevel,
            totalExp: this.homeExp,
            progress: progress,
            need: need,
            percentage: Math.min(100, (progress / need) * 100)
        };
    },

    /**
     * 获取家园舒适度（根据已放置的装饰计算）
     */
    getComfortLevel() {
        let comfort = 0;
        const theme = this.getCurrentTheme();

        Object.values(this.placedItems).forEach(itemId => {
            const item = theme.items.find(i => i.id === itemId);
            if (item) {
                comfort += Math.floor(item.cost / 10) + 5;
            }
        });

        return comfort;
    },

    /**
     * 重置家园（调试用）
     */
    reset() {
        this.currentTheme = 'balcony';
        this.purchasedItems = {};
        this.placedItems = {};
        this.homeLevel = 1;
        this.homeExp = 0;
        this.saveHomeData();
    }
};

// ═══════════════════════════════════════════════════
//  悠闲模式管理器（猫咪庭院）
// ═══════════════════════════════════════════════════
const RelaxModeManager = {
    // 庭院猫咪配置
    courtyardCats: [],
    maxCats: 5,
    particleInterval: null,
    catMoveInterval: null,

    // 猫咪行为类型
    CAT_BEHAVIORS: ['idle', 'walk', 'play', 'sleep', 'watch'],

    // 猫咪名字池
    CAT_NAMES: ['咪咪', '花花', '橘子', '小黑', '小白', '球球', '豆豆', '糖糖', '布丁', '奶茶'],

    /**
     * 初始化悠闲模式
     */
    init() {
        this.courtyardCats = [];
        this.spawnInitialCats();
        this.startParticleEffects();
        this.startCatAnimations();
    },

    /**
     * 清理悠闲模式
     */
    cleanup() {
        this.stopParticleEffects();
        this.stopCatAnimations();
        this.removeAllCats();
    },

    /**
     * 生成初始猫咪
     */
    spawnInitialCats() {
        const catCount = 3 + Math.floor(Math.random() * 3); // 3-5只
        for (let i = 0; i < catCount; i++) {
            this.spawnCat();
        }
    },

    /**
     * 生成一只庭院猫咪
     */
    spawnCat() {
        const catTypes = Object.keys(CAT_TYPES);
        const randomType = catTypes[Math.floor(Math.random() * catTypes.length)];
        const catInfo = CAT_TYPES[randomType - 1] || CAT_TYPES[0];
        const name = this.CAT_NAMES[Math.floor(Math.random() * this.CAT_NAMES.length)];

        const cat = {
            id: 'courtyard-cat-' + Date.now() + Math.random(),
            type: randomType,
            name: name,
            x: 10 + Math.random() * 80, // 10%-90% 位置
            y: 60 + Math.random() * 30, // 底部区域
            behavior: 'idle',
            direction: Math.random() > 0.5 ? 1 : -1,
            animationDelay: Math.random() * 2,
        };

        this.courtyardCats.push(cat);
        this.renderCat(cat);
        return cat;
    },

    /**
     * 渲染猫咪到页面
     */
    renderCat(cat) {
        const catInfo = CAT_TYPES[cat.type - 1] || CAT_TYPES[0];
        const catEl = document.createElement('div');
        catEl.id = cat.id;
        catEl.className = 'courtyard-cat';
        catEl.style.cssText = `
            left: ${cat.x}%;
            top: ${cat.y}%;
            animation-delay: ${cat.animationDelay}s;
        `;
        catEl.innerHTML = `
            <div class="cat-sprite" style="background-image: url(${catInfo.asset})"></div>
            <div class="cat-name">${cat.name}</div>
            <div class="cat-behavior-indicator"></div>
        `;

        document.body.appendChild(catEl);
        this.updateCatBehavior(cat);
    },

    /**
     * 更新猫咪行为
     */
    updateCatBehavior(cat) {
        const behaviors = this.CAT_BEHAVIORS;
        const newBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        cat.behavior = newBehavior;

        const catEl = document.getElementById(cat.id);
        if (!catEl) return;

        const sprite = catEl.querySelector('.cat-sprite');
        const indicator = catEl.querySelector('.cat-behavior-indicator');

        // 移除旧行为类
        sprite.classList.remove('behavior-idle', 'behavior-walk', 'behavior-play', 'behavior-sleep', 'behavior-watch');
        sprite.classList.add(`behavior-${newBehavior}`);

        // 更新指示器
        const behaviorIcons = {
            idle: '',
            walk: '🚶',
            play: '🧶',
            sleep: '💤',
            watch: '👀'
        };
        indicator.textContent = behaviorIcons[newBehavior];

        // 根据行为设置方向
        if (newBehavior === 'walk') {
            cat.direction = Math.random() > 0.5 ? 1 : -1;
            sprite.style.transform = `scaleX(${cat.direction})`;
        }
    },

    /**
     * 更新猫咪位置（动画循环）
     */
    updateCatPositions() {
        this.courtyardCats.forEach(cat => {
            if (cat.behavior === 'walk') {
                cat.x += cat.direction * 0.5;
                // 边界检查
                if (cat.x < 5) {
                    cat.x = 5;
                    cat.direction = 1;
                } else if (cat.x > 95) {
                    cat.x = 95;
                    cat.direction = -1;
                }

                const catEl = document.getElementById(cat.id);
                if (catEl) {
                    catEl.style.left = `${cat.x}%`;
                    const sprite = catEl.querySelector('.cat-sprite');
                    sprite.style.transform = `scaleX(${cat.direction})`;
                }
            }
        });
    },

    /**
     * 启动猫咪动画
     */
    startCatAnimations() {
        // 定期改变行为
        this.catBehaviorInterval = setInterval(() => {
            this.courtyardCats.forEach(cat => {
                if (Math.random() < 0.3) { // 30%概率改变行为
                    this.updateCatBehavior(cat);
                }
            });
        }, 3000);

        // 位置更新动画循环
        this.catMoveInterval = setInterval(() => {
            this.updateCatPositions();
        }, 100);
    },

    /**
     * 停止猫咪动画
     */
    stopCatAnimations() {
        if (this.catBehaviorInterval) {
            clearInterval(this.catBehaviorInterval);
            this.catBehaviorInterval = null;
        }
        if (this.catMoveInterval) {
            clearInterval(this.catMoveInterval);
            this.catMoveInterval = null;
        }
    },

    /**
     * 移除所有猫咪
     */
    removeAllCats() {
        this.courtyardCats.forEach(cat => {
            const catEl = document.getElementById(cat.id);
            if (catEl) catEl.remove();
        });
        this.courtyardCats = [];
    },

    /**
     * 启动粒子效果（花瓣/星光）
     */
    startParticleEffects() {
        this.particleInterval = setInterval(() => {
            this.createParticle();
        }, 800);
    },

    /**
     * 停止粒子效果
     */
    stopParticleEffects() {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }
        // 清理现有粒子
        document.querySelectorAll('.relax-particle').forEach(p => p.remove());
    },

    /**
     * 创建单个粒子
     */
    createParticle() {
        const particles = ['🌸', '🌺', '🌻', '✨', '⭐', '🍃', '🦋'];
        const particle = document.createElement('div');
        particle.className = 'relax-particle';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];

        const startX = Math.random() * 100;
        const duration = 3 + Math.random() * 4;
        const size = 0.8 + Math.random() * 0.7;

        particle.style.cssText = `
            left: ${startX}%;
            top: -30px;
            font-size: ${size}rem;
            animation: particleFall ${duration}s linear forwards;
        `;

        document.body.appendChild(particle);

        // 动画结束后移除
        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    },

    /**
     * 消除时创建特殊粒子效果
     */
    createMatchParticles(x, y) {
        const colors = ['#FF8FAB', '#FFB3C6', '#FFC8DD', '#FFD93D', '#88D8E8', '#A8E6CF'];
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'relax-match-particle';
                particle.style.cssText = `
                    left: ${x}px;
                    top: ${y}px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    --tx: ${(Math.random() - 0.5) * 100}px;
                    --ty: ${(Math.random() - 0.5) * 100}px;
                `;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1500);
            }, i * 50);
        }
    },

    /**
     * 切换游戏模式
     */
    switchMode(mode) {
        if (mode === 'relax') {
            gameState.gameMode = 'relax';
            this.init();
            this.showRelaxUI();
        } else {
            this.cleanup();
            gameState.gameMode = 'level';
            this.hideRelaxUI();
        }
    },

    /**
     * 显示悠闲模式UI
     */
    showRelaxUI() {
        // 隐藏请求面板
        const requestPanel = document.getElementById('request-panel');
        if (requestPanel) requestPanel.style.display = 'none';

        // 显示悠闲模式指示器
        const indicator = document.createElement('div');
        indicator.id = 'relax-mode-indicator';
        indicator.innerHTML = '🌸 猫咪庭院 · 悠闲模式';
        document.body.appendChild(indicator);

        // 添加庭院背景
        document.body.classList.add('relax-mode-active');
    },

    /**
     * 隐藏悠闲模式UI
     */
    hideRelaxUI() {
        // 显示请求面板
        const requestPanel = document.getElementById('request-panel');
        if (requestPanel) requestPanel.style.display = '';

        // 移除指示器
        const indicator = document.getElementById('relax-mode-indicator');
        if (indicator) indicator.remove();

        // 移除庭院背景
        document.body.classList.remove('relax-mode-active');
    }
};

// ═══════════════════════════════════════════════════
//  游戏状态
// ═══════════════════════════════════════════════════
let gameState = {
    board: [],
    score: 0,
    cookies: 0,           // 爱心饼干（替代步数，消除积累）
    level: 1,
    target: null,         // 当前关卡目标（向后兼容）
    targetProgress: 0,    // 目标进度
    currentRequest: null, // 当前猫咪请求对象
    requestCompleted: false, // 当前请求是否已完成
    completedRequests: [], // 已完成的请求历史
    combo: 0,
    isAnimating: false,
    selectedCell: null,
    items: { bomb: 3, shuffle: 2, refresh: 2, hint: 5 },
    activeItem: null,
    isPaused: false,
    gameMode: 'level',    // 'level' = 关卡模式, 'relax' = 悠闲模式
};

const DOM = {};

// ═══════════════════════════════════════════════════
//  初始化
// ═══════════════════════════════════════════════════
function init() {
    cacheDOM();
    applySettings();
    bindEvents();
    // 初始化家园系统
    HomeSystem.init();
    startLevel(1);
}

function cacheDOM() {
    DOM.board = document.getElementById('game-board');
    DOM.effectsLayer = document.getElementById('effects-layer');
    DOM.score = document.getElementById('score');
    DOM.cookies = document.getElementById('cookies');
    DOM.level = document.getElementById('level');
    DOM.targetText = document.getElementById('target-text');
    DOM.targetCount = document.getElementById('target-count');
    DOM.targetCat = document.querySelector('.target-cat');
    DOM.comboDisplay = document.getElementById('combo-display');
    DOM.comboText = document.getElementById('combo-text');
    DOM.pauseModal = document.getElementById('pause-modal');
    DOM.winModal = document.getElementById('win-modal');
    DOM.bombCount = document.getElementById('bomb-count');
    DOM.shuffleCount = document.getElementById('shuffle-count');
    DOM.refreshCount = document.getElementById('refresh-count');
    DOM.hintCount = document.getElementById('hint-count');
    DOM.btnMute = document.getElementById('btn-mute');
    DOM.btnVibrate = document.getElementById('btn-vibrate');
    // 请求系统DOM
    DOM.requestPanel = document.getElementById('request-panel');
    DOM.requestDesc = document.getElementById('request-desc');
    DOM.requestStatus = document.getElementById('request-status');
    DOM.progressFill = document.getElementById('progress-fill');
    DOM.requestCurrent = document.getElementById('request-current');
    DOM.requestCompleteHint = document.getElementById('request-complete-hint');
}

/** 读取并应用持久化设置 */
function applySettings() {
    const settings = loadSettings();
    AudioManager.muted = settings.muted;
    VibrationManager.enabled = settings.vibration;
    updateSettingsUI();
}

function updateSettingsUI() {
    if (DOM.btnMute) {
        DOM.btnMute.textContent = AudioManager.muted ? '🔇' : '🔊';
        DOM.btnMute.classList.toggle('muted', AudioManager.muted);
    }
    if (DOM.btnVibrate) {
        DOM.btnVibrate.textContent = VibrationManager.enabled ? '📳' : '📴';
        DOM.btnVibrate.classList.toggle('disabled-state', !VibrationManager.enabled);
    }
}

// ═══════════════════════════════════════════════════
//  事件绑定
// ═══════════════════════════════════════════════════
function bindEvents() {
    // 棋盘触摸事件
    DOM.board.addEventListener('touchstart', handleTouchStart, { passive: false });
    DOM.board.addEventListener('touchmove', handleTouchMove, { passive: false });
    DOM.board.addEventListener('touchend', handleTouchEnd);
    // 棋盘鼠标事件
    DOM.board.addEventListener('mousedown', handleMouseDown);
    DOM.board.addEventListener('mousemove', handleMouseMove);
    DOM.board.addEventListener('mouseup', handleMouseUp);

    // 按钮事件
    document.getElementById('btn-pause').addEventListener('click', pauseGame);
    document.getElementById('btn-restart').addEventListener('click', () => startLevel(gameState.level));
    document.getElementById('btn-resume').addEventListener('click', resumeGame);
    document.getElementById('btn-restart-modal').addEventListener('click', () => {
        hideModal(DOM.pauseModal);
        startLevel(gameState.level);
    });
    document.getElementById('btn-next-level').addEventListener('click', () => {
        hideModal(DOM.winModal);
        startLevel(gameState.level + 1);
    });
    document.getElementById('btn-replay').addEventListener('click', () => {
        hideModal(DOM.winModal);
        startLevel(gameState.level);
    });

    // 道具事件
    document.querySelectorAll('.item').forEach(item => {
        item.addEventListener('click', () => handleItemClick(item.dataset.item));
    });

    // 静音/震动按钮
    if (DOM.btnMute) {
        DOM.btnMute.addEventListener('click', () => {
            AudioManager.init();
            AudioManager.toggleMute();
            saveSettings();
            updateSettingsUI();
        });
    }
    if (DOM.btnVibrate) {
        DOM.btnVibrate.addEventListener('click', () => {
            VibrationManager.toggleVibration();
            saveSettings();
            updateSettingsUI();
        });
    }

    // 亲密度按钮
    const btnAffinity = document.getElementById('btn-affinity');
    if (btnAffinity) {
        btnAffinity.addEventListener('click', () => {
            showAffinityPanel();
        });
    }

    // 家园按钮
    const btnHome = document.getElementById('btn-home');
    if (btnHome) {
        btnHome.addEventListener('click', () => {
            showHomeScreen();
        });
    }

    // 悠闲模式切换按钮
    const btnRelaxMode = document.getElementById('btn-relax-mode');
    if (btnRelaxMode) {
        btnRelaxMode.addEventListener('click', () => {
            if (gameState.gameMode === 'level') {
                // 切换到悠闲模式
                RelaxModeManager.switchMode('relax');
                btnRelaxMode.textContent = '🎮 关卡';
                btnRelaxMode.classList.add('active');
                btnRelaxMode.title = '返回关卡模式';
            } else {
                // 返回关卡模式
                RelaxModeManager.switchMode('level');
                btnRelaxMode.textContent = '🌸 庭院';
                btnRelaxMode.classList.remove('active');
                btnRelaxMode.title = '切换到猫咪庭院';
                // 重新加载当前关卡
                startLevel(gameState.level);
            }
        });
    }

    // 首次交互初始化 AudioContext
    const initAudio = () => {
        AudioManager.init();
        if (AudioManager.muted) {
            AudioManager.masterGain && (AudioManager.masterGain.gain.value = 0);
        }
    };
    document.addEventListener('touchstart', initAudio, { once: true, passive: true });
    document.addEventListener('mousedown', initAudio, { once: true });
}

// ═══════════════════════════════════════════════════
//  触摸事件处理
// ═══════════════════════════════════════════════════
let touchStartPos = null;
let touchStartCell = null;

function handleTouchStart(e) {
    if (gameState.isAnimating || gameState.isPaused) return;
    e.preventDefault();
    const touch = e.touches[0];
    const cell = e.target.closest('.cell');
    if (!cell) return;
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    touchStartCell = {
        row: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col),
    };
    if (gameState.activeItem === 'bomb') {
        showBombRange(touchStartCell.row, touchStartCell.col);
    }
}

function handleTouchMove(e) {
    if (!touchStartPos || !touchStartCell || gameState.isAnimating) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.x;
    const dy = touch.clientY - touchStartPos.y;
    const threshold = 30;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        let targetRow = touchStartCell.row;
        let targetCol = touchStartCell.col;
        if (Math.abs(dx) > Math.abs(dy)) {
            targetCol += dx > 0 ? 1 : -1;
        } else {
            targetRow += dy > 0 ? 1 : -1;
        }
        trySwap(touchStartCell.row, touchStartCell.col, targetRow, targetCol);
        touchStartPos = null;
        touchStartCell = null;
    }
}

function handleTouchEnd(e) {
    if (gameState.activeItem === 'bomb' && touchStartCell) {
        useBomb(touchStartCell.row, touchStartCell.col);
    }
    touchStartPos = null;
    touchStartCell = null;
    clearBombRange();
}

// ═══════════════════════════════════════════════════
//  鼠标事件处理（修复：补全双击交换逻辑）
// ═══════════════════════════════════════════════════
let mouseDown = false;
let mouseStartCell = null;

function handleMouseDown(e) {
    if (gameState.isAnimating || gameState.isPaused) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const clickedRow = parseInt(cell.dataset.row);
    const clickedCol = parseInt(cell.dataset.col);

    // ★ 零食投喂模式：点击任意格子直接消除
    if (BuffManager && BuffManager.snackMode) {
        handleSnackClick(clickedRow, clickedCol);
        return;
    }

    // ★ 特殊道具：点击直接触发效果
    const boardCell = gameState.board[clickedRow][clickedCol];
    if (boardCell && boardCell.special) {
        triggerSpecialItemEffect(clickedRow, clickedCol);
        return;
    }

    if (gameState.activeItem === 'bomb') {
        mouseDown = true;
        mouseStartCell = { row: clickedRow, col: clickedCol };
        showBombRange(clickedRow, clickedCol);
        return;
    }

    // ★ 修复5：双击交换逻辑
    if (gameState.selectedCell) {
        const { row: selRow, col: selCol } = gameState.selectedCell;

        // 点击同一格子 → 取消选中
        if (selRow === clickedRow && selCol === clickedCol) {
            clearSelection();
            return;
        }

        // 点击相邻格子 → 执行交换
        const rowDiff = Math.abs(clickedRow - selRow);
        const colDiff = Math.abs(clickedCol - selCol);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            clearSelection();
            trySwap(selRow, selCol, clickedRow, clickedCol);
            mouseDown = false;
            mouseStartCell = null;
            return;
        }

        // 点击非相邻格子 → 切换选中到新格子
        clearSelection();
    }

    mouseDown = true;
    mouseStartCell = { row: clickedRow, col: clickedCol };
    cell.classList.add('selected');
    gameState.selectedCell = { row: clickedRow, col: clickedCol };
}

/**
 * 零食投喂模式：点击直接消除
 */
async function handleSnackClick(row, col) {
    if (gameState.isAnimating) return;
    gameState.isAnimating = true;

    const cell = gameState.board[row][col];
    if (!cell) {
        gameState.isAnimating = false;
        return;
    }

    // 显示"好吃"气泡
    showYummyBubble(row, col);

    // 播放吧唧嘴音效
    playSound('meow');

    // 消除动画
    await animateMatches([{ row, col }]);

    // 标记为 null
    gameState.board[row][col] = null;

    // 计分
    gameState.score += CONFIG.BASE_SCORE * 2;
    updateTargetProgress([{ row, col }]);

    // 下落填充
    await dropAndFill();
    updateUI();

    // 检查连锁消除
    await processMatches();

    gameState.isAnimating = false;
}

/**
 * 触发特殊道具效果并处理后续消除流程
 */
async function triggerSpecialItemEffect(row, col) {
    if (gameState.isAnimating) return;
    gameState.isAnimating = true;

    const cell = gameState.board[row][col];
    const specialType = cell.special;

    // 获取需要消除的格子
    const toRemove = triggerSpecialItem(row, col, specialType);

    // 清除该格子的特殊标记
    cell.special = null;

    // 视觉清理
    const el = getCellElement(row, col);
    if (el) {
        el.classList.remove('special-item', `special-${specialType}`);
        delete el.dataset.special;
        const iconEl = el.querySelector('.special-icon');
        if (iconEl) iconEl.remove();
    }

    // 执行消除动画
    if (toRemove.length > 0) {
        await animateMatches(toRemove);

        // 标记为 null
        toRemove.forEach(pos => {
            gameState.board[pos.row][pos.col] = null;
        });

        // 计分
        const baseScore = toRemove.length * CONFIG.BASE_SCORE * 2; // 特殊道具双倍分
        gameState.score += Math.floor(baseScore);
        updateTargetProgress(toRemove);

        // 下落填充
        await dropAndFill();
        updateUI();

        // 检查连锁消除
        await processMatches();
    }

    gameState.isAnimating = false;
}

function handleMouseMove(e) {
    if (!mouseDown || !mouseStartCell || gameState.isAnimating) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);
    const rowDiff = Math.abs(currentRow - mouseStartCell.row);
    const colDiff = Math.abs(currentCol - mouseStartCell.col);
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        clearSelection();
        trySwap(mouseStartCell.row, mouseStartCell.col, currentRow, currentCol);
        mouseDown = false;
        mouseStartCell = null;
    }
}

function handleMouseUp(e) {
    if (gameState.activeItem === 'bomb' && mouseStartCell) {
        useBomb(mouseStartCell.row, mouseStartCell.col);
    }
    mouseDown = false;
    mouseStartCell = null;
    clearBombRange();
}

// ═══════════════════════════════════════════════════
//  尝试交换（修复：combo 在外层重置）
// ═══════════════════════════════════════════════════
async function trySwap(row1, col1, row2, col2) {
    if (row2 < 0 || row2 >= CONFIG.BOARD_ROWS || col2 < 0 || col2 >= CONFIG.BOARD_COLS) return;
    clearSelection();
    await animateSwap(row1, col1, row2, col2);
    swapCells(row1, col1, row2, col2);
    const matches = findMatches();

    if (matches.length > 0) {
        playSound('swap');
        // 无焦虑设计：移除步数扣减，改为获得爱心饼干奖励（每次有效消除 +1）
        gameState.cookies += 1;
        updateUI();
        gameState.combo = 0; // ★ 修复1：combo 重置在外层
        await processMatches();
        checkGameState();
    } else {
        // 无消除，换回
        await animateSwap(row1, col1, row2, col2);
        swapCells(row1, col1, row2, col2);
    }
}

// 交换动画
function animateSwap(row1, col1, row2, col2) {
    return new Promise(resolve => {
        const cell1 = getCellElement(row1, col1);
        const cell2 = getCellElement(row2, col2);
        if (!cell1 || !cell2) { resolve(); return; }
        cell1.classList.add('swapping');
        cell2.classList.add('swapping');
        const dx = (col2 - col1) * 100;
        const dy = (row2 - row1) * 100;
        cell1.style.transform = `translate(${dx}%, ${dy}%)`;
        cell2.style.transform = `translate(${-dx}%, ${-dy}%)`;
        setTimeout(() => {
            cell1.style.transform = '';
            cell2.style.transform = '';
            cell1.classList.remove('swapping');
            cell2.classList.remove('swapping');
            resolve();
        }, CONFIG.ANIMATION_DURATION);
    });
}

function swapCells(row1, col1, row2, col2) {
    const temp = gameState.board[row1][col1];
    gameState.board[row1][col1] = gameState.board[row2][col2];
    gameState.board[row2][col2] = temp;
}

// ═══════════════════════════════════════════════════
//  匹配检测（增强版）：支持3/4/5/L型/十字消
// ═══════════════════════════════════════════════════

/**
 * 扫描棋盘上所有横/竖连线（≥3），返回原始行组和列组
 * @returns {{ hLines: Array, vLines: Array }}
 *   每条线: { cells: [{row,col},...], type: catType }
 */
function scanLines() {
    const hLines = []; // 横向连线
    const vLines = []; // 纵向连线

    // 横向扫描
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        let col = 0;
        while (col < CONFIG.BOARD_COLS) {
            const cell = gameState.board[row][col];
            if (!cell || cell.obstacle || cell.special) { col++; continue; }
            let end = col + 1;
            while (end < CONFIG.BOARD_COLS) {
                const next = gameState.board[row][end];
                if (next && !next.obstacle && !next.special && next.type === cell.type) {
                    end++;
                } else break;
            }
            if (end - col >= CONFIG.MATCH_MIN) {
                const cells = [];
                for (let c = col; c < end; c++) cells.push({ row, col: c });
                hLines.push({ cells, type: cell.type });
            }
            col = end;
        }
    }

    // 纵向扫描
    for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
        let row = 0;
        while (row < CONFIG.BOARD_ROWS) {
            const cell = gameState.board[row][col];
            if (!cell || cell.obstacle || cell.special) { row++; continue; }
            let end = row + 1;
            while (end < CONFIG.BOARD_ROWS) {
                const next = gameState.board[end][col];
                if (next && !next.obstacle && !next.special && next.type === cell.type) {
                    end++;
                } else break;
            }
            if (end - row >= CONFIG.MATCH_MIN) {
                const cells = [];
                for (let r = row; r < end; r++) cells.push({ row: r, col });
                vLines.push({ cells, type: cell.type });
            }
            row = end;
        }
    }

    return { hLines, vLines };
}

/**
 * 将原始连线合并为带形状标注的"匹配组"
 * 优先级：5消 > L/十字 > 4消 > 3消
 * @returns {Array<{ cells: [{row,col}], shape: MATCH_SHAPE, pivotRow: number, pivotCol: number }>}
 *   pivot = 建议生成特殊道具的位置（交叉点或连线中点）
 */
function findMatchGroups() {
    const { hLines, vLines } = scanLines();
    const groups = [];
    const consumed = new Set(); // 已被合并的行/列索引

    const cellKey = (r, c) => `${r},${c}`;

    // 找两条线的交叉单元格
    function getIntersection(lineA, lineB) {
        const setA = new Set(lineA.cells.map(p => cellKey(p.row, p.col)));
        return lineB.cells.find(p => setA.has(cellKey(p.row, p.col)));
    }

    // 尝试将一条横线与一条纵线合并为 L型 或 十字
    function tryMerge(hIdx, vIdx) {
        const hLine = hLines[hIdx];
        const vLine = vLines[vIdx];
        if (!hLine || !vLine) return null;
        if (hLine.type !== vLine.type) return null;
        const pivot = getIntersection(hLine, vLine);
        if (!pivot) return null;

        // 合并去重
        const merged = new Map();
        [...hLine.cells, ...vLine.cells].forEach(p => merged.set(cellKey(p.row, p.col), p));
        const cells = [...merged.values()];

        // 判断形状：
        //   横线长度 >=3 + 纵线长度 >=3，且交叉 → 十字(CROSS) 或 L型(L_SHAPE)
        //   区分：两条线都从交叉点向两侧延伸 → 十字；否则 → L型
        const hLeft  = hLine.cells.filter(p => p.col < pivot.col).length;
        const hRight = hLine.cells.filter(p => p.col > pivot.col).length;
        const vUp    = vLine.cells.filter(p => p.row < pivot.row).length;
        const vDown  = vLine.cells.filter(p => p.row > pivot.row).length;
        const isCross = hLeft > 0 && hRight > 0 && vUp > 0 && vDown > 0;
        const shape = isCross ? MATCH_SHAPE.CROSS : MATCH_SHAPE.L_SHAPE;

        return { cells, shape, pivotRow: pivot.row, pivotCol: pivot.col };
    }

    // ── 第一轮：优先合并 L型/十字 ──
    const hUsed = new Set();
    const vUsed = new Set();

    for (let hi = 0; hi < hLines.length; hi++) {
        for (let vi = 0; vi < vLines.length; vi++) {
            if (hUsed.has(hi) || vUsed.has(vi)) continue;
            const merged = tryMerge(hi, vi);
            if (merged) {
                groups.push(merged);
                hUsed.add(hi);
                vUsed.add(vi);
            }
        }
    }

    // ── 第二轮：处理剩余未合并的横线 ──
    for (let hi = 0; hi < hLines.length; hi++) {
        if (hUsed.has(hi)) continue;
        const line = hLines[hi];
        const len = line.cells.length;
        let shape;
        if (len >= 5) shape = MATCH_SHAPE.LINE5;
        else if (len === 4) shape = MATCH_SHAPE.LINE4;
        else shape = MATCH_SHAPE.LINE3;
        const mid = line.cells[Math.floor(len / 2)];
        groups.push({ cells: line.cells, shape, pivotRow: mid.row, pivotCol: mid.col });
    }

    // ── 第三轮：处理剩余未合并的纵线 ──
    for (let vi = 0; vi < vLines.length; vi++) {
        if (vUsed.has(vi)) continue;
        const line = vLines[vi];
        const len = line.cells.length;
        let shape;
        if (len >= 5) shape = MATCH_SHAPE.LINE5;
        else if (len === 4) shape = MATCH_SHAPE.LINE4;
        else shape = MATCH_SHAPE.LINE3;
        const mid = line.cells[Math.floor(len / 2)];
        groups.push({ cells: line.cells, shape, pivotRow: mid.row, pivotCol: mid.col });
    }

    return groups;
}

/**
 * 兼容接口：返回扁平的匹配格子数组（供 hasValidMoves 使用）
 */
function findMatches() {
    const groups = findMatchGroups();
    const visited = new Set();
    const result = [];
    groups.forEach(g => {
        g.cells.forEach(pos => {
            const key = `${pos.row},${pos.col}`;
            if (!visited.has(key)) {
                visited.add(key);
                result.push(pos);
            }
        });
    });
    return result;
}

/** 原始行扫描辅助（仅供 hasValidMoves 内部临时 swap 检测使用） */
function checkLine(startRow, startCol, dRow, dCol) {
    const match = [];
    const cell = gameState.board[startRow][startCol];
    if (!cell || cell.obstacle) return [];
    let row = startRow, col = startCol;
    while (row >= 0 && row < CONFIG.BOARD_ROWS && col >= 0 && col < CONFIG.BOARD_COLS) {
        const current = gameState.board[row][col];
        if (current && !current.obstacle && current.type === cell.type) {
            match.push({ row, col });
            row += dRow; col += dCol;
        } else break;
    }
    return match;
}

// ═══════════════════════════════════════════════════
//  消除流程（增强版：携带形状信息）
// ═══════════════════════════════════════════════════
async function processMatches() {
    gameState.isAnimating = true;
    let hasMatches = true;

    while (hasMatches) {
        const groups = findMatchGroups();
        if (groups.length > 0) {
            gameState.combo++;

            // 收集所有需要消除的格子（去重）
            const visited = new Set();
            const allCells = [];
            groups.forEach(g => {
                g.cells.forEach(pos => {
                    const key = `${pos.row},${pos.col}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        allCells.push(pos);
                    }
                });
            });

            // 计分（带 buff 加成和亲密度加成）
            const baseScore = allCells.length * CONFIG.BASE_SCORE;
            const comboBonus = Math.pow(CONFIG.COMBO_MULTIPLIER, gameState.combo - 1);
            const buffMultiplier = BuffManager ? BuffManager.getScoreMultiplier() : 1;

            // 计算亲密度加成（根据消除的猫咪类型）
            let affinityMultiplier = 1;
            const catTypeCount = {};
            allCells.forEach(pos => {
                const cell = gameState.board[pos.row][pos.col];
                if (cell && cell.type) {
                    catTypeCount[cell.type] = (catTypeCount[cell.type] || 0) + 1;
                }
            });

            // 增加亲密度经验并计算加成
            Object.entries(catTypeCount).forEach(([catType, count]) => {
                const type = parseInt(catType);
                // 每只猫咪每次消除获得1-3点经验
                const expGain = Math.min(3, count);
                const result = AffinityManager.addExp(type, expGain);

                // 如果升级了，显示升级提示
                if (result.leveledUp) {
                    showAffinityLevelUp(type, result.newLevel, result.unlockedStory);
                }

                // 累加亲密度得分加成
                affinityMultiplier += (AffinityManager.getScoreBonus(type) - 1) * (count / allCells.length);
            });

            gameState.score += Math.floor(baseScore * comboBonus * buffMultiplier * affinityMultiplier);

            if (gameState.combo > 1) {
                showCombo(gameState.combo);
                playSound('combo', gameState.combo);
            } else {
                // 根据最高阶形状选择音效
                const topShape = getTopShape(groups);
                if (topShape === MATCH_SHAPE.LINE5 || topShape === MATCH_SHAPE.CROSS) {
                    playSound('bomb'); // 大消除感
                } else if (topShape === MATCH_SHAPE.LINE4 || topShape === MATCH_SHAPE.L_SHAPE) {
                    playSound('bell'); // 特殊道具生成提示音
                } else {
                    playSound('match');
                }
            }

            // ★ 先统计目标进度（格子还未被 null 化）
            updateTargetProgress(allCells);

            await animateMatches(allCells);

            // 消除格子（特殊道具格子不消除，由 processSpecialCats 处理）
            allCells.forEach(pos => {
                gameState.board[pos.row][pos.col] = null;
            });

            // 特殊道具生成（携带 groups 信息）
            await processSpecialCats(groups);
            await dropAndFill();
            updateUI();
        } else {
            hasMatches = false;
        }
    }

    if (!hasValidMoves()) await shuffleBoard();

    // Buff 回合减少
    BuffManager.onMatchEnd();

    // 尝试触发猫咪蹭屏互动
    CatInteractionManager.tryTrigger(gameState.combo);

    gameState.isAnimating = false;
}

/**
 * 从 groups 中取优先级最高的形状
 * 优先级：LINE5 = CROSS > L_SHAPE > LINE4 > LINE3
 */
function getTopShape(groups) {
    const priority = {
        [MATCH_SHAPE.LINE5]: 5,
        [MATCH_SHAPE.CROSS]: 5,
        [MATCH_SHAPE.L_SHAPE]: 4,
        [MATCH_SHAPE.LINE4]: 3,
        [MATCH_SHAPE.LINE3]: 1,
    };
    return groups.reduce((best, g) => {
        return (priority[g.shape] || 0) > (priority[best] || 0) ? g.shape : best;
    }, MATCH_SHAPE.LINE3);
}

// 消除动画
function animateMatches(matches) {
    return new Promise(resolve => {
        matches.forEach(pos => {
            const cell = getCellElement(pos.row, pos.col);
            if (cell) cell.classList.add('matched');
        });
        matches.forEach(pos => createParticles(pos.row, pos.col));

        // 悠闲模式：添加特殊粒子效果
        if (gameState.gameMode === 'relax' && matches.length > 0) {
            const firstMatch = matches[0];
            const cell = getCellElement(firstMatch.row, firstMatch.col);
            if (cell) {
                const rect = cell.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                RelaxModeManager.createMatchParticles(centerX, centerY);
            }
        }

        setTimeout(resolve, CONFIG.ANIMATION_DURATION);
    });
}

// 粒子特效
function createParticles(row, col) {
    const cell = getCellElement(row, col);
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const boardRect = DOM.board.getBoundingClientRect();
    const colors = ['#FF6B9D', '#88D8E8', '#FFD93D', '#A8E6CF', '#FFB6C1', '#C8A8E9'];

    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top - boardRect.top + rect.height / 2}px`;
        const angle = (Math.PI * 2 * i) / 10;
        const distance = 30 + Math.random() * 40;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        DOM.effectsLayer.appendChild(particle);
        setTimeout(() => particle.remove(), 850);
    }
}

// ═══════════════════════════════════════════════════
//  下落和填充（修复：仅对新格子添加动画）
// ═══════════════════════════════════════════════════
async function dropAndFill() {
    // 记录需要播放下落动画的格子 {row, col}
    const fallingCells = [];

    for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
        let emptyRow = CONFIG.BOARD_ROWS - 1;

        for (let row = CONFIG.BOARD_ROWS - 1; row >= 0; row--) {
            if (gameState.board[row][col] !== null) {
                if (row !== emptyRow) {
                    gameState.board[emptyRow][col] = gameState.board[row][col];
                    gameState.board[row][col] = null;
                    // ★ 修复3：记录下落后的目标位置
                    fallingCells.push({ row: emptyRow, col });
                }
                emptyRow--;
            }
        }

        // 填充新猫咪
        for (let row = emptyRow; row >= 0; row--) {
            gameState.board[row][col] = createRandomCat();
            fallingCells.push({ row, col });
        }
    }

    renderBoard();
    await animateFall(fallingCells);
}

// ★ 修复3：只对指定格子播放下落动画
function animateFall(fallingCells) {
    return new Promise(resolve => {
        if (!fallingCells || fallingCells.length === 0) {
            resolve();
            return;
        }
        fallingCells.forEach(({ row, col }) => {
            const cell = getCellElement(row, col);
            if (cell) cell.classList.add('falling');
        });
        setTimeout(() => {
            fallingCells.forEach(({ row, col }) => {
                const cell = getCellElement(row, col);
                if (cell) cell.classList.remove('falling');
            });
            resolve();
        }, CONFIG.ANIMATION_DURATION);
    });
}

function createRandomCat() {
    return {
        type: Math.floor(Math.random() * CONFIG.CAT_TYPES) + 1,
        special: null,
        obstacle: null,
    };
}

// ═══════════════════════════════════════════════════
//  特殊道具系统（Special Item System）
// ═══════════════════════════════════════════════════

/**
 * 特殊道具定义
 * - heart:  猫咪爱心 💖 — 4消生成，消除 3×3 区域
 * - pillow: 呼噜抱枕 🛏️ — 5消生成，消除整行+整列
 * - gift:   零食礼盒 🎁 — L型/十字消生成，区域爆炸+随机buff
 */
const SPECIAL_ITEMS = {
    [SPECIAL_TYPES.HEART]: {
        name: '猫咪爱心',
        icon: '💖',
        effect: 'bomb3x3',
        description: '消除周围 3×3 区域',
        color: '#FF6B9D',
    },
    [SPECIAL_TYPES.PILLOW]: {
        name: '呼噜抱枕',
        icon: '🛏️',
        effect: 'cross',
        description: '消除整行+整列',
        color: '#C8A8E9',
    },
    [SPECIAL_TYPES.GIFT]: {
        name: '零食礼盒',
        icon: '🎁',
        effect: 'area+buff',
        description: '区域爆炸+随机治愈buff',
        color: '#FFD93D',
    },
};

/**
 * 根据消除形状决定生成的特殊道具类型
 */
function getSpecialTypeByShape(shape) {
    switch (shape) {
        case MATCH_SHAPE.LINE4:
            return SPECIAL_TYPES.HEART;
        case MATCH_SHAPE.LINE5:
            return SPECIAL_TYPES.PILLOW;
        case MATCH_SHAPE.L_SHAPE:
        case MATCH_SHAPE.CROSS:
            return SPECIAL_TYPES.GIFT;
        default:
            return null;
    }
}

/**
 * 处理特殊道具生成（增强版）
 * @param {Array} groups - findMatchGroups() 返回的分组数组
 */
async function processSpecialCats(groups) {
    for (const group of groups) {
        const specialType = getSpecialTypeByShape(group.shape);
        if (!specialType) continue;

        const { pivotRow, pivotCol } = group;
        const pivotCell = gameState.board[pivotRow][pivotCol];

        // 如果 pivot 位置已被消除（null），尝试找同组内未被消除的格子
        if (!pivotCell) {
            // 找第一个未被消除的格子作为替代
            const alt = group.cells.find(pos => gameState.board[pos.row][pos.col]);
            if (alt) {
                await spawnSpecialItem(alt.row, alt.col, specialType);
            }
        } else {
            await spawnSpecialItem(pivotRow, pivotCol, specialType);
        }
    }
}

/**
 * 在指定位置生成特殊道具
 */
async function spawnSpecialItem(row, col, specialType) {
    const cell = gameState.board[row][col];
    if (!cell) return;

    // 标记为特殊道具（保留原猫咪类型，以便触发时知道"谁"生成的道具）
    cell.special = specialType;

    // 视觉更新
    const el = getCellElement(row, col);
    if (el) {
        el.classList.add('special-item', `special-${specialType}`);
        el.dataset.special = specialType;

        // 生成动画
        el.style.animation = 'none';
        el.offsetHeight; // 强制重绘
        el.style.animation = 'specialSpawn 0.5s ease-out';

        // 添加道具图标
        let iconEl = el.querySelector('.special-icon');
        if (!iconEl) {
            iconEl = document.createElement('span');
            iconEl.className = 'special-icon';
            el.appendChild(iconEl);
        }
        iconEl.textContent = SPECIAL_ITEMS[specialType].icon;
    }

    // 播放生成音效
    playSound('bell');
}

/**
 * 触发特殊道具效果
 * @param {number} row - 道具所在行
 * @param {number} col - 道具所在列
 * @param {string} specialType - 道具类型
 * @returns {Array} - 需要额外消除的格子数组
 */
function triggerSpecialItem(row, col, specialType) {
    const toRemove = [];
    const item = SPECIAL_ITEMS[specialType];

    switch (specialType) {
        case SPECIAL_TYPES.HEART:
            // 猫咪爱心：消除周围 3×3 区域
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < CONFIG.BOARD_ROWS && c >= 0 && c < CONFIG.BOARD_COLS) {
                        toRemove.push({ row: r, col: c });
                    }
                }
            }
            createHeartExplosion(row, col);
            break;

        case SPECIAL_TYPES.PILLOW:
            // 呼噜抱枕：消除整行+整列
            for (let c = 0; c < CONFIG.BOARD_COLS; c++) {
                toRemove.push({ row, col: c });
            }
            for (let r = 0; r < CONFIG.BOARD_ROWS; r++) {
                if (r !== row) toRemove.push({ row: r, col }); // 避免重复添加交叉点
            }
            createPillowEffect(row, col);
            break;

        case SPECIAL_TYPES.GIFT:
            // 零食礼盒：区域爆炸 + 随机buff
            for (let r = row - 2; r <= row + 2; r++) {
                for (let c = col - 2; c <= col + 2; c++) {
                    if (r >= 0 && r < CONFIG.BOARD_ROWS && c >= 0 && c < CONFIG.BOARD_COLS) {
                        toRemove.push({ row: r, col: c });
                    }
                }
            }
            createGiftEffect(row, col);
            // 触发随机治愈buff
            if (typeof BuffManager !== 'undefined' && BuffManager.triggerRandomBuff) {
                BuffManager.triggerRandomBuff();
            }
            break;
    }

    // 播放对应音效
    playSound('bomb');

    return toRemove;
}

/**
 * 检查点击的格子是否是特殊道具，如果是则触发效果
 * @returns {boolean} - 是否触发了特殊道具
 */
function tryTriggerSpecialItem(row, col) {
    const cell = gameState.board[row][col];
    if (!cell || !cell.special) return false;

    const specialType = cell.special;

    // 触发效果，获取需要额外消除的格子
    const extraRemoves = triggerSpecialItem(row, col, specialType);

    // 清除该格子的特殊标记（道具已使用）
    cell.special = null;

    // 视觉清理
    const el = getCellElement(row, col);
    if (el) {
        el.classList.remove('special-item', `special-${specialType}`);
        delete el.dataset.special;
        const iconEl = el.querySelector('.special-icon');
        if (iconEl) iconEl.remove();
    }

    // 将额外消除的格子加入消除队列（在 processMatches 中处理）
    if (extraRemoves.length > 0) {
        // 使用全局变量传递额外消除请求
        gameState.pendingSpecialRemoves = extraRemoves;
    }

    return true;
}

// ═══════════════════════════════════════════════════
//  特殊道具视觉特效
// ═══════════════════════════════════════════════════

/** 猫咪爱心爆炸特效 */
function createHeartExplosion(row, col) {
    const cell = getCellElement(row, col);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const boardRect = DOM.board.getBoundingClientRect();
    const centerX = rect.left - boardRect.left + rect.width / 2;
    const centerY = rect.top - boardRect.top + rect.height / 2;

    // 创建心形扩散光环
    const heartRing = document.createElement('div');
    heartRing.className = 'heart-explosion-ring';
    heartRing.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 60px;
        height: 60px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,107,157,0.6) 0%, transparent 70%);
        pointer-events: none;
        animation: heartRingExpand 0.6s ease-out forwards;
    `;
    DOM.effectsLayer.appendChild(heartRing);
    setTimeout(() => heartRing.remove(), 600);

    // 飘出爱心粒子
    for (let i = 0; i < 8; i++) {
        const heart = document.createElement('div');
        heart.textContent = '💖';
        heart.style.cssText = `
            position: absolute;
            left: ${centerX}px;
            top: ${centerY}px;
            font-size: 20px;
            pointer-events: none;
            animation: heartFloat${i % 4} 0.8s ease-out forwards;
        `;
        DOM.effectsLayer.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
    }
}

/** 呼噜抱枕特效 */
function createPillowEffect(row, col) {
    const cell = getCellElement(row, col);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const boardRect = DOM.board.getBoundingClientRect();
    const centerX = rect.left - boardRect.left + rect.width / 2;
    const centerY = rect.top - boardRect.top + rect.height / 2;

    // 十字光线
    const hLine = document.createElement('div');
    hLine.className = 'pillow-line horizontal';
    hLine.style.cssText = `
        position: absolute;
        left: 0;
        top: ${centerY - 2}px;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, transparent, #C8A8E9, transparent);
        pointer-events: none;
        animation: pillowLineFade 0.5s ease-out forwards;
    `;

    const vLine = document.createElement('div');
    vLine.className = 'pillow-line vertical';
    vLine.style.cssText = `
        position: absolute;
        left: ${centerX - 2}px;
        top: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, transparent, #C8A8E9, transparent);
        pointer-events: none;
        animation: pillowLineFade 0.5s ease-out forwards;
    `;

    DOM.effectsLayer.appendChild(hLine);
    DOM.effectsLayer.appendChild(vLine);
    setTimeout(() => {
        hLine.remove();
        vLine.remove();
    }, 500);

    // Zzz 飘出效果
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const zzz = document.createElement('div');
            zzz.textContent = 'Zzz';
            zzz.style.cssText = `
                position: absolute;
                left: ${centerX + (Math.random() - 0.5) * 40}px;
                top: ${centerY - 20}px;
                font-size: 14px;
                color: #C8A8E9;
                font-weight: bold;
                pointer-events: none;
                animation: zzzFloat 1s ease-out forwards;
            `;
            DOM.effectsLayer.appendChild(zzz);
            setTimeout(() => zzz.remove(), 1000);
        }, i * 150);
    }
}

/** 零食礼盒特效 */
function createGiftEffect(row, col) {
    const cell = getCellElement(row, col);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const boardRect = DOM.board.getBoundingClientRect();
    const centerX = rect.left - boardRect.left + rect.width / 2;
    const centerY = rect.top - boardRect.top + rect.height / 2;

    // 礼盒打开动画
    const giftBox = document.createElement('div');
    giftBox.textContent = '🎁';
    giftBox.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        font-size: 40px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: giftOpen 0.6s ease-out forwards;
    `;
    DOM.effectsLayer.appendChild(giftBox);

    // 彩带和零食飞出
    setTimeout(() => {
        giftBox.remove();
        const treats = ['🐟', '🍪', '🥛', '🍗', '🎀'];
        for (let i = 0; i < 10; i++) {
            const treat = document.createElement('div');
            treat.textContent = treats[Math.floor(Math.random() * treats.length)];
            treat.style.cssText = `
                position: absolute;
                left: ${centerX}px;
                top: ${centerY}px;
                font-size: 18px;
                pointer-events: none;
                animation: treatExplode 0.8s ease-out forwards;
                animation-delay: ${i * 30}ms;
            `;
            DOM.effectsLayer.appendChild(treat);
            setTimeout(() => treat.remove(), 800);
        }
    }, 400);
}

// ═══════════════════════════════════════════════════
//  有效移动检查（修复：精简 swap 冗余）
// ═══════════════════════════════════════════════════
function hasValidMoves() {
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            // ★ 修复4：统一 swap → check → swap-back 两步模式
            if (col < CONFIG.BOARD_COLS - 1) {
                swapCells(row, col, row, col + 1);
                const hasMatch = findMatches().length > 0;
                swapCells(row, col, row, col + 1); // 复原
                if (hasMatch) return true;
            }
            if (row < CONFIG.BOARD_ROWS - 1) {
                swapCells(row, col, row + 1, col);
                const hasMatch = findMatches().length > 0;
                swapCells(row, col, row + 1, col); // 复原
                if (hasMatch) return true;
            }
        }
    }
    return false;
}

// 洗牌
async function shuffleBoard() {
    const cats = [];
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++)
        for (let col = 0; col < CONFIG.BOARD_COLS; col++)
            if (gameState.board[row][col]) cats.push(gameState.board[row][col]);

    for (let i = cats.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cats[i], cats[j]] = [cats[j], cats[i]];
    }

    let index = 0;
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++)
        for (let col = 0; col < CONFIG.BOARD_COLS; col++)
            gameState.board[row][col] = cats[index++];

    playSound('shuffle');
    renderBoard();
    const all = [];
    for (let r = 0; r < CONFIG.BOARD_ROWS; r++)
        for (let c = 0; c < CONFIG.BOARD_COLS; c++)
            all.push({ row: r, col: c });
    await animateFall(all);

    if (!hasValidMoves()) await shuffleBoard();
}

// 更新目标进度（在格子清除前调用）
function updateTargetProgress(matches) {
    // 使用新的请求系统更新进度
    if (gameState.currentRequest) {
        updateRequestProgress(matches);
    }

    // 向后兼容：同时更新旧的目标系统
    if (!gameState.target) return;
    matches.forEach(pos => {
        const cell = gameState.board[pos.row][pos.col];
        if (cell && cell.type === gameState.target.catType) {
            gameState.targetProgress++;
        }
    });
}

// 显示连击
function showCombo(combo) {
    const texts = ['', '', 'Nice!', 'Great!', 'Awesome!', 'Amazing!', 'Incredible!', 'Godlike!'];
    const text = texts[Math.min(combo, texts.length - 1)] || 'LEGENDARY!';
    DOM.comboText.textContent = `${combo}连击! ${text}`;
    DOM.comboDisplay.classList.remove('hidden');
    setTimeout(() => DOM.comboDisplay.classList.add('hidden'), 700);
}

// ═══════════════════════════════════════════════════
//  棋盘渲染
// ═══════════════════════════════════════════════════
function renderBoard() {
    DOM.board.innerHTML = '';
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            const catData = gameState.board[row][col];
            if (catData && catData.type) {
                const cat = document.createElement('img');
                cat.className = 'cat';
                cat.src = `assets/images/cats/${CAT_TYPES[catData.type - 1].file}`;
                cat.alt = CAT_TYPES[catData.type - 1].name;
                cat.onerror = () => { cat.style.display = 'none'; };
                cell.appendChild(cat);
                if (catData.special) cell.classList.add(`special-${catData.special}`);
                if (catData.obstacle) cell.classList.add(`obstacle-${catData.obstacle}`);
            }
            DOM.board.appendChild(cell);
        }
    }
}

function getCellElement(row, col) {
    return DOM.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function clearSelection() {
    if (gameState.selectedCell) {
        const cell = getCellElement(gameState.selectedCell.row, gameState.selectedCell.col);
        if (cell) cell.classList.remove('selected');
        gameState.selectedCell = null;
    }
}

// ═══════════════════════════════════════════════════
//  UI 更新
// ═══════════════════════════════════════════════════
function updateUI() {
    DOM.score.textContent = gameState.score;
    if (DOM.cookies) DOM.cookies.textContent = gameState.cookies;
    DOM.level.textContent = gameState.level;
    DOM.bombCount.textContent = gameState.items.bomb;
    DOM.shuffleCount.textContent = gameState.items.shuffle;
    DOM.refreshCount.textContent = gameState.items.refresh;
    DOM.hintCount.textContent = gameState.items.hint;
    document.querySelectorAll('.item').forEach(item => {
        const type = item.dataset.item;
        item.classList.toggle('disabled', gameState.items[type] <= 0);
    });

    // 更新请求UI（新的请求系统）
    updateRequestUI();

    // 向后兼容
    if (gameState.target && DOM.targetCount) {
        DOM.targetCount.textContent = Math.max(0, gameState.target.count - gameState.targetProgress);
    }
}

// ═══════════════════════════════════════════════════
//  猫咪小请求系统核心函数
// ═══════════════════════════════════════════════════

/**
 * 生成一个新的猫咪请求
 * @param {number} level - 当前关卡
 * @returns {Object} 请求对象
 */
function generateCatRequest(level) {
    // 根据关卡进度选择请求类型
    const requestTypeKeys = Object.keys(REQUEST_TYPES);
    const typeIndex = (level - 1) % requestTypeKeys.length;
    const requestType = REQUEST_TYPES[requestTypeKeys[typeIndex]];

    // 从模板库中随机选择一个
    const templates = REQUEST_TEMPLATES[requestType];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // 根据关卡调整目标数量
    const adjustedCount = Math.max(3, template.targetCount - Math.floor(level / 3));

    return {
        id: Date.now() + Math.random(),
        type: requestType,
        catType: template.catType,
        dialog: template.dialog,
        description: template.desc,
        targetCount: adjustedCount,
        currentProgress: 0,
        completed: false,
        thanksMessage: THANKS_MESSAGES[Math.floor(Math.random() * THANKS_MESSAGES.length)],
        action: CAT_ACTIONS[Math.floor(Math.random() * CAT_ACTIONS.length)],
    };
}

/**
 * 更新请求进度
 * @param {Array} matches - 消除的格子数组
 */
function updateRequestProgress(matches) {
    if (!gameState.currentRequest || gameState.currentRequest.completed) return;

    const request = gameState.currentRequest;
    let progressMade = 0;

    switch (request.type) {
        case REQUEST_TYPES.COLLECT:
            // 收集指定类型的猫咪
            matches.forEach(pos => {
                const cell = gameState.board[pos.row][pos.col];
                if (cell && cell.type === request.catType) {
                    progressMade++;
                }
            });
            break;

        case REQUEST_TYPES.FIND_PILLOW:
            // 找枕头：消除指定猫咪（模拟找到枕头）
            matches.forEach(pos => {
                const cell = gameState.board[pos.row][pos.col];
                if (cell && cell.type === request.catType) {
                    progressMade++;
                }
            });
            break;

        case REQUEST_TYPES.FEED_FISH:
            // 喂小鱼干：收集小鱼干（用猫咪类型代表小鱼干）
            matches.forEach(pos => {
                const cell = gameState.board[pos.row][pos.col];
                if (cell && cell.type === request.catType) {
                    progressMade++;
                }
            });
            break;

        case REQUEST_TYPES.CUDDLE:
            // 贴贴：消除配对猫咪
            matches.forEach(pos => {
                const cell = gameState.board[pos.row][pos.col];
                if (cell && cell.type === request.catType) {
                    progressMade++;
                }
            });
            break;
    }

    if (progressMade > 0) {
        request.currentProgress += progressMade;
        updateRequestUI();

        // 检查是否完成
        if (request.currentProgress >= request.targetCount && !request.completed) {
            completeRequest();
        }
    }
}

/**
 * 完成当前请求
 */
function completeRequest() {
    const request = gameState.currentRequest;
    request.completed = true;
    gameState.requestCompleted = true;

    // 记录完成历史
    gameState.completedRequests.push({
        ...request,
        completedAt: Date.now(),
    });

    // 显示请求完成提示
    if (DOM.requestCompleteHint) {
        DOM.requestCompleteHint.classList.remove('hidden');
        // 3秒后自动隐藏
        setTimeout(() => {
            if (DOM.requestCompleteHint) {
                DOM.requestCompleteHint.classList.add('hidden');
            }
        }, 3000);
    }

    // 播放感谢动画
    showCatThanksAnimation(request);

    // 奖励爱心饼干
    const bonusCookies = Math.floor(5 + gameState.level * 0.5);
    gameState.cookies += bonusCookies;

    // 播放音效
    playSound('win');

    updateUI();
}

/**
 * 显示猫咪感谢动画
 * @param {Object} request - 完成的请求
 */
function showCatThanksAnimation(request) {
    const catInfo = CAT_TYPES[request.catType - 1];

    // 创建感谢弹窗
    const thanksModal = document.createElement('div');
    thanksModal.id = 'cat-thanks-modal';
    thanksModal.innerHTML = `
        <div class="thanks-content">
            <div class="thanks-cat">
                <img src="assets/images/cats/${catInfo.file}" alt="${catInfo.name}" onerror="this.style.display='none'">
            </div>
            <div class="thanks-dialog">
                <div class="dialog-bubble">${request.thanksMessage}</div>
            </div>
            <div class="thanks-action">${request.action.emoji} ${request.action.action}</div>
            <div class="thanks-reward">获得 ${Math.floor(5 + gameState.level * 0.5)} 个爱心饼干！</div>
            <button class="btn btn-primary" onclick="closeThanksModal()">继续游戏</button>
        </div>
    `;

    thanksModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        animation: fadeIn 0.3s ease-out;
    `;

    // 添加样式
    const style = document.createElement('style');
    style.id = 'thanks-modal-style';
    style.textContent = `
        .thanks-content {
            background: linear-gradient(135deg, #FFE5EC, #FFF0F5);
            padding: 30px;
            border-radius: 25px;
            text-align: center;
            max-width: 320px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: thanksPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .thanks-cat {
            width: 100px;
            height: 100px;
            margin: 0 auto 15px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid #FFB3C6;
            box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        }
        .thanks-cat img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .dialog-bubble {
            background: white;
            padding: 15px 20px;
            border-radius: 20px;
            margin-bottom: 15px;
            font-size: 16px;
            color: #5D4E60;
            position: relative;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .dialog-bubble::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            border: 10px solid transparent;
            border-top-color: white;
        }
        .thanks-action {
            font-size: 24px;
            margin: 15px 0;
            animation: actionBounce 1s ease-in-out infinite;
        }
        .thanks-reward {
            color: #FF6B9D;
            font-weight: bold;
            font-size: 16px;
            margin: 15px 0;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes thanksPopIn {
            0% { transform: scale(0.5) translateY(50px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes actionBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(thanksModal);

    // 显示猫咪蹭屏效果
    showCatRubScreen(request.catType);
}

/**
 * 关闭感谢弹窗
 */
function closeThanksModal() {
    const modal = document.getElementById('cat-thanks-modal');
    const style = document.getElementById('thanks-modal-style');
    if (modal) modal.remove();
    if (style) style.remove();
}

/**
 * 显示亲密度升级提示
 * @param {number} catType - 猫咪类型
 * @param {number} newLevel - 新等级
 * @param {Object|null} unlockedStory - 解锁的剧情
 */
function showAffinityLevelUp(catType, newLevel, unlockedStory) {
    const catInfo = CAT_TYPES[catType - 1];
    const levelInfo = AFFINITY_LEVELS[newLevel];

    const levelUpModal = document.createElement('div');
    levelUpModal.id = 'affinity-levelup-modal';
    levelUpModal.innerHTML = `
        <div class="levelup-content">
            <div class="levelup-header">💖 亲密度升级！</div>
            <div class="levelup-cat">
                <img src="assets/images/cats/${catInfo.file}" alt="${catInfo.name}" onerror="this.style.display='none'">
                <div class="levelup-ring"></div>
            </div>
            <div class="levelup-info">
                <div class="levelup-cat-name">${catInfo.name}</div>
                <div class="levelup-level">${AFFINITY_LEVELS[newLevel - 1]?.name || ''} → ${levelInfo.name}</div>
                <div class="levelup-bonus">得分加成 +${Math.round((levelInfo.bonus - 1) * 100)}%</div>
            </div>
            ${unlockedStory ? `
                <div class="levelup-story">
                    <div class="story-title">📖 解锁剧情：${unlockedStory.title}</div>
                    <div class="story-content">${unlockedStory.content}</div>
                </div>
            ` : ''}
            <button class="btn btn-primary" onclick="closeAffinityLevelUp()">太棒了！</button>
        </div>
    `;

    levelUpModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3500;
        animation: fadeIn 0.3s ease-out;
    `;

    // 添加样式
    const style = document.createElement('style');
    style.id = 'levelup-style';
    style.textContent = `
        .levelup-content {
            background: linear-gradient(135deg, #FFE5EC, #FFF0F5);
            padding: 30px;
            border-radius: 25px;
            text-align: center;
            max-width: 320px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: levelupPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .levelup-header {
            font-size: 20px;
            font-weight: bold;
            color: #FF6B9D;
            margin-bottom: 15px;
        }
        .levelup-cat {
            position: relative;
            width: 100px;
            height: 100px;
            margin: 0 auto 15px;
        }
        .levelup-cat img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #FFB3C6;
            box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        }
        .levelup-ring {
            position: absolute;
            inset: -10px;
            border: 3px solid #FFD93D;
            border-radius: 50%;
            animation: levelupRing 1s ease-out;
        }
        .levelup-info {
            margin-bottom: 15px;
        }
        .levelup-cat-name {
            font-size: 18px;
            font-weight: bold;
            color: #5D4E60;
        }
        .levelup-level {
            font-size: 16px;
            color: #FF6B9D;
            margin: 5px 0;
        }
        .levelup-bonus {
            font-size: 14px;
            color: #88D8E8;
            font-weight: bold;
        }
        .levelup-story {
            background: white;
            padding: 15px;
            border-radius: 15px;
            margin: 15px 0;
            text-align: left;
        }
        .story-title {
            font-size: 14px;
            font-weight: bold;
            color: #FF6B9D;
            margin-bottom: 8px;
        }
        .story-content {
            font-size: 13px;
            color: #5D4E60;
            line-height: 1.5;
        }
        @keyframes levelupPopIn {
            0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
            50% { transform: scale(1.1) rotate(3deg); }
            100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes levelupRing {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.3); opacity: 0; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(levelUpModal);

    playSound('win');
}

/**
 * 关闭亲密度升级提示
 */
function closeAffinityLevelUp() {
    const modal = document.getElementById('affinity-levelup-modal');
    const style = document.getElementById('levelup-style');
    if (modal) modal.remove();
    if (style) style.remove();
}

/**
 * 显示亲密度面板
 */
function showAffinityPanel() {
    const rankings = AffinityManager.getAffinityRanking();

    const panel = document.createElement('div');
    panel.id = 'affinity-panel';

    let catsHtml = rankings.map((cat, index) => {
        const levelInfo = AFFINITY_LEVELS[cat.level];
        const expToNext = AffinityManager.getExpToNextLevel(cat.catType);
        const progressPercent = expToNext > 0
            ? ((cat.exp - levelInfo.minExp) / (levelInfo.maxExp - levelInfo.minExp)) * 100
            : 100;

        return `
            <div class="affinity-cat-item ${index < 3 ? 'top-' + index : ''}">
                <div class="cat-rank">${index + 1}</div>
                <div class="cat-avatar">
                    <img src="assets/images/cats/${cat.catInfo.file}" alt="${cat.catInfo.name}" onerror="this.style.display='none'">
                </div>
                <div class="cat-affinity-info">
                    <div class="cat-name-level">
                        <span class="cat-name">${cat.catInfo.name}</span>
                        <span class="affinity-level" style="background: ${getAffinityColor(cat.level)}">${levelInfo.name}</span>
                    </div>
                    <div class="affinity-progress-bar">
                        <div class="affinity-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="affinity-exp">${cat.exp} EXP ${expToNext > 0 ? `(还需${expToNext}升级)` : '(已满级)'}</div>
                </div>
                <div class="affinity-bonus">x${levelInfo.bonus.toFixed(1)}</div>
            </div>
        `;
    }).join('');

    panel.innerHTML = `
        <div class="affinity-panel-content">
            <div class="affinity-panel-header">
                <h2>💖 猫咪亲密度</h2>
                <button class="close-btn" onclick="closeAffinityPanel()">✕</button>
            </div>
            <div class="affinity-cats-list">
                ${catsHtml}
            </div>
        </div>
    `;

    panel.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        animation: fadeIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.id = 'affinity-panel-style';
    style.textContent = `
        .affinity-panel-content {
            background: linear-gradient(135deg, #FFE5EC, #FFF0F5);
            width: 90%;
            max-width: 400px;
            max-height: 80vh;
            border-radius: 25px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: panelSlideUp 0.4s ease-out;
        }
        .affinity-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(90deg, #FF8FAB, #FFB3C6);
            color: white;
        }
        .affinity-panel-header h2 {
            font-size: 18px;
            margin: 0;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            color: white;
            cursor: pointer;
        }
        .affinity-cats-list {
            max-height: 60vh;
            overflow-y: auto;
            padding: 15px;
        }
        .affinity-cat-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: white;
            border-radius: 15px;
            margin-bottom: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .affinity-cat-item.top-0 { border: 2px solid #FFD93D; }
        .affinity-cat-item.top-1 { border: 2px solid #C0C0C0; }
        .affinity-cat-item.top-2 { border: 2px solid #CD7F32; }
        .cat-rank {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #F0F0F0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #5D4E60;
        }
        .cat-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #FFB3C6;
        }
        .cat-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .cat-affinity-info {
            flex: 1;
            min-width: 0;
        }
        .cat-name-level {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
        }
        .cat-name {
            font-weight: bold;
            color: #5D4E60;
            font-size: 14px;
        }
        .affinity-level {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 10px;
            color: white;
        }
        .affinity-progress-bar {
            height: 6px;
            background: #F0F0F0;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 3px;
        }
        .affinity-fill {
            height: 100%;
            background: linear-gradient(90deg, #FF8FAB, #FF6B9D);
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        .affinity-exp {
            font-size: 11px;
            color: #8B7B8E;
        }
        .affinity-bonus {
            font-size: 14px;
            font-weight: bold;
            color: #FF6B9D;
        }
        @keyframes panelSlideUp {
            0% { transform: translateY(50px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);
}

/**
 * 关闭亲密度面板
 */
function closeAffinityPanel() {
    const panel = document.getElementById('affinity-panel');
    const style = document.getElementById('affinity-panel-style');
    if (panel) panel.remove();
    if (style) style.remove();
}

/**
 * 根据等级获取颜色
 * @param {number} level - 等级
 * @returns {string} 颜色值
 */
function getAffinityColor(level) {
    const colors = {
        1: '#8B7B8E',
        2: '#88D8E8',
        3: '#A8E6CF',
        4: '#FFD93D',
        5: '#FFB3C6',
        6: '#FF8FAB',
        7: '#FF6B9D',
    };
    return colors[level] || '#8B7B8E';
}

/**
 * 显示猫咪蹭屏效果（请求完成时）
 * @param {number} catType - 猫咪类型
 */
function showCatRubScreen(catType) {
    const catInfo = CAT_TYPES[catType - 1];

    // 随机选择从哪边蹭入
    const sides = ['left', 'right', 'top', 'bottom'];
    const side = sides[Math.floor(Math.random() * sides.length)];

    // 创建蹭屏层 - 使用与 CatInteractionManager 一致的 CSS 类名
    const rubLayer = document.createElement('div');
    rubLayer.id = 'cat-rub-layer';
    rubLayer.className = `rub-side-${side}`;
    rubLayer.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2500;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.2);
        animation: rubLayerIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
    `;

    // 创建猫咪容器 - 使用 CSS 中定义的 rub-cat-container 类
    const catContainer = document.createElement('div');
    catContainer.className = 'rub-cat-container';
    catContainer.innerHTML = `
        <div class="rub-cat-avatar">
            <img src="assets/images/cats/${catInfo.file}" alt="${catInfo.name}" onerror="this.style.display='none'">
        </div>
        <div class="rub-cat-bubble">谢谢你的帮助~喵！</div>
    `;

    rubLayer.appendChild(catContainer);
    document.body.appendChild(rubLayer);

    // 播放感谢音效
    if (AudioManager && AudioManager.playSFX) {
        AudioManager.playSFX('meow');
    }

    // 3秒后移除
    setTimeout(() => {
        rubLayer.classList.add('rub-exit');
        setTimeout(() => {
            rubLayer.remove();
        }, 500);
    }, 3000);
}

/**
 * 更新请求UI显示
 */
function updateRequestUI() {
    const request = gameState.currentRequest;
    if (!request) return;

    const progressPercent = Math.min(100, (request.currentProgress / request.targetCount) * 100);
    const isCompleted = request.completed;

    // 更新请求描述
    if (DOM.requestDesc) {
        DOM.requestDesc.textContent = request.description;
    }

    // 更新状态标签
    if (DOM.requestStatus) {
        if (isCompleted) {
            DOM.requestStatus.textContent = '✓ 已完成';
            DOM.requestStatus.classList.add('completed');
        } else {
            DOM.requestStatus.textContent = '进行中';
            DOM.requestStatus.classList.remove('completed');
        }
    }

    // 更新进度条
    if (DOM.progressFill) {
        DOM.progressFill.style.width = `${progressPercent}%`;
        DOM.progressFill.classList.toggle('completed', isCompleted);
    }

    // 更新进度数字
    if (DOM.requestCurrent) {
        DOM.requestCurrent.textContent = Math.min(request.currentProgress, request.targetCount);
    }
    if (DOM.targetCount) {
        DOM.targetCount.textContent = request.targetCount;
    }

    // 更新目标猫咪图标
    if (DOM.targetCat) {
        DOM.targetCat.style.backgroundImage = `url(assets/images/cats/${CAT_TYPES[request.catType - 1].file})`;
    }

    // 向后兼容：更新旧的目标文本
    if (DOM.targetText) {
        DOM.targetText.innerHTML = `
            <span id="request-current">${Math.min(request.currentProgress, request.targetCount)}</span>
            /
            <span id="target-count">${request.targetCount}</span>
        `;
    }
}

/**
 * 获取当前请求进度百分比
 * @returns {number} 0-100
 */
function getRequestProgressPercent() {
    if (!gameState.currentRequest) return 0;
    const { currentProgress, targetCount } = gameState.currentRequest;
    return Math.min(100, (currentProgress / targetCount) * 100);
}

// ═══════════════════════════════════════════════════
//  关卡控制
// ═══════════════════════════════════════════════════
function startLevel(level) {
    gameState.level = level;
    gameState.score = 0;
    gameState.cookies = 0;       // 爱心饼干重置（每关从0开始积累）
    gameState.combo = 0;
    gameState.isAnimating = false;
    gameState.selectedCell = null;
    gameState.activeItem = null;
    gameState.isPaused = false;
    gameState.requestCompleted = false;

    // 重置 Buff 系统
    if (BuffManager) BuffManager.reset();

    // 生成新的猫咪请求（替代原有目标系统）
    gameState.currentRequest = generateCatRequest(level);
    gameState.target = {  // 向后兼容
        catType: gameState.currentRequest.catType,
        count: gameState.currentRequest.targetCount,
    };
    gameState.targetProgress = 0;

    // 确保请求完成提示是隐藏的
    if (DOM.requestCompleteHint) {
        DOM.requestCompleteHint.classList.add('hidden');
    }

    initBoard();
    while (!hasValidMoves()) initBoard();

    renderBoard();
    updateUI();
    updateRequestUI();

    // 显示请求介绍
    setTimeout(() => {
        showRequestIntro(gameState.currentRequest);
    }, 500);

    // BGM
    AudioManager.init();
    AudioManager.stopBGM();
    setTimeout(() => {
        if (!gameState.isPaused) AudioManager.startBGM();
    }, 300);
}

/**
 * 显示请求介绍
 * @param {Object} request - 请求对象
 */
function showRequestIntro(request) {
    const catInfo = CAT_TYPES[request.catType - 1];

    const intro = document.createElement('div');
    intro.id = 'request-intro';
    intro.innerHTML = `
        <div class="intro-content">
            <div class="intro-cat">
                <img src="assets/images/cats/${catInfo.file}" alt="${catInfo.name}" onerror="this.style.display='none'">
            </div>
            <div class="intro-dialog">
                <div class="dialog-bubble">${request.dialog}</div>
            </div>
            <div class="intro-target">${request.description} x${request.targetCount}</div>
            <button class="btn btn-primary" onclick="closeRequestIntro()">好的，我来帮你！</button>
        </div>
    `;

    intro.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        animation: fadeIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.id = 'intro-style';
    style.textContent = `
        .intro-content {
            background: linear-gradient(135deg, #FFE5EC, #FFF0F5);
            padding: 30px;
            border-radius: 25px;
            text-align: center;
            max-width: 300px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: introPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .intro-cat {
            width: 90px;
            height: 90px;
            margin: 0 auto 15px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid #FFB3C6;
            box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        }
        .intro-cat img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .intro-target {
            color: #FF6B9D;
            font-weight: bold;
            font-size: 16px;
            margin: 15px 0;
        }
        @keyframes introPopIn {
            0% { transform: scale(0.5) translateY(50px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(intro);
}

/**
 * 关闭请求介绍
 */
function closeRequestIntro() {
    const intro = document.getElementById('request-intro');
    const style = document.getElementById('intro-style');
    if (intro) intro.remove();
    if (style) style.remove();
}

function initBoard() {
    gameState.board = [];
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            gameState.board[row][col] = createRandomCat();
        }
    }
    removeInitialMatches();
}

function removeInitialMatches() {
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            while (col >= 2 &&
                   gameState.board[row][col].type === gameState.board[row][col-1].type &&
                   gameState.board[row][col].type === gameState.board[row][col-2].type) {
                gameState.board[row][col] = createRandomCat();
            }
            while (row >= 2 &&
                   gameState.board[row][col].type === gameState.board[row-1][col].type &&
                   gameState.board[row][col].type === gameState.board[row-2][col].type) {
                gameState.board[row][col] = createRandomCat();
            }
        }
    }
}

// ═══════════════════════════════════════════════════
//  游戏状态检查（无焦虑：只有达成奖励，没有失败）
// ═══════════════════════════════════════════════════
function checkGameState() {
    // 悠闲模式：不检查关卡完成，无限游玩
    if (gameState.gameMode === 'relax') {
        return;
    }

    // 使用新的请求系统检查完成状态
    if (gameState.currentRequest && gameState.currentRequest.completed && !gameState.requestCompleted) {
        // 请求已完成，显示感谢动画已在 completeRequest 中处理
        gameState.requestCompleted = true;
        return;
    }

    // 向后兼容：检查旧的目标系统
    if (gameState.target && gameState.targetProgress >= gameState.target.count) {
        setTimeout(() => {
            playSound('win');
            showWinModal();
        }, 400);
    }
    // 无焦虑设计：移除步数耗尽失败判断，玩家可以永远继续消除
}

function showWinModal() {
    document.getElementById('final-score').textContent = gameState.score;
    // 奖励星级改为基于爱心饼干数量（每关目标消除次数越少，获星越多）
    const bonus = gameState.cookies;
    let stars = 1;
    if (bonus >= 15) stars = 3;
    else if (bonus >= 8) stars = 2;
    document.querySelectorAll('.star').forEach((star, i) => {
        star.classList.toggle('active', i < stars);
    });
    showModal(DOM.winModal);
}

function showModal(modal) { modal.classList.remove('hidden'); }
function hideModal(modal) { modal.classList.add('hidden'); }

// ═══════════════════════════════════════════════════
//  暂停 / 继续（同步 BGM）
// ═══════════════════════════════════════════════════
function pauseGame() {
    gameState.isPaused = true;
    AudioManager.stopBGM();
    showModal(DOM.pauseModal);
}

function resumeGame() {
    gameState.isPaused = false;
    hideModal(DOM.pauseModal);
    AudioManager.startBGM();
}

// ═══════════════════════════════════════════════════
//  道具系统
// ═══════════════════════════════════════════════════
function handleItemClick(itemType) {
    if (gameState.items[itemType] <= 0 || gameState.isAnimating) return;

    if (gameState.activeItem === itemType) {
        gameState.activeItem = null;
        document.querySelector(`[data-item="${itemType}"]`).classList.remove('active');
        DOM.board.classList.remove('bomb-mode');
    } else {
        if (gameState.activeItem) {
            document.querySelector(`[data-item="${gameState.activeItem}"]`).classList.remove('active');
        }
        gameState.activeItem = itemType;
        document.querySelector(`[data-item="${itemType}"]`).classList.add('active');

        if (itemType === 'bomb') {
            DOM.board.classList.add('bomb-mode');
        } else {
            DOM.board.classList.remove('bomb-mode');
        }

        if (itemType === 'shuffle') useShuffle();
        else if (itemType === 'refresh') useRefresh();
        else if (itemType === 'hint') useHint();
    }
}

async function useBomb(row, col) {
    if (gameState.items.bomb <= 0) return;
    gameState.items.bomb--;
    gameState.activeItem = null;
    DOM.board.classList.remove('bomb-mode');
    document.querySelector('[data-item="bomb"]').classList.remove('active');

    const toRemove = [];
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < CONFIG.BOARD_ROWS && c >= 0 && c < CONFIG.BOARD_COLS) {
                toRemove.push({ row: r, col: c });
            }
        }
    }

    playSound('bomb');
    await animateMatches(toRemove);
    toRemove.forEach(pos => { gameState.board[pos.row][pos.col] = null; });
    gameState.score += toRemove.length * CONFIG.BASE_SCORE;
    updateUI();
    await dropAndFill();
    gameState.combo = 0;
    await processMatches();
    checkGameState();
}

function showBombRange(row, col) {
    clearBombRange();
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            const cell = getCellElement(r, c);
            if (cell) cell.classList.add('bomb-target');
        }
    }
}

function clearBombRange() {
    document.querySelectorAll('.bomb-target').forEach(cell => cell.classList.remove('bomb-target'));
}

async function useShuffle() {
    if (gameState.items.shuffle <= 0) return;
    gameState.items.shuffle--;
    gameState.activeItem = null;
    document.querySelector('[data-item="shuffle"]').classList.remove('active');
    await shuffleBoard();
    updateUI();
}

async function useRefresh() {
    if (gameState.items.refresh <= 0) return;
    gameState.items.refresh--;
    gameState.activeItem = null;
    document.querySelector('[data-item="refresh"]').classList.remove('active');
    initBoard();
    while (!hasValidMoves()) initBoard();
    renderBoard();
    const all = [];
    for (let r = 0; r < CONFIG.BOARD_ROWS; r++)
        for (let c = 0; c < CONFIG.BOARD_COLS; c++)
            all.push({ row: r, col: c });
    await animateFall(all);
    updateUI();
}

function useHint() {
    if (gameState.items.hint <= 0) return;
    gameState.items.hint--;
    gameState.activeItem = null;
    document.querySelector('[data-item="hint"]').classList.remove('active');

    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            if (col < CONFIG.BOARD_COLS - 1) {
                swapCells(row, col, row, col + 1);
                const hasMatch = findMatches().length > 0;
                swapCells(row, col, row, col + 1);
                if (hasMatch) {
                    playSound('hint');
                    showHint(row, col, row, col + 1);
                    updateUI();
                    return;
                }
            }
            if (row < CONFIG.BOARD_ROWS - 1) {
                swapCells(row, col, row + 1, col);
                const hasMatch = findMatches().length > 0;
                swapCells(row, col, row + 1, col);
                if (hasMatch) {
                    playSound('hint');
                    showHint(row, col, row + 1, col);
                    updateUI();
                    return;
                }
            }
        }
    }
}

function showHint(row1, col1, row2, col2) {
    const cell1 = getCellElement(row1, col1);
    const cell2 = getCellElement(row2, col2);
    if (cell1) cell1.classList.add('hint');
    if (cell2) cell2.classList.add('hint');
    setTimeout(() => {
        if (cell1) cell1.classList.remove('hint');
        if (cell2) cell2.classList.remove('hint');
    }, 2000);
}

// ═══════════════════════════════════════════════════
//  Buff 视觉特效
// ═══════════════════════════════════════════════════

/** 显示 Buff 获得通知 */
function showBuffNotification(buffDef) {
    const notification = document.createElement('div');
    notification.className = 'buff-notification';
    notification.innerHTML = `
        <span class="buff-notify-icon">${buffDef.icon}</span>
        <div class="buff-notify-text">
            <div class="buff-notify-name">${buffDef.name}</div>
            <div class="buff-notify-desc">${buffDef.description}</div>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%) scale(0);
        background: linear-gradient(135deg, ${buffDef.color}, white);
        padding: 15px 25px;
        border-radius: 20px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 2000;
        animation: buffNotifyIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                   buffNotifyOut 0.5s ease-in 2.5s forwards;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

/** 呼噜结界特效 */
function showPurrEffect() {
    // 创建屏幕边缘的睡猫剪影
    const purrLayer = document.createElement('div');
    purrLayer.id = 'purr-effect-layer';
    purrLayer.innerHTML = `
        <div class="sleeping-cat cat-left">🐱</div>
        <div class="sleeping-cat cat-right">🐱</div>
        <div class="sleeping-cat cat-top">🐱</div>
        <div class="sleeping-cat cat-bottom">🐱</div>
    `;
    purrLayer.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 100;
        overflow: hidden;
    `;

    // 添加睡猫样式
    const style = document.createElement('style');
    style.id = 'purr-effect-style';
    style.textContent = `
        .sleeping-cat {
            position: absolute;
            font-size: 60px;
            opacity: 0.3;
            filter: blur(2px);
            animation: sleepingBreathe 3s ease-in-out infinite;
        }
        .cat-left { left: -20px; top: 50%; transform: translateY(-50%) rotate(-90deg); }
        .cat-right { right: -20px; top: 50%; transform: translateY(-50%) rotate(90deg); }
        .cat-top { top: -20px; left: 50%; transform: translateX(-50%); }
        .cat-bottom { bottom: -20px; left: 50%; transform: translateX(-50%) rotate(180deg); }
        .cat-right { animation-delay: 0.5s; }
        .cat-top { animation-delay: 1s; }
        .cat-bottom { animation-delay: 1.5s; }

        @keyframes sleepingBreathe {
            0%, 100% { transform: translateY(-50%) rotate(-90deg) scale(1); opacity: 0.3; }
            50% { transform: translateY(-50%) rotate(-90deg) scale(1.1); opacity: 0.5; }
        }
        .cat-right { animation-name: sleepingBreatheRight; }
        @keyframes sleepingBreatheRight {
            0%, 100% { transform: translateY(-50%) rotate(90deg) scale(1); opacity: 0.3; }
            50% { transform: translateY(-50%) rotate(90deg) scale(1.1); opacity: 0.5; }
        }
        .cat-top { animation-name: sleepingBreatheTop; }
        @keyframes sleepingBreatheTop {
            0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
            50% { transform: translateX(-50%) scale(1.1); opacity: 0.5; }
        }
        .cat-bottom { animation-name: sleepingBreatheBottom; }
        @keyframes sleepingBreatheBottom {
            0%, 100% { transform: translateX(-50%) rotate(180deg) scale(1); opacity: 0.3; }
            50% { transform: translateX(-50%) rotate(180deg) scale(1.1); opacity: 0.5; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(purrLayer);

    // 播放呼噜音效（如果 AudioManager 支持）
    if (AudioManager.playSFX) {
        AudioManager.playSFX('purr');
    }
}

function hidePurrEffect() {
    const layer = document.getElementById('purr-effect-layer');
    const style = document.getElementById('purr-effect-style');
    if (layer) layer.remove();
    if (style) style.remove();
}

/** 零食投喂特效 */
function showSnackEffect() {
    // 显示"点击任意格子消除"提示
    const hint = document.createElement('div');
    hint.id = 'snack-hint';
    hint.textContent = '😋 零食投喂模式！点击任意格子直接消除';
    hint.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #FFD93D, #FFE066);
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        color: #5D4E60;
        box-shadow: 0 4px 15px rgba(255, 217, 61, 0.4);
        z-index: 100;
        animation: snackHintPulse 1s ease-in-out infinite;
    `;

    const style = document.createElement('style');
    style.id = 'snack-effect-style';
    style.textContent = `
        @keyframes snackHintPulse {
            0%, 100% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
        }
        .snack-mode .cell {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ctext y='24' font-size='24'%3E🐟%3C/text%3E%3C/svg%3E") 16 16, auto;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(hint);
    DOM.board.classList.add('snack-mode');
}

function hideSnackEffect() {
    const hint = document.getElementById('snack-hint');
    const style = document.getElementById('snack-effect-style');
    if (hint) hint.remove();
    if (style) style.remove();
    DOM.board.classList.remove('snack-mode');
}

/** 显示"好吃"气泡（点击消除时） */
function showYummyBubble(row, col) {
    const cell = getCellElement(row, col);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const bubble = document.createElement('div');
    bubble.className = 'yummy-bubble';
    bubble.textContent = '好吃😋';
    bubble.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top}px;
        transform: translateX(-50%);
        background: white;
        padding: 8px 15px;
        border-radius: 15px;
        font-size: 14px;
        font-weight: bold;
        color: #FF6B9D;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: yummyPop 1s ease-out forwards;
        pointer-events: none;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes yummyPop {
            0% { transform: translateX(-50%) scale(0) translateY(0); opacity: 0; }
            30% { transform: translateX(-50%) scale(1.2) translateY(-10px); opacity: 1; }
            100% { transform: translateX(-50%) scale(1) translateY(-40px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1000);
}

/** 抱团取暖动画 */
function showCuddleAnimation() {
    // 创建贴贴动画层
    const cuddleLayer = document.createElement('div');
    cuddleLayer.id = 'cuddle-effect-layer';
    cuddleLayer.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // 贴贴动画内容
    cuddleLayer.innerHTML = `
        <div class="cuddle-scene">
            <div class="cuddle-cat left">🐱</div>
            <div class="cuddle-heart">💖</div>
            <div class="cuddle-cat right">🐱</div>
        </div>
    `;

    const style = document.createElement('style');
    style.id = 'cuddle-effect-style';
    style.textContent = `
        .cuddle-scene {
            display: flex;
            align-items: center;
            gap: 10px;
            animation: cuddleSceneIn 0.5s ease-out;
        }
        .cuddle-cat {
            font-size: 60px;
            animation: cuddleBounce 1s ease-in-out infinite;
        }
        .cuddle-cat.left { animation-delay: 0s; }
        .cuddle-cat.right { animation-delay: 0.5s; }
        .cuddle-heart {
            font-size: 40px;
            animation: cuddleHeartPulse 0.8s ease-in-out infinite;
        }
        @keyframes cuddleSceneIn {
            0% { transform: scale(0) translateY(50px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes cuddleBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes cuddleHeartPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.3); }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(cuddleLayer);

    // 3秒后自动隐藏
    setTimeout(() => {
        cuddleLayer.style.animation = 'cuddleSceneIn 0.5s ease-out reverse forwards';
        setTimeout(() => hideCuddleEffect(), 500);
    }, 3000);
}

function hideCuddleEffect() {
    const layer = document.getElementById('cuddle-effect-layer');
    const style = document.getElementById('cuddle-effect-style');
    if (layer) layer.remove();
    if (style) style.remove();
}

// ═══════════════════════════════════════════════════
//  家园系统 UI 函数
// ═══════════════════════════════════════════════════

/**
 * 显示家园主界面
 */
function showHomeScreen() {
    // 暂停游戏
    gameState.isPaused = true;

    // 创建家园界面
    const homeScreen = document.createElement('div');
    homeScreen.id = 'home-screen';
    homeScreen.innerHTML = `
        <div class="home-overlay">
            <div class="home-header">
                <h2>🏠 猫咪家园</h2>
                <div class="home-level-info">
                    <span class="home-level">Lv.${HomeSystem.homeLevel}</span>
                    <div class="home-exp-bar">
                        <div class="home-exp-fill" style="width: ${HomeSystem.getHomeLevelInfo().percentage}%"></div>
                    </div>
                    <span class="home-comfort">舒适度: ${HomeSystem.getComfortLevel()}</span>
                </div>
                <button class="home-close-btn" onclick="closeHomeScreen()">✕</button>
            </div>
            <div class="home-content">
                <div class="home-sidebar">
                    <button class="home-tab-btn active" data-tab="scene" onclick="switchHomeTab('scene')">🏠<br>场景</button>
                    <button class="home-tab-btn" data-tab="shop" onclick="switchHomeTab('shop')">🛒<br>商店</button>
                    <button class="home-tab-btn" data-tab="themes" onclick="switchHomeTab('themes')">🎨<br>主题</button>
                </div>
                <div class="home-main">
                    <div id="home-tab-scene" class="home-tab-content active">
                        ${renderHomeScene()}
                    </div>
                    <div id="home-tab-shop" class="home-tab-content">
                        ${renderHomeShop()}
                    </div>
                    <div id="home-tab-themes" class="home-tab-content">
                        ${renderHomeThemes()}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(homeScreen);

    // 播放音效
    AudioManager.playSFX('bell');
}

/**
 * 关闭家园界面
 */
function closeHomeScreen() {
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) homeScreen.remove();

    // 恢复游戏
    gameState.isPaused = false;
}

/**
 * 切换家园标签页
 */
function switchHomeTab(tabName) {
    // 更新标签按钮状态
    document.querySelectorAll('.home-tab-btn').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // 更新面板显示
    document.querySelectorAll('.home-tab-content').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`home-tab-${tabName}`).classList.add('active');

    // 刷新内容
    if (tabName === 'scene') {
        document.getElementById('home-tab-scene').innerHTML = renderHomeScene();
    } else if (tabName === 'shop') {
        document.getElementById('home-tab-shop').innerHTML = renderHomeShop();
    } else if (tabName === 'themes') {
        document.getElementById('home-tab-themes').innerHTML = renderHomeThemes();
    }
}

/**
 * 渲染家园场景
 */
function renderHomeScene() {
    const theme = HomeSystem.getCurrentTheme();
    const purchasedItems = HomeSystem.getPurchasedItems();

    // 生成装饰位置
    const positions = [
        { top: '10%', left: '10%' },
        { top: '15%', right: '15%' },
        { bottom: '20%', left: '20%' },
        { bottom: '25%', right: '10%' },
        { top: '40%', left: '50%' },
    ];

    return `
        <div class="home-scene">
            <div class="scene-preview">
                <div class="scene-cat">🐱</div>
                <div class="scene-decorations">
                    ${purchasedItems.slice(0, 5).map((item, i) => `
                        <div class="scene-decoration-item" style="${Object.entries(positions[i] || positions[0]).map(([k, v]) => `${k}:${v}`).join(';')}; animation-delay: ${i * 0.3}s">
                            ${item.icon}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="scene-info">
                <h3>${theme.name}</h3>
                <p>已购买装饰: ${purchasedItems.length}/${theme.items.length}</p>
                <p>家园舒适度: ${HomeSystem.getComfortLevel()}</p>
            </div>
        </div>
    `;
}

/**
 * 渲染装饰商店
 */
function renderHomeShop() {
    const unpurchasedItems = HomeSystem.getUnpurchasedItems();
    const currentCookies = gameState.cookies;

    if (unpurchasedItems.length === 0) {
        return `
            <div class="shop-header">
                <h3>装饰商店</h3>
                <span class="shop-cookies">🍪 ${currentCookies}</span>
            </div>
            <div class="shop-empty">
                <div class="shop-empty-icon">🎉</div>
                <div class="shop-empty-text">太棒了！<br>你已经购买了所有装饰！</div>
            </div>
        `;
    }

    return `
        <div class="shop-header">
            <h3>装饰商店</h3>
            <span class="shop-cookies">🍪 ${currentCookies}</span>
        </div>
        <div class="shop-grid">
            ${unpurchasedItems.map(item => {
                const canAfford = currentCookies >= item.cost;
                return `
                    <div class="shop-item">
                        <div class="shop-item-icon">${item.icon}</div>
                        <div class="shop-item-name">${item.name}</div>
                        <div class="shop-item-desc">${item.description}</div>
                        <button class="shop-item-cost ${canAfford ? 'can-buy' : 'cannot-buy'}" 
                                onclick="buyHomeItem('${item.id}')"
                                ${!canAfford ? 'disabled' : ''}>
                            🍪 ${item.cost}
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * 渲染主题切换
 */
function renderHomeThemes() {
    const themes = HomeSystem.getAllThemes();
    const currentTheme = HomeSystem.currentTheme;

    return `
        <div class="home-themes">
            ${themes.map(theme => {
                const isActive = theme.id === currentTheme;
                const purchasedCount = (HomeSystem.purchasedItems[theme.id] || []).length;
                return `
                    <div class="theme-card ${isActive ? 'active' : ''}" onclick="switchHomeTheme('${theme.id}')">
                        <div class="theme-icon">${theme.items[0].icon}</div>
                        <div class="theme-info">
                            <div class="theme-name">${theme.name}</div>
                            <div class="theme-desc">${theme.description}</div>
                        </div>
                        <div class="theme-progress">
                            <span class="theme-count">${purchasedCount}/${theme.items.length}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * 购买家园装饰
 */
function buyHomeItem(itemId) {
    const result = HomeSystem.purchaseItem(itemId);

    if (result.success) {
        // 显示购买成功动画
        showPurchaseSuccess(result.message);
        // 刷新商店
        document.getElementById('home-tab-shop').innerHTML = renderHomeShop();
        // 刷新场景
        document.getElementById('home-tab-scene').innerHTML = renderHomeScene();
        // 更新UI
        updateUI();
    } else {
        // 显示错误提示
        showInteractionFeedback(result.message, 'warning');
    }
}

/**
 * 切换家园主题
 */
function switchHomeTheme(themeId) {
    if (HomeSystem.switchTheme(themeId)) {
        // 刷新主题列表
        document.getElementById('home-tab-themes').innerHTML = renderHomeThemes();
        // 刷新场景
        document.getElementById('home-tab-scene').innerHTML = renderHomeScene();
        // 显示提示
        showInteractionFeedback(`切换到${HomeSystem.getCurrentTheme().name}`, 'info');
    }
}

/**
 * 获取物品类型标签
 */
function getItemTypeLabel(type) {
    const labels = {
        furniture: '🪑 家具',
        toy: '🧸 玩具',
        plant: '🌿 植物',
        background: '🖼️ 背景'
    };
    return labels[type] || type;
}

/**
 * 显示购买成功动画
 */
function showPurchaseSuccess(message) {
    const feedback = document.createElement('div');
    feedback.className = 'purchase-success';
    feedback.innerHTML = `
        <div class="success-icon">✨</div>
        <div class="success-message">${message}</div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .purchase-success {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #A8E6CF, #88D8E8);
            padding: 30px 50px;
            border-radius: 20px;
            text-align: center;
            z-index: 5000;
            animation: purchaseSuccessPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .success-message {
            font-size: 16px;
            color: white;
            font-weight: bold;
        }
        @keyframes purchaseSuccessPop {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.remove();
        style.remove();
    }, 1500);
}

/**
 * 家园界面样式
 */
function getHomeScreenStyles() {
    return `
        #home-screen {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: homeScreenIn 0.3s ease;
        }
        @keyframes homeScreenIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        .home-container {
            background: linear-gradient(135deg, #FFE5EC, #FFF0F5);
            border-radius: 25px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .home-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #FF8FAB, #FFB3C6);
            color: white;
        }
        .home-header h2 {
            margin: 0;
            font-size: 20px;
        }
        .home-level-info {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }
        .home-level {
            background: rgba(255, 255, 255, 0.3);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: bold;
        }
        .home-exp-bar {
            width: 80px;
            height: 8px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            overflow: hidden;
        }
        .home-exp-fill {
            height: 100%;
            background: #FFD93D;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        .home-close-btn {
            background: rgba(255, 255, 255, 0.3);
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            color: white;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .home-close-btn:hover {
            background: rgba(255, 255, 255, 0.5);
            transform: scale(1.1);
        }
        .home-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .home-sidebar {
            width: 120px;
            background: rgba(255, 255, 255, 0.5);
            padding: 15px 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .home-tab {
            padding: 12px 10px;
            border: none;
            border-radius: 12px;
            background: transparent;
            cursor: pointer;
            font-size: 13px;
            color: #5D4E60;
            transition: all 0.2s;
            text-align: left;
        }
        .home-tab:hover {
            background: rgba(255, 255, 255, 0.5);
        }
        .home-tab.active {
            background: linear-gradient(135deg, #FF8FAB, #FFB3C6);
            color: white;
        }
        .home-main {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        .home-panel {
            display: none;
        }
        .home-panel.active {
            display: block;
            animation: panelIn 0.3s ease;
        }
        @keyframes panelIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        /* 家园场景 */
        .home-scene {
            text-align: center;
        }
        .scene-background {
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 20px;
            min-height: 200px;
        }
        .balcony-bg {
            background: linear-gradient(135deg, #FFE4B5, #FFDAB9);
        }
        .garden-bg {
            background: linear-gradient(135deg, #C8E6C9, #A5D6A7);
        }
        .cozy-bg {
            background: linear-gradient(135deg, #FFE0B2, #FFCC80);
        }
        .scene-title {
            font-size: 24px;
            font-weight: bold;
            color: #5D4E60;
            margin-bottom: 8px;
        }
        .scene-description {
            font-size: 14px;
            color: #8B7B8E;
            margin-bottom: 20px;
        }
        .scene-items {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
        }
        .scene-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 15px;
            min-width: 80px;
        }
        .scene-item-icon {
            font-size: 32px;
            margin-bottom: 5px;
        }
        .scene-item-name {
            font-size: 12px;
            color: #5D4E60;
        }
        .scene-info {
            background: rgba(255, 255, 255, 0.5);
            padding: 15px;
            border-radius: 15px;
        }
        .scene-info h3 {
            margin: 0 0 10px 0;
            color: #FF6B9D;
        }
        .scene-info p {
            margin: 5px 0;
            color: #5D4E60;
            font-size: 14px;
        }
        /* 装饰商店 */
        .home-shop {
            height: 100%;
        }
        .shop-header {
            text-align: right;
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 12px;
        }
        .shop-cookies {
            font-size: 18px;
            font-weight: bold;
            color: #FFB347;
        }
        .shop-items {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .shop-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 15px;
            transition: all 0.2s;
        }
        .shop-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .shop-item.cannot-afford {
            opacity: 0.6;
        }
        .shop-item-icon {
            font-size: 36px;
            width: 50px;
            text-align: center;
        }
        .shop-item-info {
            flex: 1;
        }
        .shop-item-name {
            font-weight: bold;
            color: #5D4E60;
            margin-bottom: 4px;
        }
        .shop-item-desc {
            font-size: 12px;
            color: #8B7B8E;
            margin-bottom: 4px;
        }
        .shop-item-type {
            font-size: 11px;
            color: #FF8FAB;
            background: rgba(255, 143, 171, 0.1);
            padding: 2px 8px;
            border-radius: 8px;
            display: inline-block;
        }
        .shop-buy-btn {
            padding: 10px 16px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #A8E6CF, #88D8E8);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }
        .shop-buy-btn:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(168, 230, 207, 0.5);
        }
        .shop-buy-btn.disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .shop-empty {
            text-align: center;
            padding: 60px 20px;
        }
        .shop-empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .shop-empty p {
            color: #5D4E60;
            font-size: 16px;
        }
        /* 主题切换 */
        .home-themes {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .theme-card {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        }
        .theme-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        .theme-card.active {
            border: 2px solid #FF8FAB;
            background: rgba(255, 143, 171, 0.1);
        }
        .theme-icon {
            font-size: 48px;
            width: 60px;
            text-align: center;
        }
        .theme-info {
            flex: 1;
        }
        .theme-name {
            font-weight: bold;
            color: #5D4E60;
            font-size: 16px;
            margin-bottom: 4px;
        }
        .theme-desc {
            font-size: 13px;
            color: #8B7B8E;
            margin-bottom: 8px;
        }
        .theme-progress {
            font-size: 12px;
            color: #FF8FAB;
        }
        .theme-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #FF8FAB, #FFB3C6);
            color: white;
            padding: 4px 10px;
            border-radius: 10px;
            font-size: 11px;
        }
    `;
}

// ═══════════════════════════════════════════════════
//  启动
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', init);
