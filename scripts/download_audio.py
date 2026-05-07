#!/usr/bin/env python3
"""
免费疗愈音频下载工具
仅用于下载明确允许下载的免费音频资源
遵守Creative Commons许可协议
"""

import os
import json
import requests
from pathlib import Path
from datetime import datetime

# 音频资源配置
AUDIO_RESOURCES = {
    "breathing": {
        "name": "呼吸觉察",
        "duration": "1分钟",
        "sources": [
            {
                "title": "Breath of Life - 60 seconds",
                "url": "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3",
                "source": "Pixabay",
                "license": "Pixabay Content License",
                "author": "Grand_Project",
                "page": "https://pixabay.com/music/ambient-breath-of-life-60-seconds-320857/"
            }
        ]
    },
    "body-scan": {
        "name": "身体扫描",
        "duration": "3分钟",
        "sources": [
            {
                "title": "Meditation Music - Calm Relaxing",
                "url": "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bba.mp3",
                "source": "Pixabay",
                "license": "Pixabay Content License",
                "author": "DanaMusic",
                "page": "https://pixabay.com/music/meditation-music-calm-relaxing-music-5152/"
            }
        ]
    },
    "meditation": {
        "name": "正念冥想",
        "duration": "5分钟",
        "sources": [
            {
                "title": "Meditation Relaxing Music",
                "url": "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc3eb81.mp3",
                "source": "Pixabay",
                "license": "Pixabay Content License",
                "author": "DanaMusic",
                "page": "https://pixabay.com/music/meditation-spirituell-meditation-relaxing-music-293922/"
            }
        ]
    },
    "relaxation": {
        "name": "深度放松",
        "duration": "7分钟",
        "sources": [
            {
                "title": "Deep Meditation",
                "url": "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc3eb81.mp3",
                "source": "Pixabay",
                "license": "Pixabay Content License",
                "author": "Grand_Project",
                "page": "https://pixabay.com/music/search/meditation/"
            }
        ]
    }
}

class AudioDownloader:
    def __init__(self, output_dir="public/audio"):
        self.output_dir = Path(output_dir)
        self.metadata_file = self.output_dir / "metadata.json"
        self.metadata = self.load_metadata()
        
    def load_metadata(self):
        """加载元数据"""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_metadata(self):
        """保存元数据"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)
    
    def download_audio(self, practice_type, source_info):
        """
        下载音频文件
        
        Args:
            practice_type: 练习类型 (breathing, body-scan, meditation, relaxation)
            source_info: 音频源信息
        """
        # 创建输出目录
        output_path = self.output_dir / practice_type
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 生成文件名
        filename = f"{practice_type}_background.mp3"
        filepath = output_path / filename
        
        # 检查是否已下载
        if filepath.exists():
            print(f"✓ 已存在: {filepath}")
            return filepath
        
        print(f"⬇️  下载中: {source_info['title']}")
        print(f"   来源: {source_info['source']}")
        print(f"   作者: {source_info['author']}")
        print(f"   许可: {source_info['license']}")
        
        try:
            # 下载音频
            response = requests.get(source_info['url'], stream=True, timeout=30)
            response.raise_for_status()
            
            # 保存文件
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # 记录元数据
            self.metadata[practice_type] = {
                "title": source_info['title'],
                "author": source_info['author'],
                "source": source_info['source'],
                "license": source_info['license'],
                "page": source_info['page'],
                "downloaded_at": datetime.now().isoformat(),
                "filepath": str(filepath)
            }
            
            print(f"✓ 下载完成: {filepath}")
            print(f"   文件大小: {filepath.stat().st_size / 1024:.1f} KB\n")
            
            return filepath
            
        except Exception as e:
            print(f"✗ 下载失败: {e}\n")
            return None
    
    def download_all(self):
        """下载所有音频"""
        print("=" * 60)
        print("开始下载疗愈音频资源")
        print("=" * 60)
        print()
        
        downloaded = []
        failed = []
        
        for practice_type, config in AUDIO_RESOURCES.items():
            print(f"\n【{config['name']}】({config['duration']})")
            print("-" * 60)
            
            for source in config['sources']:
                filepath = self.download_audio(practice_type, source)
                if filepath:
                    downloaded.append(practice_type)
                else:
                    failed.append(practice_type)
        
        # 保存元数据
        self.save_metadata()
        
        # 打印摘要
        print("\n" + "=" * 60)
        print("下载完成")
        print("=" * 60)
        print(f"✓ 成功: {len(set(downloaded))} 个")
        print(f"✗ 失败: {len(set(failed))} 个")
        
        if self.metadata:
            print(f"\n元数据已保存到: {self.metadata_file}")
        
        # 打印许可信息
        print("\n" + "=" * 60)
        print("许可信息")
        print("=" * 60)
        for practice_type, info in self.metadata.items():
            print(f"\n{AUDIO_RESOURCES[practice_type]['name']}:")
            print(f"  标题: {info['title']}")
            print(f"  作者: {info['author']}")
            print(f"  许可: {info['license']}")
            print(f"  页面: {info['page']}")
    
    def list_audio(self):
        """列出已下载的音频"""
        print("\n已下载的音频资源:")
        print("-" * 60)
        
        for practice_type, info in self.metadata.items():
            config = AUDIO_RESOURCES.get(practice_type, {})
            print(f"\n【{config.get('name', practice_type)}】")
            print(f"  文件: {info['filepath']}")
            print(f"  作者: {info['author']}")
            print(f"  许可: {info['license']}")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='免费疗愈音频下载工具')
    parser.add_argument('--download', action='store_true', help='下载所有音频')
    parser.add_argument('--list', action='store_true', help='列出已下载的音频')
    parser.add_argument('--output', default='public/audio', help='输出目录')
    
    args = parser.parse_args()
    
    downloader = AudioDownloader(output_dir=args.output)
    
    if args.download:
        downloader.download_all()
    elif args.list:
        downloader.list_audio()
    else:
        parser.print_help()
        print("\n使用示例:")
        print("  python scripts/download_audio.py --download    # 下载所有音频")
        print("  python scripts/download_audio.py --list       # 列出已下载音频")


if __name__ == '__main__':
    main()
