# 音频文件快速准备指南

> 30分钟完成所有音频文件准备

---

## 📋 准备清单

### 必需文件（共8个）

**背景音乐（4个）**：
- [ ] `breathing_background.mp3` - 呼吸觉察背景音乐（1分钟）
- [ ] `body-scan_background.mp3` - 身体扫描背景音乐（3分钟）
- [ ] `meditation_background.mp3` - 正念冥想背景音乐（5分钟）
- [ ] `relaxation_background.mp3` - 深度放松背景音乐（7分钟）

**引导语音（4个）**：
- [ ] `breathing_guide_female.mp3` - 呼吸觉察引导（女声，1分钟）
- [ ] `body-scan_guide_female.mp3` - 身体扫描引导（女声，3分钟）
- [ ] `meditation_guide_female.mp3` - 正念冥想引导（女声，5分钟）
- [ ] `relaxation_guide_female.mp3` - 深度放松引导（女声，7分钟）

### 可选文件（共7个）

**男声引导（4个）**：
- [ ] `breathing_guide_male.mp3`
- [ ] `body-scan_guide_male.mp3`
- [ ] `meditation_guide_male.mp3`
- [ ] `relaxation_guide_male.mp3`

**充电站音乐（3个）**：
- [ ] `morning_432hz.mp3` - 晨起音乐
- [ ] `noon_alpha.mp3` - 午休音乐
- [ ] `night_theta.mp3` - 睡前音乐

---

## 🚀 快速开始（3步完成）

### 第1步：下载背景音乐（15分钟）

#### 方案A：Pixabay Music（推荐）

1. **访问 Pixabay Music**
   - 网址：https://pixabay.com/music/
   - 无需注册，完全免费

2. **下载呼吸觉察背景音乐**
   ```
   搜索：breathing
   推荐：Breath of Life - 60 seconds
   网址：https://pixabay.com/music/ambient-breath-of-life-60-seconds-320857/
   保存为：public/audio/breathing/breathing_background.mp3
   ```

3. **下载身体扫描背景音乐**
   ```
   搜索：meditation
   推荐：Meditation Music - Calm, Relaxing Music
   网址：https://pixabay.com/music/meditation-music-calm-relaxing-music-5152/
   保存为：public/audio/body-scan/body-scan_background.mp3
   提示：可截取前3分钟
   ```

4. **下载正念冥想背景音乐**
   ```
   搜索：meditation relaxing
   推荐：Meditation Relaxing Music
   网址：https://pixabay.com/music/meditation-spirituell-meditation-relaxing-music-293922/
   保存为：public/audio/meditation/meditation_background.mp3
   提示：可截取前5分钟
   ```

5. **下载深度放松背景音乐**
   ```
   搜索：deep meditation
   推荐：Deep Meditation
   网址：https://pixabay.com/music/search/meditation/
   保存为：public/audio/relaxation/relaxation_background.mp3
   提示：可截取前7分钟
   ```

#### 方案B：使用本地音乐

如果您有合适的轻音乐、钢琴曲：
- 确保无版权问题
- 按时长要求截取
- 重命名并保存到对应目录

---

### 第2步：生成引导语音（10分钟）

#### 方案A：使用TTS工具（推荐）

**百度语音合成**（免费额度：50000次/天）

1. **注册百度AI账号**
   - 网址：https://console.bce.baidu.com/ai/#/ai/speech/overview/index
   - 创建应用，获取 APP_ID, API_KEY, SECRET_KEY

2. **安装SDK**
   ```bash
   npm install baidu-aip-sdk
   ```

3. **配置凭据**
   - 编辑 `scripts/generate-tts-guide.js`
   - 替换 YOUR_APP_ID, YOUR_API_KEY, YOUR_SECRET_KEY

4. **生成音频**
   ```bash
   node scripts/generate-tts-guide.js
   ```

**其他TTS工具**：
- 讯飞开放平台：https://www.xfyun.cn/
- Azure TTS：https://azure.microsoft.com/zh-cn/services/cognitive-services/text-to-speech/
- 腾讯云TTS：https://cloud.tencent.com/product/tts

#### 方案B：真人录制

1. **准备设备**
   - 麦克风：USB麦克风（如Blue Yeti）
   - 软件：Audacity（免费）
   - 环境：安静房间

2. **录制要求**
   - 语速：约100字/分钟（比正常说话慢）
   - 语气：温和、舒缓、亲切
   - 音质：清晰、无杂音
   - 格式：MP3, 128kbps以上

3. **录制脚本**
   - 参考：`docs/AUDIO_GUIDE_SCRIPTS.md`
   - 包含女声版和男声版

---

### 第3步：验证文件（5分钟）

运行检查脚本：

```bash
node scripts/check-audio-files.js
```

预期输出：
```
✅ 所有必需音频文件已准备就绪！
```

---

## 🎵 音频处理技巧

### 使用Audacity处理音频

#### 1. 截取音频

```
1. 打开Audacity
2. 文件 → 打开 → 选择音频文件
3. 选择需要的部分（拖动鼠标）
4. 编辑 → 删除特殊 → 修剪音频
5. 文件 → 导出 → 导出为MP3
```

#### 2. 调整音量

```
1. 选择整个音频（Ctrl+A）
2. 效果 → 放大
3. 设置目标音量（推荐 -15dB 到 -12dB）
4. 预览 → 确定
```

#### 3. 添加淡入淡出

```
淡入：
1. 选择音频开头（3-5秒）
2. 效果 → 淡入

淡出：
1. 选择音频结尾（5-10秒）
2. 效果 → 淡出
```

#### 4. 合并音频

```
1. 文件 → 打开 → 背景音乐
2. 文件 → 导入 → 引导语音
3. 调整背景音乐音量（-15dB）
4. 文件 → 导出 → 导出为MP3
```

---

## 📁 文件结构

完成后，您的目录应该如下：

```
public/audio/
├── breathing/
│   ├── breathing_background.mp3       ✅ 必需
│   └── breathing_guide_female.mp3     ✅ 必需
├── body-scan/
│   ├── body-scan_background.mp3       ✅ 必需
│   └── body-scan_guide_female.mp3     ✅ 必需
├── meditation/
│   ├── meditation_background.mp3      ✅ 必需
│   └── meditation_guide_female.mp3    ✅ 必需
├── relaxation/
│   ├── relaxation_background.mp3      ✅ 必需
│   └── relaxation_guide_female.mp3    ✅ 必需
└── charging-station/
    ├── morning_432hz.mp3              ⚠️ 可选
    ├── noon_alpha.mp3                 ⚠️ 可选
    └── night_theta.mp3                ⚠️ 可选
```

---

## ⚠️ 常见问题

### Q1: 无法访问Pixabay怎么办？

**解决方案**：
1. 使用VPN或代理
2. 尝试其他平台：
   - Freesound：https://freesound.org/
   - Free Music Archive：https://freemusicarchive.org/
   - Bensound：https://www.bensound.com/

### Q2: TTS生成的声音不自然怎么办？

**解决方案**：
1. 尝试其他TTS服务（如Azure TTS、讯飞）
2. 调整语速、音调参数
3. 考虑真人录制

### Q3: 音频文件太大怎么办？

**解决方案**：
1. 使用Audacity降低比特率（128kbps足够）
2. 使用在线压缩工具
3. 建议单个文件 < 10MB

### Q4: 可以先测试功能吗？

**解决方案**：
```bash
# 创建占位符文件（仅用于测试）
touch public/audio/breathing/breathing_background.mp3
touch public/audio/breathing/breathing_guide_female.mp3
# ... 其他文件同理
```

---

## 📚 相关文档

- **详细下载清单**：`public/audio/DOWNLOAD_CHECKLIST.md`
- **音频准备指南**：`docs/AUDIO_PREPARATION_GUIDE.md`
- **引导脚本**：`docs/AUDIO_GUIDE_SCRIPTS.md`
- **免费资源汇总**：`docs/FREE_AUDIO_RESOURCES.md`

---

## 🎯 下一步

音频文件准备完成后：

1. ✅ 运行检查脚本验证
2. ✅ 启动服务器测试播放
3. ✅ 在不同设备上测试效果
4. ✅ 准备部署到生产环境

---

**预计总时间**：30分钟
**难度**：简单
**重要提示**：确保所有音频版权合法
