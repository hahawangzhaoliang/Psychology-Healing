
        // 加载统计数据
        function loadStatistics() {
            const records = JSON.parse(localStorage.getItem('flow-records') || '[]');
            
            if (records.length === 0) {
                showNoData();
                return;
            }
            
            renderSummaryCards(records);
            renderQualityChart(records);
            renderActivityChart(records);
            renderRecordsList(records);
        }
        
        // 显示无数据状态
        function showNoData() {
            document.getElementById('summary-cards').innerHTML = `
                <div class="no-data">
                    <p style="font-size: 1.25rem; margin-bottom: 1rem;">暂无数据</p>
                    <p>完成你的第一次心流体验吧！</p>
                </div>
            `;
        }
        
        // 渲染统计卡片
        function renderSummaryCards(records) {
            const totalSessions = records.length;
            const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);
            const totalMinutes = Math.round(totalDuration / 60);
            const avgQuality = records.length > 0 
                ? (records.reduce((sum, r) => sum + (r.scores?.focus || 0), 0) / records.length).toFixed(1)
                : 0;
            
            document.getElementById('summary-cards').innerHTML = `
                <div class="card stat-card">
                    <div class="stat-number">${totalSessions}</div>
                    <p>心流次数</p>
                </div>
                <div class="card stat-card">
                    <div class="stat-number">${totalMinutes}h</div>
                    <p>累计时长</p>
                </div>
                <div class="card stat-card">
                    <div class="stat-number">${avgQuality}</div>
                    <p>平均质量</p>
                </div>
            `;
        }
        
        // 渲染质量趋势图
        function renderQualityChart(records) {
            const ctx = document.getElementById('quality-chart').getContext('2d');
            const labels = records.map((r, i) => `#${i + 1}`);
            const data = records.map(r => r.scores?.focus || 0);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '专注度',
                        data: data,
                        borderColor: 'var(--color-primary-500)',
                        backgroundColor: 'var(--color-primary-100)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: { beginAtZero: true, max: 10 }
                    }
                }
            });
        }
        
        // 渲染活动分布图
        function renderActivityChart(records) {
            const ctx = document.getElementById('activity-chart').getContext('2d');
            const activityCounts = {};
            
            records.forEach(r => {
                const activity = r.activity || '未知';
                activityCounts[activity] = (activityCounts[activity] || 0) + 1;
            });
            
            const labels = Object.keys(activityCounts);
            const data = Object.values(activityCounts);
            
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'var(--color-primary-500)',
                            'var(--color-secondary-500)',
                            'var(--color-success-500)',
                            'var(--color-warning-500)',
                            'var(--color-info-500)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }
        
        // 渲染记录列表
        function renderRecordsList(records) {
            const container = document.getElementById('records-container');
            const recentRecords = records.slice(-10).reverse();
            
            if (recentRecords.length === 0) {
                container.innerHTML = '<div class="no-data">暂无记录</div>';
                return;
            }
            
            container.innerHTML = recentRecords.map(r => `
                <div class="record-item">
                    <div>
                        <div class="record-activity">${r.activity || '未知活动'}</div>
                        <div class="record-meta">${new Date(r.date).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <div class="record-meta">
                        ${Math.round((r.duration || 0) / 60)}分钟
                    </div>
                </div>
            `).join('');
        }
        
        // 页面加载时执行
        document.addEventListener('DOMContentLoaded', loadStatistics);
    
