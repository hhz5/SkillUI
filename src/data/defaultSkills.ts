import { Skill } from '../types';

export const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'skill-code-reviewer',
    title: '代码审查与重构大师',
    description: '深度审查代码逻辑、安全隐患、性能瓶颈与架构设计，输出清晰的重构方案与对比代码。',
    icon: 'Code',
    category: 'coding',
    tags: ['代码审查', '重构', 'CleanCode', '性能优化'],
    rawSource: {
      type: 'text',
      content: `---
name: code-reviewer
description: 深度代码审查与重构专家
---
# Role: Senior Staff Software Engineer & Code Architect
你是一个顶级的资深软件架构师与代码重构大师。
请对用户提供的源代码进行多维度、深度的代码评审，包含：
1. 潜在 Bug 与逻辑边界漏洞
2. 架构异味与坏味道（Code Smells）
3. 性能瓶颈与时间/空间复杂度评估
4. 安全漏洞（XSS, Injection, Memory Leak 等）
5. 最终提供符合 Clean Code 规范的重构后代码以及详细改动说明。`,
    },
    systemInstruction: `你是一个顶级的资深软件架构师与代码重构大师。
请针对用户提交的源码和审查侧重，严格按以下结构输出 Markdown：
## 🔍 评审总结报告
- **代码健康分** (0-100)
- **核心优点** 与 **主要风险等级** (高/中/低)

## ⚠️ 发现的问题清单
按严重程度逐条列出，包括位置、问题描述与修复理由。

## ✨ 重构后的优化代码
给出完整的优化后代码，包含清晰的注释。

## 💡 进阶架构建议
提供长期的架构演进与最佳实践建议。`,
    uiSchema: {
      title: '代码审查与重构',
      subtitle: '输入源代码并指定审查标准，秒级获取资深架构师级别的评审报告',
      fields: [
        {
          id: 'language',
          name: '编程语言',
          label: '编程语言',
          type: 'select',
          defaultValue: 'typescript',
          required: true,
          options: [
            { label: 'TypeScript / JavaScript', value: 'typescript' },
            { label: 'Python', value: 'python' },
            { label: 'Go', value: 'go' },
            { label: 'Rust', value: 'rust' },
            { label: 'Java / Kotlin', value: 'java' },
            { label: 'C++ / C', value: 'cpp' },
            { label: 'SQL', value: 'sql' },
          ],
        },
        {
          id: 'source_code',
          name: '待审查代码与工程文件',
          label: '上传代码文件 / 工程文件 或 粘贴源码',
          type: 'file',
          accept: '.ts,.js,.py,.go,.rs,.java,.cpp,.sql,.json,.md,.txt',
          multiple: true,
          uploadPreset: 'document',
          placeholder: '// 在此粘贴或输入需要评审与重构的代码，或直接上传代码文件...',
          defaultValue: '',
          required: true,
          description: '支持直接拖入/上传代码源文件，或在下方在线编辑',
        },
        {
          id: 'review_focus',
          name: '审查侧重点',
          label: '重点关注维度',
          type: 'select',
          defaultValue: 'all',
          required: true,
          options: [
            { label: '全面全维度综合评审 (推荐)', value: 'all' },
            { label: '极致性能与算法优化', value: 'performance' },
            { label: '安全性与边界防御', value: 'security' },
            { label: '可读性与 Clean Code 重构', value: 'readability' },
          ],
        },
        {
          id: 'strict_mode',
          name: '严苛评审模式',
          label: '开启顶级大厂严苛规范检查 (Strict Mode)',
          type: 'switch',
          defaultValue: true,
          description: '开启后将按照顶级开源项目及一线大厂代码规范进行逐行细致推敲',
        },
      ],
      outputConfig: {
        renderType: 'markdown',
        suggestedActions: ['copy', 'download', 'rerun', 'fullscreen'],
        customLayout: 'split',
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    isFavorite: true,
    isBuiltIn: true,
    runCount: 18,
    sampleInputs: {
      language: 'typescript',
      review_focus: 'all',
      strict_mode: true,
    },
  },
  {
    id: 'skill-marketing-matrix',
    title: '多平台文案与爆款 SEO 矩阵工坊',
    description: '一键将产品核心卖点转化为小红书、推特/X、公众号、短视频口播脚本等多渠道定制文案。',
    icon: 'Wand2',
    category: 'writing',
    tags: ['营销文案', '小红书', 'SEO', '爆款矩阵'],
    rawSource: {
      type: 'text',
      content: `---
name: marketing-matrix
description: 全渠道爆款文案生成与增长专家
---
# Role: Chief Growth Officer & Viral Copywriter
你是一位精通消费者心理学与多平台算法逻辑的资深内容操盘手。
能够根据产品的核心卖点与目标受众，快速裂变为各平台针对性的爆款文案。`,
    },
    systemInstruction: `你是一位顶尖的增长文案操盘手。
请根据用户的产品名称、核心卖点、目标受众和所选渠道，生成极具吸引力和高转化率的多平台文案。
格式要求：
每个渠道单独成节，包含：
1. 🎯 【爆款标题库】（提供 3 个高点击率标题）
2. 📝 【正文精修版本】（排版舒适，合理穿插 Emoji 与空行）
3. 🏷️ 【推荐高频标签与话题】
4. 🚀 【行动号召 (Call to Action)】`,
    uiSchema: {
      title: '多渠道爆款文案生成器',
      subtitle: '输入产品与卖点，一键生成适应不同社交媒体平台的专业文案',
      fields: [
        {
          id: 'product_name',
          name: '产品/服务名称',
          label: '产品/服务名称',
          type: 'text',
          placeholder: '例如：极简番茄钟效率工具 / 智能降噪静音耳机',
          defaultValue: '',
          required: true,
        },
        {
          id: 'key_features',
          name: '核心卖点与特色',
          label: '核心亮点与价值主张',
          type: 'textarea',
          placeholder: '列出 2-4 个主要卖点或优势...',
          defaultValue: '',
          required: true,
        },
        {
          id: 'target_audience',
          name: '目标受众',
          label: '目标受众群体',
          type: 'text',
          placeholder: '如：独立开发者、效率工具爱好者、创作者',
          defaultValue: '',
          required: false,
        },
        {
          id: 'tone',
          name: '文案基调',
          label: '情感基调与语气',
          type: 'select',
          defaultValue: 'enthusiastic',
          required: true,
          options: [
            { label: '🔥 爆款种草 & 极具感染力', value: 'enthusiastic' },
            { label: '👔 专业严谨 & 深度商业洞察', value: 'professional' },
            { label: '✨ 极简高级 & 科技先锋感', value: 'minimalist' },
            { label: '💬 亲切幽默 & 朋友安利风', value: 'casual' },
          ],
        },
        {
          id: 'channels',
          name: '目标发布渠道',
          label: '目标分发平台',
          type: 'radio',
          defaultValue: 'all',
          options: [
            { label: '全渠道矩阵 (小红书 + 微信公众号 + X/推特 + 视频脚本)', value: 'all' },
            { label: '小红书种草专精', value: 'xiaohongshu' },
            { label: 'X / Twitter 独立开发推文', value: 'twitter' },
            { label: '短视频 60 秒口播黄金脚本', value: 'video' },
          ],
          required: true,
        },
      ],
      outputConfig: {
        renderType: 'markdown',
        suggestedActions: ['copy', 'download', 'rerun'],
        customLayout: 'split',
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    isFavorite: true,
    isBuiltIn: true,
    runCount: 26,
  },
  {
    id: 'skill-data-analyst',
    title: '智能数据洞察与 SQL 分析师',
    description: '输入杂乱数据或自然语言分析需求，自动生成精准 SQL 查询、统计洞察与结构化报表。',
    icon: 'BarChart',
    category: 'analysis',
    tags: ['数据分析', 'SQL', '统计洞察', 'BI报表'],
    rawSource: {
      type: 'text',
      content: `---
name: data-analyst
description: 资深数据分析师与 SQL 专家
---
# Role: Lead Data Scientist & Business Intelligence Architect
帮助用户解析业务数据、清洗结构，并编写高性能 SQL 与提炼核心业务决策洞察。`,
    },
    systemInstruction: `你是一位顶级数据分析师与 BI 专家。
请根据用户提供的业务场景、数据表结构或原始数据样本，完成：
1. 📊 核心业务指标定义与计算逻辑
2. 💻 优化后的标准 SQL 查询语句（带关键注释）
3. 📈 数据洞察推演（可能呈现的趋势、异常点与风险）
4. 🎯 3 条立即可落地的业务增长/改进建议`,
    uiSchema: {
      title: '数据洞察与 SQL 查询工坊',
      subtitle: '将业务分析问题转化为精准的数据报表和 SQL 执行方案',
      fields: [
        {
          id: 'scenario',
          name: '分析目标与数据文件',
          label: '上传业务数据文件 (CSV/JSON/TXT) 或 输入分析需求',
          type: 'file',
          accept: '.csv,.json,.xlsx,.txt,.md,.sql',
          multiple: true,
          uploadPreset: 'document',
          placeholder: '例如：统计过去 30 天每个用户的复购周期分布，或直接上传 CSV/JSON 数据文件...',
          defaultValue: '',
          required: true,
          description: '支持直接拖入 CSV/JSON 数据文件或在下方输入业务指标定义',
        },
        {
          id: 'database_type',
          name: '数据库类型',
          label: '目标数据库引擎',
          type: 'select',
          defaultValue: 'postgresql',
          options: [
            { label: 'PostgreSQL', value: 'postgresql' },
            { label: 'MySQL 8.0+', value: 'mysql' },
            { label: 'Snowflake / BigQuery', value: 'bigquery' },
            { label: 'ClickHouse', value: 'clickhouse' },
            { label: 'SQLite', value: 'sqlite' },
          ],
          required: true,
        },
        {
          id: 'schema_info',
          name: '数据表结构或样例',
          label: '相关数据表结构或字段说明 (可选)',
          type: 'code',
          language: 'sql',
          placeholder: 'users(id, created_at, channel);\norders(id, user_id, amount, status, created_at);',
          defaultValue: '',
          required: false,
        },
      ],
      outputConfig: {
        renderType: 'markdown',
        suggestedActions: ['copy', 'download', 'rerun'],
        customLayout: 'split',
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now() - 86400000 * 1.5,
    updatedAt: Date.now() - 86400000 * 1.5,
    isFavorite: false,
    isBuiltIn: true,
    runCount: 12,
  },
  {
    id: 'skill-api-tester',
    title: 'API Webhook 智能测试器与 Mock 生成',
    description: '支持配置与模拟外部 Webhook / REST 接口，具备默认 Gemini 智能模拟与直接外部请求双引擎切换能力。',
    icon: 'Globe',
    category: 'utilities',
    tags: ['API测试', 'Webhook', 'Mock', '接口调试'],
    rawSource: {
      type: 'text',
      content: `---
name: api-tester
description: 接口自动化测试与 Mock 数据引擎
endpoints:
  - name: 示例公网测试接口 (HTTPBin)
    url: https://httpbin.org/post
    method: POST
---
# Role: API Testing Engineer & Mock Architect`,
    },
    systemInstruction: `你是一个专业的 API 架构与测试专家。
当收到用户的 API 请求配置时，请深度分析该请求的报文设计、鉴权机制、数据格式是否合规。
并生成：
1. 完整标准 cURL 命令
2. 真实的模拟响应 JSON 数据（Mock Payload）
3. 常见异常状态码与边界测试用例建议`,
    detectedEndpoints: [
      {
        name: 'HTTPBin Echo 测试端点',
        url: 'https://httpbin.org/post',
        method: 'POST',
        description: '公网通用的 HTTP POST 请求回显测试服务',
      },
    ],
    hasExternalEndpoints: true,
    enginePreference: 'gemini', // Prefers Gemini AI engine by default as per requirements
    uiSchema: {
      title: 'API / Webhook 智能调试与 Mock',
      subtitle: '默认使用 AI 智能模拟与分析，亦可随时在引擎选项中切换为直接外部调用',
      fields: [
        {
          id: 'endpoint_url',
          name: '接口端点 URL',
          label: '接口地址 (Endpoint URL)',
          type: 'text',
          defaultValue: '',
          placeholder: 'https://api.example.com/v1/webhook',
          required: true,
        },
        {
          id: 'http_method',
          name: '请求方式',
          label: 'HTTP Method',
          type: 'select',
          defaultValue: 'POST',
          options: [
            { label: 'POST', value: 'POST' },
            { label: 'GET', value: 'GET' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
          ],
          required: true,
        },
        {
          id: 'request_body',
          name: '请求体 JSON',
          label: '请求 Payload (JSON)',
          type: 'code',
          language: 'json',
          defaultValue: '',
          required: false,
        },
        {
          id: 'auth_header',
          name: '鉴权 Bearer Token / Key',
          label: 'Authorization Token (可选)',
          type: 'text',
          placeholder: 'Bearer sk-test-xxx...',
          required: false,
        },
      ],
      outputConfig: {
        renderType: 'markdown',
        suggestedActions: ['copy', 'download', 'rerun'],
        customLayout: 'split',
      },
    },
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    isFavorite: false,
    isBuiltIn: true,
    runCount: 9,
  },
  {
    id: 'skill-pro-translator',
    title: '专业多语言母语级翻译与润色机',
    description: '超越机械直译，结合行业语境与文化背景，提供直译、意译、地道母语化 3 种版本及生词解析。',
    icon: 'MessageSquare',
    category: 'productivity',
    tags: ['多语言', '专业翻译', '母语润色', '跨文化'],
    rawSource: {
      type: 'text',
      content: `---
name: pro-translator
description: 跨文化专业本地化与母语级润色
---
# Role: Senior Localization Specialist & Native Proofreader`,
    },
    systemInstruction: `你是一位精通跨文化交流的顶级本地化专家与同声传译员。
请针对用户提交的原文，提供结构严谨的三重翻译对比：
1. 📖 **【专业严谨版】**：精准忠于原文，术语严密无歧义。
2. 🌟 **【地道母语版】**：符合目标语言本土日常/商务表达习惯，自然流畅。
3. 🎨 **【文采飞扬/文学润色版】**：提升修辞美感与表达张力。
4. 💡 **【核心术语与文化背景解析】**：拆解 2-3 个关键表达的选词考量。`,
    uiSchema: {
      title: '母语级多语言翻译与润色',
      subtitle: '多版本对照，助力论文、商务邮件、出海文案地道呈现',
      fields: [
        {
          id: 'target_language',
          name: '目标语言',
          label: '目标语言',
          type: 'select',
          defaultValue: 'English (US Native)',
          required: true,
          options: [
            { label: 'English (US Native 地道美式英语)', value: 'English (US Native)' },
            { label: 'English (Academic 学术论文级)', value: 'English (Academic)' },
            { label: '中文 (简体地道表达)', value: 'Simplified Chinese' },
            { label: '日本語 (ビジネス敬語 / 商务敬语)', value: 'Japanese' },
            { label: 'Français (法语商务与日常)', value: 'French' },
            { label: 'Deutsch (德语严谨表达)', value: 'German' },
            { label: 'Español (西班牙语)', value: 'Spanish' },
          ],
        },
        {
          id: 'source_text',
          name: '待翻译文档与文本',
          label: '上传待翻译文档附件 (MD/TXT/DOCX/PDF) 或 输入文本',
          type: 'file',
          accept: '.md,.txt,.pdf,.docx,.json',
          multiple: true,
          uploadPreset: 'document',
          placeholder: '粘贴需要翻译的文本段落、邮件草稿，或直接上传文档附件...',
          defaultValue: '',
          required: true,
          description: '支持直接拖入 Markdown/PDF/Word/TXT 文档，AI 自动提取原文并进行多版本对照翻译',
        },
        {
          id: 'domain_context',
          name: '行业领域上下文',
          label: '应用场景 / 行业背景',
          type: 'select',
          defaultValue: 'tech_saas',
          required: true,
          options: [
            { label: '💻 科技 SaaS / 软件出海 / 互联网', value: 'tech_saas' },
            { label: '👔 商务往来 / 客户邮件 / 合同洽谈', value: 'business' },
            { label: '📚 学术研究 / 论文发表 / 科技报告', value: 'academic' },
            { label: '🛍️ 跨境电商 / 营销种草 / 广告文案', value: 'marketing' },
            { label: '🎮 游戏剧情 / 动漫影视本地化', value: 'gaming' },
          ],
        },
      ],
      outputConfig: {
        renderType: 'markdown',
        suggestedActions: ['copy', 'download', 'rerun'],
        customLayout: 'split',
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now() - 86400000 * 0.5,
    updatedAt: Date.now() - 86400000 * 0.5,
    isFavorite: true,
    isBuiltIn: true,
    runCount: 35,
  },
  {
    id: 'skill-yingzao-poster',
    title: 'Yingzao · 营造（建筑与在地文化海报）',
    description: '把拍下的真实古建筑、民居、文化街区与器物照片，转成经过艺术指导与图文遮挡互动的中文编辑级海报。',
    icon: 'Sparkles',
    category: 'design',
    tags: ['古建筑', '营造', '视觉海报', '文化遗产', '图文咬合'],
    rawSource: {
      type: 'github',
      url: 'https://github.com/op7418/guizang-yingzao-skill',
      originalName: 'yingzao/SKILL.md',
      content: `---
name: yingzao
description: 东方古建筑与在地文化艺术指导排版海报引擎
---
# Role: Chinese Heritage Architectural Poster Director (营造艺术指导)
基于现场拍摄的真实建筑与器物照片，提炼结构构件（斗拱、飞檐、梁架、藻井），执行中文排版咬合与矿物色场生成。`,
    },
    systemInstruction: `你是一个顶级的东方古建筑与文化遗产艺术指导（Art Director）。
根据用户上传的真实古建筑/器物照片与配置参数，严格按照以下四域艺术指导体系生成专业设计方案与视觉规范：

## 🏛️ 1. 主体与材质诚实性 (Subject Authenticity)
- 严禁塑料感与过度平滑，保留木构风化裂纹、铁锔钉、砖石风化颗粒与岁月斑驳感。
- 强调木构榫卯咬合、飞檐出挑弧度与斗拱层叠关系。

## 🎨 2. 矿物色场与环境氛围 (Mineral Color Palette)
- 提取天然矿物颜料基调：朱砂 (#991B1B / #AC3C33)、生铁黑 (#18181B)、石青 (#1E3A8A)、石绿 (#166534)、泥金 (#D97706)。
- 背景与主体浑然一体，光影自然漫射。

## ✂️ 3. 图文咬合与空间深度 (Edge Occlusion & Typographic Interaction)
- 杜绝字与主体割裂的双居中孤岛感。
- 将中文大字标题（如「大同古城」「善化寺」「应县木塔」）穿插咬合于飞檐、脊兽或斗拱构件之后，形成明确的前后遮挡咬合关系。
- 辅以竖向印鉴朱砂印（如「营造」「晋地」）与梁架营造纪年元数据。

## 🎬 4. 3×3 视频分镜与视频模型提示词 (Camera Direction & AI Video Prompts)
- 提供 9 格运镜机位（低角仰拍推进、梁架微距平移、藻井向心回旋等）。
- 提供可直接交付视频生成模型（Kling / Runway / Sora）的专业英文提示词：
Prompt: Cinematic documentary shot of ancient Chinese wooden pagoda, intricate Dougong brackets and upturned flying eaves, weathering timber texture, golden hour soft natural light, slow low-angle push in, 8k resolution, photorealistic masterpiece, photogrammetry detail.`,
    uiSchema: {
      title: 'Yingzao · 营造 (建筑与在地文化海报) 交互界面',
      subtitle: '上传真实照片素材，智能配置四域艺术命题与图文空间咬合',
      fields: [
        {
          id: 'photos',
          name: '真实照片素材',
          label: '上传真实建筑 / 街区 / 器物照片',
          type: 'file',
          accept: 'image/*',
          multiple: true,
          uploadPreset: 'image',
          placeholder: '点击选择或将照片拖入此处...',
          required: true,
          description: '支持单张照片重绘，或上传同组多张照片融合成一个共同场景',
        },
        {
          id: 'subject_name',
          name: '地点与对象名',
          label: '建筑 / 殿名 / 地方对象名称',
          type: 'text',
          placeholder: '如：大同古城、善化寺藻井、应县木塔、沙棘美式...',
          defaultValue: '',
          required: true,
          description: '请提供已核实或照片可见的真实名称，避免凭空编造',
        },
        {
          id: 'aspect_ratio',
          name: '画幅比例',
          label: '海报画幅比例 (Aspect Ratio)',
          type: 'select',
          defaultValue: '3:4',
          required: true,
          options: [
            { label: '3:4 (经典竖版艺术海报，推荐)', value: '3:4' },
            { label: '1:1 (正方形典雅画幅)', value: '1:1' },
            { label: '16:9 (横版宽幅空间画卷)', value: '16:9' },
            { label: '4:3 (标准横向构图)', value: '4:3' },
            { label: '9:16 (手机壁纸/全屏海报)', value: '9:16' },
          ],
        },
        {
          id: 'interaction_style',
          name: '图文空间互动',
          label: '标题字与建筑空间互动方式',
          type: 'select',
          defaultValue: 'masking',
          required: true,
          options: [
            { label: '主体压字 / 边缘咬合遮挡 (打破平面感)', value: 'masking' },
            { label: '文字避让核心构件 / 留白穿插 (如避让藻井)', value: 'avoidance' },
            { label: '字压主体 / 纯净覆层', value: 'overlay' },
            { label: '侧轴非对称排版 (打破双居中孤岛)', value: 'asymmetric' },
          ],
          description: '拒绝无接触的两座孤岛，使标题字与真实飞檐、轮廓自然共边与掩映',
        },
        {
          id: 'multi_photo_mode',
          name: '多图融合模式',
          label: '多图场景重构模式',
          type: 'select',
          defaultValue: 'unified_scene',
          required: false,
          options: [
            { label: '重构为共享透视与光影的单一场景', value: 'unified_scene' },
            { label: '保留照片矩形与留白对比组照', value: 'photo_collage' },
          ],
          description: '当上传多张照片时生效，默认将各图主体重构进同一视觉世界',
        },
        {
          id: 'create_comparison',
          name: '对照拼图',
          label: '同时生成原图与海报对照图',
          type: 'switch',
          defaultValue: false,
          description: '开启后将在海报旁输出前后对比拼接图',
        },
        {
          id: 'expand_storyboard',
          name: '视频分镜扩展',
          label: '扩展生成 3×3 视频分镜与视频模型提示词',
          type: 'switch',
          defaultValue: false,
          description: '按海报视觉延展出 9 格运镜分镜，并附可直接交付视频模型的英文 Prompt',
        },
      ],
      outputConfig: {
        renderType: 'poster',
        suggestedActions: ['download', 'compare', 'copy', 'fullscreen', 'rerun'],
        customLayout: 'split',
        posterConfig: {
          theme: 'architectural',
          defaultAspect: '3:4',
          brandColor: '#AC3C33',
          showComparison: true,
          showStoryboard: true,
        },
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
    isBuiltIn: true,
    runCount: 48,
  },
  {
    id: 'skill-guizang-social-card',
    title: 'Guizang · 社交卡片与封面工坊 (Social Card Skill)',
    description: '将长文、笔记、脚本、截图与实拍，生成高质感小红书 3:4 轮播卡片套图、微信公众号 21:9+1:1 封面对与实况动效卡。',
    icon: 'Layers',
    category: 'design',
    tags: ['小红书图文', '瑞士国际风格', '杂志风', '微信封面', '实况卡片'],
    rawSource: {
      type: 'github',
      url: 'https://github.com/op7418/guizang-social-card-skill',
      originalName: 'social-card/SKILL.md',
      content: `---
name: guizang-social-card-skill
description: 社交媒体轮播卡片套图、微信公众号封面对与实况动效卡生成
---
# Role: Senior Art Director & Visual Design Architect (社交卡片视觉总监)
基于瑞士国际主义网格与杂志编辑叙事风，将长文与观点转化为极具吸引力的小红书 3:4 轮播套图或微信公众号封面。`,
    },
    systemInstruction: `你是一个顶尖的社交媒体视觉设计总监（Art Director）与信息架构专家。
你的任务是将用户的文章、长文、笔记或脚本，转化为结构清晰、视觉冲击力强、设计感拉满的社交卡片方案。

请严格根据选择的设计系统（Swiss 或 Editorial）和色彩主题生成完整方案：
1. 📇 封面大字卡（Hook Title + 核心命题 + 视觉锚点）
2. 📄 观点与证据内页（清晰层级 + 事实数据 + 引言或对比）
3. 📋 末页行动复盘清单（CheckList + 收藏驱动引导）
4. 💡 配色规范与排版参数建议（Swiss 严谨网格或 Editorial 呼吸留白）`,
    uiSchema: {
      title: '社交卡片与实况封面工作台',
      subtitle: '输入长文或选题，自动规划 3:4 轮播套卡、微信公众号封面对与实况动效卡',
      fields: [
        {
          id: 'source_text',
          name: '待转化文章与文档附件',
          label: '上传待转化文章 / 文档 / 笔记附件 或 粘贴长文',
          type: 'file',
          accept: '.md,.txt,.pdf,.docx,.json,image/*',
          multiple: true,
          uploadPreset: 'document',
          placeholder: '在此粘贴长文、深度文章、播客脚本、产品评测、经验笔记，或直接上传文档附件...',
          defaultValue: '',
          required: true,
          description: '支持上传 Markdown/PDF/TXT/Word 研报或实拍配图，AI 自动提炼核心论据并生成高质量卡片套图',
        },
        {
          id: 'target_platform',
          name: '交付平台与版式',
          label: '输出目标与版式规格',
          type: 'select',
          defaultValue: 'xhs_deck',
          required: true,
          options: [
            { label: '小红书 3:4 轮播卡片套图 (1080×1440, 封面+观点内页+复盘清单)', value: 'xhs_deck' },
            { label: '微信公众号封面套件 (21:9 宽屏主封面 + 1:1 正方形分享头图)', value: 'wechat_covers' },
            { label: '实况照片动态卡 (Live Photo 3-5秒动效卡 / 实况拼图)', value: 'live_photo' },
            { label: '产品截图评测卡 (适合 App/教程/数据展示)', value: 'screenshot_post' },
          ],
          description: '根据发布平台适配专属像素比例与留白安全区 (Safe Area)',
        },
        {
          id: 'style_system',
          name: '视觉设计系统',
          label: '视觉设计系统模式',
          type: 'select',
          defaultValue: 'swiss',
          required: true,
          options: [
            { label: '瑞士国际主义风格 (Swiss - 严谨网格 / 单色重锚 / 强对比)', value: 'swiss' },
            { label: '杂志编辑叙事风 (Editorial - 优雅衬线 / 呼吸留白 / 生活志质感)', value: 'editorial' },
          ],
          description: 'Swiss 适合科技、认知与方法论；Editorial 适合生活、人文与深度思考',
        },
        {
          id: 'color_theme',
          name: '色彩主题',
          label: '预设主题色彩 (Theme Palette)',
          type: 'select',
          defaultValue: 'ikb_blue',
          required: true,
          options: [
            { label: '克莱因蓝 (IKB Blue #002FA7) - 瑞士科技与前沿', value: 'ikb_blue' },
            { label: '荧光柠檬黄 (Lemon Yellow #D6FF00) - 高能警示与活力', value: 'lemon_yellow' },
            { label: '国际安全橙 (Safety Orange #FF5500) - 醒目聚焦', value: 'safety_orange' },
            { label: '玄墨经典 (Ink Classic) - 商务评论与理性思辨', value: 'ink_classic' },
            { label: '青花霁蓝 (Indigo Porcelain) - 科技数据与清雅分析', value: 'indigo_porcelain' },
            { label: '山野苍林 (Forest Ink) - 户外徒步与自然生活', value: 'forest_ink' },
            { label: '大地牛皮纸 (Kraft Paper) - 质感复古与读书笔记', value: 'kraft_paper' },
          ],
        },
        {
          id: 'media_assets',
          name: '配图与截图素材',
          label: '上传真实配图 / 产品截图素材',
          type: 'file',
          accept: 'image/*',
          multiple: true,
          uploadPreset: 'image',
          placeholder: '点击或拖拽上传一张或多张真实截图或照片...',
          required: false,
          description: '强烈建议上传真实截图或实拍图作为事实依据层，拒绝 AI 虚假质感',
        },
        {
          id: 'video_asset',
          name: '实况视频素材',
          label: '上传实况照片短视频 (可选)',
          type: 'file',
          accept: 'video/*',
          multiple: false,
          placeholder: '上传 3-5 秒屏幕录像或实拍短视频...',
          required: false,
          description: '用于生成带 LIVE 标识的动态卡片 (小红书支持 5s，微信建议 3s)',
        },
        {
          id: 'rednote_category',
          name: '小红书类目',
          label: '小红书笔记类目定位',
          type: 'select',
          defaultValue: 'tech',
          options: [
            { label: '科技与产品评测 (Tech / Review)', value: 'tech' },
            { label: '旅行与户外探店 (Travel / Outdoor)', value: 'travel' },
            { label: '职场思维与方法论 (Workplace / Thinking)', value: 'workplace' },
            { label: '推荐好物与开箱 (Recommendation / Unbox)', value: 'recommend' },
            { label: '家居与设计生活 (Home / Design)', value: 'home' },
            { label: '美食食谱与教程 (Food / Recipe)', value: 'food' },
            { label: '穿搭精选与胶囊衣橱 (Outfit / Capsule)', value: 'outfit' },
          ],
        },
        {
          id: 'page_count',
          name: '规划卡片页数',
          label: '期望卡片套图页数',
          type: 'select',
          defaultValue: '4',
          options: [
            { label: '4 页精炼套卡 (封面 + 2 论据页 + 1 复盘清单)', value: '4' },
            { label: '6 页完整套卡 (封面 + 4 深度页 + 1 复盘清单)', value: '6' },
            { label: '8 页长篇干货 (封面 + 6 维度展开 + 1 复盘清单)', value: '8' },
            { label: '仅制作首图封面 (1 页大字钩子)', value: '1' },
          ],
        },
        {
          id: 'include_summary_card',
          name: '末页行动清单',
          label: '包含末页复盘与行动清单卡',
          type: 'switch',
          defaultValue: true,
          description: '自动在末页生成结构化 CheckList 清单，提升收藏率与复用价值',
        },
      ],
      outputConfig: {
        renderType: 'social-cards',
        suggestedActions: ['download', 'compare', 'copy', 'fullscreen', 'rerun'],
        customLayout: 'split',
        socialCardsConfig: {
          defaultPlatform: 'xhs_deck',
          defaultStyle: 'swiss',
          defaultTheme: 'ikb_blue',
          pageCount: 4,
        },
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
    isBuiltIn: true,
    runCount: 62,
    sampleInputs: {
      source_text: `AI Agent 时代的产品范式重构：为什么我们不再需要复杂的单体控制台？

核心观点：
1. 传统 SaaS 的层级菜单黄昏：78% 的功能常年闲置，用户被困在复杂表单与跨工具跳转中。
2. 意图自适应 UI 的兴起：从“用户学习软件”转变为“软件理解意图并在运行时自装配界面”。
3. 沉浸式单一任务专注：每一次交互都直击核心，拒绝无意义的视觉噪声与功能堆砌。
4. 生产力工具的终极形态：从臃肿的巨石应用，进化为即用即走、随需而生的轻量智能微构件。`,
      target_platform: 'xhs_deck',
      style_system: 'swiss',
      color_theme: 'ikb_blue',
      rednote_category: 'tech',
      page_count: '4',
      include_summary_card: true,
    },
  },
  {
    id: 'skill-guizang-ppt-deck',
    title: 'Guizang · Web-native PPT 演示文稿工坊 (Web Deck Skill)',
    description: '将文档、大纲或素材提炼为高密度事实、瑞士国际风格与杂志风的 Web 原生单文件幻灯片，自带演讲者模式。',
    icon: 'Sliders',
    category: 'design',
    tags: ['Web幻灯片', '瑞士风格', '演讲者模式', '单文件HTML', '高事实密度'],
    rawSource: {
      type: 'github',
      url: 'https://github.com/op7418/guizang-ppt-skill',
      originalName: 'ppt-deck/SKILL.md',
      content: `---
name: guizang-ppt-skill
description: Web 原生瑞士排版与杂志风 PPT 演示文稿生成
---
# Role: Principal Presentation Designer & Information Architect
将复杂的业务大纲、深度研报、融资 Pitch 或技术演讲提炼为单文件 HTML Web 幻灯片，融合高密度数据、瑞士严谨排版与沉浸式演讲者视图。`,
    },
    systemInstruction: `你是一个顶级的 Presentation Designer（演示文稿设计师）与信息架构专家。
你的任务是将用户提供的大纲、文档或主题，提炼并生成一套专业的、高事实密度的 Web-native 演示文稿方案。

请严格根据以下要求输出完整的 PPT 页面架构：
1. 🎯 封面与主论点（Cover Slide）
2. 📊 核心数据与事实依据页（Data & Facts）
3. 📐 架构与方法论拆解页（Architecture & Method）
4. ⚡ 案例与实战对比页（Case Studies）
5. 🚀 总结与落地行动页（Action & Takeaway）
6. 🎙️ 演讲者备注提纲（Speaker Notes 与每页逐字稿要点）`,
    uiSchema: {
      title: 'Web-native 演示文稿 (PPT Deck) 工作台',
      subtitle: '输入主题大纲或上传研报附件，生成瑞士国际主义与高事实密度的 Web 原生演示文稿',
      fields: [
        {
          id: 'topic_or_outline',
          name: '演讲大纲与参考研报',
          label: '上传演讲大纲 / 研报文档 / 原始材料附件 或 粘贴提纲',
          type: 'file',
          accept: '.md,.txt,.pdf,.docx,.json,image/*',
          multiple: true,
          uploadPreset: 'document',
          placeholder: '在此输入演讲主题、核心论点、汇报大纲，或直接上传研报/文档附件...',
          defaultValue: '',
          required: true,
          description: '支持上传 Word、PDF、Markdown 研报或大纲文件，AI 将全自动提取事实依据并生成 Web 幻灯片',
        },
        {
          id: 'deck_style',
          name: '幻灯片视觉风格',
          label: '视觉风格体系 (Presentation Style)',
          type: 'select',
          defaultValue: 'style_b_swiss',
          required: true,
          options: [
            { label: '风格 B：瑞士国际主义高密度事实 (Swiss Facts & Grid)', value: 'style_b_swiss' },
            { label: '风格 A：现代杂志叙事风 (Editorial Magazine)', value: 'style_a_editorial' },
            { label: '风格 C：暗黑极客先锋 (Cyber Dark Minimal)', value: 'style_c_dark' },
          ],
          description: '瑞士风格强调不对称网格与单色重锚；杂志风格强调优雅衬线与叙事呼吸',
        },
        {
          id: 'theme_color',
          name: '主题主色调',
          label: '品牌/主色系 (Primary Accent)',
          type: 'select',
          defaultValue: 'ikb_blue',
          required: true,
          options: [
            { label: '克莱因蓝 (IKB Blue #002FA7) - 理性科技与权威', value: 'ikb_blue' },
            { label: '国际安全橙 (Safety Orange #FF5500) - 醒目聚焦与活力', value: 'safety_orange' },
            { label: '玄铁墨黑 (Ink Black #18181B) - 高端商务与极简', value: 'ink_black' },
            { label: '青花瓷蓝 (Porcelain Blue #1D4ED8) - 结构严谨与数据分析', value: 'porcelain_blue' },
            { label: '冷翠深绿 (Emerald Forest #065F46) - 商业洞察与生态', value: 'emerald_forest' },
          ],
        },
        {
          id: 'duration_pages',
          name: '规划幻灯片页数',
          label: '演讲时长与预期页数',
          type: 'select',
          defaultValue: '16',
          required: true,
          options: [
            { label: '8 页精简快讲 (5-10 分钟 Flash Pitch)', value: '8' },
            { label: '16 页标准深度演讲 (15-25 分钟 Standard Deck)', value: '16' },
            { label: '24 页完整方案与研报交付 (30-45 分钟 Comprehensive)', value: '24' },
          ],
        },
        {
          id: 'audience_scenario',
          name: '汇报场景与受众',
          label: '受众与演讲场景',
          type: 'select',
          defaultValue: 'conference',
          options: [
            { label: '行业峰会 / Keynote 主题演讲', value: 'conference' },
            { label: '投资人路演 / Pitch Deck', value: 'investor' },
            { label: '企业内部战略汇报 / OKR 复盘', value: 'internal_strategy' },
            { label: '产品发布会 / Demo Day', value: 'product_launch' },
            { label: '技术分享 / 架构深潜 (Tech Deep Dive)', value: 'tech_share' },
          ],
        },
        {
          id: 'include_speaker_notes',
          name: '包含演讲者备忘录与逐字稿',
          label: '生成演讲者模式备忘录 (Speaker Notes)',
          type: 'switch',
          defaultValue: true,
          description: '为每页生成 30-60 秒的口播要点、递进逻辑与关键包袱提纲',
        },
        {
          id: 'source_documents',
          name: '参考研报或大纲文档',
          label: '上传参考研报 / 提纲文件 (可选)',
          type: 'file',
          accept: '.txt,.md,.pdf,.json',
          multiple: true,
          placeholder: '点击或拖拽上传研报、大纲文档或文字资料...',
          required: false,
          description: '系统将自动提取文档内容并融合进幻灯片知识库',
        },
        {
          id: 'media_assets',
          name: '图表与真实配图素材',
          label: '上传真实产品截图 / 图表素材 (可选)',
          type: 'file',
          accept: 'image/*',
          multiple: true,
          uploadPreset: 'image',
          placeholder: '上传真实截图或架构图...',
          required: false,
          description: '嵌入真实事实图表，避免空洞',
        },
      ],
      outputConfig: {
        renderType: 'web-deck',
        suggestedActions: ['download', 'fullscreen', 'compare', 'copy', 'rerun'],
        customLayout: 'split',
        deckConfig: {
          defaultStyle: 'style_b_swiss',
          defaultTheme: 'ikb_blue',
          durationPages: 16,
          speakerNotes: true,
        },
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
    isBuiltIn: true,
    runCount: 53,
    sampleInputs: {
      topic_or_outline: `AI Agent 时代的产品范式重构：从单体 SaaS 到意图自适应交互

核心论点：
1. 传统 SaaS 的层级菜单黄昏：78% 的功能常年闲置，用户被困在复杂表单与跨工具跳转中。
2. 瑞士国际主义排版与高密度事实设计：严谨网格、留白呼吸、单色重锚、证据为骨。
3. Web 原生单文件演示文稿交付：无需庞大客户端，浏览器双击即讲，内置双屏演讲者模式与完整讲稿提纲。
4. 自适应流式生成：从文档与素材附件一键萃取演讲主干，全流程生产级交付。`,
      deck_style: 'style_b_swiss',
      theme_color: 'ikb_blue',
      duration_pages: '16',
      audience_scenario: 'conference',
      include_speaker_notes: true,
      source_documents: [],
      media_assets: [],
    },
  },
  {
    id: 'skill-brand-style-ui',
    title: '品牌设计系统与 Web/iOS 界面生成工坊',
    description: '选择品牌视觉语言 (Stripe, Linear, Apple, 飞书, 国色风雅)，一键生成生产级 HTML/Tailwind 页面与 iOS 原型，并在实时沙箱中多端交互。',
    icon: 'PenTool',
    category: 'design',
    tags: ['Web界面', 'UI组件', '品牌风格', 'HTML沙箱', 'iOS原型'],
    rawSource: {
      type: 'text',
      content: `---
name: brand-style-ui
description: 品牌设计系统与 Web/iOS 界面 HTML 实时生成
---
# Role: Principal UI/UX Architect & Design Systems Lead
根据指定的顶尖品牌设计语言（如 Stripe 极简科技渐变、Linear 先锋暗黑、Apple 晶莹质感、飞书高效商务、中国传统国色），将业务需求与文案转化为高质量、现代高保真的单文件 HTML 网页界面或 iOS App 原型。`,
    },
    systemInstruction: `你是一位顶尖的 UI/UX 架构师与设计系统负责人。
你的任务是将用户的业务文案、功能卖点与需求，结合所选的品牌视觉设计规范，输出一段结构完整、美观现代且可直接在浏览器沙箱中完美呈现的单文件 HTML 代码（必须使用 \`\`\`html ... \`\`\` 代码块包裹）。

交付要求：
1. 采用 Tailwind CSS 工具类、Plus Jakarta Sans / Inter 字体排版与 FontAwesome 图标。
2. 构建清晰的信息层级：包含 Brand Navigation、强视觉冲力的 Hero 核心转化区、特性卡片组、数据指标卡与 Call-to-Action 行动区。
3. 在 \`\`\`html 代码块之后，提供简明扼要的【视觉设计系统规范】与【色彩及排版说明】。`,
    uiSchema: {
      title: '品牌风格与 Web/iOS 界面工作台',
      subtitle: '选择品牌设计语言与界面形态，输入业务文案，一键生成生产级 HTML 代码并在沙箱中实时交互',
      fields: [
        {
          id: 'brand_style',
          name: '品牌设计语言',
          label: '品牌视觉风格体系 (Brand Style)',
          type: 'select',
          defaultValue: 'stripe_minimal',
          required: true,
          options: [
            { label: 'Stripe 现代科技 (优雅网格渐变 / 极简排版 / 微投影)', value: 'stripe_minimal' },
            { label: 'Linear 先锋暗黑 (Cyber Dark / 精准边框高光 / 快捷指示)', value: 'linear_dark' },
            { label: 'Apple 极致纯粹 (精致磨砂玻璃 / 严谨留白 / SF Pro 排版)', value: 'apple_refined' },
            { label: '飞书/字节高效商务 (高信息密度 / 协同模块 / 亲和力蓝彩)', value: 'feishu_business' },
            { label: '中国传统国色风雅 (矿物朱砂 / 黛蓝 / 东方典雅意境)', value: 'chinese_tradition' },
            { label: 'Tailwind 现代 SaaS (高转化 Hero / 特性矩阵 / 交互卡片)', value: 'tailwind_saas' },
            { label: 'iOS 18 拟态质感 (圆润大倒角 / 触觉反馈卡片 / 紧凑列表)', value: 'ios_native' },
          ],
          description: 'AI 将严格根据所选品牌的调色板、圆角率、边框与排版节奏组织界面',
        },
        {
          id: 'target_ui_type',
          name: '交付界面形态',
          label: '界面形态规格 (UI Type)',
          type: 'select',
          defaultValue: 'web_landing',
          required: true,
          options: [
            { label: 'Web 响应式 Landing Page 落地页 (Hero 头部 + 核心亮点卡片 + CTA 转化区)', value: 'web_landing' },
            { label: 'iOS App 移动端单屏界面 (iPhone 390px 尺寸, 状态栏 + 卡片列表 + 底部操作栏)', value: 'ios_screen' },
            { label: '设计系统组件规范卡 (包含调色板色卡 + 按钮状态 + 卡片变体 + 字体阶梯)', value: 'design_system_cards' },
            { label: '交互式业务分析仪表盘 (Dashboard - 统计指标 + 图表卡片 + 动态列表)', value: 'analytics_dashboard' },
          ],
          description: '决定生成的 HTML 结构、画布比例与容器响应式断点',
        },
        {
          id: 'source_content',
          name: '界面文案与需求材料',
          label: '上传需求文档 / 业务文案附件 或 粘贴内容',
          type: 'file',
          accept: '.md,.txt,.pdf,.docx,.json,image/*',
          multiple: true,
          uploadPreset: 'document',
          placeholder: '在此粘贴或输入需要呈现在界面上的产品名称、核心卖点、功能描述、数据指标，或直接上传文档附件...',
          defaultValue: `SkillUI 智能技能工作台：一键将 Markdown 与 API 规则转化为极致体验的生产力工具。\n\n核心亮点：\n1. 零配置自动装配界面：从 Skill 规则自动反射表单与结果卡片\n2. 瑞士国际主义高质感排版：克莱因蓝与高密度事实设计\n3. 本地优先安全架构：零后端数据库依赖，数据 100% 保存在用户本地浏览器`,
          required: true,
          description: '支持上传文档附件，AI 自动提取事实文案并融合进生成的界面中',
        },
        {
          id: 'theme_color',
          name: '主题主色系',
          label: '品牌主色调 (Primary Accent)',
          type: 'select',
          defaultValue: 'indigo_modern',
          options: [
            { label: '极光紫蓝 (Indigo Modern #6366F1)', value: 'indigo_modern' },
            { label: '克莱因蓝 (IKB Blue #002FA7)', value: 'ikb_blue' },
            { label: '荧光柠檬黄 (Lemon Yellow #D6FF00)', value: 'lemon_yellow' },
            { label: '翡翠深绿 (Emerald #10B981)', value: 'emerald' },
            { label: '朱砂赤红 (Vermilion #AC3C33)', value: 'vermilion' },
            { label: '极简纯黑白 (Monochrome Noir #09090B)', value: 'monochrome' },
          ],
        },
      ],
      outputConfig: {
        renderType: 'html',
        suggestedActions: ['download', 'fullscreen', 'copy', 'rerun'],
        customLayout: 'split',
      },
    },
    enginePreference: 'gemini',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
    isBuiltIn: true,
    runCount: 41,
    sampleInputs: {
      brand_style: 'stripe_minimal',
      target_ui_type: 'web_landing',
      source_content: `SkillUI 智能技能工作台：一键将 Markdown 与 API 规则转化为极致体验的生产力工具。\n\n核心亮点：\n1. 零配置自动装配界面：从 Skill 规则自动反射表单与结果卡片\n2. 瑞士国际主义高质感排版：克莱因蓝与高密度事实设计\n3. 本地优先安全架构：零后端数据库依赖，数据 100% 保存在用户本地浏览器`,
      theme_color: 'indigo_modern',
    },
  },
];
