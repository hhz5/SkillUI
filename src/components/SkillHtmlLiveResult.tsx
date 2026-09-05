import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  ExternalLink,
  RotateCw,
  Code,
  Eye,
  FileText,
  Sparkles,
  Palette,
  Layers,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SkillHtmlLiveResultProps {
  rawOutput: string;
  formValues: Record<string, any>;
  title: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile' | 'responsive';

export const SkillHtmlLiveResult: React.FC<SkillHtmlLiveResultProps> = ({
  rawOutput,
  formValues,
  title,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'docs'>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isDarkCanvas, setIsDarkCanvas] = useState(false);

  // Extract HTML code block or entire HTML document from rawOutput
  const { extractedHtml, extractedDocs, hasHtml } = useMemo(() => {
    if (!rawOutput) {
      return { extractedHtml: '', extractedDocs: '', hasHtml: false };
    }

    // 1. Look for ```html ... ``` block
    const htmlBlockRegex = /```(?:html|htm|xml)\s*([\s\S]*?)```/i;
    const match = rawOutput.match(htmlBlockRegex);

    if (match && match[1]?.trim()) {
      const htmlCode = match[1].trim();
      const docs = rawOutput.replace(htmlBlockRegex, '').trim();
      return {
        extractedHtml: htmlCode,
        extractedDocs: docs,
        hasHtml: true,
      };
    }

    // 2. Look for <!DOCTYPE html> or <html> tag
    if (rawOutput.includes('<!DOCTYPE html>') || rawOutput.includes('<html') || (rawOutput.includes('<div') && rawOutput.includes('style='))) {
      return {
        extractedHtml: rawOutput,
        extractedDocs: '',
        hasHtml: true,
      };
    }

    // 3. Look for generic ``` ... ``` block with HTML-like tags
    const anyCodeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const genericMatch = rawOutput.match(anyCodeBlockRegex);
    if (genericMatch && (genericMatch[1].includes('<div') || genericMatch[1].includes('<section') || genericMatch[1].includes('<svg'))) {
      const htmlCode = genericMatch[1].trim();
      const docs = rawOutput.replace(anyCodeBlockRegex, '').trim();
      return {
        extractedHtml: htmlCode,
        extractedDocs: docs,
        hasHtml: true,
      };
    }

    return {
      extractedHtml: '',
      extractedDocs: rawOutput,
      hasHtml: false,
    };
  }, [rawOutput]);

  // Construct a self-contained, high-fidelity sandbox HTML document
  const sandboxDoc = useMemo(() => {
    if (!extractedHtml) return '';

    let content = extractedHtml;
    // If it's already a full HTML document, inject Tailwind CDN if missing
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      if (!content.includes('tailwindcss')) {
        content = content.replace(
          '<head>',
          `<head>\n<script src="https://cdn.tailwindcss.com"></script>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">\n<style>body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }</style>`
        );
      }
      return content;
    }

    // Wrap snippet in standard HTML5 with Tailwind CSS, Inter/Plus Jakarta Sans font, and icons
    return `<!DOCTYPE html>
<html lang="zh-CN" class="${isDarkCanvas ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Live UI Preview'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
            serif: ['Playfair Display', 'Georgia', 'serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: ${isDarkCanvas ? '#09090b' : '#f8fafc'};
      color: ${isDarkCanvas ? '#f4f4f5' : '#0f172a'};
      min-height: 100vh;
    }
    /* Custom Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(150,150,150,0.3); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(150,150,150,0.5); }
  </style>
</head>
<body class="p-4 sm:p-6 md:p-8 flex flex-col items-center justify-start min-h-screen">
  <div class="w-full max-w-7xl mx-auto">
    ${content}
  </div>
</body>
</html>`;
  }, [extractedHtml, title, isDarkCanvas]);

  const handleCopyCode = async () => {
    if (!extractedHtml) return;
    try {
      await navigator.clipboard.writeText(extractedHtml);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyAll = async () => {
    if (!rawOutput) return;
    try {
      await navigator.clipboard.writeText(rawOutput);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  };

  const handleDownloadHtml = () => {
    if (!sandboxDoc) return;
    const blob = new Blob([sandboxDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[\/\s:]+/g, '_')}_UI_Preview.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (!sandboxDoc) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(sandboxDoc);
      newWindow.document.close();
    }
  };

  // Device width styles
  const deviceContainerClass = useMemo(() => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[390px] h-[780px] shadow-2xl rounded-[44px] border-[10px] border-slate-900 overflow-hidden ring-1 ring-slate-800/20';
      case 'tablet':
        return 'w-[768px] h-[850px] shadow-2xl rounded-[32px] border-[8px] border-slate-900 overflow-hidden ring-1 ring-slate-800/20';
      case 'desktop':
        return 'w-full max-w-[1280px] h-[780px] shadow-xl rounded-2xl border border-slate-200 overflow-hidden';
      case 'responsive':
      default:
        return 'w-full h-full min-h-[650px] rounded-xl border border-slate-200 overflow-hidden';
    }
  }, [deviceMode]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200/80 overflow-hidden">
      {/* Top Action Toolbar */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>实时沙箱预览</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'code'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML/CSS 源码</span>
          </button>

          {extractedDocs && (
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'docs'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>设计规范与说明</span>
            </button>
          )}
        </div>

        {/* Center Device Mode (Only visible in Preview tab) */}
        {activeTab === 'preview' && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setDeviceMode('desktop')}
              title="桌面宽屏模式"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">桌面端</span>
            </button>

            <button
              onClick={() => setDeviceMode('tablet')}
              title="平板模式 (768px)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                deviceMode === 'tablet'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">平板 iPad</span>
            </button>

            <button
              onClick={() => setDeviceMode('mobile')}
              title="移动端模式 (iPhone 390px)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">手机 iPhone</span>
            </button>

            <button
              onClick={() => setDeviceMode('responsive')}
              title="自适应 100% 宽度"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                deviceMode === 'responsive'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">自适应</span>
            </button>
          </div>
        )}

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'preview' && (
            <>
              <button
                onClick={() => setIsDarkCanvas(!isDarkCanvas)}
                className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isDarkCanvas
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title={isDarkCanvas ? '切换至亮色背景' : '切换至暗色背景'}
              >
                <Palette className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
                title="重载沙箱页面"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleOpenInNewTab}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
                title="在新窗口中全屏打开独立页面"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={activeTab === 'code' ? handleCopyCode : handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors shadow-sm"
            title="复制代码"
          >
            {copiedCode || copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>复制代码</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-indigo-600/20"
            title="下载完整的单文件 HTML 网页"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载 HTML</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        {activeTab === 'preview' ? (
          hasHtml ? (
            <div className="w-full flex-1 flex items-center justify-center min-h-[580px]">
              <div className={`transition-all duration-300 relative bg-white ${deviceContainerClass}`}>
                {/* Mobile iPhone Notch simulation */}
                {deviceMode === 'mobile' && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-20 pointer-events-none flex items-center justify-end px-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700"></div>
                  </div>
                )}

                <iframe
                  key={iframeKey}
                  title="Live Generated UI Sandbox"
                  srcDoc={sandboxDoc}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-modals"
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>生成结果为文档/文本格式</span>
              </div>
              <div className="prose prose-slate prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {rawOutput}
                </ReactMarkdown>
              </div>
            </div>
          )
        ) : activeTab === 'code' ? (
          <div className="w-full max-w-5xl h-full flex flex-col bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-indigo-400 font-semibold">index.html (Tailwind CSS + HTML5)</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '已复制源码' : '复制代码'}</span>
              </button>
            </div>
            <pre className="flex-1 p-5 overflow-auto text-xs font-mono text-slate-200 leading-relaxed select-all">
              {extractedHtml || rawOutput}
            </pre>
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-900 font-bold text-base">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>设计系统与页面规范说明</span>
            </div>
            <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {extractedDocs || rawOutput}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
