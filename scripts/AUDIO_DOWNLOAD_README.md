# 音频下载工具使用说明

## 快速开始

### 1. 安装依赖

```bash
pip install requests
```

### 2. 下载所有音频

```bash
python scripts/download_audio.py --download
```

### 3. 查看已下载音频

```bash
python scripts/download_audio.py --list
```

## 输出目录结构

```
public/audio/
├── breathing/
│   └── breathing_background.mp3
├── body-scan/
│   └── body-scan_background.mp3
├── meditation/
│   └── meditation_background.mp3
├── relaxation/
│   └── relaxation_background.mp3
└── metadata.json
```

## 音频来源

所有音频均来自 Pixabay Music，使用 Pixabay Content License：
- ✅ 可商用
- ✅ 无需署名
- ✅ 可修改
- ✅ 可分发

## 注意事项

1. **网络连接**：需要稳定的网络连接
2. **下载时间**：取决于网络速度和文件大小
3. **存储空间**：确保有足够的磁盘空间
4. **许可合规**：使用时遵守许可协议

## 手动下载

如果自动下载失败，可以手动下载：

### 呼吸觉察（1分钟）
- 网址：https://pixabay.com/music/ambient-breath-of-life-60-seconds-320857/
- 点击页面上的"Download"按钮

### 身体扫描（3分钟）
- 网址：https://pixabay.com/music/meditation-music-calm-relaxing-music-5152/
- 点击页面上的"Download"按钮

### 正念冥想（5分钟）
- 网址：https://pixabay.com/music/meditation-spirituell-meditation-relaxing-music-293922/
- 点击页面上的"Download"按钮

### 深度放松（7分钟）
- 网址：https://pixabay.com/music/search/meditation/
- 搜索"Deep Meditation"并下载

## 更多资源

详细的音频资源指南请查看：
- `/docs/FREE_AUDIO_RESOURCES.md`

## 法律声明

本工具仅用于下载明确允许下载的免费音频资源。使用音频时请遵守相关许可协议。
