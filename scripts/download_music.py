#!/usr/bin/env python3
"""
下载可商用疗愈音乐的脚本
数据来源：Kevin MacLeod - Incompetech (CC BY 3.0)
"""

import urllib.request
import os
import json
import re

# 配置
AUDIO_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'audio')
BGM_DIR = os.path.join(AUDIO_DIR, 'bgm')
AMBIENT_DIR = os.path.join(AUDIO_DIR, 'ambient')

# 确保目录存在
os.makedirs(BGM_DIR, exist_ok=True)
os.makedirs(AMBIENT_DIR, exist_ok=True)

# Kevin MacLeod 疗愈/冥想/放松音乐 - CC BY 3.0
# 来源: freemusicbg.com, incompetech.com
MUSIC_SOURCES = {
    "bgm": [
        {"name": "Healing", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=3868&action=download", "filename": "healing-meditation.mp3"},
        {"name": "Dreams", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4411&action=download", "filename": "dreams-ambient.mp3"},
        {"name": "Spirit", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4410&action=download", "filename": "spirit-journey.mp3"},
        {"name": "Meditating", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4409&action=download", "filename": "meditating-beat.mp3"},
        {"name": "Quiet", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4408&action=download", "filename": "quiet-moment.mp3"},
        {"name": "Healing2", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4407&action=download", "filename": "healing-flow.mp3"},
        {"name": "Suite in D Minor", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4406&action=download", "filename": "classical-calm.mp3"},
        {"name": "Ambient Piano", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4405&action=download", "filename": "ambient-piano.mp3"},
        {"name": "Peaceful", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4404&action=download", "filename": "peaceful-mind.mp3"},
        {"name": "Relax", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4403&action=download", "filename": "relaxation-time.mp3"},
        {"name": "Morning", "artist": "Kevin MacLeod", "url": "https://cdn.freemusicbg.com/api/playmp3.php?id=4402&action=download", "filename": "morning-peace.mp3"},
    ],
    "ambient": [
        # 来自 Wikimedia Commons 的公共领域环境音
        {"name": "Rain Sounds", "artist": "LibreWave", "url": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Rain_Sound_1.ogg", "filename": "rain-sounds.ogg"},
        {"name": "Ocean Waves", "artist": "Penguin", "url": "https://upload.wikimedia.org/wikipedia/commons/1/15/Ocean_Waves_5_minutes.ogx", "filename": "ocean-waves.ogx"},
        {"name": "Forest Birds", "artist": "LibreWave", "url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Birds_in_forest.ogg", "filename": "forest-birds.ogg"},
        {"name": "Thunderstorm", "artist": "LibreWave", "url": "https://upload.wikimedia.org/wikipedia/commons/0/09/Thunderstorm.ogg", "filename": "thunderstorm.ogg"},
        {"name": "Water Stream", "artist": "LibreWave", "url": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Stream_water_sound.ogg", "filename": "water-stream.ogg"},
    ]
}

def download_file(url, filepath, name):
    """下载文件"""
    if os.path.exists(filepath):
        print(f"[SKIP] Already exists: {name}")
        return True
    
    print(f"[DOWN] Downloading: {name}...")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=120) as response:
            data = response.read()
            # 检查是否是有效的音频文件
            if len(data) < 10000:  # 小于10KB可能是错误页面
                print(f"[FAIL] File too small, may be error: {name}")
                return False
            with open(filepath, 'wb') as f:
                f.write(data)
        print(f"[OK] Done: {name} ({len(data)//1024}KB)")
        return True
    except Exception as e:
        print(f"[FAIL] Error: {name} - {e}")
        return False

def main():
    print("=" * 60)
    print("Healing Music Downloader")
    print("Target: " + AUDIO_DIR)
    print("License: CC BY 3.0 (Kevin MacLeod)")
    print("=" * 60)
    
    total_downloaded = 0
    total_skipped = 0
    
    # Download BGM
    print("\n[BGM] Background Music:")
    print("-" * 40)
    for item in MUSIC_SOURCES["bgm"]:
        filepath = os.path.join(BGM_DIR, item["filename"])
        if download_file(item["url"], filepath, item["name"]):
            total_downloaded += 1
        else:
            total_skipped += 1
    
    # Download Ambient
    print("\n[Ambient] Environment Sounds:")
    print("-" * 40)
    for item in MUSIC_SOURCES["ambient"]:
        filepath = os.path.join(AMBIENT_DIR, item["filename"])
        if download_file(item["url"], filepath, item["name"]):
            total_downloaded += 1
        else:
            total_skipped += 1
    
    print("\n" + "=" * 60)
    print(f"Downloaded: {total_downloaded}")
    if total_skipped > 0:
        print(f"Skipped/Failed: {total_skipped}")
    print("=" * 60)

if __name__ == "__main__":
    main()
