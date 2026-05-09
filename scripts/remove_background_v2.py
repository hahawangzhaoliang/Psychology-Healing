#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量去除图片背景工具 V2
改进版：使用色彩分析和边缘保留滤波
更精确地识别和保留前景主体
"""

import os
import cv2
import numpy as np
from PIL import Image

def remove_background_v2(input_path, output_path):
    """
    改进版背景去除：
    1. 边缘保留滤波保持细节
    2. 色彩分析识别背景色
    3. 漫水填充确定背景区域
    4. 形态学操作优化边缘
    """
    try:
        # 使用 Pillow 读取图片（支持中文路径）
        pil_img = Image.open(input_path)
        if pil_img.mode != 'RGBA':
            pil_img = pil_img.convert('RGBA')
        
        img_rgba = np.array(pil_img)
        img_rgb = img_rgba[:, :, :3].copy()
        height, width = img_rgb.shape[:2]
        
        # 转换为灰度图
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        
        # 1. 边缘保留滤波 - 保利斯滤波保持边缘同时平滑背景
        # 使用 bilateral filter 参数: 直径, 色彩sigma, 空间sigma
        smoothed = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # 2. 边缘检测
        edges = cv2.Canny(smoothed, 30, 90)
        edges = cv2.dilate(edges, None, iterations=2)
        
        # 3. 找到图像中占比最多的颜色（很可能是背景色）
        # 使用K-means聚类找到主色调
        pixels = img_rgb.reshape(-1, 3).astype(np.float32)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        flags = cv2.KMEANS_RANDOM_CENTERS
        compactness, labels, centers = cv2.kmeans(pixels, 5, None, criteria, 10, flags)
        
        # 计算每个簇的像素数量
        _, counts = np.unique(labels, return_counts=True)
        
        # 找出最大簇（背景色）
        bg_cluster = np.argmax(counts)
        bg_color = centers[bg_cluster]
        
        # 4. 计算每个像素到背景色的距离
        bg_color_arr = np.array(bg_color, dtype=np.float32)
        diff = img_rgb.astype(np.float32) - bg_color_arr
        distances = np.sqrt(np.sum(diff ** 2, axis=2))
        
        # 归一化距离
        max_dist = np.max(distances) + 1e-6
        norm_dist = distances / max_dist
        
        # 5. 创建掩码 - 低于阈值的为背景
        # 使用自适应阈值
        threshold = 0.15  # 稍微降低阈值，保留更多前景
        
        # 结合边缘信息
        edges_norm = edges.astype(np.float32) / 255.0
        edges_expanded = cv2.dilate(edges_norm, None, iterations=3)
        
        # 计算初始掩码
        mask = (norm_dist > threshold).astype(np.uint8) * 255
        
        # 边缘区域增强（确保边缘不被误删）
        mask = np.maximum(mask, (edges_expanded * 100).astype(np.uint8))
        
        # 6. 形态学操作优化
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        # 先闭运算填补小空洞
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # 再开运算去除小噪点
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # 7. 高斯模糊边缘过渡
        mask = cv2.GaussianBlur(mask.astype(np.float32), (7, 7), 2)
        mask = (mask > 127).astype(np.uint8) * 255
        
        # 8. 确保边缘区域被保留
        # 边缘检测到的区域必须保留
        edges_dilated = cv2.dilate(edges, kernel, iterations=5)
        mask = cv2.bitwise_or(mask, edges_dilated)
        
        # 9. 填充掩码中的小空洞
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            mask_filled = np.zeros(mask.shape, dtype=np.uint8)
            cv2.drawContours(mask_filled, [largest_contour], -1, 255, -1)
            mask = mask_filled
        
        # 10. 应用掩码到Alpha通道
        img_rgba[:, :, 3] = mask
        
        # 保存结果
        result_img = Image.fromarray(img_rgba)
        result_img.save(output_path, 'PNG')
        
        print(f"[OK] 处理完成: {os.path.basename(input_path)}")
        return True
        
    except Exception as e:
        print(f"[FAIL] 处理失败 {os.path.basename(input_path)}: {str(e)}")
        return False


def remove_background_v3(input_path, output_path):
    """
    V3版本：使用漫水填充法 + GrabCut 结合
    更保守的边缘处理，确保主体完整
    """
    try:
        pil_img = Image.open(input_path)
        if pil_img.mode != 'RGBA':
            pil_img = pil_img.convert('RGBA')
        
        img_rgba = np.array(pil_img)
        img_rgb = img_rgba[:, :, :3].copy()
        height, width = img_rgb.shape[:2]
        
        # 边缘保留滤波
        blurred = cv2.bilateralFilter(img_rgb, 15, 100, 100)
        
        # 转换为灰度
        gray = cv2.cvtColor(blurred, cv2.COLOR_RGB2GRAY)
        
        # 漫水填充从四角标记背景
        mask = np.zeros((height + 2, width + 2), dtype=np.uint8)
        
        # 背景颜色阈值
        lo_diff = 30
        up_diff = 30
        
        # 从四角漫水填充
        cv2.floodFill(gray, mask, (0, 0), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray, mask, (width - 1, 0), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray, mask, (0, height - 1), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray, mask, (width - 1, height - 1), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        
        # 从边缘中间点填充
        cv2.floodFill(gray, mask, (width // 2, 0), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray, mask, (width // 2, height - 1), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray, mask, (0, height // 2), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray, mask, (width - 1, height // 2), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        
        # 获取填充的掩码
        bg_mask = mask[1:-1, 1:-1].copy()
        
        # 反转：非背景为前景
        fg_mask = cv2.bitwise_not(bg_mask)
        
        # 形态学优化
        kernel = np.ones((5, 5), np.uint8)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=3)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # 边缘膨胀，确保完整主体
        fg_mask = cv2.dilate(fg_mask, kernel, iterations=2)
        
        # 应用掩码
        img_rgba[:, :, 3] = fg_mask
        
        result_img = Image.fromarray(img_rgba)
        result_img.save(output_path, 'PNG')
        
        print(f"[OK] 处理完成: {os.path.basename(input_path)}")
        return True
        
    except Exception as e:
        print(f"[FAIL] 处理失败 {os.path.basename(input_path)}: {str(e)}")
        return False


def process_directory(input_dir, output_dir, version=3):
    """批量处理目录中的所有 PNG 图片"""
    os.makedirs(output_dir, exist_ok=True)
    
    png_files = [f for f in os.listdir(input_dir) if f.lower().endswith('.png')]
    
    if not png_files:
        print(f"在 {input_dir} 中没有找到 PNG 文件")
        return
    
    print(f"找到 {len(png_files)} 个 PNG 文件，使用 V{version} 算法处理...")
    print("-" * 50)
    
    func = remove_background_v3 if version == 3 else remove_background_v2
    success_count = 0
    
    for filename in png_files:
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        
        if func(input_path, output_path):
            success_count += 1
    
    print("-" * 50)
    print(f"处理完成！成功: {success_count}/{len(png_files)}")


if __name__ == "__main__":
    input_dir = r"e:\Project\Psychology Healing\Psychology-Healing\public\images\companions"
    output_dir = r"e:\Project\Psychology Healing\Psychology-Healing\public\images\companions\no-bg-v2"
    
    print("=" * 50)
    print("PNG 图片背景消除工具 V2/V3")
    print("=" * 50)
    
    # 使用 V3 算法（漫水填充法，更保守）
    process_directory(input_dir, output_dir, version=3)
    
    print("\n处理完成！透明背景的图片已保存到:")
    print(output_dir)
