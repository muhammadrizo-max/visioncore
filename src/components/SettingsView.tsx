import React from 'react';
import { Settings as SettingsIcon, Globe, Moon, Sun, Shield } from 'lucide-react';
import { User, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface SettingsViewProps {
  user: User;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onLanguageChange,
  darkMode,
  onToggleDarkMode
}) => {
  const t = getTranslation(user.language || 'uz');

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      
      {/* Settings Card */}
      <div className={`p-8 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      } shadow-sm space-y-6`}>
        
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            <span>{t.settings}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sayt tili va shaxsiy interfeys sozlamalarini o'zgartirish
          </p>
        </div>

        {/* Language Selection */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{t.language}</h2>
              <p className="text-xs text-slate-400">
                Interfeys tilini O'zbekcha, English yoki Русский ga o'zgartiring
              </p>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              id="settings-lang-uz-btn"
              onClick={() => onLanguageChange('uz')}
              className={`p-4 rounded-xl border text-xs font-bold transition text-center ${
                (user.language || 'uz') === 'uz'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500'
              }`}
            >
              🇺🇿 O'zbekcha
            </button>

            <button
              id="settings-lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`p-4 rounded-xl border text-xs font-bold transition text-center ${
                user.language === 'en'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500'
              }`}
            >
              🇬🇧 English
            </button>

            <button
              id="settings-lang-ru-btn"
              onClick={() => onLanguageChange('ru')}
              className={`p-4 rounded-xl border text-xs font-bold transition text-center ${
                user.language === 'ru'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500'
              }`}
            >
              🇷🇺 Русский
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold">Interfeys Mavzusi (Theme)</h2>
              <p className="text-xs text-slate-400">Tungi (Dark) yoki Kunduzgi (Light) ko'rinishni tanlash</p>
            </div>
          </div>

          <button
            id="settings-toggle-theme-btn"
            onClick={onToggleDarkMode}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
          >
            {darkMode ? "Light rejimga o'tish" : "Dark rejimga o'tish"}
          </button>
        </div>

      </div>

    </div>
  );
};
