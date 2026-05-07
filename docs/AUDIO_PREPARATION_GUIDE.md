# 音频文件准备指南

## 📁 目录结构

请在 `public/audio/` 目录下创建以下结构：

```
public/audio/
├── breathing/
│   ├── breathing_background.mp3       # 背景音乐（1分钟）
│   └── breathing_guide_female.mp3     # 女声引导（1分钟）
├── body-scan/
│   ├── body-scan_background.mp3       # 背景音乐（3分钟）
│   └── body-scan_guide_female.mp3     # 女声引导（3分钟）
├── meditation/
│   ├── meditation_background.mp3      # 背景音乐（5分钟）
│   └── meditation_guide_female.mp3    # 女声引导（5分钟）
├── relaxation/
│   ├── relaxation_background.mp3      # 背景音乐（7分钟）
│   └── relaxation_guide_female.mp3    # 女声引导（7分钟）
└── charging-station/
    ├── morning_432hz.mp3              # 晨起音乐
    ├── noon_alpha.mp3                 # 午休音乐
    └── night_theta.mp3                # 睡前音乐
```

---

## 🎵 音频来源推荐

### 1. 免费背景音乐

**Pixabay Music**（推荐）
- 网址：https://pixabay.com/music/
- 许可：Pixabay Content License（可商用，无需署名）
- 推荐搜索关键词：
  - "meditation"
  - "relaxing"
  - "ambient"
  - "nature sounds"
  - "peaceful"

**推荐曲目**：
1. **呼吸觉察**：搜索 "breathing" 或 "calm"
2. **身体扫描**：搜索 "soft piano" 或 "gentle"
3. **正念冥想**：搜索 "meditation" 或 "zen"
4. **深度放松**：搜索 "sleep" 或 "ambient"

### 2. 疗愈频率音乐

**432Hz 音乐**（晨起推荐）
- 特点：自然和谐频率，提升专注力
- 来源：YouTube搜索 "432Hz meditation music"

**528Hz 音乐**（晨起推荐）
- 特点："爱的频率"，促进DNA修复
- 来源：YouTube搜索 "528Hz healing frequency"

**Alpha波音乐**（午休推荐）
- 特点：8-12Hz，深度放松
- 来源：YouTube搜索 "Alpha waves meditation"

**Theta波音乐**（睡前推荐）
- 特点：4-7Hz，助眠安神
- 来源：YouTube搜索 "Theta waves sleep"

### 3. 自然声音

**Freesound**（https://freesound.org/）
- 搜索关键词：
  - "rain"
  - "ocean waves"
  - "forest birds"
  - "wind"
- 注意：检查CC许可类型

---

## 🎙️ 引导语音制作

### 方案1：使用TTS工具

**推荐工具**：
1. **Azure TTS**（微软）
   - 中文女声推荐：`zh-CN-XiaoxiaoNeural`
   - 特点：自然、温暖
   - 网址：https://azure.microsoft.com/zh-cn/services/cognitive-services/text-to-speech/

2. **讯飞语音**
   - 中文女声推荐：`xiaoyan`
   - 特点：专业、清晰
   - 网址：https://www.xfyun.cn/

3. **百度语音合成**
   - 免费额度：50000次/天
   - 网址：https://ai.baidu.com/tech/speech/tts

### 方案2：真人录制

**录制要求**：
- 声音：温和、舒缓、亲切
- 语速：约100字/分钟（比正常说话慢）
- 音质：清晰、无杂音
- 格式：MP3, 128kbps以上

**录制设备**：
- 麦克风：推荐USB麦克风（如Blue Yeti）
- 软件：Audacity（免费）
- 环境：安静房间

---

## 📝 引导脚本参考

### 呼吸觉察（1分钟）

```
现在，让我们花一分钟时间，关注你的呼吸。

找一个舒适的姿势坐下或躺下。

轻轻闭上眼睛，或者半睁半闭。

吸气时，感受空气进入鼻腔的清凉...
呼气时，感受空气离开身体的温热...

不需要控制呼吸，只是观察它。

如果注意力跑开了，没关系，温和地带回来。

很好，你刚刚给自己一分钟的时间放松。
```

### 身体扫描（3分钟）

```
现在，让我们花三分钟时间，扫描你的身体。

找一个舒适的姿势躺下。

首先，把注意力带到你的双脚...
感受脚底的触感，脚趾的温度...
不需要改变什么，只是觉察...

现在，让注意力慢慢向上移动...
到小腿...大腿...臀部...

感受这些部位的感觉，放松紧张的地方...

继续向上...到腹部...胸部...
感受呼吸的起伏...

现在到双手和手臂...肩膀和颈部...
放松这些部位...

最后到面部...放松眉头...放松下巴...

很好，你的身体正在慢慢放松...
```

---

## 🔧 音频处理工具

### 合并音频

使用之前创建的脚本：
```bash
# Linux/Mac
bash public/audio/merge_audio.sh

# Windows
public/audio/merge_audio.bat
```

### 音频编辑

**Audacity**（免费开源）
- 下载：https://www.audacityteam.org/
- 功能：
  - 剪辑音频
  - 调整音量
  - 添加淡入淡出
  - 合并多个音频

### 音频优化

**推荐设置**：
- 格式：MP3
- 比特率：128-192kbps
- 采样率：44100Hz
- 声道：立体声

---

## ✅ 音频准备清单

- [ ] 下载背景音乐（4首）
- [ ] 制作或录制引导语音（4段）
- [ ] 合并背景音乐和引导语音
- [ ] 调整音量和音质
- [ ] 测试播放效果
- [ ] 准备充电站音乐（3首）

---

## 🚀 快速开始

### 最简单的方法

1. 访问 Pixabay Music
2. 搜索 "meditation"
3. 下载4首不同风格的背景音乐
4. 使用TTS工具生成引导语音
5. 使用Audacity合并

### 时间估算

- 下载背景音乐：30分钟
- 制作引导语音：1小时
- 合并和优化：30分钟
- **总计：约2小时**

---

## 💡 提示

1. **版权注意**：确保所有音频都有合法授权
2. **文件大小**：单个文件建议 < 10MB
3. **音量平衡**：所有音频音量保持一致
4. **测试播放**：在不同设备上测试效果

---

**创建时间**：2026-05-07
**更新时间**：2026-05-07
