# 代码优化计划

> 基于新的产品战略，优化现有代码结构

## 一、优化目标

### 1.1 核心原则
- **聚焦MVP**：移除非核心功能，保留MVP必需模块
- **简化架构**：减少重复代码，提高可维护性
- **适配新战略**：为碎片化疗愈体验、情绪觉察、角色探索、知识图谱做准备

### 1.2 优化范围

**保留并优化**：
- ✅ 情绪日记功能（emotion.js）
- ✅ 基础心理测评（assessment.js）
- ✅ 知识库功能（knowledge.js）
- ✅ 用户反馈（feedback.js）
- ✅ 求助热线（stats.js）

**移除或重构**：
- ❌ content.js（与knowledge.js重复，合并）
- ❌ crawler相关代码（暂时不需要）
- ❌ 复杂的统计功能（简化）
- ❌ 冗余的前端页面元素

---

## 二、后端优化

### 2.1 路由整合

**合并方案**：
```
server/routes/
├── api.js           # API入口（保留）
├── emotion.js       # 情绪日记（保留，优化）
├── assessment.js    # 心理测评（保留，简化）
├── knowledge.js     # 知识库（保留，整合content.js）
├── feedback.js      # 用户反馈（保留）
├── stats.js         # 统计与热线（保留，简化）
├── cron.js          # 定时任务（保留）
└── practice.js      # 新增：疗愈练习记录
```

**删除文件**：
- ❌ content.js（功能合并到knowledge.js）

### 2.2 数据模型优化

**新增数据模型**：

**practiceRecords（练习记录）**：
```javascript
{
  id: String,
  userId: String,
  practiceType: String,  // 'breathing', 'body-scan', 'meditation', 'relaxation'
  duration: Number,      // 练习时长（秒）
  completedAt: Date,
  feedback: String,      // 用户反馈（可选）
  mood: String,          // 练习后心情（可选）
  createdAt: Date
}
```

**userRoles（用户角色）**：
```javascript
{
  id: String,
  userId: String,
  roles: [String],       // ['student', 'worker', 'parent', ...]
  conflicts: [String],   // 识别出的角色冲突
  createdAt: Date,
  updatedAt: Date
}
```

**优化现有模型**：

**emotionDiary（情绪日记）**：
```javascript
{
  id: String,
  userId: String,
  emotionType: String,   // 情绪类型
  intensity: Number,     // 情绪强度 1-5
  context: String,       // 情境描述
  tags: [String],        // 标签
  triggers: [String],    // 触发因素（新增）
  copingStrategy: String,// 应对策略（新增）
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 API端点优化

**保留端点**：
```
GET  /api/emotion/diary          # 获取情绪日记
POST /api/emotion/diary          # 创建情绪日记
GET  /api/emotion/stats          # 情绪统计
GET  /api/emotion/types          # 情绪类型列表

GET  /api/assessment/types       # 测评类型
GET  /api/assessment/:type       # 获取测评题目
POST /api/assessment/:type/submit# 提交测评
GET  /api/assessment/history     # 测评历史

GET  /api/knowledge              # 知识库概览
GET  /api/knowledge/exercises    # 疗愈练习
GET  /api/knowledge/psychology   # 心理知识
GET  /api/knowledge/graph        # 知识图谱
GET  /api/knowledge/daily-tips   # 每日提示

POST /api/feedback               # 提交反馈
GET  /api/feedback/types         # 反馈类型

GET  /api/stats/hotlines         # 求助热线
```

**新增端点**：
```
POST /api/practice/record        # 记录练习
GET  /api/practice/history       # 练习历史
GET  /api/practice/stats         # 练习统计

POST /api/role/identify          # 识别角色
GET  /api/role/analysis          # 角色分析
GET  /api/role/suggestions       # 角色平衡建议
```

**移除端点**：
```
❌ GET  /api/content/*           # 合并到knowledge
❌ POST /api/stats/visit         # 简化统计
❌ GET  /api/stats/overview      # 简化统计
```

---

## 三、前端优化

### 3.1 页面结构优化

**保留页面**：
```
public/
├── index.html           # 首页（优化）
├── practice.html        # 疗愈练习（重构）
│   ├── breathing.html   # 呼吸觉察
│   ├── body-scan.html   # 身体扫描
│   ├── meditation.html  # 正念冥想
│   └── relaxation.html  # 深度放松
├── emotion.html         # 情绪觉察（优化）
├── role.html            # 角色探索（新增）
├── knowledge-graph.html # 知识图谱（保留）
├── test.html            # 心理测评（简化）
└── about.html           # 关于我们（保留）
```

**删除页面**：
- ❌ article.html（内容整合到知识图谱）

### 3.2 首页优化

**移除内容**：
- ❌ 复杂的英雄区域动画
- ❌ 冗长的功能介绍
- ❌ 不必要的统计数据展示

**保留内容**：
- ✅ 简洁的价值主张
- ✅ 核心功能入口（4个）
- ✅ 温暖的引导语
- ✅ 求助热线信息

### 3.3 组件优化

**新增组件**：
- 音频播放器组件
- 计时器组件
- 呼吸动画组件
- 情绪选择器组件
- 角色识别问卷组件

**优化组件**：
- 简化测评流程
- 优化情绪记录界面
- 改进知识图谱交互

---

## 四、文件清理

### 4.1 删除文件

**后端**：
```
server/routes/content.js              # 合并到knowledge.js
server/services/crawler.js            # 暂时不需要
server/services/crawler/              # 整个目录
```

**前端**：
```
public/article.html                   # 内容整合
```

**其他**：
```
scripts/migrate-to-upstash.js         # 已完成迁移
server/test.js                        # 测试文件
```

### 4.2 保留文件

**核心文件**：
```
server/index.js                       # 服务入口
server/config/upstash.js              # 数据库配置
server/services/knowledgeService.js   # 知识服务
server/routes/*.js                    # 路由文件（优化后）
public/*.html                         # 页面文件（优化后）
```

**配置文件**：
```
package.json
vercel.json
.env.example
README.md
```

---

## 五、实施步骤

### 5.1 第一阶段：后端优化（优先）

**步骤1**：合并路由
- 将content.js功能合并到knowledge.js
- 删除content.js文件
- 更新api.js路由引用

**步骤2**：优化数据模型
- 新增practiceRecords模型
- 新增userRoles模型
- 优化emotionDiary模型

**步骤3**：新增API端点
- 新增practice相关端点
- 新增role相关端点

**步骤4**：删除冗余代码
- 删除crawler相关代码
- 简化stats.js

### 5.2 第二阶段：前端优化

**步骤1**：优化首页
- 简化布局
- 突出核心功能
- 移除冗余内容

**步骤2**：重构练习页面
- 创建practice.html
- 创建4个子页面
- 实现音频播放和计时

**步骤3**：优化情绪页面
- 简化情绪记录流程
- 优化情绪分析展示

**步骤4**：新增角色页面
- 创建role.html
- 实现角色识别问卷
- 实现角色分析展示

### 5.3 第三阶段：测试与部署

**步骤1**：功能测试
- 测试所有API端点
- 测试前端页面交互
- 测试数据存储

**步骤2**：性能优化
- 音频预加载
- 图片优化
- 代码压缩

**步骤3**：部署上线
- 更新Vercel配置
- 部署到生产环境
- 监控运行状态

---

## 六、优化后的目录结构

```
Psychology-Healing/
├── docs/                          # 文档
│   ├── PRODUCT_STRATEGY.md        # 产品战略
│   ├── MVP_IMPLEMENTATION_PLAN.md # MVP实施计划
│   └── CODE_OPTIMIZATION_PLAN.md  # 代码优化计划
├── public/                        # 前端页面
│   ├── index.html                 # 首页
│   ├── practice/                  # 疗愈练习
│   │   ├── index.html
│   │   ├── breathing.html
│   │   ├── body-scan.html
│   │   ├── meditation.html
│   │   └── relaxation.html
│   ├── emotion.html               # 情绪觉察
│   ├── role.html                  # 角色探索
│   ├── knowledge-graph.html       # 知识图谱
│   ├── test.html                  # 心理测评
│   ├── about.html                 # 关于我们
│   └── audio/                     # 音频资源
│       ├── breathing/
│       ├── body-scan/
│       ├── meditation/
│       └── relaxation/
├── server/                        # 后端服务
│   ├── index.js                   # 服务入口
│   ├── config/
│   │   └── upstash.js             # 数据库配置
│   ├── routes/
│   │   ├── api.js                 # API入口
│   │   ├── emotion.js             # 情绪日记
│   │   ├── assessment.js          # 心理测评
│   │   ├── knowledge.js           # 知识库
│   │   ├── practice.js            # 疗愈练习
│   │   ├── role.js                # 角色探索
│   │   ├── feedback.js            # 用户反馈
│   │   ├── stats.js               # 统计与热线
│   │   └── cron.js                # 定时任务
│   └── services/
│       └── knowledgeService.js    # 知识服务
├── scripts/                       # 脚本
│   └── update-knowledge.js        # 知识更新
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

---

## 七、注意事项

### 7.1 数据迁移
- 确保现有数据不丢失
- 新增字段设置默认值
- 提供数据迁移脚本

### 7.2 向后兼容
- 保留现有API端点
- 新增字段可选
- 渐进式迁移

### 7.3 测试验证
- 测试所有功能
- 验证数据完整性
- 检查性能表现

---

**文档版本**：v1.0
**最后更新**：2026年5月7日
