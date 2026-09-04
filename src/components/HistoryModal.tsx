import React, { useState } from 'react';
import {
  History,
  Trash2,
  Copy,
  Check,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
  Globe,
  X,
  AlertCircle,
} from 'lucide-react';
import { ExecutionRecord, Skill } from '../types';
import { storageService } from '../services/storage';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecordForRunner: (record: ExecutionRecord) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectRecordForRunner,
}) => {
  const [historyList, setHistoryList] = useState<ExecutionRecord[]>(() =>
    storageService.getHistory()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    storageService.deleteHistoryRecord(id);
    setHistoryList(storageService.getHistory());
  };

  const handleClearAll = () => {
    if (confirm('确定要清空全部运行历史记录吗？此操作无法撤销。')) {
      storageService.clearHistory();
      setHistoryList([]);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = historyList.filter(
    (h) =>
      h.skillTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.outputResult.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                全部技能运行历史记录 ({historyList.length})
              </h2>
              <p className="text-xs text-slate-500">
                随时回溯以往的输入参数与生成结果，支持一键重放
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyList.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                清空全部记录
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="py-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索技能名称或历史输出内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length > 0 ? (
            filtered.map((record) => (
              <div
                key={record.id}
                className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 rounded-2xl space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {record.skillTitle}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        record.engineUsed === 'api'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {record.engineUsed === 'api' ? (
                        <>
                          <Globe className="w-2.5 h-2.5" /> 外部 API
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5" /> Gemini AI
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(record.timestamp).toLocaleString()}</span>
                    </span>
                    {record.durationMs > 0 && (
                      <span>{(record.durationMs / 1000).toFixed(2)}s</span>
                    )}
                  </div>
                </div>

                {/* Output Snippet */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs font-mono text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {record.outputResult || record.errorMessage || '无输出'}
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>删除</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(record.id, record.outputResult)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 rounded-lg flex items-center gap-1"
                    >
                      {copiedId === record.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>复制结果</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectRecordForRunner(record);
                        onClose();
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <span>回载到运行台</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              {searchQuery ? '未找到符合条件的记录' : '暂无运行历史记录'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
