import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  Sparkles,
  Clipboard,
  Trash2,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Eye,
  Check,
} from 'lucide-react';
import { FormField } from '../types';

export interface SmartFileItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  type?: string;
  textContent?: string;
}

export interface SmartContentValue {
  text?: string;
  files?: SmartFileItem[];
}

interface SmartContentFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  sampleText?: string;
}

export const SmartContentField: React.FC<SmartContentFieldProps> = ({
  field,
  value,
  onChange,
  error,
  sampleText,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'combined'>('combined');
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState<SmartFileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize incoming value: could be string (raw text), array of files, or SmartContentValue object
  const normalizedValue: SmartContentValue = React.useMemo(() => {
    if (!value) return { text: '', files: [] };
    if (typeof value === 'string') {
      return { text: value, files: [] };
    }
    if (Array.isArray(value)) {
      // List of files or strings
      const files: SmartFileItem[] = value
        .map((item, idx) => {
          if (!item) return null;
          if (typeof item === 'string') {
            return {
              id: `item-${idx}-${item.slice(0, 8)}`,
              name: `素材_${idx + 1}.png`,
              size: 0,
              dataUrl: item,
            };
          }
          if (typeof item === 'object') {
            return {
              id: item.id || `file-${idx}`,
              name: item.name || `附件_${idx + 1}`,
              size: item.size || 0,
              dataUrl: item.dataUrl || item.url || '',
              type: item.type,
              textContent: item.textContent || item.content,
            };
          }
          return null;
        })
        .filter(Boolean) as SmartFileItem[];
      return { text: '', files };
    }
    if (typeof value === 'object') {
      const files: SmartFileItem[] = Array.isArray(value.files) ? value.files : [];
      return {
        text: typeof value.text === 'string' ? value.text : typeof value.content === 'string' ? value.content : '',
        files,
      };
    }
    return { text: String(value), files: [] };
  }, [value]);

  const currentText = normalizedValue.text || '';
  const currentFiles = normalizedValue.files || [];

  // Update text
  const handleTextChange = (newText: string) => {
    if (field.type === 'file' && currentFiles.length > 0) {
      onChange({
        text: newText,
        files: currentFiles,
      });
    } else if (field.type === 'file') {
      onChange({
        text: newText,
        files: [],
      });
    } else {
      // If field expects string, we can either pass string or composite
      if (currentFiles.length > 0) {
        onChange({
          text: newText,
          files: currentFiles,
        });
      } else {
        onChange(newText);
      }
    }
  };

  // Process uploaded files with automatic text extraction for document/code types
  const processFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const readPromises = fileList.map((file) => {
      return new Promise<SmartFileItem>(async (resolve) => {
        const isDocx = file.name.endsWith('.docx') || file.type.includes('wordprocessingml') || file.type.includes('vnd.openxmlformats');
        const isTextLike =
          file.type.startsWith('text/') ||
          file.type.includes('json') ||
          file.type.includes('markdown') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.ts') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.py') ||
          file.name.endsWith('.sql');

        if (isDocx) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            const docXml = await zip.file('word/document.xml')?.async('text');
            let textContent = '';
            if (docXml) {
              textContent = docXml
                .replace(/<\/w:p>/g, '\n')
                .replace(/<w:tab\/>/g, '\t')
                .replace(/<[^>]+>/g, '')
                .trim();
            }
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: file.name,
                size: file.size,
                dataUrl: reader.result as string,
                type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                textContent: textContent || undefined,
              });
            };
            reader.readAsDataURL(file);
            return;
          } catch (e) {
            console.warn('Docx parse error on client:', e);
          }
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;

          if (isTextLike) {
            const textReader = new FileReader();
            textReader.onload = () => {
              const textContent = textReader.result as string;
              resolve({
                id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: file.name,
                size: file.size,
                dataUrl,
                type: file.type,
                textContent,
              });
            };
            textReader.onerror = () => {
              resolve({
                id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: file.name,
                size: file.size,
                dataUrl,
                type: file.type,
              });
            };
            textReader.readAsText(file);
          } else {
            resolve({
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              size: file.size,
              dataUrl,
              type: file.type,
            });
          }
        };
        reader.onerror = () => {
          resolve({
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: file.size,
            dataUrl: '',
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newItems = await Promise.all(readPromises);
    const updatedFiles = field.multiple !== false ? [...currentFiles, ...newItems] : [newItems[0]];

    // If no text was written yet and we uploaded a markdown/text document, auto-populate snippet
    let nextText = currentText;
    const textDoc = newItems.find((f) => f.textContent);
    if (!currentText.trim() && textDoc && textDoc.textContent) {
      nextText = `[已附加文档: ${textDoc.name}]\n${textDoc.textContent.slice(0, 1000)}${textDoc.textContent.length > 1000 ? '\n...(其余内容已作为完整文档附件附加)' : ''}`;
    }

    onChange({
      text: nextText,
      files: updatedFiles,
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedFiles = currentFiles.filter((_, idx) => idx !== indexToRemove);
    onChange({
      text: currentText,
      files: updatedFiles,
    });
  };

  const handleClearAll = () => {
    onChange({
      text: '',
      files: [],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleTextChange(text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      }
    } catch {}
  };

  const handleFillSample = () => {
    const textToFill =
      sampleText ||
      field.defaultValue ||
      `AI Agent 时代的产品范式重构：为什么我们不再需要繁杂的单体控制台？

核心观点与事实拆解：
1. 传统 SaaS 的层级菜单黄昏：78% 的功能常年闲置，用户被困在复杂表单与跨工具跳转中。
2. 意图自适应 UI 的兴起：从“用户学习软件”转变为“软件理解意图并在运行时自装配界面”。
3. 沉浸式单一任务专注：每一次交互都直击核心，拒绝无意义的视觉噪声与功能堆砌。
4. 生产力工具的终极形态：从臃肿的巨石应用，进化为即用即走、随需而生的轻量智能微构件。`;

    handleTextChange(typeof textToFill === 'string' ? textToFill : JSON.stringify(textToFill, null, 2));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileBadgeStyle = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'bg-red-500 text-white';
    if (ext === 'doc' || ext === 'docx') return 'bg-blue-600 text-white';
    if (ext === 'ppt' || ext === 'pptx') return 'bg-amber-600 text-white';
    if (ext === 'md' || ext === 'txt') return 'bg-emerald-600 text-white';
    if (ext === 'csv' || ext === 'xlsx' || ext === 'json') return 'bg-teal-600 text-white';
    return 'bg-indigo-600 text-white';
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={field.accept || '.pdf,.docx,.doc,.pptx,.txt,.md,.json,.csv,.ts,.js,.py,image/*'}
        multiple={field.multiple !== false}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Action & Mode Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('combined')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'combined'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📎 附件 + 文案双模
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📂 仅传附件 ({currentFiles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✍️ 在线编辑文本
          </button>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFillSample}
            className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="填入精选示范内容"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>示范内容</span>
          </button>
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="从剪贴板粘贴"
          >
            {pasteSuccess ? <Check className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3" />}
            <span>{pasteSuccess ? '已粘贴' : '粘贴'}</span>
          </button>
          {(currentText || currentFiles.length > 0) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
              title="清空文本与附件"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Upload Dropzone (Visible in 'upload' and 'combined' modes) */}
      {(activeTab === 'upload' || activeTab === 'combined') && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`group relative rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
              : error && currentFiles.length === 0 && !currentText
              ? 'border-red-400 bg-red-50/20 hover:border-red-500'
              : currentFiles.length > 0
              ? 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
              : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <UploadCloud className="w-4 h-4" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">
                <span className="text-indigo-600 group-hover:underline">点击上传文档 / 大纲 / 素材附件</span>
                <span className="text-slate-500 font-normal"> 或直接拖拽文件至此处</span>
              </p>
              <p className="text-[11px] text-slate-400">
                支持 Markdown (.md)、Word (.docx)、PDF、TXT、CSV、JSON 或 图片素材，自动提取结构与论据
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files Chips & Cards */}
      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>已挂载附件文档与素材 ({currentFiles.length} 个)</span>
            </span>
            <span className="text-slate-400 font-normal">点击右侧 ✕ 可移除</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentFiles.map((file, idx) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {file.dataUrl && file.dataUrl.startsWith('data:image/') ? (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] font-mono shrink-0 shadow-2xs ${getFileBadgeStyle(
                        file.name
                      )}`}
                    >
                      {file.name.split('.').pop()?.toUpperCase().slice(0, 4) || 'DOC'}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {file.size > 0 && <span>{formatFileSize(file.size)}</span>}
                      {file.textContent && (
                        <span className="text-emerald-600 font-mono">已提取 {file.textContent.length} 字</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  {file.textContent && (
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                      title="预览提取文本"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFile(idx, e)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="移除该文件"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Area (Visible in 'text' and 'combined' modes) */}
      {(activeTab === 'text' || activeTab === 'combined') && (
        <div className="space-y-1">
          <div className="relative">
            <textarea
              id={`field-${field.id}`}
              rows={activeTab === 'combined' ? 4 : 8}
              placeholder={
                field.placeholder ||
                '在此输入或粘贴长文、核心论点、汇报大纲、脚本笔记或针对上传附件的补充要求...'
              }
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={`w-full p-3.5 bg-slate-50 border rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                error && !currentText && currentFiles.length === 0
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-slate-200'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>
              {currentFiles.length > 0 ? `已挂载 ${currentFiles.length} 个附件` : '可直接拖入附件自动提取'}
            </span>
            <span className="font-mono">{currentText.length} 字符</span>
          </div>
        </div>
      )}

      {/* File Text Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xl w-full max-h-[80vh] flex flex-col space-y-3 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 truncate max-w-xs">
                  {previewFile.name} (已提取文档文本)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg font-bold"
              >
                ✕
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto p-3 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap">
              {previewFile.textContent}
            </pre>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  handleTextChange(previewFile.textContent || '');
                  setPreviewFile(null);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
              >
                将此文档内容导入下方编辑框
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
