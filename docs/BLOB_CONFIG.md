# Vercel Blob 存储配置指南

心晴空间 v2.0 已将数据存储从 Upstash Search 迁移到 **Vercel Blob**，实现真正的 Serverless 持久化存储。

## 📋 迁移概览

| 项目 | 旧方案 | 新方案 |
|------|--------|--------|
| 数据存储 | Upstash Search | Vercel Blob |
| 请求配额 | 每月 500 次 | 免费 1000 次/月 |
| 数据持久化 | 需 Git 提交 | 自动持久化 |
| 媒体文件 | 不支持 | 原生支持 |

## 🔧 配置步骤

### 1. 创建 Vercel Blob Store

```bash
# 使用 Vercel CLI 创建 Blob Store
vercel blob attach --yes
```

或者在 Vercel Dashboard 中：
1. 进入项目 → Storage → Create Database
2. 选择 "Blob" → 填写名称（如 `xinqing-space-storage`）
3. 选择区域（推荐 `iad1` 亚太用户）
4. 点击 Create

### 2. 配置环境变量

在 Vercel Dashboard → Settings → Environment Variables 中添加：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `BLOB_READ_WRITE_TOKEN` | Blob 读写令牌（必填） | `vercel_blob_rw_xxx...` |
| `ADMIN_TOKEN` | 管理后台令牌（已有则跳过） | `your-admin-token` |

获取 `BLOB_READ_WRITE_TOKEN`：
1. 进入 Storage → 你的 Blob Store
2. 点击 "API" 标签页
3. 复制 "ReadWrite Token"

### 3. 本地开发配置

创建 `.env.local` 文件（不要提交到 Git）：

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...
ADMIN_TOKEN=your-admin-token
```

## 📁 存储结构

```
xinqing-space-storage/
├── data/
│   ├── exercises.json    # 疗愈练习数据
│   ├── knowledge.json    # 心理学知识数据
│   ├── regulation.json   # 情绪调节数据
│   ├── tips.json         # 每日提示数据
│   └── graph.json        # 知识图谱数据
└── media/
    ├── images/           # 用户上传的图片
    └── audio/            # 用户上传的音频
```

## 🚀 部署检查清单

部署前确认：

- [ ] 已创建 Vercel Blob Store
- [ ] 已添加 `BLOB_READ_WRITE_TOKEN` 环境变量
- [ ] Blob Store 的 ReadWrite Token 与环境变量一致
- [ ] 管理后台能正常访问并查看 Blob 状态

## 🧪 验证部署

### 1. 健康检查

访问 `https://your-domain.vercel.app/health`，应返回：

```json
{
  "status": "ok",
  "storage": "blob",
  "storageStatus": {
    "ok": true
  }
}
```

### 2. 管理后台验证

1. 访问 `/admin` 并登录
2. 查看左下角 "存储状态" 应显示 "✅ 连接正常"
3. 进入"媒体管理"标签页，应能正常上传和列出文件
4. 在"数据管理"中编辑数据，刷新后数据应保留

### 3. 本地开发验证

```bash
npm run dev
# 访问 http://localhost:3000/admin
# 检查 Blob 连接状态
```

## 💡 常见问题

### Q: 提示 "BLOB_READ_WRITE_TOKEN" 未配置？

**原因**：本地开发未配置 `.env.local` 或 Vercel 环境变量缺失。

**解决**：
1. 检查 `.env.local` 文件是否存在且格式正确
2. 检查 Vercel Dashboard 中的环境变量是否已保存
3. 重新部署以确保环境变量生效

### Q: 提示 "Blob 连接异常"？

**排查步骤**：
1. 检查 Token 是否正确（不要有空格或换行）
2. 确认 Blob Store 是否存在且状态正常
3. 检查 Token 是否与 Blob Store 匹配（不同 Store 有不同的 Token）

### Q: 本地开发能正常工作但生产环境失败？

**原因**：生产环境的环境变量未配置。

**解决**：在 Vercel Dashboard → Settings → Environment Variables 中添加所有必需的环境变量。

### Q: Blob 免费额度用完了怎么办？

**方案**：
1. 升级到付费套餐（$20/月起）
2. 清理不需要的媒体文件
3. 将不常用的历史数据导出后删除

## 🔄 从旧版本迁移

如果你是从 Upstash Search 版本升级：

1. **导出旧数据**（可选）：
   ```bash
   npm run migrate    # 旧脚本，保留以备不时之需
   ```

2. **部署新版本**：
   ```bash
   git push           # 触发 Vercel 重新部署
   ```

3. **验证数据**：
   - 管理后台应能正常显示所有集合数据
   - 媒体管理功能可用

## 📊 成本说明

| 用量 | 免费额度 | 超出费用 |
|------|----------|----------|
| 存储空间 | 1 GB | $0.02/GB/月 |
| 带宽 | 1 GB/月 | $0.40/GB |
| 操作次数 | 1000 次/月 | $0.40/1000 次 |

对于心晴空间的数据量（JSON < 1MB，媒体文件按需），免费额度通常足够。

---

如有问题，请检查 Vercel Blob 官方文档：https://vercel.com/docs/storage/vercel-blob
