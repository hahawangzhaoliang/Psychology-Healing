/**
 * AudioManager - 音频播放管理
 * 支持背景音乐、环境音、音效的统一管理
 * 环境音支持: 音频文件 + Web Audio API 噪音生成
 */
class AudioManager {
    constructor() {
        this.context = null;
        this.currentBGM = null;
        this.currentAmbient = null;
        this.currentAmbientType = null; // 'file' | 'noise'
        this.masterVolume = 0.8;
        this.bgmVolume = 0.5;
        this.ambientVolume = 0.3;
        this.effectsVolume = 0.6;
        this.isMuted = false;
        
        // 音频元素
        this.bgmElement = null;
        this.ambientElement = null;
        
        // 噪音生成器
        this.noiseGenerator = null;
        
        this._initElements();
    }

    /**
     * 初始化音频元素
     */
    _initElements() {
        // 创建背景音乐元素
        this.bgmElement = new Audio();
        this.bgmElement.loop = true;
        this.bgmElement.volume = this.bgmVolume * this.masterVolume;
        
        // 创建环境音元素
        this.ambientElement = new Audio();
        this.ambientElement.loop = true;
        this.ambientElement.volume = this.ambientVolume * this.masterVolume;
    }

    /**
     * 确保 AudioContext 已初始化（需要用户交互后才能创建）
     */
    _ensureContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    /**
     * 播放背景音乐
     * @param {string} trackId - 曲目 ID (来自 manifest)
     * @param {number} volume - 音量 0-1
     */
    playBGM(trackId, volume = 0.5) {
        this._ensureContext();
        // 等待 manifest 加载
        if (!resourceLoader?.getManifest()) {
            resourceLoader?.init()?.then(() => this.playBGM(trackId, volume));
            return;
        }
        const track = resourceLoader?.getAudioByCategory('bgm')?.find(t => t.id === trackId);
        if (!track) {
            console.warn(`[AudioManager] BGM '${trackId}' 未找到`);
            return;
        }

        this._stopBGM();

        // 优先使用 Blob CDN url，fallback 本地路径
        const src = track.url || `assets/audio/bgm/${track.file}`;
        this.bgmElement.src = src;
        this.bgmVolume = volume;
        this.bgmElement.volume = volume * this.masterVolume * (this.isMuted ? 0 : 1);
        this.bgmElement.play().catch(e => {
            // CDN 失败时尝试本地 fallback
            if (track.url && track.file) {
                console.warn(`[AudioManager] CDN 播放失败，尝试本地: ${e.message}`);
                this.bgmElement.src = `assets/audio/bgm/${track.file}`;
                this.bgmElement.play().catch(e2 => {
                    console.warn('[AudioManager] BGM 本地播放也失败:', e2.message);
                });
            } else {
                console.warn('[AudioManager] BGM 播放失败:', e.message);
            }
        });
        this.currentBGM = trackId;
    }

    /**
     * 停止背景音乐
     */
    _stopBGM() {
        if (this.bgmElement) {
            this.bgmElement.pause();
            this.bgmElement.currentTime = 0;
        }
        this.currentBGM = null;
    }

    /**
     * 播放环境音
     * @param {string} soundId - 音效 ID (来自 manifest)
     * @param {number} volume - 音量 0-1
     */
    playAmbient(soundId, volume = 0.3) {
        this._ensureContext();
        // 等待 manifest 加载
        if (!resourceLoader?.getManifest()) {
            resourceLoader?.init()?.then(() => this.playAmbient(soundId, volume));
            return;
        }
        const sound = resourceLoader?.getAudioByCategory('ambient')?.find(s => s.id === soundId);
        if (!sound) {
            console.warn(`[AudioManager] 环境音 '${soundId}' 未找到`);
            return;
        }

        this._stopAmbient();
        this.ambientVolume = volume;

        // 检查是音频文件还是噪音生成
        if (sound.type === 'noise' && sound.noiseType) {
            // 使用噪音生成器
            if (!this.noiseGenerator) {
                this.noiseGenerator = new AmbientNoiseGenerator();
            }
            this.noiseGenerator.setVolume(volume * this.masterVolume * (this.isMuted ? 0 : 1));
            this.noiseGenerator.play(sound.noiseType);
            this.currentAmbientType = 'noise';
        } else if (sound.file) {
            // 使用音频文件
            this.ambientElement.src = `assets/audio/ambient/${sound.file}`;
            this.ambientElement.volume = volume * this.masterVolume * (this.isMuted ? 0 : 1);
            this.ambientElement.play().catch(e => {
                console.warn('[AudioManager] 环境音播放失败:', e.message);
            });
            this.currentAmbientType = 'file';
        }

        this.currentAmbient = soundId;
    }

    /**
     * 停止背景音乐（对外暴露）
     */
    stopBGM() { this._stopBGM(); }

    /**
     * 停止环境音（对外暴露）
     */
    stopAmbient() { this._stopAmbient(); }

    /**
     * 停止环境音
     */
    _stopAmbient() {
        // 停止噪音生成器
        if (this.noiseGenerator) {
            this.noiseGenerator.stop();
        }
        // 停止音频文件
        if (this.ambientElement) {
            this.ambientElement.pause();
            this.ambientElement.currentTime = 0;
        }
        this.currentAmbient = null;
        this.currentAmbientType = null;
    }

    /**
     * 播放音效
     * @param {string} soundId - 音效 ID (来自 manifest)
     */
    playEffect(soundId) {
        const sound = resourceLoader?.getAudioByCategory('effects')?.find(s => s.id === soundId);
        if (!sound) {
            console.warn(`[AudioManager] 音效 '${soundId}' 未找到`);
            return;
        }
        
        const audio = new Audio(`assets/audio/effects/${sound.file}`);
        audio.volume = this.effectsVolume * this.masterVolume * (this.isMuted ? 0 : 1);
        audio.play().catch(e => {
            console.warn('[AudioManager] 音效播放失败:', e.message);
        });
    }

    /**
     * 播放冥想引导
     * @param {string} trackId - 曲目 ID
     */
    playMeditation(trackId) {
        this._ensureContext();
        const track = resourceLoader?.getAudioByCategory('meditation')?.find(t => t.id === trackId);
        if (!track) {
            console.warn(`[AudioManager] 冥想曲目 '${trackId}' 未找到`);
            return;
        }
        
        const audio = new Audio(`assets/audio/meditation/${track.file}`);
        audio.volume = this.bgmVolume * this.masterVolume * (this.isMuted ? 0 : 1);
        audio.play().catch(e => {
            console.warn('[AudioManager] 冥想音频播放失败:', e.message);
        });
        return audio;
    }

    /**
     * 暂停所有音频
     */
    pauseAll() {
        this.bgmElement?.pause();
        this.ambientElement?.pause();
    }

    /**
     * 恢复所有音频
     */
    resumeAll() {
        if (this.currentBGM) this.bgmElement?.play();
        if (this.currentAmbient) this.ambientElement?.play();
    }

    /**
     * 停止所有音频
     */
    stopAll() {
        this._stopBGM();
        this._stopAmbient();
    }

    /**
     * 设置主音量
     * @param {number} volume - 音量 0-1
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this._updateVolumes();
        localStorage.setItem('audioMasterVolume', this.masterVolume);
    }

    /**
     * 设置静音
     * @param {boolean} muted
     */
    setMuted(muted) {
        this.isMuted = muted;
        this._updateVolumes();
        localStorage.setItem('audioMuted', muted);
    }

    /**
     * 更新所有音量
     */
    _updateVolumes() {
        const vol = this.isMuted ? 0 : 1;
        if (this.bgmElement) this.bgmElement.volume = this.bgmVolume * this.masterVolume * vol;
        if (this.ambientElement) this.ambientElement.volume = this.ambientVolume * this.masterVolume * vol;
    }

    /**
     * 从 localStorage 恢复设置
     */
    restoreSettings() {
        const vol = localStorage.getItem('audioMasterVolume');
        if (vol !== null) this.masterVolume = parseFloat(vol);
        const muted = localStorage.getItem('audioMuted');
        if (muted !== null) this.isMuted = muted === 'true';
        this._updateVolumes();
    }

    /**
     * 获取当前播放状态
     */
    getStatus() {
        return {
            masterVolume: this.masterVolume,
            isMuted: this.isMuted,
            currentBGM: this.currentBGM,
            currentAmbient: this.currentAmbient,
            isBGMPlaying: !this.bgmElement?.paused,
            isAmbientPlaying: !this.ambientElement?.paused
        };
    }
}

// 创建全局实例
const audioManager = new AudioManager();
audioManager.restoreSettings();
