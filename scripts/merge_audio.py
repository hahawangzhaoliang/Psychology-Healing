#!/usr/bin/env python3
"""
音频合成工具
将引导语音和背景音乐合成为完整的疗愈音频
"""

import os
import json
from pathlib import Path

class AudioMerger:
    def __init__(self, audio_dir="public/audio"):
        self.audio_dir = Path(audio_dir)
        self.config_file = self.audio_dir / "merge_config.json"
        
    def create_config_template(self):
        """创建配置模板"""
        config = {
            "breathing": {
                "name": "呼吸觉察",
                "duration": "1分钟",
                "guide_audio": "breathing/breathing_guide_female.mp3",
                "background_audio": "breathing/breathing_background.mp3",
                "output_audio": "breathing/breathing_complete.mp3",
                "background_volume": 0.25,
                "fade_in": 2,
                "fade_out": 3
            },
            "body-scan": {
                "name": "身体扫描",
                "duration": "3分钟",
                "guide_audio": "body-scan/body-scan_guide_female.mp3",
                "background_audio": "body-scan/body-scan_background.mp3",
                "output_audio": "body-scan/body-scan_complete.mp3",
                "background_volume": 0.20,
                "fade_in": 3,
                "fade_out": 4
            },
            "meditation": {
                "name": "正念冥想",
                "duration": "5分钟",
                "guide_audio": "meditation/meditation_guide_female.mp3",
                "background_audio": "meditation/meditation_background.mp3",
                "output_audio": "meditation/meditation_complete.mp3",
                "background_volume": 0.20,
                "fade_in": 4,
                "fade_out": 5
            },
            "relaxation": {
                "name": "深度放松",
                "duration": "7分钟",
                "guide_audio": "relaxation/relaxation_guide_female.mp3",
                "background_audio": "relaxation/relaxation_background.mp3",
                "output_audio": "relaxation/relaxation_complete.mp3",
                "background_volume": 0.15,
                "fade_in": 5,
                "fade_out": 6
            }
        }
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        print(f"✓ 配置模板已创建: {self.config_file}")
        return config
    
    def print_merge_instructions(self):
        """打印合成说明"""
        print("\n" + "=" * 70)
        print("音频合成说明")
        print("=" * 70)
        
        print("\n【准备工作】")
        print("1. 确保已安装 FFmpeg")
        print("   - Windows: 下载 https://ffmpeg.org/download.html")
        print("   - Mac: brew install ffmpeg")
        print("   - Linux: sudo apt install ffmpeg")
        
        print("\n2. 准备音频文件")
        print("   - 引导语音: [类型]_guide_female.mp3 或 [类型]_guide_male.mp3")
        print("   - 背景音乐: [类型]_background.mp3")
        
        print("\n【合成命令】")
        print("\n使用 FFmpeg 合成音频:")
        print("-" * 70)
        
        practices = [
            ("breathing", "呼吸觉察", "1分钟"),
            ("body-scan", "身体扫描", "3分钟"),
            ("meditation", "正念冥想", "5分钟"),
            ("relaxation", "深度放松", "7分钟")
        ]
        
        for practice_type, name, duration in practices:
            print(f"\n# {name}（{duration}）")
            print(f"ffmpeg -i public/audio/{practice_type}/{practice_type}_background.mp3 \\")
            print(f"       -i public/audio/{practice_type}/{practice_type}_guide_female.mp3 \\")
            print(f"       -filter_complex \"[0:a]volume=0.25,afade=t=in:st=0:d=2,afade=t=out:st=55:d=3[bg];")
            print(f"                         [1:a]afade=t=in:st=0:d=1,afade=t=out:st=55:d=2[voice];")
            print(f"                         [bg][voice]amix=inputs=2:duration=longest\" \\")
            print(f"       -c:a libmp3lame -b:a 192k \\")
            print(f"       public/audio/{practice_type}/{practice_type}_complete.mp3")
        
        print("\n" + "=" * 70)
        
    def generate_ffmpeg_script(self):
        """生成FFmpeg合成脚本"""
        script_file = self.audio_dir / "merge_audio.sh"
        
        script_content = '''#!/bin/bash
# 音频合成脚本
# 使用FFmpeg将引导语音和背景音乐合成

set -e

AUDIO_DIR="public/audio"

echo "========================================"
echo "开始合成疗愈音频"
echo "========================================"

# 呼吸觉察（1分钟）
echo ""
echo "【呼吸觉察】"
ffmpeg -y -i "$AUDIO_DIR/breathing/breathing_background.mp3" \\
       -i "$AUDIO_DIR/breathing/breathing_guide_female.mp3" \\
       -filter_complex "[0:a]volume=0.25,afade=t=in:st=0:d=2,afade=t=out:st=55:d=3[bg];\\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=55:d=2[voice];\\
                        [bg][voice]amix=inputs=2:duration=longest" \\
       -c:a libmp3lame -b:a 192k \\
       "$AUDIO_DIR/breathing/breathing_complete.mp3"
echo "✓ 呼吸觉察成完成"

# 身体扫描（3分钟）
echo ""
echo "【身体扫描】"
ffmpeg -y -i "$AUDIO_DIR/body-scan/body-scan_background.mp3" \\
       -i "$AUDIO_DIR/body-scan/body-scan_guide_female.mp3" \\
       -filter_complex "[0:a]volume=0.20,afade=t=in:st=0:d=3,afade=t=out:st=175:d=4[bg];\\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=175:d=3[voice];\\
                        [bg][voice]amix=inputs=2:duration=longest" \\
       -c:a libmp3lame -b:a 192k \\
       "$AUDIO_DIR/body-scan/body-scan_complete.mp3"
echo "✓ 身体扫描合成完成"

# 正念冥想（5分钟）
echo ""
echo "【正念冥想】"
ffmpeg -y -i "$AUDIO_DIR/meditation/meditation_background.mp3" \\
       -i "$AUDIO_DIR/meditation/meditation_guide_female.mp3" \\
       -filter_complex "[0:a]volume=0.20,afade=t=in:st=0:d=4,afade=t=out:st=295:d=5[bg];\\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=295:d=3[voice];\\
                        [bg][voice]amix=inputs=2:duration=longest" \\
       -c:a libmp3lame -b:a 192k \\
       "$AUDIO_DIR/meditation/meditation_complete.mp3"
echo "✓ 正念冥想合成完成"

# 深度放松（7分钟）
echo ""
echo "【深度放松】"
ffmpeg -y -i "$AUDIO_DIR/relaxation/relaxation_background.mp3" \\
       -i "$AUDIO_DIR/relaxation/relaxation_guide_female.mp3" \\
       -filter_complex "[0:a]volume=0.15,afade=t=in:st=0:d=5,afade=t=out:st=415:d=6[bg];\\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=415:d=3[voice];\\
                        [bg][voice]amix=inputs=2:duration=longest" \\
       -c:a libmp3lame -b:a 192k \\
       "$AUDIO_DIR/relaxation/relaxation_complete.mp3"
echo "✓ 深度放松合成完成"

echo ""
echo "========================================"
echo "所有音频合成完成！"
echo "========================================"
'''
        
        with open(script_file, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        # 给脚本添加执行权限
        os.chmod(script_file, 0o755)
        
        print(f"\n✓ FFmpeg脚本已生成: {script_file}")
        print(f"  执行方式: bash {script_file}")
        
    def generate_windows_script(self):
        """生成Windows批处理脚本"""
        script_file = self.audio_dir / "merge_audio.bat"
        
        script_content = '''@echo off
REM 音频合成脚本
REM 使用FFmpeg将引导语音和背景音乐合成

set AUDIO_DIR=public\\audio

echo ========================================
echo 开始合成疗愈音频
echo ========================================

REM 呼吸觉察（1分钟）
echo.
echo 【呼吸觉察】
ffmpeg -y -i "%AUDIO_DIR%\\breathing\\breathing_background.mp3" ^
       -i "%AUDIO_DIR%\\breathing\\breathing_guide_female.mp3" ^
       -filter_complex "[0:a]volume=0.25,afade=t=in:st=0:d=2,afade=t=out:st=55:d=3[bg];[1:a]afade=t=in:st=0:d=1,afade=t=out:st=55:d=2[voice];[bg][voice]amix=inputs=2:duration=longest" ^
       -c:a libmp3lame -b:a 192k ^
       "%AUDIO_DIR%\\breathing\\breathing_complete.mp3"
echo ✓ 呼吸觉察合成完成

REM 身体扫描（3分钟）
echo.
echo 【身体扫描】
ffmpeg -y -i "%AUDIO_DIR%\\body-scan\\body-scan_background.mp3" ^
       -i "%AUDIO_DIR%\\body-scan\\body-scan_guide_female.mp3" ^
       -filter_complex "[0:a]volume=0.20,afade=t=in:st=0:d=3,afade=t=out:st=175:d=4[bg];[1:a]afade=t=in:st=0:d=1,afade=t=out:st=175:d=3[voice];[bg][voice]amix=inputs=2:duration=longest" ^
       -c:a libmp3lame -b:a 192k ^
       "%AUDIO_DIR%\\body-scan\\body-scan_complete.mp3"
echo ✓ 身体扫描合成完成

REM 正念冥想（5分钟）
echo.
echo 【正念冥想】
ffmpeg -y -i "%AUDIO_DIR%\\meditation\\meditation_background.mp3" ^
       -i "%AUDIO_DIR%\\meditation\\meditation_guide_female.mp3" ^
       -filter_complex "[0:a]volume=0.20,afade=t=in:st=0:d=4,afade=t=out:st=295:d=5[bg];[1:a]afade=t=in:st=0:d=1,afade=t=out:st=295:d=3[voice];[bg][voice]amix=inputs=2:duration=longest" ^
       -c:a libmp3lame -b:a 192k ^
       "%AUDIO_DIR%\\meditation\\meditation_complete.mp3"
echo ✓ 正念冥想合成完成

REM 深度放松（7分钟）
echo.
echo 【深度放松】
ffmpeg -y -i "%AUDIO_DIR%\\relaxation\\relaxation_background.mp3" ^
       -i "%AUDIO_DIR%\\relaxation\\relaxation_guide_female.mp3" ^
       -filter_complex "[0:a]volume=0.15,afade=t=in:st=0:d=5,afade=t=out:st=415:d=6[bg];[1:a]afade=t=in:st=0:d=1,afade=t=out:st=415:d=3[voice];[bg][voice]amix=inputs=2:duration=longest" ^
       -c:a libmp3lame -b:a 192k ^
       "%AUDIO_DIR%\\relaxation\\relaxation_complete.mp3"
echo ✓ 深度放松合成完成

echo.
echo ========================================
echo 所有音频合成完成！
echo ========================================
pause
'''
        
        with open(script_file, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        print(f"\n✓ Windows批处理脚本已生成: {script_file}")
        print(f"  执行方式: 双击运行 {script_file}")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='音频合成工具')
    parser.add_argument('--config', action='store_true', help='创建配置模板')
    parser.add_argument('--instructions', action='store_true', help='显示合成说明')
    parser.add_argument('--script', action='store_true', help='生成FFmpeg脚本')
    parser.add_argument('--all', action='store_true', help='执行所有操作')
    
    args = parser.parse_args()
    
    merger = AudioMerger()
    
    if args.all:
        merger.create_config_template()
        merger.print_merge_instructions()
        merger.generate_ffmpeg_script()
        merger.generate_windows_script()
    elif args.config:
        merger.create_config_template()
    elif args.instructions:
        merger.print_merge_instructions()
    elif args.script:
        merger.generate_ffmpeg_script()
        merger.generate_windows_script()
    else:
        parser.print_help()
        print("\n使用示例:")
        print("  python scripts/merge_audio.py --all           # 执行所有操作")
        print("  python scripts/merge_audio.py --config        # 创建配置模板")
        print("  python scripts/merge_audio.py --instructions  # 显示合成说明")
        print("  python scripts/merge_audio.py --script        # 生成FFmpeg脚本")


if __name__ == '__main__':
    main()
