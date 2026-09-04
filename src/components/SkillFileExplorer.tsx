import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Search,
  ExternalLink,
  Code2,
  FileSpreadsheet,
  FileBox,
  FileCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { SkillFile, RepositoryInfo } from '../types';

interface SkillFileExplorerProps {
  files: SkillFile[];
  repositoryInfo?: RepositoryInfo;
  activeFilePath?: string;
  onSelectFile?: (file: SkillFile) => void;
  defaultExpandAll?: boolean;
  className?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  file?: SkillFile;
  children: Record<string, TreeNode>;
}

export const SkillFileExplorer: React.FC<SkillFileExplorerProps> = ({
  files,
  repositoryInfo,
  activeFilePath,
  onSelectFile,
  defaultExpandAll = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (defaultExpandAll) {
      files.forEach((f) => {
        if (f.type === 'dir') init[f.path] = true;
        const parts = f.path.split('/');
        parts.pop();
        let curr = '';
        parts.forEach((p) => {
          curr = curr ? `${curr}/${p}` : p;
          init[curr] = true;
        });
      });
    } else {
      // expand root folders by default
      files.forEach((f) => {
        const root = f.path.split('/')[0];
        if (root) init[root] = true;
      });
    }
    return init;
  });

  const [selectedFile, setSelectedFile] = useState<SkillFile | null>(() => {
    if (activeFilePath) {
      return files.find((f) => f.path === activeFilePath) || null;
    }
    // Default select SKILL.md or README.md
    return (
      files.find((f) => f.path.endsWith('SKILL.md')) ||
      files.find((f) => f.path.endsWith('openai.yaml')) ||
      files.find((f) => f.path === 'README.md') ||
      files.find((f) => f.type === 'file') ||
      null
    );
  });

  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Build Hierarchical Tree from flat paths
  const treeRoot = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      path: '',
      type: 'dir',
      children: {},
    };

    const filteredFiles = searchQuery.trim()
      ? files.filter((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
      : files;

    filteredFiles.forEach((f) => {
      const parts = f.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: currentPath,
            type: isLast && f.type === 'file' ? 'file' : 'dir',
            size: isLast ? f.size : undefined,
            file: isLast ? f : undefined,
            children: {},
          };
        }
        current = current.children[part];
      });
    });

    return root;
  }, [files, searchQuery]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleFileClick = async (fileNode: TreeNode) => {
    if (!fileNode.file) return;
    const file = fileNode.file;
    setSelectedFile(file);
    onSelectFile?.(file);

    // If file content is not yet in file or cache, and we have repo info, fetch it
    if (!file.content && !contentCache[file.path] && repositoryInfo?.owner && repositoryInfo?.repo) {
      setFileContentLoading(true);
      try {
        const res = await fetch('/api/skill/fetch-file-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: repositoryInfo.owner,
            repo: repositoryInfo.repo,
            branch: repositoryInfo.branch || 'main',
            path: file.path,
          }),
        });
        const data = await res.json();
        if (data.success && data.content) {
          setContentCache((prev) => ({ ...prev, [file.path]: data.content }));
        }
      } catch (err) {
        console.error('Fetch file content error:', err);
      } finally {
        setFileContentLoading(false);
      }
    }
  };

  const activeContent = useMemo(() => {
    if (!selectedFile) return '';
    return contentCache[selectedFile.path] || selectedFile.content || '';
  }, [selectedFile, contentCache]);

  const handleCopy = () => {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (fileName.endsWith('SKILL.md')) {
      return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (ext === 'md') return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    if (ext === 'py') return <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (ext === 'yaml' || ext === 'yml') return <Code2 className="w-4 h-4 text-purple-500 shrink-0" />;
    if (ext === 'json') return <FileSpreadsheet className="w-4 h-4 text-yellow-500 shrink-0" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext || '');
  };

  const renderTree = (node: TreeNode, depth = 0) => {
    const entries = Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div className="space-y-0.5">
        {entries.map((item) => {
          const isDir = item.type === 'dir';
          const isExpanded = !!expandedFolders[item.path];
          const isSelected = selectedFile?.path === item.path;
          const isPrimary = item.name === 'SKILL.md' || item.name.endsWith('SKILL.md');

          return (
            <div key={item.path} className="select-none text-xs">
              {isDir ? (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleFolder(item.path)}
                    style={{ paddingLeft: `${depth * 12 + 6}px` }}
                    className="w-full py-1.5 px-2 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors text-left group"
                  >
                    <span className="text-slate-400 group-hover:text-slate-600">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Folder className="w-4 h-4 text-amber-500/80" />
                    )}
                    <span className="font-medium truncate">{item.name}</span>
                  </button>
                  {isExpanded && renderTree(item, depth + 1)}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFileClick(item)}
                  style={{ paddingLeft: `${depth * 12 + 20}px` }}
                  className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-between gap-1.5 transition-colors text-left ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {getFileIcon(item.name)}
                    <span className="truncate">{item.name}</span>
                    {isPrimary && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-amber-100 text-amber-800 rounded font-bold shrink-0">
                        核心
                      </span>
                    )}
                  </div>
                  {item.size !== undefined && (
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {item.size < 1024
                        ? `${item.size} B`
                        : `${(item.size / 1024).toFixed(1)} KB`}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const rawImageUrl = useMemo(() => {
    if (!selectedFile || !isImageFile(selectedFile.name)) return '';
    if (repositoryInfo?.owner && repositoryInfo?.repo) {
      return `https://raw.githubusercontent.com/${repositoryInfo.owner}/${repositoryInfo.repo}/${
        repositoryInfo.branch || 'main'
      }/${selectedFile.path}`;
    }
    return '';
  }, [selectedFile, repositoryInfo]);

  return (
    <div className={`flex flex-col md:flex-row bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-lg ${className}`}>
      {/* Left Pane: Directory Tree */}
      <div className="w-full md:w-80 md:border-r border-slate-800 bg-slate-950/60 p-3 flex flex-col shrink-0 max-h-[500px] overflow-hidden">
        {/* Header with repo info */}
        <div className="pb-2.5 border-b border-slate-800/80 mb-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <FileBox className="w-4 h-4 text-indigo-400" />
              <span>Skill 文件与目录树</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {files.length} 个资源
            </span>
          </div>

          {repositoryInfo && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="truncate max-w-[170px]" title={`${repositoryInfo.owner}/${repositoryInfo.repo}`}>
                {repositoryInfo.owner}/{repositoryInfo.repo}
              </span>
              <a
                href={repositoryInfo.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
                title="在 GitHub 中打开"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Search bar inside tree */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索目录与文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Scrollable Tree Items */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {renderTree(treeRoot)}
        </div>
      </div>

      {/* Right Pane: File Content / Image Preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 p-4 max-h-[500px] overflow-hidden">
        {selectedFile ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* File Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(selectedFile.name)}
                <span className="font-mono text-xs text-slate-200 font-semibold truncate">
                  {selectedFile.path}
                </span>
                {selectedFile.size !== undefined && (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeContent && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs text-slate-400 hover:text-slate-100 flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制代码</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 overflow-y-auto text-xs font-mono rounded-xl bg-slate-950 p-3 text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
              {fileContentLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>正在从 GitHub 拉取文件内容...</span>
                </div>
              ) : isImageFile(selectedFile.name) ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                  {rawImageUrl ? (
                    <img
                      src={rawImageUrl}
                      alt={selectedFile.name}
                      className="max-h-72 max-w-full rounded-lg border border-slate-800 object-contain shadow-md"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-600" />
                  )}
                  <p className="text-slate-400 text-xs">图片资源: {selectedFile.path}</p>
                </div>
              ) : activeContent ? (
                <pre className="whitespace-pre-wrap leading-relaxed">{activeContent}</pre>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p>此文件在导入时未预加载文本</p>
                  {repositoryInfo && (
                    <p className="text-[11px] mt-1 text-slate-600">
                      可在 GitHub 仓库中直接查阅完整二进制或资源内容
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            请在左侧目录树中选择一个文件进行查看
          </div>
        )}
      </div>
    </div>
  );
};
