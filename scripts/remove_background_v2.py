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


def detect_and_remove_grid(img_rgb):
    """
    检测并去除网格状背景（保守版本）
    
    参数:
        img_rgb: 彩色图像 (H, W, 3)
    返回:
        tuple: (修复后的彩色图像, 是否检测到网格, 灰度图)
    """
    height, width = img_rgb.shape[:2]
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    
    # 使用顶帽变换检测细亮线条（网格线）
    all_grid_lines = np.zeros_like(gray, dtype=np.float32)
    
    for kernel_size in [20, 30]:
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, 1))
        horizontal_lines = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, horizontal_kernel).astype(np.float32)
        
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, kernel_size))
        vertical_lines = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, vertical_kernel).astype(np.float32)
        
        all_grid_lines = cv2.addWeighted(all_grid_lines, 1.0, horizontal_lines, 0.5, 0.0, dtype=cv2.CV_32F)
        all_grid_lines = cv2.addWeighted(all_grid_lines, 1.0, vertical_lines, 0.5, 0.0, dtype=cv2.CV_32F)
    
    # 检测棋盘格模式
    diff_h = np.abs(gray[:, :-1].astype(np.int16) - gray[:, 1:].astype(np.int16))
    diff_v = np.abs(gray[:-1, :].astype(np.int16) - gray[1:, :].astype(np.int16))
    
    has_checkerboard = False
    if height > 10 and width > 10:
        sample_h = diff_h[::8, ::8]
        sample_v = diff_v[::8, ::8]
        
        if np.sum((sample_h > 20) & (sample_h < 80)) > sample_h.size * 0.4:
            has_checkerboard = True
        if np.sum((sample_v > 20) & (sample_v < 80)) > sample_v.size * 0.4:
            has_checkerboard = True
    
    # 频域分析检测周期性模式
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    magnitude = 20 * np.log(np.abs(fshift) + 1e-6)
    
    center_y, center_x = height // 2, width // 2
    roi_size = min(40, height // 5, width // 5)
    
    has_grid_pattern = False
    if roi_size > 10:
        roi = magnitude[center_y - roi_size:center_y + roi_size, 
                        center_x - roi_size:center_x + roi_size]
        # 降低阈值以检测微弱的网格模式
        if np.max(roi) - np.min(roi) > 25:
            has_grid_pattern = True
    
    # 二值化获取网格掩码（降低阈值）
    _, grid_mask = cv2.threshold(all_grid_lines.astype(np.uint8), 8, 255, cv2.THRESH_BINARY)
    
    grid_pixel_count = np.sum(grid_mask)
    total_pixels = height * width
    grid_ratio = grid_pixel_count / total_pixels
    
    # 判断是否需要处理网格（更宽松的条件）
    grid_detected = False
    if has_checkerboard:
        grid_detected = True
    elif has_grid_pattern and grid_ratio < 0.15:
        grid_detected = True
    elif grid_pixel_count > 500 and grid_ratio < 0.08:
        grid_detected = True
    
    if grid_detected:
        repaired = img_rgb.copy()
        small_median = cv2.medianBlur(img_rgb, 3)
        
        mask_indices = grid_mask > 0
        if np.any(mask_indices):
            repaired[mask_indices] = small_median[mask_indices]
        
        return repaired, True, gray
    else:
        return img_rgb, False, gray


def remove_background_v2(input_path, output_path):
    """
    改进版背景去除（增强头部保护）：
    1. 检测并去除网格状背景
    2. 边缘保留滤波保持细节
    3. 色彩分析识别背景色（考虑多个背景色）
    4. 结合边缘信息保护主体，特别保护头部区域
    5. 连通分量分析确保主体完整性
    6. 形态学操作优化边缘
    """
    try:
        pil_img = Image.open(input_path)
        if pil_img.mode != 'RGBA':
            pil_img = pil_img.convert('RGBA')
        
        img_rgba = np.array(pil_img)
        img_rgb = img_rgba[:, :, :3].copy()
        height, width = img_rgb.shape[:2]
        
        # 检测并去除网格状背景
        img_rgb, grid_detected, gray = detect_and_remove_grid(img_rgb)
        if grid_detected:
            print(f"  [INFO] 检测到网格背景并已处理")
        
        # 边缘保留滤波（使用更大参数保持细节）
        smoothed = cv2.bilateralFilter(gray, 11, 80, 80)
        
        # 边缘检测（使用较低阈值，检测更多边缘）
        edges = cv2.Canny(smoothed, 15, 70)
        edges = cv2.dilate(edges, None, iterations=4)
        
        # 使用K-means聚类找到主色调（增加簇数量）
        pixels = img_rgb.reshape(-1, 3).astype(np.float32)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        flags = cv2.KMEANS_RANDOM_CENTERS
        compactness, labels, centers = cv2.kmeans(pixels, 6, None, criteria, 10, flags)
        
        # 找到背景色（考虑多个可能的背景色）
        # 创建边缘区域掩码
        edge_mask = cv2.dilate(edges, np.ones((15, 15), np.uint8), iterations=2)
        
        # 计算每个簇在中心区域的像素数（更准确的背景检测）
        center_region = np.ones((height, width), dtype=bool)
        border = int(min(height, width) * 0.15)
        center_region[:border, :] = False
        center_region[-border:, :] = False
        center_region[:, :border] = False
        center_region[:, -border:] = False
        
        valid_labels = []
        for i in range(len(centers)):
            cluster_mask = (labels == i).reshape(height, width)
            # 计算在中心区域的像素数
            center_count = np.sum(cluster_mask & center_region)
            valid_labels.append((center_count, i))
        
        # 排序并取前两个可能的背景色
        valid_labels.sort(reverse=True)
        
        # 计算到多个背景色的最小距离
        distances = None
        for _, idx in valid_labels[:2]:  # 考虑前2个最大的簇作为潜在背景
            bg_color = centers[idx]
            bg_color_arr = np.array(bg_color, dtype=np.float32)
            diff = img_rgb.astype(np.float32) - bg_color_arr
            dist = np.sqrt(np.sum(diff ** 2, axis=2))
            if distances is None:
                distances = dist
            else:
                distances = np.minimum(distances, dist)
        
        if distances is None:
            distances = np.zeros((height, width))
        
        max_dist = np.max(distances) + 1e-6
        norm_dist = distances / max_dist
        
        # 创建掩码（使用更保守的阈值）
        threshold = 0.10  # 更保守的阈值，避免误删浅色头部
        edges_norm = edges.astype(np.float32) / 255.0
        edges_expanded = cv2.dilate(edges_norm, None, iterations=5)
        
        # 基于距离的掩码
        mask = (norm_dist > threshold).astype(np.uint8) * 255
        
        # 加强边缘保护（更高权重）
        mask = np.maximum(mask, (edges_expanded * 220).astype(np.uint8))
        
        # 形态学操作优化（更保守）
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        kernel_medium = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        # 先膨胀再腐蚀，保护小区域
        mask = cv2.dilate(mask, kernel_small, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_small, iterations=2)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_small, iterations=1)
        
        # 高斯模糊边缘过渡
        mask = cv2.GaussianBlur(mask.astype(np.float32), (5, 5), 1.5)
        mask = (mask > 100).astype(np.uint8) * 255  # 更低的阈值
        
        # 确保边缘区域被保留
        edges_dilated = cv2.dilate(edges, kernel_medium, iterations=8)
        mask = cv2.bitwise_or(mask, edges_dilated)
        
        # 连通分量分析，保护主体完整性
        num_labels, labels_img, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
        
        if num_labels > 1:
            # 找到最大的连通分量（主体）
            max_area = 0
            max_label = 0
            for i in range(1, num_labels):
                if stats[i, cv2.CC_STAT_AREA] > max_area:
                    max_area = stats[i, cv2.CC_STAT_AREA]
                    max_label = i
            
            # 创建主体掩码
            main_mask = (labels_img == max_label).astype(np.uint8) * 255
            
            # 检查是否有其他重要的连通分量需要保留（可能是头部或耳朵）
            min_area_threshold = max_area * 0.03  # 至少是主体的3%
            
            for i in range(1, num_labels):
                if i != max_label and stats[i, cv2.CC_STAT_AREA] > min_area_threshold:
                    # 检查这个分量是否靠近主体
                    centroid_x, centroid_y = centroids[i]
                    
                    # 检查是否与主体有重叠或靠近
                    check_radius = min(height, width) * 0.2
                    y_min = max(0, int(centroid_y - check_radius))
                    y_max = min(height, int(centroid_y + check_radius))
                    x_min = max(0, int(centroid_x - check_radius))
                    x_max = min(width, int(centroid_x + check_radius))
                    
                    # 检查在这个区域内是否有主体
                    if np.any(main_mask[y_min:y_max, x_min:x_max] > 0):
                        main_mask = cv2.bitwise_or(main_mask, (labels_img == i).astype(np.uint8) * 255)
            
            mask = main_mask
        
        # 再次形态学操作确保平滑
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_small, iterations=1)
        
        # 将修复后的RGB数据应用到结果图像
        img_rgba[:, :, :3] = img_rgb
        
        # 应用掩码到Alpha通道
        img_rgba[:, :, 3] = mask
        
        result_img = Image.fromarray(img_rgba)
        result_img.save(output_path, 'PNG')
        
        print(f"[OK] 处理完成: {os.path.basename(input_path)}")
        return True
        
    except Exception as e:
        print(f"[FAIL] 处理失败 {os.path.basename(input_path)}: {str(e)}")
        return False


def remove_background_v3(input_path, output_path):
    """
    V3版本：使用漫水填充法
    更保守的边缘处理，确保主体完整
    """
    try:
        pil_img = Image.open(input_path)
        if pil_img.mode != 'RGBA':
            pil_img = pil_img.convert('RGBA')
        
        img_rgba = np.array(pil_img)
        img_rgb = img_rgba[:, :, :3].copy()
        height, width = img_rgb.shape[:2]
        
        # 转换为灰度图
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        
        # 使用原始灰度图进行漫水填充（不使用边缘保留滤波）
        gray_for_flood = gray.copy()
        
        # 漫水填充从四角标记背景
        mask = np.zeros((height + 2, width + 2), dtype=np.uint8)
        
        # 背景颜色阈值（使用较小的值以避免过度填充）
        lo_diff = 15
        up_diff = 15
        
        # 获取角落的颜色作为参考
        corner_colors = [
            gray[0, 0],
            gray[0, width - 1],
            gray[height - 1, 0],
            gray[height - 1, width - 1]
        ]
        avg_corner = int(np.mean(corner_colors))
        
        # 从四角漫水填充
        cv2.floodFill(gray_for_flood, mask, (0, 0), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray_for_flood, mask, (width - 1, 0), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray_for_flood, mask, (0, height - 1), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray_for_flood, mask, (width - 1, height - 1), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        
        # 从边缘中间点填充
        cv2.floodFill(gray_for_flood, mask, (width // 2, 0), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray_for_flood, mask, (width // 2, height - 1), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray_for_flood, mask, (0, height // 2), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        cv2.floodFill(gray_for_flood, mask, (width - 1, height // 2), 0, lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY)
        
        # 获取填充的掩码
        bg_mask = mask[1:-1, 1:-1].copy()
        
        # 计算背景像素比例
        bg_ratio = np.sum(bg_mask) / (height * width)
        
        # 如果背景比例过高，说明阈值太宽松，需要调整
        if bg_ratio > 0.95:
            # 使用更严格的阈值重新填充
            mask = np.zeros((height + 2, width + 2), dtype=np.uint8)
            lo_diff_strict = 8
            up_diff_strict = 8
            
            cv2.floodFill(gray.copy(), mask, (0, 0), 0, lo_diff_strict, up_diff_strict, cv2.FLOODFILL_MASK_ONLY)
            cv2.floodFill(gray.copy(), mask, (width - 1, 0), 0, lo_diff_strict, up_diff_strict, cv2.FLOODFILL_MASK_ONLY)
            cv2.floodFill(gray.copy(), mask, (0, height - 1), 0, lo_diff_strict, up_diff_strict, cv2.FLOODFILL_MASK_ONLY)
            cv2.floodFill(gray.copy(), mask, (width - 1, height - 1), 0, lo_diff_strict, up_diff_strict, cv2.FLOODFILL_MASK_ONLY)
            
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
    
    # 使用 V2 算法（颜色聚类法，更适合处理浅色背景）
    process_directory(input_dir, output_dir, version=2)
    
    print("\n处理完成！透明背景的图片已保存到:")
    print(output_dir)
