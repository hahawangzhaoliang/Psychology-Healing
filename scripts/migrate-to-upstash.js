#!/usr/bin/env node
/**
 * 数据迁移脚本
 * 将 JSON 文件数据导入到 Upstash Search
 * 
 * 使用方法:
 *   1. 确保 .env 文件中配置了 UPSTASH_SEARCH_URL 和 UPSTASH_SEARCH_TOKEN
 *   2. 运行: node scripts/migrate-to-upstash.js
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { initDatabase, insert, insertMany, clear } = require('../server/config/upstash');

// 数据目录
const DATA_DIR = path.join(__dirname, '../Data');

/**
 * 查找知识库数据文件
 */
function findKnowledgeDataFile() {
    // 先查找带日期的文件（任意日期）
    const files = fs.readdirSync(DATA_DIR);
    const datedFile = files.find(f => f.match(/^psychology_healing_data_\d{4}-\d{2}-\d{2}\.json$/));
    
    if (datedFile) {
        return path.join(DATA_DIR, datedFile);
    }
    
    // 回退到默认文件
    const defaultFile = path.join(DATA_DIR, 'psychology_healing_data.json');
    if (fs.existsSync(defaultFile)) {
        return defaultFile;
    }
    
    return null;
}

/**
 * 迁移知识库数据
 */
async function migrateKnowledgeData() {
    const dataFile = findKnowledgeDataFile();
    
    if (!dataFile) {
        console.log('⚠️  未找到知识库数据文件，跳过迁移');
        return;
    }
    
    console.log(`📄 读取数据文件: ${dataFile}`);
    const content = fs.readFileSync(dataFile, 'utf-8');
    const data = JSON.parse(content);
    
    console.log('\n📦 开始迁移知识库数据...\n');
    
    // 迁移疗愈练习
    if (data.healingExercises?.length > 0) {
        console.log(`  疗愈练习: ${data.healingExercises.length} 条`);
        await clear('healingExercises');
        for (const ex of data.healingExercises) {
            await insert('healingExercises', ex);
        }
    }
    
    // 迁移心理知识
    if (data.psychologyKnowledge?.length > 0) {
        console.log(`  心理知识: ${data.psychologyKnowledge.length} 条`);
        await clear('psychologyKnowledge');
        for (const k of data.psychologyKnowledge) {
            await insert('psychologyKnowledge', k);
        }
    }
    
    // 迁移情绪调节方案
    if (data.emotionRegulation?.length > 0) {
        console.log(`  情绪调节: ${data.emotionRegulation.length} 条`);
        await clear('emotionRegulation');
        for (const reg of data.emotionRegulation) {
            await insert('emotionRegulation', reg);
        }
    }
    
    // 迁移每日提示
    if (data.dailyTips?.length > 0) {
        console.log(`  每日提示: ${data.dailyTips.length} 条`);
        await clear('dailyTips');
        for (const tip of data.dailyTips) {
            await insert('dailyTips', tip);
        }
    }
    
    // 迁移快速练习
    if (data.quickExercises?.length > 0) {
        console.log(`  快速练习: ${data.quickExercises.length} 条`);
        await clear('quickExercises');
        for (const ex of data.quickExercises) {
            await insert('quickExercises', ex);
        }
    }
    
    // 迁移知识图谱
    if (data.knowledgeGraph) {
        console.log(`  知识图谱: ${data.knowledgeGraph.nodes?.length || 0} 节点, ${data.knowledgeGraph.edges?.length || 0} 边`);
        await clear('knowledgeGraph');
        await insert('knowledgeGraph', {
            id: 'graph_001',
            nodes: data.knowledgeGraph.nodes || [],
            edges: data.knowledgeGraph.edges || []
        });
    }
    
    // 迁移元数据
    if (data.metadata) {
        console.log(`  元数据: 版本 ${data.metadata.version}`);
        await clear('metadata');
        await insert('metadata', {
            id: 'metadata_001',
            ...data.metadata
        });
    }
    
    // 迁移统计数据
    if (data.statistics) {
        console.log(`  统计数据`);
        await insert('metadata', {
            id: 'statistics_001',
            statistics: data.statistics
        });
    }
    
    console.log('\n✅ 知识库数据迁移完成');
}

/**
 * 迁移用户数据
 */
async function migrateUserData() {
    const files = [
        { name: 'emotionDiary', file: 'emotion_diary.json' },
        { name: 'assessmentRecords', file: 'assessment_records.json' },
        { name: 'feedback', file: 'feedback.json' },
        { name: 'visitStats', file: 'visit_stats.json' }
    ];
    
    console.log('\n📦 开始迁移用户数据...\n');
    
    for (const { name, file } of files) {
        const filePath = path.join(DATA_DIR, file);
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            let data;
            
            try {
                data = JSON.parse(content);
            } catch (e) {
                console.log(`  ${name}: 文件为空或格式错误，跳过`);
                continue;
            }
            
            if (Array.isArray(data) && data.length > 0) {
                console.log(`  ${name}: ${data.length} 条`);
                await clear(name);
                for (const item of data) {
                    await insert(name, item);
                }
            } else {
                console.log(`  ${name}: 无数据，跳过`);
            }
        } else {
            console.log(`  ${name}: 文件不存在，跳过`);
        }
    }
    
    console.log('\n✅ 用户数据迁移完成');
}

/**
 * 主函数
 */
async function main() {
    console.log('\n========================================');
    console.log('🔄 数据迁移脚本');
    console.log('  从 JSON 文件迁移到 Upstash Search');
    console.log('========================================\n');
    
    // 检查环境变量
    const url = process.env.UPSTASH_SEARCH_REST_URL || process.env.UPSTASH_SEARCH_URL;
    const token = process.env.UPSTASH_SEARCH_REST_TOKEN || process.env.UPSTASH_SEARCH_TOKEN;
    
    if (!url || !token) {
        console.error('❌ 错误: 请在 .env 文件中配置 UPSTASH_SEARCH_REST_URL 和 UPSTASH_SEARCH_REST_TOKEN');
        process.exit(1);
    }
    
    try {
        // 初始化数据库连接
        console.log('🔌 连接 Upstash Search...');
        await initDatabase();
        
        // 迁移知识库数据
        await migrateKnowledgeData();
        
        // 迁移用户数据
        await migrateUserData();
        
        console.log('\n========================================');
        console.log('🎉 所有数据迁移完成！');
        console.log('========================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 迁移失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
