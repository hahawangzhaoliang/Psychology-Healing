/**
 * TTS引导语音生成工具
 * 使用百度语音合成API生成引导语音
 * 
 * 使用方法：
 * 1. 安装依赖：npm install baidu-aip-sdk
 * 2. 配置百度AI凭据（见下方）
 * 3. 运行：node scripts/generate-tts-guide.js
 */

const fs = require('fs');
const path = require('path');

// 引导语音脚本
const GUIDE_SCRIPTS = {
    breathing: {
        female: `现在，让我们花一分钟时间，关注你的呼吸。

找一个舒适的姿势坐下。
轻轻闭上眼睛，或者半睁半闭，都可以。

把注意力带到你的呼吸上。
不需要控制呼吸，只是观察它。

吸气时，感受空气进入鼻腔的清凉...
呼气时，感受空气离开身体的温热...

如果注意力跑开了，这很正常。
温和地把注意力带回到呼吸上就好。

就这样，简单地陪伴你的呼吸...

很好。
你刚刚给自己一分钟的时间，和自己的呼吸在一起。

现在，可以慢慢睁开眼睛。
带着这份平静，继续你的一天。`,
        
        male: `让我们用一分钟，回到当下。

找一个舒服的姿势。
闭上眼睛，或者微微垂下眼帘。

现在，把注意力放在你的呼吸上。
不需要改变什么，只是觉察。

吸气... 呼气...
吸气... 呼气...

如果思绪飘走了，没关系。
温柔地把它带回来，继续关注呼吸。

每一次呼吸，都是一次回到当下的机会。

做得很好。
这一分钟，你和自己在一起。

现在，可以睁开眼睛了。
感受一下身体的变化。`
    },
    
    'body-scan': {
        female: `现在，让我们花三分钟时间，扫描你的身体。
找一个舒适的姿势，坐着或躺着都可以。

首先，把注意力带到你的双脚。
感受脚底的触感，脚趾的温度。
不需要改变什么，只是觉察。

现在，让注意力慢慢向上移动。
感受你的小腿...
肌肉的紧张或放松，温度的变化...

继续向上，感受你的大腿...
如果你发现某个部位紧张，可以试着放松它。
或者，只是允许这种紧张存在。

感受你的臀部接触椅子的感觉...
感受你的腹部，随着呼吸轻轻起伏...

把注意力带到你的胸部...
感受心跳的节奏，呼吸的流动...

感受你的双手和手臂...
手指的温度，手掌的触感...

注意你的肩膀和颈部...
这里常常承载着很多压力。
试着让它们放松下来...

最后，感受你的面部...
放松眉头，放松下巴...
让整个面部变得柔和...

现在，感受整个身体作为一个整体...
从头到脚，完整地觉察...
身体在呼吸，身体在放松...

很好。
你刚刚用三分钟时间，完整地扫描了你的身体。

现在，可以慢慢睁开眼睛。
动动手指，动动脚趾。
带着这份身体的觉察，继续你的一天。`,
        
        male: `让我们用三分钟，和身体重新连接。
找一个舒服的姿势。

把注意力放在双脚上。
感受它们的存在。
脚底接触地面的感觉...

慢慢向上，感受你的小腿。
任何感觉都可以，不需要评判。

感受你的大腿...
如果发现紧张，试着放松。
或者只是观察它。

感受臀部接触椅子...
感受腹部的起伏...

注意你的胸部...
心跳，呼吸...

感受双手和手臂...
温度，触感...

肩膀和颈部...
让它们放松...

面部...
放松眉头，放松下巴...

感受整个身体...
完整地，统一地...

做得很好。
三分钟的身体扫描完成了。

睁开眼睛，动动身体。
带着这份觉察，继续你的生活。`
    },
    
    meditation: {
        female: `现在，让我们花五分钟时间，练习正念冥想。
找一个安静的地方，舒适的姿势。

轻轻闭上眼睛。
把手机调到静音，或者放在一边。
给自己这五分钟的时间，完全属于自己。

首先，把注意力带到你的呼吸上。
不需要控制呼吸，只是观察它。

吸气时，知道自己在吸气。
呼气时，知道自己在呼气。

呼吸是生命的节奏。
每一次呼吸，都是回到当下的锚点。

现在，让身体放松下来。
从头顶开始，放松你的头皮...
放松你的面部...
放松你的肩膀...
放松你的手臂...
放松你的胸部和腹部...
放松你的背部...
放松你的双腿...

让整个身体变得柔软、放松。

现在，把觉察扩展到整个当下。

你可以觉察呼吸...
也可以觉察身体的感受...
或者觉察周围的声音...

不需要抓住任何体验。
也不需要推开任何体验。
只是允许一切如其所是地存在。

如果思绪飘走了，这很正常。
那是大脑在思考，这是它的工作。
温和地把注意力带回来就好。

就这样，简单地存在着。
不需要做任何事。
不需要成为任何人。
只是在这里，只是现在。

很好。
你刚刚给自己五分钟的时间，练习正念冥想。

现在，可以开始准备结束。
先动动手指，动动脚趾。
感受一下身体的存在。

然后，慢慢睁开眼睛。
看看周围的环境。
光线，颜色，形状...

带着这份平静和觉察，
继续你的一天。

记住，你可以随时回到呼吸，
随时回到当下。`,
        
        male: `让我们用五分钟，练习正念。
找一个舒服的姿势。

闭上眼睛。
放下手机。
这五分钟，完全属于你。

注意你的呼吸。
不需要控制，只是观察。

吸气... 呼气...
每一次呼吸都是新的。

呼吸是你回到当下的锚点。

让身体放松。
从头到脚...
放松每一个部位。

让身体变得柔软。

扩展你的觉察。

觉察呼吸...
觉察身体...
觉察声音...

不抓住，不推开。
允许一切存在。

思绪飘走是正常的。
温和地带回来。

只是存在。
不需要做任何事。

很好。
五分钟的正念练习完成了。

动动手指，动动脚趾。
慢慢睁开眼睛。

看看周围。
带着平静和觉察，
继续你的一天。

记住，你可以随时回到呼吸。`
    },
    
    relaxation: {
        female: `现在，让我们花七分钟时间，进入深度放松。
找一个舒适的地方，可以坐着或躺着。

轻轻闭上眼睛。
确保接下来的七分钟不会被打扰。
给自己这个时间，完全放松。

首先，注意你的双脚和小腿。
紧张你的脚趾，保持几秒...
然后放松，感受紧张和放松的区别。
紧张你的小腿肌肉...
然后放松，让紧张流走。

现在，紧张你的大腿肌肉...
保持...然后放松。
感受大腿变得沉重、放松。
紧张你的臀部...
然后放松，让整个下半身放松下来。

深吸一口气，紧张你的腹部...
然后呼气，放松。
感受腹部变得柔软。
紧张你的胸部...
然后放松，让呼吸自然流动。

握紧拳头，紧张你的双手和手臂...
保持...然后放松。
感受双手变得温暖、沉重。
让手臂完全放松。

耸起肩膀，紧张你的肩膀和颈部...
然后放松，让肩膀下沉。
感受紧张从颈部流走。
让整个上半身放松。

最后，紧张你的面部肌肉...
然后放松。
放松眉头，放松下巴，放松整个面部。

现在，想象你在一个美丽的地方。
可以是海滩，森林，或者任何让你感到平静的地方。

看看周围...
你看到了什么？
天空，树木，花朵...

听听周围的声音...
鸟鸣，风声，水流...

闻闻空气的味道...
清新的，自然的...

感受阳光温暖地照在你身上。
微风轻拂你的皮肤。

你感到安全，平静，放松。
这里没有压力，没有烦恼。
只有宁静和美好。

在这个地方，你可以完全放松。
不需要做任何事，不需要担心任何事。
只是存在，只是享受。

让这种放松的感觉渗透你的整个身体。
从头到脚，每一个细胞都在放松。

你的呼吸变得缓慢而深沉。
你的心跳变得平稳而有力。

你感到平静，安宁，完整。

很好。
你刚刚给自己七分钟的时间，进入深度放松。

现在，可以开始准备回到当下。
先动动手指，动动脚趾。
感受一下身体的存在。

然后，慢慢睁开眼睛。
看看周围的环境。
带着这份深度放松的感觉，
继续你的一天。

记住，你可以随时回到这个平静的地方。`,
        
        male: `让我们用七分钟，进入深度放松。
找一个舒服的姿势。

闭上眼睛。
确保不会被打扰。
给自己这个时间。

注意双脚和小腿。
紧张脚趾...然后放松。
紧张小腿...然后放松。
感受紧张流走。

紧张大腿...放松。
紧张臀部...放松。
下半身完全放松。

深吸气，紧张腹部...放松。
紧张胸部...放松。
呼吸自然流动。

握紧拳头...放松。
双手温暖，沉重。
手臂完全放松。

耸起肩膀...放松。
肩膀下沉。
上半身放松。

紧张面部...放松。
放松眉头，下巴。

想象一个美丽的地方。
海滩，森林，任何平静的地方。

看看周围...
听听声音...
闻闻空气...

感受阳光，微风。
安全，平静，放松。

没有压力，没有烦恼。
只是存在，只是享受。

让放松渗透全身。
每一个细胞都在放松。

呼吸缓慢深沉。
心跳平稳有力。

平静，安宁，完整。

很好。
七分钟的深度放松完成了。

动动手指，动动脚趾。
慢慢睁开眼睛。

带着这份放松，
继续你的一天。

记住，你可以随时回到这个平静的地方。`
    }
};

/**
 * 使用百度语音合成API生成音频
 * 需要先安装：npm install baidu-aip-sdk
 */
async function generateWithBaiduTTS(text, outputPath, voice = 0) {
    try {
        const AipSpeechServer = require('baidu-aip-sdk').speech;
        
        // 设置百度AI凭据（需要替换为实际的APP_ID, API_KEY, SECRET_KEY）
        const client = new AipSpeechServer(
            'YOUR_APP_ID',
            'YOUR_API_KEY',
            'YOUR_SECRET_KEY'
        );
        
        console.log(`正在生成：${outputPath}`);
        
        // 调用语音合成API
        const result = await client.text2audio(text, {
            tex: text,
            per: voice, // 0-女声，1-男声，3-情感合成-男声，4-情感合成-女声
            spd: 5, // 语速，0-9，默认5
            pit: 5, // 音调，0-9，默认5
            vol: 9, // 音量，0-15，默认9
            aue: 3 // 音频格式，3-mp3
        });
        
        if (result.data) {
            fs.writeFileSync(outputPath, result.data);
            console.log(`✅ 生成成功：${outputPath}`);
            return true;
        } else {
            console.error(`❌ 生成失败：${result.err_msg || '未知错误'}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 生成失败：${error.message}`);
        console.log('\n💡 提示：请先安装百度AI SDK并配置凭据');
        console.log('   安装命令：npm install baidu-aip-sdk');
        console.log('   获取凭据：https://console.bce.baidu.com/ai/#/ai/speech/overview/index');
        return false;
    }
}

/**
 * 生成所有引导语音
 */
async function generateAllGuides() {
    console.log('\n========================================');
    console.log('🎙️  引导语音生成工具');
    console.log('========================================\n');
    
    const types = ['breathing', 'body-scan', 'meditation', 'relaxation'];
    const genders = ['female', 'male'];
    
    for (const type of types) {
        for (const gender of genders) {
            const script = GUIDE_SCRIPTS[type][gender];
            const outputDir = path.join(__dirname, '..', 'public', 'audio', type);
            const outputFile = path.join(outputDir, `${type}_guide_${gender}.mp3`);
            
            // 确保目录存在
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // 生成音频（0=女声，1=男声）
            const voice = gender === 'female' ? 4 : 3;
            await generateWithBaiduTTS(script, outputFile, voice);
            
            console.log('');
        }
    }
    
    console.log('\n========================================');
    console.log('✅ 所有引导语音生成完成');
    console.log('========================================\n');
}

/**
 * 导出脚本供外部使用
 */
function exportScripts() {
    const scriptsDir = path.join(__dirname, '..', 'public', 'audio', 'scripts');
    
    if (!fs.existsSync(scriptsDir)) {
        fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    for (const type of Object.keys(GUIDE_SCRIPTS)) {
        for (const gender of Object.keys(GUIDE_SCRIPTS[type])) {
            const script = GUIDE_SCRIPTS[type][gender];
            const outputFile = path.join(scriptsDir, `${type}_guide_${gender}.txt`);
            fs.writeFileSync(outputFile, script, 'utf8');
            console.log(`✅ 导出脚本：${outputFile}`);
        }
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--export-scripts')) {
        console.log('\n导出引导脚本到文本文件...\n');
        exportScripts();
        return;
    }
    
    if (args.includes('--help')) {
        console.log('\n使用方法：');
        console.log('  node scripts/generate-tts-guide.js              # 生成所有引导语音');
        console.log('  node scripts/generate-tts-guide.js --export-scripts  # 导出脚本文本');
        console.log('  node scripts/generate-tts-guide.js --help       # 显示帮助信息');
        console.log('\n前提条件：');
        console.log('  1. 安装百度AI SDK：npm install baidu-aip-sdk');
        console.log('  2. 配置百度AI凭据（修改本文件中的APP_ID, API_KEY, SECRET_KEY）');
        console.log('  3. 获取凭据：https://console.bce.baidu.com/ai/#/ai/speech/overview/index');
        return;
    }
    
    await generateAllGuides();
}

// 运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    GUIDE_SCRIPTS,
    generateWithBaiduTTS,
    exportScripts
};
