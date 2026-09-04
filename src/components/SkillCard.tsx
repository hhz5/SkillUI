import React from 'react';
import {
  Play,
  Sliders,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { Skill } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface SkillCardProps {
  skill: Skill;
  onSelect: (skill: Skill) => void;
  onEdit: (skill: Skill) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (skill: Skill) => void;
  onDuplicate: (skill: Skill) => void;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  coding: { label: '编程开发', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  writing: { label: '内容创作', color: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  analysis: { label: '数据洞察', color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  productivity: { label: '办公效率', color: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  design: { label: '设计创意', color: 'bg-rose-50 text-rose-700 border-rose-200/60' },
  utilities: { label: '实用工具', color: 'bg-cyan-50 text-cyan-700 border-cyan-200/60' },
  custom: { label: '自定义技能', color: 'bg-slate-50 text-slate-700 border-slate-200/60' },
};

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onSelect,
  onEdit,
  onToggleFavorite,
  onDelete,
  onDuplicate,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const cat = CATEGORY_MAP[skill.category] || CATEGORY_MAP.custom;
  const fieldCount = skill.uiSchema?.fields?.length || 0;

  return (
    <div
      id={`skill-card-${skill.id}`}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Bar */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Category & Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 text-[11px] font-semibold border rounded-full ${cat.color}`}
            >
              {cat.label}
            </span>
            {skill.hasExternalEndpoints && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />
                <span>含 API 端点</span>
              </span>
            )}
            {skill.isBuiltIn && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">
                官方推荐
              </span>
            )}
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(skill.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                skill.isFavorite
                  ? 'text-amber-500 hover:bg-amber-50'
                  : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
              }`}
              title={skill.isFavorite ? '取消收藏' : '加入收藏'}
            >
              <Star
                className={`w-4 h-4 ${skill.isFavorite ? 'fill-amber-400' : ''}`}
              />
            </button>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDuplicate(skill);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>复制此技能</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEdit(skill);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      <span>配置 UI 字段</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(skill);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>删除技能</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5 mb-2.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100/80 border border-indigo-200/50 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <DynamicIcon name={skill.icon} className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              onClick={() => onSelect(skill)}
              className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer truncate"
              title={skill.title}
            >
              {skill.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
              {skill.description}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {skill.tags?.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-md"
            >
              #{tag}
            </span>
          ))}
          {skill.tags?.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
              +{skill.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info & Action Bar */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1" title="表单输入字段数量">
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>{fieldCount} 个交互字段</span>
          </span>
          {skill.runCount ? (
            <span className="flex items-center gap-1 text-slate-400">
              <Flame className="w-3 h-3 text-amber-500" />
              <span>已运行 {skill.runCount} 次</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(skill)}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors flex items-center gap-1 border border-slate-200/80 bg-white"
            title="定制 UI 表单与参数"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">定制 UI</span>
          </button>
          <button
            onClick={() => onSelect(skill)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs shadow-indigo-600/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>直接使用</span>
          </button>
        </div>
      </div>
    </div>
  );
};
