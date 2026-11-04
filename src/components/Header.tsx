import React from 'react';
import { Shield, Moon, Sun, Globe, LogOut, Menu } from 'lucide-react';
import { User, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface HeaderProps {
  user: User;
  activeMenu: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onLanguageChange: (lang: Language) => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeMenu,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onLanguageChange,
  onToggleSidebar
}) => {
  const t = getTranslation(user.language || 'uz');

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors ${
      darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-800'
    } backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between`}>
      
      {/* Brand & Active menu */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {onToggleSidebar && (
          <button
            id="header-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Sidebarni ko'rsatish / yashirish"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent">
            CIPHER
          </span>
        </div>
        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activeMenu}</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">CIPHER Workspace Virtual Office</p>
        </div>
      </div>

      {/* Right side controls: Language, Theme, User badge */}
      <div className="flex items-center space-x-3">
        
        {/* Language selector */}
        <div className="relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <select
            id="header-language-select"
            value={user.language || 'uz'}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-transparent focus:outline-none font-medium cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <option value="uz" className="dark:bg-slate-800">O'zbekcha</option>
            <option value="en" className="dark:bg-slate-800">English</option>
            <option value="ru" className="dark:bg-slate-800">Русский</option>
          </select>
        </div>

        {/* Theme toggle */}
        <button
          id="header-theme-toggle-btn"
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="Mavzuni almashtirish"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User profile info badge */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <img 
            src={user.avatar} 
            alt={user.firstName} 
            className="w-9 h-9 rounded-xl object-cover border border-blue-500/40 shadow-sm"
          />
          <div className="hidden md:block text-left">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100">{user.firstName} {user.lastName}</h2>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
              {user.role}
            </span>
          </div>

          <button
            id="header-logout-btn"
            onClick={onLogout}
            className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            title={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
