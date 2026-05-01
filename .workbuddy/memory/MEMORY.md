# 长期记忆

## 项目信息
- 项目: 心晴空间 (Psychology Healing)
- 路径: E:/Project/Psychology Healing/
- 技术栈: Node.js + Express + 原生 HTTP 请求 + Upstash Search

## 爬虫模块 (server/services/crawler/)
- `FingerprintGenerator.js` - SHA-256指纹生成器
- `CrawlHistoryManager.js` - 爬取历史管理
- `DataSources.js` - 40+扩展数据源
- `index.js` - 增强版爬虫入口

## 使用方式
```javascript
const { quickCrawl } = require('./server/services/crawler/index');

// 全量爬取（禁用增量模式）
quickCrawl({ highCredibilityOnly: true, maxItems: 30, incrementalMode: false });

// 增量爬取（默认）
quickCrawl({ highCredibilityOnly: true, maxItems: 30 });
```

## 关键文件
- `server/services/knowledgeService.js` - KnowledgeManager 支持指纹去重
- `server/services/crawler.js` - 向后兼容入口
- `scripts/update-knowledge.js` - 定时更新脚本

## Bug 修复记录
### 2026-05-01: 爬虫模块循环依赖警告
**问题**：`server/services/crawler.js` 第8行 `require('./crawler')` 会自我引用，因为 Node.js 优先解析同名 `.js` 文件而非目录。

**修复**：
1. `crawler.js` 第8行：`require('./crawler')` → `require('./crawler/index')`
2. `crawler.js` 第32行：`this.enhanced.crawl()` → `this.enhanced.crawlAll()`（方法名修正）

**验证**：所有导出（PsychologyCrawler, EnhancedPsychologyCrawler, fetch, HTMLParser, CRAWLER_CONFIG, quickCrawl, getDataSourceInfo）均为 function/object，不再是 undefined。

### 2026-05-01: FingerprintGenerator 未导出
**问题**：`knowledgeService.js` 导入 `FingerprintGenerator` 时为 undefined，因为 `crawler.js` 的解构和导出中没有包含该属性。

**修复**：`crawler.js` 中添加 `FingerprintGenerator` 到解构和导出列表。
