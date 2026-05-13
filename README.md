# 心晴空间 🌿

> 公益心理疗愈平台 - 这里，可以安放你的心事

![License](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Web-orange.svg)
![Copyright](https://img.shields.io/badge/copyright-2026%20Psychology%20Healing-red.svg)

---

## ⚠️ 版权声明

**本项目采用 GNU AGPL v3.0 许可证**

- ✅ 允许学习、研究和非商业使用
- ⚠️ 衍生作品必须开源并使用相同许可证
- ❌ 禁止闭源商业化
- 📄 完整许可证：[LICENSE](./LICENSE)

**在商业使用前，请务必阅读许可证条款或联系我们获取商业授权。**

---

## 📖 项目简介

心晴空间是一个面向年轻人的公益心理疗愈公开平台，提供情绪自测、心理科普、放松练习等内容，帮助用户在日常中照顾自己的内心。

### ✨ 核心功能

- **情绪自测**：焦虑/抑郁情绪自评量表（GAD-7/PHQ-9简化版）
- **疗愈内容**：心理科普文章、自我成长内容
- **放松练习**：呼吸训练、冥想引导、身体扫描、五感放松
- **知识图谱**：可视化展示心理知识关联
- **求助导航**：专业心理援助热线汇总

### 🎯 设计理念

- **温暖**：像朋友一样关心，不冷漠、不官方
- **共情**：理解你的感受，不评判、不否定
- **温和**：轻声细语，不强势、不施压
- **不说教**：陪伴而非指导，不"你应该"、不"你必须"

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Python >= 3.7（可选，用于音频下载）
- Vercel Blob 存储（免费）

### 安装运行

```bash
# 克隆项目
git clone https://github.com/your-username/xinqing-space.git
cd xinqing-space

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 Vercel Blob Token

# 下载疗愈音频（可选）
pip install requests
python scripts/download_audio.py --download

# 启动服务
npm start
```

访问 http://localhost:3000 即可查看网站。

### 开发模式

```bash
npm run dev
```

## 📁 项目结构

```
xinqing-space/
├── public/              # 静态HTML页面
│   ├── index.html       # 首页
│   ├── test.html        # 情绪自测页
│   ├── article.html     # 疗愈内容页
│   ├── relax.html       # 放松练习页
│   ├── about.html       # 关于+合规页
│   ├── knowledge-graph.html # 知识图谱页
│   └── audio/           # 疗愈音频资源
│       ├── breathing/   # 呼吸觉察音频
│       ├── body-scan/   # 身体扫描音频
│       ├── meditation/  # 正念冥想音频
│       └── relaxation/  # 深度放松音频
├── server/              # Node.js后端
│   ├── index.js         # 服务入口
│   ├── config/          # 配置文件
│   │   └── blob.js      # Vercel Blob 配置
│   ├── routes/          # API路由
│   │   ├── api.js       # 路由入口
│   │   ├── emotion.js   # 情绪日记API
│   │   ├── assessment.js# 心理测评API
│   │   ├── knowledge.js # 知识库API
│   │   ├── practice.js  # 疗愈练习API
│   │   ├── role.js      # 角色探索API
│   │   ├── feedback.js  # 用户反馈API
│   │   ├── stats.js     # 统计与热线API
│   │   └── cron.js      # 定时任务API
│   └── services/
│       └── knowledgeService.js # 知识库服务
├── scripts/             # 脚本文件
│   ├── download_audio.py # 音频下载工具
│   └── update-knowledge.js   # 知识更新
├── docs/                # 文档目录（按主题分类）
│   ├── README.md                 # 文档索引
│   ├── 01-product/              # 产品文档
│   ├── 02-engineering/         # 工程文档
│   ├── 03-deployment/          # 部署文档
│   ├── 04-content/             # 内容文档
│   └── 05-process/             # 流程文档
├── logs/                # 日志目录
├── package.json
├── vercel.json          # Vercel配置
└── README.md
```

## 🔌 API 文档

### 基础信息

- 基础URL: `http://localhost:3000/api`
- 响应格式: JSON
- 速率限制: 100次/15分钟

### 主要接口

#### 情绪日记

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/emotion/diary | 获取日记列表 |
| POST | /api/emotion/diary | 创建日记 |
| GET | /api/emotion/stats | 获取情绪统计 |
| GET | /api/emotion/types | 获取情绪类型 |

#### 心理测评

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/assessment/types | 获取测评类型 |
| GET | /api/assessment/:type | 获取测评题目 |
| POST | /api/assessment/:type/submit | 提交测评结果 |
| GET | /api/assessment/history | 获取测评历史 |

#### 知识库

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/knowledge | 获取知识库概览 |
| GET | /api/knowledge/exercises | 获取疗愈练习 |
| GET | /api/knowledge/psychology | 获取心理知识 |
| GET | /api/knowledge/emotion-regulation | 获取情绪调节方案 |
| GET | /api/knowledge/daily-tips | 获取每日提示 |
| GET | /api/knowledge/graph | 获取知识图谱数据 |
| GET | /api/knowledge/sources | 获取数据源列表 |

#### 定时更新

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/knowledge/cron-update?secret=xxx | 触发知识库更新 |
| GET | /api/knowledge/health | 健康检查 |

## ⏰ 定时更新配置

### Vercel Cron（推荐）

项目已配置 `vercel.json`，部署到 Vercel 后会自动每日更新：

```json
{
  "crons": [
    {
      "path": "/api/knowledge/cron-update?secret=your-secret",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 手动触发

```bash
# 通过 API 触发
curl "https://your-domain.vercel.app/api/knowledge/cron-update?secret=your-secret"

# 或本地执行
npm run update-knowledge
```

### 数据源

知识库从以下权威来源同步：

**国内机构**
- 中国科学院心理研究所
- 中国心理学会
- 国家心理健康网
- 北京师范大学心理学部
- 北京大学心理与认知科学学院

**国际期刊/组织**
- Nature Psychology
- American Psychological Association (APA)
- Psychology Today
- World Psychiatry

## 📦 部署

### Vercel 部署（推荐）

1. Fork 本仓库
2. 在 Vercel 导入项目
3. 配置环境变量：
   - `BLOB_READ_WRITE_TOKEN`
   - `ADMIN_TOKEN`
   - `KNOWLEDGE_UPDATE_SECRET`
4. 部署完成

### 本地部署

```bash
npm install
npm start
```

### Docker 部署

```bash
docker build -t xinqing-space .
docker run -d -p 3000:3000 \
  -e BLOB_READ_WRITE_TOKEN=xxx \
  -e ADMIN_TOKEN=xxx \
  xinqing-space
```

## 🔧 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写 Token | ✅ |
| `ADMIN_TOKEN` | 管理后台登录 Token | ✅ |
| `KNOWLEDGE_UPDATE_SECRET` | 定时更新密钥 | ✅ |
| `PORT` | 服务端口 | ❌ (默认3000) |
| `CORS_ORIGIN` | CORS配置 | ❌ (默认*) |

## ⚠️ 重要声明

本平台为**公益性质**的心理健康科普与情绪陪伴服务平台。

### 我们提供
- 情绪陪伴与心理科普
- 自我成长引导内容
- 放松练习与情绪记录

### 我们不提供
- 医学诊断或心理疾病诊断
- 心理治疗或精神科诊疗
- 任何形式的医疗行为

### 以下情况请寻求专业医疗帮助
- 中重度抑郁/焦虑持续两周以上
- 存在自伤、自杀念头或行为
- 双相情感障碍等重性精神疾病

**全国心理援助热线：400-161-9995（24小时免费服务）**

## 📚 文档

详细文档请查看 [`docs/README.md`](./docs/README.md)，按主题分类存放：

| 目录 | 内容 |
|--------|------|
| `docs/01-product/` | 产品策略、MVP 计划、功能总结 |
| `docs/02-engineering/` | 系统架构、代码优化 |
| `docs/03-deployment/` | 部署指南、存储配置 |
| `docs/04-content/` | 内容脚本、音频资源 |
| `docs/05-process/` | 测试清单、发布流程 |

---

## 🛠️ 技术栈

### 前端
- HTML5 + CSS3
- TailwindCSS（CDN）
- 原生 JavaScript
- D3.js（知识图谱可视化）

### 后端
- Node.js
- Express.js
- Vercel Blob（云存储）

### 部署
- Vercel（Serverless + Cron）

## 🤝 参与贡献

欢迎参与项目贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

## 🙏 致谢

### 数据来源
- 中国科学院心理研究所
- Nature Psychology
- American Psychological Association
- World Psychiatry
- 中国心理学会

### 参考资料
- 上海市《心理咨询机构服务规范》（2025年4月实施）
- PHQ-9/GAD-7 标准化心理测评工具

---

**心晴空间** - 陪伴，是最温柔的治愈 💚
