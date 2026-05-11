/**
 * 数据迁移脚本 - 将本地 JSON 文件迁移到 Vercel Blob
 * 运行: node scripts/migrate-to-blob.js
 * 
 * 需要环境变量: BLOB_READ_WRITE_TOKEN
 */

const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 检查环境变量
if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ 错误: 未设置 BLOB_READ_WRITE_TOKEN');
    console.log('\n请在项目根目录创建 .env.local 文件，内容如下:');
    console.log('BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...\n');
    process.exit(1);
}

// 动态导入 Blob 模块
let blob;

async function initBlob() {
    try {
        const { put, list, del } = require('@vercel/blob');
        blob = { put, list, del };
        console.log('✓ Vercel Blob 模块加载成功\n');
    } catch (error) {
        console.error('❌ 加载 Vercel Blob 模块失败:', error.message);
        console.log('\n请先安装依赖: npm install\n');
        process.exit(1);
    }
}

// 数据目录
const DATA_DIR = path.join(__dirname, '../server/data');
const DATA_PREFIX = 'data/';

// 要迁移的数据文件
const DATA_FILES = [
    'exercises.json',
    'knowledge.json',
    'regulation.json',
    'tips.json',
    'emotion_diary.json',
    'assessment_records.json',
    'feedback.json',
    'visit_stats.json',
];

// 迁移单个文件到 Blob
async function migrateFile(filename) {
    const localPath = path.join(DATA_DIR, filename);
    const blobPath = DATA_PREFIX + filename;

    // 检查本地文件是否存在
    if (!fs.existsSync(localPath)) {
        console.log(`⏭️  跳过 ${filename} (本地文件不存在)`);
        return { filename, status: 'skipped' };
    }

    try {
        // 读取本地文件
        const content = fs.readFileSync(localPath, 'utf-8');
        const data = JSON.parse(content);

        // 检查是否已存在于 Blob
        let existing = false;
        try {
            const { list } = await import('@vercel/blob');
            const blobs = await list({ prefix: blobPath });
            if (blobs.blobs && blobs.blobs.length > 0) {
                existing = true;
            }
        } catch (e) {
            // list 可能失败，继续上传
        }

        if (existing) {
            // 更新现有文件
            const { put } = await import('@vercel/blob');
            const result = await put(blobPath, content, {
                contentType: 'application/json',
                access: 'public',
            });
            console.log(`🔄 更新 ${filename} -> ${result.url}`);
            return { filename, status: 'updated', url: result.url };
        } else {
            // 上传新文件
            const { put } = await import('@vercel/blob');
            const result = await put(blobPath, content, {
                contentType: 'application/json',
                access: 'public',
            });
            console.log(`⬆️  上传 ${filename} -> ${result.url}`);
            return { filename, status: 'uploaded', url: result.url };
        }
    } catch (error) {
        console.error(`❌ 处理 ${filename} 失败:`, error.message);
        return { filename, status: 'error', error: error.message };
    }
}

// 主函数
async function main() {
    console.log('🚀 Vercel Blob 数据迁移工具\n');
    console.log('='.repeat(50));

    await initBlob();

    console.log(`📁 数据目录: ${DATA_DIR}`);
    console.log(`☁️  目标: Vercel Blob (${DATA_PREFIX})\n`);

    const results = [];

    for (const filename of DATA_FILES) {
        const result = await migrateFile(filename);
        results.push(result);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 迁移结果:\n');

    const success = results.filter(r => r.status === 'uploaded' || r.status === 'updated');
    const skipped = results.filter(r => r.status === 'skipped');
    const failed = results.filter(r => r.status === 'error');

    if (success.length > 0) {
        console.log(`✅ 成功: ${success.length} 个文件`);
        success.forEach(r => console.log(`   - ${r.filename}`));
    }

    if (skipped.length > 0) {
        console.log(`⏭️  跳过: ${skipped.length} 个文件`);
        skipped.forEach(r => console.log(`   - ${r.filename}`));
    }

    if (failed.length > 0) {
        console.log(`❌ 失败: ${failed.length} 个文件`);
        failed.forEach(r => console.log(`   - ${r.filename}: ${r.error}`));
    }

    console.log('\n✨ 迁移完成！\n');
    console.log('接下来:');
    console.log('1. 确保 Vercel 环境变量已配置 BLOB_READ_WRITE_TOKEN');
    console.log('2. 部署到 Vercel');
    console.log('3. 测试各个页面是否正常加载\n');
}

// 处理 Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n⚠️  迁移已取消');
    process.exit(1);
});

main().catch(error => {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
});
