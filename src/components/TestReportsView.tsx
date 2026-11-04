import React, { useState } from 'react';
import { FileSpreadsheet, Plus, CheckCircle2, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { User, Project, TestReport } from '../types';

interface TestReportsViewProps {
  currentUser: User;
  projects: Project[];
  testReports: TestReport[];
  onAddReport: (report: TestReport) => void;
  onDeleteReport?: (reportId: string) => void;
  darkMode: boolean;
}

export const TestReportsView: React.FC<TestReportsViewProps> = ({
  currentUser,
  projects,
  testReports,
  onAddReport,
  onDeleteReport,
  darkMode
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'PROJ-101');
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState<'Success' | 'Failed'>('Success');
  
  // Failed fields
  const [errorTitle, setErrorTitle] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [errorDesc, setErrorDesc] = useState('');
  
  // General notes
  const [notes, setNotes] = useState('');

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const projObj = projects.find(p => p.id === selectedProjectId);

    const newReport: TestReport = {
      id: `TR-${Date.now()}`,
      projectId: selectedProjectId,
      projectName: projObj?.name || 'Loyiha',
      testName: testName.trim(),
      result,
      errorTitle: result === 'Failed' ? errorTitle.trim() : undefined,
      severity: result === 'Failed' ? severity : undefined,
      errorDesc: result === 'Failed' ? errorDesc.trim() : undefined,
      notes: notes.trim(),
      analystName: `${currentUser.firstName} ${currentUser.lastName}`,
      date: new Date().toISOString().split('T')[0]
    };

    onAddReport(newReport);
    setTestName('');
    setErrorTitle('');
    setErrorDesc('');
    setNotes('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center space-x-2">
          <FileSpreadsheet className="w-6 h-6 text-teal-500" />
          <span>Test Natijalari (Hisobotlar)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Loyihalar bo'yicha o'tkazilgan testlar va aniqlangan xatoliklar (Bugs) hisoboti
        </p>
      </div>

      {/* Record New Test Form */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-sm space-y-4`}>
        
        <h2 className="text-sm font-bold flex items-center space-x-2 text-teal-500">
          <Plus className="w-4 h-4" />
          <span>Yangi test hisobotini qayd etish</span>
        </h2>

        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Select Project */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Loyihani tanlang</label>
              <select
                id="test-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-teal-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Test Nomi / Turi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Test Nomi / Turi</label>
              <input 
                id="test-name-input"
                type="text"
                required
                placeholder="Masalan: WebSocket sync test..."
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* 3. Natija Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Test Natijasi</label>
              <select
                id="test-result-select"
                value={result}
                onChange={(e) => setResult(e.target.value as 'Success' | 'Failed')}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="Success">Success (Muvaffaqiyatli)</option>
                <option value="Failed">Failed (Muvaffaqiyatsiz / Xato bor)</option>
              </select>
            </div>

          </div>

          {/* Conditional Failed Fields */}
          {result === 'Failed' && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-4">
              <h3 className="text-xs font-bold text-red-400 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Xatolik (Bug) Ma'lumotlari</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Xato Sarlavhasi */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Xato Sarlavhasi</label>
                  <input 
                    id="test-errortitle-input"
                    type="text"
                    required
                    placeholder="Masalan: Token muddati o'tib ketganda xatolik berdi"
                    value={errorTitle}
                    onChange={(e) => setErrorTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Xavflilik Darajasi */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Xavflilik Darajasi (Severity)</label>
                  <select
                    id="test-severity-select"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'Low' | 'Medium' | 'High')}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Low">Low (Past - Ko'k rang)</option>
                    <option value="Medium">Medium (O'rta - Sariq rang)</option>
                    <option value="High">High (Yuqori - Qizil rang)</option>
                  </select>
                </div>

              </div>

              {/* Xatolik Tavsifi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Xatolik Tavsifi</label>
                <textarea
                  id="test-errordesc-textarea"
                  rows={2}
                  placeholder="Xatolik qanday yuz berdi va qanday takrorlandi..."
                  value={errorDesc}
                  onChange={(e) => setErrorDesc(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Test Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Test Eslatmalari (Notes)</label>
            <textarea
              id="test-notes-textarea"
              rows={2}
              placeholder="Test qanday va nimalar bajarilganligi haqida xulosa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          <button
            id="test-submit-btn"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md active:scale-95"
          >
            Hisobotni Qayd Etish
          </button>
        </form>
      </div>

      {/* Grid of Reported Test Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
          Barcha Test Hisobotlari
        </h2>

        {testReports.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Hozircha hisobotlar mavjud emas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testReports.map((tr) => {
              // Color coding logic: low-blue, medium-yellow, high-red, success-green
              let cardStyle = "bg-green-500/5 border-green-500/30 text-green-500";
              let badgeColor = "bg-green-500/20 text-green-400";

              if (tr.result === 'Failed') {
                if (tr.severity === 'Low') {
                  cardStyle = "bg-blue-500/10 border-blue-500/40 text-blue-400";
                  badgeColor = "bg-blue-600 text-white";
                } else if (tr.severity === 'Medium') {
                  cardStyle = "bg-amber-500/10 border-amber-500/40 text-amber-400";
                  badgeColor = "bg-amber-600 text-white";
                } else if (tr.severity === 'High') {
                  cardStyle = "bg-red-500/10 border-red-500/40 text-red-400";
                  badgeColor = "bg-red-600 text-white";
                }
              }

              return (
                <div 
                  key={tr.id}
                  className={`p-5 rounded-3xl border ${cardStyle} shadow-sm space-y-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                        {tr.projectName}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{tr.testName}</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeColor}`}>
                        {tr.result === 'Success' ? '✓ SUCCESS' : `FAILED (${tr.severity || 'Low'})`}
                      </span>
                      {onDeleteReport && (
                        <button
                          onClick={() => onDeleteReport(tr.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {tr.result === 'Failed' && (
                    <div className="p-3 rounded-2xl bg-black/20 text-xs space-y-1">
                      <div className="font-bold text-white flex items-center space-x-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{tr.errorTitle}</span>
                      </div>
                      <p className="text-[11px] opacity-90">{tr.errorDesc}</p>
                    </div>
                  )}

                  {tr.notes && (
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-white/5 p-2.5 rounded-xl">
                      "{tr.notes}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 flex justify-between">
                    <span>Tahlilchi: <strong>{tr.analystName}</strong></span>
                    <span>{tr.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
