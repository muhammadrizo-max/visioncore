import React, { useState, useRef, useEffect } from 'react';
import { Shield, Moon, Sun, ChevronLeft, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { User, NotificationItem } from '../types';

interface HeaderProps {
  user: User;
  activeMenu: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNavigateMenu: (menu: string) => void;
  notifications: NotificationItem[];
  onMarkAllNotificationsRead: () => void;
  onClearNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeMenu,
  darkMode,
  onToggleDarkMode,
  isSidebarOpen,
  onToggleSidebar,
  onNavigateMenu,
  notifications,
  onMarkAllNotificationsRead,
  onClearNotifications
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayHeaderTitle = (menu: string) => {
    switch (menu) {
      case 'Bosh sahifa': return 'Bosh sahifa';
      case 'Chat': return 'Suhbat (Chat)';
      case 'Mijoz Buyurtmalari': return 'Mijoz Buyurtmalari';
      case 'A\'zolar': return 'A\'zolar';
      case 'Loyihalar': return 'Loyihalar';
      case 'Vazifalar': return 'Vazifalar';
      case 'Note': return 'Note (Qaydlar)';
      case 'Buyurtma berish': return 'Buyurtma berish';
      case 'Profile':
      case 'Profil': return 'Profil';
      case 'Sozlamalar': return 'Sozlamalar';
      case 'Aqlli qidiruv': return 'Aqlli qidiruv';
      case 'Loyiha arxitekturasi': return 'Loyiha arxitekturasi';
      case 'Test Natijalari': return 'Test Natijalari';
      case 'Versiyalash & Rejalash': return 'Versiyalash & Rejalash';
      default: return menu;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full liquid-glass border-b border-slate-200/60 dark:border-white/10 px-3 sm:px-6 py-3 flex items-center justify-between">
      
      {/* Brand & Sidebar Toggle Button */}
      <div className="flex items-center space-x-3">
        <button
          id="header-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl bg-blue-600/90 hover:bg-blue-500 active:scale-95 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] flex-shrink-0 transition cursor-pointer"
          title={isSidebarOpen ? "Menyuni yopish" : "Menyuni ochish"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-6 h-6 text-white stroke-[2.5] md:hidden" />
          ) : null}
          <Shield className={`w-5 h-5 text-white stroke-[2.2] ${isSidebarOpen ? 'hidden md:block' : 'block'}`} />
        </button>

        <div className="flex flex-col cursor-pointer" onClick={() => onNavigateMenu('Bosh sahifa')}>
          <span className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
            VISIONCORE
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-blue-600 dark:text-blue-400 leading-none">
            Group Workspace
          </span>
        </div>

        <div className="h-5 w-px bg-slate-300/60 dark:bg-white/10 hidden sm:block"></div>
        
        <div className="hidden sm:block">
          <h1 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            {getDisplayHeaderTitle(activeMenu)}
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">VisionCore Group Virtual Office</p>
        </div>
      </div>

      {/* Right side controls: Notifications, Theme, User Profile (NO Creator button, NO Language selector) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        
        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="header-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl liquid-glass-subtle hover:bg-blue-500/15 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95"
            title="Bildirishnomalar"
          >
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-3xl liquid-glass border border-slate-200/80 dark:border-white/15 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Bildirishnomalar ({notifications.length})
                  </h3>
                </div>

                {notifications.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        title="Barchasini o'qilgan deb belgilash"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>O'qildi</span>
                      </button>
                    )}
                    <button
                      onClick={onClearNotifications}
                      className="text-[11px] font-bold text-rose-500 hover:underline flex items-center space-x-1 cursor-pointer"
                      title="Tozalash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Hozircha yangi bildirishnomalar yo'q
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-2xl border text-xs space-y-1 transition ${
                        !n.read
                          ? 'bg-blue-500/10 border-blue-500/30 text-slate-900 dark:text-white'
                          : 'liquid-glass-subtle text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <p className="leading-relaxed font-medium">{n.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{n.time}</span>
                        {!n.read && <span className="text-blue-500 font-bold">● Yangi</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          id="header-theme-toggle-btn"
          onClick={onToggleDarkMode}
          className="p-2.5 rounded-xl liquid-glass-subtle hover:bg-amber-500/15 transition cursor-pointer active:scale-95"
          title={darkMode ? 'Kunduzgi rejim (Light Mode)' : 'Tungi rejim (Dark Mode)'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* User profile button */}
        <button
          id="header-user-profile-btn"
          onClick={() => onNavigateMenu('Profile')}
          className={`flex items-center space-x-2 pl-2 border-l border-slate-300/60 dark:border-white/10 p-1 rounded-xl transition cursor-pointer ${
            activeMenu === 'Profile'
              ? 'bg-blue-500/15'
              : 'hover:bg-slate-200/40 dark:hover:bg-white/5'
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
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'text-blue-600 dark:text-blue-400 bg-blue-500/15'
            }`}>
              {user.role}
            </span>
          </div>
        </button>

      </div>
    </header>
  );
};
