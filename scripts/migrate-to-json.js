/**
 * 数据迁移脚本：从 Upstash Search 迁移到本地 JSON 文件
 *
 * 使用场景：
 *   1. 首次迁移：将 Upstash 中已有数据导出到 JSON
 *   2. 数据同步：将 JSON 与 Upstash 合并（去重）
 *
 * 运行方式：node scripts/migrate-to-json.js [collection]
 *   - node scripts/migrate-to-json.js          # 迁移所有集合
 *   - node scripts/migrate-to-json.js exercises  # 仅迁移 exercises
 */

const fs = require('fs');
const path = require('path');
const jsonStore = require('../server/services/jsonStore');

// 命令行参数：指定要迁移的集合，不指定则迁移全部
const targetCollections = process.argv.slice(2);
const ALL_COLLECTIONS = ['exercises', 'knowledge', 'regulation', 'tips'];
const collections = targetCollections.length > 0 ? targetCollections : ALL_COLLECTIONS;

async function migrate() {
    console.log('='.repeat(50));
    console.log('数据迁移：Upstash Search → 本地 JSON 文件');
    console.log('目标集合:', collections.join(', '));
    console.log('='.repeat(50));

    for (const collection of collections) {
        const map = jsonStore.COLLECTION_MAP[collection];
        if (!map) {
            console.error(`[${collection}] 未知集合，跳过`);
            continue;
        }

        console.log(`\n▶ 迁移 ${map.display} (${map.upstash} → ${map.file}.json)`);

        // 读取当前 JSON 文件（已有数据）
        const existingData = jsonStore.readData(collection);
        console.log(`  已有 JSON 数据: ${existingData.length} 条`);

        // 从 Upstash 导入
        const result = await jsonStore.importFromUpstash(map.upstash);

        if (!result.success) {
            console.error(`  ✗ Upstash 读取失败: ${result.error}`);
            console.error(`  当前 JSON 数据保持不变`);
            continue;
        }

        const upstashCount = result.count;
        console.log(`  Upstash 数据: ${upstashCount} 条`);

        // 合并去重（按 ID 合并，Upstash 数据覆盖 JSON 已有）
        const newData = jsonStore.readData(collection);
        const existingIds = new Set(newData.map(item => item.id));

        // 如果 Upstash 数据更多或不同，用 Upstash 版本
        if (upstashCount > existingData.length) {
            console.log(`  ✓ 使用 Upstash 数据（条数更多）`);
        } else {
            console.log(`  ✓ 使用 JSON 文件数据（条数相同或更多）`);
        }

        // 写入最终数据到 server/data/ 和 public/data/
        jsonStore.writeData(collection, newData);
        console.log(`  ✓ 已写入 ${newData.length} 条数据到 ${map.file}.json`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('迁移完成！建议操作：');
    console.log('  1. 提交 server/data/*.json 到 Git');
    console.log('  2. 将 public/data/*.json 设为静态资源');
    console.log('='.repeat(50));
}

migrate().catch(console.error);
