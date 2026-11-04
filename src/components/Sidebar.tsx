import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Search, 
  UserPlus, 
  FolderGit2, 
  Cpu, 
  CheckSquare, 
  StickyNote, 
  GitBranch, 
  FileSpreadsheet, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  LogOut,
  X
} from 'lucide-react';
import { User } from '../types';
import { getTranslation } from '../lib/translations';

interface SidebarProps {
  user: User;
  activeMenu: string;
  onChangeMenu: (menu: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeMenu,
  onChangeMenu,
  onLogout,
  darkMode,
  isOpen = true,
  onCloseMobile
}) => {
  const t = getTranslation(user.language || 'uz');

  // Build menu list based on user role
  const menuList = [
    { name: 'Bosh sahifa', displayName: t.dashboard, icon: LayoutDashboard },
    { name: 'Chat', displayName: t.chat, icon: MessageSquare }
  ];

  // Role-specific items after Chat
  if (user.role === 'researcher') {
    menuList.push({ name: 'Aqlli qidiruv', displayName: t.aiSearch, icon: Search });
  } else if (user.role === 'engineer') {
    menuList.push({ name: 'Loyihalar', displayName: t.projects, icon: FolderGit2 });
    menuList.push({ name: 'A\'zo qo\'shish', displayName: t.addMember, icon: UserPlus });
  } else if (user.role === 'designer') {
    menuList.push({ name: 'Loyiha arxitekturasi', displayName: t.architecture, icon: Cpu });
  }

  // Common workspace items for all members
  menuList.push(
    { name: 'Vazifalar', displayName: t.tasks, icon: CheckSquare },
    { name: 'Note', displayName: t.notes, icon: StickyNote },
    { name: 'Versiyalash & Rejalash', displayName: t.versioning, icon: GitBranch },
    { name: 'Test Natijalari', displayName: t.testReports, icon: FileSpreadsheet }
  );

  // Bottom standard items
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

  return (
    <>
      {/* Mobile Backdrop Overlay when sidebar is open on small screens */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 md:z-30 w-64 border-r flex flex-col justify-between transition-all duration-300 md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="p-4 space-y-6 overflow-y-auto">
          
          {/* Mobile Header with close button */}
          <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
              CIPHER NAVIGATSIYA
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3">
              MENYU
            </span>
            <nav className="space-y-1 pt-2">
              {menuList.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    id={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleMenuClick(item.name)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left active:scale-98 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
                        : darkMode
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-200/60 text-slate-700'
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
          <div className="space-y-1 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3">
              SHAXSIY
            </span>
            <nav className="space-y-1 pt-2">
              {bottomList.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.name;
                return (
                  <button
                    key={item.name}
                    id={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleMenuClick(item.name)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left active:scale-98 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
                        : darkMode
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-200/60 text-slate-700'
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

        {/* Logout button at bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
