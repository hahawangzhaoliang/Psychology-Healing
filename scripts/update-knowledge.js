#!/usr/bin/env node
/**
 * 知识库定时更新脚本
 * 可通过 cron 或 Windows 任务计划程序定时执行
 * 
 * 使用方法:
 *   node scripts/update-knowledge.js
 * 
 * 定时任务配置示例 (cron):
 *   0 6 * * * cd /path/to/Demo && node scripts/update-knowledge.js >> logs/knowledge-update.log 2>&1
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    
    // 写入日志文件
    const logFile = path.join(logsDir, `knowledge-update-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage);
}

async function main() {
    log('========================================');
    log('📚 知识库定时更新任务启动');
    log('========================================');
    
    try {
        // 动态导入服务
        const { updateKnowledge } = require('../server/services/knowledgeService');
        
        // 执行更新
        const stats = await updateKnowledge();
        
        log('----------------------------------------');
        log('📊 更新结果:');
        log(`   总条目: ${stats.totalItems}`);
        log(`   疗愈练习: ${stats.exercises}`);
        log(`   心理知识: ${stats.knowledge}`);
        log(`   情绪调节: ${stats.regulations}`);
        log(`   每日提示: ${stats.tips}`);
        log('----------------------------------------');
        log('✅ 知识库更新成功');
        
        process.exit(0);
    } catch (error) {
        log(`❌ 更新失败: ${error.message}`);
        log(error.stack);
        process.exit(1);
    }
}

main();
