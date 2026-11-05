import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Moon, 
  Sun, 
  Shield, 
  Database, 
  Download, 
  Upload, 
  Sparkles, 
  Terminal, 
  Check, 
  Copy, 
  Activity, 
  Image as ImageIcon,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { User, Language, SiteSettings, Order, Project, Task, NoteItem } from '../types';
import { getTranslation } from '../lib/translations';

interface SettingsViewProps {
  user: User;
  onLanguageChange: (lang: Language) => void;
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
  onLanguageChange,
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
  const t = getTranslation(user.language || 'uz');
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

  // Health and copy state
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  const checkDb = async () => {
    setCheckingDb(true);
    try {
      const res = await fetch('/api/db/health');
      const data = await res.json();
      setDbHealth(data);
    } catch (e: any) {
      setDbHealth({ connected: false, message: e?.message });
    } finally {
      setCheckingDb(false);
    }
  };

  useEffect(() => {
    if (isCreatorOrAdmin) {
      checkDb();
    }
  }, [isCreatorOrAdmin]);

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
      creatorBackgroundImage: bgImage
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const exportBackupJSON = () => {
    const data = {
      version: 'vcg-v2',
      exportDate: new Date().toISOString(),
      siteSettings,
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
          alert("Zaxira nusxasi muvaffaqiyatli tiklandi!");
        } catch (err) {
          alert("Zaxira faylini o'qishda xatolik yuz berdi!");
        }
      };
      reader.readAsText(file);
    }
  };

  const supabaseSQLCode = `-- VISIONCORE GROUP SUPABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(12) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255),
  first_name VARCHAR(100) DEFAULT '',
  last_name VARCHAR(100) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  email VARCHAR(150) DEFAULT '',
  telegram_username VARCHAR(100) DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  avatar TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(12) REFERENCES public.users(id),
  client_name VARCHAR(150) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_telegram VARCHAR(100) NOT NULL,
  project_type VARCHAR(50) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget VARCHAR(100),
  deadline VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  accepted_by_id VARCHAR(12),
  assigned_member_id VARCHAR(12),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public All" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Orders" ON public.orders FOR ALL USING (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(supabaseSQLCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
          <SettingsIcon className="w-6 h-6 text-blue-500" />
          <span>{t.settings}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Sayt tili, mavzular, zaxiralash, Supabase va shaxsiy fon sozlamalari
        </p>
      </div>

      {savedStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {/* 1. LANGUAGE & THEME SECTION (Available to all users) */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-sm space-y-6`}>
        
        {/* Language Selection */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.language}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interfeys tilini O'zbekcha, English yoki Русский ga o'zgartiring
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => onLanguageChange('uz')}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                (user.language || 'uz') === 'uz'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
              }`}
            >
              🇺🇿 O'zbekcha
            </button>

            <button
              onClick={() => onLanguageChange('en')}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                user.language === 'en'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
              }`}
            >
              🇬🇧 English
            </button>

            <button
              onClick={() => onLanguageChange('ru')}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                user.language === 'ru'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
              }`}
            >
              🇷🇺 Русский
            </button>
          </div>
        </div>

        {/* Theme Settings (Clean, no clashing colors) */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.theme}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tungi (Dark) yoki Kunduzgi (Light) ko'rinish</p>
            </div>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

      </div>

      {/* 2. CREATOR ONLY ADVANCED SETTINGS (Backup, Supabase, Matrix rain, Site Settings) */}
      {isCreatorOrAdmin && (
        <form onSubmit={handleSaveAllSettings} className="space-y-6">
          
          {/* Creator Background Settings (Digital Rain vs Custom Image) */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.creatorBgSettings}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Panelingiz uchun standart fon, Matrix kodi (raqamlar yomg'iri) yoki shaxsiy rasm o'rnating
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBgType('default')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  bgType === 'default'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold mb-1">Standart Rejim</div>
                <div className="text-[11px] text-slate-400">Oddiy, toza va professional fon</div>
              </button>

              <button
                type="button"
                onClick={() => setBgType('matrix')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  bgType === 'matrix'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold mb-1 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Raqamlar Yomg'iri (Matrix)</span>
                </div>
                <div className="text-[11px] text-slate-400">Yashil kiber animatsion raqamlar oqimi</div>
              </button>

              <button
                type="button"
                onClick={() => setBgType('custom_image')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  bgType === 'custom_image'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold mb-1 flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Shaxsiy Fon Rasmi</span>
                </div>
                <div className="text-[11px] text-slate-400">O'zingiz tanlagan rasm URL manzili</div>
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Backup & Restore Section */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Zaxiralash va Ma'lumotlarni Saqlash (Backup)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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

              <label className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center space-x-2 cursor-pointer">
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

          {/* Supabase Status and SQL Schema */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Supabase PostgreSQL Baza Holati
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Baza ulanishi va SQL Editor uchun tayyor skript
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={copySql}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Nusxalandi' : 'SQL Sxemani Nusxalash'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Supabase SQL Sxemasi Tayyor (PostgreSQL 15+)
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Supabase boshqaruv panelidagi SQL Editorga o'ting, yuqoridagi nusxalangan SQL kodni qo'yib <strong>Run</strong> tugmasini bosing.
              </p>
            </div>
          </div>

          {/* General Site Branding / Texts */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sayt va Guruh Ma'lumotlarini Tahrirlash
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telegram Admin</label>
                <input 
                  type="text"
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aloqa Telefoni</label>
                <input 
                  type="text"
                  value={phoneContact}
                  onChange={e => setPhoneContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
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
