# 律师职业技能开发方案

## 一、需求背景

为 MyClawX 平台开发律师职业专用技能，支持以下三个核心场景：

1. **合同审查** - 合同文档解析、风险识别、审查报告生成
2. **法律检索** - 法律法规查询、案例检索、知识库检索
3. **文书生成** - 法律文书模板管理、文档生成、格式化输出

---

## 二、现有技能分析

### 2.1 当前可用技能

| 技能名称 | 功能 | 适用场景 |
|---------|------|---------|
| weather | 天气查询 | 不适用 |
| healthcheck | 安全审计 | 不适用 |
| skill-creator | 创建技能 | 可用于创建新技能 |
| session-logs | 历史会话查询 | 可用于查询历史审查记录 |
| canvas | HTML 内容展示 | 可用于文书预览 |
| clawhub | 技能市场 CLI | 不适用 |
| tmux | Tmux 会话控制 | 不适用 |
| video-frames | 视频帧提取 | 不适用 |
| nano-pdf | PDF 简单编辑 | 部分可用（功能有限） |
| model-usage | 模型使用统计 | 不适用 |

### 2.2 当前缺失技能

| 功能需求 | 缺失技能 | 优先级 |
|---------|---------|--------|
| PDF/DOCX 文档读取 | doc-reader | 高 |
| PDF/DOCX 文档生成 | doc-writer | 高 |
| 法律法规检索 | law-search | 高 |
| 案例检索 | case-search | 中 |
| 本地知识库检索 | vector-store | 中 |
| 文档版本对比 | doc-compare | 中 |
| 国内网页搜索 | web-search-cn | 低 |

---

## 三、技能实现架构

### 3.1 技能实现方式

OpenClaw 支持三种技能实现方式：

| 方式 | 适用场景 | 复杂度 | 技术栈 |
|------|---------|--------|--------|
| **纯脚本型** | 文档处理、本地操作 | 简单 | Python/Bash |
| **纯文档型** | 工作流程指导、知识库 | 简单 | Markdown |
| **扩展插件型** | API 对接、复杂服务 | 复杂 | TypeScript |

### 3.2 技能目录结构

```
skill-name/
├── SKILL.md              # 必需：技能描述和使用说明
├── scripts/              # 可选：可执行脚本
│   ├── script1.py
│   └── script2.sh
├── references/           # 可选：参考文档
│   └── guide.md
└── assets/               # 可选：模板和资源文件
    └── template.docx
```

### 3.3 技能元数据格式

```yaml
---
name: skill-name
description: |
  技能描述，包含何时使用此技能的触发条件。
  这是最重要的字段，AI 通过描述决定何时调用技能。
metadata:
  openclaw:
    emoji: "📄"
    requires:
      bins: ["python3"]           # 需要的命令行工具
      env: ["API_KEY"]            # 需要的环境变量
    primaryEnv: "API_KEY"         # 主要 API Key
    install:                      # 安装说明
      - kind: uv
        package: some-package
        bins: ["some-cli"]
---
```

---

## 四、开发任务清单

### 第一阶段：核心技能（必需）

#### 4.1.1 doc-reader（文档读取技能）

**目标**：支持读取 PDF、DOCX 格式文档，提取文本和表格内容

**实现方式**：纯脚本型（Python）

**目录结构**：
```
doc-reader/
├── SKILL.md
└── scripts/
    ├── read_pdf.py        # PDF 文本提取
    ├── read_docx.py       # Word 文档读取
    └── extract_tables.py  # 表格提取
```

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| DR-001 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | 无 |
| DR-002 | 实现 read_pdf.py（使用 pdfplumber） | 2h | DR-001 |
| DR-003 | 实现 read_docx.py（使用 python-docx） | 2h | DR-001 |
| DR-004 | 实现 extract_tables.py（表格提取） | 2h | DR-002 |
| DR-005 | 编写 SKILL.md 使用说明文档 | 1h | DR-002, DR-003, DR-004 |
| DR-006 | 本地测试和调试 | 1h | DR-005 |
| DR-007 | 打包技能文件 | 0.5h | DR-006 |

**技术依赖**：
- Python 3.10+
- pdfplumber（PDF 解析）
- python-docx（Word 文档）
- uv（Python 包管理）

**环境变量**：无

---

#### 4.1.2 doc-writer（文档生成技能）

**目标**：支持生成 PDF、DOCX 格式文档，支持模板填充

**实现方式**：纯脚本型（Python）

**目录结构**：
```
doc-writer/
├── SKILL.md
├── scripts/
│   ├── create_docx.py     # 创建 Word 文档
│   ├── create_pdf.py      # 创建 PDF 文档
│   └── fill_template.py   # 模板填充
└── assets/
    └── templates/
        ├── contract_template.docx      # 合同模板
        ├── legal_opinion.docx          # 法律意见书模板
        ├── power_of_attorney.docx      # 授权委托书模板
        └── demand_letter.docx          # 律师函模板
```

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| DW-001 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | 无 |
| DW-002 | 实现 create_docx.py（使用 python-docx） | 3h | DW-001 |
| DW-003 | 实现 create_pdf.py（使用 reportlab） | 3h | DW-001 |
| DW-004 | 实现 fill_template.py（模板变量替换） | 2h | DW-002 |
| DW-005 | 创建法律文书模板（4个基础模板） | 2h | DW-001 |
| DW-006 | 编写 SKILL.md 使用说明文档 | 1h | DW-002, DW-003, DW-004 |
| DW-007 | 本地测试和调试 | 1h | DW-006 |
| DW-008 | 打包技能文件 | 0.5h | DW-007 |

**技术依赖**：
- Python 3.10+
- python-docx（Word 文档）
- reportlab（PDF 生成）
- jinja2（模板引擎）

**环境变量**：无

---

#### 4.1.3 law-search（法律检索技能 - 本地版）

**目标**：支持本地法律法规检索，基于预置的法律文本库

**实现方式**：纯脚本型（Python + 本地知识库）

**目录结构**：
```
law-search/
├── SKILL.md
├── scripts/
│   ├── search_local.py    # 本地检索
│   ├── build_index.py     # 构建索引
│   └── update_laws.py     # 更新法律库
└── references/
    └── law_database/      # 本地法律文本
        ├── civil_law/     # 民法
        ├── commercial_law/# 商法
        ├── criminal_law/  # 刑法
        └── administrative/# 行政法
```

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| LS-001 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | 无 |
| LS-002 | 收集整理基础法律法规文本 | 4h | LS-001 |
| LS-003 | 实现 build_index.py（构建全文索引） | 3h | LS-002 |
| LS-004 | 实现 search_local.py（本地检索） | 3h | LS-003 |
| LS-005 | 实现 update_laws.py（更新法律库） | 2h | LS-003 |
| LS-006 | 编写 SKILL.md 使用说明文档 | 1h | LS-004, LS-005 |
| LS-007 | 本地测试和调试 | 1h | LS-006 |
| LS-008 | 打包技能文件 | 0.5h | LS-007 |

**技术依赖**：
- Python 3.10+
- whoosh（全文检索引擎）
- beautifulsoup4（HTML 解析）

**环境变量**：无

---

### 第二阶段：增强技能（推荐）

#### 4.2.1 contract-review（合同审查技能）

**目标**：提供合同审查流程指导、风险检查清单、审查报告生成

**实现方式**：纯文档型 + 脚本辅助

**目录结构**：
```
contract-review/
├── SKILL.md
├── scripts/
│   ├── compare_versions.py    # 版本对比
│   └── extract_clauses.py     # 条款提取
└── references/
    ├── risk_checklist.md      # 风险检查清单
    ├── clause_library.md      # 条款库
    ├── review_template.md     # 审查报告模板
    └── contract_types/
        ├── sales_contract.md      # 买卖合同审查要点
        ├── service_contract.md    # 服务合同审查要点
        ├── lease_contract.md      # 租赁合同审查要点
        └── employment_contract.md # 劳动合同审查要点
```

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| CR-001 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | 第一阶段完成 |
| CR-002 | 编写风险检查清单（risk_checklist.md） | 2h | CR-001 |
| CR-003 | 编写条款库（clause_library.md） | 3h | CR-001 |
| CR-004 | 编写审查报告模板 | 1h | CR-001 |
| CR-005 | 编写各类合同审查要点（4类） | 4h | CR-001 |
| CR-006 | 实现 compare_versions.py | 2h | CR-001 |
| CR-007 | 实现 extract_clauses.py | 2h | CR-001 |
| CR-008 | 编写 SKILL.md 使用说明文档 | 1h | CR-002~CR-007 |
| CR-009 | 本地测试和调试 | 1h | CR-008 |
| CR-010 | 打包技能文件 | 0.5h | CR-009 |

**技术依赖**：
- Python 3.10+
- difflib（文本对比）
- 第一阶段技能（doc-reader, doc-writer）

**环境变量**：无

---

#### 4.2.2 case-search（案例检索技能）

**目标**：支持检索裁判文书案例（需对接第三方 API 或爬虫）

**实现方式**：纯脚本型（Python + API）

**目录结构**：
```
case-search/
├── SKILL.md
├── scripts/
│   ├── search_cases.py    # 案例检索
│   ├── get_detail.py      # 获取案例详情
│   └── analyze_case.py    # 案例分析
└── references/
    └── case_database.md   # 案例数据库说明
```

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| CS-001 | 调研案例检索 API 可用性 | 2h | 无 |
| CS-002 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | CS-001 |
| CS-003 | 实现 search_cases.py | 4h | CS-002 |
| CS-004 | 实现 get_detail.py | 2h | CS-003 |
| CS-005 | 实现 analyze_case.py | 3h | CS-004 |
| CS-006 | 编写 SKILL.md 使用说明文档 | 1h | CS-003~CS-005 |
| CS-007 | 本地测试和调试 | 1h | CS-006 |
| CS-008 | 打包技能文件 | 0.5h | CS-007 |

**技术依赖**：
- Python 3.10+
- requests（HTTP 请求）
- 第三方案例检索 API（待确定）

**环境变量**：
- `CASE_SEARCH_API_KEY`：案例检索 API 密钥
- `CASE_SEARCH_API_URL`：API 端点

---

#### 4.2.3 vector-store（本地知识库检索）

**目标**：基于向量数据库的本地知识库检索（RAG）

**实现方式**：纯脚本型（Python + 向量数据库）

**目录结构**：
```
vector-store/
├── SKILL.md
├── scripts/
│   ├── build_vector_index.py  # 构建向量索引
│   ├── search_similar.py      # 相似度检索
│   └── rag_query.py           # RAG 查询
└── references/
    └── knowledge_base/        # 知识库文档
```

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| VS-001 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | 无 |
| VS-002 | 实现 build_vector_index.py | 4h | VS-001 |
| VS-003 | 实现 search_similar.py | 3h | VS-002 |
| VS-004 | 实现 rag_query.py | 4h | VS-003 |
| VS-005 | 编写 SKILL.md 使用说明文档 | 1h | VS-002~VS-004 |
| VS-006 | 本地测试和调试 | 2h | VS-005 |
| VS-007 | 打包技能文件 | 0.5h | VS-006 |

**技术依赖**：
- Python 3.10+
- chromadb 或 faiss（向量数据库）
- sentence-transformers（文本嵌入）
- openai 或本地模型（可选，用于 RAG）

**环境变量**：
- `EMBEDDING_MODEL`：嵌入模型路径（可选）
- `VECTOR_DB_PATH`：向量数据库路径（可选）

---

### 第三阶段：优化技能（可选）

#### 4.3.1 law-search-api（法律检索技能 - API 版）

**目标**：对接商业法律数据库 API（北大法宝、威科先行等）

**实现方式**：扩展插件型（TypeScript）

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| LA-001 | 调研法律数据库 API（北大法宝、威科等） | 4h | 无 |
| LA-002 | 设计 API 适配层架构 | 2h | LA-001 |
| LA-003 | 实现北大法宝 API 适配器 | 4h | LA-002 |
| LA-004 | 实现威科先行 API 适配器 | 4h | LA-002 |
| LA-005 | 编写 SKILL.md 使用说明文档 | 1h | LA-003, LA-004 |
| LA-006 | 本地测试和调试 | 2h | LA-005 |
| LA-007 | 打包技能文件 | 0.5h | LA-006 |

**环境变量**：
- `PKULAW_API_KEY`：北大法宝 API 密钥
- `WOLTERS_API_KEY`：威科先行 API 密钥

---

#### 4.3.2 web-search-cn（国内网页搜索）

**目标**：支持百度、必应中国等国内搜索引擎

**实现方式**：纯脚本型（Python）

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| WS-001 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | 无 |
| WS-002 | 实现百度搜索接口 | 3h | WS-001 |
| WS-003 | 实现必应中国搜索接口 | 2h | WS-001 |
| WS-004 | 编写 SKILL.md 使用说明文档 | 1h | WS-002, WS-003 |
| WS-005 | 本地测试和调试 | 1h | WS-004 |
| WS-006 | 打包技能文件 | 0.5h | WS-005 |

**技术依赖**：
- Python 3.10+
- requests（HTTP 请求）
- beautifulsoup4（HTML 解析）

---

#### 4.3.3 template-manager（文书模板管理）

**目标**：法律文书模板的创建、编辑、版本管理

**实现方式**：纯脚本型（Python）

**开发任务**：

| 任务编号 | 任务描述 | 预计工时 | 依赖 |
|---------|---------|---------|------|
| TM-001 | 创建技能目录结构和 SKILL.md 模板 | 0.5h | 无 |
| TM-002 | 实现模板创建功能 | 2h | TM-001 |
| TM-003 | 实现模板编辑功能 | 2h | TM-002 |
| TM-004 | 实现模板版本管理 | 2h | TM-002 |
| TM-005 | 编写 SKILL.md 使用说明文档 | 1h | TM-002~TM-004 |
| TM-006 | 本地测试和调试 | 1h | TM-005 |
| TM-007 | 打包技能文件 | 0.5h | TM-006 |

---

## 五、技术依赖汇总

### 5.1 Python 包依赖

```toml
# pyproject.toml 或 requirements.txt

# 文档处理
pdfplumber = ">=0.10.0"      # PDF 解析
python-docx = ">=1.0.0"      # Word 文档
reportlab = ">=4.0.0"        # PDF 生成
jinja2 = ">=3.0.0"           # 模板引擎

# 全文检索
whoosh = ">=2.7.0"           # 全文检索引擎

# 向量检索
chromadb = ">=0.4.0"         # 向量数据库
sentence-transformers = ">=2.0.0"  # 文本嵌入

# 网络请求
requests = ">=2.28.0"        # HTTP 请求
beautifulsoup4 = ">=4.12.0"  # HTML 解析
```

### 5.2 系统依赖

| 依赖 | 用途 | 安装方式 |
|------|------|---------|
| Python 3.10+ | 运行脚本 | 系统安装 |
| uv | Python 包管理 | `pip install uv` |

---

## 六、技能安装位置

技能文件安装到用户目录：

```
~/.openclaw/skills/
├── doc-reader/
├── doc-writer/
├── law-search/
├── contract-review/
├── case-search/
├── vector-store/
└── ...
```

技能配置存储在：

```
~/.openclaw/openclaw.json
```

配置示例：

```json
{
  "skills": {
    "entries": {
      "law-search-api": {
        "env": {
          "PKULAW_API_KEY": "your-api-key"
        }
      },
      "case-search": {
        "env": {
          "CASE_SEARCH_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

---

## 七、开发时间估算

| 阶段 | 技能数量 | 预计工时 | 说明 |
|------|---------|---------|------|
| 第一阶段 | 3 个 | 25-30 小时 | 核心功能，必需完成 |
| 第二阶段 | 3 个 | 30-35 小时 | 增强功能，推荐完成 |
| 第三阶段 | 3 个 | 25-30 小时 | 优化功能，可选完成 |
| **总计** | **9 个** | **80-95 小时** | 约 2-3 周工作量 |

---

## 八、下一步行动

1. **确认开发优先级** - 是否按照第一阶段 → 第二阶段 → 第三阶段的顺序开发
2. **准备开发环境** - 安装 Python 3.10+、uv 包管理器
3. **开始第一阶段开发** - 从 doc-reader 技能开始

---

## 附录：参考资料

### A. OpenClaw 技能开发文档

- 技能创建指南：`node_modules/openclaw/skills/skill-creator/SKILL.md`
- 技能初始化脚本：`node_modules/openclaw/skills/skill-creator/scripts/init_skill.py`
- 技能打包脚本：`node_modules/openclaw/skills/skill-creator/scripts/package_skill.py`

### B. 现有技能参考

- PDF 处理：`node_modules/openclaw/skills/nano-pdf/`
- 视频处理：`node_modules/openclaw/skills/video-frames/`
- 飞书文档：`node_modules/openclaw/extensions/feishu/skills/feishu-doc/`

### C. 法律数据库 API

| 数据库 | 官网 | API 可用性 |
|--------|------|-----------|
| 北大法宝 | https://www.pkulaw.com | 有 API |
| 威科先行 | https://law.wkinfo.com.cn | 有 API |
| 法信 | https://www.faxin.cn | 有 API |
| 裁判文书网 | https://wenshu.court.gov.cn | 无官方 API |
