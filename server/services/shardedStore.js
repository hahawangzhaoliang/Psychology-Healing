/**
 * 通用分片存储层（Sharded Store）
 * 
 * 将大集合按分片键（默认按月份）拆成多个小文件，
 * 减少单次读写的数据量。
 *
 * 分片规则（按月份）：
 *   data/tips/2026-05.json
 *   data/tips/2026-06.json
 *
 * 读取时合并所有分片；写入时只写当前分片。
 * 更新/删除需要定位分片，然后重写该分片文件。
 */

const path = require('path');
const blobStore = require('./blobStore');
const fs = require('fs');
const fsp = fs.promises;

// 分片配置：集合名 -> { shardBy, shardDir }
const SHARD_CONFIG = {
    tips: {
        shardBy: 'month',       // 按月份分片
        shardDir: 'tips',       // Blob 路径：data/tips/
        primaryFile: 'tips.json', // 未分片前的原始文件
    },
    // 未来可扩展：
    // exercises: { shardBy: 'category', shardDir: 'exercises', ... }
};

/**
 * 获取当前分片名（按月份）
 */
function getCurrentShard() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

/**
 * 根据记录获取所属分片名
 */
function getShardName(collection, record) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) return null;

    if (cfg.shardBy === 'month') {
        // 优先用 created_at，其次 updated_at，都没有则用当前月份
        if (record.created_at) {
            return record.created_at.slice(0, 7); // "2026-05"
        }
        if (record.updated_at) {
            return record.updated_at.slice(0, 7);
        }
        return getCurrentShard();
    }

    if (cfg.shardBy === 'category') {
        return record.category || 'other';
    }

    return getCurrentShard();
}

/**
 * 列出某个集合的所有分片文件路径
 */
async function listShards(collection) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) return [];

    const prefix = `data/${cfg.shardDir}/`;
    try {
        const result = await blobStore.listFiles(prefix);
        // result: { paths, cursor, hasMore }
        return (result.paths || []).filter(f => f.endsWith('.json'));
    } catch {
        return [];
    }
}

/**
 * 读取单个分片
 */
async function readShard(collection, shardName) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) return [];

    // 注意：readJsonFromBlob 内部会拼接 DATA_PREFIX ('data/')
    // 所以这里只传相对路径，不要加 'data/' 前缀
    const filePath = `${cfg.shardDir}/${shardName}.json`;
    try {
        const data = await blobStore.readJsonFromBlob(filePath);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

/**
 * 写入单个分片
 */
async function writeShard(collection, shardName, data) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) throw new Error(`No shard config for ${collection}`);

    // 注意：writeJsonToBlob 内部会拼接 DATA_PREFIX ('data/')
    const filePath = `${cfg.shardDir}/${shardName}.json`;
    await blobStore.writeJsonToBlob(filePath, data);
}

// ==================== 对外接口 ====================

/**
 * 读取集合全量数据（合并所有分片）
 */
async function readAll(collection) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) {
        // 未配置分片，回退到 jsonStore
        const jsonStore = require('./jsonStore');
        return jsonStore.readData(collection);
    }

    const shards = await listShards(collection);
    if (shards.length === 0) {
        // 还没有分片，尝试读原始文件
        const jsonStore = require('./jsonStore');
        return jsonStore.readData(collection);
    }

    const results = await Promise.all(
        shards.map(shardPath => {
            const shardName = path.basename(shardPath, '.json');
            return readShard(collection, shardName);
        })
    );

    return results.flat();
}

/**
 * 插入单条记录（写到当前分片）
 */
async function insert(collection, record) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) {
        const jsonStore = require('./jsonStore');
        return jsonStore.insert(collection, record);
    }

    const now = new Date().toISOString();
    const shardName = getShardName(collection, { created_at: now });
    const data = await readShard(collection, shardName);

    const newRecord = {
        ...record,
        id: record.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: record.created_at || now,
        updated_at: now,
    };

    data.push(newRecord);
    await writeShard(collection, shardName, data);
    return newRecord;
}

/**
 * 批量插入
 */
async function insertMany(collection, records) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) {
        const jsonStore = require('./jsonStore');
        return jsonStore.insertMany(collection, records);
    }

    // 按分片分组
    const shardGroups = {};
    const now = new Date().toISOString();

    for (const record of records) {
        const shardName = getShardName(collection, { created_at: record.created_at || now });
        if (!shardGroups[shardName]) shardGroups[shardName] = [];
        shardGroups[shardName].push({
            ...record,
            id: record.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            created_at: record.created_at || now,
            updated_at: now,
        });
    }

    const results = [];
    for (const [shardName, items] of Object.entries(shardGroups)) {
        const data = await readShard(collection, shardName);
        data.push(...items);
        await writeShard(collection, shardName, data);
        results.push(...items);
    }

    return results;
}

/**
 * 按 ID 查找（需遍历分片）
 */
async function findById(collection, id) {
    const all = await readAll(collection);
    return all.find(item => item.id === id) || null;
}

/**
 * 更新记录（需定位分片）
 */
async function update(collection, id, updates) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) {
        const jsonStore = require('./jsonStore');
        return jsonStore.update(collection, id, updates);
    }

    const shards = await listShards(collection);
    for (const shardPath of shards) {
        const shardName = path.basename(shardPath, '.json');
        const data = await readShard(collection, shardName);
        const index = data.findIndex(item => item.id === id);
        if (index === -1) continue;

        data[index] = {
            ...data[index],
            ...updates,
            updated_at: new Date().toISOString(),
        };
        await writeShard(collection, shardName, data);
        return data[index];
    }

    // 分片里没找到，尝试从原始文件读取
    const jsonStore = require('./jsonStore');
    return jsonStore.update(collection, id, updates);
}

/**
 * 删除记录（需定位分片）
 */
async function remove(collection, id) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) {
        const jsonStore = require('./jsonStore');
        return jsonStore.remove(collection, id);
    }

    const shards = await listShards(collection);
    for (const shardPath of shards) {
        const shardName = path.basename(shardPath, '.json');
        const data = await readShard(collection, shardName);
        const index = data.findIndex(item => item.id === id);
        if (index === -1) continue;

        data.splice(index, 1);
        await writeShard(collection, shardName, data);
        return true;
    }

    return false;
}

/**
 * 分页查询（合并所有分片后分页）
 */
async function paginate(collection, { page = 1, limit = 10, sort = '', order = 'desc' } = {}) {
    let data = await readAll(collection);

    if (sort) {
        data.sort((a, b) => {
            const aVal = a[sort] ?? '';
            const bVal = b[sort] ?? '';
            const cmp = String(aVal).localeCompare(String(bVal), 'zh-CN');
            return order === 'asc' ? cmp : -cmp;
        });
    }

    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = data.slice(offset, offset + limit);

    return { items, total, page, limit, totalPages };
}

/**
 * 搜索（合并所有分片后搜索）
 */
async function search(collection, keyword, fields = ['title', 'description', 'content']) {
    const data = await readAll(collection);
    if (!keyword) return data;
    const kw = keyword.toLowerCase();
    return data.filter(item =>
        fields.some(field => {
            const val = item[field];
            return val && String(val).toLowerCase().includes(kw);
        })
    );
}

/**
 * 统计条数
 */
async function count(collection) {
    const data = await readAll(collection);
    return data.length;
}

/**
 * 迁移：将原始单文件迁移到分片
 * 按每条记录的 created_at 分到对应月份文件
 */
async function migrateToShards(collection) {
    const cfg = SHARD_CONFIG[collection];
    if (!cfg) throw new Error(`No shard config for ${collection}`);

    const jsonStore = require('./jsonStore');
    const allData = await jsonStore.readData(collection);

    if (!Array.isArray(allData) || allData.length === 0) {
        console.log(`[ShardedStore] ${collection} 无数据，跳过迁移`);
        return { shards: 0, total: 0 };
    }

    // 按分片分组
    const groups = {};
    for (const item of allData) {
        const shardName = getShardName(collection, item);
        if (!groups[shardName]) groups[shardName] = [];
        groups[shardName].push(item);
    }

    // 写入各分片文件
    for (const [shardName, items] of Object.entries(groups)) {
        await writeShard(collection, shardName, items);
        console.log(`[ShardedStore] 分片 ${shardName}: ${items.length} 条`);
    }

    return { shards: Object.keys(groups).length, total: allData.length };
}

module.exports = {
    readAll,
    insert,
    insertMany,
    findById,
    update,
    remove,
    paginate,
    search,
    count,
    migrateToShards,
    SHARD_CONFIG,
};
