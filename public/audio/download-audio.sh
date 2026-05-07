#!/bin/bash

# 音频文件下载脚本
# 使用方法：bash public/audio/download-audio.sh

echo "========================================="
echo "🎵 心晴空间 - 音频文件下载助手"
echo "========================================="
echo ""

# 检查是否安装了wget或curl
if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
    echo "❌ 错误：需要安装 wget 或 curl"
    echo ""
    echo "安装方法："
    echo "  Ubuntu/Debian: sudo apt-get install wget"
    echo "  macOS: brew install wget"
    echo "  Windows: 使用 Git Bash 或 WSL"
    exit 1
fi

# 下载函数
download_file() {
    local url=$1
    local output=$2
    local description=$3
    
    echo "📥 下载：$description"
    echo "   来源：$url"
    echo "   保存：$output"
    
    if command -v wget &> /dev/null; then
        wget -q --show-progress -O "$output" "$url"
    else
        curl -L -o "$output" "$url"
    fi
    
    if [ $? -eq 0 ]; then
        echo "   ✅ 下载成功"
    else
        echo "   ❌ 下载失败"
    fi
    echo ""
}

echo "⚠️  重要提示："
echo "   由于网络限制，建议手动下载音频文件"
echo "   请参考 DOWNLOAD_CHECKLIST.md 中的详细步骤"
echo ""
echo "以下是推荐的音频资源链接："
echo ""

echo "1️⃣  呼吸觉察（1分钟）"
echo "   https://pixabay.com/music/ambient-breath-of-life-60-seconds-320857/"
echo ""

echo "2️⃣  身体扫描（3分钟）"
echo "   https://pixabay.com/music/meditation-music-calm-relaxing-music-5152/"
echo ""

echo "3️⃣  正念冥想（5分钟）"
echo "   https://pixabay.com/music/meditation-spirituell-meditation-relaxing-music-293922/"
echo ""

echo "4️⃣  深度放松（7分钟）"
echo "   https://pixabay.com/music/search/meditation/"
echo ""

echo "========================================="
echo "📖 详细下载步骤请查看："
echo "   public/audio/DOWNLOAD_CHECKLIST.md"
echo "========================================="
