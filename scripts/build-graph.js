// 根据现有 exercises.json 和 knowledge.json 自动生成知识图谱
const fs = require('fs');
const exercises = JSON.parse(fs.readFileSync('./server/data/exercises.json', 'utf8'));
const knowledge = JSON.parse(fs.readFileSync('./server/data/knowledge.json', 'utf8'));

const nodes = [];
const edges = [];

for (const ex of exercises) {
    nodes.push({ id: ex.id, label: ex.title, type: 'exercise', category: ex.category });
}

for (const k of knowledge) {
    nodes.push({ id: k.id, label: k.title, type: 'knowledge', category: k.category });
}

// 通过共同标签建立关联
for (const ex of exercises) {
    for (const k of knowledge) {
        const common = ex.tags && k.tags && ex.tags.filter(t => k.tags.includes(t));
        if (common && common.length > 0) {
            edges.push({ source: ex.id, target: k.id, type: 'related', label: common[0] });
        }
    }
}

const graph = [{ id: 'psychology-graph', nodes, edges }];
const out = JSON.stringify(graph, null, 2);
fs.writeFileSync('./server/data/graph.json', out);
fs.writeFileSync('./public/data/graph.json', out);
console.log(`graph.json: ${nodes.length} nodes, ${edges.length} edges`);
