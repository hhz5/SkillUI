import React, { useState } from 'react';
import {
  Upload,
  Link2,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Code,
  Globe,
  Sliders,
  FolderUp,
  FileCode,
  FolderTree,
  FileBox,
  ExternalLink,
} from 'lucide-react';
import { Skill, SkillFile, RepositoryInfo } from '../types';
import { SkillFileExplorer } from './SkillFileExplorer';

interface SkillImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillCreated: (skill: Skill, navigateToRunner?: boolean) => void;
}

const TEMPLATE_EXAMPLES = [
  {
    name: '🏛️ Yingzao · 营造 (建筑与在地文化海报)',
    content: `---
name: yingzao
description: 把拍下的真实古建筑、民居、文化街区与器物照片，转成经过艺术指导与图文遮挡互动的中文编辑海报。
---
# Yingzao · 营造
将真实古建筑、民居、文化街区与器物照片，转成经过艺术指导与图文遮挡互动的中文编辑海报。
- 遵循建筑现实与材质诚实，以矿物朱砂、生铁黛黑为主色场
- 标题字必须与建筑轮廓发生咬合、遮挡或精准留白穿插，杜绝孤岛感
- 支持 3:4, 1:1, 16:9 画幅与 3×3 视频分镜延展与 Kling/Runway Prompt 交付`,
    repoInfo: {
      owner: 'op7418',
      repo: 'guizang-yingzao-skill',
      branch: 'main',
      url: 'https://github.com/op7418/guizang-yingzao-skill',
      totalFiles: 127,
      stars: 18,
      description: '把真实古建筑、民居、文化街区与器物照片，转成经过艺术指导与图文遮挡互动的中文编辑海报',
    },
    files: [
      { path: 'yingzao/SKILL.md', name: 'SKILL.md', type: 'file' as const },
      { path: 'agents/openai.yaml', name: 'openai.yaml', type: 'file' as const },
      { path: 'references/frontend-layout-guide.md', name: 'frontend-layout-guide.md', type: 'file' as const },
      { path: 'references/image-generation-workflow.md', name: 'image-generation-workflow.md', type: 'file' as const },
      { path: 'references/art-direction.md', name: 'art-direction.md', type: 'file' as const },
      { path: 'scripts/photo_preflight.py', name: 'photo_preflight.py', type: 'file' as const },
      { path: 'scripts/typeset_compose.py', name: 'typeset_compose.py', type: 'file' as const },
    ],
  },
  {
    name: '📚 学术论文精读与概念拆解器',
    content: `---
name: paper-explainer
description: 深入拆解学术论文的核心假设、创新点与数学推导
---
# Role: Academic Professor & Research Peer Reviewer
你是一位在计算机科学与人工智能领域的资深教授与顶刊审稿人。
用户将提供论文摘要、核心定理或论文段落，你需要：
1. 💡 用通俗直观的比喻解释其核心创新机制
2. 🔬 提炼 3 个关键假设与可能成立的前提条件
3. ⚠️ 指出该方案潜在的局限性与未来改进方向`,
  },
  {
    name: '🎨 Midjourney / Flux 顶级提示词生成器',
    content: `---
name: prompt-crafter
description: 将简单的画面构想转化为专业摄影级 AI 绘图 Prompt
---
# Role: Master AI Visual Prompt Designer
精通灯光、构图、渲染引擎（Octane, Unreal 5）、镜头参数（35mm, f/1.4）与艺术流派。
输入画面主体、艺术风格与画面比例，生成 Midjourney / Flux 双版本提示词。`,
  },
  {
    name: '🛡️ 智能合约与安全漏洞检测器',
    content: `---
name: smart-contract-auditor
description: 审查 Solidity 智能合约中的重入攻击、整数溢出与权限控制漏洞
---
# Role: Senior Web3 Security Auditor & White Hat Hacker
对用户提供的智能合约代码进行安全审计，评估重入风险、Flash Loan 攻击脆弱性，并给出加固后的合约实现。`,
  },
];

export const SkillImporter: React.FC<SkillImporterProps> = ({
  isOpen,
  onClose,
  onSkillCreated,
}) => {
  const [importTab, setImportTab] = useState<'upload' | 'url' | 'paste'>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [pasteContent, setPasteContent] = useState<string>('');

  // Repository & Directory Tree Context
  const [skillFiles, setSkillFiles] = useState<SkillFile[]>([]);
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [primaryFilePath, setPrimaryFilePath] = useState<string>('');
  const [openaiYamlContent, setOpenaiYamlContent] = useState<string>('');
  const [readmeSnippet, setReadmeSnippet] = useState<string>('');
  const [showExplorerModal, setShowExplorerModal] = useState(false);

  // Status
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [parsedSkillPreview, setParsedSkillPreview] = useState<Partial<Skill> | null>(null);

  if (!isOpen) return null;

  // Handle file drop & selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg('');
    setFileName(file.name);
    setRepoInfo(null);
    setSkillFiles([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setFileContent(text);
    };
    reader.onerror = () => {
      setErrorMsg('读取文件内容失败，请检查文件编码或格式');
    };
    reader.readAsText(file);
  };

  // Handle URL fetch
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('请输入有效的 Skill URL 链接');
      return;
    }
    setErrorMsg('');
    setIsFetchingUrl(true);
    try {
      const res = await fetch('/api/skill/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '获取链接内容失败');
      }

      if (data.isRepository && data.repositoryInfo) {
        setRepoInfo(data.repositoryInfo);
        setSkillFiles(data.files || []);
        setPrimaryFilePath(data.primaryFile || '');
        setOpenaiYamlContent(data.openaiYamlContent || '');
        setReadmeSnippet(data.readmeSnippet || '');
        setPasteContent(data.content || '');
        setFileName(data.primaryFile || `${data.repositoryInfo.owner}/${data.repositoryInfo.repo}`);
      } else {
        setRepoInfo(null);
        setSkillFiles(data.files || []);
        setPasteContent(data.content);
        setFileName(urlInput.split('/').pop() || 'url-skill');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '获取 URL 失败，请检查链接是否为可公开访问的文本/Raw链接');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Trigger AI Parse & UI Generation
  const handleStartParse = async () => {
    const rawContent =
      importTab === 'upload'
        ? fileContent
        : importTab === 'url'
        ? pasteContent
        : pasteContent;

    if (!rawContent.trim()) {
      setErrorMsg('请先提供 Skill 内容（上传文件、抓取链接或输入文本）');
      return;
    }

    setErrorMsg('');
    setIsParsing(true);
    setParseProgress('正在分析 Skill 规则与目录文件体系...');

    try {
      setTimeout(() => setParseProgress('正在分析多模态素材、排版规范与脚本依赖...'), 800);
      setTimeout(() => setParseProgress('正在构建专属可视化 UI Schema 与输出配置...'), 1600);

      const res = await fetch('/api/skill/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rawContent,
          sourceName: fileName || 'user-skill',
          files: skillFiles,
          repositoryInfo: repoInfo,
          openaiYamlContent,
          readmeSnippet,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'AI 解析 Skill 失败');
      }

      const generated = resData.data;

      // Construct complete Skill object
      const fullSkill: Skill = {
        id: `skill-${Date.now()}`,
        title: generated.title || fileName || '未命名技能',
        description: generated.description || '由 Skill 自动生成的交互式可视化应用',
        icon: generated.icon || 'Sparkles',
        category: generated.category || 'custom',
        tags: generated.tags || ['自定义技能', 'AI生成'],
        rawSource: {
          type: importTab === 'upload' ? 'file' : importTab === 'url' ? 'url' : 'text',
          content: rawContent,
          originalName: fileName,
          url: importTab === 'url' ? urlInput : undefined,
        },
        files: skillFiles.length > 0 ? skillFiles : undefined,
        repositoryInfo: repoInfo || undefined,
        systemInstruction: generated.systemInstruction || rawContent,
        uiSchema: {
          title: generated.uiSchema?.title || generated.title || '技能表单',
          subtitle: generated.uiSchema?.subtitle || '填写以下参数并点击执行即可获取结果',
          fields: generated.uiSchema?.fields || [
            {
              id: 'user_input',
              name: '输入内容',
              label: '输入内容',
              type: 'textarea',
              placeholder: '请输入你的具体需求或待处理内容...',
              required: true,
            },
          ],
          outputConfig: generated.uiSchema?.outputConfig || {
            renderType: 'markdown',
            suggestedActions: ['copy', 'download', 'rerun'],
            customLayout: 'split',
          },
        },
        detectedEndpoints: generated.detectedEndpoints || [],
        hasExternalEndpoints: !!(generated.detectedEndpoints && generated.detectedEndpoints.length > 0),
        enginePreference: 'gemini', // Prefers Gemini AI engine by default as strictly requested
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
        runCount: 0,
      };

      setParsedSkillPreview(fullSkill);
    } catch (err: any) {
      console.error('Parse skill failed:', err);
      setErrorMsg(err.message || '解析失败，请检查输入内容或网络连接');
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  const handleConfirmSave = (navigateToRunner: boolean = true) => {
    if (parsedSkillPreview) {
      onSkillCreated(parsedSkillPreview as Skill, navigateToRunner);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                导入 Skill 并自动生成 UI 界面
              </h2>
              <p className="text-xs text-slate-500">
                支持通用文件、链接与 Markdown 指令，AI 自动转化为可视化应用
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* If NOT parsed preview yet */}
          {!parsedSkillPreview ? (
            <>
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImportTab('upload')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    importTab === 'upload'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>文件上传</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('url')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    importTab === 'url'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>输入链接 (URL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('paste')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    importTab === 'paste'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>直接粘贴 / 模版</span>
                </button>
              </div>

              {/* Mode 1: File Upload */}
              {importTab === 'upload' && (
                <div className="space-y-3">
                  <label
                    htmlFor="skill-file-upload"
                    className="group border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 group-hover:bg-indigo-200/80 text-indigo-600 flex items-center justify-center transition-colors">
                      <FolderUp className="w-6 h-6" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-slate-800">
                        {fileName ? (
                          <span className="text-indigo-600 flex items-center justify-center gap-1">
                            <FileCode className="w-4 h-4" />
                            已选中: {fileName}
                          </span>
                        ) : (
                          '点击选择文件 或 直接将 Skill 文件拖拽至此处'
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        支持 .md, .json, .yaml, .txt, .js, .py 等普遍格式规则文件
                      </p>
                    </div>
                    <input
                      id="skill-file-upload"
                      type="file"
                      accept=".md,.json,.yaml,.yml,.txt,.py,.js,.ts"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {fileContent && (
                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 max-h-32 overflow-y-auto font-mono">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1">
                        已读取内容预览 ({fileContent.length} 字符):
                      </div>
                      <pre className="whitespace-pre-wrap">{fileContent.slice(0, 400)}...</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Link URL */}
              {importTab === 'url' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Skill 规则公开地址 (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://raw.githubusercontent.com/.../SKILL.md"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleFetchUrl}
                        disabled={isFetchingUrl || !urlInput.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0"
                      >
                        {isFetchingUrl ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        <span>拉取内容</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      支持 GitHub Raw、Gist 链接或任何返回纯文本/Markdown 的公网链接
                    </p>
                  </div>

                  {/* Repository structure card if detected */}
                  {repoInfo && (
                    <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 shadow-md animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <FileBox className="w-4 h-4 text-indigo-400" />
                          <span className="font-bold text-white">
                            GitHub Skill 仓库结构体系已解析
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-mono border border-indigo-800">
                          {skillFiles.length} 个资源文件
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="font-mono text-slate-200 font-medium truncate">
                            {repoInfo.owner}/{repoInfo.repo}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                            <span>主入口:</span>
                            <span className="text-amber-400 font-mono truncate">
                              {primaryFilePath || 'SKILL.md'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowExplorerModal(!showExplorerModal)}
                          className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors font-medium shrink-0 border border-slate-700"
                        >
                          <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                          <span>{showExplorerModal ? '收起目录树' : '浏览完整目录与文件'}</span>
                        </button>
                      </div>

                      {/* Expandable File Tree Inspector */}
                      {showExplorerModal && (
                        <div className="pt-2 border-t border-slate-800">
                          <SkillFileExplorer
                            files={skillFiles}
                            repositoryInfo={repoInfo}
                            activeFilePath={primaryFilePath}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {pasteContent && !repoInfo && (
                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 max-h-32 overflow-y-auto font-mono">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1">
                        已抓取成功:
                      </div>
                      <pre className="whitespace-pre-wrap">{pasteContent.slice(0, 400)}...</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Direct Paste & Template Examples */}
              {importTab === 'paste' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        粘贴 Skill 规则 / Markdown / Prompt
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {pasteContent.length} 字符
                      </span>
                    </div>
                    <textarea
                      rows={7}
                      placeholder="在此直接粘贴 SKILL.md、YAML 配置、角色 Prompt、OpenAPI 文档或逻辑指令..."
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Pre-made quick templates */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>或者快速选用样例 Skill 进行体验：</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TEMPLATE_EXAMPLES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPasteContent(tmpl.content);
                            setFileName(tmpl.name);
                            if (tmpl.files) {
                              setSkillFiles(tmpl.files);
                              setPrimaryFilePath(tmpl.files[0]?.path || '');
                            } else {
                              setSkillFiles([]);
                            }
                            if (tmpl.repoInfo) {
                              setRepoInfo(tmpl.repoInfo);
                            } else {
                              setRepoInfo(null);
                            }
                          }}
                          className="text-left p-2.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl transition-all"
                        >
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {tmpl.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Parsing Progress Banner */}
              {isParsing && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>{parseProgress || 'AI 正在智能解析 Skill 并生成 UI 界面...'}</span>
                  </div>
                  <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-1.5 rounded-full animate-indeterminate" />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Step 2: AI Parse Preview & Success */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h3 className="text-xs font-bold text-emerald-900">
                    UI 交互界面已自动生成完成！
                  </h3>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    AI 已成功提取核心指令，构建了包含{' '}
                    <strong>{parsedSkillPreview.uiSchema?.fields?.length || 0} 个交互字段</strong>{' '}
                    的可视化表单，你可以立即体验或保存至技能库。
                  </p>
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    应用名称：{parsedSkillPreview.title}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-md">
                    分类: {parsedSkillPreview.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{parsedSkillPreview.description}</p>

                {/* Form fields summary */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>自动生成的交互输入字段：</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedSkillPreview.uiSchema?.fields?.map((f, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 shadow-xs"
                      >
                        <span className="text-indigo-600 font-bold">{f.label}</span>
                        <span className="text-[10px] text-slate-400">({f.type})</span>
                        {f.required && <span className="text-red-500 text-[10px]">*</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Detected Endpoints */}
                {parsedSkillPreview.detectedEndpoints &&
                  parsedSkillPreview.detectedEndpoints.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-amber-600" />
                        <span>检测到外部 API 端点：</span>
                      </div>
                      <div className="text-[11px] text-amber-700">
                        默认使用 Gemini AI 引擎智能处理，亦可在运行台中自由切换直接请求。
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (parsedSkillPreview) {
                setParsedSkillPreview(null);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            {parsedSkillPreview ? '返回重新调整' : '取消'}
          </button>

          {!parsedSkillPreview ? (
            <button
              type="button"
              onClick={handleStartParse}
              disabled={
                isParsing ||
                isFetchingUrl ||
                (importTab === 'upload' && !fileContent) ||
                (importTab === 'url' && !pasteContent && !urlInput) ||
                (importTab === 'paste' && !pasteContent.trim())
              }
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 正在生成 UI 表单...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>解析并生成可视化应用</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleConfirmSave(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                保存到技能库
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSave(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>立即打开交互界面并使用</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
