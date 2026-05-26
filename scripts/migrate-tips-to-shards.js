/**
 * 迁移脚本：将 tips.json 迁移到分片存储
 * 
 * 用法：node scripts/migrate-tips-to-shards.js
 *
 * 逻辑：
 * 1. 读取 data/tips.json（Blob 或本地降级）
 * 2. 为缺少 created_at 的记录补上当前日期
 * 3. 按 created_at 的月份分组，写入 data/tips/YYYY-MM.json
 * 4. 验证分片数据可正常读取
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const jsonStore = require('../server/services/jsonStore');
const shardedStore = require('../server/services/shardedStore');
const blobStore = require('../server/services/blobStore');

async function main() {
    console.log('[Migrate] 开始迁移 tips → 分片存储');

    // 1. 读取原始数据
    let tips;
    try {
        tips = await jsonStore.readData('tips');
    } catch (err) {
        console.error('[Migrate] 读取 tips 失败:', err.message);
        process.exit(1);
    }

    if (!Array.isArray(tips) || tips.length === 0) {
        console.log('[Migrate] tips 无数据，跳过迁移');
        return;
    }

    console.log(`[Migrate] 读取到 ${tips.length} 条 tips`);

    // 2. 补 created_at
    const now = new Date().toISOString();
    let backfilled = 0;
    for (const tip of tips) {
        if (!tip.created_at) {
            tip.created_at = now;
            backfilled++;
        }
    }
    if (backfilled > 0) {
        console.log(`[Migrate] 为 ${backfilled} 条记录补了 created_at`);
    }

    // 3. 按月份分组
    const groups = {};
    for (const tip of tips) {
        const month = tip.created_at.slice(0, 7); // "2026-05"
        if (!groups[month]) groups[month] = [];
        groups[month].push(tip);
    }

    console.log(`[Migrate] 分片分组:`, Object.keys(groups).map(m => `${m}(${groups[m].length}条)`).join(', '));

    // 4. 写入分片文件到 Blob
    for (const [month, items] of Object.entries(groups)) {
        const shardPath = `data/tips/${month}.json`;
        try {
            await blobStore.writeJsonToBlob(`tips/${month}.json`, items);
            console.log(`[Migrate] ✅ 写入分片 ${shardPath}: ${items.length} 条`);
        } catch (err) {
            console.error(`[Migrate] ❌ 写入分片 ${shardPath} 失败:`, err.message);
        }
    }

    // 5. 验证：用 shardedStore 读取全量
    try {
        const all = await shardedStore.readAll('tips');
        console.log(`[Migrate] ✅ 验证读取: ${all.length} 条（预期 ${tips.length}）`);
        if (all.length !== tips.length) {
            console.warn('[Migrate] ⚠ 分片读取条数不匹配！');
        }
    } catch (err) {
        console.error('[Migrate] ❌ 验证读取失败:', err.message);
    }

    console.log('');
    console.log('[Migrate] 迁移完成！');
    console.log('[Migrate] 原文件 data/tips.json 可保留作为降级备份，或手动删除。');
}

main().catch(err => {
    console.error('[Migrate] 致命错误:', err);
    process.exit(1);
});
