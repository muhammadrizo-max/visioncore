import React, { useState } from 'react';
import { GitBranch, Plus, X, Save, Edit3 } from 'lucide-react';
import { User, Project, VersionPlan } from '../types';

interface VersionPlanningViewProps {
  currentUser: User;
  projects: Project[];
  versionPlans: VersionPlan[];
  onSavePlan: (plan: VersionPlan) => void;
  darkMode: boolean;
}

export const VersionPlanningView: React.FC<VersionPlanningViewProps> = ({
  currentUser,
  projects,
  versionPlans,
  onSavePlan,
  darkMode
}) => {
  const selectedProject = projects[0] || { id: 'PROJ-101', name: 'VisionCore Group Platform' };
  const [selectedProjectId, setSelectedProjectId] = useState<string>(selectedProject.id);

  // Active plan for selected project
  const existingPlan = versionPlans.find(vp => vp.projectId === selectedProjectId) || {
    id: `VP-${Date.now()}`,
    projectId: selectedProjectId,
    projectName: projects.find(p => p.id === selectedProjectId)?.name || 'Loyiha',
    version: 'v1.0.0',
    name: 'Asosiy versiya va arxitektura',
    description: 'Boshlang\'ich ishlab chiqish va loyihani rejalashtirish bosqichi.',
    nextStep: 'Modullarni testdan o\'tkazish hamda xatoliklarni bartaraf etish.',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Python'],
    updatedAt: new Date().toISOString()
  };

  const [version, setVersion] = useState(existingPlan.version);
  const [name, setName] = useState(existingPlan.name);
  const [description, setDescription] = useState(existingPlan.description);
  const [nextStep, setNextStep] = useState(existingPlan.nextStep);
  const [technologies, setTechnologies] = useState<string[]>(existingPlan.technologies);
  const [techInput, setTechInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const plan = versionPlans.find(vp => vp.projectId === projId);
    if (plan) {
      setVersion(plan.version);
      setName(plan.name);
      setDescription(plan.description);
      setNextStep(plan.nextStep);
      setTechnologies(plan.technologies);
    } else {
      const projObj = projects.find(p => p.id === projId);
      setVersion('v1.0.0');
      setName(`${projObj?.name || 'Loyiha'} rejalash bosqichi`);
      setDescription('Yangi bosqich tavsifini kiriting...');
      setNextStep('Dizayn va koding bosqichi');
      setTechnologies(['React', 'TypeScript', 'Tailwind CSS']);
    }
  };

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techInput.trim()) return;
    if (!technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
    }
    setTechInput('');
  };

  const handleRemoveTech = (techToRemove: string) => {
    setTechnologies(technologies.filter(t => t !== techToRemove));
  };

  const handleSave = () => {
    const projObj = projects.find(p => p.id === selectedProjectId);
    const updatedPlan: VersionPlan = {
      id: existingPlan.id || `VP-${Date.now()}`,
      projectId: selectedProjectId,
      projectName: projObj?.name || 'Loyiha',
      version: version.trim() || 'v1.0.0',
      name: name.trim() || 'Versiya nomi',
      description: description.trim(),
      nextStep: nextStep.trim(),
      technologies,
      updatedAt: new Date().toISOString()
    };

    onSavePlan(updatedPlan);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <GitBranch className="w-6 h-6 text-indigo-500" />
            <span>Versiyalash & Rejalash</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Loyihaning joriy versiyasi, ishlatilayotgan texnologiyalar va keyingi qadamlarni belgilash
          </p>
        </div>

        {/* Select Project Dropdown */}
        <div className="w-full md:w-72">
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Loyihani Tanlang</label>
          <select
            id="version-project-select"
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.version})
              </option>
            ))}
          </select>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-bold text-center">
          Versiya va rejalash ma'lumotlari muvaffaqiyatli saqlandi!
        </div>
      )}

      {/* Main Form Box */}
      <div className={`p-8 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      } shadow-sm space-y-6`}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Versiya raqami */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Versiya Raqami</label>
            <input 
              id="version-number-input"
              type="text"
              placeholder="Masalan: v1.2.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Versiya / Bosqich nomi */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Bosqich / Versiya Nomi</label>
            <input 
              id="version-name-input"
              type="text"
              placeholder="Masalan: MVP Release & Refactoring..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

        </div>

        {/* Versiya tavsifi */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Versiya Tavsifi</label>
          <textarea
            id="version-desc-textarea"
            rows={3}
            placeholder="Ushbu versiyada amalga oshirilgan va yangilangan o'zgarishlar..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Keyingi qadam */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Keyingi Qadam (Next Steps)</label>
          <input 
            id="version-nextstep-input"
            type="text"
            placeholder="Keyingi ishlab chiqish rejasi..."
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Technologies Tag Manager */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-400 block">
            Foydalaniladigan Texnologiyalar
          </label>

          {/* Render technology tag pills with x remove button */}
          <div className="flex flex-wrap gap-2 mb-3">
            {technologies.map((tech) => (
              <span 
                key={tech} 
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold"
              >
                <span>{tech}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTech(tech)}
                  className="p-0.5 rounded-md hover:bg-indigo-500/20 text-indigo-300 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add technology input */}
          <form onSubmit={handleAddTech} className="flex gap-2 max-w-md">
            <input 
              id="version-tech-input"
              type="text"
              placeholder="Texnologiya nomi (Masalan: Python, D3, Redis)..."
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              className="flex-grow px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              id="version-add-tech-btn"
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Qo'shish</span>
            </button>
          </form>
        </div>

        {/* Save button */}
        <div className="pt-4 flex justify-end">
          <button
            id="version-save-btn"
            type="button"
            onClick={handleSave}
            className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg flex items-center space-x-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Saqlash va Tahrirlash</span>
          </button>
        </div>

      </div>

    </div>
  );
};
