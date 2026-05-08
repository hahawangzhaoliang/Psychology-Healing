/**
 * Plutchik情绪轮盘组件
 * 基于Robert Plutchik的情绪心理进化理论
 * 参考: Plutchik, R. (1980). A general psychoevolutionary theory of emotion.
 */

class EmotionWheel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            size: options.size || 400,
            onEmotionSelect: options.onEmotionSelect || (() => {}),
            onIntensityChange: options.onIntensityChange || (() => {}),
            ...options
        };
        
        // 8种基本情绪及其强度层级（从外到内）
        this.emotions = {
            joy: {
                name: '喜悦',
                color: '#FFE135',
                levels: ['平静', '快乐', '狂喜'],
                opposite: 'sadness'
            },
            trust: {
                name: '信任',
                color: '#7CB342',
                levels: ['接受', '信任', '钦佩'],
                opposite: 'disgust'
            },
            fear: {
                name: '恐惧',
                color: '#5C6BC0',
                levels: ['胆怯', '恐惧', '恐怖'],
                opposite: 'anger'
            },
            surprise: {
                name: '惊讶',
                color: '#AB47BC',
                levels: ['不确定', '惊讶', '惊愕'],
                opposite: 'anticipation'
            },
            sadness: {
                name: '悲伤',
                color: '#42A5F5',
                levels: ['阴郁', '悲伤', '悲痛'],
                opposite: 'joy'
            },
            disgust: {
                name: '厌恶',
                color: '#66BB6A',
                levels: ['不喜欢', '厌恶', '憎恨'],
                opposite: 'trust'
            },
            anger: {
                name: '愤怒',
                color: '#EF5350',
                levels: ['烦恼', '愤怒', '狂怒'],
                opposite: 'fear'
            },
            anticipation: {
                name: '期待',
                color: '#FFA726',
                levels: ['兴趣', '期待', '警惕'],
                opposite: 'surprise'
            }
        };

        // 情绪组合映射
        this.emotionCombinations = {
            'joy+trust': { name: '爱', color: '#FFD54F' },
            'trust+fear': { name: '屈服', color: '#8BC34A' },
            'fear+surprise': { name: '敬畏', color: '#7E57C2' },
            'surprise+sadness': { name: '不赞同', color: '#7986CB' },
            'sadness+disgust': { name: '悔恨', color: '#26A69A' },
            'disgust+anger': { name: '蔑视', color: '#9CCC65' },
            'anger+anticipation': { name: '攻击性', color: '#FF7043' },
            'anticipation+joy': { name: '乐观', color: '#FFCA28' }
        };

        // 情绪顺序（顺时针）
        this.emotionOrder = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
        
        // 当前选中的情绪
        this.selectedEmotions = [];
        this.selectedIntensity = 1; // 1-3
        
        this.init();
    }

    init() {
        // 创建Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.size;
        this.canvas.height = this.options.size;
        this.canvas.style.cursor = 'pointer';
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // 绑定事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
        
        // 绘制轮盘
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const centerX = this.options.size / 2;
        const centerY = this.options.size / 2;
        const maxRadius = (this.options.size / 2) - 40; // 增加边距，从20改为40

        // 清空画布
        ctx.clearRect(0, 0, this.options.size, this.options.size);

        // 绘制每个情绪花瓣
        this.emotionOrder.forEach((emotionKey, index) => {
            const emotion = this.emotions[emotionKey];
            const startAngle = (index * Math.PI / 4) - Math.PI / 8;
            const endAngle = startAngle + Math.PI / 4;

            // 绘制3个强度层级（从外到内）
            for (let level = 0; level < 3; level++) {
                const outerRadius = maxRadius - (level * maxRadius / 3);
                const innerRadius = maxRadius - ((level + 1) * maxRadius / 3);

                // 计算颜色透明度（外层最浅，内层最深）
                const alpha = 0.3 + (level * 0.35);
                const color = this.hexToRgba(emotion.color, alpha);

                // 绘制花瓣
                ctx.beginPath();
                ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
                ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
                ctx.closePath();

                // 填充颜色
                ctx.fillStyle = color;
                ctx.fill();

                // 描边
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // 如果被选中，添加高亮效果
                if (this.selectedEmotions.includes(emotionKey) && this.selectedIntensity === (3 - level)) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }

            // 绘制情绪标签（调整位置，确保不被裁剪）
            const labelRadius = maxRadius + 20; // 从15改为20
            const labelAngle = startAngle + Math.PI / 8;
            const labelX = centerX + labelRadius * Math.cos(labelAngle);
            const labelY = centerY + labelRadius * Math.sin(labelAngle);

            ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emotion.name, labelX, labelY);
        });

        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius / 3 - 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 如果选择了两个相邻情绪，显示组合情绪
        if (this.selectedEmotions.length === 2) {
            const combo = this.getCombinationName(this.selectedEmotions[0], this.selectedEmotions[1]);
            if (combo) {
                ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.fillStyle = '#5A9A8A';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(combo.name, centerX, centerY);
            }
        } else {
            ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('点击选择情绪', centerX, centerY);
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const emotion = this.getEmotionAtPosition(x, y);
        
        if (emotion) {
            // 检查是否已经选中
            const index = this.selectedEmotions.indexOf(emotion.key);
            
            if (index > -1) {
                // 如果已选中，取消选择
                this.selectedEmotions.splice(index, 1);
            } else {
                // 如果未选中，添加选择
                if (this.selectedEmotions.length < 2) {
                    this.selectedEmotions.push(emotion.key);
                } else {
                    // 如果已选2个，替换第一个
                    this.selectedEmotions.shift();
                    this.selectedEmotions.push(emotion.key);
                }
            }
            
            this.selectedIntensity = emotion.level;
            
            // 重绘
            this.draw();
            
            // 触发回调
            this.options.onEmotionSelect({
                emotions: this.selectedEmotions.map(key => ({
                    key,
                    ...this.emotions[key],
                    level: this.selectedIntensity,
                    levelName: this.emotions[key].levels[3 - this.selectedIntensity]
                })),
                combination: this.selectedEmotions.length === 2 ? 
                    this.getCombinationName(this.selectedEmotions[0], this.selectedEmotions[1]) : null
            });
        }
    }

    handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const emotion = this.getEmotionAtPosition(x, y);
        
        if (emotion) {
            this.canvas.style.cursor = 'pointer';
            this.canvas.title = `${this.emotions[emotion.key].name} - ${this.emotions[emotion.key].levels[3 - emotion.level]}`;
        } else {
            this.canvas.style.cursor = 'default';
            this.canvas.title = '';
        }
    }

    getEmotionAtPosition(x, y) {
        const centerX = this.options.size / 2;
        const centerY = this.options.size / 2;
        const maxRadius = (this.options.size / 2) - 20;
        
        // 计算点击位置相对于中心的距离和角度
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        
        // 转换为0到2π
        if (angle < 0) angle += Math.PI * 2;
        
        // 检查是否在轮盘范围内
        if (distance < maxRadius / 3 - 10 || distance > maxRadius) {
            return null;
        }
        
        // 确定情绪类型
        const emotionIndex = Math.floor((angle + Math.PI / 8) / (Math.PI / 4)) % 8;
        const emotionKey = this.emotionOrder[emotionIndex];
        
        // 确定强度层级
        const level = Math.ceil((maxRadius - distance) / (maxRadius / 3));
        
        return {
            key: emotionKey,
            level: level
        };
    }

    getCombinationName(emotion1, emotion2) {
        // 检查两个情绪是否相邻
        const index1 = this.emotionOrder.indexOf(emotion1);
        const index2 = this.emotionOrder.indexOf(emotion2);
        
        const diff = Math.abs(index1 - index2);
        const isAdjacent = diff === 1 || diff === 7;
        
        if (!isAdjacent) return null;
        
        // 构建组合键（按顺时针顺序）
        const key1 = index1 < index2 || (index1 === 7 && index2 === 0) ? 
            `${emotion1}+${emotion2}` : `${emotion2}+${emotion1}`;
        const key2 = index2 < index1 || (index2 === 7 && index1 === 0) ? 
            `${emotion2}+${emotion1}` : `${emotion1}+${emotion2}`;
        
        return this.emotionCombinations[key1] || this.emotionCombinations[key2];
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 重置选择
    reset() {
        this.selectedEmotions = [];
        this.selectedIntensity = 1;
        this.draw();
    }

    // 获取当前选择
    getSelection() {
        return {
            emotions: this.selectedEmotions.map(key => ({
                key,
                ...this.emotions[key],
                level: this.selectedIntensity,
                levelName: this.emotions[key].levels[3 - this.selectedIntensity]
            })),
            combination: this.selectedEmotions.length === 2 ? 
                this.getCombinationName(this.selectedEmotions[0], this.selectedEmotions[1]) : null
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmotionWheel;
}
