/**
 * 音频播放器组件
 * 用于疗愈练习的音频播放控制
 */

class AudioPlayer {
    constructor(options = {}) {
        this.audioUrl = options.audioUrl || '';
        this.autoplay = options.autoplay || false;
        this.loop = options.loop || false;
        this.volume = options.volume || 1.0;
        
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        
        this.onPlay = options.onPlay || null;
        this.onPause = options.onPause || null;
        this.onEnded = options.onEnded || null;
        this.onTimeUpdate = options.onTimeUpdate || null;
        
        this.init();
    }
    
    init() {
        // 创建音频元素
        this.audio = new Audio();
        this.audio.src = this.audioUrl;
        this.audio.autoplay = this.autoplay;
        this.audio.loop = this.loop;
        this.audio.volume = this.volume;
        this.audio.preload = 'auto';
        
        // 绑定事件
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.currentTime, this.duration);
            }
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.onPlay) {
                this.onPlay();
            }
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.onPause) {
                this.onPause();
            }
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            if (this.onEnded) {
                this.onEnded();
            }
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('音频加载失败:', e);
        });
    }
    
    play() {
        if (this.audio) {
            this.audio.play().catch(err => {
                console.error('播放失败:', err);
            });
        }
    }
    
    pause() {
        if (this.audio) {
            this.audio.pause();
        }
    }
    
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }
    
    seek(time) {
        if (this.audio) {
            this.audio.currentTime = time;
        }
    }
    
    setVolume(volume) {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }
    
    getProgress() {
        if (this.duration === 0) return 0;
        return (this.currentTime / this.duration) * 100;
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * 呼吸动画控制器
 */
class BreathingAnimation {
    constructor(element, options = {}) {
        this.element = element;
        this.inhaleTime = options.inhaleTime || 4000;
        this.holdTime = options.holdTime || 2000;
        this.exhaleTime = options.exhaleTime || 6000;
        
        this.animationId = null;
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.cycle();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
        this.element.style.transform = 'scale(1)';
    }
    
    cycle() {
        if (!this.isRunning) return;
        
        // 吸气
        this.element.style.transition = `transform ${this.inhaleTime}ms ease-in-out`;
        this.element.style.transform = 'scale(1.3)';
        
        this.animationId = setTimeout(() => {
            if (!this.isRunning) return;
            
            // 屏息
            this.element.style.transition = 'none';
            
            this.animationId = setTimeout(() => {
                if (!this.isRunning) return;
                
                // 呼气
                this.element.style.transition = `transform ${this.exhaleTime}ms ease-in-out`;
                this.element.style.transform = 'scale(1)';
                
                this.animationId = setTimeout(() => {
                    if (this.isRunning) {
                        this.cycle();
                    }
                }, this.exhaleTime);
                
            }, this.holdTime);
            
        }, this.inhaleTime);
    }
}

/**
 * 计时器组件
 */
class Timer {
    constructor(duration, options = {}) {
        this.duration = duration;
        this.remaining = duration;
        this.isRunning = false;
        
        this.onTick = options.onTick || null;
        this.onComplete = options.onComplete || null;
        
        this.intervalId = null;
    }
    
    start() {
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.remaining -= 1000;
            
            if (this.onTick) {
                this.onTick(this.remaining);
            }
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        }, 1000);
    }
    
    pause() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    
    resume() {
        if (!this.isRunning && this.remaining > 0) {
            this.start();
        }
    }
    
    stop() {
        this.pause();
        this.remaining = this.duration;
    }
    
    formatTime(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioPlayer, BreathingAnimation, Timer };
}
