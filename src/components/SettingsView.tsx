import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Shield, 
  Download, 
  Upload, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle2,
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Layers,
  X
} from 'lucide-react';
import { User, SiteSettings, Order, Project, Task, NoteItem, PortfolioItem } from '../types';
import { readImageFileFromGallery } from '../lib/imageUtils';

interface SettingsViewProps {
  user: User;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  allUsers: User[];
  orders: Order[];
  projects: Project[];
  tasks: Task[];
  notes: NoteItem[];
  onRestoreBackup?: (data: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  siteSettings,
  onUpdateSiteSettings,
  allUsers,
  orders,
  projects,
  tasks,
  notes,
  onRestoreBackup
}) => {
  // Strictly ONLY Creator controls site branding, portfolio, background and backups
  const isCreator = user.role === 'creator';

  // Site general settings
  const [siteName, setSiteName] = useState(siteSettings.siteName || 'VisionCore Group');
  const [telegramUsername, setTelegramUsername] = useState(siteSettings.telegramUsername || '@visioncore_admin');
  const [phoneContact, setPhoneContact] = useState(siteSettings.phoneContact || '+998 90 000 00 00');
  const [heroTitle, setHeroTitle] = useState(siteSettings.heroTitle || '');
  const [heroSubtitle, setHeroSubtitle] = useState(siteSettings.heroSubtitle || '');

  // Background settings
  const [bgType, setBgType] = useState<'default' | 'matrix' | 'custom_image'>(
    siteSettings.creatorBackgroundType || 'default'
  );
  const [bgImage, setBgImage] = useState(siteSettings.creatorBackgroundImage || '');
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Portfolio list
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>(siteSettings.portfolio || []);

  // Portfolio modal / form state
  const [showPortfolioModal, setShowPortfolioModal] = useState<boolean>(false);
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [portTitle, setPortTitle] = useState<string>('');
  const [portCategory, setPortCategory] = useState<string>('Web App');
  const [portImage, setPortImage] = useState<string>('');
  const [portDesc, setPortDesc] = useState<string>('');
  const [portTags, setPortTags] = useState<string>('React, TypeScript');
  const [portLink, setPortLink] = useState<string>('');
  const [showUrlFallback, setShowUrlFallback] = useState<boolean>(false);
  const portFileInputRef = useRef<HTMLInputElement>(null);

  const [savedStatus, setSavedStatus] = useState(false);

  // Sync local state when remote siteSettings updates
  useEffect(() => {
    setSiteName(siteSettings.siteName || 'VisionCore Group');
    setTelegramUsername(siteSettings.telegramUsername || '@visioncore_admin');
    setPhoneContact(siteSettings.phoneContact || '+998 90 000 00 00');
    setHeroTitle(siteSettings.heroTitle || '');
    setHeroSubtitle(siteSettings.heroSubtitle || '');
    setBgType(siteSettings.creatorBackgroundType || 'default');
    setBgImage(siteSettings.creatorBackgroundImage || '');
    setPortfolioList(siteSettings.portfolio || []);
  }, [siteSettings]);

  const handleSelectBackgroundType = (nextType: 'default' | 'matrix' | 'custom_image') => {
    setBgType(nextType);
    onUpdateSiteSettings({
      ...siteSettings,
      creatorBackgroundType: nextType,
      creatorBackgroundImage: bgImage
    });
  };

  const handleGalleryBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readImageFileFromGallery(file, 1920, 0.84);
      setBgImage(compressed);
      setBgType('custom_image');
      onUpdateSiteSettings({
        ...siteSettings,
        creatorBackgroundType: 'custom_image',
        creatorBackgroundImage: compressed
      });
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleOpenAddPortfolio = () => {
    setEditingPortId(null);
    setPortTitle('');
    setPortCategory('Web App');
    setPortImage('');
    setPortDesc('');
    setPortTags('React, TypeScript, Node.js');
    setPortLink('');
    setShowUrlFallback(false);
    setShowPortfolioModal(true);
  };

  const handleOpenEditPortfolio = (item: PortfolioItem) => {
    setEditingPortId(item.id);
    setPortTitle(item.title);
    setPortCategory(item.category);
    setPortImage(item.image);
    setPortDesc(item.description);
    setPortTags(item.tags.join(', '));
    setPortLink(item.link || '');
    setShowUrlFallback(false);
    setShowPortfolioModal(true);
  };

  const handleGalleryPortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readImageFileFromGallery(file, 1000, 0.82);
      setPortImage(compressed);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleSavePortfolioItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitle.trim()) return;

    const tagsArr = portTags.split(',').map(s => s.trim()).filter(Boolean);
    const resolvedImage = portImage.trim() || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600';

    let nextPortfolio: PortfolioItem[];
    if (editingPortId) {
      nextPortfolio = portfolioList.map(p =>
        p.id === editingPortId
          ? {
              ...p,
              title: portTitle.trim(),
              category: portCategory,
              image: resolvedImage,
              description: portDesc.trim(),
              tags: tagsArr,
              link: portLink.trim() || undefined
            }
          : p
      );
    } else {
      const newItem: PortfolioItem = {
        id: `port-${Date.now()}`,
        title: portTitle.trim(),
        category: portCategory,
        image: resolvedImage,
        description: portDesc.trim(),
        tags: tagsArr,
        link: portLink.trim() || undefined
      };
      nextPortfolio = [newItem, ...portfolioList];
    }

    setPortfolioList(nextPortfolio);
    onUpdateSiteSettings({
      ...siteSettings,
      portfolio: nextPortfolio
    });
    setShowPortfolioModal(false);
  };

  const handleDeletePortfolioItem = (id: string) => {
    const nextPortfolio = portfolioList.filter(p => p.id !== id);
    setPortfolioList(nextPortfolio);
    onUpdateSiteSettings({
      ...siteSettings,
      portfolio: nextPortfolio
    });
  };

  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings({
      ...siteSettings,
      siteName,
      telegramUsername,
      phoneContact,
      heroTitle,
      heroSubtitle,
      creatorBackgroundType: bgType,
      creatorBackgroundImage: bgImage,
      portfolio: portfolioList
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const exportBackupJSON = () => {
    const data = {
      version: 'vcg-v5',
      exportDate: new Date().toISOString(),
      siteSettings: {
        ...siteSettings,
        portfolio: portfolioList
      },
      users: allUsers,
      orders,
      projects,
      tasks,
      notes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visioncore_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onRestoreBackup) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          onRestoreBackup(parsed);
        } catch {
          // ignore invalid json
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Portfolio Add / Edit Modal (Gallery-First Image Selection) */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl liquid-glass text-slate-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-500" />
                <span>{editingPortId ? 'Loyihani Tahrirlash' : 'Yangi Portfolio Loyihasini Qo\'shish'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPortfolioModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePortfolioItem} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loyiha Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: FinCore Smart CRM"
                  value={portTitle}
                  onChange={e => setPortTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kategoriya</label>
                  <select
                    value={portCategory}
                    onChange={e => setPortCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Web App" className="bg-slate-900 text-white">Web App</option>
                    <option value="Telegram Bot" className="bg-slate-900 text-white">Telegram Bot</option>
                    <option value="CRM Tizimi" className="bg-slate-900 text-white">CRM Tizimi</option>
                    <option value="Korporativ Websayt" className="bg-slate-900 text-white">Korporativ Websayt</option>
                    <option value="Landing Page" className="bg-slate-900 text-white">Landing Page</option>
                    <option value="Mobil Ilova" className="bg-slate-900 text-white">Mobil Ilova</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Texnologiyalar (vergul bilan)</label>
                  <input
                    type="text"
                    placeholder="React, TypeScript, Tailwind"
                    value={portTags}
                    onChange={e => setPortTags(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Gallery Image Upload (Primary) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Loyiha Rasmi (Galereyadan tanlash)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    className="text-[11px] text-blue-500 hover:underline font-semibold cursor-pointer"
                  >
                    {showUrlFallback ? 'Galereya rejimiga qaytish' : 'Yoki havola (URL) kiritish'}
                  </button>
                </div>

                <input
                  ref={portFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryPortfolioUpload}
                  className="hidden"
                />

                {!showUrlFallback ? (
                  <div
                    onClick={() => portFileInputRef.current?.click()}
                    className="p-4 rounded-2xl liquid-glass-subtle border border-dashed border-blue-500/40 hover:border-blue-500 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
                  >
                    {portImage ? (
                      <div className="relative w-full">
                        <img
                          src={portImage}
                          alt="Loyiha preview"
                          className="w-full h-36 object-cover rounded-xl border border-white/10"
                        />
                        <span className="mt-2 inline-block text-[11px] font-bold text-blue-500">
                          Boshqa rasm tanlash uchun bosing
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Galereyadan rasm tanlash
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          PNG, JPG, WebP formatdagi rasmlar qo'llab-quvvatlanadi
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={portImage}
                    onChange={e => setPortImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tavsif (Qisqacha)</label>
                <textarea
                  rows={2}
                  placeholder="Loyiha vazifasi va imkoniyatlari haqida..."
                  value={portDesc}
                  onChange={e => setPortDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loyiha Havolasi (Demo / Sayt linki)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={portLink}
                  onChange={e => setPortLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  className="px-4 py-2 rounded-xl liquid-glass-subtle text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
          <SettingsIcon className="w-6 h-6 text-blue-500" />
          <span>Sozlamalar</span>
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {isCreator
            ? 'Mavzu (Liquid Glass Dark/Light), orqa fon, portfolio boshqaruvi va zaxiralash'
            : 'Interfeys ko\'rinishi (Liquid Glass Dark/Light) sozlamalari'}
        </p>
      </div>

      {/* Success banner */}
      {savedStatus && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {/* 1. Theme Appearance */}
      <div className="p-6 sm:p-8 rounded-3xl liquid-glass space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span>Ko'rinish va Mavzu (Liquid Glass)</span>
        </h3>

        <div className="space-y-1.5 max-w-md">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Tizim Mavzusi (Dark / Light Mode)
          </label>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-full px-4 py-3 rounded-2xl liquid-glass-subtle flex items-center justify-between text-xs font-bold transition cursor-pointer hover:border-blue-500/40 text-slate-900 dark:text-white"
          >
            <div className="flex items-center space-x-2.5">
              {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{darkMode ? 'Tungi Liquid Glass (Dark Mode)' : 'Kunduzgi Liquid Glass (Light Mode)'}</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold text-blue-600 dark:text-blue-400">Almashtirish</span>
          </button>
        </div>
      </div>

      {/* CREATOR ONLY SECTIONS */}
      {isCreator && (
        <form onSubmit={handleSaveAllSettings} className="space-y-6">
          
          {/* 2. Creator Visual Theme (Instant Background Switch + Gallery Upload) */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Boshqaruv Paneli Orqa Foni
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Tanlaganingiz zahoti darhol qo'llaniladi: toza fon, raqamlar yomg'iri yoki galereyadan shaxsiy rasm
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleSelectBackgroundType('default')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  bgType === 'default' 
                    ? 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500' 
                    : 'liquid-glass-subtle'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 dark:text-white mb-1">Standart Rejim</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Toza gradient va Liquid Glass (yomg'irsiz)</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectBackgroundType('matrix')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  bgType === 'matrix' 
                    ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500' 
                    : 'liquid-glass-subtle'
                }`}
              >
                <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mb-1 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Raqamlar Yomg'iri (Matrix)</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Tiniq kiber animatsion raqamlar oqimi</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectBackgroundType('custom_image')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  bgType === 'custom_image' 
                    ? 'border-purple-500 bg-purple-500/15 ring-1 ring-purple-500' 
                    : 'liquid-glass-subtle'
                }`}
              >
                <div className="font-bold text-xs text-purple-600 dark:text-purple-400 mb-1 flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Shaxsiy Fon Rasmi</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Galereyadan tanlangan rasm foni</div>
              </button>
            </div>

            {bgType === 'custom_image' && (
              <div className="pt-2 space-y-3">
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryBgUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => bgFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-md cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Galereyadan Fon Rasmi Tanlash</span>
                  </button>

                  {bgImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setBgImage('');
                        onUpdateSiteSettings({
                          ...siteSettings,
                          creatorBackgroundType: 'custom_image',
                          creatorBackgroundImage: ''
                        });
                      }}
                      className="px-3.5 py-2 rounded-xl liquid-glass-subtle text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      Rasmni tozalash
                    </button>
                  )}
                </div>

                {bgImage && (
                  <div className="rounded-2xl overflow-hidden border border-purple-500/30 max-w-sm">
                    <img src={bgImage} alt="Orqa fon preview" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. PORTFOLIO & DONE WORKS MANAGEMENT */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Portfolio va Qilingan Ishlar Boshqaruvi
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    5 tadan ortiq loyiha bo'lganda avtomatik 2 qatorli aylanuvchi ko'rinishga o'tadi
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleOpenAddPortfolio}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Loyiha Qo'shish</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              {portfolioList.map((item) => (
                <div 
                  key={item.id} 
                  className="rounded-2xl liquid-glass-subtle p-3 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-24 object-cover rounded-xl"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400">
                        {item.category}
                      </span>
                      {item.link && <ExternalLink className="w-3 h-3 text-slate-400" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-300/50 dark:border-white/10">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-700 dark:text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPortfolio(item)}
                        className="p-1 rounded text-slate-500 hover:text-blue-500 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePortfolioItem(item.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Backup & Restore Section */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Zaxiralash va Ma'lumotlarni Saqlash (Backup)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Barcha foydalanuvchilar, buyurtmalar, loyihalar va qaydlarni JSON faylida saqlang yoki tiklang
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={exportBackupJSON}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Zaxirani Yuklab Olish (Export)</span>
              </button>

              <label className="px-5 py-2.5 rounded-xl liquid-glass-subtle text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center space-x-2 cursor-pointer hover:border-purple-500/40">
                <Upload className="w-4 h-4" />
                <span>Zaxirani Tiklash (Import)</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportBackup} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* 5. General Site Branding */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sayt va Guruh Ma'lumotlarini Tahrirlash
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Landing sahifa va virtual ofisdagi matnlar, kontaktlar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Guruh Nomi</label>
                <input 
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telegram Aloqa</label>
                <input 
                  type="text"
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aloqa Telefoni</label>
                <input 
                  type="text"
                  value={phoneContact}
                  onChange={e => setPhoneContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bosh Sarlavha (Hero Title)</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={e => setHeroTitle(e.target.value)}
                  placeholder="Zamonaviy IT Loyihalar va Dasturiy Yechimlar Markazi"
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tavsif (Hero Subtitle)</label>
                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={e => setHeroSubtitle(e.target.value)}
                  placeholder="VisionCore Group haqida qisqacha..."
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-lg active:scale-95 cursor-pointer"
            >
              Barcha Sozlamalarni Saqlash
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
