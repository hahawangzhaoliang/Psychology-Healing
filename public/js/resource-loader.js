/**
 * ResourceLoader - 统一资源加载管理
 * 管理图片、音频、文本等资源的加载
 */
class ResourceLoader {
    constructor() {
        this.cache = new Map();
        this.basePath = '';
        this.manifest = null;
    }

    /**
     * 初始化，加载资源清单
     */
    async init() {
        try {
            const res = await fetch('assets/manifest.json');
            this.manifest = await res.json();
            return this.manifest;
        } catch (e) {
            console.warn('[ResourceLoader] 加载 manifest 失败:', e);
            return null;
        }
    }

    /**
     * 加载 JSON 数据文件
     * @param {string} path - 相对于 public/data/ 的路径
     */
    async loadJSON(path) {
        const fullPath = `data/${path}`;
        if (this.cache.has(fullPath)) {
            return this.cache.get(fullPath);
        }
        try {
            const res = await fetch(fullPath);
            const data = await res.json();
            this.cache.set(fullPath, data);
            return data;
        } catch (e) {
            console.error(`[ResourceLoader] 加载 ${path} 失败:`, e);
            return null;
        }
    }

    /**
     * 加载图片资源
     * @param {string} category - 图片分类 (companions/scenes/icons/illustrations)
     * @param {string} filename - 文件名
     */
    getImagePath(category, filename) {
        return `assets/images/${category}/${filename}`;
    }

    /**
     * 获取宠物头像 URL
     * @param {string} name - 宠物名称
     */
    getCompanionImage(name) {
        return `images/companions/${name}.png`;
    }

    /**
     * 批量预加载图片
     * @param {string[]} urls - 图片 URL 数组
     */
    async preloadImages(urls) {
        const promises = urls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(url);
                img.onerror = () => reject(url);
                img.src = url;
            });
        });
        return Promise.allSettled(promises);
    }

    /**
     * 获取资源清单中的数据
     */
    getManifest() {
        return this.manifest;
    }

    /**
     * 按分类获取图片列表
     */
    getImagesByCategory(category) {
        if (!this.manifest?.images?.[category]) return [];
        return this.manifest.images[category];
    }

    /**
     * 按分类获取音频列表
     */
    getAudioByCategory(category) {
        if (!this.manifest?.audio?.[category]) return [];
        return this.manifest.audio[category];
    }
}

// 创建全局实例
const resourceLoader = new ResourceLoader();
