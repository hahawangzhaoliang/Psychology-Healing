/**
 * AmbientNoiseGenerator - 实时环境音生成器
 * 使用 Web Audio API 生成粉红噪音、白噪音等环境音
 * 无需下载外部音频文件
 */
class AmbientNoiseGenerator {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.currentNoiseType = null;
        this.noiseNode = null;
    }

    /**
     * 初始化 AudioContext
     */
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.audioContext.destination);
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 生成白噪音（White Noise）
     * 包含所有频率，声音类似收音机杂音
     */
    createWhiteNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return this.createNoiseSource(buffer);
    }

    /**
     * 生成粉红噪音（Pink Noise）
     * 低频较多，声音更柔和，类似瀑布或下雨
     */
    createPinkNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
        
        return this.createNoiseSource(buffer);
    }

    /**
     * 生成棕色噪音（Brown Noise）
     * 更低沉，类似雷声或远处瀑布
     */
    createBrownNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        let lastOut = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // 增益补偿
        }
        
        return this.createNoiseSource(buffer);
    }

    /**
     * 创建噪音源节点
     */
    createNoiseSource(buffer) {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    }

    /**
     * 创建循环播放的环境音
     * @param {string} type - 噪音类型: 'white', 'pink', 'brown'
     */
    play(type = 'pink') {
        this.init();
        
        // 停止当前播放
        if (this.isPlaying) {
            this.stop();
        }

        // 创建对应类型的噪音
        switch (type) {
            case 'white':
                this.noiseNode = this.createWhiteNoise();
                break;
            case 'pink':
                this.noiseNode = this.createPinkNoise();
                break;
            case 'brown':
                this.noiseNode = this.createBrownNoise();
                break;
            default:
                this.noiseNode = this.createPinkNoise();
        }

        // 添加过滤器使声音更自然
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'white' ? 5000 : type === 'pink' ? 3000 : 1500;

        // 连接节点
        this.noiseNode.connect(filter);
        filter.connect(this.masterGain);
        
        // 淡入
        this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 1);

        // 开始播放
        this.noiseNode.start();
        this.isPlaying = true;
        this.currentNoiseType = type;
    }

    /**
     * 停止播放
     */
    stop() {
        if (this.noiseNode && this.isPlaying) {
            // 淡出
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            
            setTimeout(() => {
                if (this.noiseNode) {
                    this.noiseNode.stop();
                    this.noiseNode.disconnect();
                    this.noiseNode = null;
                }
            }, 500);
            
            this.isPlaying = false;
            this.currentNoiseType = null;
        }
    }

    /**
     * 设置音量
     * @param {number} volume - 音量 0-1
     */
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                Math.max(0, Math.min(1, volume)),
                this.audioContext.currentTime
            );
        }
    }

    /**
     * 获取播放状态
     */
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            noiseType: this.currentNoiseType,
            volume: this.masterGain?.gain.value || 0
        };
    }
}

// 创建全局实例
const ambientGenerator = new AmbientNoiseGenerator();
