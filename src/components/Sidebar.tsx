import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  FolderGit2, 
  StickyNote, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  LogOut,
  ShoppingBag,
  CheckSquare,
  Search,
  Cpu,
  GitBranch,
  FileSpreadsheet,
  ChevronRight
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
  const currentLang: Language = (language || user.language || 'uz') as Language;
  const t = getTranslation(currentLang);

  // Hover state for auto-expansion on hover (Point 5)
  const [isHovered, setIsHovered] = useState(false);

  // Build menu list strictly according to user role requirements
  const menuList: { name: string; displayName: string; icon: any }[] = [];

  if (user.role === 'creator' || user.role === 'engineer') {
    menuList.push({ name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard });
    menuList.push({ name: 'Mijoz Buyurtmalari', displayName: t.clientOrders, icon: ShoppingBag });
    menuList.push({ name: 'A\'zolar', displayName: t.members, icon: Users });
    menuList.push({ name: 'Loyihalar', displayName: t.projects, icon: FolderGit2 });
    menuList.push({ name: 'Vazifalar', displayName: t.tasks, icon: CheckSquare });
    menuList.push({ name: 'Chat', displayName: t.chat, icon: MessageSquare });
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
    // Regular visitor / client user
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

  // Whether sidebar is currently visually expanded:
  // On desktop: expanded only when hovered!
  // On mobile: expanded when isOpen is true.
  const isExpanded = isHovered;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* 
        Pinned Fixed Sidebar:
        - Desktop: fixed / sticky, collapsed to w-[72px] by default.
        - On cursor hover: expands smoothly to w-64 (256px) revealing all text.
        - Pinned vertically so scrolling content in <main> NEVER scrolls the sidebar!
      */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-full flex-shrink-0 flex flex-col justify-between transition-all duration-300 ease-in-out border-r shadow-md select-none ${
          /* Mobile slide drawer logic */
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          /* Desktop width: w-[72px] collapsed by default, w-64 when hovered */
          isExpanded ? 'w-64' : 'w-[72px]'
        } ${
          darkMode 
            ? 'bg-slate-900 border-slate-800 text-slate-200' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="p-3.5 space-y-5 overflow-y-auto overflow-x-hidden flex-1">
          
          {/* Header Branding */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 h-10">
            <div className={`flex items-center space-x-2.5 transition-opacity duration-200 ${
              isExpanded ? 'opacity-100 pl-1' : 'opacity-100 justify-center w-full'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md flex-shrink-0">
                VC
              </div>
              {isExpanded && (
                <div className="flex flex-col truncate animate-in fade-in duration-200">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    VISIONCORE
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">
                    MENYU
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            {isExpanded && (
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2.5 block animate-in fade-in">
                ASOSIY MENYU
              </span>
            )}
            <nav className="space-y-1 pt-1">
              {menuList.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    id={`sidebar-menu-${item.name.toLowerCase().replace(/[\s']/g, '-')}`}
                    onClick={() => handleMenuClick(item.name)}
                    title={!isExpanded ? item.displayName : undefined}
                    className={`w-full flex items-center rounded-2xl text-xs font-semibold transition cursor-pointer active:scale-95 group relative ${
                      isExpanded 
                        ? 'px-3 py-2.5 space-x-3 text-left' 
                        : 'p-2.5 justify-center'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] font-bold'
                        : darkMode
                          ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="truncate animate-in fade-in duration-200">
                        {item.displayName}
                      </span>
                    )}

                    {/* Tooltip on collapsed mode */}
                    {!isExpanded && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition shadow-lg z-50 border border-slate-800">
                        {item.displayName}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Profile & Settings Section */}
          <div className="space-y-1 pt-3 border-t border-slate-200 dark:border-slate-800">
            {isExpanded && (
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2.5 block animate-in fade-in">
                SHAXSIY
              </span>
            )}
            <nav className="space-y-1 pt-1">
              {bottomList.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    id={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleMenuClick(item.name)}
                    title={!isExpanded ? item.displayName : undefined}
                    className={`w-full flex items-center rounded-2xl text-xs font-semibold transition cursor-pointer active:scale-95 group relative ${
                      isExpanded 
                        ? 'px-3 py-2.5 space-x-3 text-left' 
                        : 'p-2.5 justify-center'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] font-bold'
                        : darkMode
                          ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="truncate animate-in fade-in duration-200">
                        {item.displayName}
                      </span>
                    )}

                    {!isExpanded && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition shadow-lg z-50 border border-slate-800">
                        {item.displayName}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* Logout button at bottom of sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            title={!isExpanded ? t.logout : undefined}
            className={`w-full flex items-center rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer group relative ${
              isExpanded 
                ? 'px-3 py-2.5 space-x-3 text-left' 
                : 'p-2.5 justify-center'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="truncate animate-in fade-in duration-200">
                {t.logout}
              </span>
            )}

            {!isExpanded && (
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-950 text-red-400 text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition shadow-lg z-50 border border-slate-800">
                {t.logout}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
