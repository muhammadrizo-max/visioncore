import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Search, 
  UserPlus, 
  FolderGit2, 
  Cpu, 
  StickyNote, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronLeft,
  Crown,
  ShoppingBag,
  CheckSquare,
  GitBranch,
  FileSpreadsheet
} from 'lucide-react';
import { User, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface SidebarProps {
  user: User;
  activeMenu: string;
  onChangeMenu: (menu: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  isOpen: boolean;
  onCloseMobile: () => void;
  language?: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeMenu,
  onChangeMenu,
  onLogout,
  darkMode,
  isOpen,
  onCloseMobile,
  language = 'uz'
}) => {
  const t = getTranslation(language || user.language || 'uz');

  // Build menu list based on role
  const menuList: { name: string; displayName: string; icon: any }[] = [];

  // Creator gets full master control first
  if (user.role === 'creator') {
    menuList.push({ name: 'Creator Panel', displayName: (t as any).creatorPanel || 'Creator Panel', icon: Crown });
    menuList.push({ name: 'Buyurtmalar', displayName: 'Mijoz Buyurtmalari', icon: ShoppingBag });
    menuList.push({ name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard });
    menuList.push({ name: 'Chat', displayName: t.chat, icon: MessageSquare });
    menuList.push({ name: 'Loyihalar', displayName: t.projects, icon: FolderGit2 });
    menuList.push({ name: 'A\'zo qo\'shish', displayName: t.addMember, icon: UserPlus });
    menuList.push({ name: 'Aqlli qidiruv', displayName: t.aiSearch, icon: Search });
    menuList.push({ name: 'Loyiha arxitekturasi', displayName: t.architecture, icon: Cpu });
    menuList.push({ name: 'Vazifalar', displayName: t.tasks, icon: CheckSquare });
    menuList.push({ name: 'Note', displayName: t.notes, icon: StickyNote });
    menuList.push({ name: 'Versiyalash & Rejalash', displayName: t.versioning, icon: GitBranch });
    menuList.push({ name: 'Test Natijalari', displayName: t.testReports, icon: FileSpreadsheet });
  } else if (user.role === 'engineer') {
    menuList.push({ name: 'Creator Panel', displayName: (t as any).creatorPanel || 'Creator Panel', icon: Crown });
    menuList.push({ name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard });
    menuList.push({ name: 'Chat', displayName: t.chat, icon: MessageSquare });
    menuList.push({ name: 'Loyihalar', displayName: t.projects, icon: FolderGit2 });
    menuList.push({ name: 'A\'zo qo\'shish', displayName: t.addMember, icon: UserPlus });
    menuList.push({ name: 'Note', displayName: t.notes, icon: StickyNote });
  } else if (user.role === 'researcher') {
    menuList.push({ name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard });
    menuList.push({ name: 'Chat', displayName: t.chat, icon: MessageSquare });
    menuList.push({ name: 'Aqlli qidiruv', displayName: t.aiSearch, icon: Search });
    menuList.push({ name: 'Note', displayName: t.notes, icon: StickyNote });
  } else if (user.role === 'designer') {
    menuList.push({ name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard });
    menuList.push({ name: 'Chat', displayName: t.chat, icon: MessageSquare });
    menuList.push({ name: 'Loyiha arxitekturasi', displayName: t.architecture, icon: Cpu });
    menuList.push({ name: 'Note', displayName: t.notes, icon: StickyNote });
  } else if (user.role === 'analyst') {
    menuList.push({ name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard });
    menuList.push({ name: 'Chat', displayName: t.chat, icon: MessageSquare });
    menuList.push({ name: 'Test Natijalari', displayName: t.testReports, icon: FileSpreadsheet });
    menuList.push({ name: 'Versiyalash & Rejalash', displayName: t.versioning, icon: GitBranch });
    menuList.push({ name: 'Note', displayName: t.notes, icon: StickyNote });
  } else {
    // ODDIY USER (Regular Client / Visitor)
    // As explicitly requested: Vazifalar, versiyalash va test natijalari OLIB TASHLANDI!
    // O'rniga Buyurtma berish (Order a project) QO'SHILDI!
    menuList.push({ name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard });
    menuList.push({ name: 'Chat', displayName: t.chat, icon: MessageSquare });
    menuList.push({ name: 'Buyurtma berish', displayName: t.orders, icon: ShoppingBag });
    menuList.push({ name: 'Note', displayName: t.notes, icon: StickyNote });
  }

  // Personal Section
  const bottomList = [
    { name: 'Profile', displayName: t.profile, icon: UserIcon },
    { name: 'Sozlamalar', displayName: t.settings, icon: SettingsIcon }
  ];

  const handleMenuClick = (menuName: string) => {
    onChangeMenu(menuName);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  if (!isOpen) {
    return null; // When sidebar is toggled closed, hide it completely to give full room to content
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        onClick={onCloseMobile}
        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
      />

      <aside className={`fixed inset-y-0 left-0 z-50 md:z-30 w-64 border-r flex flex-col justify-between transition-all duration-300 md:static ${
        darkMode 
          ? 'bg-slate-900 border-slate-800 text-slate-200' 
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="p-4 space-y-5 overflow-y-auto">
          
          {/* Header with Close (<) Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                VISIONCORE
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                MENYU
              </span>
            </div>
            
            {/* Close Button with "<" symbol as requested by user */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Menyuni yopish (<)"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3">
              ASOSIY MENYU
            </span>
            <nav className="space-y-1 pt-1.5">
              {menuList.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    id={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleMenuClick(item.name)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer active:scale-98 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] font-bold'
                        : darkMode
                          ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.displayName}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Profile & Settings Section */}
          <div className="space-y-1 pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3">
              SHAXSIY
            </span>
            <nav className="space-y-1 pt-1.5">
              {bottomList.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    id={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleMenuClick(item.name)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer active:scale-98 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] font-bold'
                        : darkMode
                          ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.displayName}</span>
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* Logout button at bottom of sidebar (as requested: "u sidebarni ichida bolsa yetadi") */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
