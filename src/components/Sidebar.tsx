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
  Megaphone,
  BarChart3
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  activeMenu: string;
  onChangeMenu: (menu: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeMenu,
  onChangeMenu,
  onLogout,
  isOpen,
  onCloseMobile
}) => {
  // Hover state for auto-expansion on hover
  const [isHovered, setIsHovered] = useState(false);

  const menuList: { name: string; displayName: string; icon: any }[] = [];

  if (user.role === 'creator') {
    menuList.push({ name: 'Bosh sahifa', displayName: 'Bosh sahifa', icon: LayoutDashboard });
    menuList.push({ name: 'Statistika', displayName: 'Statistika', icon: BarChart3 });
    menuList.push({ name: 'Mijoz Buyurtmalari', displayName: 'Mijoz Buyurtmalari', icon: ShoppingBag });
    menuList.push({ name: 'A\'zolar', displayName: 'A\'zolar', icon: Users });
    menuList.push({ name: 'Broadcast', displayName: 'Xabar tarqatish', icon: Megaphone });
    menuList.push({ name: 'Loyihalar', displayName: 'Loyihalar', icon: FolderGit2 });
    menuList.push({ name: 'Vazifalar', displayName: 'Vazifalar', icon: CheckSquare });
    menuList.push({ name: 'Chat', displayName: 'Suhbat (Chat)', icon: MessageSquare });
    menuList.push({ name: 'Note', displayName: 'Note (Qaydlar)', icon: StickyNote });
  } else if (user.role === 'engineer') {
    menuList.push({ name: 'Bosh sahifa', displayName: 'Bosh sahifa', icon: LayoutDashboard });
    menuList.push({ name: 'Mijoz Buyurtmalari', displayName: 'Mijoz Buyurtmalari', icon: ShoppingBag });
    menuList.push({ name: 'Loyihalar', displayName: 'Loyihalar', icon: FolderGit2 });
    menuList.push({ name: 'Vazifalar', displayName: 'Vazifalar', icon: CheckSquare });
    menuList.push({ name: 'Chat', displayName: 'Suhbat (Chat)', icon: MessageSquare });
    menuList.push({ name: 'Note', displayName: 'Note (Qaydlar)', icon: StickyNote });
  } else if (user.role === 'researcher') {
    menuList.push({ name: 'Bosh sahifa', displayName: 'Bosh sahifa', icon: LayoutDashboard });
    menuList.push({ name: 'Mijoz Buyurtmalari', displayName: 'Mijoz Buyurtmalari', icon: ShoppingBag });
    menuList.push({ name: 'Aqlli qidiruv', displayName: 'Aqlli qidiruv', icon: Search });
    menuList.push({ name: 'Chat', displayName: 'Suhbat (Chat)', icon: MessageSquare });
    menuList.push({ name: 'Note', displayName: 'Note (Qaydlar)', icon: StickyNote });
  } else if (user.role === 'designer') {
    menuList.push({ name: 'Bosh sahifa', displayName: 'Bosh sahifa', icon: LayoutDashboard });
    menuList.push({ name: 'Mijoz Buyurtmalari', displayName: 'Mijoz Buyurtmalari', icon: ShoppingBag });
    menuList.push({ name: 'Loyiha arxitekturasi', displayName: 'Loyiha arxitekturasi', icon: Cpu });
    menuList.push({ name: 'Chat', displayName: 'Suhbat (Chat)', icon: MessageSquare });
    menuList.push({ name: 'Note', displayName: 'Note (Qaydlar)', icon: StickyNote });
  } else if (user.role === 'analyst') {
    menuList.push({ name: 'Bosh sahifa', displayName: 'Bosh sahifa', icon: LayoutDashboard });
    menuList.push({ name: 'Mijoz Buyurtmalari', displayName: 'Mijoz Buyurtmalari', icon: ShoppingBag });
    menuList.push({ name: 'Test Natijalari', displayName: 'Test Natijalari', icon: FileSpreadsheet });
    menuList.push({ name: 'Versiyalash & Rejalash', displayName: 'Versiyalash & Rejalash', icon: GitBranch });
    menuList.push({ name: 'Chat', displayName: 'Suhbat (Chat)', icon: MessageSquare });
    menuList.push({ name: 'Note', displayName: 'Note (Qaydlar)', icon: StickyNote });
  } else {
    menuList.push({ name: 'Bosh sahifa', displayName: 'Bosh sahifa', icon: LayoutDashboard });
    menuList.push({ name: 'Chat', displayName: 'Suhbat (Chat)', icon: MessageSquare });
    menuList.push({ name: 'Buyurtma berish', displayName: 'Buyurtma berish', icon: ShoppingBag });
    menuList.push({ name: 'Note', displayName: 'Note (Qaydlar)', icon: StickyNote });
  }

  const bottomList = [
    { name: 'Profile', displayName: 'Profil', icon: UserIcon },
    { name: 'Sozlamalar', displayName: 'Sozlamalar', icon: SettingsIcon }
  ];

  const handleMenuClick = (menuName: string) => {
    onChangeMenu(menuName);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isExpanded = isHovered;

  return (
    <>
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Pinned Liquid Glass Sidebar without top VISIONCORE MENYU branding header */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-full flex-shrink-0 flex flex-col justify-between transition-all duration-300 ease-in-out liquid-glass border-r border-slate-200/60 dark:border-white/10 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isExpanded ? 'w-64' : 'w-[72px]'
        }`}
      >
        <div className="p-3.5 space-y-5 overflow-y-auto overflow-x-hidden flex-1 pt-4">
          
          {/* Navigation Section */}
          <div className="space-y-1">
            {isExpanded && (
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-2.5 block animate-in fade-in">
                ASOSIY MENYU
              </span>
            )}
            <nav className="space-y-1.5 pt-1">
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
                        ? 'bg-blue-600/90 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)] font-bold'
                        : 'hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="truncate animate-in fade-in duration-200">
                        {item.displayName}
                      </span>
                    )}

                    {!isExpanded && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition shadow-lg z-50 border border-white/10 backdrop-blur-md">
                        {item.displayName}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Profile & Settings Section */}
          <div className="space-y-1 pt-3 border-t border-slate-300/60 dark:border-white/10">
            {isExpanded && (
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-2.5 block animate-in fade-in">
                SHAXSIY
              </span>
            )}
            <nav className="space-y-1.5 pt-1">
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
                        ? 'bg-blue-600/90 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)] font-bold'
                        : 'hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="truncate animate-in fade-in duration-200">
                        {item.displayName}
                      </span>
                    )}

                    {!isExpanded && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition shadow-lg z-50 border border-white/10 backdrop-blur-md">
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
        <div className="p-3 border-t border-slate-300/60 dark:border-white/10">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            title={!isExpanded ? 'Chiqish' : undefined}
            className={`w-full flex items-center rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer group relative ${
              isExpanded 
                ? 'px-3 py-2.5 space-x-3 text-left' 
                : 'p-2.5 justify-center'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="truncate animate-in fade-in duration-200">
                Chiqish
              </span>
            )}

            {!isExpanded && (
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900/95 text-rose-400 text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition shadow-lg z-50 border border-white/10 backdrop-blur-md">
                Chiqish
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
