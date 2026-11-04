import React, { useState, useRef } from 'react';
import { Cpu, Download, Plus, Image, FileText, Layout, Trash2, Save } from 'lucide-react';
import { User, Project, ArchitectureDoc } from '../types';

interface DesignerPanelProps {
  currentUser: User;
  projects: Project[];
  architectureDocs: ArchitectureDoc[];
  onSaveArchitecture: (doc: ArchitectureDoc) => void;
  darkMode: boolean;
}

export const DesignerPanel: React.FC<DesignerPanelProps> = ({
  currentUser,
  projects,
  architectureDocs,
  onSaveArchitecture,
  darkMode
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'PROJ-101');
  
  const currentDoc = architectureDocs.find(a => a.projectId === selectedProjectId) || {
    id: `ARCH-${Date.now()}`,
    projectId: selectedProjectId,
    projectName: projects.find(p => p.id === selectedProjectId)?.name || 'Loyiha',
    specsText: 'Loyiha interfeysi hamda arxitekturasi bo\'yicha texnik tavsif...',
    boardItems: [
      { id: 'b-1', type: 'template' as const, title: 'Sidebar & Navigation', content: 'Sidebar: Asosiy menyular va doimiylar' },
      { id: 'b-2', type: 'template' as const, title: 'Interactive Board', content: 'Doska: Drag & drop UI shablonlari va rasmlar' }
    ],
    updatedAt: new Date().toISOString()
  };

  const [specsText, setSpecsText] = useState(currentDoc.specsText);
  const [boardItems, setBoardItems] = useState(currentDoc.boardItems);
  const [templateType, setTemplateType] = useState('Button & Controls');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    const doc = architectureDocs.find(a => a.projectId === projId);
    if (doc) {
      setSpecsText(doc.specsText);
      setBoardItems(doc.boardItems);
    } else {
      const pObj = projects.find(p => p.id === projId);
      setSpecsText(`${pObj?.name || 'Loyiha'} uchun arxitektura va dizayn tavsifi...`);
      setBoardItems([]);
    }
  };

  const handleAddTemplate = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      type: 'template' as const,
      title: templateType,
      content: `UI Shablon: ${templateType} komponenti loyiha interfeysiga biriktirildi.`
    };
    setBoardItems([...boardItems, newItem]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItem = {
          id: `item-${Date.now()}`,
          type: file.type.startsWith('image') ? ('image' as const) : ('file' as const),
          title: file.name,
          content: reader.result as string
        };
        setBoardItems([...boardItems, newItem]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveItem = (id: string) => {
    setBoardItems(boardItems.filter(i => i.id !== id));
  };

  const handleSave = () => {
    const pObj = projects.find(p => p.id === selectedProjectId);
    const updated: ArchitectureDoc = {
      id: currentDoc.id || `ARCH-${Date.now()}`,
      projectId: selectedProjectId,
      projectName: pObj?.name || 'Loyiha',
      specsText,
      boardItems,
      updatedAt: new Date().toISOString()
    };
    onSaveArchitecture(updated);
  };

  // Export Board + Specs as Word Document (.doc format)
  const handleExportWord = () => {
    const pObj = projects.find(p => p.id === selectedProjectId);
    const title = pObj?.name || 'Loyiha Arxitekturasi';

    const itemsHtml = boardItems.map(item => `
      <div style="margin-bottom:15px; padding:10px; border:1px solid #ccc; background:#f9f9f9;">
        <h4 style="margin:0; color:#2563eb;">${item.title}</h4>
        <p style="margin:5px 0 0 0; font-size:12px;">${item.content}</p>
      </div>
    `).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${title}</title><style>body { font-family: Arial, sans-serif; padding: 20px; }</style></head>
      <body>
        <h1 style="color:#1e3a8a;">${title} - Arxitektura va Dizayn Hujjati</h1>
        <p><strong>Yaratilgan sana:</strong> ${new Date().toLocaleDateString()}</p>
        <hr />
        <h3>Loyiha Ishlash Boshqaruvi va Tavsifi:</h3>
        <p style="line-height:1.6;">${specsText.replace(/\n/g, '<br/>')}</p>
        <hr />
        <h3>Doskadagi UI Shablon va Fayllar:</h3>
        ${itemsHtml || '<p>Doska bo\'sh.</p>'}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Arxitektura.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-purple-500" />
            <span>Loyiha Arxitekturasi & Dizayn Doskasi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Arxitektura, UI shablonlari hamda tavsifni shakllantirish va Word (.doc) faylda yuklab olish
          </p>
        </div>

        {/* Project Dropdown & Export Word Button */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            id="designer-project-select"
            value={selectedProjectId}
            onChange={(e) => handleProjectSelect(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-purple-500 focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            id="designer-export-word-btn"
            type="button"
            onClick={handleExportWord}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md flex items-center space-x-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Word faylida yuklab olish</span>
          </button>
        </div>
      </div>

      {/* Main Board & Specs Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Center: Interactive Board ("Doska") */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}>
            
            {/* Board Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Arxitektura Doskasi
              </h2>

              <div className="flex items-center space-x-2">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  id="designer-upload-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center space-x-1"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Rasm/Fayl yuklash</span>
                </button>

                <div className="flex items-center space-x-1">
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Button & Controls">Button & Controls</option>
                    <option value="Sidebar UI">Sidebar UI</option>
                    <option value="Header Navbar">Header Navbar</option>
                    <option value="Modal Dialog">Modal Dialog</option>
                    <option value="Input Form Card">Input Form Card</option>
                  </select>

                  <button
                    id="designer-add-template-btn"
                    onClick={handleAddTemplate}
                    className="p-1.5 rounded-xl bg-purple-600 text-white font-bold transition"
                    title="Shablon qo'shish"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Board Canvas Display */}
            <div className="min-h-[350px] p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boardItems.length === 0 ? (
                <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                  <Layout className="w-8 h-8 text-purple-500/40 mb-2" />
                  <p>Doska bo'sh. Shablon qo'shing yoki fayllarni yuklang.</p>
                </div>
              ) : (
                boardItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col justify-between space-y-2 relative"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-purple-400">{item.title}</span>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.type === 'image' ? (
                      <img src={item.content} alt={item.title} className="max-h-40 rounded-xl object-cover" />
                    ) : (
                      <p className="text-[11px] text-slate-300 leading-relaxed">{item.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Description & Specifications Text Editor */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        } shadow-sm space-y-4`}>
          
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-500" />
            <span>Loyiha Tavsifi va Ishlashi</span>
          </h2>

          <textarea
            id="designer-specs-textarea"
            rows={14}
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-purple-500 leading-relaxed resize-none font-mono"
            placeholder="Loyiha ishlashi va arxitekturasi haqida batafsil..."
          />

          <button
            id="designer-save-arch-btn"
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Arxitekturani Saqlash</span>
          </button>
        </div>

      </div>

    </div>
  );
};
