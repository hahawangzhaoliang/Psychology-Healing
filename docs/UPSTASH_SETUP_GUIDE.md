# Upstash 数据库配置指南

## 为什么需要 Upstash？

心晴空间使用 Upstash Search 作为知识库存储，支持：
- 向量搜索和语义查询
- 高效的知识检索
- 云端数据同步
- 免费额度足够开发使用

## 配置步骤

### 1. 注册 Upstash 账号

访问 https://console.upstash.com/ 注册账号（支持 GitHub、Google 登录）

### 2. 创建 Search 实例

1. 登录后点击 "Create Database"
2. 选择 "Search" 类型
3. 填写信息：
   - Name: `psychology-healing`（或任意名称）
   - Region: 选择离您最近的区域（如 Singapore）
4. 点击 "Create"

### 3. 获取连接信息

创建完成后，在实例详情页面找到：
- **REST URL**: 类似 `https://abc123.us1.upstash.io`
- **REST Token**: 一串随机字符

### 4. 配置环境变量

编辑项目根目录的 `.env` 文件：

```bash
# Upstash Search 数据库配置
UPSTASH_SEARCH_REST_URL=https://your-instance.upstash.io
UPSTASH_SEARCH_REST_TOKEN=your-token-here
```

**重要**：
- 将 `your-instance.upstash.io` 替换为您的实际 URL
- 将 `your-token-here` 替换为您的实际 Token
- 不要将 `.env` 文件提交到 Git（已在 .gitignore 中）

### 5. 测试连接

运行测试脚本验证配置：

```bash
node scripts/test-knowledge-sync.js
```

如果配置正确，将看到：
```
✓ 环境变量已配置
✓ 数据库连接成功
✓ 爬取完成
✓ 数据填充完成
✅ 测试完成！知识库同步成功
```

## 免费额度说明

Upstash 免费套餐包括：
- **Search**: 10,000 条记录
- **带宽**: 10GB/月
- **请求次数**: 10,000 次/天

对于心晴空间的知识库（约 20-50 条记录），免费额度完全足够。

## 常见问题

### Q: 提示 "未配置 UPSTASH_SEARCH_REST_URL"

**A**: 检查 `.env` 文件是否存在，并确保已填写正确的 URL 和 Token

### Q: 数据库连接失败

**A**: 可能原因：
1. URL 或 Token 错误
2. 网络问题（尝试使用 VPN）
3. Upstash 服务暂时不可用

### Q: 数据填充失败

**A**: 检查：
1. 环境变量是否正确
2. 网络连接是否正常
3. Upstash 实例是否正常运行

### Q: 如何查看已存储的数据？

**A**: 
1. 登录 Upstash Console
2. 选择您的 Search 实例
3. 点击 "Data Browser" 查看数据

## 替代方案：本地存储

如果暂时无法使用 Upstash，可以使用本地 JSON 文件存储：

1. 创建 `data/` 目录
2. 修改 `server/config/database.js` 使用本地存储
3. 参考 `server/config/upstash.js` 的接口实现

## 获取帮助

- Upstash 官方文档: https://docs.upstash.com/
- 项目 Issues: https://github.com/your-repo/issues
- Upstash Discord: https://discord.gg/upstash

## 更新日期

2026-05-07
