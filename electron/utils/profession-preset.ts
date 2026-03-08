/**
 * Profession Preset Service
 * Load and manage profession presets
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { app } from 'electron';
// NOTE: We intentionally re-declare the minimal Profession-related types
// here instead of importing from the renderer src/ tree, so that the
// electron tsconfig stays self-contained.
interface SceneSkill {
  slug: string;
  required: boolean;
  description?: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  content: string;
}

interface ProfessionScene {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  useCasesZh: string[];
  skills: SceneSkill[];
  promptTemplates: PromptTemplate[];
}

interface Profession {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  color: string;
  tag?: 'popular' | 'new' | '';
  estimatedSetupTime: number;
  scenes: ProfessionScene[];
  commonSkills: string[];
}

interface UserProfessionConfig {
  professionId: string;
  sceneId: string;
  appliedAt: string;
}
import { getSetting, setSetting, type AppSettings } from './store';
import { logger } from './logger';

/**
 * Resolve possible directories where profession JSON files may live.
 * Handles both packaged app and development mode.
 */
function getProfessionDirCandidates(): string[] {
  const candidates: string[] = [];

  if (app.isPackaged) {
    // Packaged: resources are under process.resourcesPath.  Try a few
    // common layouts used by electron-builder / asar-unpacked.
    candidates.push(
      join(process.resourcesPath, 'professions'),
      join(process.resourcesPath, 'resources', 'professions'),
      join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'professions'),
    );
  } else {
    // Development: JSON files live in the repo under /resources/professions.
    const appPath = app.getAppPath();
    candidates.push(
      join(appPath, 'resources', 'professions'),
      join(process.cwd(), 'resources', 'professions'),
      join(__dirname, '../../resources/professions'),
    );
  }

  // De-duplicate while preserving order
  return Array.from(new Set(candidates));
}

// ── Built-in fallback professions ─────────────────────────────────────────────

const builtinContentCreatorScenes: ProfessionScene[] = [
  {
    id: 'xiaohongshu-writer',
    name: 'Xiaohongshu Writer',
    nameZh: '小红书文案生成',
    description: 'Generate Xiaohongshu-style content with proper formatting and tags',
    descriptionZh: '生成小红书风格的文案，包含合适的格式和标签',
    icon: '📕',
    useCasesZh: [
      '输入产品或主题，自动生成小红书文案',
      '智能推荐热门标签和话题',
      '一键复制到小红书发布',
    ],
    skills: [
      { slug: 'web-browse', required: true, description: '搜索热门话题和趋势' },
      { slug: 'summarize', required: true, description: '整理和优化文案内容' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'xiaohongshu-product',
        name: 'Product Review',
        nameZh: '小红书种草文案',
        category: 'social',
        content:
          '请为以下产品/主题创作一篇小红书风格的种草文案：\n\n主题：{{topic}}\n产品特点：{{features}}\n目标人群：{{audience}}\n\n要求：\n1. 标题要吸引人，使用emoji\n2. 开头要有痛点或场景引入\n3. 内容真实自然，像朋友推荐\n4. 使用小红书常用语气和表达\n5. 结尾引导互动（点赞/收藏/评论）\n6. 推荐5-8个相关热门标签\n\n格式：\n标题：\n正文：\n标签：',
      },
      {
        id: 'xiaohongshu-lifestyle',
        name: 'Lifestyle Share',
        nameZh: '小红书生活分享',
        category: 'social',
        content:
          '请创作一篇小红书风格的生活分享文案：\n\n分享主题：{{topic}}\n关键要点：{{keyPoints}}\n\n要求：\n1. 标题有吸引力，带emoji\n2. 内容结构清晰，分段明确\n3. 语言亲切自然，有画面感\n4. 适当使用小红书流行语\n5. 结尾有互动引导\n6. 添加相关热门标签\n\n输出格式：\n📌 标题：\n\n📝 正文：\n\n🏷️ 推荐标签：',
      },
    ] as PromptTemplate[],
  },
  {
    id: 'douyin-script',
    name: 'Short Video Script',
    nameZh: '短视频脚本生成（抖音等）',
    description: 'Generate hook-driven short video scripts with shooting notes',
    descriptionZh: '面向抖音/快手/视频号的短视频脚本与镜头拆分',
    icon: '🎬',
    useCasesZh: [
      '根据产品或选题生成 15-60 秒短视频脚本',
      '自动拆分镜头、旁白、字幕与画面提示',
      '为同一主题生成多个不同开头 hook 版本做 A/B 测试',
    ],
    skills: [
      { slug: 'web-browse', required: false, description: '按需查看平台热门话题与视频案例' },
      { slug: 'summarize', required: true, description: '提炼卖点并结构化输出脚本' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'douyin-product-script',
        name: 'Product Short Video',
        nameZh: '产品种草短视频脚本',
        category: 'video',
        content:
          '请为以下产品生成一条适合抖音/视频号的短视频脚本：\n\n产品/主题：{{topic}}\n核心卖点：{{selling_points}}\n目标受众：{{audience}}\n预期时长（秒）：{{duration}}\n\n要求：\n1. 给出 3 个不同方向的开头 hook 备选（每个 3-5 秒）\n2. 按“镜头编号 -> 画面 -> 旁白/台词 -> 时长预估”结构输出\n3. 语言风格贴近平台真实口语，适当使用网络表达但避免夸大宣传\n4. 预留字幕文案与屏幕文字提示\n5. 结尾包含点赞/关注/私信等行动引导\n\n请按如下格式输出：\n- 开头 Hook 备选\n- 脚本明细（镜头 1、镜头 2...）\n- 建议配乐/氛围说明（可选）',
      },
    ] as PromptTemplate[],
  },
  {
    id: 'multi-platform-repurpose',
    name: 'Content Repurposing',
    nameZh: '多平台内容改写分发',
    description: 'Repurpose one long-form content piece into multiple platform-specific posts',
    descriptionZh: '将一份长内容拆分改写为公众号、小红书、微博等多平台版本',
    icon: '🔁',
    useCasesZh: [
      '把一篇长篇文章改写为公众号长文 + 小红书图文 + 微博碎片内容',
      '从直播或访谈文字整理出多条社媒选题与文案',
      '统一规划一周内容排期并输出待发文案清单',
    ],
    skills: [
      { slug: 'summarize', required: true, description: '从长内容中抽取结构与要点' },
      { slug: 'web-browse', required: false, description: '按需参考各平台风格与热门话题' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'repurpose-longform',
        name: 'Repurpose Long Article',
        nameZh: '长文多平台改写',
        category: 'distribution',
        content:
          '以下是一份长内容，请帮我改写并拆分成多平台可直接发布的内容：\n\n原文类型：{{source_type}}\n原文内容：{{source_content}}\n目标平台：公众号、小红书、微博（可按需增减）\n\n请按如下结构输出：\n1. 公众号：\n   - 标题（3 个备选）\n   - 摘要（用于封面/摘要）\n   - 正文结构（分节标题 + 每节要点小结）\n2. 小红书：\n   - 标题（3 个备选，带 emoji）\n   - 正文（适配图文笔记风格，保留换行和表情）\n   - 推荐标签（不少于 8 个，带#）\n3. 微博：\n   - 可直接发送的短文案 3-5 条（适合多次发布），每条不超过限制字数\n\n整体要求：\n- 各平台文案风格需贴近真实用户表达，而不是硬广\n- 保持核心观点一致，但表达方式和节奏适配对应平台',
      },
    ] as PromptTemplate[],
  },
];

const builtinLawyerScenes: ProfessionScene[] = [
  {
    id: 'contract-review',
    name: 'Contract Review Assistant',
    nameZh: '合同审查助手',
    description: 'Structured contract review with risk spotting and revision suggestions',
    descriptionZh: '结构化审查合同条款，识别风险并给出修改建议',
    icon: '📄',
    useCasesZh: [
      '对新收到的合同进行通读审查，提炼关键条款与风险点',
      '根据既有合同模板或风控规则比对差异并给出修改建议',
      '针对特定条款（如违约责任、保密、竞业）进行单点深入分析',
    ],
    skills: [
      { slug: 'file-tools', required: true, description: '读取与管理本地合同文件（PDF / DOCX 等）' },
      { slug: 'summarize', required: true, description: '归纳合同结构与关键条款' },
      { slug: 'web-browse', required: false, description: '按需查询公开法律法规与判例' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'contract-quick-scan',
        name: 'Quick Risk Scan',
        nameZh: '快速风险扫描',
        category: 'review',
        content:
          '你是一名律师，请对以下合同进行快速风险扫描。\n\n合同背景：{{background}}\n委托方立场：{{client_side}}\n重点关注条款：{{focus_clauses}}\n\n请按照如下结构输出：\n1. 合同基本信息与结构概览\n2. 高风险条款列表（逐条列出，标明条款位置与风险点）\n3. 中风险条款列表\n4. 建议修改或补充的条款（给出现行表述与建议表述）\n5. 总体风险结论与签署建议',
      },
      {
        id: 'clause-deep-dive',
        name: 'Clause Deep Dive',
        nameZh: '重点条款深度分析',
        category: 'analysis',
        content:
          '请针对合同中的以下条款进行重点分析：\n\n条款原文：{{clause_text}}\n委托方立场：{{client_side}}\n适用场景：{{scenario}}\n\n分析要求：\n1. 用通俗语言解释条款含义\n2. 从委托方立场列出可能的法律 / 商务风险\n3. 说明该条款在常见市场实践中的通常写法\n4. 给出 1-2 个建议修改版本（标注“保守版 / 平衡版”）\n5. 列出需要与对方进一步沟通确认的问题',
      },
    ] as PromptTemplate[],
  },
  {
    id: 'legal-research',
    name: 'Legal Research',
    nameZh: '法律检索与要点整理',
    description: 'Search, aggregate and structure legal information for a given question',
    descriptionZh: '围绕具体法律问题进行多来源检索与要点整理',
    icon: '📚',
    useCasesZh: [
      '针对具体争议问题整理适用法条、司法解释与典型案例要点',
      '整理不同法院或地区在同类案件中的裁判思路差异',
      '为撰写法律意见书提供提纲与论证结构',
    ],
    skills: [
      { slug: 'web-browse', required: true, description: '检索公开的法律法规与案例信息' },
      { slug: 'summarize', required: true, description: '对长篇材料进行要点提炼与结构化总结' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'research-memo',
        name: 'Research Memo',
        nameZh: '检索备忘录结构',
        category: 'memo',
        content:
          '请围绕以下法律问题撰写一份“检索备忘录”草稿：\n\n问题概述：{{question}}\n涉及标的 / 金额 / 领域：{{context}}\n\n输出结构：\n1. 问题重述（用通俗语言概括 3-5 句话）\n2. 关键法律关系与争点拆分\n3. 适用法律法规条文列表（按层级分组）\n4. 代表性案例要点摘要（每案 3-5 行，包含裁判要点）\n5. 初步判断与论证思路（列出正反两种观点及支持理由）\n6. 后续需要补充查证的事项清单',
      },
    ] as PromptTemplate[],
  },
  {
    id: 'litigation-drafting',
    name: 'Litigation Drafting',
    nameZh: '诉讼文书起草',
    description: 'Draft statements of claim, defenses and other key pleadings',
    descriptionZh: '根据案情要点起草起诉状、答辩状等核心诉讼文书',
    icon: '📝',
    useCasesZh: [
      '根据律师口述或案情笔记生成起诉状初稿',
      '在既有起诉状基础上调整为答辩状结构与立场',
      '将一份散乱的事实材料整理为时间线与证据目录',
    ],
    skills: [
      { slug: 'summarize', required: true, description: '从案情材料中抽取时间线与关键事实' },
      { slug: 'file-tools', required: false, description: '读取本地案卷材料与证据文件' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'complaint-draft',
        name: 'Statement of Claim',
        nameZh: '起诉状草稿',
        category: 'draft',
        content:
          '请根据以下案情要点起草一份起诉状初稿（不含法院抬头和当事人信息模板）：\n\n案由：{{cause}}\n当事人关系与基本情况：{{parties}}\n事实与时间线：{{facts}}\n主要证据：{{evidence}}\n诉讼请求：{{claims}}\n\n请按如下结构输出正文：\n1. 事实与理由（按时间顺序分段撰写，并在关键节点标注证据编号）\n2. 法律依据（列出主要适用法条，并用自然语言解释适用逻辑）\n3. 结语（简要重申诉讼请求与法院应支持的理由）',
      },
      {
        id: 'defense-draft',
        name: 'Defense Brief',
        nameZh: '答辩状草稿',
        category: 'draft',
        content:
          '请根据以下信息起草一份答辩状初稿（不含法院与当事人抬头模板）：\n\n对方起诉状主要主张：{{plaintiff_claims}}\n我方基本立场：{{defendant_position}}\n我方掌握的关键事实与证据：{{defendant_facts}}\n\n输出结构：\n1. 对对方事实陈述的逐点回应（注明“同意 / 不完全同意 / 不予认可”等态度）\n2. 我方独立陈述的事实与证据（按时间线梳理）\n3. 法律依据与抗辩事由（分点列出，每点对应事实与证据）\n4. 结语与具体请求（如驳回全部 / 部分诉讼请求等）',
      },
    ] as PromptTemplate[],
  },
];

const builtinTeacherScenes: ProfessionScene[] = [
  {
    id: 'lesson-preparation',
    name: 'Lesson Preparation',
    nameZh: '备课教案助手',
    description: 'Generate structured lesson plans with clear objectives and activities',
    descriptionZh: '生成结构化教案，包含教学目标、重点难点与教学活动设计',
    icon: '📚',
    useCasesZh: [
      '根据课程大纲和教材章节生成完整教案',
      '设计课堂互动环节与讨论话题',
      '制作课后作业与测验题目',
    ],
    skills: [
      { slug: 'web-browse', required: false, description: '查找教学素材与案例' },
      { slug: 'summarize', required: true, description: '整理知识点与教学要点' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'lesson-plan',
        name: 'Lesson Plan Generator',
        nameZh: '教案生成器',
        category: 'teaching',
        content:
          '请为以下课程生成一份完整教案：\n\n学科：{{subject}}\n年级/学段：{{grade}}\n课题：{{topic}}\n课时：{{duration}}分钟\n教学目标：{{objectives}}\n\n请按如下结构输出：\n1. 教学目标（知识与技能、过程与方法、情感态度与价值观）\n2. 教学重点与难点\n3. 教学方法与手段\n4. 教学过程（导入、新授、练习、小结、作业布置）\n5. 板书设计\n6. 教学反思要点',
      },
      {
        id: 'teaching-activities',
        name: 'Classroom Activities',
        nameZh: '课堂活动设计',
        category: 'teaching',
        content:
          '请为以下教学内容设计课堂互动活动：\n\n课题：{{topic}}\n学生人数：{{student_count}}\n活动时长：{{activity_duration}}分钟\n活动目的：{{purpose}}\n\n请设计2-3个活动，每个活动包含：\n1. 活动名称与形式（小组讨论/角色扮演/游戏/竞赛等）\n2. 活动规则与流程\n3. 所需材料与准备\n4. 预期效果与评价方式',
      },
    ] as PromptTemplate[],
  },
  {
    id: 'academic-writing',
    name: 'Academic Writing',
    nameZh: '论文写作助手',
    description: 'Assist with academic paper structure, literature review, and argumentation',
    descriptionZh: '辅助学术论文结构搭建、文献综述与论证优化',
    icon: '📝',
    useCasesZh: [
      '根据研究方向生成论文提纲与框架',
      '优化论文的语言表达与学术规范',
      '辅助撰写文献综述与研究方法章节',
    ],
    skills: [
      { slug: 'web-browse', required: true, description: '检索学术文献与参考资料' },
      { slug: 'summarize', required: true, description: '提炼文献要点与研究结论' },
      { slug: 'file-tools', required: false, description: '读取本地论文草稿与参考文献' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'paper-outline',
        name: 'Paper Outline',
        nameZh: '论文提纲生成',
        category: 'research',
        content:
          '请为以下研究主题生成学术论文提纲：\n\n研究领域：{{field}}\n研究主题：{{topic}}\n研究类型：{{research_type}}（实证研究/理论研究/综述/案例分析）\n预期篇幅：{{word_count}}字\n\n请生成详细提纲，包含：\n1. 摘要框架（研究目的、方法、结论）\n2. 引言（研究背景、问题提出、研究意义）\n3. 文献综述（按主题或时间线组织）\n4. 研究方法（研究设计、数据来源、分析方法）\n5. 研究结果/论证过程\n6. 结论与讨论\n7. 主要参考文献类型建议',
      },
      {
        id: 'literature-review',
        name: 'Literature Review',
        nameZh: '文献综述撰写',
        category: 'research',
        content:
          '请协助撰写以下主题的文献综述：\n\n研究主题：{{topic}}\n已有文献要点：{{existing_literature}}\n综述目的：{{purpose}}\n\n请按以下要求撰写：\n1. 梳理该领域研究发展脉络\n2. 总结主要研究视角与理论框架\n3. 归纳研究方法与结论\n4. 指出现有研究的不足与空白\n5. 提出未来研究方向的展望\n\n语言要求：学术规范、逻辑清晰、引用规范',
      },
      {
        id: 'paper-polish',
        name: 'Paper Polish',
        nameZh: '论文润色修改',
        category: 'writing',
        content:
          '请对以下论文段落进行学术润色：\n\n学科领域：{{field}}\n原文段落：{{original_text}}\n修改重点：{{focus}}（语言表达/逻辑结构/学术规范）\n\n请提供：\n1. 润色后的段落\n2. 主要修改说明\n3. 进一步优化建议',
      },
    ] as PromptTemplate[],
  },
  {
    id: 'exam-question-bank',
    name: 'Question Bank Creator',
    nameZh: '题库出卷助手',
    description: 'Generate test questions and exams for various subjects and difficulty levels',
    descriptionZh: '根据教学进度生成各学科、各难度的试题与试卷',
    icon: '📋',
    useCasesZh: [
      '根据知识点生成选择题、填空题、简答题等',
      '按难度比例自动组卷',
      '生成参考答案与评分标准',
    ],
    skills: [
      { slug: 'summarize', required: true, description: '提炼知识点与考查要点' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'question-generator',
        name: 'Question Generator',
        nameZh: '试题生成器',
        category: 'exam',
        content:
          '请根据以下要求生成试题：\n\n学科：{{subject}}\n年级：{{grade}}\n知识点：{{knowledge_points}}\n题型要求：{{question_types}}（选择题/填空题/判断题/简答题/计算题/论述题）\n题目数量：{{count}}\n难度分布：{{difficulty}}（基础/中等/较难）\n\n请生成试题，每道题包含：\n1. 题目\n2. 选项（如适用）\n3. 正确答案\n4. 解析/评分要点',
      },
      {
        id: 'exam-paper',
        name: 'Exam Paper Builder',
        nameZh: '试卷组卷',
        category: 'exam',
        content:
          '请根据以下要求组卷：\n\n学科：{{subject}}\n考试类型：{{exam_type}}（单元测试/期中/期末/模拟考）\n考试时长：{{duration}}分钟\n总分：{{total_score}}\n考查范围：{{scope}}\n难度比例：基础{{easy}}% : 中等{{medium}}% : 较难{{hard}}%\n\n请按标准试卷格式输出，包含：\n1. 试卷标题与注意事项\n2. 各题型分值分布\n3. 完整试题\n4. 参考答案与评分标准（单独列出）',
      },
    ] as PromptTemplate[],
  },
];

const builtinResearcherScenes: ProfessionScene[] = [
  {
    id: 'deep-research',
    name: 'Deep Research',
    nameZh: '深度专题调研',
    description: 'Perform exhaustive web search and synthesize complex topics',
    descriptionZh: '对复杂话题进行详尽的网络搜索与信息合成',
    icon: '🔍',
    useCasesZh: [
      '对新兴技术或行业趋势进行全网扫描并总结',
      '对比不同产品的优缺点、价格与用户评价',
      '搜集特定主题的权威数据、论文或报道并整理成综述',
    ],
    skills: [
      { slug: 'web-browse', required: true, description: '全网检索最新信息' },
      { slug: 'summarize', required: true, description: '信息提炼与长文合成' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'research-report',
        name: 'Research Report',
        nameZh: '深度调研报告',
        category: 'research',
        content:
          '请针对以下主题进行深度调研并撰写报告：\n\n调研主题：{{topic}}\n侧重点：{{focus}}\n目标读者：{{audience}}\n\n要求：\n1. 首先搜索并列出至少 5-8 个高质量来源\n2. 总结当前该领域的核心现状与关键数据\n3. 分析主要的竞争格局或技术路径对比\n4. 识别未来的 3-5 个关键发展趋势\n5. 给出针对性的结论与建议\n\n请按专业的商业/技术报告格式输出，包含目录和要点总结。',
      },
    ] as PromptTemplate[],
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    nameZh: '竞品与市场分析',
    description: 'Track competitors and analyze market positioning',
    descriptionZh: '跟踪竞争对手动态并分析市场定位',
    icon: '📊',
    useCasesZh: [
      '监控竞争对手的最新动态、融资与产品更新',
      '分析目标市场的规模、增长率与主要玩家',
      '进行 SWOT 分析并提供市场进入策略建议',
    ],
    skills: [
      { slug: 'web-browse', required: true, description: '搜索竞品动态与市场报告' },
      { slug: 'summarize', required: true, description: '竞争情报提取' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'competitor-tracker',
        name: 'Competitor Tracker',
        nameZh: '竞品监控简报',
        category: 'analysis',
        content:
          '请帮我搜集并分析以下竞品的最新动态：\n\n竞品名称：{{competitor_names}}\n关注周期：最近{{period}}\n重点关注：{{focus_areas}}（如产品功能/定价/营销活动）\n\n输出要求：\n1. 各竞品最近的主要动作汇总\n2. 相比我方的优势与威胁分析\n3. 值得我们参考或警惕的地方\n4. 建议的应对策略',
      },
    ] as PromptTemplate[],
  },
];

const builtinProgrammerScenes: ProfessionScene[] = [
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    nameZh: '编程开发辅助',
    description: 'Code review, bug fixing, and documentation helper',
    descriptionZh: '代码审查、Bug 修复与文档起草助手',
    icon: '💻',
    useCasesZh: [
      '审查一段代码并提出性能、安全性与可读性优化建议',
      '根据一段代码逻辑自动生成相应的文档注释或 README',
      '解释复杂的算法或遗留代码库中的特定模块',
    ],
    skills: [
      { slug: 'summarize', required: true, description: '代码逻辑理解与总结' },
      { slug: 'file-tools', required: false, description: '读取本地源码文件' },
    ] as SceneSkill[],
    promptTemplates: [
      {
        id: 'code-review',
        name: 'Code Review',
        nameZh: '代码深度审查',
        category: 'dev',
        content:
          '请作为一名高级工程师，对以下代码进行深度审查：\n\n代码语言：{{language}}\n代码内容：\n{{code}}\n\n审查要求：\n1. 识别潜在的 Bug 或边界情况处理不当的地方\n2. 提出性能优化建议（算法复杂度、资源使用等）\n3. 检查代码规范与可读性（命名、结构、注释）\n4. 识别安全风险（注入、泄露等）\n5. 给出具体的修改后的代码片段',
      },
      {
        id: 'doc-generator',
        name: 'Doc Generator',
        nameZh: '技术文档生成',
        category: 'dev',
        content:
          '请根据以下代码逻辑，起草一份高质量的技术文档：\n\n代码内容：\n{{code}}\n文档类型：{{doc_type}}（API文档/模块说明/README/变更日志）\n\n要求：\n1. 清晰解释该模块/函数的核心功能与设计意图\n2. 详细列出输入输出参数、类型及含义\n3. 给出 1-2 个典型的使用示例代码\n4. 说明可能的错误码或异常处理方式\n5. 使用标准的 Markdown 格式输出',
      },
    ] as PromptTemplate[],
  },
];

const BUILTIN_PROFESSIONS: Profession[] = [
  {
    id: 'content-creator',
    name: 'Content Creator',
    nameZh: '自媒体创作者',
    description: 'Automated content creation and social media publishing',
    descriptionZh: '自动化内容创作和社交媒体发布',
    icon: '✍️',
    color: 'rose',
    tag: 'popular',
    estimatedSetupTime: 5,
    commonSkills: ['web-browse', 'summarize'],
    scenes: builtinContentCreatorScenes,
  },
  {
    id: 'researcher',
    name: 'Researcher / Analyst',
    nameZh: '调研员 / 分析师',
    description: 'Deep topic research, market analysis, and report synthesis',
    descriptionZh: '深度专题调研、市场情报跟踪与专业报告合成',
    icon: '🔎',
    color: 'emerald',
    tag: 'new',
    estimatedSetupTime: 10,
    commonSkills: ['web-browse', 'summarize'],
    scenes: builtinResearcherScenes,
  },
  {
    id: 'programmer',
    name: 'Software Developer',
    nameZh: '软件开发工程师',
    description: 'Code assistant, technical documentation, and code review',
    descriptionZh: '代码审查、技术文档编写与开发辅助助手',
    icon: '👨‍💻',
    color: 'cyan',
    estimatedSetupTime: 8,
    commonSkills: ['summarize', 'file-tools'],
    scenes: builtinProgrammerScenes,
  },
  {
    id: 'lawyer',
    name: 'Lawyer / Legal',
    nameZh: '律师 / 法务',
    description: 'Legal document drafting, contract review, and case research',
    descriptionZh: '面向律师与法务的合同审查、法律检索与文书起草助手',
    icon: '⚖️',
    color: 'indigo',
    estimatedSetupTime: 15,
    commonSkills: ['web-browse', 'summarize', 'file-tools'],
    scenes: builtinLawyerScenes,
  },
  {
    id: 'teacher',
    name: 'Teacher / Professor',
    nameZh: '教师 / 教授',
    description: 'Lesson planning, academic writing, and exam preparation',
    descriptionZh: '备课教案、论文写作与试题命制助手',
    icon: '🎓',
    color: 'blue',
    tag: 'popular',
    estimatedSetupTime: 5,
    commonSkills: ['web-browse', 'summarize', 'file-tools'],
    scenes: builtinTeacherScenes,
  },
];

const CUSTOM_PROFESSIONS_KEY: keyof AppSettings = 'professionCustomPresets';

async function loadCustomProfessions(): Promise<Profession[]> {
  try {
    const raw = await getSetting(CUSTOM_PROFESSIONS_KEY);
    if (!raw) return [];
    if (Array.isArray(raw)) {
      // Best-effort runtime validation; invalid entries are skipped
      return (raw as unknown[]).filter((item): item is Profession => {
        return !!item && typeof item === 'object' && typeof (item as Profession).id === 'string';
      });
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Load a profession definition from JSON file
 */
export async function loadProfession(id: string): Promise<Profession | null> {
  // 1) Check custom professions first so user overrides take precedence
  try {
    const custom = await loadCustomProfessions();
    const found = custom.find((p) => p.id === id);
    if (found) {
      return found;
    }
  } catch {
    // Ignore custom loading errors and fall back to bundled JSON
  }

  // 2) Fall back to bundled JSON file under resources/professions (multiple candidates)
  const dirs = getProfessionDirCandidates();
  for (const dir of dirs) {
    try {
      const filePath = join(dir, `${id}.json`);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as Profession;
    } catch {
      // Try next directory
    }
  }

  // 3) Fall back to in-memory built-in definitions
  const builtin = BUILTIN_PROFESSIONS.find((p) => p.id === id);
  return builtin ?? null;
}

/**
 * Load all available professions
 */
export async function loadAllProfessions(): Promise<Profession[]> {
  const professions: Profession[] = [];
  const seenIds = new Set<string>();
  const dirs = getProfessionDirCandidates();

  // 1) Load all bundled profession JSON files from candidate directories
  for (const dir of dirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        const id = entry.name.replace(/\.json$/, '');
        if (seenIds.has(id)) continue;
        const profession = await loadProfession(id);
        if (profession) {
          professions.push(profession);
          seenIds.add(id);
        }
      }
    } catch {
      // Directory might not exist in this layout; try next candidate.
      continue;
    }
  }

  // 2) Merge user-defined custom professions (overriding same-id bundled ones)
  try {
    const custom = await loadCustomProfessions();
    for (const p of custom) {
      const idx = professions.findIndex((bp) => bp.id === p.id);
      if (idx >= 0) {
        professions[idx] = p;
      } else {
        professions.push(p);
        seenIds.add(p.id);
      }
    }
  } catch {
    // Ignore custom loading errors
  }

  // 3) Ensure built-in professions are always available as a final fallback.
  for (const p of BUILTIN_PROFESSIONS) {
    if (!seenIds.has(p.id)) {
      professions.push(p);
      seenIds.add(p.id);
    }
  }

  return professions;
}

/**
 * Get user's current profession config
 */
export async function getUserProfessionConfig(): Promise<UserProfessionConfig | null> {
  return await getSetting('professionConfig') as UserProfessionConfig | null;
}

/**
 * Save user's profession config
 */
export async function saveUserProfessionConfig(config: UserProfessionConfig): Promise<void> {
  await setSetting('professionConfig', config);
  await setSetting('activeProfession', config.professionId);
}

/**
 * Apply a profession scene
 * This sets up the profession config but doesn't auto-install skills
 */
export async function applyProfessionScene(
  professionId: string,
  sceneId: string,
  skillSlugs?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const profession = await loadProfession(professionId);
    if (!profession) {
      return { success: false, error: 'Profession not found' };
    }

    const scene = profession.scenes.find(s => s.id === sceneId);
    if (!scene) {
      return { success: false, error: 'Scene not found' };
    }

    const config: UserProfessionConfig = {
      professionId,
      sceneId,
      appliedAt: new Date().toISOString(),
    };

    await saveUserProfessionConfig(config);

    // Best-effort automation: install and enable required skills and create
    // example cron jobs for the selected scene.  Errors here should not block
    // the basic profession config from being saved, so we log instead of
    // throwing.
    try {
      await autoSetupScene(profession, scene, skillSlugs);
    } catch (autoErr) {
      logger.warn('Failed to auto-setup profession scene:', autoErr);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Automatically install/enable skills and bootstrap simple cron jobs
 * for a given profession scene.
 */
async function autoSetupScene(
  profession: Profession,
  scene: Profession['scenes'][number],
  skillSlugs?: string[]
): Promise<void> {
  // 1) Install & enable required/selected skills (by slug)
  // If skillSlugs is provided, use it. Otherwise, fall back to scene's required skills.
  const targetSkillSlugs = skillSlugs || scene.skills.filter((s) => s.required).map((s) => s.slug);
  
  if (targetSkillSlugs.length > 0) {
    try {
      // Install (if available on ClawHub) and then enable the skills in Gateway
      // All operations are best-effort; individual failures are logged by main IPC handlers.
      for (const slug of targetSkillSlugs) {
        // Renderer will react to this event to perform install/enable via existing flows.
        // globalThis is typed loosely here to avoid adding Electron globals.
        const anyGlobal = globalThis as unknown as { mainWindow?: { webContents: { send: (ch: string, payload: unknown) => void } } };
        anyGlobal.mainWindow?.webContents.send('profession:auto-skill', { slug });
      }
    } catch (e) {
      logger.warn('Auto skill setup failed for scene', { professionId: profession.id, sceneId: scene.id, error: e });
    }
  }

  // 2) Create example cron jobs for some well-known scenes.
  try {
    const cronTasks: Array<{ name: string; message: string; schedule: string }> = [];

    if (profession.id === 'content-creator') {
      if (scene.id === 'xiaohongshu-writer') {
        cronTasks.push({
          name: '每日小红书选题灵感',
          schedule: '0 9 * * *',
          message: '请根据我最近一周的内容方向，给出 3 个适合今天发布的小红书选题，并附每个选题的标题与大纲。'
        });
      } else if (scene.id === 'douyin-script') {
        cronTasks.push({
          name: '每周短视频脚本规划',
          schedule: '0 10 * * 1',
          message: '请为本周规划 3 条与我定位相关的短视频脚本，每条包含标题、核心卖点和镜头拆分要点。'
        });
      }
} else if (profession.id === 'lawyer') {
      if (scene.id === 'legal-research') {
        cronTasks.push({
          name: '每周法律动态速览',
          schedule: '0 8 * * 1',
          message: '请每周整理过去一周与我业务方向相关的法律法规/典型案例要点，并按"法规更新 / 典型案例 / 实务影响"分栏输出。'
        });
      }
    } else if (profession.id === 'researcher') {
      if (scene.id === 'deep-research') {
        cronTasks.push({
          name: '每日行业趋势追踪',
          schedule: '0 9 * * *',
          message: '请帮我检索过去 24 小时内关于 AI 代理与大模型领域的 3 个重大新闻或技术突破，并简要说明其影响。'
        });
      }
    } else if (profession.id === 'programmer') {
      cronTasks.push({
        name: '每周技术债务回顾',
        schedule: '0 10 * * 5',
        message: '请帮我梳理本周我在代码库中标记的 TODO 或 FIXME 事项，并按优先级给出下周的清理建议。'
      });
    } else if (profession.id === 'teacher') {
      if (scene.id === 'lesson-preparation') {
        cronTasks.push({
          name: '每周备课提醒',
          schedule: '0 20 * * 0',
          message: '请帮我梳理下周课程的教学要点，根据教学进度生成下周课程的教案框架和重点提示。'
        });
      } else if (scene.id === 'academic-writing') {
        cronTasks.push({
          name: '每周论文写作进度',
          schedule: '0 9 * * 6',
          message: '请帮我总结本周论文写作进展，梳理已完成的部分和待完成的工作，并给出下周写作计划建议。'
        });
      }
    }

    for (const task of cronTasks) {
      const anyGlobal = globalThis as unknown as { mainWindow?: { webContents: { send: (ch: string, payload: unknown) => void } } };
      anyGlobal.mainWindow?.webContents.send('profession:auto-cron', task);
    }
  } catch (e) {
    logger.warn('Auto cron setup failed for scene', { professionId: profession.id, sceneId: scene.id, error: e });
  }
}

/**
 * Clear profession config
 */
export async function clearProfessionConfig(): Promise<void> {
  await setSetting('professionConfig', undefined as unknown as UserProfessionConfig | null);
  await setSetting('activeProfession', undefined as unknown as string | undefined);
}
