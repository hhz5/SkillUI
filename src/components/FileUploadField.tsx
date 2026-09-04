import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Plus, Sparkles, FileText } from 'lucide-react';
import { FormField } from '../types';
import { SAMPLE_HERITAGE_PHOTOS } from '../data/samplePhotos';

interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  type?: string;
}

interface FileUploadFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  isHeritageSkill?: boolean;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  field,
  value,
  onChange,
  error,
  isHeritageSkill = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract description and raw list from value
  const descriptionText = React.useMemo(() => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return typeof value.description === 'string' ? value.description : typeof value.text === 'string' ? value.text : '';
    }
    return '';
  }, [value]);

  // Normalize current items into array with guaranteed stable unique IDs
  const currentItems: UploadedFileItem[] = React.useMemo(() => {
    if (!value) return [];
    const list = Array.isArray(value)
      ? value
      : typeof value === 'object' && Array.isArray(value.files)
      ? value.files
      : [value];

    return list
      .map((item, idx) => {
        if (!item) return null;
        if (typeof item === 'string') {
          // Use content slice instead of array index to keep keys stable when preceding items are deleted
          const hashId = `url-${item.length}-${item.slice(-24).replace(/[^a-zA-Z0-9]/g, '')}`;
          return {
            id: hashId || `item-${idx}`,
            name: `素材图片_${idx + 1}.png`,
            size: 0,
            dataUrl: item,
          };
        }
        if (typeof item === 'object') {
          return {
            id: item.id || `obj-${idx}-${(item.name || '').slice(0, 10)}`,
            name: item.name || `素材_${idx + 1}`,
            size: item.size || 0,
            dataUrl: item.dataUrl || item.url || '',
            type: item.type,
          };
        }
        return null;
      })
      .filter(Boolean) as UploadedFileItem[];
  }, [value]);

  const updateCompositeValue = (newFiles: UploadedFileItem[], newDesc: string) => {
    onChange({
      files: newFiles,
      description: newDesc,
    });
  };

  const handleDescriptionChange = (newDesc: string) => {
    updateCompositeValue(currentItems, newDesc);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const readPromises = fileList.map((file) => {
      return new Promise<UploadedFileItem>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: file.size,
            dataUrl: reader.result as string,
            type: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((newItems) => {
      if (field.multiple !== false) {
        const combined = [...currentItems, ...newItems];
        updateCompositeValue(combined, descriptionText);
      } else {
        updateCompositeValue(newItems.slice(0, 1), descriptionText);
      }
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

  // Explicitly remove by array index using the exact current value array to prevent stale closure mutations
  const handleRemoveByIndex = (indexToRemove: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = currentItems.filter((_, idx) => idx !== indexToRemove);
    updateCompositeValue(updated, descriptionText);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateCompositeValue([], descriptionText);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSamplePhotos = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const freshSamples = SAMPLE_HERITAGE_PHOTOS.map((p, i) => ({
      ...p,
      id: `sample-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    if (field.multiple !== false) {
      updateCompositeValue([...currentItems, ...freshSamples], descriptionText);
    } else {
      updateCompositeValue(freshSamples.slice(0, 1), descriptionText);
    }
  };

  // Paste support
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const isImageField =
    (!field.accept && !field.id?.includes('doc') && !field.id?.includes('file')) ||
    (field.accept ? field.accept.includes('image') : false) ||
    field.uploadPreset === 'image';

  const isDocumentField =
    !isImageField ||
    field.id?.includes('doc') ||
    field.id?.includes('file') ||
    (field.accept
      ? field.accept.includes('pdf') ||
        field.accept.includes('docx') ||
        field.accept.includes('pptx') ||
        field.accept.includes('txt') ||
        field.accept.includes('md')
      : false);

  const getFileBadgeColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'bg-red-500 text-white';
    if (ext === 'doc' || ext === 'docx') return 'bg-blue-600 text-white';
    if (ext === 'ppt' || ext === 'pptx') return 'bg-amber-600 text-white';
    if (ext === 'md' || ext === 'txt') return 'bg-emerald-600 text-white';
    if (ext === 'csv' || ext === 'xlsx' || ext === 'json') return 'bg-teal-600 text-white';
    return 'bg-indigo-600 text-white';
  };

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={field.accept || (isDocumentField ? '.pdf,.docx,.pptx,.txt,.md,.json,.csv,image/*' : 'image/*')}
        multiple={field.multiple !== false}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Upload / Dropzone Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative rounded-2xl border-2 border-dashed p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
            : error
            ? 'border-red-400 bg-red-50/20 hover:border-red-500'
            : currentItems.length > 0
            ? 'border-slate-200 hover:border-indigo-400 bg-slate-50/70'
            : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <UploadCloud className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800">
              <span className="text-indigo-600 group-hover:underline">
                {isDocumentField ? '点击选择文档或素材附件' : '点击选择照片素材'}
              </span>
              <span className="text-slate-500 font-normal"> 或直接将文件拖拽至此处</span>
            </p>
            <p className="text-[11px] text-slate-400">
              {isDocumentField
                ? '支持 PDF / Word / PPT / Markdown / TXT / CSV 或 图片素材，支持剪贴板粘贴'
                : field.multiple !== false
                ? '支持单张或批量多图上传 (JPG / PNG / WEBP / 剪贴板粘贴)'
                : '支持 JPG / PNG / WEBP 等格式，可直接 Ctrl+V 粘贴'}
            </p>
          </div>

          {/* Quick preset button for Yingzao / Architecture skills */}
          {isHeritageSkill && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLoadSamplePhotos}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                title="自动填入辽代木构应县木塔、大同古城角楼高清测试样张"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>载入古建测试样张（应县木塔 / 大同角楼）</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Items Gallery */}
      {currentItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>已选文件与素材 ({currentItems.length} 项)</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              清空全部
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {currentItems.map((item, idx) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs overflow-hidden flex flex-col"
              >
                <div className="relative aspect-4/3 w-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                  {item.dataUrl && item.dataUrl.startsWith('data:image/') ? (
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center w-full">
                      <div className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase mb-1 shadow-2xs ${getFileBadgeColor(item.name)}`}>
                        {item.name.split('.').pop() || 'FILE'}
                      </div>
                      <span className="text-[10px] text-slate-600 font-medium truncate max-w-full px-1">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* Remove Button with explicit index-based removal */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveByIndex(idx, e)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors z-20 cursor-pointer"
                    title="移除该文件"
                    aria-label={`移除第 ${idx + 1} 个素材`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-slate-900/60 backdrop-blur-xs text-[9px] font-mono text-white pointer-events-none">
                    #{idx + 1}
                  </div>
                </div>

                <div className="px-1 pt-1.5 pb-0.5 flex items-center justify-between min-w-0">
                  <span className="text-[10px] font-medium text-slate-700 truncate" title={item.name}>
                    {item.name}
                  </span>
                  {item.size > 0 && (
                    <span className="text-[9px] text-slate-400 shrink-0 ml-1">
                      {formatFileSize(item.size)}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Add More button in grid */}
            {field.multiple !== false && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 flex flex-col items-center justify-center p-3 text-slate-500 hover:text-indigo-600 transition-colors aspect-4/3 cursor-pointer"
              >
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">添加更多文件/素材</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Additional Text Description input box directly below file upload */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`field-desc-${field.id}`}
            className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>需求文字描述 / 补充说明 (针对素材/附件的生成细节要求)</span>
          </label>
          {descriptionText.length > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              {descriptionText.length} 字
            </span>
          )}
        </div>
        <textarea
          id={`field-desc-${field.id}`}
          rows={2}
          value={descriptionText}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="可在此输入对此素材/照片/文档的具体需求描述、期望突出的主体特征、背景细节或构图要求..."
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
        />
      </div>
    </div>
  );
};
