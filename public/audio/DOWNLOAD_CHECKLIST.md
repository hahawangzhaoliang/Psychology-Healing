# 音频文件下载清单

> 完成一项打勾一项 ✅

## 一、背景音乐（必选）

### 1.1 呼吸觉察 - 1分钟背景音乐
- [ ] **Breath of Life - 60 seconds**
  - 来源：Pixabay Music
  - 网址：https://pixabay.com/music/ambient-breath-of-life-60-seconds-320857/
  - 时长：1分钟
  - 保存为：`public/audio/breathing/breathing_background.mp3`

### 1.2 身体扫描 - 3分钟背景音乐
- [ ] **Meditation Music - Calm, Relaxing Music**
  - 来源：Pixabay Music
  - 网址：https://pixabay.com/music/meditation-music-calm-relaxing-music-5152/
  - 时长：6分52秒（可截取前3分钟）
  - 保存为：`public/audio/body-scan/body-scan_background.mp3`

### 1.3 正念冥想 - 5分钟背景音乐
- [ ] **Meditation Relaxing Music**
  - 来源：Pixabay Music
  - 网址：https://pixabay.com/music/meditation-spirituell-meditation-relaxing-music-293922/
  - 时长：6分52秒（可截取前5分钟）
  - 保存为：`public/audio/meditation/meditation_background.mp3`

### 1.4 深度放松 - 7分钟背景音乐
- [ ] **Deep Meditation**
  - 来源：Pixabay Music
  - 网址：https://pixabay.com/music/search/meditation/
  - 时长：10分45秒（可截取前7分钟）
  - 保存为：`public/audio/relaxation/relaxation_background.mp3`

---

## 二、充电站音乐（可选）

### 2.1 晨起音乐 - 432Hz
- [ ] **432Hz Meditation Music**
  - 来源：YouTube搜索 "432Hz meditation music"
  - 时长：5-10分钟
  - 保存为：`public/audio/charging-station/morning_432hz.mp3`
  - 推荐频道：Meditative Mind, YellowBrickCinema

### 2.2 午休音乐 - Alpha波
- [ ] **Alpha Waves Music**
  - 来源：YouTube搜索 "Alpha waves meditation"
  - 时长：10-15分钟
  - 保存为：`public/audio/charging-station/noon_alpha.mp3`
  - 推荐频道：Relax Melodies, Sleep Tube

### 2.3 睡前音乐 - Theta波
- [ ] **Theta Waves Sleep Music**
  - 来源：YouTube搜索 "Theta waves sleep"
  - 时长：15-30分钟
  - 保存为：`public/audio/charging-station/night_theta.mp3`
  - 推荐频道：Sleep Frequency, Jason Stephenson

---

## 三、下载步骤

### 3.1 Pixabay Music下载（推荐）

1. 访问 https://pixabay.com/music/
2. 搜索关键词（如 `meditation`）
3. 试听音频，选择合适的
4. 点击绿色"Download"按钮
5. 选择MP3格式
6. 下载完成后重命名并移动到对应目录

**许可说明**：
- Pixabay Content License
- ✅ 可商用
- ✅ 无需署名
- ✅ 可修改

### 3.2 YouTube音频下载

**工具推荐**：
- 4K Video Downloader（桌面软件）
- Y2Mate（在线工具）
- ClipConverter（在线工具）

**步骤**：
1. 复制YouTube视频链接
2. 粘贴到下载工具
3. 选择MP3格式
4. 下载并重命名

**注意**：
- 仅下载无版权或Creative Commons许可的音频
- 推荐频道通常允许免费使用

---

## 四、音频处理

### 4.1 截取音频（如需要）

**工具**：Audacity（免费）

**步骤**：
1. 打开Audacity
2. 导入音频文件
3. 选择需要的部分
4. 点击"编辑" → "删除特殊" → "修剪音频"
5. 导出为MP3

### 4.2 音量调整

**推荐音量**：
- 背景音乐：-15dB 到 -12dB
- 引导语音：-6dB 到 -3dB

### 4.3 淡入淡出

**建议**：
- 淡入：3-5秒
- 淡出：5-10秒

---

## 五、文件检查

下载完成后，检查以下文件是否存在：

```bash
# 检查命令
ls -lh public/audio/breathing/breathing_background.mp3
ls -lh public/audio/body-scan/body-scan_background.mp3
ls -lh public/audio/meditation/meditation_background.mp3
ls -lh public/audio/relaxation/relaxation_background.mp3
```

---

## 六、备用方案

### 6.1 如果无法下载

**方案A：使用本地音乐**
- 使用自己的轻音乐、钢琴曲
- 确保无版权问题

**方案B：使用AI生成音乐**
- AIVA（https://www.aiva.ai/）
- Amper Music（https://www.ampermusic.com/）
- Boomy（https://boomy.com/）

### 6.2 临时测试

可以先使用占位符音频测试功能：
```bash
# 创建1秒静音文件作为占位符
touch public/audio/breathing/breathing_background.mp3
```

---

## 七、完成标准

- [ ] 4个背景音乐文件已下载
- [ ] 文件命名正确
- [ ] 文件位置正确
- [ ] 音频可以正常播放
- [ ] 音质清晰无杂音

---

**预计时间**：30分钟
**难度**：简单
**重要提示**：确保音频版权合法
