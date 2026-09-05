import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  Globe,
  Clock,
  Zap,
  Cpu,
  History,
  AlertCircle,
  FileCode,
  FileText,
  HelpCircle,
  Upload,
  Layers,
  Code as CodeIcon,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Skill, FormField, ExecutionRecord } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { storageService } from '../services/storage';
import { SkillFileExplorer } from './SkillFileExplorer';
import { SkillPosterResult } from './SkillPosterResult';
import { SkillSocialCardsResult } from './SkillSocialCardsResult';
import { SkillWebDeckResult } from './SkillWebDeckResult';
import { SkillHtmlLiveResult } from './SkillHtmlLiveResult';
import { FileUploadField } from './FileUploadField';
import { SmartContentField } from './SmartContentField';
import { TagsField } from './TagsField';
import { SAMPLE_HERITAGE_PHOTOS } from '../data/samplePhotos';

interface SkillRunnerProps {
  skill: Skill;
  onEditSkill: (skill: Skill) => void;
  onOpenGlobalHistory: () => void;
  onBackToExplore: () => void;
  onDeleteSkill?: (skill: Skill) => void;
}

export const SkillRunner: React.FC<SkillRunnerProps> = ({
  skill,
  onEditSkill,
  onOpenGlobalHistory,
  onBackToExplore,
  onDeleteSkill,
}) => {
  // Form input state
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Execution state
  const [engineType, setEngineType] = useState<'gemini' | 'api' | 'hybrid'>(
    skill.enginePreference || 'gemini'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [outputResult, setOutputResult] = useState<string>('');
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [outputViewMode, setOutputViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // History for this skill
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [skillHistory, setSkillHistory] = useState<ExecutionRecord[]>([]);

  // Raw source & Directory tree toggle
  const [showRawSource, setShowRawSource] = useState(false);
  const [showDirectoryTree, setShowDirectoryTree] = useState(false);

  // Initialize form with clean default values (text and files are always clean empty on entry)
  useEffect(() => {
    const initial: Record<string, any> = {};

    if (skill.uiSchema?.fields) {
      skill.uiSchema.fields.forEach((field) => {
        if (field.type === 'select' || field.type === 'radio') {
          initial[field.id] = field.defaultValue ?? field.options?.[0]?.value ?? '';
        } else if (field.type === 'switch') {
          initial[field.id] = field.defaultValue !== undefined ? Boolean(field.defaultValue) : false;
        } else if (field.type === 'number') {
          initial[field.id] = field.defaultValue !== undefined ? Number(field.defaultValue) : field.validation?.min || 0;
        } else if (field.type === 'file' || field.id === 'photos' || field.label?.includes('照片')) {
          initial[field.id] = [];
        } else if (field.type === 'tags') {
          initial[field.id] = [];
        } else {
          // All text, textarea, code, custom fields ALWAYS initialize to clean empty string '' on entry
          initial[field.id] = '';
        }
      });
    }
    setFormValues(initial);
    setOutputResult('');
    setErrorMsg('');
    setEngineType(skill.enginePreference || 'gemini');
    loadSkillHistory();
  }, [skill.id]);

  const loadSkillHistory = () => {
    const all = storageService.getHistory();
    const filtered = all.filter((h) => h.skillId === skill.id);
    setSkillHistory(filtered);
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (skill.uiSchema?.fields) {
      skill.uiSchema.fields.forEach((f) => {
        const val = formValues[f.id];
        if (f.required) {
          if (val === undefined || val === null || val === '') {
            errors[f.id] = `「${f.label}」为必填项`;
          } else if (Array.isArray(val) && val.length === 0) {
            errors[f.id] = `「${f.label}」至少需要输入一项`;
          }
        }
      });
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Execute Skill
  const handleExecute = async () => {
    if (!validateForm()) {
      return;
    }

    setIsRunning(true);
    setOutputResult('');
    setErrorMsg('');
    const startTime = Date.now();

    try {
      if (engineType === 'gemini' || engineType === 'hybrid') {
        // SSE Streaming execution with Gemini
        const response = await fetch('/api/skill/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: skill.title,
            systemInstruction: skill.systemInstruction,
            inputValues: formValues,
            fields: skill.uiSchema.fields,
            modelConfig: skill.modelConfig,
            skillRecord: skill,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `请求失败: HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr) {
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.chunk) {
                      accumulated += parsed.chunk;
                      setOutputResult(accumulated);
                    }
                    if (parsed.error) {
                      setErrorMsg(parsed.error);
                      throw new Error(parsed.error);
                    }
                  } catch (e: any) {
                    if (e.message && !e.message.includes('JSON')) {
                      setErrorMsg(e.message);
                      throw e;
                    }
                  }
                }
              }
            }
          }
        }

        const duration = Date.now() - startTime;
        setExecutionTimeMs(duration);

        // Record history & increment run count
        storageService.incrementRunCount(skill.id);
        const record: ExecutionRecord = {
          id: `hist-${Date.now()}`,
          skillId: skill.id,
          skillTitle: skill.title,
          timestamp: Date.now(),
          engineUsed: engineType,
          inputValues: { ...formValues },
          outputResult: accumulated,
          status: 'success',
          durationMs: duration,
        };
        storageService.addHistoryRecord(record);
        loadSkillHistory();
      } else if (engineType === 'api') {
        // Direct API endpoint proxy execution
        const targetEndpoint = skill.detectedEndpoints?.[0];
        if (!targetEndpoint) {
          throw new Error('当前技能未配置有效的外部 API 接口端点，请切换回 Gemini 引擎');
        }

        const response = await fetch('/api/skill/execute-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: targetEndpoint.url,
            method: targetEndpoint.method || 'POST',
            headers: targetEndpoint.headers || {},
            body: formValues,
          }),
        });

        const data = await response.json();
        const duration = Date.now() - startTime;
        setExecutionTimeMs(duration);

        if (!response.ok || !data.success) {
          throw new Error(data.error || '外部接口请求返回异常');
        }

        const formatted =
          typeof data.data === 'object'
            ? JSON.stringify(data.data, null, 2)
            : String(data.data);

        const fullText = `\`\`\`json\n${formatted}\n\`\`\``;
        setOutputResult(fullText);

        storageService.incrementRunCount(skill.id);
        const record: ExecutionRecord = {
          id: `hist-${Date.now()}`,
          skillId: skill.id,
          skillTitle: skill.title,
          timestamp: Date.now(),
          engineUsed: 'api',
          inputValues: { ...formValues },
          outputResult: fullText,
          status: 'success',
          durationMs: duration,
        };
        storageService.addHistoryRecord(record);
        loadSkillHistory();
      }
    } catch (err: any) {
      console.error('Skill execution failed:', err);
      const isNetworkErr =
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('failed to fetch') ||
        err?.message?.toLowerCase().includes('load failed') ||
        err?.name === 'TypeError';

      let friendlyMsg = err?.message || '执行过程出现异常，请检查输入后重试';
      try {
        if (friendlyMsg.includes('{') && friendlyMsg.includes('}')) {
          const match = friendlyMsg.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.error?.message) {
              friendlyMsg = parsed.error.message;
            } else if (parsed.message) {
              friendlyMsg = parsed.message;
            }
          }
        }
      } catch {}

      if (friendlyMsg.includes('429') || friendlyMsg.includes('RESOURCE_EXHAUSTED') || friendlyMsg.includes('quota')) {
        friendlyMsg = 'Gemini 免费调用频次暂时受限（429 Too Many Requests），系统已配置备选模型。请稍候 15~30 秒后重试。';
      } else if (isNetworkErr) {
        friendlyMsg = '网络连接暂时受阻或服务正在重连，请点击下方「重试」或再次运行。';
      }

      setErrorMsg(friendlyMsg);
      const duration = Date.now() - startTime;
      setExecutionTimeMs(duration);

      try {
        const record: ExecutionRecord = {
          id: `hist-${Date.now()}`,
          skillId: skill.id,
          skillTitle: skill.title,
          timestamp: Date.now(),
          engineUsed: engineType,
          inputValues: { ...formValues },
          outputResult: '',
          status: 'error',
          durationMs: duration,
          errorMessage: friendlyMsg,
        };
        storageService.addHistoryRecord(record);
        loadSkillHistory();
      } catch (storageErr) {
        console.warn('Could not record error history:', storageErr);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Quick fill sample inputs
  const handleFillSample = () => {
    const isHeritage =
      skill.id === 'skill-yingzao-poster' || skill.title.includes('营造') || skill.title.includes('古建筑');
    const isDeck =
      skill.uiSchema?.outputConfig?.renderType === 'web-deck' ||
      skill.uiSchema?.outputConfig?.renderType === 'presentation' ||
      skill.title.toLowerCase().includes('ppt') ||
      skill.title.toLowerCase().includes('deck') ||
      skill.title.includes('演示文稿') ||
      skill.title.includes('幻灯片');
    const isSocialCard =
      !isDeck &&
      (skill.uiSchema?.outputConfig?.renderType === 'social-cards' ||
        skill.title.includes('社交卡片') ||
        skill.title.includes('Social') ||
        skill.title.includes('小红书') ||
        skill.title.includes('Guizang'));

    if (skill.sampleInputs) {
      setFormValues((prev) => ({ ...prev, ...skill.sampleInputs }));
    } else if (isDeck) {
      const sample: Record<string, any> = {
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
      };
      setFormValues((prev) => ({ ...prev, ...sample }));
    } else if (isSocialCard) {
      const sample: Record<string, any> = {
        source_text: `AI Agent 时代的产品范式重构：为什么我们不再需要复杂的单体控制台？

核心论点：
1. 从“人适应软件”到“意图即交付”：传统的 SaaS 界面充斥着冗余的侧边栏、表单和层级菜单，而 Agent 的核心能力是语义理解与自适应渲染。
2. 证据层是抵抗 AI 虚无感的唯一解法：没有真实截图、实拍或数据证据的 AI 内容就是流水线废话。好的社交卡片必须以证据为骨架。
3. 瑞士国际主义排版的复兴：高信息密度、严谨网格、单色视觉重锚与纯粹黑白灰，能在三秒内建立专业信任感。

复盘清单：
- 确立清晰的首图三秒钩子
- 每一页只承载一个明确主张
- 削减修饰词，用事实和截图替代说教
- 在小屏幕上确保 1080x1440 黄金安全区`,
        target_platform: 'xhs_deck',
        style_system: 'swiss',
        color_theme: 'ikb_blue',
        rednote_category: 'tech',
        page_count: '4',
        include_summary_card: true,
      };
      setFormValues((prev) => ({ ...prev, ...sample }));
    } else {
      const sample: Record<string, any> = {};
      skill.uiSchema?.fields?.forEach((f) => {
        if (f.defaultValue !== undefined) {
          sample[f.id] = f.defaultValue;
        } else if (f.type === 'file' || f.id === 'photos' || f.label?.includes('照片')) {
          sample[f.id] = isHeritage ? SAMPLE_HERITAGE_PHOTOS : [];
        }
      });
      setFormValues((prev) => ({ ...prev, ...sample }));
    }
  };

  // Reset form
  const handleResetForm = () => {
    const cleared: Record<string, any> = {};
    skill.uiSchema?.fields?.forEach((f) => {
      if (f.type === 'select' || f.type === 'radio') {
        cleared[f.id] = f.defaultValue ?? f.options?.[0]?.value ?? '';
      } else if (f.type === 'switch') {
        cleared[f.id] = f.defaultValue !== undefined ? Boolean(f.defaultValue) : false;
      } else if (f.type === 'number') {
        cleared[f.id] = f.defaultValue !== undefined ? Number(f.defaultValue) : f.validation?.min || 0;
      } else if (f.type === 'file' || f.id === 'photos' || f.label?.includes('照片')) {
        cleared[f.id] = [];
      } else if (f.type === 'tags') {
        cleared[f.id] = [];
      } else {
        cleared[f.id] = '';
      }
    });
    setFormValues(cleared);
    setValidationErrors({});
    setOutputResult('');
    setErrorMsg('');
  };

  // Copy result
  const handleCopyResult = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download result
  const handleDownload = () => {
    if (!outputResult) return;
    const blob = new Blob([outputResult], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.title.replace(/\s+/g, '_')}_结果_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load past history item into form
  const handleRestoreHistory = (record: ExecutionRecord) => {
    if (record.inputValues) {
      setFormValues(record.inputValues);
    }
    if (record.outputResult) {
      setOutputResult(record.outputResult);
    }
    setEngineType(record.engineUsed);
    setShowHistoryDrawer(false);
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-6 overflow-y-auto' : ''}`}>
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={onBackToExplore}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="返回技能库列表"
          >
            ←
          </button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
            <DynamicIcon name={skill.icon} className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {skill.title}
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">
                可视化交互 UI
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              {skill.description}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
          {/* File Tree Button */}
          <button
            onClick={() => {
              setShowDirectoryTree(!showDirectoryTree);
              if (!showDirectoryTree) setShowRawSource(false);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
              showDirectoryTree
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {skill.files && skill.files.length > 0
                ? `Skill 目录体系 (${skill.files.length})`
                : 'Skill 目录结构'}
            </span>
          </button>

          <button
            onClick={() => {
              setShowRawSource(!showRawSource);
              if (!showRawSource) setShowDirectoryTree(false);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>{showRawSource ? '收起 Skill 源码' : '查看原始 Skill'}</span>
          </button>
          <button
            onClick={() => onEditSkill(skill)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>配置 UI 字段</span>
          </button>
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors relative"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>历史记录 ({skillHistory.length})</span>
          </button>

          {onDeleteSkill && (
            <button
              onClick={() => onDeleteSkill(skill)}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="从工作区删除此技能"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>删除技能</span>
            </button>
          )}
        </div>
      </div>

      {/* Skill Directory Tree Drawer / Inspector */}
      {showDirectoryTree && (
        <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <FolderTree className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">
                Skill 原始目录架构与关联规范 ({skill.files?.length || 1} 个资源文件)
              </span>
              {skill.repositoryInfo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {skill.repositoryInfo.owner}/{skill.repositoryInfo.repo}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDirectoryTree(false)}
              className="text-xs text-slate-400 hover:text-white font-bold"
            >
              ✕ 收起
            </button>
          </div>

          <SkillFileExplorer
            files={
              skill.files && skill.files.length > 0
                ? skill.files
                : [
                    {
                      path: skill.rawSource?.originalName || 'SKILL.md',
                      name: skill.rawSource?.originalName || 'SKILL.md',
                      type: 'file',
                      content: skill.rawSource?.content,
                    },
                  ]
            }
            repositoryInfo={skill.repositoryInfo}
          />
        </div>
      )}

      {/* Raw Source Accordion */}
      {showRawSource && (
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
            <span>原始 Skill 来源内容 ({skill.rawSource.type})</span>
            <button
              onClick={() => navigator.clipboard.writeText(skill.rawSource.content)}
              className="hover:text-white flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>复制源码</span>
            </button>
          </div>
          <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto text-slate-300 scrollbar-none">
            {skill.rawSource.content}
          </pre>
        </div>
      )}

      {/* Main Split Interface (Left: Form Controls | Right: Output Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generated Form UI Controls (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Form Header & Engine Selector */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>{skill.uiSchema?.title || '参数输入面板'}</span>
              </h2>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>填入预设样例</span>
              </button>
            </div>

            {/* Engine Selection Bar - Default Gemini AI Engine strictly preferred */}
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>执行引擎选择:</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {engineType === 'gemini' ? '推荐默认' : '手动指定'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEngineType('gemini')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    engineType === 'gemini'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini AI (默认)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEngineType('api')}
                  disabled={!skill.hasExternalEndpoints && !skill.detectedEndpoints?.length}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    engineType === 'api'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : !skill.hasExternalEndpoints && !skill.detectedEndpoints?.length
                      ? 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title={
                    !skill.hasExternalEndpoints && !skill.detectedEndpoints?.length
                      ? '当前技能不含外部 API 端点'
                      : '直连外部 API 端点'
                  }
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>外部 API 直连</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                {engineType === 'gemini'
                  ? '🌟 默认使用 Gemini 智能模型，深度结合 Skill 指令与入参进行实时推理生成。'
                  : '⚡ 将表单参数直接打包为 HTTP 请求发送至检测到的外部 API 端点。'}
              </p>
            </div>
          </div>

          {/* Form Fields Renderer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="space-y-4"
          >
            {skill.uiSchema?.fields?.map((field) => {
              const val = formValues[field.id];
              const error = validationErrors[field.id];

              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`field-${field.id}`}
                      className="text-xs font-bold text-slate-800 flex items-center gap-1"
                    >
                      <span>{field.label || field.name}</span>
                      {field.required && <span className="text-red-500 font-bold">*</span>}
                    </label>
                    {field.description && (
                      <span
                        className="text-[11px] text-slate-400 cursor-help"
                        title={field.description}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Render based on field.type */}
                  {field.type === 'file' && (field.uploadPreset === 'image' || field.id === 'photos' || field.label?.includes('照片') || (field.accept?.includes('image') && !field.accept?.includes('.md') && !field.accept?.includes('.pdf'))) ? (
                    <FileUploadField
                      field={field}
                      value={val}
                      onChange={(newVal) => handleInputChange(field.id, newVal)}
                      error={error}
                      isHeritageSkill={
                        skill.id === 'skill-yingzao-poster' ||
                        skill.title.includes('营造') ||
                        skill.title.includes('古建筑')
                      }
                    />
                  ) : (field.type === 'file' || field.uploadPreset === 'document' || field.uploadPreset === 'any' || (field.type === 'textarea' && ['source_text', 'topic_or_outline', 'scenario', 'article', 'document', 'content', 'source_code'].includes(field.id))) ? (
                    <SmartContentField
                      field={field}
                      value={val}
                      onChange={(newVal) => handleInputChange(field.id, newVal)}
                      error={error}
                      sampleText={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
                    />
                  ) : field.type === 'tags' ? (
                    <TagsField
                      field={field}
                      value={val}
                      onChange={(newVal) => handleInputChange(field.id, newVal)}
                      error={error}
                    />
                  ) : field.type === 'text' ? (
                    <input
                      id={`field-${field.id}`}
                      type="text"
                      placeholder={field.placeholder}
                      value={val ?? ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                        error ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                      }`}
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={`field-${field.id}`}
                      rows={4}
                      placeholder={field.placeholder}
                      value={val ?? ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={`w-full p-3 bg-slate-50 border rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                        error ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                      }`}
                    />
                  ) : field.type === 'code' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono">
                        <span>语言: {field.language || 'plaintext'}</span>
                        <span>{typeof val === 'string' ? val.length : 0} 字符</span>
                      </div>
                      <textarea
                        id={`field-${field.id}`}
                        rows={6}
                        placeholder={field.placeholder || '// 在此输入代码...'}
                        value={val ?? ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={`w-full p-3 font-mono bg-slate-900 text-slate-100 border rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                          error ? 'border-red-500' : 'border-slate-800'
                        }`}
                      />
                    </div>
                  ) : field.type === 'select' ? (
                    <select
                      id={`field-${field.id}`}
                      value={val ?? ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      {field.options?.map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'radio' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {field.options && field.options.length > 0 ? (
                        field.options.map((opt, idx) => {
                          const isChecked = val === opt.value;
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => handleInputChange(field.id, opt.value)}
                              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-xs ring-1 ring-indigo-500/30'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })
                      ) : (
                        <input
                          id={`field-${field.id}`}
                          type="text"
                          placeholder={field.placeholder || '输入选项内容...'}
                          value={val ?? ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      )}
                    </div>
                  ) : field.type === 'switch' ? (
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs text-slate-700 font-medium">
                        {field.description || field.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInputChange(field.id, !val)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          val ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            val ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ) : field.type === 'slider' ? (
                    <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">当前数值:</span>
                        <span className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {val ?? field.defaultValue ?? 0}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={field.validation?.min ?? 0}
                        max={field.validation?.max ?? 100}
                        step={field.validation?.step ?? 1}
                        value={val ?? field.defaultValue ?? 0}
                        onChange={(e) => handleInputChange(field.id, Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  ) : field.type === 'number' ? (
                    <input
                      id={`field-${field.id}`}
                      type="number"
                      min={field.validation?.min}
                      max={field.validation?.max}
                      step={field.validation?.step || 1}
                      value={val ?? ''}
                      onChange={(e) => handleInputChange(field.id, Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  ) : (
                    <input
                      id={`field-${field.id}`}
                      type="text"
                      placeholder={field.placeholder}
                      value={val ?? ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  )}

                  {/* Validation Error Message */}
                  {error && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span>{error}</span>
                    </p>
                  )}
                </div>
              );
            })}

            {/* Submit & Reset Buttons */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置</span>
              </button>

              <button
                type="submit"
                disabled={isRunning}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isRunning ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin text-indigo-200" />
                    <span>AI 正在执行并流式生成结果...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>执行 Skill 获得结果</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Output Result Viewer (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 min-h-[500px] flex flex-col justify-between">
          {/* Result Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>生成结果面板</span>
              </h2>
              {executionTimeMs > 0 && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{(executionTimeMs / 1000).toFixed(2)}s</span>
                </span>
              )}
            </div>

            {/* Output Tools & Actions */}
            <div className="flex items-center gap-1.5">
              {/* View mode toggle */}
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                <button
                  onClick={() => setOutputViewMode('rendered')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    outputViewMode === 'rendered'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  排版预览
                </button>
                <button
                  onClick={() => setOutputViewMode('raw')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    outputViewMode === 'raw'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Raw 文本
                </button>
              </div>

              <button
                onClick={handleCopyResult}
                disabled={!outputResult}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors"
                title="复制全部结果"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputResult}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors"
                title="下载为 Markdown 文件"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title={isFullscreen ? '退出全屏' : '全屏专注查看'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Result Content Area */}
          <div className="flex-1 overflow-y-auto">
            {errorMsg ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>执行异常</span>
                </div>
                <p>{errorMsg}</p>
              </div>
            ) : isRunning && !outputResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 animate-pulse">
                  <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    {skill.uiSchema?.outputConfig?.renderType === 'social-cards' ||
                    skill.title.includes('卡片') ||
                    skill.title.includes('Social') ||
                    skill.title.includes('Guizang')
                      ? 'Guizang 社交卡片与多端交付排版生成中...'
                      : skill.uiSchema?.outputConfig?.renderType === 'poster' || skill.title.includes('营造')
                      ? '营造艺术指导与海报生成中...'
                      : 'AI 技能执行中...'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    正在分析核心论点、排布信息层级与视觉设计系统，请稍候...
                  </p>
                </div>
              </div>
            ) : outputResult ? (
              skill.uiSchema?.outputConfig?.renderType === 'html' ||
              skill.uiSchema?.outputConfig?.renderType === 'web-preview' ||
              (outputResult.includes('```html') && !skill.uiSchema?.outputConfig?.renderType?.includes('deck') && !skill.uiSchema?.outputConfig?.renderType?.includes('social')) ? (
                <SkillHtmlLiveResult
                  rawOutput={outputResult}
                  formValues={formValues}
                  title={skill.title}
                />
              ) : skill.uiSchema?.outputConfig?.renderType === 'web-deck' ||
              skill.uiSchema?.outputConfig?.renderType === 'presentation' ? (
                <SkillWebDeckResult
                  rawOutput={outputResult}
                  formValues={formValues}
                  title={skill.title}
                />
              ) : skill.uiSchema?.outputConfig?.renderType === 'social-cards' ? (
                <SkillSocialCardsResult
                  rawOutput={outputResult}
                  formValues={formValues}
                  title={skill.title}
                />
              ) : skill.uiSchema?.outputConfig?.renderType === 'poster' ? (
                <SkillPosterResult
                  rawOutput={outputResult}
                  formValues={formValues}
                  title={skill.title}
                />
              ) : outputViewMode === 'rendered' ? (
                <div className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl prose-table:border prose-table:border-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {outputResult}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                  {outputResult}
                </pre>
              )
            ) : (
              /* Idle Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50/60 border border-indigo-100/60 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">等待执行指令</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    在左侧表单中输入或确认参数后，点击「执行 Skill 获得结果」，此处将实时流式渲染结果。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Result Status */}
          {outputResult && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>共生成 {outputResult.length} 个字符</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>生成完毕</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible History Drawer / Timeline */}
      {showHistoryDrawer && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              <span>「{skill.title}」的历史执行记录 ({skillHistory.length})</span>
            </h3>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕ 收起
            </button>
          </div>

          {skillHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {skillHistory.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-2xl space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(rec.timestamp).toLocaleString()}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        rec.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rec.status === 'success' ? '成功' : '失败'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-2 font-mono bg-white p-2 rounded-lg border border-slate-200/60">
                    {rec.outputResult || rec.errorMessage || '无输出内容'}
                  </p>

                  <button
                    onClick={() => handleRestoreHistory(rec)}
                    className="w-full py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 text-[11px] font-semibold border border-indigo-200 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>回载此参数并重现</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              暂无历史运行记录，快去执行一次吧！
            </div>
          )}
        </div>
      )}
    </div>
  );
};
