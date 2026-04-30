# Vercel 部署验证指南

## 一、部署前准备

### 1. 确认环境变量

在 Vercel 项目设置中添加以下环境变量：

```
UPSTASH_SEARCH_REST_URL=https://hot-goose-65850-eu1-search.upstash.io
UPSTASH_SEARCH_REST_TOKEN=ABMFMGhvdC1nb29zZS02...
KNOWLEDGE_UPDATE_SECRET=xinqing-space-2026-secret
```

### 2. 确认 vercel.json 配置

```json
{
  "crons": [
    {
      "path": "/api/knowledge/cron-update?secret=xinqing-space-2026-secret",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## 二、部署后验证步骤

### 步骤 1：检查 Cron 任务

访问 Vercel Dashboard：
```
https://vercel.com/[你的用户名]/xinqing-space/settings/cron
```

确认：
- Cron 任务已创建
- 路径为 `/api/knowledge/cron-update?secret=...`
- 时间表为 `0 0 * * *`（每日 UTC 00:00）

### 步骤 2：手动触发测试

**使用 curl：**
```bash
# 替换 YOUR_DOMAIN 为你的 Vercel 域名
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge/cron-update?secret=xinqing-space-2026-secret"
```

**使用浏览器：**
直接访问：
```
https://YOUR_DOMAIN.vercel.app/api/knowledge/cron-update?secret=xinqing-space-2026-secret
```

### 步骤 3：验证更新结果

**检查健康状态：**
```bash
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge/health"
```

预期响应：
```json
{
  "status": "healthy",
  "timestamp": "2026-04-28T14:00:00.000Z",
  "counts": {
    "exercises": 13,
    "knowledge": 7,
    "tips": 30
  }
}
```

**检查知识库统计：**
```bash
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge"
```

### 步骤 4：查看执行日志

访问 Vercel 日志：
```
https://vercel.com/[你的用户名]/xinqing-space/logs
```

搜索关键词：
- `cron-update`
- `知识库更新`
- `Cron`

## 三、常见问题排查

### 问题 1：返回 401 未授权

**原因：** 密钥不匹配

**解决：**
1. 检查 Vercel 环境变量 `KNOWLEDGE_UPDATE_SECRET`
2. 确认请求 URL 中的 `secret` 参数与环境变量一致

### 问题 2：返回 500 错误

**原因：** Upstash 连接失败

**解决：**
1. 检查 `UPSTASH_SEARCH_REST_URL` 和 `UPSTASH_SEARCH_REST_TOKEN`
2. 确认 Upstash 服务正常运行

### 问题 3：Cron 任务未执行

**原因：** Vercel Cron 需要部署到生产环境

**解决：**
1. 确保部署到 `main` 分支或生产环境
2. Vercel 免费版 Cron 有执行限制，检查是否超出

## 四、验证命令汇总

```bash
# 1. 手动触发更新
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge/cron-update?secret=xinqing-space-2026-secret"

# 2. 检查健康状态
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge/health"

# 3. 获取知识库统计
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge"

# 4. 获取数据源列表
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge/sources"

# 5. 获取疗愈练习
curl "https://YOUR_DOMAIN.vercel.app/api/knowledge/exercises?limit=5"
```

## 五、预期数据量

更新成功后，知识库应包含：

| 类型 | 数量 |
|------|------|
| 疗愈练习 | 13+ 条 |
| 心理知识 | 7+ 条 |
| 情绪调节方案 | 6 条 |
| 每日提示 | 持续增长 |
