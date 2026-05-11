/**
 * JSON 数据存储服务（Vercel Blob 版）
 * 替代本地文件系统，作为知识库主数据源
 * 所有方法均为异步（因为 Blob 读取是异步的）
 *
 * 设计原则：
 * - JSON 数据文件存于 Vercel Blob（路径：data/*.json）
 * - 前端通过 /api/admin/data/* 接口读写
 * - 管理后台支持 JSON 编辑器直接修改
 * - 图片/音频等媒体文件也存于 Blob（路径：media/images/*, media/audio/*）
 */

const blobStore = require('./blobStore');

// 集合名到文件名的映射
const COLLECTION_FILE_MAP = {
    exercises:   'exercises.json',
    knowledge:   'knowledge.json',
    regulation:  'regulation.json',
    tips:        'tips.json',
    graph:       'graph.json',
};

// 文件名到集合名的映射（反向）
const FILE_COLLECTION_MAP = {};
for (const [key, val] of Object.entries(COLLECTION_FILE_MAP)) {
    FILE_COLLECTION_MAP[val] = key;
}

/**
 * 读取 JSON 数据文件（从 Blob）
 * @param {string} collection - 集合名（如 'exercises', 'knowledge'）
 * @returns {Promise<Array>} 数据数组
 */
async function readData(collection) {
    const filename = COLLECTION_FILE_MAP[collection] || `${collection}.json`;
    try {
        const data = await blobStore.readJsonFromBlob(filename);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`[JSONStore] 读取 ${collection} 失败:`, error.message);
        return [];
    }
}

/**
 * 写入 JSON 数据文件（到 Blob）
 * @param {string} collection - 集合名
 * @param {Array} data - 数据数组
 */
async function writeData(collection, data) {
    const filename = COLLECTION_FILE_MAP[collection] || `${collection}.json`;
    try {
        await blobStore.writeJsonToBlob(filename, data);
    } catch (error) {
        console.error(`[JSONStore] 写入 ${collection} 失败:`, error.message);
        throw error;
    }
}

/**
 * 根据 ID 查询单条记录
 */
async function findById(collection, id) {
    const data = await readData(collection);
    return data.find(item => item.id === id) || null;
}

/**
 * 插入单条记录
 */
async function insert(collection, record) {
    const data = await readData(collection);
    const now = new Date().toISOString();
    const newRecord = {
        ...record,
        id: record.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: record.created_at || now,
        updated_at: now,
    };
    data.push(newRecord);
    await writeData(collection, data);
    return newRecord;
}

/**
 * 批量插入记录
 */
async function insertMany(collection, records) {
    const data = await readData(collection);
    const now = new Date().toISOString();
    const newRecords = records.map(record => ({
        ...record,
        id: record.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: record.created_at || now,
        updated_at: now,
    }));
    data.push(...newRecords);
    await writeData(collection, data);
    return newRecords;
}

/**
 * 更新单条记录（按 ID）
 */
async function update(collection, id, updates) {
    const data = await readData(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = {
        ...data[index],
        ...updates,
        id: data[index].id,   // 不允许修改 ID
        created_at: data[index].created_at,
        updated_at: new Date().toISOString(),
    };
    await writeData(collection, data);
    return data[index];
}

/**
 * 删除单条记录（按 ID）
 */
async function remove(collection, id) {
    const data = await readData(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    await writeData(collection, data);
    return true;
}

/**
 * 批量删除记录
 */
async function removeMany(collection, ids) {
    const data = await readData(collection);
    const idSet = new Set(ids);
    const filtered = data.filter(item => !idSet.has(item.id));
    if (filtered.length === data.length) return false;
    await writeData(collection, filtered);
    return true;
}

/**
 * 分页查询
 */
async function paginate(collection, { page = 1, limit = 10, sort = '', order = 'desc' } = {}) {
    let data = await readData(collection);

    // 排序
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
 * 统计数据条数
 */
async function count(collection) {
    const data = await readData(collection);
    return data.length;
}

/**
 * 搜索（简单的包含匹配，不依赖向量）
 */
async function search(collection, keyword, fields = ['title', 'description', 'content']) {
    const data = await readData(collection);
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
 * 导出所有数据为合并 JSON
 */
async function exportAll() {
    const collections = ['exercises', 'knowledge', 'regulation', 'tips'];
    const result = {};
    for (const col of collections) {
        result[col] = await readData(col);
    }
    return result;
}

/**
 * 获取所有集合的统计信息
 * @returns {Promise<Object>} { collectionKey: count }
 */
async function getStats() {
    const collections = ['exercises', 'knowledge', 'regulation', 'tips', 'graph'];
    const stats = {};
    for (const col of collections) {
        try {
            const data = await readData(col);
            stats[col] = Array.isArray(data) ? data.length : 0;
        } catch {
            stats[col] = 0;
        }
    }
    return stats;
}

/**
 * 获取集合名映射（与 Upstash INDEX_NAMES 兼容）
 */
const COLLECTION_MAP = {
    exercises:   { file: 'exercises',   blobPath: 'data/exercises.json',  display: '疗愈练习' },
    knowledge:   { file: 'knowledge',   blobPath: 'data/knowledge.json',  display: '心理学知识' },
    regulation:  { file: 'regulation',  blobPath: 'data/regulation.json', display: '情绪调节' },
    tips:        { file: 'tips',        blobPath: 'data/tips.json',       display: '每日提示' },
    graph:       { file: 'graph',       blobPath: 'data/graph.json',      display: '知识图谱' },
};

/**
 * 列出所有集合的详细信息（供管理后台使用）
 */
async function listCollections() {
    const collections = ['exercises', 'knowledge', 'regulation', 'tips'];
    const result = [];

    for (const key of collections) {
        const col = COLLECTION_MAP[key];
        try {
            const dataCount = await count(key);
            result.push({
                key,
                displayName: col.display,
                fileName: COLLECTION_FILE_MAP[key],
                blobPath: col.blobPath,
                count: dataCount,
            });
        } catch {
            result.push({
                key,
                displayName: col.display,
                fileName: COLLECTION_FILE_MAP[key],
                blobPath: col.blobPath,
                count: 0,
            });
        }
    }

    return result;
}

module.exports = {
    readData,
    writeData,
    findById,
    insert,
    insertMany,
    update,
    remove,
    removeMany,
    paginate,
    count,
    search,
    exportAll,
    getStats,
    listCollections,
    COLLECTION_MAP,
    COLLECTION_FILE_MAP,
};
