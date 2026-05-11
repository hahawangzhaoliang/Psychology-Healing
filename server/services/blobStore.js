/**
 * Vercel Blob 存储服务
 * 替代本地文件系统，用于 Serverless 环境下的持久化存储
 *
 * 存储结构：
 * - data/exercises.json       JSON 数据文件
 * - data/knowledge.json
 * - data/regulation.json
 * - data/tips.json
 * - data/graph.json
 * - media/images/*.png       图片文件
 * - media/audio/*.mp3        音频文件
 */

// 延迟加载 @vercel/blob，避免环境变量未设置时模块加载失败
let blobClient = null;
function getBlobClient() {
    if (!blobClient) {
        try {
            blobClient = require('@vercel/blob');
        } catch (error) {
            console.error('[BlobStore] ❌ 无法加载 @vercel/blob:', error.message);
            throw new Error('Blob 存储未配置，请设置 BLOB_READ_WRITE_TOKEN 环境变量');
        }
    }
    return blobClient;
}

const path = require('path');

// Blob 路径前缀
const DATA_PREFIX = 'data/';
const MEDIA_IMAGE_PREFIX = 'media/images/';
const MEDIA_AUDIO_PREFIX = 'media/audio/';

/**
 * 读取 JSON 数据文件（从 Blob，降级到本地文件）
 * @param {string} filename - 文件名（如 'exercises.json'）
 * @returns {Array|Object} 解析后的 JSON 数据
 */
async function readJsonFromBlob(filename) {
    const { get } = getBlobClient();
    const filepath = DATA_PREFIX + filename;
    try {
        const blob = await get(filepath);
        if (!blob.body) throw new Error('Empty response');
        const text = await blob.text();
        return JSON.parse(text);
    } catch (error) {
        // 文件不存在时，尝试读取本地文件作为降级方案
        if (error.message?.includes('not found') || error.message?.includes('404')) {
            console.log(`[BlobStore] Blob 中 ${filepath} 不存在，尝试本地降级...`);
            return fallbackToLocalFile(filename);
        }
        console.error(`[BlobStore] 读取 ${filepath} 失败:`, error.message);
        // 其他错误也尝试降级
        return fallbackToLocalFile(filename);
    }
}

/**
 * 本地文件降级读取
 * @param {string} filename - 文件名
 * @returns {Array|Object} 本地文件内容或默认值
 */
function fallbackToLocalFile(filename) {
    const fs = require('fs');
    const path = require('path');

    // 优先从 server/data 读取（Vercel 环境）
    let localPath = path.join(__dirname, '../../server/data', filename);
    if (!fs.existsSync(localPath)) {
        // 降级到 public/data（本地开发）
        localPath = path.join(__dirname, '../../public/data', filename);
    }

    if (fs.existsSync(localPath)) {
        try {
            const content = fs.readFileSync(localPath, 'utf-8');
            const data = JSON.parse(content);
            console.log(`[BlobStore] ✅ 从本地文件恢复: ${filename} (${data.length || 0} 条)`);
            return data;
        } catch (e) {
            console.error(`[BlobStore] ❌ 本地文件读取失败: ${localPath}`, e.message);
        }
    }

    console.log(`[BlobStore] ⚠️  本地文件也不存在: ${filename}，返回空数据`);
    return [];
}

/**
 * 写入 JSON 数据文件（到 Blob）
 * @param {string} filename - 文件名（如 'exercises.json'）
 * @param {Array|Object} data - 要写入的数据
 * @returns {Promise<object>} Blob 上传结果
 */
async function writeJsonToBlob(filename, data) {
    const { put } = getBlobClient();
    const filepath = DATA_PREFIX + filename;
    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    try {
        const result = await put(filepath, buffer, {
            access: 'public',
            contentType: 'application/json; charset=utf-8',
            allowOverwrite: true,
        });
        console.log(`[BlobStore] 写入 ${filepath} 成功: ${result.url}`);
        return result;
    } catch (error) {
        console.error(`[BlobStore] 写入 ${filepath} 失败:`, error.message);
        throw error;
    }
}

/**
 * 读取集合数据（自动追加文件名）
 * @param {string} collection - 集合名（如 'exercises'）
 * @returns {Promise<Array>}
 */
async function readCollection(collection) {
    const filename = `${collection}.json`;
    const data = await readJsonFromBlob(filename);
    return Array.isArray(data) ? data : [];
}

/**
 * 写入集合数据
 * @param {string} collection - 集合名（如 'exercises'）
 * @param {Array} data - 数据数组
 * @returns {Promise<object>}
 */
async function writeCollection(collection, data) {
    const filename = `${collection}.json`;
    return await writeJsonToBlob(filename, data);
}

// ==================== 媒体文件管理 ====================

/**
 * 上传图片到 Blob
 * @param {Buffer|Blob|string} fileContent - 文件内容
 * @param {string} filename - 文件名（含扩展名）
 * @param {string} contentType - MIME 类型
 * @returns {Promise<{url: string, pathname: string, size: number}>}
 */
async function uploadImage(fileContent, filename, contentType = 'image/png') {
    const { put } = getBlobClient();
    const filepath = MEDIA_IMAGE_PREFIX + filename;
    try {
        const result = await put(filepath, fileContent, {
            access: 'public',
            contentType,
            allowOverwrite: true,
        });
        console.log(`[BlobStore] 上传图片 ${filepath} 成功: ${result.url}`);
        return result;
    } catch (error) {
        console.error(`[BlobStore] 上传图片 ${filepath} 失败:`, error.message);
        throw error;
    }
}

/**
 * 上传音频到 Blob
 * @param {Buffer|Blob|string} fileContent - 文件内容
 * @param {string} filename - 文件名（含扩展名）
 * @param {string} contentType - MIME 类型
 * @returns {Promise<{url: string, pathname: string, size: number}>}
 */
async function uploadAudio(fileContent, filename, contentType = 'audio/mpeg') {
    const { put } = getBlobClient();
    const filepath = MEDIA_AUDIO_PREFIX + filename;
    try {
        const result = await put(filepath, fileContent, {
            access: 'public',
            contentType,
            allowOverwrite: true,
        });
        console.log(`[BlobStore] 上传音频 ${filepath} 成功: ${result.url}`);
        return result;
    } catch (error) {
        console.error(`[BlobStore] 上传音频 ${filepath} 失败:`, error.message);
        throw error;
    }
}

/**
 * 列出媒体文件
 * @param {'images'|'audio'|'all'} type - 媒体类型
 * @param {object} options - 额外选项（如 cursor 分页）
 * @returns {Promise<{blobs: Array, cursor: string|undefined}>}
 */
async function listMedia(type = 'all', options = {}) {
    const { list } = getBlobClient();
    let prefix;
    if (type === 'images') prefix = MEDIA_IMAGE_PREFIX;
    else if (type === 'audio') prefix = MEDIA_AUDIO_PREFIX;
    else prefix = 'media/'; // 列出所有媒体

    try {
        const result = await list({
            prefix,
            cursor: options.cursor || undefined,
            limit: options.limit || 100,
        });
        return {
            blobs: result.blobs || [],
            cursor: result.cursor || undefined,
            hasMore: !!result.cursor,
        };
    } catch (error) {
        console.error(`[BlobStore] 列出媒体文件失败:`, error.message);
        return { blobs: [], cursor: undefined, hasMore: false };
    }
}

/**
 * 删除媒体文件
 * @param {string} urlOrPathname - Blob URL 或路径
 * @returns {Promise<void>}
 */
async function deleteMedia(urlOrPathname) {
    const { del } = getBlobClient();
    try {
        await del(urlOrPathname);
        console.log(`[BlobStore] 删除媒体 ${urlOrPathname} 成功`);
    } catch (error) {
        console.error(`[BlobStore] 删除媒体 ${urlOrPathname} 失败:`, error.message);
        throw error;
    }
}

/**
 * 删除多个媒体文件
 * @param {string[]} urlsOrPathnames - Blob URL 或路径数组
 * @returns {Promise<{deleted: number, errors: string[]}>}
 */
async function deleteMediaBatch(urlsOrPathnames) {
    const { del } = getBlobClient();
    const errors = [];
    let deleted = 0;

    for (const url of urlsOrPathnames) {
        try {
            await del(url);
            deleted++;
        } catch (error) {
            errors.push(`删除 ${url} 失败: ${error.message}`);
        }
    }

    return { deleted, errors };
}

/**
 * 获取媒体文件的公开 URL
 * @param {string} filename - 文件名
 * @param {'images'|'audio'} type - 媒体类型
 * @returns {string} Blob URL
 */
function getMediaUrl(filename, type = 'images') {
    const prefix = type === 'images' ? MEDIA_IMAGE_PREFIX : MEDIA_AUDIO_PREFIX;
    // Vercel Blob 的 URL 格式：https://<store-id>.public.blob.vercel-storage.com/<path>
    // 我们需要通过 API 来获取，或者直接使用路径拼接
    // 这里返回路径，实际 URL 需要通过 get() 获取，或者前端直接使用 /api/media/* 代理
    return `/api/media/${type}/${filename}`;
}

/**
 * 检查 Blob 连接状态
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function checkBlobConnection() {
    try {
        const { list } = getBlobClient();
        // 尝试列出文件（限制1个）来测试连接
        await list({ limit: 1 });
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

module.exports = {
    // JSON 数据操作
    readJsonFromBlob,
    writeJsonToBlob,
    readCollection,
    writeCollection,

    // 媒体文件操作
    uploadImage,
    uploadAudio,
    listMedia,
    deleteMedia,
    deleteMediaBatch,
    getMediaUrl,

    // 连接检查
    checkBlobConnection,

    // 常量（供外部使用）
    DATA_PREFIX,
    MEDIA_IMAGE_PREFIX,
    MEDIA_AUDIO_PREFIX,
};
