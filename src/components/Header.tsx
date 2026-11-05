import React from 'react';
import { Shield, Moon, Sun, Globe, ChevronLeft, Crown } from 'lucide-react';
import { User, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface HeaderProps {
  user: User;
  activeMenu: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLanguageChange: (lang: Language) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNavigateMenu: (menu: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeMenu,
  darkMode,
  onToggleDarkMode,
  onLanguageChange,
  isSidebarOpen,
  onToggleSidebar,
  onNavigateMenu
}) => {
  const currentLang: Language = (user.language || 'uz') as Language;
  const t = getTranslation(currentLang);

  // Translate activeMenu for header title display
  const getDisplayHeaderTitle = (menu: string) => {
    switch (menu) {
      case 'Bosh sahifa': return t.dashboard;
      case 'Chat': return t.chat;
      case 'Mijoz Buyurtmalari': return t.clientOrders;
      case 'A\'zolar': return t.members;
      case 'Loyihalar': return t.projects;
      case 'Vazifalar': return t.tasks;
      case 'Note': return t.notes;
      case 'Buyurtma berish': return t.orders;
      case 'Profile':
      case 'Profil': return t.profile;
      case 'Sozlamalar': return t.settings;
      case 'Aqlli qidiruv': return t.aiSearch;
      case 'Loyiha arxitekturasi': return t.architecture;
      case 'Test Natijalari': return t.testReports;
      case 'Versiyalash & Rejalash': return t.versioning;
      default: return menu;
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors ${
      darkMode 
        ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
        : 'bg-white/95 border-slate-200 text-slate-900'
    } backdrop-blur-md px-3 sm:px-6 py-3 flex items-center justify-between`}>
      
      {/* Brand & Sidebar Toggle Button */}
      <div className="flex items-center space-x-3">
        <button
          id="header-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] flex-shrink-0 transition cursor-pointer"
          title={isSidebarOpen ? "Menyuni yopish (<)" : "Menyuni ochish"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
          ) : (
            <Shield className="w-5 h-5 text-white stroke-[2.2]" />
          )}
        </button>

        <div className="flex flex-col cursor-pointer" onClick={() => onNavigateMenu('Bosh sahifa')}>
          <span className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
            VISIONCORE
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-blue-600 dark:text-blue-400 leading-none">
            Group Workspace
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
        
        <div className="hidden sm:block">
          <h1 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            {getDisplayHeaderTitle(activeMenu)}
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">VisionCore Group Virtual Office</p>
        </div>
      </div>

      {/* Right side controls: Role Badge, Language, Theme, User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        
        {/* Creator / Admin Quick Badge */}
        {user.role === 'creator' && (
          <button
            onClick={() => onNavigateMenu('Bosh sahifa')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
            title="Boshqaruv Markazi"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>CREATOR</span>
          </button>
        )}

        {/* Language selector */}
        <div className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
          darkMode 
            ? 'border-slate-700 bg-slate-800 text-slate-200' 
            : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}>
          <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <select
            id="header-language-select"
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-transparent focus:outline-none font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <option value="uz" className="text-slate-800 dark:text-slate-200 dark:bg-slate-800">O'zbekcha</option>
            <option value="en" className="text-slate-800 dark:text-slate-200 dark:bg-slate-800">English</option>
            <option value="ru" className="text-slate-800 dark:text-slate-200 dark:bg-slate-800">Русский</option>
          </select>
        </div>

        {/* Theme toggle */}
        <button
          id="header-theme-toggle-btn"
          onClick={onToggleDarkMode}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            darkMode 
              ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' 
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={darkMode ? t.lightMode : t.darkMode}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* User profile button - Clicking directly opens the Profile view! */}
        <button
          id="header-user-profile-btn"
          onClick={() => onNavigateMenu('Profile')}
          className={`flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800 p-1 rounded-xl transition cursor-pointer ${
            activeMenu === 'Profile'
              ? 'bg-blue-50 dark:bg-blue-900/30'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          title="Profilni ochish"
        >
          <img 
            src={user.avatar} 
            alt={user.firstName} 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-blue-500/40 shadow-sm"
          />
          <div className="hidden md:block text-left">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
              {user.firstName || user.username} {user.lastName || ''}
            </h2>
            <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
              user.role === 'creator'
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
            }`}>
              {user.role}
            </span>
          </div>
        </button>

      </div>
    </header>
  );
};
