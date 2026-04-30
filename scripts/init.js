/**
 * 数据初始化脚本
 * 运行: npm run init
 */

const path = require('path');
const fs = require('fs');

console.log('🌱 开始初始化数据...\n');

// 数据目录
const DATA_DIR = path.join(__dirname, '../data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('✓ 创建数据目录');
}

// 初始化数据文件
const dataFiles = {
    'emotion_diary.json': [],
    'assessment_records.json': [],
    'feedback.json': [],
    'visit_stats.json': []
};

console.log('📦 初始化数据文件...');

Object.entries(dataFiles).forEach(([filename, defaultData]) => {
    const filePath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        console.log(`✓ 创建 ${filename}`);
    } else {
        console.log(`- ${filename} 已存在`);
    }
});

console.log('\n✨ 数据初始化完成！\n');
console.log('运行 npm start 启动服务器');
