#!/bin/bash
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
ffmpeg -y -i "$AUDIO_DIR/breathing/breathing_background.mp3" \
       -i "$AUDIO_DIR/breathing/breathing_guide_female.mp3" \
       -filter_complex "[0:a]volume=0.25,afade=t=in:st=0:d=2,afade=t=out:st=55:d=3[bg];\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=55:d=2[voice];\
                        [bg][voice]amix=inputs=2:duration=longest" \
       -c:a libmp3lame -b:a 192k \
       "$AUDIO_DIR/breathing/breathing_complete.mp3"
echo "✓ 呼吸觉察成完成"

# 身体扫描（3分钟）
echo ""
echo "【身体扫描】"
ffmpeg -y -i "$AUDIO_DIR/body-scan/body-scan_background.mp3" \
       -i "$AUDIO_DIR/body-scan/body-scan_guide_female.mp3" \
       -filter_complex "[0:a]volume=0.20,afade=t=in:st=0:d=3,afade=t=out:st=175:d=4[bg];\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=175:d=3[voice];\
                        [bg][voice]amix=inputs=2:duration=longest" \
       -c:a libmp3lame -b:a 192k \
       "$AUDIO_DIR/body-scan/body-scan_complete.mp3"
echo "✓ 身体扫描合成完成"

# 正念冥想（5分钟）
echo ""
echo "【正念冥想】"
ffmpeg -y -i "$AUDIO_DIR/meditation/meditation_background.mp3" \
       -i "$AUDIO_DIR/meditation/meditation_guide_female.mp3" \
       -filter_complex "[0:a]volume=0.20,afade=t=in:st=0:d=4,afade=t=out:st=295:d=5[bg];\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=295:d=3[voice];\
                        [bg][voice]amix=inputs=2:duration=longest" \
       -c:a libmp3lame -b:a 192k \
       "$AUDIO_DIR/meditation/meditation_complete.mp3"
echo "✓ 正念冥想合成完成"

# 深度放松（7分钟）
echo ""
echo "【深度放松】"
ffmpeg -y -i "$AUDIO_DIR/relaxation/relaxation_background.mp3" \
       -i "$AUDIO_DIR/relaxation/relaxation_guide_female.mp3" \
       -filter_complex "[0:a]volume=0.15,afade=t=in:st=0:d=5,afade=t=out:st=415:d=6[bg];\
                        [1:a]afade=t=in:st=0:d=1,afade=t=out:st=415:d=3[voice];\
                        [bg][voice]amix=inputs=2:duration=longest" \
       -c:a libmp3lame -b:a 192k \
       "$AUDIO_DIR/relaxation/relaxation_complete.mp3"
echo "✓ 深度放松合成完成"

echo ""
echo "========================================"
echo "所有音频合成完成！"
echo "========================================"
