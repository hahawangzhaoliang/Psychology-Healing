#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精确背景去除工具
基于指定背景色的抠图
"""

import os
import cv2
import numpy as np
from PIL import Image

def remove_background_by_color(input_path, output_path, bg_color=(245, 245, 245), tolerance=25):
    """
    基于背景颜色去除背景
    bg_color: 背景色 RGB (R, G, B)
    tolerance: 容差范围
    """
    try:
        pil_img = Image.open(input_path)
        if pil_img.mode != 'RGBA':
            pil_img = pil_img.convert('RGBA')
        
        img_rgba = np.array(pil_img)
        img_rgb = img_rgba[:, :, :3].copy()
        height, width = img_rgb.shape[:2]
        
        # 背景色
        bg = np.array(bg_color, dtype=np.uint8)
        
        # 计算每个像素到背景色的欧氏距离
        diff = img_rgb.astype(np.float32) - bg.astype(np.float32)
        distances = np.sqrt(np.sum(diff ** 2, axis=2))
        
        # 创建掩码：距离小于容差=背景(透明)，距离大于=前景(不透明)
        mask = (distances > tolerance).astype(np.uint8) * 255
        
        # 形态学处理
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        
        # 开运算去除小噪点
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # 闭运算填补小空洞
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # 轻微膨胀，确保边缘完整
        mask = cv2.dilate(mask, kernel, iterations=1)
        
        # 应用掩码
        img_rgba[:, :, 3] = mask
        
        result_img = Image.fromarray(img_rgba)
        result_img.save(output_path, 'PNG')
        
        print(f"[OK] 处理完成: {os.path.basename(input_path)}")
        return True
        
    except Exception as e:
        print(f"[FAIL] 处理失败 {os.path.basename(input_path)}: {str(e)}")
        return False


def process_directory(input_dir, output_dir):
    """批量处理"""
    os.makedirs(output_dir, exist_ok=True)
    
    png_files = [f for f in os.listdir(input_dir) if f.lower().endswith('.png')]
    
    if not png_files:
        print(f"在 {input_dir} 中没有找到 PNG 文件")
        return
    
    print(f"找到 {len(png_files)} 个 PNG 文件，开始处理...")
    print("-" * 50)
    
    # 根据分析，背景色是浅灰色 (245, 245, 245)，容差25
    success_count = 0
    for filename in png_files:
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        
        if remove_background_by_color(input_path, output_path, bg_color=(245, 245, 245), tolerance=25):
            success_count += 1
    
    print("-" * 50)
    print(f"处理完成！成功: {success_count}/{len(png_files)}")


if __name__ == "__main__":
    input_dir = r"e:\Project\Psychology Healing\Psychology-Healing\public\images\companions"
    output_dir = r"e:\Project\Psychology Healing\Psychology-Healing\public\images\companions\no-bg-v3"
    
    print("=" * 50)
    print("精确背景去除工具")
    print("=" * 50)
    
    process_directory(input_dir, output_dir)
    
    print("\n处理完成！透明背景的图片已保存到:")
    print(output_dir)
