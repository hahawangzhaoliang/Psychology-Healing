/**
 * 音频文件验证工具
 * 检查音频文件是否存在、格式是否正确
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_AUDIO_FILES = {
    breathing: [
        'breathing_background.mp3',
        'breathing_guide_female.mp3'
    ],
    'body-scan': [
        'body-scan_background.mp3',
        'body-scan_guide_female.mp3'
    ],
    meditation: [
        'meditation_background.mp3',
        'meditation_guide_female.mp3'
    ],
    relaxation: [
        'relaxation_background.mp3',
        'relaxation_guide_female.mp3'
    ],
    'charging-station': [
        'morning_432hz.mp3',
        'noon_alpha.mp3',
        'night_theta.mp3'
    ]
};

const OPTIONAL_FILES = {
    breathing: ['breathing_guide_male.mp3'],
    'body-scan': ['body-scan_guide_male.mp3'],
    meditation: ['meditation_guide_male.mp3'],
    relaxation: ['relaxation_guide_male.mp3']
};

function checkAudioFiles() {
    console.log('\n========================================');
    console.log('🔍 音频文件检查工具');
    console.log('========================================\n');
    
    const audioDir = path.join(__dirname, '..', 'public', 'audio');
    let totalRequired = 0;
    let totalOptional = 0;
    let missingRequired = [];
    let missingOptional = [];
    let foundFiles = [];
    
    // 检查必需文件
    for (const [category, files] of Object.entries(REQUIRED_AUDIO_FILES)) {
        console.log(`\n📁 ${category}/`);
        
        for (const file of files) {
            totalRequired++;
            const filePath = path.join(audioDir, category, file);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                console.log(`  ✅ ${file} (${sizeMB} MB)`);
                foundFiles.push({ category, file, size: sizeMB });
            } else {
                console.log(`  ❌ ${file} (缺失)`);
                missingRequired.push({ category, file });
            }
        }
    }
    
    // 检查可选文件
    console.log('\n\n📋 可选文件：');
    for (const [category, files] of Object.entries(OPTIONAL_FILES)) {
        console.log(`\n📁 ${category}/`);
        
        for (const file of files) {
            totalOptional++;
            const filePath = path.join(audioDir, category, file);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                console.log(`  ✅ ${file} (${sizeMB} MB)`);
                foundFiles.push({ category, file, size: sizeMB });
            } else {
                console.log(`  ⚠️  ${file} (未找到)`);
                missingOptional.push({ category, file });
            }
        }
    }
    
    // 输出统计
    console.log('\n\n========================================');
    console.log('📊 检查结果');
    console.log('========================================');
    console.log(`\n必需文件：${foundFiles.filter(f => !f.file.includes('male')).length}/${totalRequired}`);
    console.log(`可选文件：${foundFiles.filter(f => f.file.includes('male')).length}/${totalOptional}`);
    
    if (missingRequired.length === 0) {
        console.log('\n✅ 所有必需音频文件已准备就绪！');
    } else {
        console.log('\n❌ 缺少以下必需文件：');
        missingRequired.forEach(({ category, file }) => {
            console.log(`   - ${category}/${file}`);
        });
        
        console.log('\n📖 请参考以下文档准备音频文件：');
        console.log('   - public/audio/DOWNLOAD_CHECKLIST.md');
        console.log('   - docs/AUDIO_PREPARATION_GUIDE.md');
        console.log('   - docs/FREE_AUDIO_RESOURCES.md');
    }
    
    if (missingOptional.length > 0) {
        console.log('\n⚠️  可选文件（男声版）未找到，不影响基本功能');
    }
    
    console.log('\n========================================\n');
    
    return {
        totalRequired,
        totalOptional,
        foundCount: foundFiles.length,
        missingRequired,
        missingOptional,
        isReady: missingRequired.length === 0
    };
}

// 运行
if (require.main === module) {
    const result = checkAudioFiles();
    process.exit(result.isReady ? 0 : 1);
}

module.exports = { checkAudioFiles };
