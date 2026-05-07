# 情绪评估页面优化说明

## 优化背景

传统心理测评依赖问卷式量表，存在以下问题：
- 用户需回答大量问题，体验枯燥
- 主观性强，容易受社会期望影响
- 无法捕捉复杂、混合的情绪状态
- 不符合"碎片化疗愈"的产品理念

## 采用方案：Plutchik情绪轮盘

### 理论基础

基于Robert Plutchik的情绪心理进化理论（1980），该理论认为：

**核心观点**：
1. 情绪是物种进化的适应手段
2. 存在8种基本情绪：喜悦、信任、恐惧、惊讶、悲伤、厌恶、愤怒、期待
3. 基本情绪可组合形成复杂情绪
4. 每种情绪有不同强度层级

**情绪对立关系**：
- 喜悦 ↔ 悲伤
- 信任 ↔ 厌恶
- 恐惧 ↔ 愤怒
- 惊讶 ↔ 期待

**情绪组合**：
- 喜悦 + 信任 = 爱
- 信任 + 恐惧 = 屈服
- 恐惧 + 惊讶 = 敬畏
- 惊讶 + 悲伤 = 不赞同
- 悲伤 + 厌恶 = 悔恨
- 厌恶 + 愤怒 = 蔑视
- 愤怒 + 期待 = 攻击性
- 期待 + 喜悦 = 乐观

### 实现特点

**1. 可视化轮盘**
- 8瓣花形轮盘，每瓣代表一种基本情绪
- 3层强度层级（外层弱、内层强）
- 颜色编码，直观易懂

**2. 交互设计**
- 点击选择情绪，最多可选2个相邻情绪
- 自动识别情绪组合并显示
- 鼠标悬停显示情绪名称和强度

**3. 数据记录**
- 记录情绪类型、强度、组合
- 保留情绪温度计（整体强度评估）
- 保留情境描述和标签功能

## 技术实现

### 核心文件

**`/public/js/emotion-wheel.js`**
- Canvas绘制情绪轮盘
- 点击事件处理
- 情绪组合识别算法
- 响应式适配

**`/public/emotion.html`**
- 集成情绪轮盘组件
- 保留情绪温度计
- 情境记录和标签功能
- 数据持久化（LocalStorage）

### 关键功能

**情绪选择**：
```javascript
emotionWheel = new EmotionWheel('emotion-wheel-container', {
    size: 400,
    onEmotionSelect: (selection) => {
        // selection.emotions: 选中的情绪数组
        // selection.combination: 组合情绪（如有）
    }
});
```

**数据结构**：
```javascript
{
    emotions: [
        {
            key: 'joy',
            name: '喜悦',
            level: 2,
            levelName: '快乐',
            color: '#FFE135'
        }
    ],
    combination: {
        name: '爱',
        color: '#FFD54F'
    },
    intensity: 5,  // 情绪温度计
    context: '...',
    tags: ['工作'],
    timestamp: '2026-05-07T...'
}
```

## 优势对比

| 维度 | 传统问卷式 | Plutchik轮盘 |
|------|-----------|-------------|
| 用户体验 | 枯燥、耗时长 | 有趣、快速 |
| 情绪识别 | 单一情绪 | 复杂情绪组合 |
| 主观偏差 | 高 | 低 |
| 科学依据 | 量表信效度 | 心理进化理论 |
| 视觉呈现 | 文字为主 | 图形化、直观 |
| 碎片化适配 | 差 | 好 |

## 用户流程

1. **选择情绪**：在轮盘上点击选择1-2个情绪
2. **查看组合**：系统自动识别情绪组合（如"喜悦+信任=爱"）
3. **评估强度**：使用情绪温度计评估整体强度
4. **记录情境**：可选填写触发事件和标签
5. **保存记录**：数据存储到LocalStorage

## 后续优化方向

1. **AI辅助识别**：结合面部表情、语音情绪识别
2. **情绪模式分析**：基于历史数据发现情绪规律
3. **个性化建议**：根据情绪组合提供精准调节方案
4. **社区分享**：匿名分享情绪体验，获得支持

## 参考文献

- Plutchik, R. (1980). A general psychoevolutionary theory of emotion. In R. Plutchik & H. Kellerman (Eds.), Emotion: Theory, research, and experience (Vol. 1, pp. 3-33). Academic Press.
- Plutchik, R. (2001). The nature of emotions: Human emotions have deep evolutionary roots. American Scientist, 89(4), 344-350.

## 更新日期

2026-05-07
