<div align="center">

# ⚡ SkillUI

### AI Skill 规则一键转可视化交互应用平台
**Turn Any Markdown/YAML AI Skill into a Modern Interactive Web App in Seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4.svg?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Local-First](https://img.shields.io/badge/Storage-Local--First%20(Zero--Leak)-10B981.svg?style=flat-square)](#-local-first-本地优先数据主权)

[在线体验 (Live Demo)](#) · [快速上手](#-快速启动-quick-start) · [Skill 编写规范](#-skill-规则定义与-schema-规范) · [系统架构](#-系统总体架构-system-architecture) · [参与贡献](#-参与贡献-contributing)

</div>

---

## 📖 项目概述 (Overview)

在当前的大模型与 Prompt 工程实践中，开发者输出了海量带有高质量行业规则与指令的 **AI Skill** 文件（带有 YAML Frontmatter 的 Markdown 文档、GitHub 提示词仓库等）。

然而，将这些 Skill 交付给非技术人员（设计、市场、业务人员或终端客户）时存在巨大阻碍：
- ❌ **无界面约束**：普通对话框难以录入多模态参数（如拖拽传图、代码段、滑块范围、单选枚举）；
- ❌ **输出形式单一**：标准对话仅输出纯文本流，无法根据场景沉淀为出版级海报、小红书图文卡片或幻灯片；
- ❌ **隐私与部署沉重**：现有方案多依赖重型云端数据库与复杂账号体系，数据易泄露且维护成本高。

**SkillUI** 是一个专注于解决上述痛点的 **纯前端本地优先 (Local-First)** 应用框架。只需导入 Markdown 文件、粘贴 Prompt 或输入 GitHub 仓库地址，SkillUI 即可在毫秒级逆向推导参数结构，动态生成符合工程规范的现代 UI 表单、调度多引擎计算并多模态渲染结果。

---

## ✨ 核心特性 (Key Features)

- 🪄 **一键逆向解析推导**：支持 Markdown / `SKILL.md`、GitHub 仓库直连、纯文本 Prompt 粘贴与空白创建，智能提取 `{{variable}}` 槽位并自动映射最佳表单控件。
- 🧩 **10 种专业控件族**：单行文本、富文本框、数值步进、下拉选择、单选按钮组、布尔开关、区间滑块、多标签选择、原生拖拽文件/图片上传（带缩略图预览）、等宽代码编辑器。
- ⚡ **多引擎无缝调度**：
  - **Gemini 2.5 Flash / Flash Lite**：高性价比与极速首字响应；
  - **REST Webhook**：直连用户自建模型或第三方 API 端点；
  - **离线仿真降级机制**：无网络或未配置 Key 时自动切换离线合成器，杜绝白屏崩溃。
- 🎨 **垂直多模态输出管道**：
  - 📝 **Markdown / 代码高亮**：完整 GFM 语法、代码差异与一键复制；
  - 🏛️ **图文咬合学术海报**：基于 `html-to-image` 视网膜级 2.5× 高清栅格化，一键导出印刷级 PNG；
  - 📱 **小红书 / 社媒轮播卡片**：自动生成多张社交图文卡片，支持流畅前后翻页；
  - 🖥️ **Web Deck 幻灯片**：全屏沉浸式演示文稿模式。
- 🔒 **本地优先数据主权 (Local-First)**：所有技能规则、自定义表单与历史执行流水 **100% 留存在用户本地浏览器 `localStorage` 中**，零数据上云泄露，支持全量 JSON 备份与迁移。
- 📐 **工程级设计系统**：严格遵守 `Inner = Outer - Padding` 容器几何对齐法则与 WCAG AA 高对比度色彩体系。

---

## 🏗️ 系统总体架构 (System Architecture)

```
====================================================================================================
SkillUI 平台系统 —— 系统分层架构图 (System Architecture Diagram)
====================================================================================================

| 客户端展示与交互层 (Client Presentation Layer)
  +-----------------------+  +-----------------------+  +-----------------------+  +-----------------------+
  |    技能探索工作区     |  |    动态 UI 运行台     |  |  可视化 Schema 编辑器 |  |  全源技能导入中心     |
  | 搜索 / 分类 / 收藏 / 副本| 10种控件 / 示范 / 快捷键| 字段构建器 / 校验 / 变量 | Markdown / GitHub 抓取 |
  +-----------------------+  +-----------------------+  +-----------------------+  +-----------------------+
                                             |
                                             v (用户交互与事件驱动)
| 核心业务逻辑调度层 (Core Business Logic Layer)
  +-------------------+  +-------------------+  +-------------------+  +-------------------+  +-------------------+
  |   Skill 解析引擎  |  |   表单动态生成器  |  |   多引擎调度器    |  |   参数插值与上下文|  |   异常熔断降级流  |
  | YAML / Frontmatter|  | 10种控件动态渲染  |  | Gemini / REST 路由|  | {{key}} 模板插值  |  | 离线仿真 / 超时兜底 |
  +-------------------+  +-------------------+  +-------------------+  +-------------------+  +-------------------+
                                             |
                                             v (本地状态持久化)
| 数据与状态持久层 (Local-First Data Storage Layer · 零泄露纯本地存储)
  +---------------------------+  +---------------------------+  +---------------------------+
  |    localStorage (技能库)  |  |   localStorage (执行流水) |  |   JSON 导入导出与校验管道 |
  | 存储全量 Skill 实体与配置 |  | 保留近 50 条输入快照与记录|  | 全量工作区备份 / 防篡改校验 |
  +---------------------------+  +---------------------------+  +---------------------------+
                                             |
                                             v (底层服务能力)
| 底层服务与基础设施层 (Infrastructure & Services Layer)
  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------------+
  |    Gemini Flash AI API  |  |     GitHub REST API     |  |  html-to-image 捕获引擎 |  |   Offscreen 2D Canvas   |
  | 大语言模型秒级推理交互  |  | 递归拉取远程目录与文件  |  | DOM 视网膜 2.5× 栅格化  |  | 离屏合成 / 跨域图片兜底 |
  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------------+
====================================================================================================
```

---

## 🔄 核心业务生命周期逻辑 (Business Flow)

```
[阶段 1: 规则载入与推导]
  Markdown/SKILL.md 文件  /  GitHub 仓库 URL  /  Prompt 纯文本  /  从零手动搭建
                       \              |             /             /
                        v             v            v             v
                   [Skill 解析器: 提取 Frontmatter 元数据与 System Instruction]
                                      |
                                      v
                   [UISchema 自动推导: 正则与 AST 扫描生成 FormField[] 集合]
                                      |
                                      v
[阶段 2: 动态表单挂载与输入]
                   [UI 运行台按字段定义实例化 10 种控件]
                                      |
              +-----------------------+-----------------------+
              |                                               |
              v                                               v
      [用户自定义表单输入]                             [一键注入示范数据 (Sample Inputs)]
              |                                               |
              +-----------------------+-----------------------+
                                      |
                                      v
                             [输入合法性运行时校验]
                                      |
[阶段 3: 执行调度与多引擎计算]
                                      v
                   [将表单值动态插值替换至提示词模板中的 {{field_key}}]
                                      |
                   [根据技能配置中的 enginePreference 路由分发]
                    /                 |                 \
                   v                  v                  v
             [Gemini Flash API]  [REST API 代理]   [离线仿真生成器 (Fallback)]
                    \                 |                 /
                     +----------------+----------------+
                                      |
[阶段 4: 结果多模态渲染与归档]
                                      v
                             [读取 outputConfig 规范]
                    /                 |                 \
                   v                  v                  v
          [Markdown / Code]   [Specialized 海报]  [社媒多图卡片/幻灯片]
                    \                 |                 /
                     +----------------+----------------+
                                      |
                                      v
               [写入 localStorage 执行流水 (记录输入快照、耗时与状态)]
                                      |
                                      v
                   [用户端: 1:1 导出 2.5x 高清 PNG / 复制内容 / 全屏演示]
```

---

## 🚀 快速启动 (Quick Start)

### 前置要求 (Prerequisites)
- [Node.js](https://nodejs.org/) (>= 18.0.0)
- npm 或 pnpm / yarn

### 1. 克隆仓库
```bash
git clone https://github.com/your-org/skillui.git
cd skillui
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量 (可选)
复制环境变量示例文件并配置 Gemini API Key（若不配置，系统将默认采用内置离线仿真器安全运行）：
```bash
cp .env.example .env
```
在 `.env` 中添加：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可使用。

### 5. 生产环境构建
```bash
npm run build
```


## 🛠️ 内置demo技能 (Curated Built-in Skills)

| 图标 | 技能名称 | 分类 | 控件特色 | 呈现形式 |
|:---:|:---|:---|:---|:---|
| 💻 | **代码审查与重构大师** | 代码研发 | 等宽代码编辑器 / 严格度滑块 / 优化开关 | GFM Markdown + 语法高亮差异 |
| 📊 | **SQL 查询生成与优化器** | 生产力 | 数据库方言下拉 / 表结构录入 / 执行计划分析 | 标准 SQL 代码块 + 执行解释 |
| 🎨 | **调色板与设计系统引擎** | 视觉设计 | 主题输入 / 色板数量滑块 / WCAG 校验开关 | 交互式色块网格 + 对比度分析 |
| 📑 | **会议纪要与行动项提炼器**| 生产力 | 录音转录文本 / 优先度过滤 / 责任人提取 | 结构化待办清单 + 导出表格 |

---

## 🗄️ 目录结构 (Project Structure)

```
skillui/
├── docs/                                # 完整产品需求与架构工程交付文档
│   └── PRD_AND_ENGINEERING_SPECS.md     # 全量 PRD、UI 原型与开发规范
├── src/
│   ├── components/                      # 核心组件库
│   │   ├── Header.tsx                   # 顶部导航与全局快捷动作
│   │   ├── SkillExplorer.tsx            # 技能探索工作区 (搜索/分类/收藏/复刻)
│   │   ├── SkillRunner.tsx              # 动态 UI 运行台 (双栏/表单生成/多模态渲染)
│   │   ├── SkillEditor.tsx              # 可视化 Schema 与字段构建器
│   │   ├── SkillImporter.tsx            # 多源技能导入 (Markdown/GitHub/Prompt)
│   │   ├── ProjectDocsCenter.tsx        # 文档中心 (PRD/UI规范/架构图在线查看与导出)
│   │   ├── ExecutionHistoryModal.tsx    # 运行历史流水与快照回溯模态窗
│   │   ├── DeleteConfirmModal.tsx       # 危险删除二次确认窗
│   │   └── specialized/                 # 垂直领域多模态呈现容器
│   │       ├── YingzaoPosterRenderer.tsx # 营造古建学术海报渲染器
│   │       └── SocialCardRenderer.tsx    # 社媒多图轮播卡片渲染器
│   ├── data/
│   │   ├── defaultSkills.ts             # 内置经过验证的生产级 Skill 字典
│   │   └── fullDocsMarkdown.ts          # 全量规范 Markdown 序列化数据源
│   ├── services/
│   │   └── storageService.ts            # Local-First 本地存储与备份恢复引擎
│   ├── types.ts                         # 全局 TypeScript 强类型契约定义
│   ├── App.tsx                          # 顶级应用状态机与路由分发
│   └── main.tsx                         # 应用入口点
├── server.ts                            # 服务端 API 代理与静态资源服务器
├── package.json
└── README.md
```


## 🤝 参与贡献 (Contributing)

欢迎提交 Issue 和 Pull Request 来完善 SkillUI！
1. Fork 本仓库并创建特性分支 (`git checkout -b feature/AmazingFeature`)
2. 提交代码变更 (`git commit -m 'feat: Add some AmazingFeature'`)
3. 确保通过类型检查与构建 (`npm run lint && npm run build`)
4. 推送分支并开启 Pull Request (`git push origin feature/AmazingFeature`)

---

## 📄 开源许可证 (License)

本项目基于 [MIT License](LICENSE) 开源发布。
