/**
 * JSON 文件数据存储服务
 * 替代 Upstash Search，作为知识库主数据源
 *
 * 设计原则：
 * - 数据文件存于 server/data/ 目录（Git 版本控制）
 * - 运行时读写 server/data/*.json（开发环境可写）
 * - public/data/*.json 由 build 脚本生成（生产环境只读静态资源）
 * - 管理后台支持 JSON 编辑器直接修改
 */

const fs = require('fs');
const path = require('path');

// 数据文件目录
const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', '..', 'public', 'data');

// 确保 public/data 目录存在
function ensurePublicDataDir() {
    if (!fs.existsSync(PUBLIC_DATA_DIR)) {
        fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
    }
}

/**
 * 读取 JSON 数据文件
 * @param {string} collection - 集合名（如 'exercises', 'knowledge'）
 * @returns {Array} 数据数组
 */
function readData(collection) {
    const filePath = path.join(DATA_DIR, `${collection}.json`);
    try {
        if (!fs.existsSync(filePath)) return [];
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`[JSONStore] 读取 ${filePath} 失败:`, error.message);
        return [];
    }
}

/**
 * 写入 JSON 数据文件
 * @param {string} collection - 集合名
 * @param {Array} data - 数据数组
 */
function writeData(collection, data) {
    const filePath = path.join(DATA_DIR, `${collection}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    // 同时写入 public/data/（供静态引用）
    ensurePublicDataDir();
    const publicPath = path.join(PUBLIC_DATA_DIR, `${collection}.json`);
    fs.writeFileSync(publicPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 根据 ID 查询单条记录
 */
function findById(collection, id) {
    const data = readData(collection);
    return data.find(item => item.id === id) || null;
}

/**
 * 插入单条记录
 */
function insert(collection, record) {
    const data = readData(collection);
    const newRecord = {
        ...record,
        id: record.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    data.push(newRecord);
    writeData(collection, data);
    return newRecord;
}

/**
 * 批量插入记录
 */
function insertMany(collection, records) {
    const data = readData(collection);
    const now = new Date().toISOString();
    const newRecords = records.map(record => ({
        ...record,
        id: record.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: record.created_at || now,
        updated_at: now
    }));
    data.push(...newRecords);
    writeData(collection, data);
    return newRecords;
}

/**
 * 更新单条记录（按 ID）
 */
function update(collection, id, updates) {
    const data = readData(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = {
        ...data[index],
        ...updates,
        id: data[index].id,   // 不允许修改 ID
        created_at: data[index].created_at,
        updated_at: new Date().toISOString()
    };
    writeData(collection, data);
    return data[index];
}

/**
 * 删除单条记录（按 ID）
 */
function remove(collection, id) {
    const data = readData(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    writeData(collection, data);
    return true;
}

/**
 * 批量删除记录
 */
function removeMany(collection, ids) {
    const data = readData(collection);
    const idSet = new Set(ids);
    const filtered = data.filter(item => !idSet.has(item.id));
    writeData(collection, filtered);
    return filtered.length !== data.length;
}

/**
 * 分页查询
 */
function paginate(collection, { page = 1, limit = 10, sort = '', order = 'desc' } = {}) {
    let data = readData(collection);

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
function count(collection) {
    return readData(collection).length;
}

/**
 * 搜索（简单的包含匹配，不依赖向量）
 */
function search(collection, keyword, fields = ['title', 'description', 'content']) {
    const data = readData(collection);
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
 * 导出所有数据为 ZIP 或合并 JSON
 */
function exportAll() {
    const collections = ['exercises', 'knowledge', 'regulation', 'tips'];
    const result = {};
    for (const col of collections) {
        result[col] = readData(col);
    }
    return result;
}

/**
 * 从 Upstash 导入数据到 JSON 文件
 * 用于首次迁移或批量同步
 */
async function importFromUpstash(collection) {
    try {
        const { paginate: upstashPaginate } = require('../config/upstash');
        const allItems = [];
        let page = 1;
        const limit = 200;

        while (true) {
            const result = await upstashPaginate(collection, { page, limit });
            if (!result.items || result.items.length === 0) break;
            allItems.push(...result.items);
            if (result.items.length < limit) break;
            page++;
        }

        // 写入 JSON 文件
        const filePath = path.join(DATA_DIR, `${collection}.json`);
        fs.writeFileSync(filePath, JSON.stringify(allItems, null, 2), 'utf-8');
        ensurePublicDataDir();
        const publicPath = path.join(PUBLIC_DATA_DIR, `${collection}.json`);
        fs.writeFileSync(publicPath, JSON.stringify(allItems, null, 2), 'utf-8');

        return { success: true, count: allItems.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * 获取集合名映射（与 Upstash INDEX_NAMES 兼容）
 */
const COLLECTION_MAP = {
    exercises:   { file: 'exercises',   upstash: 'healingExercises',    display: '疗愈练习' },
    knowledge:   { file: 'knowledge',    upstash: 'psychologyKnowledge',  display: '心理学知识' },
    regulation:  { file: 'regulation',   upstash: 'emotionRegulation',    display: '情绪调节' },
    tips:        { file: 'tips',          upstash: 'dailyTips',            display: '每日提示' }
};

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
    importFromUpstash,
    COLLECTION_MAP,
    DATA_DIR,
    PUBLIC_DATA_DIR
};
