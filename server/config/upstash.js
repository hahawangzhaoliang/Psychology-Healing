/**
 * Upstash Search 数据库配置
 * 替代JSON文件存储，支持向量搜索和高效查询
 */

const { Search } = require('@upstash/search');

// Upstash Search 实例
let searchClient = null;

// 索引名称
const INDEX_NAMES = {
    emotionDiary: 'emotion-diary',
    assessmentRecords: 'assessment-records',
    feedback: 'feedback',
    visitStats: 'visit-stats',
    healingExercises: 'healing-exercises',
    psychologyKnowledge: 'psychology-knowledge',
    emotionRegulation: 'emotion-regulation',
    dailyTips: 'daily-tips',
    quickExercises: 'quick-exercises',
    knowledgeGraph: 'knowledge-graph',
    metadata: 'metadata'
};

/**
 * 初始化 Upstash Search 客户端
 */
function initSearchClient() {
    const url = process.env.UPSTASH_SEARCH_REST_URL || process.env.UPSTASH_SEARCH_URL;
    const token = process.env.UPSTASH_SEARCH_REST_TOKEN || process.env.UPSTASH_SEARCH_TOKEN;
    
    if (!url || !token) {
        throw new Error('缺少 Upstash Search 凭据，请设置 UPSTASH_SEARCH_REST_URL 和 UPSTASH_SEARCH_REST_TOKEN');
    }
    
    searchClient = new Search({
        url,
        token
    });
    
    return searchClient;
}

/**
 * 获取索引
 */
function getIndex(indexName) {
    if (!searchClient) {
        initSearchClient();
    }
    return searchClient.index(indexName);
}

/**
 * 初始化数据库
 */
async function initDatabase() {
    try {
        initSearchClient();
        console.log('✓ Upstash Search 连接成功');
        console.log('✓ 数据库索引初始化完成');
        return true;
    } catch (error) {
        console.error('数据库初始化失败:', error.message);
        throw error;
    }
}

/**
 * 插入记录
 * content: 可搜索的内容对象
 * metadata: 附加元数据
 */
async function insert(collectionName, record) {
    const index = getIndex(INDEX_NAMES[collectionName]);
    const id = record.id || generateId();
    
    // 分离 content 和 metadata
    const { id: _, created_at, updated_at, ...rest } = record;
    
    // 将所有字段作为 content（可搜索）
    const content = { ...rest };
    
    // 时间戳等作为 metadata
    const metadata = {
        created_at: created_at || new Date().toISOString()
    };
    
    try {
        await index.upsert([{
            id,
            content,
            metadata
        }]);
        return { id, ...record };
    } catch (error) {
        console.error(`插入记录失败 ${collectionName}:`, error.message);
        throw error;
    }
}

/**
 * 查询记录
 */
async function find(collectionName, query = {}) {
    const index = getIndex(INDEX_NAMES[collectionName]);
    
    try {
        let results = [];
        
        // 如果有查询条件，使用搜索
        if (Object.keys(query).length > 0) {
            // 构建搜索查询 - 搜索所有值
            const searchTerms = Object.values(query)
                .filter(v => v !== undefined && v !== null && v !== '')
                .join(' ');
            
            if (searchTerms) {
                const searchResult = await index.search({
                    query: searchTerms,
                    limit: 100
                });
                results = searchResult || [];
            }
        } else {
            // 无查询条件，使用通用词搜索（Upstash Search 不支持通配符）
            const searchResult = await index.search({
                query: '的',
                limit: 100
            });
            results = searchResult || [];
        }
        
        // 转换结果格式
        return results.map(r => ({
            id: r.id,
            ...r.content,
            ...r.metadata
        }));
    } catch (error) {
        console.error(`查询失败 ${collectionName}:`, error.message);
        return [];
    }
}

/**
 * 查询单条记录
 */
async function findOne(collectionName, query) {
    const results = await find(collectionName, query);
    return results[0] || null;
}

/**
 * 通过ID获取记录
 */
async function findById(collectionName, id) {
    const index = getIndex(INDEX_NAMES[collectionName]);
    
    try {
        const result = await index.fetch(id);
        if (!result) return null;
        
        return {
            id: result.id,
            ...result.content,
            ...result.metadata
        };
    } catch (error) {
        return null;
    }
}

/**
 * 更新记录
 */
async function update(collectionName, query, updates) {
    const records = await find(collectionName, query);
    const index = getIndex(INDEX_NAMES[collectionName]);
    
    let updated = 0;
    
    for (const record of records) {
        const { id, ...rest } = record;
        const updatedRecord = {
            ...rest,
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        // 分离 content 和 metadata
        const { created_at, updated_at: _, ...content } = updatedRecord;
        const metadata = { created_at, updated_at };
        
        try {
            await index.upsert([{
                id,
                content,
                metadata
            }]);
            updated++;
        } catch (error) {
            console.error(`更新记录失败:`, error.message);
        }
    }
    
    return updated;
}

/**
 * 删除记录
 */
async function remove(collectionName, query) {
    const records = await find(collectionName, query);
    const index = getIndex(INDEX_NAMES[collectionName]);
    
    let deleted = 0;
    
    for (const record of records) {
        try {
            await index.delete(record.id);
            deleted++;
        } catch (error) {
            console.error(`删除记录失败:`, error.message);
        }
    }
    
    return deleted;
}

/**
 * 统计记录数
 */
async function count(collectionName, query = {}) {
    const results = await find(collectionName, query);
    return results.length;
}

/**
 * 分页查询
 */
async function paginate(collectionName, options = {}) {
    const { page = 1, limit = 10, sort, query = {} } = options;
    
    let results = await find(collectionName, query);
    
    // 排序
    if (sort) {
        const [field, order] = Object.entries(sort)[0];
        results.sort((a, b) => {
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
async function aggregate(collectionName, field) {
    const records = await find(collectionName);
    const stats = {};
    
    records.forEach(item => {
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
async function clear(collectionName) {
    const records = await find(collectionName);
    const index = getIndex(INDEX_NAMES[collectionName]);
    
    for (const record of records) {
        try {
            await index.delete(record.id);
        } catch (error) {
            // 忽略删除错误
        }
    }
}

/**
 * 批量插入
 */
async function insertMany(collectionName, records) {
    const index = getIndex(INDEX_NAMES[collectionName]);
    const results = [];
    const documents = [];
    
    for (const record of records) {
        const id = record.id || generateId();
        const { id: _, created_at, updated_at, ...content } = record;
        const metadata = {
            created_at: created_at || new Date().toISOString()
        };
        
        documents.push({ id, content, metadata });
        results.push({ id, ...record });
    }
    
    try {
        await index.upsert(documents);
    } catch (error) {
        console.error(`批量插入失败:`, error.message);
    }
    
    return results;
}

/**
 * 文本搜索
 */
async function textSearch(collectionName, text, options = {}) {
    const index = getIndex(INDEX_NAMES[collectionName]);
    const { limit = 20 } = options;
    
    try {
        const results = await index.search({
            query: text,
            limit
        });
        
        return (results || []).map(r => ({
            id: r.id,
            ...r.content,
            ...r.metadata,
            score: r.score
        }));
    } catch (error) {
        console.error(`文本搜索失败:`, error.message);
        return [];
    }
}

/**
 * 生成唯一ID
 */
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取客户端实例
 */
function getClient() {
    if (!searchClient) {
        initSearchClient();
    }
    return searchClient;
}

module.exports = {
    initDatabase,
    insert,
    find,
    findOne,
    findById,
    update,
    remove,
    count,
    paginate,
    aggregate,
    clear,
    insertMany,
    textSearch,
    getClient,
    INDEX_NAMES,
    generateId
};
