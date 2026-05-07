/**
 * 知识库同步脚本 - 直接使用Upstash HTTP API
 * 不依赖@upstash/search包
 */

const https = require('https');

// Upstash配置
const UPSTASH_URL = 'https://hot-goose-65850-eu1-search.upstash.io';
const UPSTASH_TOKEN = 'ABMFMGhvdC1nb29zZS02NTg1MC1ldTFhZG1pbk1qQXhNMk01TldRdE1qSTFOaTAwWkRBekxXSXpNMlV0Wmpjd1kyUTFNamd3WVdZMA==';

const { PsychologyCrawler } = require('../server/services/crawler');

/**
 * Upstash HTTP客户端
 */
class UpstashClient {
    constructor(url, token) {
        this.baseUrl = url.replace('https://', '');
        this.token = token;
    }

    /**
     * 发送HTTP请求
     */
    async request(path, method = 'GET', body = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.baseUrl,
                path: path,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(JSON.parse(data || '{}'));
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    } catch (e) {
                        resolve(data);
                    }
                });
            });

            req.on('error', reject);
            
            if (body) {
                req.write(JSON.stringify(body));
            }
            
            req.end();
        });
    }

    /**
     * 创建索引
     */
    async createIndex(indexName) {
        try {
            await this.request(`/indexes/${indexName}`, 'PUT');
            console.log(`  ✓ 创建索引: ${indexName}`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`  ✓ 索引已存在: ${indexName}`);
            } else {
                throw error;
            }
        }
    }

    /**
     * 插入文档
     */
    async upsert(indexName, id, document) {
        const path = `/indexes/${indexName}/documents/${id}?upsert=true`;
        await this.request(path, 'PUT', document);
    }

    /**
     * 搜索文档
     */
    async search(indexName, query, limit = 100) {
        const path = `/indexes/${indexName}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
        return await this.request(path);
    }
}

async function syncKnowledge() {
    console.log('\n========================================');
    console.log('📚 知识库同步（HTTP API）');
    console.log('========================================\n');

    try {
        // 1. 初始化客户端
        console.log('1️⃣  初始化 Upstash 客户端...');
        const client = new UpstashClient(UPSTASH_URL, UPSTASH_TOKEN);
        console.log('✓ 客户端初始化成功');

        // 2. 创建索引
        console.log('\n2️⃣  创建索引...');
        await client.createIndex('psychology-knowledge');
        await client.createIndex('daily-tips');
        console.log('✓ 索引创建完成');

        // 3. 爬取知识
        console.log('\n3️⃣  爬取心理学知识...');
        const crawler = new PsychologyCrawler();
        const crawlData = await crawler.crawl();

        console.log(`✓ 爬取完成:`);
        console.log(`  心理知识: ${crawlData.knowledge.length} 条`);
        console.log(`  每日小贴士: ${crawlData.tips.length} 条`);

        // 4. 填充心理知识
        console.log('\n4️⃣  填充心理知识到 Upstash...');
        let knowledgeCount = 0;
        
        for (const knowledge of crawlData.knowledge) {
            try {
                const { id, ...content } = knowledge;
                await client.upsert('psychology-knowledge', id, {
                    content,
                    metadata: {
                        created_at: new Date().toISOString()
                    }
                });
                knowledgeCount++;
                console.log(`  ✓ ${knowledge.title}`);
            } catch (error) {
                console.error(`  ✗ ${knowledge.title}: ${error.message}`);
            }
        }

        console.log(`\n✓ 心理知识填充完成: ${knowledgeCount}/${crawlData.knowledge.length} 条`);

        // 5. 填充每日小贴士
        console.log('\n5️⃣  填充每日小贴士到 Upstash...');
        let tipsCount = 0;
        
        for (const tip of crawlData.tips) {
            try {
                const { id, ...content } = tip;
                await client.upsert('daily-tips', id, {
                    content,
                    metadata: {
                        created_at: new Date().toISOString()
                    }
                });
                tipsCount++;
            } catch (error) {
                console.error(`  ✗ 小贴士插入失败: ${error.message}`);
            }
        }

        console.log(`✓ 每日小贴士填充完成: ${tipsCount}/${crawlData.tips.length} 条`);

        // 6. 验证数据
        console.log('\n6️⃣  验证数据...');
        
        try {
            const knowledgeResult = await client.search('psychology-knowledge', '的', 100);
            const tipsResult = await client.search('daily-tips', '的', 100);

            console.log(`✓ 数据验证:`);
            console.log(`  心理知识总数: ${knowledgeResult.hits?.length || 0} 条`);
            console.log(`  每日小贴士总数: ${tipsResult.hits?.length || 0} 条`);
        } catch (error) {
            console.log(`⚠️  验证失败: ${error.message}`);
        }

        console.log('\n========================================');
        console.log('✅ 知识库同步完成！');
        console.log('========================================\n');

        console.log('📊 同步统计:');
        console.log(`  心理知识: ${knowledgeCount} 条`);
        console.log(`  每日小贴士: ${tipsCount} 条`);
        console.log(`  总计: ${knowledgeCount + tipsCount} 条\n`);

    } catch (error) {
        console.error('\n❌ 同步失败:', error.message);
        console.error('错误详情:', error);
        process.exit(1);
    }
}

// 运行同步
syncKnowledge().catch(console.error);
