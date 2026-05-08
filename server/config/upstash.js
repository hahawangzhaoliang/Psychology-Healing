/**
 * Upstash Search 数据库配置
 * 替代JSON文件存储，支持向量搜索和高效查询
 */

const { Search } = require('@upstash/search');

// Upstash Search 单例
let searchClient = null;

// 索引名称映射
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

// ─── 内部工具 ────────────────────────────────────────────────

/**
 * 获取/初始化 Upstash Search 客户端（懒加载单例）
 */
function getClient() {
    if (searchClient) return searchClient;

    const url   = process.env.UPSTASH_SEARCH_REST_URL   || process.env.UPSTASH_SEARCH_URL;
    const token = process.env.UPSTASH_SEARCH_REST_TOKEN || process.env.UPSTASH_SEARCH_TOKEN;

    if (!url || !token) {
        throw new Error(
            '缺少 Upstash Search 凭据，请设置 ' +
            'UPSTASH_SEARCH_REST_URL 和 UPSTASH_SEARCH_REST_TOKEN'
        );
    }

    searchClient = new Search({ url, token });
    return searchClient;
}

/**
 * 获取具名索引实例
 */
function getIndex(collectionName) {
    const indexName = INDEX_NAMES[collectionName];
    if (!indexName) throw new Error(`未知集合名称: ${collectionName}`);
    return getClient().index(indexName);
}

/**
 * 将 Upstash Search 结果条目转换为扁平对象
 */
function mapResult(r) {
    return {
        id: r.id,
        ...r.content,
        ...r.metadata,
        ...(r.score !== undefined ? { _score: r.score } : {})
    };
}

/**
 * 生成唯一 ID
 */
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── 公共 API ─────────────────────────────────────────────────

/**
 * 初始化数据库连接（健康检查时使用）
 */
async function initDatabase() {
    try {
        getClient(); // 触发凭据校验
        console.log('✓ Upstash Search 连接成功');
        return true;
    } catch (error) {
        console.error('数据库初始化失败:', error.message);
        throw error;
    }
}

/**
 * 插入/更新单条记录（upsert 语义）
 */
async function insert(collectionName, record) {
    const index = getIndex(collectionName);
    const id = record.id || generateId();

    // 分离系统字段与内容字段
    const { id: _id, created_at, updated_at, ...contentFields } = record;

    const metadata = {
        created_at: created_at || new Date().toISOString()
    };

    try {
        await index.upsert([{ id, content: contentFields, metadata }]);
        return { id, ...record };
    } catch (error) {
        console.error(`插入记录失败 [${collectionName}]:`, error.message);
        throw error;
    }
}

/**
 * 查询记录
 * - 有 query 条件：全文搜索匹配值
 * - 无 query 条件：列举全部文档（limit 最大 1000）
 */
async function find(collectionName, query = {}) {
    const index = getIndex(collectionName);

    try {
        let rawResults = [];
        const queryKeys = Object.keys(query);

        if (queryKeys.length > 0) {
            // 构造搜索词：取所有非空值
            const searchTerms = Object.values(query)
                .filter(v => v !== undefined && v !== null && v !== '')
                .join(' ');

            if (searchTerms) {
                const result = await index.search({ query: searchTerms, limit: 100 });
                rawResults = result || [];
            }
        } else {
            // 无条件时：使用 listDocuments（分页拉取全量）
            rawResults = await listAll(index);
        }

        return rawResults.map(mapResult);
    } catch (error) {
        console.error(`查询失败 [${collectionName}]:`, error.message);
        return [];
    }
}

/**
 * 通过分页拉取索引全量文档
 * Upstash Search 不支持通配符，使用 list / listDocuments 接口
 */
async function listAll(index, pageSize = 100) {
    const all = [];
    let cursor = null;

    try {
        // 尝试使用 listDocuments（部分 SDK 版本支持）
        if (typeof index.listDocuments === 'function') {
            do {
                const page = await index.listDocuments({ limit: pageSize, cursor });
                if (page?.documents) all.push(...page.documents);
                cursor = page?.nextCursor || null;
            } while (cursor);
        } else {
            // 降级：宽泛全文搜索（中文和英文高频词组合，覆盖率更高）
            const broadTerms = ['的', 'a', 'the', '心理', 'CBT', '正念'];
            const seenIds = new Set();
            for (const term of broadTerms) {
                const result = await index.search({ query: term, limit: pageSize });
                for (const r of (result || [])) {
                    if (!seenIds.has(r.id)) {
                        seenIds.add(r.id);
                        all.push(r);
                    }
                }
            }
        }
    } catch (error) {
        // 最终兜底：仅用高频词搜索
        try {
            const result = await index.search({ query: '的', limit: 100 });
            all.push(...(result || []));
        } catch (_) {
            // 忽略
        }
    }

    return all;
}

/**
 * 查询单条记录
 */
async function findOne(collectionName, query) {
    const results = await find(collectionName, query);
    return results[0] || null;
}

/**
 * 通过 ID 精确获取记录
 */
async function findById(collectionName, id) {
    const index = getIndex(collectionName);

    try {
        const result = await index.fetch(id);
        if (!result) return null;
        return mapResult(result);
    } catch (error) {
        console.error(`按ID查询失败 [${collectionName}/${id}]:`, error.message);
        return null;
    }
}

/**
 * 更新记录（先查后写）
 */
async function update(collectionName, query, updates) {
    const records = await find(collectionName, query);
    const index = getIndex(collectionName);
    const now = new Date().toISOString();
    let updated = 0;

    for (const record of records) {
        const { id, created_at, ...rest } = record;

        const mergedContent = {
            ...rest,
            ...updates,
        };
        const metadata = {
            created_at: created_at || now,
            updated_at: now
        };

        try {
            await index.upsert([{ id, content: mergedContent, metadata }]);
            updated++;
        } catch (error) {
            console.error(`更新记录失败 [${collectionName}/${id}]:`, error.message);
        }
    }

    return updated;
}

/**
 * 删除记录（按查询条件）
 */
async function remove(collectionName, query) {
    const records = await find(collectionName, query);
    const index = getIndex(collectionName);
    let deleted = 0;

    for (const record of records) {
        try {
            await index.delete(record.id);
            deleted++;
        } catch (error) {
            console.error(`删除记录失败 [${collectionName}/${record.id}]:`, error.message);
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
 * 分页查询（内存排序 + 分片，适合小数据集）
 */
async function paginate(collectionName, options = {}) {
    const { page = 1, limit = 10, sort, query = {} } = options;

    let results = await find(collectionName, query);

    if (sort) {
        const [field, order] = Object.entries(sort)[0];
        results.sort((a, b) => {
            if (a[field] === b[field]) return 0;
            if (order === 'desc') return a[field] < b[field] ? 1 : -1;
            return a[field] > b[field] ? 1 : -1;
        });
    }

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
 * 聚合统计（按指定字段分组计数）
 */
async function aggregate(collectionName, field) {
    const records = await find(collectionName);
    const stats = {};

    for (const item of records) {
        const value = item[field];
        if (value !== undefined) {
            stats[value] = (stats[value] || 0) + 1;
        }
    }

    return Object.entries(stats).map(([key, cnt]) => ({ [field]: key, count: cnt }));
}

/**
 * 清空集合（谨慎使用）
 */
async function clear(collectionName) {
    const records = await find(collectionName);
    const index = getIndex(collectionName);

    for (const record of records) {
        try {
            await index.delete(record.id);
        } catch (_) {
            // 单条删除失败不中断整体流程
        }
    }
}

/**
 * 批量插入（单次 upsert 调用，效率更高）
 */
async function insertMany(collectionName, records) {
    const index = getIndex(collectionName);
    const now = new Date().toISOString();
    const documents = [];
    const results = [];

    for (const record of records) {
        const id = record.id || generateId();
        const { id: _id, created_at, updated_at, ...contentFields } = record;
        const metadata = { created_at: created_at || now };

        documents.push({ id, content: contentFields, metadata });
        results.push({ id, ...record });
    }

    try {
        await index.upsert(documents);
    } catch (error) {
        console.error(`批量插入失败 [${collectionName}]:`, error.message);
        throw error;
    }

    return results;
}

/**
 * 全文语义搜索
 */
async function textSearch(collectionName, text, options = {}) {
    const index = getIndex(collectionName);
    const { limit = 20 } = options;

    try {
        const results = await index.search({ query: text, limit });
        return (results || []).map(mapResult);
    } catch (error) {
        console.error(`全文搜索失败 [${collectionName}]:`, error.message);
        return [];
    }
}

// ─── 导出 ─────────────────────────────────────────────────────

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
