/**
 * 情绪曲线绘制工具
 */

class EmotionChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    }
    
    draw(records, days = 7) {
        if (!this.canvas || records.length === 0) {
            this.drawEmpty();
            return;
        }
        
        // 准备数据
        const data = this.prepareData(records, days);
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制曲线
        this.drawCurve(data);
        
        // 绘制数据点
        this.drawPoints(data);
        
        // 绘制标签
        this.drawLabels(data);
    }
    
    prepareData(records, days) {
        const result = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const dayRecords = records.filter(r => {
                const recordDate = new Date(r.timestamp);
                recordDate.setHours(0, 0, 0, 0);
                return recordDate.getTime() === date.getTime();
            });
            
            const avgIntensity = dayRecords.length > 0 
                ? dayRecords.reduce((sum, r) => sum + (r.intensity || 5), 0) / dayRecords.length 
                : 5;
            
            result.push({
                date: date,
                label: `${date.getMonth() + 1}/${date.getDate()}`,
                value: avgIntensity
            });
        }
        
        return result;
    }
    
    drawEmpty() {
        const ctx = this.ctx;
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('需要更多数据来显示趋势图', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const padding = { left: 50, right: 20, top: 20, bottom: 40 };
        const chartHeight = this.canvas.height - padding.top - padding.bottom;
        
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        
        // 绘制水平网格线
        for (let i = 0; i <= 10; i += 2) {
            const y = padding.top + (1 - i / 10) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(this.canvas.width - padding.right, y);
            ctx.stroke();
        }
    }
    
    drawCurve(data) {
        const ctx = this.ctx;
        const padding = { left: 50, right: 20, top: 20, bottom: 40 };
        const chartWidth = this.canvas.width - padding.left - padding.right;
        const chartHeight = this.canvas.height - padding.top - padding.bottom;
        
        // 绘制渐变填充
        const gradient = ctx.createLinearGradient(0, padding.top, 0, this.canvas.height - padding.bottom);
        gradient.addColorStop(0, 'rgba(90, 154, 138, 0.3)');
        gradient.addColorStop(1, 'rgba(90, 154, 138, 0)');
        
        ctx.beginPath();
        ctx.moveTo(padding.left, this.canvas.height - padding.bottom);
        
        data.forEach((day, index) => {
            const x = padding.left + (index / (data.length - 1)) * chartWidth;
            const y = padding.top + (1 - day.value / 10) * chartHeight;
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(this.canvas.width - padding.right, this.canvas.height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制曲线
        ctx.beginPath();
        ctx.strokeStyle = '#5A9A8A';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        data.forEach((day, index) => {
            const x = padding.left + (index / (data.length - 1)) * chartWidth;
            const y = padding.top + (1 - day.value / 10) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }
    
    drawPoints(data) {
        const ctx = this.ctx;
        const padding = { left: 50, right: 20, top: 20, bottom: 40 };
        const chartWidth = this.canvas.width - padding.left - padding.right;
        const chartHeight = this.canvas.height - padding.top - padding.bottom;
        
        data.forEach((day, index) => {
            const x = padding.left + (index / (data.length - 1)) * chartWidth;
            const y = padding.top + (1 - day.value / 10) * chartHeight;
            
            // 绘制外圈
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#5A9A8A';
            ctx.fill();
            
            // 绘制内圈
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        });
    }
    
    drawLabels(data) {
        const ctx = this.ctx;
        const padding = { left: 50, right: 20, top: 20, bottom: 40 };
        const chartWidth = this.canvas.width - padding.left - padding.right;
        const chartHeight = this.canvas.height - padding.top - padding.bottom;
        
        // X轴标签
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        
        data.forEach((day, index) => {
            const x = padding.left + (index / (data.length - 1)) * chartWidth;
            ctx.fillText(day.label, x, this.canvas.height - 10);
        });
        
        // Y轴标签
        ctx.textAlign = 'right';
        for (let i = 0; i <= 10; i += 2) {
            const y = padding.top + (1 - i / 10) * chartHeight;
            ctx.fillText(i.toString(), 40, y + 4);
        }
    }
}
