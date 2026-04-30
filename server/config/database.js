/**
 * JSON文件存储配置
 * 轻量级数据存储方案，无需数据库依赖
 */

const fs = require('fs');
const path = require('path');

// 数据存储目录
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

// 数据文件路径
const DATA_FILES = {
    emotionDiary: path.join(DATA_DIR, 'emotion_diary.json'),
    assessmentRecords: path.join(DATA_DIR, 'assessment_records.json'),
    feedback: path.join(DATA_DIR, 'feedback.json'),
    visitStats: path.join(DATA_DIR, 'visit_stats.json')
};

// 内存缓存
const cache = {};

/**
 * 确保数据目录存在
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * 读取JSON文件
 */
function readJsonFile(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
        return defaultValue;
    } catch (error) {
        console.error(`读取文件失败 ${filePath}:`, error.message);
        return defaultValue;
    }
}

/**
 * 写入JSON文件
 */
function writeJsonFile(filePath, data) {
    try {
        ensureDataDir();
        const content = JSON.stringify(data, null, 2);

        // 原子写入：先写 .tmp 文件，再 rename（Windows 同分区下为原子操作）
        const tmpPath = filePath + '.tmp';
        fs.writeFileSync(tmpPath, content, 'utf-8');
        fs.renameSync(tmpPath, filePath);

        return true;
    } catch (error) {
        console.error(`写入文件失败 ${filePath}:`, error.message);
        return false;
    }
}

/**
 * 初始化数据存储
 */
function initDatabase() {
    return new Promise((resolve) => {
        ensureDataDir();
        
        // 初始化各数据文件
        Object.entries(DATA_FILES).forEach(([key, filePath]) => {
            if (!fs.existsSync(filePath)) {
                writeJsonFile(filePath, []);
            }
            // 加载到缓存
            cache[key] = readJsonFile(filePath);
        });
        
        console.log('✓ JSON数据存储初始化完成');
        resolve();
    });
}

/**
 * 获取数据集合
 */
function getCollection(name) {
    if (!cache[name]) {
        cache[name] = readJsonFile(DATA_FILES[name], []);
    }
    return cache[name];
}

/**
 * 保存数据集合
 */
function saveCollection(name) {
    if (cache[name] && DATA_FILES[name]) {
        writeJsonFile(DATA_FILES[name], cache[name]);
    }
}

/**
 * 插入记录
 */
function insert(collectionName, record) {
    const collection = getCollection(collectionName);
    collection.push(record);
    saveCollection(collectionName);
    return record;
}

/**
 * 查询记录
 */
function find(collectionName, query = {}) {
    const collection = getCollection(collectionName);
    
    if (Object.keys(query).length === 0) {
        return collection;
    }
    
    return collection.filter(item => {
        return Object.entries(query).every(([key, value]) => {
            if (value === undefined || value === null) return true;
            return item[key] === value;
        });
    });
}

/**
 * 查询单条记录
 */
function findOne(collectionName, query) {
    const results = find(collectionName, query);
    return results[0] || null;
}

/**
 * 更新记录
 */
function update(collectionName, query, updates) {
    const collection = getCollection(collectionName);
    let updated = 0;
    
    collection.forEach((item, index) => {
        const match = Object.entries(query).every(([key, value]) => item[key] === value);
        if (match) {
            collection[index] = { ...item, ...updates, updated_at: new Date().toISOString() };
            updated++;
        }
    });
    
    if (updated > 0) {
        saveCollection(collectionName);
    }
    
    return updated;
}

/**
 * 删除记录
 */
function remove(collectionName, query) {
    const collection = getCollection(collectionName);
    const initialLength = collection.length;
    
    const filtered = collection.filter(item => {
        return !Object.entries(query).every(([key, value]) => item[key] === value);
    });
    
    cache[collectionName] = filtered;
    saveCollection(collectionName);
    
    return initialLength - filtered.length;
}

/**
 * 统计记录数
 */
function count(collectionName, query = {}) {
    const results = find(collectionName, query);
    return results.length;
}

/**
 * 分页查询
 */
function paginate(collectionName, options = {}) {
    const { page = 1, limit = 10, sort, query = {} } = options;
    
    let results = find(collectionName, query);
    
    // 排序
    if (sort) {
        results.sort((a, b) => {
            const [field, order] = Object.entries(sort)[0];
            return order === 'desc' 
                ? (b[field] > a[field] ? 1 : -1)
                : (a[field] > b[field] ? 1 : -1);
        });
    }
    
    // 分页
    const total = results.length;
    const offset = (page - 1) * limit;
    const data = results.slice(offset, offset + limit);
    
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * 聚合统计
 */
function aggregate(collectionName, field) {
    const collection = getCollection(collectionName);
    const stats = {};
    
    collection.forEach(item => {
        const value = item[field];
        if (value !== undefined) {
            stats[value] = (stats[value] || 0) + 1;
        }
    });
    
    return Object.entries(stats).map(([key, count]) => ({ [field]: key, count }));
}

/**
 * 清空集合
 */
function clear(collectionName) {
    cache[collectionName] = [];
    saveCollection(collectionName);
}

/**
 * 导出数据
 */
function exportData() {
    const data = {};
    Object.keys(DATA_FILES).forEach(key => {
        data[key] = getCollection(key);
    });
    return data;
}

/**
 * 导入数据
 */
function importData(data) {
    Object.entries(data).forEach(([key, value]) => {
        if (DATA_FILES[key] && Array.isArray(value)) {
            cache[key] = value;
            saveCollection(key);
        }
    });
}

module.exports = {
    initDatabase,
    getCollection,
    saveCollection,
    insert,
    find,
    findOne,
    update,
    remove,
    count,
    paginate,
    aggregate,
    clear,
    exportData,
    importData,
    DATA_FILES
};
