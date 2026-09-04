import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  History,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  Sliders,
  HelpCircle,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenImport: () => void;
  onOpenHistory: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetDefaults: () => void;
  totalSkillsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenImport,
  onOpenHistory,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  totalSkillsCount,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('explore')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                SkillUI
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">
                AI Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Skill 规则一键转可视化交互应用
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
          <button
            id="nav-tab-explore"
            onClick={() => setActiveTab('explore')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'explore'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>技能库 ({totalSkillsCount})</span>
          </button>
          <button
            id="nav-tab-runner"
            onClick={() => setActiveTab('runner')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'runner'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>UI 交互运行台</span>
          </button>
          <button
            id="nav-tab-docs"
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold">项目文档 (PRD & 规范)</span>
          </button>
          <button
            id="nav-tab-history"
            onClick={onOpenHistory}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>运行记录</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-import-skill-header"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>导入 / 上传 Skill</span>
          </button>

          {/* More Settings Menu */}
          <div className="relative">
            <button
              id="btn-workspace-menu"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="工作区与数据管理"
            >
              <Download className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    数据备份与管理
                  </div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onExportBackup();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>导出全量技能备份 (JSON)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onImportBackup();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>导入外部备份文件</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('确定要恢复默认预置的示范 Skill 库吗？')) {
                        onResetDefaults();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>恢复内置示范技能库</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowHelp(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>使用指引与常见问题</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                关于 SkillUI 原理与使用说明
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">1. 多源 Skill 导入：</strong>
                支持直接上传 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">.md</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">.json</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">.yaml</code> 文件，输入 GitHub Raw 链接，或直接粘贴任何 Agent 指令。
              </p>
              <p>
                <strong className="text-slate-800">2. AI 智能解析与 UI 生成：</strong>
                应用自动提取核心指令，将参数转化为文本框、代码编辑器、下拉列表、滑动条、开关等精美可视化表单组件。
              </p>
              <p>
                <strong className="text-slate-800">3. 默认 Gemini AI 引擎：</strong>
                默认由 Gemini 智能引擎结合 Skill 逻辑执行；如果 Skill 涉及外部 Webhook，优先使用 AI 模拟，用户亦可在引擎选择器中手动切换为直连。
              </p>
              <p>
                <strong className="text-slate-800">4. 纯客户端本地存储：</strong>
                所有自定义 Skill、UI 配置与运行记录均存储在浏览器本地设备中，即开即用、隐私安全。
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
