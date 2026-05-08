let simulation, svg, g, link, node;
let graphData;

async function loadGraphData() {
    try {
        const response = await fetch('data/knowledge-graph.json');
        graphData = await response.json();
        initGraph();
    } catch (error) {
        console.error('加载知识图谱数据失败:', error);
    }
}

function initGraph() {
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
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
        .selectAll('g')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('click', (event, d) => showDetail(d));
    
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
    const panel = document.getElementById('detail-panel');
    const category = graphData.categories[node.category];
    
    document.getElementById('detail-title').textContent = node.label;
    document.getElementById('detail-description').textContent = node.description;
    
    document.getElementById('detail-category').innerHTML = 
        `<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold" style="background: ${category.color}20; color: ${category.color}">${category.label}</span>`;
    
    const refSection = document.getElementById('detail-reference-section');
    if (node.reference) {
        document.getElementById('detail-reference').textContent = node.reference;
        refSection.classList.remove('hidden');
    } else {
        refSection.classList.add('hidden');
    }
    
    const evidenceSection = document.getElementById('detail-evidence-section');
    if (node.evidence) {
        document.getElementById('detail-evidence').textContent = node.evidence;
        evidenceSection.classList.remove('hidden');
    } else {
        evidenceSection.classList.add('hidden');
    }
    
    const practicesSection = document.getElementById('detail-practices-section');
    if (node.practices) {
        const practicesHtml = node.practices.map(p => 
            `<div class="px-3 py-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">${p}</div>`
        ).join('');
        document.getElementById('detail-practices').innerHTML = practicesHtml;
        practicesSection.classList.remove('hidden');
    } else {
        practicesSection.classList.add('hidden');
    }
    
    panel.classList.remove('hidden');
}

function closeDetailPanel() {
    document.getElementById('detail-panel').classList.add('hidden');
}

window.addEventListener('resize', () => {
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.attr('width', width).attr('height', height);
    simulation.force('center', d3.forceCenter(width / 2, height / 2));
    simulation.alpha(1).restart();
});

document.addEventListener('DOMContentLoaded', loadGraphData);
