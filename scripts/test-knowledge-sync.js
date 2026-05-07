/**
 * 知识库同步测试脚本
 * 测试爬虫数据填充到Upstash数据库
 */

const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PsychologyCrawler } = require('../server/services/crawler');
const { insert, find, initDatabase } = require('../server/config/upstash');

async function testKnowledgeSync() {
    console.log('\n========================================');
    console.log('📚 知识库同步测试');
    console.log('========================================\n');

    try {
        // 1. 检查环境变量
        console.log('1️⃣  检查环境变量...');
        const upstashUrl = process.env.UPSTASH_SEARCH_REST_URL;
        const upstashToken = process.env.UPSTASH_SEARCH_REST_TOKEN;

        if (!upstashUrl || upstashUrl === 'https://your-instance.upstash.io') {
            console.error('❌ 错误：未配置 UPSTASH_SEARCH_REST_URL');
            console.log('\n请按以下步骤配置：');
            console.log('1. 访问 https://console.upstash.com/');
            console.log('2. 创建或选择一个 Search 实例');
            console.log('3. 复制 REST URL 和 REST Token');
            console.log('4. 更新 .env 文件中的配置');
            process.exit(1);
        }

        if (!upstashToken || upstashToken === 'your-token-here') {
            console.error('❌ 错误：未配置 UPSTASH_SEARCH_REST_TOKEN');
            console.log('\n请在 .env 文件中配置正确的 Token');
            process.exit(1);
        }

        console.log('✓ 环境变量已配置');
        console.log(`  URL: ${upstashUrl.substring(0, 30)}...`);

        // 2. 初始化数据库
        console.log('\n2️⃣  初始化 Upstash 数据库...');
        await initDatabase();
        console.log('✓ 数据库连接成功');

        // 3. 爬取知识
        console.log('\n3️⃣  爬取心理学知识...');
        const crawler = new PsychologyCrawler();
        const crawlData = await crawler.crawl();

        console.log(`✓ 爬取完成:`);
        console.log(`  心理知识: ${crawlData.knowledge.length} 条`);
        console.log(`  每日小贴士: ${crawlData.tips.length} 条`);

        // 4. 填充到数据库
        console.log('\n4️⃣  填充数据到 Upstash...');

        // 填充心理知识
        let knowledgeCount = 0;
        for (const knowledge of crawlData.knowledge) {
            try {
                await insert('psychologyKnowledge', knowledge);
                knowledgeCount++;
                console.log(`  ✓ ${knowledge.title}`);
            } catch (error) {
                console.error(`  ✗ ${knowledge.title}: ${error.message}`);
            }
        }

        // 填充每日小贴士
        let tipsCount = 0;
        for (const tip of crawlData.tips) {
            try {
                await insert('dailyTips', tip);
                tipsCount++;
            } catch (error) {
                console.error(`  ✗ 小贴士插入失败: ${error.message}`);
            }
        }

        console.log(`\n✓ 数据填充完成:`);
        console.log(`  心理知识: ${knowledgeCount}/${crawlData.knowledge.length} 条`);
        console.log(`  每日小贴士: ${tipsCount}/${crawlData.tips.length} 条`);

        // 5. 验证数据
        console.log('\n5️⃣  验证数据...');
        
        const savedKnowledge = await find('psychologyKnowledge');
        const savedTips = await find('dailyTips');

        console.log(`✓ 数据验证:`);
        console.log(`  心理知识总数: ${savedKnowledge.length} 条`);
        console.log(`  每日小贴士总数: ${savedTips.length} 条`);

        // 显示部分数据
        if (savedKnowledge.length > 0) {
            console.log('\n示例知识:');
            const sample = savedKnowledge[0];
            console.log(`  标题: ${sample.title}`);
            console.log(`  分类: ${sample.category}`);
            console.log(`  标签: ${sample.tags?.join(', ')}`);
        }

        console.log('\n========================================');
        console.log('✅ 测试完成！知识库同步成功');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('\n错误详情:', error);
        process.exit(1);
    }
}

// 运行测试
testKnowledgeSync().catch(console.error);
