import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Shield, 
  Database, 
  Download, 
  Upload, 
  Sparkles, 
  Check, 
  Copy, 
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Layers,
  Play,
  Pause,
  RefreshCw,
  CloudDownload
} from 'lucide-react';
import { User, SiteSettings, Order, Project, Task, NoteItem, PortfolioItem } from '../types';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseHealth,
  FULL_SUPABASE_SQL
} from '../lib/supabase';

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
  onSyncSupabase?: () => Promise<boolean>;
  supabaseConnected?: boolean;
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
  onRestoreBackup,
  onSyncSupabase,
  supabaseConnected = false
}) => {
  const isCreatorOrAdmin = user.role === 'creator' || user.role === 'engineer';

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

  // Portfolio list and Marquee toggle
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>(siteSettings.portfolio || []);
  const [marqueeEnabled, setMarqueeEnabled] = useState<boolean>(
    siteSettings.portfolioMarqueeEnabled !== undefined ? siteSettings.portfolioMarqueeEnabled : true
  );

  // Portfolio modal / form state
  const [showPortfolioModal, setShowPortfolioModal] = useState<boolean>(false);
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [portTitle, setPortTitle] = useState<string>('');
  const [portCategory, setPortCategory] = useState<string>('Web App');
  const [portImage, setPortImage] = useState<string>('');
  const [portDesc, setPortDesc] = useState<string>('');
  const [portTags, setPortTags] = useState<string>('React, Node.js');
  const [portLink, setPortLink] = useState<string>('');

  // Supabase Real Live Monitoring
  const storedSb = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState<string>(siteSettings.supabaseUrl || storedSb.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(siteSettings.supabaseAnonKey || storedSb.anonKey || '');
  const [testingSupabase, setTestingSupabase] = useState<boolean>(false);
  const [syncingSupabase, setSyncingSupabase] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    statusCode?: number;
    message?: string;
    detectedTablesCount?: number;
    tableCounts?: Record<string, number>;
    lastChecked?: string;
  } | null>(null);

  // SQL Copy & Save state
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  // Auto-check connection on mount if config already exists
  useEffect(() => {
    if (isCreatorOrAdmin && supabaseUrl && supabaseAnonKey) {
      testSupabaseHealth(supabaseUrl, supabaseAnonKey).then((res) => {
        setSupabaseStatus(res);
      });
    }
  }, []);

  const testSupabaseConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseStatus({
        connected: false,
        message: "Iltimos, Supabase Project URL va Anon API Key ni kiriting!"
      });
      return;
    }

    setTestingSupabase(true);
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    const res = await testSupabaseHealth(supabaseUrl, supabaseAnonKey);
    setSupabaseStatus(res);

    onUpdateSiteSettings({
      ...siteSettings,
      supabaseUrl: supabaseUrl.trim().replace(/\/+$/, ''),
      supabaseAnonKey: supabaseAnonKey.trim()
    });

    if (res.connected && onSyncSupabase) {
      await onSyncSupabase();
    }
    setTestingSupabase(false);
  };

  const handleManualSync = async () => {
    if (!onSyncSupabase) return;
    setSyncingSupabase(true);
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    await onSyncSupabase();
    const res = await testSupabaseHealth(supabaseUrl, supabaseAnonKey);
    setSupabaseStatus(res);
    setSyncingSupabase(false);
  };

  const handleOpenAddPortfolio = () => {
    setEditingPortId(null);
    setPortTitle('');
    setPortCategory('Web App');
    setPortImage('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600');
    setPortDesc('');
    setPortTags('React, TypeScript, Node.js');
    setPortLink('');
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
    setShowPortfolioModal(true);
  };

  const handleSavePortfolioItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitle.trim()) return;

    const tagsArr = portTags.split(',').map(s => s.trim()).filter(Boolean);

    if (editingPortId) {
      setPortfolioList(prev => prev.map(p => {
        if (p.id === editingPortId) {
          return {
            ...p,
            title: portTitle.trim(),
            category: portCategory,
            image: portImage.trim() || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
            description: portDesc.trim(),
            tags: tagsArr,
            link: portLink.trim() || undefined
          };
        }
        return p;
      }));
    } else {
      const newItem: PortfolioItem = {
        id: `port-${Date.now()}`,
        title: portTitle.trim(),
        category: portCategory,
        image: portImage.trim() || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
        description: portDesc.trim(),
        tags: tagsArr,
        link: portLink.trim() || undefined
      };
      setPortfolioList(prev => [newItem, ...prev]);
    }

    setShowPortfolioModal(false);
  };

  const handleDeletePortfolioItem = (id: string) => {
    setPortfolioList(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    onUpdateSiteSettings({
      ...siteSettings,
      siteName,
      telegramUsername,
      phoneContact,
      heroTitle,
      heroSubtitle,
      creatorBackgroundType: bgType,
      creatorBackgroundImage: bgImage,
      portfolioMarqueeEnabled: marqueeEnabled,
      portfolio: portfolioList,
      supabaseUrl: supabaseUrl.trim().replace(/\/+$/, ''),
      supabaseAnonKey: supabaseAnonKey.trim()
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const exportBackupJSON = () => {
    const data = {
      version: 'vcg-v4',
      exportDate: new Date().toISOString(),
      siteSettings: {
        ...siteSettings,
        portfolio: portfolioList,
        portfolioMarqueeEnabled: marqueeEnabled,
        supabaseUrl,
        supabaseAnonKey
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

  const copySql = () => {
    navigator.clipboard.writeText(FULL_SUPABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Portfolio Add / Edit Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl liquid-glass text-slate-900 dark:text-white space-y-4">
            <h3 className="text-base font-bold flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-500" />
              <span>{editingPortId ? 'Loyihani Tahrirlash' : 'Yangi Portfolio Loyihasini Qo\'shish'}</span>
            </h3>

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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rasm URL Manzili</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={portImage}
                  onChange={e => setPortImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
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
          Mavzu (Liquid Glass Dark/Light), portfolio boshqaruvi, Supabase real-time baza ulanishi va zaxiralash
        </p>
      </div>

      {/* Success banner */}
      {savedStatus && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {/* 1. Theme Appearance (No multi-language switcher) */}
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

      {/* CREATOR & ENGINEER SECTIONS */}
      {isCreatorOrAdmin && (
        <form onSubmit={handleSaveAllSettings} className="space-y-6">
          
          {/* 2. REAL SUPABASE MONITOR & LIVE SYNC */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Supabase Real PostgreSQL Ulanishi</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${supabaseConnected || supabaseStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Barcha ma'lumotlar (a'zolar, chatlar, buyurtmalar, loyihalar) Supabase bazasida real-time saqlanadi
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={testSupabaseConnection}
                  disabled={testingSupabase}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
                  <span>{testingSupabase ? 'Tekshirilmoqda...' : 'Ulash va Tekshirish'}</span>
                </button>

                {onSyncSupabase && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={syncingSupabase}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <CloudDownload className={`w-3.5 h-3.5 ${syncingSupabase ? 'animate-bounce' : ''}`} />
                    <span>{syncingSupabase ? 'Yuklanmoqda...' : 'Bazani Sinxronlash'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={copySql}
                  className="px-3 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Nusxalandi' : 'To\'liq SQL Sxema'}</span>
                </button>
              </div>
            </div>

            {/* Supabase API Credentials Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <span>Supabase Project URL</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(https://...supabase.co)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://abcdefghijkl.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <span>Supabase Anon Key</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(eyJhbGciOi...)</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Real-time Telemetry Dashboard Card */}
            {supabaseStatus && (
              <div className={`p-4 rounded-2xl border text-xs space-y-3 animate-in fade-in ${
                supabaseStatus.connected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-900 dark:text-rose-100'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${supabaseStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="font-extrabold text-sm">
                      {supabaseStatus.connected ? 'Supabase Bazasiga Ulandi (Online)' : 'Ulanishda Xatolik (Offline)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] font-mono">
                    {supabaseStatus.statusCode !== undefined && (
                      <span>Status: <strong>HTTP {supabaseStatus.statusCode || 'Xato'}</strong></span>
                    )}
                    {supabaseStatus.latencyMs !== undefined && (
                      <span>Ping: <strong>{supabaseStatus.latencyMs} ms</strong></span>
                    )}
                    {supabaseStatus.lastChecked && (
                      <span>Tekshirildi: <strong>{supabaseStatus.lastChecked}</strong></span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-medium leading-relaxed">
                  {supabaseStatus.message}
                </p>

                {supabaseStatus.connected && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 font-mono text-[11px]">
                    {['users', 'orders', 'projects', 'tasks', 'notes', 'chats'].map((tbl) => (
                      <div key={tbl} className="p-2 rounded-xl bg-black/10 dark:bg-white/10">
                        <span className="text-[10px] block opacity-75 uppercase">{tbl}:</span>
                        <span className="font-bold">
                          {supabaseStatus.tableCounts && supabaseStatus.tableCounts[tbl] !== undefined
                            ? `${supabaseStatus.tableCounts[tbl]} ta yozuv`
                            : 'Yaratilmagan'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SQL Copy Instructions */}
            <div className="p-4 rounded-2xl liquid-glass-subtle text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Supabase 10 ta Jadval Sxemasi Tayyor (PostgreSQL 15+)
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Supabase Dashboard &rarr; SQL Editor bo'limiga o'ting, yuqoridagi <strong>To'liq SQL Sxema</strong> tugmasini bosib nusxalangan kodni joylang va <strong>Run</strong> tugmasini bosing. Barcha 10 ta jadval (users, orders, projects, tasks, notes, chats, reminders, activities, notifications, site_settings) va RLS ruxsatlari avtomatik yaratiladi.
              </p>
            </div>
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
                    Bosh sahifa va Landing pageda 2 qatorda aylanuvchi loyihalarni tahrirlash
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setMarqueeEnabled(!marqueeEnabled)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    marqueeEnabled 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                      : 'liquid-glass-subtle text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {marqueeEnabled ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{marqueeEnabled ? 'Karusel harakati: Yoqilgan' : 'Karusel harakati: To\'xtatilgan'}</span>
                </button>

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

          {/* 4. Creator Visual Theme (Matrix or Custom Image) */}
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
                  Liquid Glass oynalari ortidan tiniq ko'rinuvchi raqamlar yomg'iri yoki shaxsiy fon rasmi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setBgType('default')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  bgType === 'default' 
                    ? 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500' 
                    : 'liquid-glass-subtle'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 dark:text-white mb-1">Standart Rejim</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Toza gradient va Liquid Glass</div>
              </button>

              <button
                type="button"
                onClick={() => setBgType('matrix')}
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
                onClick={() => setBgType('custom_image')}
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
                <div className="text-[11px] text-slate-500 dark:text-slate-400">O'zingiz tanlagan rasm URL manzili</div>
              </button>
            </div>

            {bgType === 'custom_image' && (
              <div className="pt-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fon Rasmi URL Manzili
                </label>
                <input 
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={bgImage}
                  onChange={(e) => setBgImage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* 5. Backup & Restore Section */}
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

          {/* 6. General Site Branding */}
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telegram Admin</label>
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
