import { Skill, ExecutionRecord } from '../types';
import { DEFAULT_SKILLS } from '../data/defaultSkills';

const SKILLS_STORAGE_KEY = 'skillui_skills_v6';
const HISTORY_STORAGE_KEY = 'skillui_history_v1';
const DELETED_IDS_KEY = 'skillui_deleted_ids_v1';

// Sanitize inputs by stripping huge base64 dataUrls and limiting text size
function sanitizeInputValue(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    if (val.startsWith('data:image/') || val.startsWith('data:application/pdf')) {
      return `[已上传附件数据: ${Math.round(val.length / 1024)} KB]`;
    }
    if (val.length > 10000) {
      return val.slice(0, 10000) + '...[超长内容已截断保存]';
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return {
          name: item.name || '附件',
          size: item.size || 0,
          type: item.type || 'file',
          url: typeof item.url === 'string' && !item.url.startsWith('data:') ? item.url : undefined,
        };
      }
      if (typeof item === 'string' && item.startsWith('data:')) {
        return `[已上传素材: ${Math.round(item.length / 1024)} KB]`;
      }
      return sanitizeInputValue(item);
    });
  }
  if (typeof val === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (k === 'files' && Array.isArray(v)) {
        sanitizedObj.files = v.map((f: any) => ({
          name: f.name || '文件',
          size: f.size || 0,
          type: f.type || 'file',
          textContent: typeof f.textContent === 'string' ? f.textContent.slice(0, 2000) : undefined,
        }));
      } else if (k === 'dataUrl' && typeof v === 'string') {
        sanitizedObj[k] = `[base64: ${Math.round(v.length / 1024)} KB]`;
      } else {
        sanitizedObj[k] = sanitizeInputValue(v);
      }
    }
    return sanitizedObj;
  }
  return val;
}

function sanitizeRecord(record: ExecutionRecord): ExecutionRecord {
  const sanitizedInputs: Record<string, any> = {};
  if (record.inputValues && typeof record.inputValues === 'object') {
    for (const [k, v] of Object.entries(record.inputValues)) {
      sanitizedInputs[k] = sanitizeInputValue(v);
    }
  }

  let sanitizedOutput = record.outputResult || '';
  if (sanitizedOutput.length > 25000) {
    sanitizedOutput = sanitizedOutput.slice(0, 25000) + '\n\n...[历史记录输出内容已截断存储]';
  }

  return {
    ...record,
    inputValues: sanitizedInputs,
    outputResult: sanitizedOutput,
  };
}

export const storageService = {
  // --- Skills Management ---
  getSkills(): Skill[] {
    try {
      const data = localStorage.getItem(SKILLS_STORAGE_KEY);
      if (!data) {
        // Initialize with default skills
        this.saveSkills(DEFAULT_SKILLS);
        return DEFAULT_SKILLS;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveSkills(DEFAULT_SKILLS);
        return DEFAULT_SKILLS;
      }

      // Check if there are newly added default skills that haven't been deleted by user
      try {
        const deletedList: string[] = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
        const deletedSet = new Set(deletedList);
        const existingIds = new Set(parsed.map((s: Skill) => s.id));
        let hasNewDefaults = false;
        const merged = [...parsed];

        for (const def of DEFAULT_SKILLS) {
          if (!existingIds.has(def.id) && !deletedSet.has(def.id)) {
            merged.push(def);
            hasNewDefaults = true;
          }
        }

        if (hasNewDefaults) {
          this.saveSkills(merged);
          return merged;
        }
      } catch {}

      return parsed;
    } catch (e) {
      console.error('Error loading skills from localStorage:', e);
      return DEFAULT_SKILLS;
    }
  },

  saveSkills(skills: Skill[]): void {
    try {
      localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));
    } catch (e: any) {
      console.warn('Primary saveSkills failed, trying to sanitize skills to fit quota:', e);
      try {
        // If quota exceeded, strip large raw content and sample inputs
        const lightweightSkills = skills.map((s) => ({
          ...s,
          rawSource: {
            ...s.rawSource,
            content: s.rawSource.content?.length > 10000 ? s.rawSource.content.slice(0, 10000) + '...' : s.rawSource.content,
          },
          files: s.files?.slice(0, 20).map((f) => ({ ...f, content: f.content?.slice(0, 5000) })),
        }));
        localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(lightweightSkills));
      } catch (retryErr) {
        console.error('Critical: unable to save skills to localStorage:', retryErr);
      }
    }
  },

  getSkillById(id: string): Skill | undefined {
    const skills = this.getSkills();
    return skills.find((s) => s.id === id);
  },

  addSkill(skill: Skill): void {
    const skills = this.getSkills();
    // Prepend to top
    const updated = [skill, ...skills.filter((s) => s.id !== skill.id)];
    this.saveSkills(updated);

    // If re-adding previously deleted ID, remove from deleted tracking
    try {
      const deletedList: string[] = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
      const filtered = deletedList.filter((dId) => dId !== skill.id);
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(filtered));
    } catch {}
  },

  updateSkill(skill: Skill): void {
    const skills = this.getSkills();
    const index = skills.findIndex((s) => s.id === skill.id);
    if (index !== -1) {
      skills[index] = { ...skill, updatedAt: Date.now() };
    } else {
      skills.unshift(skill);
    }
    this.saveSkills(skills);
  },

  deleteSkill(id: string): void {
    const skills = this.getSkills();
    const updated = skills.filter((s) => s.id !== id);
    this.saveSkills(updated);

    // Track deleted ID so it won't be resurrected
    try {
      const deletedList: string[] = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
      if (!deletedList.includes(id)) {
        deletedList.push(id);
        localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedList));
      }
    } catch {}
  },

  toggleFavorite(id: string): boolean {
    const skills = this.getSkills();
    const target = skills.find((s) => s.id === id);
    if (target) {
      target.isFavorite = !target.isFavorite;
      this.saveSkills(skills);
      return !!target.isFavorite;
    }
    return false;
  },

  incrementRunCount(id: string): void {
    const skills = this.getSkills();
    const target = skills.find((s) => s.id === id);
    if (target) {
      target.runCount = (target.runCount || 0) + 1;
      this.saveSkills(skills);
    }
  },

  resetToDefaults(): Skill[] {
    try {
      localStorage.removeItem(DELETED_IDS_KEY);
    } catch {}
    this.saveSkills(DEFAULT_SKILLS);
    return DEFAULT_SKILLS;
  },

  // --- Execution History ---
  getHistory(): ExecutionRecord[] {
    try {
      const data = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error loading history:', e);
      return [];
    }
  },

  saveHistory(history: ExecutionRecord[]): void {
    try {
      // Keep up to 30 sanitized records
      const sanitized = history.slice(0, 30).map(sanitizeRecord);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e: any) {
      console.warn('Initial saveHistory quota exceeded, pruning older records:', e?.message);
      // Progressive pruning fallbacks
      const countsToTry = [15, 8, 3, 1];
      let saved = false;
      for (const count of countsToTry) {
        try {
          const reduced = history.slice(0, count).map(sanitizeRecord);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(reduced));
          saved = true;
          break;
        } catch {
          // Continue to next smaller limit
        }
      }
      if (!saved) {
        try {
          // As a last resort, clear corrupted or huge history key so future runs don't crash
          localStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch {}
      }
    }
  },

  addHistoryRecord(record: ExecutionRecord): void {
    const history = this.getHistory();
    const updated = [record, ...history];
    this.saveHistory(updated);
  },

  deleteHistoryRecord(id: string): void {
    const history = this.getHistory();
    const updated = history.filter((h) => h.id !== id);
    this.saveHistory(updated);
  },

  clearHistory(): void {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  },

  // --- Backup & Restore ---
  exportBackup(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      skills: this.getSkills(),
      history: this.getHistory(),
    };
    return JSON.stringify(payload, null, 2);
  },

  importBackup(jsonString: string): { success: boolean; importedSkillsCount: number; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.skills)) {
        return { success: false, importedSkillsCount: 0, message: '无效的备份文件格式' };
      }

      const existingSkills = this.getSkills();
      const existingIds = new Set(existingSkills.map((s) => s.id));

      let addedCount = 0;
      const mergedSkills = [...existingSkills];

      for (const skill of parsed.skills) {
        if (!existingIds.has(skill.id)) {
          mergedSkills.push(skill);
          addedCount++;
        } else {
          // Update existing
          const idx = mergedSkills.findIndex((s) => s.id === skill.id);
          if (idx !== -1) {
            mergedSkills[idx] = skill;
          }
        }
      }

      this.saveSkills(mergedSkills);

      if (Array.isArray(parsed.history)) {
        const existingHistory = this.getHistory();
        const existingHIds = new Set(existingHistory.map((h) => h.id));
        const mergedHistory = [...existingHistory];
        for (const h of parsed.history) {
          if (!existingHIds.has(h.id)) {
            mergedHistory.push(h);
          }
        }
        this.saveHistory(mergedHistory);
      }

      return {
        success: true,
        importedSkillsCount: addedCount || parsed.skills.length,
        message: `成功导入 ${parsed.skills.length} 个 Skill！`,
      };
    } catch (e: any) {
      return { success: false, importedSkillsCount: 0, message: e.message || '导入解析失败' };
    }
  },
};
