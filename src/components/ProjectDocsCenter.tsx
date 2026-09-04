import React, { useState } from 'react';
import {
  FileText,
  Palette,
  Cpu,
  Layers,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sliders,
  Maximize2,
  Code as CodeIcon,
  Image as ImageIcon,
  Share2,
  ShieldAlert,
  Database,
  Terminal,
  Printer,
  BookOpen,
  Plus,
  History,
  FolderTree,
  Upload,
  Settings,
  CheckCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { FULL_PROJECT_DOCS_MARKDOWN } from '../data/fullDocsMarkdown';

export const ProjectDocsCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'prd' | 'ui' | 'dev'>('prd');
  const [copied, setCopied] = useState(false);

  // Handle copying all markdown text
  const handleCopyAllMarkdown = () => {
    navigator.clipboard.writeText(FULL_PROJECT_DOCS_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle download markdown file
  const handleDownloadMarkdown = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Document Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-lime-400/20 text-lime-400 border border-lime-400/30 rounded-full text-xs font-mono font-bold tracking-wider">
                SKILLUI PLATFORM · SPECIFICATION V2.4
              </span>
              <span className="text-slate-400 text-xs">研发直接交付版 · 包含完整原型图与架构图</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              SkillUI 平台系统 · 产品需求文档 (PRD)、UI 规范与开发架构
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              本文档为 <strong>SkillUI（AI Skill 规则一键转可视化交互应用系统）</strong> 的完整工程交付文档。覆盖产品需求规格说明书（嵌入全部核心页面 UI 原型）、UI 视觉设计系统与规范、以及采用深色高亮风格的系统架构图、业务逻辑图与流程图。
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyAllMarkdown}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-white/15 cursor-pointer backdrop-blur-sm"
            >
              {copied ? <Check className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已复制全量 Markdown' : '复制全量文档'}</span>
            </button>
            <button
              onClick={() => {
                handleDownloadMarkdown('SkillUI_平台系统完整需求与开发规范.md', FULL_PROJECT_DOCS_MARKDOWN);
              }}
              className="px-4 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-lime-400/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>导出全量规范 (.md)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('prd')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'prd'
                ? 'bg-lime-400 text-slate-950 shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. 产品需求文档 (PRD & 页面UI)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ui')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'ui'
                ? 'bg-lime-400 text-slate-950 shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>2. UI 原型与设计规范系统</span>
          </button>
          <button
            onClick={() => setActiveSubTab('dev')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'dev'
                ? 'bg-lime-400 text-slate-950 shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>3. 开发规范与系统架构图 (含逻辑/时序图)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PRODUCT REQUIREMENT DOCUMENT (PRD) FOR SKILLUI                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'prd' && (
        <div className="space-y-12">
          {/* PRD Meta Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-600 uppercase tracking-widest">
                  PRODUCT SPECIFICATION #SKILLUI-CORE-2026
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  SkillUI 平台系统 · 产品需求规格说明书 (PRD)
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">版本: v2.4.0</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">
                  研发状态: 评审通过，直接可编码
                </span>
              </div>
            </div>

            {/* Core Product Mission & Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                <h4 className="font-bold text-indigo-950 text-sm">🎯 平台核心定位</h4>
                <p className="text-slate-600 leading-relaxed">
                  消除 AI Skill 规则文件与终局用户交互之间的鸿沟。任何 Markdown 规则、GitHub Prompt 仓库或系统指令，通过 SkillUI 即可秒级映射为具备专业表单、校验与多模态输出的交互式 Web 软件。
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                <h4 className="font-bold text-indigo-950 text-sm">👥 目标用户角色</h4>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Prompt 工程师 & 开发者</strong>：快速将自研 Skill 部署测试并交付他人；<strong>业务操作人员</strong>：摆脱 CLI 命令行与繁琐格式约束，通过标准化表单享受高质量 AI 能力。
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                <h4 className="font-bold text-indigo-950 text-sm">🛡️ 本地优先与隐私安全</h4>
                <p className="text-slate-600 leading-relaxed">
                  采用纯前端 Local-First 架构，全量 Skill 定义、表单历史记录与自定义密钥完全留存在浏览器本地客户端，支持零泄露离线运行与 JSON 离线备份迁移。
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 1: 技能库与探索工作区 (Skill Explorer) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                1.0
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">功能模块 1：技能探索工作区 (Skill Explorer)</h3>
                <p className="text-xs text-slate-500">统一展示、检索、分类过滤、收藏管理、副本生成与快速运行入口</p>
              </div>
            </div>

            {/* Embedded UI Prototype */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900/5 p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-700">UI 原型图 1.1：技能库列表与控制台 (Skill Explorer View)</span>
                <span>包含顶部工具栏、分类胶囊组、网格卡片与状态角标</span>
              </div>
              {/* Visual Mockup Container */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                {/* Search & Tabs Mockup */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs w-full sm:w-72 text-slate-400">
                    <span>🔍</span>
                    <span>搜索技能名称、标签、描述或指令...</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold shrink-0">全部 (8)</span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0">代码研发 (3)</span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0">视觉设计 (2)</span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0">内容写作 (2)</span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0">生产力 (1)</span>
                  </div>
                </div>

                {/* Cards Grid Mockup */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Card 1 */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                            💻
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">代码审查与重构大师</div>
                            <div className="text-[10px] text-slate-500">审查代码隐患，输出高质量重构方案</div>
                          </div>
                        </div>
                        <span className="text-amber-500 text-xs">★</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">TypeScript</span>
                        <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">CleanCode</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">已执行 12 次</span>
                      <div className="flex gap-1.5">
                        <button className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold">运行 UI</button>
                        <button className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px]">编辑</button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs">
                            🏛️
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">Yingzao · 营造 (海报引擎)</div>
                            <div className="text-[10px] text-slate-500">实拍古建筑照片转图文咬合艺术海报</div>
                          </div>
                        </div>
                        <span className="text-amber-500 text-xs">★</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">东方美学</span>
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">图文咬合</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">已执行 48 次</span>
                      <div className="flex gap-1.5">
                        <button className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold">运行 UI</button>
                        <button className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px]">编辑</button>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center text-xs">
                            📱
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">小红书/社媒多图卡片生成器</div>
                            <div className="text-[10px] text-slate-500">文章一键转多幻灯片视觉知识卡片</div>
                          </div>
                        </div>
                        <span className="text-slate-300 text-xs">☆</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">小红书</span>
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">幻灯片</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">已执行 9 次</span>
                      <div className="flex gap-1.5">
                        <button className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold">运行 UI</button>
                        <button className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px]">编辑</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Description & Edge Cases Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">1.2 功能详述与开发约束</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">功能特性</th>
                      <th className="p-3">前置条件</th>
                      <th className="p-3">详细交互逻辑与开发实现规范</th>
                      <th className="p-3">异常边界与降级策略</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">实时模糊搜索</td>
                      <td className="p-3">搜索框输入非空字符</td>
                      <td className="p-3">输入事件防抖 150ms；同时匹配 title、description、tags 和 rawSource.content；不区分中英文大小写。</td>
                      <td className="p-3">无匹配结果时显示「无搜索结果」，并提供「清除搜索」重置按钮。</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">分类筛选联动</td>
                      <td className="p-3">点击分类选项胶囊</td>
                      <td className="p-3">切换当前选中 category；搜索结果与分类结果执行逻辑“与(AND)”运算联动过滤。</td>
                      <td className="p-3">分类项后方动态计算展示该分类下的技能数量徽标 (Count Badge)。</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">技能复刻 (Duplicate)</td>
                      <td className="p-3">点击操作菜单中的「创建副本」</td>
                      <td className="p-3">生成新 ID (`skill-$&#123;Date.now()&#125;`)，标题追加「(副本)」，runCount 重置为 0，持久化至存储并 Toast 提示。</td>
                      <td className="p-3">深拷贝全量 UI Schema 与配置，防止共享引用导致数据脏写。</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">二次确认删除</td>
                      <td className="p-3">点击删除操作</td>
                      <td className="p-3">弹出 DeleteConfirmModal 提示不可逆警告；确认后执行物理删除，若正处于该技能运行态则回退至列表页。</td>
                      <td className="p-3">预置技能 (isBuiltIn) 同样支持删除，但可通过「恢复预置示范库」随时重置恢复。</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* MODULE 2: UI 交互运行台 (Skill Runner) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                2.0
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">功能模块 2：UI 交互运行台 (Skill Runner)</h3>
                <p className="text-xs text-slate-500">
                  基于 UISchema 动态渲染输入表单、支持 10 种控件族、多引擎调度、结果多模态渲染与执行快照回溯
                </p>
              </div>
            </div>

            {/* Embedded UI Prototype */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900/5 p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-700">UI 原型图 2.1：动态运行台响应式双栏布局</span>
                <span>Left: 动态表单配置面板 (40%) | Right: 多模态结果渲染器 (60%)</span>
              </div>
              {/* Visual Mockup */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                {/* Header Mockup */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs">🏛️</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Yingzao · 营造 (建筑与在地文化海报)</div>
                      <div className="text-[10px] text-slate-500">引擎: Gemini 2.5 Flash | 运行次数: 48</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-medium text-slate-600">历史快照 (4)</span>
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-medium text-slate-600">编辑 Schema</span>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">查看源码/文件</span>
                  </div>
                </div>

                {/* Split Content Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column (Inputs) */}
                  <div className="lg:col-span-5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">动态表单参数 (Form Inputs)</span>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer font-bold">
                        填入示范数据
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                        <span>真实素材照片 (File Upload)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="p-3 border-2 border-dashed border-indigo-200 bg-white rounded-lg text-center text-xs text-slate-500">
                        📸 拖拽图片至此或点击上传 (已选 1 张照片)
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">建筑/对象名称 (Text)</label>
                      <input
                        type="text"
                        disabled
                        value="善化寺三圣殿藻井"
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">画幅比例 (Select)</label>
                      <select disabled className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-800">
                        <option>3:4 (经典竖版艺术海报)</option>
                      </select>
                    </div>

                    <button className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5">
                      <span>▶ 运行技能 (Ctrl + Enter)</span>
                    </button>
                  </div>

                  {/* Right Column (Output) */}
                  <div className="lg:col-span-7 p-3.5 rounded-xl border border-slate-200 bg-slate-900 text-white flex flex-col justify-between min-h-72">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-mono text-slate-300">执行成功 · 耗时 1.2s</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-white font-bold">渲染视图</span>
                        <span className="px-2 py-0.5">原始 Markdown</span>
                      </div>
                    </div>

                    {/* Output Rendered Preview Container */}
                    <div className="my-auto py-4 flex flex-col items-center justify-center">
                      <div className="w-44 h-56 rounded-xl bg-[#FAF5EC] text-slate-900 p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-stone-300">
                        <div className="text-xl font-serif font-black text-stone-900 text-center tracking-tight opacity-80">
                          善化寺
                        </div>
                        <div className="w-32 h-24 bg-stone-700 rounded-lg mx-auto flex items-center justify-center text-[8px] text-white shadow-md">
                          [古建摄影飞檐穿插咬合]
                        </div>
                        <div className="flex justify-between items-end text-[7px] font-mono text-stone-600">
                          <span>YINGZAO POSTER</span>
                          <span className="w-3 h-3 bg-red-800 rounded-xs text-white flex items-center justify-center font-serif text-[5px]">营造</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                      <span className="text-slate-400">输出管道: Specialized Poster Studio</span>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-white/10 px-2.5 py-1 rounded text-white cursor-pointer font-bold">下载高清 PNG</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded text-white cursor-pointer">复制</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded text-white cursor-pointer">全屏</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Form Control Registry */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">2.2 动态表单 10 种控件族规范 (Field Type Registry)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-bold text-indigo-700">1. file (单图/多图上传与拖拽)</div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    支持浏览器原生拖拽放缩、多选批量上传、缩略图网格预览、移除与替换；自动转码为 Base64 DataURL 或本地 Blob 引用；单文件限制 10MB。
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-bold text-indigo-700">2. code (代码编辑器控件)</div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    具备等宽字体渲染、语法高亮标签、行号提示与快捷格式化功能；输出字符串源码。
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-bold text-indigo-700">3. tags (标签胶囊选择器)</div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    支持回车键追加自定义标签、点击叉号删除；内嵌常见预设关键词快捷单选或多选。
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-bold text-indigo-700">4. slider & switch (滑块与开关)</div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    用于数值区间控制（如 Temperature 0.0 - 1.0、Step 0.05）以及布尔项显隐开关。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MODULE 3: 可视化技能与 UI Schema 编辑器 (Skill Editor) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                3.0
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">功能模块 3：可视化技能与 Schema 编辑器 (Skill Editor)</h3>
                <p className="text-xs text-slate-500">
                  零代码可视化配置技能元数据、指令变量、表单字段构建器 (Field Builder)、模型超参数与输出管道
                </p>
              </div>
            </div>

            {/* Embedded UI Prototype */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900/5 p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-700">UI 原型图 3.1：可视化表单字段构建器 (Field Builder UI)</span>
                <span>支持新增、拖拽排序、字段类型选择、校验与默认值配置</span>
              </div>
              {/* Visual Mockup */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                {/* Editor Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
                  <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600">基本信息</span>
                  <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600">System Instruction 指令</span>
                  <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold">UI 表单字段构建器 (5)</span>
                  <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600">输出配置与管道</span>
                </div>

                {/* Field Builder Card Mockup */}
                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">::</span>
                      <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">F1</span>
                      <div>
                        <div className="font-bold text-slate-800">真实照片素材 (photos)</div>
                        <div className="text-[10px] text-slate-500">类型: file | 允许格式: image/* | 必填项: 是</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px]">配置校验</button>
                      <button className="px-2 py-1 bg-white border border-red-200 text-red-600 rounded text-[10px]">删除</button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">::</span>
                      <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">F2</span>
                      <div>
                        <div className="font-bold text-slate-800">建筑 / 对象名称 (subject_name)</div>
                        <div className="text-[10px] text-slate-500">类型: text | 占位符: 如：善化寺藻井 | 必填项: 是</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px]">配置校验</button>
                      <button className="px-2 py-1 bg-white border border-red-200 text-red-600 rounded text-[10px]">删除</button>
                    </div>
                  </div>

                  <button className="w-full py-2 border-2 border-dashed border-indigo-200 bg-indigo-50/40 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                    <span>+ 添加新表单字段 (Add Form Field)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Output Configuration Registry */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">3.2 输出管道配置规范 (Output Config Registry)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                每个 Skill 可声明其专属渲染类型 (`renderType`)，支持：
                `markdown` (标准 Markdown)、`code` (源码高亮与复制)、`json` (格式化对象树)、`poster` (营造东方建筑排版海报，含 4 种空间互动)、`social-cards` (社媒小红书多图幻灯片)、`web-deck` (全屏演示幻灯片播放器)。
              </p>
            </div>
          </div>

          {/* MODULE 4: 技能导入中心 (Skill Importer) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                4.0
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">功能模块 4：全源技能导入中心 (Skill Importer)</h3>
                <p className="text-xs text-slate-500">
                  支持 Markdown 文件上传、GitHub 仓库一键分析、粘贴 Prompt 规则与智能 Schema 字段反向推导
                </p>
              </div>
            </div>

            {/* Importer Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="p-1 bg-indigo-100 text-indigo-700 rounded">📄</span>
                  <span>Markdown / SKILL.md 导入</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  直接解析 YAML Frontmatter（title, description, tags）与正文 Markdown 指令；自动提取输入参数并生成对应类型的表单字段。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="p-1 bg-purple-100 text-purple-700 rounded">🐙</span>
                  <span>GitHub 仓库直连导入</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  输入 GitHub 仓库 URL，系统通过 GitHub REST API 递归抓取文件目录树，智能定位 SKILL.md / README.md 与 API 端点，支持在运行台通过文件树查看项目源码。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="p-1 bg-emerald-100 text-emerald-700 rounded">💾</span>
                  <span>JSON 工作区备份导入</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  支持全量工作区数据一键恢复，包含格式与数据版本指纹校验；数据异常自动拦截，杜绝脏数据污染。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: UI DESIGN SYSTEM & PROTOCOL SPECIFICATIONS                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'ui' && (
        <div className="space-y-12">
          {/* Design Philosophy Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-600 uppercase tracking-widest">
                  SKILLUI DESIGN SYSTEM · V2.4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  SkillUI 视觉系统与 UI 设计规范
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
                  设计哲学: 现代工程严谨性与高感知交互
                </span>
              </div>
            </div>

            {/* Design Tokens: Colors */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">2.1 系统全局色彩设计规范 (Design Tokens)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-1.5 shadow-xs">
                  <div className="w-full h-10 rounded-xl bg-indigo-600" />
                  <div className="text-xs font-bold text-slate-900">Brand Primary (主色)</div>
                  <div className="text-[10px] font-mono text-indigo-700">#4F46E5 (Indigo 600)</div>
                  <div className="text-[10px] text-slate-600">品牌主色、主按钮、核心焦点状态</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-1.5 shadow-xs">
                  <div className="w-full h-10 rounded-xl bg-sky-500" />
                  <div className="text-xs font-bold text-slate-900">Brand Accent (辅色)</div>
                  <div className="text-[10px] font-mono text-sky-700">#0EA5E9 (Sky 500)</div>
                  <div className="text-[10px] text-slate-600">次级徽标、操作提示、高亮外发光</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-1.5 shadow-xs">
                  <div className="w-full h-10 rounded-xl bg-emerald-500" />
                  <div className="text-xs font-bold text-slate-900">Success State (成功色)</div>
                  <div className="text-[10px] font-mono text-emerald-700">#10B981 (Emerald 500)</div>
                  <div className="text-[10px] text-slate-600">执行完毕、状态在线、导出成功</div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-300 bg-slate-900 text-white space-y-1.5 shadow-xs">
                  <div className="w-full h-10 rounded-xl bg-slate-900 border border-slate-700" />
                  <div className="text-xs font-bold text-white">Neutral Canvas (底板黑)</div>
                  <div className="text-[10px] font-mono text-slate-400">#0B0F17 / #0F172A</div>
                  <div className="text-[10px] text-slate-300">系统架构图底板、深色运行台</div>
                </div>
              </div>
            </div>

            {/* Typography Scale */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900">2.2 字体排版系统 (Typography Scale)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-indigo-700">UI 界面无衬线字体</div>
                  <div className="font-sans font-bold text-slate-900 text-base">Plus Jakarta Sans / Inter</div>
                  <p className="text-[11px] text-slate-600">
                    用于全站界面文本、导航菜单、按钮标签与表单 Label，字母间距紧凑，视觉清晰。
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-indigo-700">代码与元数据字体</div>
                  <div className="font-mono font-bold text-slate-900 text-base">JetBrains Mono / Courier</div>
                  <p className="text-[11px] text-slate-600">
                    用于代码高亮、请求耗时 (Duration)、API 路径、版本号与参数键名。
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-indigo-700">东方典雅宋体 (出版物专用)</div>
                  <div className="font-serif font-black text-slate-900 text-base">Noto Serif SC / 仿宋</div>
                  <p className="text-[11px] text-slate-600">
                    专用于垂直海报出版工作室的主标题大字、印章篆刻与题跋排版。
                  </p>
                </div>
              </div>
            </div>

            {/* Nested Border Radius Math */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900">2.3 容器嵌套圆角一致性法则 (Geometry Math)</h3>
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60 text-xs space-y-2 text-slate-700">
                <div className="font-bold text-indigo-950">📐 严禁违背圆角几何规律：`R_inner = R_outer - Padding`</div>
                <p className="leading-relaxed">
                  外层卡片使用 `rounded-3xl (24px)`，内边距为 `p-4 (16px)` 时，内嵌子容器必须严格为 `24px - 16px = 8px (rounded-lg)`；严禁内外圆角不对应导致视觉穿透或边框挤压畸变。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: DEVELOPMENT SPECIFICATIONS & DARK-MODE ARCHITECTURE DIAGRAMS   */}
      {/* ========================================================================= */}
      {activeSubTab === 'dev' && (
        <div className="space-y-12">
          {/* DIAGRAM 1: SkillUI System Architecture (Exact reference image style) */}
          <div className="bg-[#0B0F17] rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8 font-sans">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-[#A3E635] tracking-tight flex items-center gap-3">
                <span>SkillUI —— 系统架构图</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                v2.4.0 · 本地优先 (Local-First) · AI Skill 规则一键转可视化交互应用系统
              </p>
            </div>

            {/* Layer 1: Client Presentation Layer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>客户端展示层 (Client & Presentation Layer)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-sky-400 shadow-lg shadow-sky-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">技能探索工作区</div>
                  <div className="text-slate-400 text-xs mt-1">搜索 / 分类 / 收藏 / 副本管理</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-sky-400 shadow-lg shadow-sky-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">动态 UI 运行台</div>
                  <div className="text-slate-400 text-xs mt-1">智能表单 / 示范数据 / 状态流</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-sky-400 shadow-lg shadow-sky-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">可视化 Schema 编辑器</div>
                  <div className="text-slate-400 text-xs mt-1">字段拖拽 / 校验器 / Prompt 注入</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-sky-400 shadow-lg shadow-sky-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">多源导入与导出中心</div>
                  <div className="text-slate-400 text-xs mt-1">GitHub / Markdown / JSON 备份</div>
                </div>
              </div>
            </div>

            {/* Downward Connector */}
            <div className="flex justify-center -my-2 text-slate-600">
              <span className="text-lg">↓</span>
            </div>

            {/* Layer 2: Business Logic Layer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>核心业务逻辑层 (Business Logic Layer)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="bg-[#111622] p-3.5 rounded-2xl border-2 border-lime-400 shadow-lg shadow-lime-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">Skill 解析引擎</div>
                  <div className="text-slate-400 text-[11px] mt-1">YAML Frontmatter / 结构提取</div>
                </div>
                <div className="bg-[#111622] p-3.5 rounded-2xl border-2 border-lime-400 shadow-lg shadow-lime-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">动态表单生成器</div>
                  <div className="text-slate-400 text-[11px] mt-1">10种控件绑定 / 实时校验</div>
                </div>
                <div className="bg-[#111622] p-3.5 rounded-2xl border-2 border-lime-400 shadow-lg shadow-lime-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">多引擎调度器</div>
                  <div className="text-slate-400 text-[11px] mt-1">Gemini / API / Hybrid 路由</div>
                </div>
                <div className="bg-[#111622] p-3.5 rounded-2xl border-2 border-lime-400 shadow-lg shadow-lime-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">参数变量插值</div>
                  <div className="text-slate-400 text-[11px] mt-1">模板替换 / 上下文注入</div>
                </div>
                <div className="bg-[#111622] p-3.5 rounded-2xl border-2 border-lime-400 shadow-lg shadow-lime-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">输出渲染调度</div>
                  <div className="text-slate-400 text-[11px] mt-1">海报 / 社媒卡片 / WebDeck</div>
                </div>
                <div className="bg-[#111622] p-3.5 rounded-2xl border-2 border-rose-400 shadow-lg shadow-rose-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">异常与熔断降级</div>
                  <div className="text-slate-400 text-[11px] mt-1">网络失败兜底 / 超时重试</div>
                </div>
              </div>
            </div>

            {/* Downward Connector */}
            <div className="flex justify-center -my-2 text-slate-600">
              <span className="text-lg">↓</span>
            </div>

            {/* Layer 3: Data & State Storage Layer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>数据与状态持久层 (全部本地存储，Local-First 保证零泄露)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">localStorage (技能库)</div>
                  <div className="text-slate-400 text-xs mt-1">技能实体 / UISchema / 用户自定义</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">localStorage (执行流水)</div>
                  <div className="text-slate-400 text-xs mt-1">近 50 条输入快照 / 耗时 / 结果</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">EventBus / 响应式状态</div>
                  <div className="text-slate-400 text-xs mt-1">跨组件同步 / 实时 Toast 提示</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between">
                  <div className="text-white font-bold text-sm">JSON 备份与恢复管道</div>
                  <div className="text-slate-400 text-xs mt-1">全量工作区导入导出 / 指纹校验</div>
                </div>
              </div>
            </div>

            {/* Downward Connector */}
            <div className="flex justify-center -my-2 text-slate-600">
              <span className="text-lg">↓</span>
            </div>

            {/* Layer 4: Infrastructure & Services */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>底层服务与执行基础设施 (Service & Infrastructure)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400 shadow-lg shadow-purple-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">Gemini Flash AI API</div>
                  <div className="text-slate-400 text-[11px] mt-1">BYOK / 大语言模型快速推理</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400 shadow-lg shadow-purple-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">GitHub REST API</div>
                  <div className="text-slate-400 text-[11px] mt-1">递归获取仓库文件树 / Raw 内容</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400 shadow-lg shadow-purple-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">Fetch API 代理网关</div>
                  <div className="text-slate-400 text-[11px] mt-1">外部 REST 端点调用与参数注入</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400 shadow-lg shadow-purple-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">html-to-image 捕获</div>
                  <div className="text-slate-400 text-[11px] mt-1">DOM 视网膜级 2.5× 高清栅格化</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400 shadow-lg shadow-purple-500/10 flex flex-col justify-between">
                  <div className="text-white font-bold text-xs sm:text-sm">Offscreen 2D Canvas</div>
                  <div className="text-slate-400 text-[11px] mt-1">离屏图像合成 / 跨域离线兜底</div>
                </div>
              </div>
            </div>
          </div>

          {/* DIAGRAM 2: SkillUI End-to-End Business Logic Flow */}
          <div className="bg-[#0B0F17] rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8 font-sans">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-[#A3E635] tracking-tight flex items-center gap-3">
                <span>SkillUI —— 核心业务生命周期逻辑图</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                从 Skill 规则导入解析、UI Schema 动态反向推导，到表单渲染与执行输出的端到端闭环
              </p>
            </div>

            {/* Stage 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>阶段 1：Skill 规则导入与语法树反向推导 (Ingestion & Schema Derivation)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-sky-400">
                  <div className="text-white font-bold text-sm">多源载入 (Import Sources)</div>
                  <div className="text-slate-400 text-xs mt-1">Markdown 文件 / GitHub Repo URL / 粘贴纯文本 Prompt</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-sky-400">
                  <div className="text-white font-bold text-sm">YAML Frontmatter 提取</div>
                  <div className="text-slate-400 text-xs mt-1">解析 name, description, tags, icon, category</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-sky-400">
                  <div className="text-white font-bold text-sm">UISchema 自动推导引擎</div>
                  <div className="text-slate-400 text-xs mt-1">智能识别输入变量并生成 FormField 控件定义</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2 text-slate-600">
              <span className="text-lg">↓</span>
            </div>

            {/* Stage 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>阶段 2：UI 运行台动态挂载与校验 (Dynamic Form Mount & Validation)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-amber-400">
                  <div className="text-white font-bold text-sm">表单控件动态生成</div>
                  <div className="text-slate-400 text-xs mt-1">按 FormField 渲染 text / file / select / tags 等 10 种输入控件</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-amber-400">
                  <div className="text-white font-bold text-sm">一键示范数据挂载</div>
                  <div className="text-slate-400 text-xs mt-1">注入预置示范数据 (Sample Inputs)，支持快速体验验证</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-amber-400">
                  <div className="text-white font-bold text-sm">运行时输入校验器</div>
                  <div className="text-slate-400 text-xs mt-1">校验必填项、数值区间、正则表达式与文件尺寸合规性</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2 text-slate-600">
              <span className="text-lg">↓</span>
            </div>

            {/* Stage 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>阶段 3：多引擎推理与执行调度 (Multi-Engine Execution & Fallback)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-lime-400">
                  <div className="text-white font-bold text-sm">Prompt 变量动态插值</div>
                  <div className="text-slate-400 text-xs mt-1">将表单输入参数注入 System Instruction 模板占位符</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-lime-400">
                  <div className="text-white font-bold text-sm">引擎调用与超时监控</div>
                  <div className="text-slate-400 text-xs mt-1">调度 Gemini AI API / REST Endpoint，毫秒级计时器</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-lime-400">
                  <div className="text-white font-bold text-sm">熔断降级与模拟响应</div>
                  <div className="text-slate-400 text-xs mt-1">API 离线或缺失 Key 时触发专业预置兜底生成器</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2 text-slate-600">
              <span className="text-lg">↓</span>
            </div>

            {/* Stage 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider">
                <span className="text-[#A3E635] text-base font-black">|</span>
                <span>阶段 4：多模态渲染输出与审计归档 (Output Render Registry & Audit)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400">
                  <div className="text-white font-bold text-sm">专用渲染管道分发</div>
                  <div className="text-slate-400 text-xs mt-1">Markdown / Code / Poster (图文咬合海报) / 社媒多图卡片</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400">
                  <div className="text-white font-bold text-sm">高清资产 1:1 导出</div>
                  <div className="text-slate-400 text-xs mt-1">html-to-image DOM 视网膜栅格化 / 复制剪贴板 / 全屏</div>
                </div>
                <div className="bg-[#111622] p-4 rounded-2xl border-2 border-purple-400">
                  <div className="text-white font-bold text-sm">执行流水与快照归档</div>
                  <div className="text-slate-400 text-xs mt-1">写入 localStorage 历史记录，支持一键载入参数重跑</div>
                </div>
              </div>
            </div>
          </div>

          {/* Development Standards & Contracts */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900">3.3 研发交付与代码编码规范 (Definition of Done)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="font-bold text-slate-900">📜 TypeScript 类型约束规范</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>所有实体模型严格收敛于 `src/types.ts`，禁止业务代码声明自由对象。</li>
                  <li>字段类型 `FieldType` 与引擎类型 `EnginePreference` 必须使用联合字面量。</li>
                  <li>表单值对象必须使用 `Record&lt;string, any&gt;` 进行严格类型断言。</li>
                </ul>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="font-bold text-slate-900">🛡️ 存储与本地性能约束</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>localStorage 执行记录上限设为 50 条，溢出时自动采用 FIFO 淘汰。</li>
                  <li>图片拖拽与上传在前端实时缩略，防止大尺寸 DataURL 击穿客户端内存配额。</li>
                  <li>全量 JSON 备份必须包含应用版本指纹 (`version: 2`) 才能准入恢复。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden text source for full markdown export */}
      <div id="docs-full-text-source" className="hidden">
        {FULL_PROJECT_DOCS_MARKDOWN}
      </div>
    </div>
  );
};
