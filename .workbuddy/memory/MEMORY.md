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
