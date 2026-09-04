import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Star,
  Sparkles,
  Layers,
  Code,
  Wand2,
  BarChart,
  CheckCircle,
  FolderOpen,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
} from 'lucide-react';
import { Skill } from '../types';
import { SkillCard } from './SkillCard';

interface SkillListProps {
  skills: Skill[];
  onSelectSkill: (skill: Skill) => void;
  onEditSkill: (skill: Skill) => void;
  onOpenImport: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteSkill: (skill: Skill) => void;
  onDuplicateSkill: (skill: Skill) => void;
  onResetDefaults: () => void;
}

const CATEGORIES = [
  { id: 'all', label: '全部技能', icon: Layers },
  { id: 'favorites', label: '我的收藏', icon: Star },
  { id: 'coding', label: '编程开发', icon: Code },
  { id: 'writing', label: '内容创作', icon: Wand2 },
  { id: 'analysis', label: '数据洞察', icon: BarChart },
  { id: 'productivity', label: '办公效率', icon: CheckCircle },
  { id: 'utilities', label: '实用工具', icon: Sparkles },
];

export const SkillList: React.FC<SkillListProps> = ({
  skills,
  onSelectSkill,
  onEditSkill,
  onOpenImport,
  onToggleFavorite,
  onDeleteSkill,
  onDuplicateSkill,
  onResetDefaults,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'title'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter & Sort
  const filteredSkills = useMemo(() => {
    let list = [...skills];

    // Category filter
    if (selectedCategory === 'favorites') {
      list = list.filter((s) => s.isFavorite);
    } else if (selectedCategory !== 'all') {
      list = list.filter((s) => s.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'popular') {
      list.sort((a, b) => (b.runCount || 0) - (a.runCount || 0));
    } else if (sortBy === 'recent') {
      list.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [skills, selectedCategory, searchQuery, sortBy]);

  const favoritesCount = skills.filter((s) => s.isFavorite).length;

  return (
    <div className="space-y-6">
      {/* Hero Banner with Quick Upload trigger */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>智能 Skill UI 自动化工作台</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            让任何 Skill 秒变交互式可视化 UI 应用
          </h1>
          <p className="text-sm text-indigo-200/90 leading-relaxed max-w-xl">
            无需编写调用代码，直接上传或输入你的 Skill / 提示词规则，AI 自动生成对应的交互表单界面，开箱即用，支持直接调试与可视化微调。
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenImport}
              className="px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-900 text-xs font-bold rounded-xl shadow-lg shadow-black/10 transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>导入新的 Skill (上传/链接/粘贴)</span>
            </button>
            <div className="text-xs text-indigo-300 flex items-center gap-2">
              <span>已纳管 {skills.length} 个技能</span>
              <span>•</span>
              <span>纯本地安全持久化</span>
            </div>
          </div>
        </div>

        {/* Decorative ambient elements */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Filter, Search & Toolbar */}
      <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
                {cat.id === 'favorites' && favoritesCount > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索技能名称、描述、标签关键字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 pr-2 py-1 focus:outline-hidden cursor-pointer"
              >
                <option value="popular">最常使用</option>
                <option value="recent">最近更新</option>
                <option value="title">名称字母</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="网格视图"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="紧凑列表"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Cards Grid / List */}
      {filteredSkills.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'flex flex-col gap-3'
          }
        >
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onSelect={onSelectSkill}
              onEdit={onEditSkill}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDeleteSkill}
              onDuplicate={onDuplicateSkill}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery ? '未找到匹配的 Skill' : '暂无相关 Skill'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `尝试更换搜索词或重置筛选条件`
                : `你可以立即上传或导入一个 Skill，系统将自动为你生成可视化交互界面。`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                清空筛选条件
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenImport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>立即导入 Skill</span>
                </button>
                <button
                  onClick={onResetDefaults}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>载入预置示范库</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
