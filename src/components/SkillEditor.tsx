import React, { useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Code,
  Layers,
  ArrowUp,
  ArrowDown,
  Settings,
  Eye,
  Check,
  HelpCircle,
  X,
  FileCode,
} from 'lucide-react';
import { Skill, FormField, FieldType } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface SkillEditorProps {
  skill: Skill;
  onSave: (updatedSkill: Skill) => void;
  onCancel: () => void;
  onNavigateToRunner: (skill: Skill) => void;
  onDeleteSkill?: (skill: Skill) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; desc: string }[] = [
  { type: 'text', label: '单行文本 (Text)', desc: '适用于简短的标题、名称、关键词' },
  { type: 'textarea', label: '多行长文本 (Textarea)', desc: '适用于文章、段落、大段提示词' },
  { type: 'file', label: '文件/图片上传 (File / Image)', desc: '支持本地图片、照片或文件拖拽上传与即时预览' },
  { type: 'tags', label: '标签/关键词 (Tags)', desc: '支持输入多个关键词或分类标签' },
  { type: 'code', label: '代码编辑器 (Code)', desc: '支持语法高亮与等宽字体排版' },
  { type: 'select', label: '下拉单选 (Select)', desc: '支持自定义选项列表' },
  { type: 'radio', label: '单选卡片 (Radio)', desc: '平铺展示各选项' },
  { type: 'switch', label: '布尔开关 (Switch)', desc: '开/关 (True/False)' },
  { type: 'slider', label: '数值滑动条 (Slider)', desc: '范围数值调节 (Min/Max/Step)' },
  { type: 'number', label: '数字输入 (Number)', desc: '直接输入数值' },
];

export const SkillEditor: React.FC<SkillEditorProps> = ({
  skill,
  onSave,
  onCancel,
  onNavigateToRunner,
  onDeleteSkill,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'system' | 'raw'>('fields');

  // Working copy state
  const [title, setTitle] = useState(skill.title);
  const [description, setDescription] = useState(skill.description);
  const [category, setCategory] = useState(skill.category);
  const [icon, setIcon] = useState(skill.icon);
  const [tagsInput, setTagsInput] = useState(skill.tags?.join(', ') || '');
  const [systemInstruction, setSystemInstruction] = useState(skill.systemInstruction);
  const [fields, setFields] = useState<FormField[]>(skill.uiSchema?.fields || []);
  const [rawContent, setRawContent] = useState(skill.rawSource.content);

  // Field edit modal state
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Reorder fields
  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const updated = [...fields];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setFields(updated);
  };

  // Delete field
  const handleDeleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Save / Update Field
  const handleSaveFieldModal = (fieldData: FormField) => {
    if (isAddingNew) {
      setFields((prev) => [...prev, fieldData]);
    } else {
      setFields((prev) => prev.map((f) => (f.id === fieldData.id ? fieldData : f)));
    }
    setEditingField(null);
    setIsAddingNew(false);
  };

  // Save whole skill
  const handleSaveAll = (andRun: boolean = false) => {
    const updated: Skill = {
      ...skill,
      title,
      description,
      category,
      icon,
      tags: tagsInput
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      systemInstruction,
      rawSource: {
        ...skill.rawSource,
        content: rawContent,
      },
      uiSchema: {
        ...skill.uiSchema,
        title: `${title} 交互界面`,
        fields,
      },
      updatedAt: Date.now(),
    };

    onSave(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);

    if (andRun) {
      onNavigateToRunner(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>自定义配置「{skill.title}」的 UI 交互界面</span>
              {savedToast && (
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> 已保存
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              微调表单字段、参数类型、默认值与系统指令，定制专属操作体验
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
          {onDeleteSkill && (
            <button
              type="button"
              onClick={() => onDeleteSkill(skill)}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="从工作区删除此技能"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除技能</span>
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            返回
          </button>
          <button
            onClick={() => handleSaveAll(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存配置</span>
          </button>
          <button
            onClick={() => handleSaveAll(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>保存并直接使用</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setActiveSubTab('fields')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'fields'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>UI 表单输入字段 ({fields.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('system')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'system'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>系统 Prompt 与基础元数据</span>
        </button>
        <button
          onClick={() => setActiveSubTab('raw')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'raw'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>原始 Skill 源码编辑</span>
        </button>
      </div>

      {/* Tab 1: Form Fields Builder */}
      {activeSubTab === 'fields' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              表单字段列表（可上下移动排序、编辑属性或添加新字段）
            </span>
            <button
              onClick={() => {
                setIsAddingNew(true);
                setEditingField({
                  id: `field_${Date.now().toString().slice(-4)}`,
                  name: '新输入字段',
                  label: '新输入字段',
                  type: 'text',
                  placeholder: '请输入内容...',
                  required: false,
                });
              }}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/60 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加新表单字段</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {field.label}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-red-50 text-red-600 rounded">
                          必填
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      ID: {field.id} | 默认值: {String(field.defaultValue ?? '无')}
                    </p>
                  </div>
                </div>

                {/* Field Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveField(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    title="上移"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveField(idx, 'down')}
                    disabled={idx === fields.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    title="下移"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingField({ ...field });
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: System Instruction & Metadata */}
      {activeSubTab === 'system' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">技能名称</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">所属分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="coding">编程开发</option>
                <option value="writing">内容创作</option>
                <option value="analysis">数据洞察</option>
                <option value="productivity">办公效率</option>
                <option value="design">设计创意</option>
                <option value="utilities">实用工具</option>
                <option value="custom">自定义技能</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">简要描述</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">标签 (逗号分隔)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                核心系统指令 (System Prompt Template)
              </label>
              <span className="text-[11px] text-slate-400">
                支持使用 {'{{字段ID}}'} 作为动态参数插值
              </span>
            </div>
            <textarea
              rows={8}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className="w-full p-3 font-mono bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Raw Skill Source */}
      {activeSubTab === 'raw' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              原始 Skill 内容编辑 (Markdown / YAML / OpenAPI)
            </label>
            <span className="text-[11px] text-slate-400">
              {rawContent.length} 字符
            </span>
          </div>
          <textarea
            rows={14}
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            className="w-full p-4 font-mono bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      )}

      {/* Field Edit Modal Drawer */}
      {editingField && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {isAddingNew ? '添加新 UI 表单字段' : '编辑表单字段属性'}
              </h3>
              <button
                onClick={() => setEditingField(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">字段标签名 (Label)</label>
                <input
                  type="text"
                  value={editingField.label}
                  onChange={(e) =>
                    setEditingField({ ...editingField, label: e.target.value, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">唯一标识符 (Field ID)</label>
                <input
                  type="text"
                  value={editingField.id}
                  onChange={(e) => setEditingField({ ...editingField, id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">控件展示类型 (Type)</label>
                <select
                  value={editingField.type}
                  onChange={(e) =>
                    setEditingField({ ...editingField, type: e.target.value as FieldType })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.type} value={ft.type}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">占位提示语 (Placeholder)</label>
                <input
                  type="text"
                  value={editingField.placeholder || ''}
                  onChange={(e) =>
                    setEditingField({ ...editingField, placeholder: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">默认初值 (Default Value)</label>
                <input
                  type="text"
                  value={String(editingField.defaultValue ?? '')}
                  onChange={(e) =>
                    setEditingField({ ...editingField, defaultValue: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              {editingField.type === 'file' && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-900">允许批量上传多张素材</span>
                    <input
                      type="checkbox"
                      checked={editingField.multiple !== false}
                      onChange={(e) =>
                        setEditingField({ ...editingField, multiple: e.target.checked })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-indigo-900">文件格式限制 (Accept)</label>
                    <input
                      type="text"
                      value={editingField.accept || 'image/*'}
                      onChange={(e) =>
                        setEditingField({ ...editingField, accept: e.target.value })
                      }
                      placeholder="image/* 或 .jpg,.png"
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">是否必填 (Required)</span>
                <input
                  type="checkbox"
                  checked={!!editingField.required}
                  onChange={(e) =>
                    setEditingField({ ...editingField, required: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleSaveFieldModal(editingField)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                确认保存字段
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
