# GitHub 发布检查清单

## 📋 发布前准备

### 1. 代码清理
- [ ] 删除敏感信息（API密钥、密码等）
- [ ] 删除不必要的文件（node_modules、.env等）
- [ ] 清理注释中的敏感信息
- [ ] 检查所有文件，确保没有隐私数据

### 2. 创建 .gitignore

```gitignore
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Build
dist/
build/

# Temporary files
tmp/
temp/
*.tmp

# Audio files (too large for GitHub)
public/audio/*.mp3
public/audio/*.wav

# Keep directory structure
!public/audio/*/.gitkeep
```

### 3. 创建 .gitattributes（可选）

```gitattributes
# Auto detect text files and perform LF normalization
* text=auto

# JavaScript
*.js text eol=lf
*.jsx text eol=lf

# HTML/CSS
*.html text eol=lf
*.css text eol=lf

# JSON
*.json text eol=lf

# Markdown
*.md text eol=lf
```

---

## 📄 必要文件检查

### 法律文件
- [ ] LICENSE - GNU AGPL v3.0 ✅
- [ ] NOTICE - 版权声明 ✅
- [ ] CONTRIBUTING.md - 贡献指南 ✅

### 文档文件
- [ ] README.md - 项目说明 ✅
- [ ] CHANGELOG.md - 更新日志（待创建）
- [ ] CODE_OF_CONDUCT.md - 行为准则（可选）

### 配置文件
- [ ] package.json - 项目配置 ✅
- [ ] .gitignore - Git忽略文件（待创建）
- [ ] .env.example - 环境变量示例（待创建）

---

## 🔐 安全检查

### 敏感信息扫描

```bash
# 扫描可能泄露的密钥
grep -r "api_key" --include="*.js" .
grep -r "secret" --include="*.js" .
grep -r "password" --include="*.js" .
grep -r "token" --include="*.js" .

# 如果发现敏感信息，立即删除或移到 .env 文件
```

### 文件大小检查

```bash
# 检查大文件（GitHub限制100MB）
find . -type f -size +50M

# 音频文件建议使用 Git LFS 或外部存储
```

---

## 🚀 发布步骤

### 步骤1：初始化Git仓库

```bash
# 进入项目目录
cd "Psychology-Healing"

# 初始化Git
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "feat: 初始化心晴空间项目

- 完成核心功能开发
- 添加三套主题皮肤
- 实现5分钟充电站
- 创建微光社区
- 优化情绪温度计
- 添加完整文档

License: GNU AGPL v3.0"
```

### 步骤2：创建GitHub仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - Repository name: `Psychology-Healing`
   - Description: `心晴空间 - 公益心理疗愈平台 | A public mental health platform`
   - 选择 **Public**
   - ❌ 不要勾选 "Add a README file"（已有）
   - ❌ 不要勾选 "Add .gitignore"（已创建）
   - ✅ 选择 "Choose a license" → "GNU Affero General Public License v3.0"

3. 点击 "Create repository"

### 步骤3：推送代码

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/Psychology-Healing.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

### 步骤4：完善GitHub设置

#### 4.1 添加仓库描述
- Settings → General → Description
- 填写：`心晴空间 - 公益心理疗愈平台 | 碎片化疗愈，陪伴你的每一刻`

#### 4.2 添加主题标签
- 在仓库主页点击 "Add topics"
- 添加标签：
  - `mental-health`
  - `psychology`
  - `meditation`
  - `mindfulness`
  - `healing`
  - `open-source`
  - `nodejs`
  - `javascript`

#### 4.3 启用GitHub Pages（可选）
- Settings → Pages
- Source: Deploy from a branch
- Branch: main / root
- 保存

#### 4.4 添加社交预览图
- Settings → General → Social preview
- 上传一张 1280×640 px 的图片

---

## 📝 发布后工作

### 1. 创建Release

```bash
# 创建标签
git tag -a v2.0.0 -m "Release v2.0.0 - 新功能上线

新增功能：
- 三套主题皮肤系统
- 5分钟充电站
- 情绪温度计优化
- 微光社区

核心功能：
- 碎片化疗愈练习
- 情绪觉察工具
- 身份角色探索
- 心理知识图谱"

# 推送标签
git push origin v2.0.0
```

在GitHub上创建Release：
1. 点击 "Releases" → "Draft a new release"
2. 选择标签：v2.0.0
3. 填写Release标题和说明
4. 上传编译后的文件（可选）
5. 发布

### 2. 添加徽章

在 README.md 顶部添加：

```markdown
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/Psychology-Healing?style=social)
![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/Psychology-Healing?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/YOUR_USERNAME/Psychology-Healing?style=social)
![GitHub license](https://img.shields.io/github/license/YOUR_USERNAME/Psychology-Healing)
![GitHub last commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/Psychology-Healing)
![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/Psychology-Healing)
```

### 3. 创建Issue模板

创建 `.github/ISSUE_TEMPLATE/bug_report.md`：

```markdown
---
name: Bug报告
about: 报告一个bug帮助我们改进
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug描述
清晰简洁地描述这个bug。

## 复现步骤
1. 访问 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 期望行为
描述你期望发生什么。

## 实际行为
描述实际发生了什么。

## 截图
如果适用，添加截图帮助解释问题。

## 环境
- OS: [e.g. Windows, macOS, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]

## 其他信息
添加任何其他关于问题的信息。
```

### 4. 创建PR模板

创建 `.github/PULL_REQUEST_TEMPLATE.md`：

```markdown
## 更改描述
请清晰简洁地描述您的更改。

## 更改类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 其他

## 检查清单
- [ ] 我的代码遵循项目的代码规范
- [ ] 我已经进行了自我审查
- [ ] 我已经添加了必要的注释
- [ ] 我的更改没有产生新的警告
- [ ] 我已经更新了相关文档

## 相关Issue
关闭 #(issue编号)

## 截图（如适用）
添加截图帮助审查者理解您的更改。

## 其他信息
添加任何其他相关信息。
```

---

## 🎯 推广策略

### 1. 社交媒体分享

**内容模板**：
```
🌿 心晴空间 v2.0 正式开源！

一个面向年轻人的公益心理疗愈平台：
✅ 碎片化疗愈练习（1-7分钟）
✅ 情绪觉察与记录
✅ 三套主题皮肤
✅ 微光社区

License: GNU AGPL v3.0
GitHub: [链接]

#开源 #心理健康 #JavaScript #NodeJS
```

### 2. 技术社区分享

- 掘金
- 思否
- CSDN
- V2EX
- Ruby China

### 3. 开源平台提交

- HelloGitHub
- 开源中国
- Gitee（码云）

---

## 📊 监控和维护

### 1. 设置GitHub Insights

- 查看 Traffic
- 查看 Contributors
- 查看 Community Profile

### 2. 定期维护

- 每周检查 Issues
- 每月更新依赖
- 定期合并 PR
- 保持文档更新

### 3. 社区互动

- 及时回复 Issues
- 感谢贡献者
- 发布更新日志
- 分享项目进展

---

## ✅ 最终检查清单

### 法律保护
- [x] LICENSE 文件（AGPL v3.0）
- [x] NOTICE 文件
- [x] CONTRIBUTING.md
- [x] README 版权声明
- [x] 代码版权注释

### 代码质量
- [x] 删除敏感信息
- [x] 删除不必要的文件
- [x] 代码格式化
- [x] 添加必要注释

### 文档完整
- [x] README.md
- [x] 项目说明
- [x] 安装指南
- [x] 使用文档

### GitHub设置
- [x] 仓库描述
- [x] 主题标签
- [x] 社交预览图（可选）
- [x] GitHub Pages（可选）

### 发布准备
- [x] 创建Release
- [x] 添加徽章
- [x] Issue模板
- [x] PR模板

---

**准备就绪！可以发布到GitHub了！** 🚀
