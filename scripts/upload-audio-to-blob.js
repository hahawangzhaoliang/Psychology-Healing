/**
 * upload-audio-to-blob.js
 * 一键将 public/assets/audio/bgm/ 下的 MP3 文件上传到 Vercel Blob
 * 上传完成后自动更新 public/assets/manifest.json 中的 url 字段
 *
 * 使用方法:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_xxx npm run upload-audio
 *   或在 .env 文件中配置 BLOB_READ_WRITE_TOKEN
 */

require('dotenv').config();
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// ——— 配置 ———
const AUDIO_DIR = path.join(__dirname, '../public/assets/audio/bgm');
const MANIFEST_PATH = path.join(__dirname, '../public/assets/manifest.json');
const BLOB_PREFIX = 'audio/bgm/';

// ——— 颜色输出工具 ———
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};
const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
    ok: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
    err: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
    title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

// ——— 文件大小格式化 ———
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ——— 主流程 ———
async function main() {
    log.title('🎵 Vercel Blob 音频上传工具');

    // 1. 检查 Token
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        log.err('未找到 BLOB_READ_WRITE_TOKEN 环境变量！');
        log.info('请在 .env 文件中添加:');
        console.log('  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxx\n');
        log.info('从 Vercel 控制台获取: 项目 → Storage → Blob → 连接');
        process.exit(1);
    }
    log.ok(`Token 已配置（${token.slice(0, 20)}...）`);

    // 2. 读取 manifest.json
    if (!fs.existsSync(MANIFEST_PATH)) {
        log.err(`找不到 manifest.json: ${MANIFEST_PATH}`);
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const bgmList = manifest.audio?.bgm || [];
    log.info(`Manifest 中共 ${bgmList.length} 首 BGM`);

    // 3. 扫描本地文件
    if (!fs.existsSync(AUDIO_DIR)) {
        log.err(`音频目录不存在: ${AUDIO_DIR}`);
        process.exit(1);
    }
    const localFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
    log.info(`本地音频文件: ${localFiles.length} 个\n`);

    // 4. 逐个上传
    const results = { ok: 0, skip: 0, fail: 0 };
    const urlMap = {}; // filename → blob url

    for (const track of bgmList) {
        const filename = track.file;
        const localPath = path.join(AUDIO_DIR, filename);

        // 检查本地文件存在
        if (!fs.existsSync(localPath)) {
            log.warn(`跳过（本地不存在）: ${filename}`);
            results.skip++;
            continue;
        }

        const stat = fs.statSync(localPath);
        const size = formatSize(stat.size);

        try {
            process.stdout.write(`  上传 ${filename} (${size}) ... `);

            const fileBuffer = fs.readFileSync(localPath);
            const blobPath = `${BLOB_PREFIX}${filename}`;

            const blob = await put(blobPath, fileBuffer, {
                access: 'public',
                contentType: 'audio/mpeg',
                token // 显式传递 token
            });

            urlMap[filename] = blob.url;
            console.log(`${colors.green}✓${colors.reset} ${blob.url.slice(0, 60)}...`);
            results.ok++;
        } catch (e) {
            console.log(`${colors.red}✗${colors.reset} ${e.message}`);
            results.fail++;
        }
    }

    // 5. 更新 manifest.json
    if (Object.keys(urlMap).length > 0) {
        log.title('📝 更新 manifest.json');

        let updated = 0;
        manifest.audio.bgm = manifest.audio.bgm.map(track => {
            if (urlMap[track.file]) {
                updated++;
                return { ...track, url: urlMap[track.file] };
            }
            return track;
        });

        // 更新版本时间
        manifest.updated = new Date().toISOString().slice(0, 10);

        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
        log.ok(`manifest.json 已更新（${updated} 条 url 字段）`);
    }

    // 6. 汇总
    log.title('📊 上传汇总');
    log.ok(`成功: ${results.ok}`);
    if (results.skip) log.warn(`跳过: ${results.skip}`);
    if (results.fail) log.err(`失败: ${results.fail}`);

    if (results.fail === 0) {
        console.log(`\n${colors.green}${colors.bold}✅ 全部完成！音频文件已托管在 Vercel Blob CDN${colors.reset}`);
        console.log(`\n下一步: 提交 manifest.json 并推送到 GitHub，本地 MP3 可以从 Git 中移除。\n`);
    } else {
        console.log(`\n${colors.yellow}⚠ 有 ${results.fail} 个文件上传失败，请检查上方错误信息。${colors.reset}\n`);
    }
}

main().catch(e => {
    log.err('脚本执行出错: ' + e.message);
    process.exit(1);
});
