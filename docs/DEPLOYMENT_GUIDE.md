# 部署指南

## 🚀 快速部署

### 前置要求

- Node.js 16+
- npm 或 yarn
- Git（可选）

### 本地运行

```bash
# 1. 进入项目目录
cd "Psychology-Healing"

# 2. 安装依赖
npm install

# 3. 启动服务器
npm start

# 4. 访问应用
# 打开浏览器访问 http://localhost:3000
```

---

## 📦 生产部署

### 方案1：Vercel（推荐）

**优势**：
- 免费额度充足
- 自动HTTPS
- 全球CDN
- 零配置部署

**步骤**：
1. 访问 https://vercel.com
2. 连接GitHub仓库
3. 选择项目仓库
4. 点击Deploy
5. 等待部署完成

**配置文件**（`vercel.json`）：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server/index.js"
    }
  ]
}
```

### 方案2：Netlify

**优势**：
- 免费额度充足
- 自动HTTPS
- 简单易用

**步骤**：
1. 访问 https://netlify.com
2. 拖拽 `public` 文件夹到部署区域
3. 配置重定向规则
4. 完成部署

### 方案3：传统服务器

**要求**：
- Ubuntu 20.04+
- Nginx
- PM2

**步骤**：
```bash
# 1. 安装PM2
npm install -g pm2

# 2. 启动应用
pm2 start server/index.js --name "psychology-healing"

# 3. 配置Nginx反向代理
sudo nano /etc/nginx/sites-available/psychology-healing

# 4. 添加配置
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 5. 启用配置
sudo ln -s /etc/nginx/sites-available/psychology-healing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔧 环境变量配置

创建 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库（如果使用Upstash）
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# 其他配置
SESSION_SECRET=your_session_secret
```

---

## 📁 文件结构

```
Psychology-Healing/
├── public/                 # 静态文件
│   ├── index.html         # 首页
│   ├── practice.html      # 疗愈练习
│   ├── emotion.html       # 情绪觉察
│   ├── role.html          # 角色探索
│   ├── community.html     # 微光社区
│   ├── charging-station.html  # 充电站
│   ├── knowledge-graph.html   # 知识图谱
│   ├── js/                # JavaScript文件
│   │   ├── theme-manager.js
│   │   ├── emotion-chart.js
│   │   └── audio-player.js
│   └── audio/             # 音频文件
├── server/                # 服务器代码
│   ├── index.js          # 入口文件
│   └── routes/           # 路由
├── docs/                  # 文档
├── package.json
└── README.md
```

---

## 🔒 安全配置

### HTTPS

**Vercel/Netlify**：自动配置

**传统服务器**：
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 安全头

在 `server/index.js` 添加：

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

## 📊 监控和日志

### PM2监控

```bash
# 查看日志
pm2 logs psychology-healing

# 监控
pm2 monit

# 重启
pm2 restart psychology-healing
```

### 错误追踪

推荐使用：
- Sentry（https://sentry.io）
- LogRocket（https://logrocket.com）

---

## 🔄 更新部署

### Vercel

```bash
# 自动部署：推送到GitHub即可
git add .
git commit -m "Update"
git push
```

### 传统服务器

```bash
# 拉取最新代码
git pull

# 安装依赖
npm install

# 重启服务
pm2 restart psychology-healing
```

---

## 🧪 部署前检查

- [ ] 所有页面正常访问
- [ ] 静态资源加载正常
- [ ] API接口正常工作
- [ ] 数据库连接正常
- [ ] HTTPS配置正确
- [ ] 环境变量配置正确
- [ ] 音频文件准备完成
- [ ] 移动端适配正常

---

## 🆘 常见问题

### 问题1：端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 问题2：静态文件404

检查 `server/index.js` 中的静态文件路径：
```javascript
app.use(express.static('public'));
```

### 问题3：跨域问题

添加CORS配置：
```javascript
const cors = require('cors');
app.use(cors());
```

---

## 📈 性能优化

### 1. 启用Gzip压缩

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. 缓存静态资源

```javascript
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

### 3. 图片优化

- 使用WebP格式
- 压缩图片大小
- 使用CDN加速

---

## 🎯 下一步

1. 准备音频文件（参考 `/docs/AUDIO_PREPARATION_GUIDE.md`）
2. 测试所有功能（参考 `/docs/TESTING_CHECKLIST.md`）
3. 配置域名和HTTPS
4. 设置监控和日志
5. 开始用户测试

---

**部署日期**：2026-05-07
**版本**：v2.0
