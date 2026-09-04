import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SkillList } from './components/SkillList';
import { SkillRunner } from './components/SkillRunner';
import { SkillEditor } from './components/SkillEditor';
import { SkillImporter } from './components/SkillImporter';
import { HistoryModal } from './components/HistoryModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ProjectDocsCenter } from './components/ProjectDocsCenter';
import { Skill, ActiveTab, ExecutionRecord } from './types';
import { storageService } from './services/storage';

export default function App() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [skillPendingDelete, setSkillPendingDelete] = useState<Skill | null>(null);

  // Hidden file input for workspace backup import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load skills on mount
  useEffect(() => {
    const loaded = storageService.getSkills();
    setSkills(loaded);
    if (loaded.length > 0 && !activeSkill) {
      setActiveSkill(loaded[0]);
    }
  }, []);

  // Select skill to Run
  const handleSelectSkill = (skill: Skill) => {
    setActiveSkill(skill);
    setActiveTab('runner');
  };

  // Select skill to Edit
  const handleEditSkill = (skill: Skill) => {
    setActiveSkill(skill);
    setActiveTab('editor');
  };

  // Save edited skill
  const handleSaveSkill = (updated: Skill) => {
    storageService.updateSkill(updated);
    setSkills(storageService.getSkills());
    setActiveSkill(updated);
    showToast(`已成功保存「${updated.title}」的 UI 配置`);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    storageService.toggleFavorite(id);
    setSkills(storageService.getSkills());
  };

  // Delete skill
  const handleDeleteSkill = (id: string) => {
    storageService.deleteSkill(id);
    const updated = storageService.getSkills();
    setSkills(updated);
    if (activeSkill?.id === id) {
      setActiveSkill(updated[0] || null);
      setActiveTab('explore');
    }
    showToast('已成功从工作区删除该技能');
  };

  // Duplicate skill
  const handleDuplicateSkill = (skill: Skill) => {
    const duplicated: Skill = {
      ...skill,
      id: `skill-${Date.now()}`,
      title: `${skill.title} (副本)`,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runCount: 0,
    };
    storageService.addSkill(duplicated);
    setSkills(storageService.getSkills());
    showToast(`已复制生成新技能「${duplicated.title}」`);
  };

  // New Skill Created from Importer
  const handleSkillCreated = (newSkill: Skill, navigateToRunner: boolean = true) => {
    storageService.addSkill(newSkill);
    setSkills(storageService.getSkills());
    setActiveSkill(newSkill);
    showToast(`已成功由 Skill 生成可视化 UI「${newSkill.title}」！`);
    if (navigateToRunner) {
      setActiveTab('runner');
    }
  };

  // Reset to default demos
  const handleResetDefaults = () => {
    const defaults = storageService.resetToDefaults();
    setSkills(defaults);
    setActiveSkill(defaults[0] || null);
    showToast('已成功恢复预置示范 Skill 库');
  };

  // Export full backup
  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillUI_备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('全量技能与数据已成功导出为 JSON');
  };

  // Trigger Import Backup
  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleBackupFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = storageService.importBackup(content);
      if (res.success) {
        setSkills(storageService.getSkills());
        showToast(res.message);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Select historical execution record to load in Runner
  const handleSelectRecordForRunner = (record: ExecutionRecord) => {
    const targetSkill = skills.find((s) => s.id === record.skillId);
    if (targetSkill) {
      setActiveSkill(targetSkill);
      setActiveTab('runner');
    } else {
      // Create a fallback view
      showToast('历史技能已从列表中重新载入');
      setActiveTab('runner');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleTriggerImport}
        onResetDefaults={handleResetDefaults}
        totalSkillsCount={skills.length}
      />

      {/* Hidden File Input for Workspace Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleBackupFileSelected}
        className="hidden"
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'explore' && (
          <SkillList
            skills={skills}
            onSelectSkill={handleSelectSkill}
            onEditSkill={handleEditSkill}
            onOpenImport={() => setIsImportOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteSkill={(skill) => setSkillPendingDelete(skill)}
            onDuplicateSkill={handleDuplicateSkill}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {activeTab === 'runner' && activeSkill && (
          <SkillRunner
            skill={activeSkill}
            onEditSkill={handleEditSkill}
            onOpenGlobalHistory={() => setIsHistoryOpen(true)}
            onBackToExplore={() => setActiveTab('explore')}
            onDeleteSkill={(skill) => setSkillPendingDelete(skill)}
          />
        )}

        {activeTab === 'runner' && !activeSkill && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <h3 className="text-base font-bold text-slate-800">未选择任何 Skill</h3>
            <p className="text-xs text-slate-500">请先在技能库中挑选一个技能或立即导入新 Skill</p>
            <button
              onClick={() => setActiveTab('explore')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              返回技能库
            </button>
          </div>
        )}

        {activeTab === 'editor' && activeSkill && (
          <SkillEditor
            skill={activeSkill}
            onSave={handleSaveSkill}
            onCancel={() => setActiveTab('explore')}
            onDeleteSkill={(skill) => setSkillPendingDelete(skill)}
            onNavigateToRunner={(updated) => {
              setActiveSkill(updated);
              setActiveTab('runner');
            }}
          />
        )}

        {activeTab === 'docs' && <ProjectDocsCenter />}
      </main>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!skillPendingDelete}
        skill={skillPendingDelete}
        onConfirm={() => {
          if (skillPendingDelete) {
            handleDeleteSkill(skillPendingDelete.id);
            setSkillPendingDelete(null);
          }
        }}
        onCancel={() => setSkillPendingDelete(null)}
      />

      {/* Import Skill Modal */}
      <SkillImporter
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSkillCreated={handleSkillCreated}
      />

      {/* Execution History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectRecordForRunner={handleSelectRecordForRunner}
      />
    </div>
  );
}
