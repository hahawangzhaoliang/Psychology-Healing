let simulation, svg, g, link, node;

// 知识图谱数据（内嵌以避免 fetch 跨域问题）
const graphData = {
  "nodes": [
    {"id": "cbt", "label": "认知行为疗法", "category": "therapy", "level": 1, "description": "认知行为疗法(CBT)是一种心理治疗方法，通过改变不合理的认知和行为来改善情绪和心理状态。", "reference": "Beck, A. T. (1979). Cognitive therapy and the emotional disorders.", "practices": ["认知重构", "行为激活", "暴露疗法"], "evidence": "超过1000项随机对照试验证明CBT对抑郁、焦虑、创伤后应激障碍等多种心理问题有效"},
    {"id": "cognitive-triangle", "label": "认知三角", "category": "concept", "level": 2, "description": "认知三角模型揭示了思维、情绪和行为之间的相互作用关系。", "reference": "Beck, A. T. (1976).", "practices": ["思维记录", "情绪日记", "行为实验"], "evidence": "神经影像研究显示CBT能改变前额叶皮层和杏仁核的连接"},
    {"id": "cognitive-distortions", "label": "认知扭曲", "category": "concept", "level": 2, "description": "认知扭曲是系统性的思维错误，如非黑即白思维、灾难化、过度概括等。", "reference": "Burns, D. D. (1980). Feeling good: The new mood therapy.", "practices": ["识别扭曲", "苏格拉底式提问", "证据检验"]},
    {"id": "cognitive-restructuring", "label": "认知重构", "category": "technique", "level": 2, "description": "认知重构是CBT的核心技术，通过识别、挑战和改变不合理的思维来改善情绪。", "reference": "Beck, J. S. (2011). Cognitive behavior therapy: Basics and beyond.", "practices": ["ABCDE法", "思维记录表", "苏格拉底式对话"]},
    {"id": "behavioral-activation", "label": "行为激活", "category": "technique", "level": 2, "description": "行为激活通过增加愉悦活动和成就感来改善抑郁情绪。", "reference": "Martell, C. R., et al. (2010).", "practices": ["活动安排", "愉悦感评分", "逐步增加活动"], "evidence": "Meta分析显示行为激活对抑郁的效果与抗抑郁药物相当"},
    {"id": "exposure-therapy", "label": "暴露疗法", "category": "technique", "level": 2, "description": "暴露疗法通过逐步、系统地面对恐惧情境来减少焦虑。", "reference": "Foa, E. B., et al. (2009).", "practices": ["系统脱敏", "想象暴露", "现场暴露"]},
    {"id": "positive-psychology", "label": "积极心理学", "category": "therapy", "level": 1, "description": "积极心理学关注人类的优势、幸福感和蓬勃发展。", "reference": "Seligman, M. E., & Csikszentmihalyi, M. (2000).", "practices": ["感恩练习", "优势识别", "心流体验"], "evidence": "积极心理学干预可显著提升幸福感，效果持续6个月以上"},
    {"id": "perma-model", "label": "PERMA模型", "category": "concept", "level": 2, "description": "PERMA模型提出幸福的五个要素：积极情绪(P)、投入(E)、关系(R)、意义(M)、成就(A)。", "reference": "Seligman, M. E. (2011). Flourish.", "practices": ["每日三件好事", "感恩信", "优势使用"]},
    {"id": "gratitude", "label": "感恩练习", "category": "technique", "level": 2, "description": "感恩练习通过系统性地关注和记录生活中的美好事物来提升幸福感。", "reference": "Emmons, R. A., & McCullough, M. E. (2003).", "practices": ["感恩日记", "感恩信", "感恩冥想"], "evidence": "研究显示感恩练习可提升25%的幸福感和19%的生活满意度"},
    {"id": "flow", "label": "心流体验", "category": "concept", "level": 2, "description": "心流是一种完全投入某项活动的状态，带来深层的满足感。", "reference": "Csikszentmihalyi, M. (1990).", "practices": ["明确目标", "即时反馈", "技能与挑战匹配"]},
    {"id": "via-strengths", "label": "VIA性格优势", "category": "assessment", "level": 2, "description": "VIA性格优势分类包含24种普遍存在的人类优势。", "reference": "Peterson, C., & Seligman, M. E. (2004).", "practices": ["优势识别测试", "优势使用计划", "优势对话"]},
    {"id": "learned-optimism", "label": "习得性乐观", "category": "concept", "level": 2, "description": "乐观可以通过改变解释风格来习得。", "reference": "Seligman, M. E. (1990).", "practices": ["ABCDE法", "乐观思维训练", "反驳悲观想法"]},
    {"id": "mindfulness", "label": "正念冥想", "category": "technique", "level": 1, "description": "正念是有意识地、不加评判地关注当下体验的觉察状态。", "reference": "Tang, Y. Y., et al. (2015).", "practices": ["呼吸觉察", "身体扫描", "正念行走"], "evidence": "1分钟即可降低心率和皮质醇，7分钟改变脑电波"},
    {"id": "emotion-regulation", "label": "情绪调节", "category": "concept", "level": 1, "description": "情绪调节是指影响情绪产生、体验和表达的过程。", "reference": "Gross, J. J. (2015).", "practices": ["情境选择", "情境修正", "注意分配", "认知重评", "反应调节"], "evidence": "有效的情绪调节与更好的心理健康、人际关系和工作表现相关"},
    {"id": "resilience", "label": "心理韧性", "category": "concept", "level": 1, "description": "心理韧性是在面对逆境时适应和恢复的能力。", "reference": "Southwick, S. M., et al. (2014).", "practices": ["认知灵活性训练", "社会连接", "自我关怀"]}
  ],
  "links": [
    {"source": "cbt", "target": "cognitive-triangle"},
    {"source": "cbt", "target": "cognitive-distortions"},
    {"source": "cbt", "target": "cognitive-restructuring"},
    {"source": "cbt", "target": "behavioral-activation"},
    {"source": "cbt", "target": "exposure-therapy"},
    {"source": "cognitive-triangle", "target": "cognitive-restructuring"},
    {"source": "cognitive-distortions", "target": "cognitive-restructuring"},
    {"source": "positive-psychology", "target": "perma-model"},
    {"source": "positive-psychology", "target": "gratitude"},
    {"source": "positive-psychology", "target": "flow"},
    {"source": "positive-psychology", "target": "via-strengths"},
    {"source": "positive-psychology", "target": "learned-optimism"},
    {"source": "perma-model", "target": "gratitude"},
    {"source": "mindfulness", "target": "emotion-regulation"},
    {"source": "mindfulness", "target": "cognitive-restructuring"},
    {"source": "emotion-regulation", "target": "resilience"},
    {"source": "cognitive-restructuring", "target": "emotion-regulation"},
    {"source": "gratitude", "target": "resilience"},
    {"source": "learned-optimism", "target": "resilience"},
    {"source": "flow", "target": "perma-model"}
  ],
  "categories": {
    "therapy": {"label": "治疗方法", "color": "#5A9A8A"},
    "concept": {"label": "核心概念", "color": "#6B9BD1"},
    "technique": {"label": "实践技术", "color": "#7DD3C0"},
    "assessment": {"label": "评估工具", "color": "#E8B87D"}
  }
};

function loadGraphData() {
    console.log('[知识图谱] 初始化: ' + graphData.nodes.length + ' 节点, ' + graphData.links.length + ' 连接');
    initGraph();
}

function initGraph() {
    const container = document.getElementById('graph-svg');
    if (!container) {
        console.error('[知识图谱] 找不到容器元素 #graph-svg');
        return;
    }
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    // 如果容器尺寸为 0，使用视口尺寸
    if (width === 0 || height === 0) {
        console.warn('[知识图谱] 容器尺寸为 0，使用备用尺寸');
        width = window.innerWidth;
        height = window.innerHeight - 64;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
    }
    
    console.log(`[知识图谱] 初始化图形: ${width}x${height}`);
    
    // 移除原有的 svg 元素（如果存在），避免重复初始化
    const existingSvg = container.querySelector('svg');
    if (existingSvg) existingSvg.remove();
    
    svg = d3.select('#graph-svg')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'graph-canvas');
    
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    g = svg.append('g');
    
    simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));
    
    link = g.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke', '#999')
        .attr('stroke-width', 2);
    
    node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('click', (event, d) => {
            event.stopPropagation();
            // 选中状态
            d3.selectAll('.node').classed('selected', false);
            d3.select(event.currentTarget).classed('selected', true);
            showDetail(d);
        });
    
    node.append('circle')
        .attr('r', d => d.level === 1 ? 35 : 25)
        .attr('fill', d => graphData.categories[d.category].color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3);
    
    node.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#fff')
        .text(d => d.label.length > 4 ? d.label.substring(0, 4) : d.label);
    
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
}

function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
}

function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
}

function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}

function showDetail(node) {
    const panel = document.getElementById('detailPanel');
    const category = graphData.categories[node.category];
    
    document.getElementById('detail-title').textContent = node.label || node.name || '';
    document.getElementById('detail-description').textContent = node.description || '';
    
    const categoryColors = {
        'therapy': { bg: 'rgba(90,154,138,0.15)', color: '#5A9A8A' },
        'concept': { bg: 'rgba(107,155,209,0.15)', color: '#6B9BD1' },
        'technique': { bg: 'rgba(125,211,192,0.15)', color: '#7DD3C0' },
        'assessment': { bg: 'rgba(232,184,125,0.15)', color: '#E8B87D' },
    };
    const c = categoryColors[node.category] || { bg: 'rgba(90,154,138,0.15)', color: '#5A9A8A' };
    document.getElementById('detail-category').innerHTML = `
        <span class="detail-category-badge" style="background:${c.bg};color:${c.color};">
            <span style="width:8px;height:8px;border-radius:50%;background:${c.color};"></span>
            ${category.label || node.category || ''}
        </span>
    `;
    
    const refSection = document.getElementById('detail-reference-section');
    if (node.reference) {
        document.getElementById('detail-reference').textContent = node.reference;
        refSection.style.display = 'block';
    } else {
        refSection.style.display = 'none';
    }
    
    const evidenceSection = document.getElementById('detail-evidence-section');
    if (node.evidence) {
        document.getElementById('detail-evidence').textContent = node.evidence;
        evidenceSection.style.display = 'block';
    } else {
        evidenceSection.style.display = 'none';
    }
    
    const practicesSection = document.getElementById('detail-practices-section');
    if (node.practices && node.practices.length > 0) {
        document.getElementById('detail-practices').innerHTML = node.practices.map(p => 
            `<div style="padding:0.75rem;background:var(--color-primary-50);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                <p style="font-size:0.9rem;color:var(--theme-text);">${p}</p>
            </div>`
        ).join('');
        practicesSection.style.display = 'block';
    } else {
        practicesSection.style.display = 'none';
    }
    
    // 打开详情面板（调用 HTML 中定义的函数）
    if (typeof openDetailPanel === 'function') {
        openDetailPanel(node);
    } else {
        panel.classList.add('open');
        document.getElementById('detailOverlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeDetailPanel() {
    document.getElementById('detailPanel').classList.remove('open');
    document.getElementById('detailOverlay').classList.remove('open');
    document.body.style.overflow = '';
    // 取消节点选中状态
    if (typeof d3 !== 'undefined') {
        d3.selectAll('.node').classed('selected', false);
    }
}

window.addEventListener('resize', () => {
    const container = document.getElementById('graph-svg');
    if (!container || !svg) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.attr('width', width).attr('height', height);
    simulation.force('center', d3.forceCenter(width / 2, height / 2));
    simulation.alpha(1).restart();
});

// 点击图形区域关闭详情面板
document.addEventListener('click', (e) => {
    if (e.target.closest('.detail-panel') || e.target.closest('.legend-panel')) return;
    if (e.target.closest('.node')) return;
    closeDetailPanel();
});

// 页面加载时初始化
function init() {
    loadGraphData();
}

// 多种初始化策略确保执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM 已就绪，直接初始化
    init();
}
