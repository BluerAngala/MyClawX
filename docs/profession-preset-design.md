# MyClawX 职业场景预设配置系统设计方案

## 一、系统概述

### 1.1 设计目标
为 MyClawX 引入**职业场景预设配置系统**，让用户能够根据职业身份（自媒体、电商、律师等）一键配置最适合的 AI 工作流，大幅降低 OpenClaw 的使用门槛。

### 1.2 核心价值
- **零配置上手**：选择职业后自动配置相关技能、提示词模板、定时任务
- **深度场景化**：针对特定职业的日常工作流进行深度优化
- **可扩展架构**：易于添加新的职业场景预设
- **灵活定制**：用户可在预设基础上进行个性化调整

---

## 二、系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     职业预设配置系统                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   职业定义层  │  │   场景模板层  │  │   配置应用层  │          │
│  │              │  │              │  │              │          │
│  │ • 职业元数据  │  │ • 技能组合   │  │ • 一键应用   │          │
│  │ • 场景定义   │  │ • 提示词模板 │  │ • 增量更新   │          │
│  │ • 工作流编排 │  │ • 定时任务   │  │ • 配置回滚   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                  │
│         └─────────────────┴─────────────────┘                  │
│                           │                                    │
│                    ┌──────▼──────┐                             │
│                    │  存储层     │                             │
│                    │             │                             │
│                    │ • JSON 预设 │                             │
│                    │ • electron-store│                         │
│                    │ • openclaw.json│                          │
│                    └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流设计

```
用户选择职业预设
       │
       ▼
┌─────────────────┐
│ 1. 加载职业定义  │
│    (profession.json)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 展示场景选择  │
│    (多场景卡片)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 用户选择场景  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ 4. 应用配置     │────▶│ • 安装技能       │
│                │     │ • 配置技能参数   │
│                │     │ • 创建定时任务   │
│                │     │ • 设置提示词模板 │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ 5. 验证与启动    │
│    (Gateway 重启)│
└─────────────────┘
```

---

## 三、数据结构设计

### 3.1 职业定义 (Profession)

```typescript
// src/types/profession.ts

export interface Profession {
  id: string;                    // 唯一标识: content-creator, e-commerce, lawyer
  name: string;                  // 显示名称
  nameZh: string;                // 中文名称
  description: string;           // 描述
  descriptionZh: string;         // 中文描述
  icon: string;                  // 图标 (emoji 或 lucide 图标名)
  color: string;                 // 主题色 (Tailwind 类名)
  tags: string[];                // 标签
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number;    // 预计设置时间 (分钟)
  scenes: ProfessionScene[];     // 场景列表
  commonSkills: string[];        // 通用技能 (所有场景共享)
  defaultProvider?: {            // 推荐 AI 提供商配置
    type: string;
    model: string;
    reason: string;
  };
}

export interface ProfessionScene {
  id: string;                    // 场景标识
  name: string;                  // 场景名称
  nameZh: string;                // 中文名称
  description: string;           // 场景描述
  descriptionZh: string;         // 中文描述
  icon: string;                  // 场景图标
  useCases: string[];            // 使用案例列表
  useCasesZh: string[];          // 中文使用案例
  skills: SceneSkill[];          // 场景所需技能
  cronTasks?: CronTaskTemplate[];// 定时任务模板
  promptTemplates?: PromptTemplate[]; // 提示词模板
  channels?: ChannelConfig[];    // 推荐通道配置
  workflowDescription?: string;  // 工作流说明
  workflowDescriptionZh?: string;// 中文工作流说明
}

export interface SceneSkill {
  slug: string;                  // 技能标识
  required: boolean;             // 是否必需
  config?: Record<string, unknown>; // 默认配置
  description?: string;          // 在此场景中的用途说明
}

export interface CronTaskTemplate {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  schedule: string;              // Cron 表达式
  prompt: string;                // 执行提示词
  enabled: boolean;              // 默认是否启用
}

export interface PromptTemplate {
  id: string;
  name: string;
  nameZh: string;
  category: string;              // 分类
  content: string;               // 提示词内容
  description?: string;
  variables?: string[];          // 可用变量
}

export interface ChannelConfig {
  type: string;                  // telegram, discord, feishu 等
  recommended: boolean;
  description?: string;
}
```

### 3.2 用户职业配置 (UserProfessionConfig)

```typescript
// src/types/profession.ts

export interface UserProfessionConfig {
  professionId: string;          // 当前职业
  sceneId: string;               // 当前场景
  appliedAt: string;             // 应用时间
  customized: boolean;           // 是否经过自定义
  
  // 应用的具体配置
  appliedSkills: AppliedSkill[];
  appliedCronTasks: AppliedCronTask[];
  appliedPrompts: AppliedPrompt[];
  
  // 用户自定义覆盖
  skillOverrides?: Record<string, Record<string, unknown>>;
  disabledCronTasks?: string[];
}

export interface AppliedSkill {
  slug: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface AppliedCronTask {
  templateId: string;
  enabled: boolean;
  customSchedule?: string;
  customPrompt?: string;
}

export interface AppliedPrompt {
  templateId: string;
  customized: boolean;
  customContent?: string;
}
```

---

## 四、职业场景详细设计

### 4.1 自媒体创作者 (Content Creator)

#### 职业定义
```json
{
  "id": "content-creator",
  "name": "Content Creator",
  "nameZh": "自媒体创作者",
  "description": "Automated content creation, scheduling, and multi-platform publishing",
  "descriptionZh": "自动化内容创作、排期和多平台发布",
  "icon": "✍️",
  "color": "rose",
  "tags": ["writing", "social-media", "automation"],
  "difficulty": "beginner",
  "estimatedSetupTime": 10
}
```

#### 场景列表

**场景 1: 每日内容工厂 (Daily Content Factory)**
- **用途**: 自动化日常内容生产流程
- **核心功能**:
  - 热点追踪与选题建议
  - 文案自动生成
  - 多平台一键发布
  - 数据追踪报告

**场景 2: 深度长文创作 (Long-form Writing)**
- **用途**: 深度文章、报告、电子书创作
- **核心功能**:
  - 资料收集与整理
  - 大纲生成
  - 分段写作
  - 排版优化

**场景 3: 短视频脚本工厂 (Video Script Factory)**
- **用途**: 短视频脚本批量生产
- **核心功能**:
  - 爆款脚本分析
  - 脚本模板生成
  - 分镜建议
  - 标题优化

#### 技能组合
```json
{
  "commonSkills": ["web-browse", "summarize", "openai-image-gen"],
  "scenes": [
    {
      "id": "daily-content",
      "skills": [
        { "slug": "blogwatcher", "required": true, "description": "追踪热点博客和资讯" },
        { "slug": "notion", "required": false, "description": "内容库管理" },
        { "slug": "twitter", "required": false, "description": "Twitter 自动发布" },
        { "slug": "wechat-official", "required": false, "description": "公众号文章发布" }
      ],
      "cronTasks": [
        {
          "id": "morning-trends",
          "name": "Morning Trends Check",
          "nameZh": "早间热点追踪",
          "schedule": "0 8 * * *",
          "prompt": "搜索今天的热门话题和趋势，生成3个选题建议，保存到 notion",
          "enabled": true
        },
        {
          "id": "daily-content",
          "name": "Daily Content Generation",
          "nameZh": "每日内容生成",
          "schedule": "0 10 * * *",
          "prompt": "根据选题生成一篇社交媒体文案，包含标题、正文、标签",
          "enabled": false
        }
      ],
      "promptTemplates": [
        {
          "id": "hot-topic-article",
          "name": "Hot Topic Article",
          "nameZh": "热点文章生成",
          "category": "writing",
          "content": "请根据以下热点话题撰写一篇{{platform}}文章：\n话题：{{topic}}\n风格：{{style}}\n字数：{{wordCount}}字\n\n要求：\n1. 标题吸引眼球\n2. 开头点明观点\n3. 正文有数据支撑\n4. 结尾引导互动"
        },
        {
          "id": "social-media-post",
          "name": "Social Media Post",
          "nameZh": "社交媒体帖子",
          "category": "social",
          "content": "为以下主题创作{{platform}}帖子：\n主题：{{topic}}\n语气：{{tone}}\n\n包含：\n- 吸引人的开头\n- 核心内容（3-5点）\n- 相关标签（5-8个）\n- 互动问题"
        }
      ]
    }
  ]
}
```

---

### 4.2 电商运营 (E-Commerce)

#### 职业定义
```json
{
  "id": "e-commerce",
  "name": "E-Commerce Operator",
  "nameZh": "电商运营",
  "description": "Product listing optimization, customer service automation, and sales analytics",
  "descriptionZh": "商品 listing 优化、客服自动化和销售数据分析",
  "icon": "🛒",
  "color": "amber",
  "tags": ["sales", "customer-service", "analytics"],
  "difficulty": "intermediate",
  "estimatedSetupTime": 15
}
```

#### 场景列表

**场景 1: 智能客服助手 (Smart Customer Service)**
- **用途**: 7x24 小时自动回复客户咨询
- **核心功能**:
  - 常见问题自动回复
  - 订单查询
  - 售后问题分类
  - 人工升级提醒

**场景 2: Listing 优化师 (Listing Optimizer)**
- **用途**: 商品标题、描述、关键词优化
- **核心功能**:
  - 竞品分析
  - SEO 关键词提取
  - 卖点提炼
  - A+ 内容生成

**场景 3: 数据监控中心 (Data Monitoring)**
- **用途**: 竞品价格、库存、评价监控
- **核心功能**:
  - 竞品价格追踪
  - 评价情感分析
  - 库存预警
  - 日报生成

#### 技能组合
```json
{
  "commonSkills": ["web-browse", "summarize", "excel"],
  "scenes": [
    {
      "id": "smart-cs",
      "skills": [
        { "slug": "telegram", "required": false, "description": "Telegram 客服通道" },
        { "slug": "discord", "required": false, "description": "Discord 客服通道" },
        { "slug": "feishu", "required": false, "description": "飞书客服通道" },
        { "slug": "notion", "required": true, "description": "客服知识库" }
      ],
      "cronTasks": [
        {
          "id": "daily-sales-report",
          "name": "Daily Sales Report",
          "nameZh": "每日销售报告",
          "schedule": "0 9 * * *",
          "prompt": "生成昨日销售数据摘要，包括订单数、销售额、客单价、退款率",
          "enabled": true
        }
      ],
      "promptTemplates": [
        {
          "id": "product-listing",
          "name": "Product Listing",
          "nameZh": "商品 Listing 优化",
          "category": "listing",
          "content": "请优化以下商品 Listing：\n商品名称：{{productName}}\n当前描述：{{currentDesc}}\n目标平台：{{platform}}\n\n请提供：\n1. 优化后的标题（含关键词）\n2. 卖点提炼（5点）\n3. 详细描述\n4. 推荐关键词（10个）"
        },
        {
          "id": "customer-reply",
          "name": "Customer Reply",
          "nameZh": "客户回复模板",
          "category": "service",
          "content": "客户问题：{{question}}\n订单信息：{{orderInfo}}\n\n请生成专业、友好的回复：\n1. 先表示理解和感谢\n2. 给出解决方案\n3. 询问是否还有其他帮助"
        }
      ]
    }
  ]
}
```

---

### 4.3 律师/法务 (Legal Professional)

#### 职业定义
```json
{
  "id": "lawyer",
  "name": "Legal Professional",
  "nameZh": "律师/法务",
  "description": "Legal document analysis, case research, and contract review automation",
  "descriptionZh": "法律文件分析、案例研究和合同审查自动化",
  "icon": "⚖️",
  "color": "indigo",
  "tags": ["legal", "research", "documents"],
  "difficulty": "advanced",
  "estimatedSetupTime": 20,
  "defaultProvider": {
    "type": "openai",
    "model": "gpt-4",
    "reason": "法律场景需要更强的推理能力"
  }
}
```

#### 场景列表

**场景 1: 合同审查助手 (Contract Reviewer)**
- **用途**: 合同条款审查、风险识别
- **核心功能**:
  - 条款风险扫描
  - 关键条款提取
  - 修改建议
  - 对比版本差异

**场景 2: 法律研究员 (Legal Researcher)**
- **用途**: 案例检索、法条查询、判例分析
- **核心功能**:
  - 类案检索
  - 法条解读
  - 判例摘要
  - 研究报告生成

**场景 3: 文书起草助手 (Document Drafter)**
- **用途**: 法律文书、函件、诉状起草
- **核心功能**:
  - 模板填充
  - 格式校验
  - 引用检查
  - 版本管理

#### 技能组合
```json
{
  "commonSkills": ["web-browse", "summarize", "obsidian"],
  "scenes": [
    {
      "id": "contract-review",
      "skills": [
        { "slug": "obsidian", "required": true, "description": "合同知识库管理" },
        { "slug": "notion", "required": false, "description": "案件管理" },
        { "slug": "pdf-tools", "required": false, "description": "PDF 合同处理" }
      ],
      "cronTasks": [
        {
          "id": "legal-news",
          "name": "Legal News Digest",
          "nameZh": "法律资讯摘要",
          "schedule": "0 8 * * 1",
          "prompt": "汇总上周重要法律法规更新、司法解释和典型案例",
          "enabled": true
        }
      ],
      "promptTemplates": [
        {
          "id": "contract-analysis",
          "name": "Contract Analysis",
          "nameZh": "合同风险分析",
          "category": "contract",
          "content": "请审查以下合同内容：\n\n{{contractContent}}\n\n请提供：\n1. 合同类型和主体识别\n2. 关键条款提取\n3. 潜在风险点（标注风险等级：高/中/低）\n4. 修改建议\n5. 缺失的重要条款"
        },
        {
          "id": "case-research",
          "name": "Case Research",
          "nameZh": "案例检索分析",
          "category": "research",
          "content": "请针对以下法律问题进行研究：\n问题：{{legalQuestion}}\n管辖区域：{{jurisdiction}}\n\n请提供：\n1. 相关法条\n2. 类似案例（如有）\n3. 法律分析\n4. 建议策略"
        },
        {
          "id": "legal-letter",
          "name": "Legal Letter",
          "nameZh": "律师函起草",
          "category": "document",
          "content": "请起草一份{{letterType}}：\n委托方：{{client}}\n对方：{{opponent}}\n事由：{{matter}}\n诉求：{{claim}}\n\n要求：\n1. 专业法律用语\n2. 事实陈述清晰\n3. 法律依据充分\n4. 期限明确"
        }
      ]
    }
  ]
}
```

---

## 五、存储方案设计

### 5.1 预设文件结构

```
resources/
└── professions/
    ├── professions.json          # 职业列表索引
    ├── content-creator.json      # 自媒体职业定义
    ├── e-commerce.json           # 电商职业定义
    ├── lawyer.json               # 律师职业定义
    └── templates/                # 共享模板
        ├── prompts/
        │   ├── content-creator/
        │   ├── e-commerce/
        │   └── lawyer/
        └── workflows/
```

### 5.2 用户配置存储

使用 electron-store 存储用户职业配置：

```typescript
// electron/utils/store.ts 扩展

export interface AppSettings {
  // ... 现有配置
  
  // 职业预设配置
  activeProfession?: string;           // 当前激活的职业
  professionConfig?: UserProfessionConfig;
  appliedProfessions: string[];        // 历史应用过的职业
}

// 默认值
const defaults: AppSettings = {
  // ... 现有默认值
  appliedProfessions: [],
};
```

### 5.3 配置文件示例

**resources/professions/professions.json**:
```json
{
  "version": "1.0.0",
  "professions": [
    {
      "id": "content-creator",
      "name": "Content Creator",
      "nameZh": "自媒体创作者",
      "description": "Automated content creation and publishing",
      "descriptionZh": "自动化内容创作和发布",
      "icon": "✍️",
      "color": "rose",
      "tags": ["writing", "social-media"],
      "difficulty": "beginner",
      "estimatedSetupTime": 10,
      "definitionFile": "content-creator.json"
    },
    {
      "id": "e-commerce",
      "name": "E-Commerce",
      "nameZh": "电商运营",
      "description": "Product optimization and customer service",
      "descriptionZh": "商品优化和客户服务",
      "icon": "🛒",
      "color": "amber",
      "tags": ["sales", "service"],
      "difficulty": "intermediate",
      "estimatedSetupTime": 15,
      "definitionFile": "e-commerce.json"
    },
    {
      "id": "lawyer",
      "name": "Legal Professional",
      "nameZh": "律师/法务",
      "description": "Legal document analysis and research",
      "descriptionZh": "法律文件分析和研究",
      "icon": "⚖️",
      "color": "indigo",
      "tags": ["legal", "research"],
      "difficulty": "advanced",
      "estimatedSetupTime": 20,
      "definitionFile": "lawyer.json"
    }
  ]
}
```

---

## 六、UI/UX 设计方案

### 6.1 职业选择页面

```
┌─────────────────────────────────────────────────────────────┐
│  选择您的职业场景                    [跳过，自定义配置]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   让我们根据您的职业，为您配置最适合的 AI 工作流              │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │     ✍️      │  │     🛒      │  │     ⚖️      │        │
│   │             │  │             │  │             │        │
│   │  自媒体     │  │   电商      │  │   律师      │        │
│   │  创作者     │  │   运营      │  │   法务      │        │
│   │             │  │             │  │             │        │
│   │ 适合内容    │  │ 适合店铺    │  │ 适合案件    │        │
│   │ 创作者、    │  │ 运营、      │  │ 研究、      │        │
│   │ 自媒体人    │  │ 客服管理    │  │ 文书起草    │        │
│   │             │  │             │  │             │        │
│   │ [选择]      │  │ [选择]      │  │ [选择]      │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │    📊       │  │    💻       │  │    🔬       │        │
│   │   (更多)    │  │   (更多)    │  │   (更多)    │        │
│   │  数据分析师 │  │  开发者     │  │  研究员     │        │
│   │   即将推出   │  │   即将推出   │  │   即将推出   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 场景选择页面

```
┌─────────────────────────────────────────────────────────────┐
│  ← 返回职业选择                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ✍️ 自媒体创作者                                            │
│   选择适合您的工作场景                                        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  📰 每日内容工厂          难度: ⭐ 预计: 10分钟     │  │
│   │                                                     │  │
│   │  自动化日常内容生产流程：                              │  │
│   │  • 热点追踪与选题建议                                  │  │
│   │  • 文案自动生成                                       │  │
│   │  • 多平台一键发布                                     │  │
│   │  • 数据追踪报告                                       │  │
│   │                                                     │  │
│   │  包含技能: blogwatcher, notion, twitter...          │  │
│   │                                                     │  │
│   │  [选择此场景]                                        │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  📝 深度长文创作          难度: ⭐⭐ 预计: 15分钟    │  │
│   │                                                     │  │
│   │  深度文章、报告、电子书创作...                         │
│   │                                                     │  │
│   │  [选择此场景]                                        │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  🎬 短视频脚本工厂        难度: ⭐ 预计: 10分钟      │  │
│   │                                                     │  │
│   │  短视频脚本批量生产...                                │
│   │                                                     │  │
│   │  [选择此场景]                                        │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 配置预览与应用页面

```
┌─────────────────────────────────────────────────────────────┐
│  ← 返回场景选择                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   📰 每日内容工厂 - 配置预览                                  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  📦 将安装的技能 (5个)                               │  │
│   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │  ✅ web-browse    网页浏览 (核心)                   │  │
│   │  ✅ summarize     内容摘要 (核心)                   │  │
│   │  ✅ blogwatcher   博客监控 (场景必需)                │  │
│   │  ⭕ notion        笔记管理 (可选)                   │  │
│   │  ⭕ twitter       Twitter发布 (可选)               │  │
│   │                                                     │  │
│   │  [管理技能]                                         │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  ⏰ 定时任务 (2个)                                   │  │
│   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │  ☑️ 早间热点追踪 (每天 8:00)                         │  │
│   │     搜索今天的热门话题和趋势...                        │  │
│   │                                                     │  │
│   │  ☐ 每日内容生成 (每天 10:00)                         │  │
│   │     根据选题生成一篇社交媒体文案...                    │  │
│   │                                                     │  │
│   │  [管理定时任务]                                      │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  📝 提示词模板 (4个)                                 │  │
│   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │  • 热点文章生成                                       │  │
│   │  • 社交媒体帖子                                       │  │
│   │  • 标题优化                                          │  │
│   │  • 标签生成                                          │  │
│   │                                                     │  │
│   │  [查看模板]                                          │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  ⚙️ 需要配置                                         │  │
│   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │  🔴 Notion API Token (用于内容库管理)                │  │
│   │  🟡 Twitter API (可选，用于自动发布)                 │  │
│   │                                                     │  │
│   │  [立即配置]                                          │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  📋 工作流说明                                       │  │
│   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │  1. 每天早上 8:00，AI 自动追踪热点并生成选题建议      │  │
│   │  2. 您在 Notion 中查看并选择要写的选题               │  │
│   │  3. 使用提示词模板快速生成文案                        │  │
│   │  4. 一键发布到多个平台                                │  │
│   │  5. 自动追踪数据并生成报告                            │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  [   一键应用此配置   ]                              │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 组件设计

#### ProfessionCard 组件
```typescript
interface ProfessionCardProps {
  profession: Profession;
  isSelected?: boolean;
  isDisabled?: boolean;
  onSelect: (professionId: string) => void;
}
```

#### SceneCard 组件
```typescript
interface SceneCardProps {
  scene: ProfessionScene;
  profession: Profession;
  isSelected?: boolean;
  onSelect: (sceneId: string) => void;
}
```

#### ConfigPreview 组件
```typescript
interface ConfigPreviewProps {
  profession: Profession;
  scene: ProfessionScene;
  onApply: () => void;
  onCustomize: () => void;
}
```

---

## 七、实现路线图

### Phase 1: 基础架构 (Week 1)
- [ ] 创建职业预设类型定义
- [ ] 实现职业预设加载服务
- [ ] 创建职业预设配置文件
- [ ] 扩展 electron-store 配置

### Phase 2: 核心功能 (Week 2)
- [ ] 实现职业选择页面
- [ ] 实现场景选择页面
- [ ] 实现配置预览页面
- [ ] 实现配置应用逻辑

### Phase 3: 职业场景实现 (Week 3)
- [ ] 自媒体创作者场景完整实现
- [ ] 电商运营场景完整实现
- [ ] 律师法务场景完整实现
- [ ] 提示词模板系统

### Phase 4: 集成与优化 (Week 4)
- [ ] 与现有 Setup Wizard 集成
- [ ] 添加职业预设管理页面到设置
- [ ] 国际化支持
- [ ] 性能优化和测试

---

## 八、技术实现细节

### 8.1 职业预设服务

```typescript
// electron/utils/profession-preset.ts

export class ProfessionPresetService {
  private professions: Map<string, Profession> = new Map();
  
  // 加载所有职业定义
  async loadProfessions(): Promise<Profession[]>
  
  // 获取单个职业
  async getProfession(id: string): Promise<Profession | null>
  
  // 应用职业场景配置
  async applyScene(professionId: string, sceneId: string): Promise<ApplyResult>
  
  // 验证配置是否完整
  async validateConfig(professionId: string, sceneId: string): Promise<ValidationResult>
  
  // 导出当前配置
  async exportConfig(): Promise<string>
  
  // 导入配置
  async importConfig(json: string): Promise<void>
}
```

### 8.2 IPC 接口

```typescript
// 主进程注册
ipcMain.handle('profession:getAll', async () => {
  return await professionService.loadProfessions();
});

ipcMain.handle('profession:get', async (_, id: string) => {
  return await professionService.getProfession(id);
});

ipcMain.handle('profession:applyScene', async (_, professionId: string, sceneId: string) => {
  return await professionService.applyScene(professionId, sceneId);
});

ipcMain.handle('profession:validate', async (_, professionId: string, sceneId: string) => {
  return await professionService.validateConfig(professionId, sceneId);
});

ipcMain.handle('profession:getUserConfig', async () => {
  return await getSetting('professionConfig');
});

ipcMain.handle('profession:saveUserConfig', async (_, config: UserProfessionConfig) => {
  await setSetting('professionConfig', config);
  await setSetting('activeProfession', config.professionId);
});
```

### 8.3 Store 设计

```typescript
// src/stores/professions.ts

interface ProfessionsState {
  professions: Profession[];
  currentProfession: Profession | null;
  currentScene: ProfessionScene | null;
  userConfig: UserProfessionConfig | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProfessions: () => Promise<void>;
  selectProfession: (id: string) => void;
  selectScene: (professionId: string, sceneId: string) => void;
  applyScene: (professionId: string, sceneId: string) => Promise<void>;
  validateConfig: (professionId: string, sceneId: string) => Promise<ValidationResult>;
}
```

---

## 九、与现有系统集成

### 9.1 Setup Wizard 集成

在 Setup Wizard 中添加职业选择步骤：

```typescript
// src/pages/Setup/index.tsx

const steps = [
  'welcome',
  'runtime',
  'profession',      // 新增：职业选择
  'scene',           // 新增：场景选择
  'profession-config', // 新增：职业配置确认
  'provider',
  'channel',
  'complete',
];
```

### 9.2 设置页面集成

在设置页面添加职业预设管理：

```
设置
├── 通用
├── 网关
├── AI 提供商
├── 职业预设        ← 新增
│   ├── 当前职业
│   ├── 切换职业
│   ├── 场景管理
│   └── 自定义配置
├── 技能
├── 通道
└── 关于
```

### 9.3 Dashboard 集成

在 Dashboard 显示当前职业场景信息：

```
Dashboard
├── 欢迎卡片 (显示当前职业)
├── 今日任务 (来自定时任务)
├── 快捷操作 (职业相关)
├── 活跃技能
└── 使用统计
```

---

## 十、扩展性设计

### 10.1 添加新职业

1. 创建 `resources/professions/{profession-id}.json`
2. 在 `professions.json` 中添加索引
3. 添加对应的国际化文件
4. 添加职业图标资源

### 10.2 职业市场

未来可扩展为职业市场模式：
- 用户可分享自定义职业配置
- 社区贡献职业场景
- 评分和评论系统

---

## 十一、安全与隐私考虑

1. **API Key 安全**: 所有 API Key 仍存储在系统密钥链
2. **配置验证**: 应用配置前验证所有必需参数
3. **权限控制**: 技能安装需要用户确认
4. **数据隔离**: 不同职业的配置相互隔离

---

## 十二、总结

本设计方案为 MyClawX 引入了一套完整的职业场景预设配置系统，具备以下特点：

1. **用户友好**: 三步完成专业级配置（选职业 → 选场景 → 一键应用）
2. **深度场景化**: 针对自媒体、电商、律师三个职业提供深度优化的工作流
3. **灵活可扩展**: 易于添加新的职业场景
4. **与现有系统无缝集成**: 充分利用现有的技能、定时任务、提示词系统

通过这套系统，用户可以大幅降低 OpenClaw 的使用门槛，快速进入高效工作状态。
