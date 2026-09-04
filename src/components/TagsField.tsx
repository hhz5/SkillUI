import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { FormField } from '../types';

interface TagsFieldProps {
  field: FormField;
  value: any;
  onChange: (value: string[]) => void;
  error?: string;
}

export const TagsField: React.FC<TagsFieldProps> = ({ field, value, onChange, error }) => {
  const [inputVal, setInputVal] = useState('');

  const tags: string[] = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
    ? value.split(/[,，\s]+/).filter(Boolean)
    : [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border rounded-xl min-h-[42px] transition-all ${
          error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-xs"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-slate-400 hover:text-red-500 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          placeholder={tags.length === 0 ? field.placeholder || '输入后按回车添加标签...' : '添加标签...'}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputVal.trim()) addTag(inputVal);
          }}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 px-1 py-1"
        />
      </div>
    </div>
  );
};
