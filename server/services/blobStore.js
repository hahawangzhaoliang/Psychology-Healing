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

// 延迟加载 @vercel/blob
let blobClient = null;
function getBlobClient() {
    if (!blobClient) {
        try {
            blobClient = require('@vercel/blob');
        } catch (error) {
            throw new Error('Blob 存储模块加载失败');
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
 */
async function readJsonFromBlob(filename) {
    const blob = getBlobClient();
    const filepath = DATA_PREFIX + filename;
    
    console.log(`[BlobStore] 尝试从 Blob 读取: ${filepath}`);

    // 尝试从 Blob 读取（带重试）
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            console.log(`[BlobStore] Blob 读取尝试 ${attempt + 1}/3`);
            
            // v0.27 API: 使用 head 获取文件信息，然后用 downloadUrl 下载
            const result = await blob.head(filepath);
            console.log(`[BlobStore] Blob head 成功: ${JSON.stringify({ pathname: result.pathname, size: result.size })}`);

            if (result.downloadUrl) {
                console.log(`[BlobStore] 正在下载: ${result.downloadUrl.substring(0, 80)}...`);
                const response = await fetch(result.downloadUrl);
                if (response.ok) {
                    const text = await response.text();
                    const data = JSON.parse(text);
                    console.log(`[BlobStore] ✅ Blob 读取成功: ${filename} (${Array.isArray(data) ? data.length : 0} 条)`);
                    return data;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            throw new Error('downloadUrl 不存在');
        } catch (error) {
            console.log(`[BlobStore] Blob 读取尝试 ${attempt + 1} 失败: ${error.message}`);
            if (attempt < 2) {
                console.log(`[BlobStore] 等待 1 秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    // 所有重试都失败，抛出错误（不再降级到本地文件）
    console.log(`[BlobStore] ❌ Blob 读取全部失败（3 次重试）`);
    throw new Error(`Blob 读取失败（3次重试）: ${filename}`);
}

/**
 * 列出指定前缀的所有 Blob 文件路径（通用方法，供分片存储使用）
 * @param {string} prefix - 路径前缀，如 'data/tips/'
 * @param {object} options - { limit: number, cursor: string }
 * @returns {Promise<string[]>} 文件路径名数组，如 ['data/tips/2026-05.json', ...]
 */
async function listFiles(prefix, options = {}) {
    const { list } = getBlobClient();
    try {
        const result = await list({
            prefix,
            limit: options.limit || 100,
            cursor: options.cursor,
        });
        const paths = (result.blobs || []).map(b => b.pathname || b.url || '');
        return {
            paths: paths.filter(Boolean),
            cursor: result.cursor,
            hasMore: !!result.cursor,
        };
    } catch (error) {
        console.error(`[BlobStore] listFiles(${prefix}) 失败:`, error.message);
        return { paths: [], cursor: undefined, hasMore: false };
    }
}

/**
 * 写入 JSON 数据文件（到 Blob）
 */
async function writeJsonToBlob(filename, data) {
    const { put } = getBlobClient();
    const filepath = DATA_PREFIX + filename;
    const jsonString = JSON.stringify(data, null, 2);

    try {
        const result = await put(filepath, jsonString, {
            access: 'public',
            contentType: 'application/json; charset=utf-8',
            addRandomSuffix: false,  // 禁用随机后缀，确保文件路径稳定
        });
        console.log(`[BlobStore] ✅ 写入 ${filepath} 成功`);
        console.log(`[BlobStore] 返回 URL: ${result.url}`);
        
        // 返回结果包含 url，可以直接使用
        return result;
    } catch (error) {
        console.error(`[BlobStore] 写入失败:`, error.message);
        throw error;
    }
}

/**
 * 读取集合数据
 */
async function readCollection(collection) {
    const filename = `${collection}.json`;
    const data = await readJsonFromBlob(filename);
    return Array.isArray(data) ? data : [];
}

/**
 * 写入集合数据
 */
async function writeCollection(collection, data) {
    const filename = `${collection}.json`;
    return await writeJsonToBlob(filename, data);
}

// ==================== 媒体文件管理 ====================

async function uploadImage(fileContent, filename, contentType = 'image/png') {
    const { put } = getBlobClient();
    const filepath = MEDIA_IMAGE_PREFIX + filename;
    try {
        const result = await put(filepath, fileContent, {
            access: 'public',
            contentType,
        });
        return result;
    } catch (error) {
        console.error(`[BlobStore] 上传图片失败:`, error.message);
        throw error;
    }
}

async function uploadAudio(fileContent, filename, contentType = 'audio/mpeg') {
    const { put } = getBlobClient();
    const filepath = MEDIA_AUDIO_PREFIX + filename;
    try {
        const result = await put(filepath, fileContent, {
            access: 'public',
            contentType,
        });
        return result;
    } catch (error) {
        console.error(`[BlobStore] 上传音频失败:`, error.message);
        throw error;
    }
}

async function listMedia(type = 'all', options = {}) {
    const { list } = getBlobClient();
    let prefix;
    if (type === 'images') prefix = MEDIA_IMAGE_PREFIX;
    else if (type === 'audio') prefix = MEDIA_AUDIO_PREFIX;
    else prefix = 'media/';

    try {
        const result = await list({ prefix, limit: options.limit || 100 });
        return {
            blobs: result.blobs || [],
            cursor: result.cursor,
            hasMore: !!result.cursor,
        };
    } catch (error) {
        console.error(`[BlobStore] 列出媒体失败:`, error.message);
        return { blobs: [], cursor: undefined, hasMore: false };
    }
}

async function deleteMedia(urlOrPathname) {
    const { del } = getBlobClient();
    try {
        await del(urlOrPathname);
    } catch (error) {
        console.error(`[BlobStore] 删除失败:`, error.message);
        throw error;
    }
}

async function deleteMediaBatch(urlsOrPathnames) {
    const { del } = getBlobClient();
    const errors = [];
    let deleted = 0;

    for (const url of urlsOrPathnames) {
        try {
            await del(url);
            deleted++;
        } catch (error) {
            errors.push(error.message);
        }
    }

    return { deleted, errors };
}

function getMediaUrl(filename, type = 'images') {
    return `/api/media/${type}/${filename}`;
}

async function checkBlobConnection() {
    try {
        const { list } = getBlobClient();
        await list({ limit: 1 });
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

module.exports = {
    readJsonFromBlob,
    writeJsonToBlob,
    readCollection,
    writeCollection,
    uploadImage,
    uploadAudio,
    listMedia,
    listFiles,
    deleteMedia,
    deleteMediaBatch,
    getMediaUrl,
    checkBlobConnection,
    DATA_PREFIX,
    MEDIA_IMAGE_PREFIX,
    MEDIA_AUDIO_PREFIX,
};
