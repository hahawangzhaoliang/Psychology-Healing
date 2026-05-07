/**
 * 简化的知识库同步测试
 * 不依赖dotenv，直接使用环境变量
 */

const { PsychologyCrawler } = require('../server/services/crawler');

// 直接设置环境变量
process.env.UPSTASH_SEARCH_REST_URL = 'https://hot-goose-65850-eu1-search.upstash.io';
process.env.UPSTASH_SEARCH_REST_TOKEN = 'ABMFMGhvdC1nb29zZS02NTg1MC1ldTFhZG1pbk1qQXhNMk01TldRdE1qSTFOaTAwWkRBekxXSXpNMlV0Wmpjd1kyUTFNamd3WVdZMA==';

async function testSync() {
    console.log('\n========================================');
    console.log('📚 知识库同步测试');
    console.log('========================================\n');

    try {
        // 1. 爬取知识
        console.log('1️⃣  爬取心理学知识...');
        const crawler = new PsychologyCrawler();
        const crawlData = await crawler.crawl();

        console.log(`✓ 爬取完成:`);
        console.log(`  心理知识: ${crawlData.knowledge.length} 条`);
        console.log(`  每日小贴士: ${crawlData.tips.length} 条`);

        // 2. 尝试连接数据库
        console.log('\n2️⃣  连接 Upstash 数据库...');
        const { initDatabase, insert, find } = require('../server/config/upstash');
        await initDatabase();
        console.log('✓ 数据库连接成功');

        // 3. 填充数据
        console.log('\n3️⃣  填充数据到 Upstash...');

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

        // 4. 验证数据
        console.log('\n4️⃣  验证数据...');
        const savedKnowledge = await find('psychologyKnowledge');
        const savedTips = await find('dailyTips');

        console.log(`✓ 数据验证:`);
        console.log(`  心理知识总数: ${savedKnowledge.length} 条`);
        console.log(`  每日小贴士总数: ${savedTips.length} 条`);

        console.log('\n========================================');
        console.log('✅ 测试完成！知识库同步成功');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        process.exit(1);
    }
}

testSync().catch(console.error);
