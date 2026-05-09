#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量去除图片背景工具
使用 OpenCV GrabCut 算法自动去除背景
支持中文路径
"""

import os
import cv2
import numpy as np
from PIL import Image
import io

def remove_background(input_path, output_path):
    """
    使用 GrabCut 算法去除图片背景
    将背景变为透明
    """
    try:
        # 使用 Pillow 读取图片（支持中文路径）
        pil_img = Image.open(input_path)
        
        # 转换为 RGBA（如果有Alpha通道就保留，没有就添加）
        if pil_img.mode != 'RGBA':
            pil_img = pil_img.convert('RGBA')
        
        # 转换为 numpy 数组 (RGBA)
        img_rgba = np.array(pil_img)
        
        # 转换为 BGR（OpenCV格式）用于 GrabCut
        img_rgb = cv2.cvtColor(img_rgba[:, :, :3], cv2.COLOR_RGB2BGR)
        
        height, width = img_rgb.shape[:2]
        
        # 创建掩码
        mask = np.zeros(img_rgb.shape[:2], np.uint8)
        
        # 创建临时数组
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)
        
        # 定义矩形区域（排除边缘）
        margin = int(min(width, height) * 0.05)
        rect = (margin, margin, width - 2*margin, height - 2*margin)
        
        # 使用 GrabCut 算法
        cv2.grabCut(img_rgb, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
        
        # 创建掩码：可能的背景和确定的背景设为0，其他设为1
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
        
        # 应用掩码到Alpha通道
        img_rgba[:, :, 3] = mask2 * 255
        
        # 将 RGBA 转换回 Pillow Image
        result_img = Image.fromarray(img_rgba)
        
        # 保存图片
        result_img.save(output_path, 'PNG')
        print(f"[OK] 处理完成: {os.path.basename(input_path)}")
        return True
        
    except Exception as e:
        print(f"[FAIL] 处理失败 {os.path.basename(input_path)}: {str(e)}")
        return False

def process_directory(input_dir, output_dir):
    """
    批量处理目录中的所有 PNG 图片
    """
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取所有 PNG 文件
    png_files = [f for f in os.listdir(input_dir) if f.lower().endswith('.png')]
    
    if not png_files:
        print(f"在 {input_dir} 中没有找到 PNG 文件")
        return
    
    print(f"找到 {len(png_files)} 个 PNG 文件，开始处理...")
    print("-" * 50)
    
    success_count = 0
    for filename in png_files:
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        
        if remove_background(input_path, output_path):
            success_count += 1
    
    print("-" * 50)
    print(f"处理完成！成功: {success_count}/{len(png_files)}")

if __name__ == "__main__":
    # 输入和输出目录
    input_dir = r"e:\Project\Psychology Healing\Psychology-Healing\public\images\companions"
    output_dir = r"e:\Project\Psychology Healing\Psychology-Healing\public\images\companions\no-bg"
    
    print("=" * 50)
    print("PNG 图片背景消除工具")
    print("=" * 50)
    
    process_directory(input_dir, output_dir)
    
    print("\n处理完成！透明背景的图片已保存到:")
    print(output_dir)
