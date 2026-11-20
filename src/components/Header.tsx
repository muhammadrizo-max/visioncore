import React, { useState, useRef, useEffect } from 'react';
import { Shield, Moon, Sun, ChevronLeft, Bell, CheckCheck, Trash2, Megaphone, ShoppingBag, CheckSquare, MessageSquare, Users } from 'lucide-react';
import { User, NotificationItem, BroadcastMessage, OnlineUserInfo } from '../types';

interface HeaderProps {
  user: User;
  activeMenu: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNavigateMenu: (menu: string) => void;
  notifications: NotificationItem[];
  broadcasts?: BroadcastMessage[];
  onlineUsers?: OnlineUserInfo[];
  onMarkAllNotificationsRead: () => void;
  onMarkNotificationRead?: (notifId: string) => void;
  onClearNotifications: () => void;
  onMarkBroadcastRead?: (broadcastId: string) => void;
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
  broadcasts = [],
  onlineUsers = [],
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onClearNotifications,
  onMarkBroadcastRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnlinePopover, setShowOnlinePopover] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const onlineRef = useRef<HTMLDivElement>(null);

  const isCreator = user.role === 'creator';
  const isTeamMember = user.role !== 'user';

  // Filter broadcasts addressed to this user
  const myBroadcasts = broadcasts.filter((bc) => {
    if (isCreator) return false;
    if (bc.targetType === 'all') return true;
    if (bc.targetType === 'members' && isTeamMember) return true;
    if (bc.targetType === 'users' && user.role === 'user') return true;
    if (bc.targetType === 'single' && bc.targetUserId === user.id) return true;
    return false;
  });

  // Filter notifications relevant to current user (Creator gets all; Team gets team orders + specific + chat; User gets specific + chat)
  const visibleNotifications = notifications.filter((n) => {
    if (isCreator) return true;
    const scope = n.targetScope || 'creator';
    if (scope === 'team' && isTeamMember) return true;
    if (scope === 'specific' && Array.isArray(n.targetUserIds) && n.targetUserIds.includes(user.id)) return true;
    return false;
  });

  const isNotifRead = (n: NotificationItem) => {
    if (isCreator && n.targetScope !== 'specific') {
      return Boolean(n.read) || (n.readByUserIds || []).includes(user.id);
    }
    return Boolean(n.read) || (n.readByUserIds || []).includes(user.id);
  };

  const unreadNotifCount = visibleNotifications.filter((n) => !isNotifRead(n)).length;
  const unreadBroadcastCount = myBroadcasts.filter((bc) => !(bc.readByUserIds || []).includes(user.id)).length;
  const totalUnread = unreadNotifCount + unreadBroadcastCount;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (onlineRef.current && !onlineRef.current.contains(e.target as Node)) {
        setShowOnlinePopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayHeaderTitle = (menu: string) => {
    switch (menu) {
      case 'Bosh sahifa': return 'Bosh sahifa';
      case 'Statistika': return 'Statistika';
      case 'Chat': return 'Suhbat (Chat)';
      case 'Mijoz Buyurtmalari': return 'Mijoz Buyurtmalari';
      case "A'zolar": return "A'zolar";
      case 'Broadcast': return 'Xabar tarqatish (Broadcast)';
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

  const handleMarkAllReadCombined = () => {
    onMarkAllNotificationsRead();
    if (!isCreator && onMarkBroadcastRead) {
      myBroadcasts.forEach((bc) => {
        if (!(bc.readByUserIds || []).includes(user.id)) {
          onMarkBroadcastRead(bc.id);
        }
      });
    }
  };

  const handleClickNotification = (n: NotificationItem) => {
    if (!isNotifRead(n) && onMarkNotificationRead) {
      onMarkNotificationRead(n.id);
    }
    if (n.actionMenu) {
      onNavigateMenu(n.actionMenu);
      setShowNotifications(false);
    }
  };

  const renderCategoryIcon = (cat?: NotificationItem['category']) => {
    if (cat === 'order') return <ShoppingBag className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />;
    if (cat === 'task') return <CheckSquare className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />;
    if (cat === 'chat_dm' || cat === 'chat_group') return <MessageSquare className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />;
    return <Bell className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />;
  };

  return (
    <header className="relative z-40 w-full flex-shrink-0 liquid-glass border-b border-slate-200/60 dark:border-white/10 px-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
      {/* Brand & Sidebar Toggle Button */}
      <div className="flex items-center space-x-3">
        <button
          id="header-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl bg-blue-600/90 hover:bg-blue-500 active:scale-95 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] flex-shrink-0 transition cursor-pointer"
          title={isSidebarOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
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

      {/* Right side controls: Live Online Users, Notifications/Broadcasts, Theme, User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Live Online Users Pill & Dropdown */}
        <div className="relative" ref={onlineRef}>
          <button
            id="header-online-users-btn"
            onClick={() => {
              setShowOnlinePopover((v) => !v);
              setShowNotifications(false);
            }}
            className="px-2.5 sm:px-3 py-2 rounded-xl liquid-glass-subtle hover:bg-emerald-500/15 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95 flex items-center space-x-1.5"
            title="Hozir saytda online bo'lgan foydalanuvchilar"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {onlineUsers.length || 1}
            </span>
            <span className="hidden md:inline text-[11px] font-bold text-slate-600 dark:text-slate-300">
              online
            </span>
          </button>

          {showOnlinePopover && (
            <div className="absolute right-0 mt-2.5 w-[min(90vw,20rem)] rounded-3xl liquid-glass border border-slate-200/80 dark:border-white/15 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Hozir Online ({onlineUsers.length || 1})
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Jonli
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {onlineUsers.length === 0 ? (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl liquid-glass-subtle text-xs">
                    <div className="flex items-center space-x-2.5">
                      <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-xl object-cover border border-emerald-500/40" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {user.firstName || user.username} {user.lastName || ''} (Siz)
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                          {user.role}
                        </div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                ) : (
                  onlineUsers.map((ou) => {
                    const isSelf = ou.userId === user.id;
                    return (
                      <div
                        key={ou.userId}
                        className="flex items-center justify-between p-2.5 rounded-2xl liquid-glass-subtle text-xs gap-2"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                ou.avatar ||
                                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(ou.username)}`
                              }
                              alt={ou.username}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-white/20"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {ou.displayName || ou.username} {isSelf ? '(Siz)' : ''}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="uppercase font-extrabold text-blue-600 dark:text-blue-400">
                                {ou.role}
                              </span>
                              {ou.currentMenu && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{ou.currentMenu}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateMenu('Chat');
                              setShowOnlinePopover(false);
                            }}
                            className="p-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white transition cursor-pointer flex-shrink-0"
                            title="Suhbatga o'tish"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications & Broadcasts Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="header-notifications-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowOnlinePopover(false);
            }}
            className="relative p-2.5 rounded-xl liquid-glass-subtle hover:bg-blue-500/15 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95"
            title="Bildirishnomalar"
          >
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-[min(92vw,24rem)] sm:w-96 rounded-3xl liquid-glass border border-slate-200/80 dark:border-white/15 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Bildirishnomalar ({visibleNotifications.length + myBroadcasts.length})
                  </h3>
                </div>

                {(visibleNotifications.length > 0 || myBroadcasts.length > 0) && (
                  <div className="flex items-center space-x-2">
                    {totalUnread > 0 && (
                      <button
                        onClick={handleMarkAllReadCombined}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        title="Barchasini o'qilgan deb belgilash"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>O'qildi</span>
                      </button>
                    )}
                    {isCreator && visibleNotifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-[11px] font-bold text-rose-500 hover:underline flex items-center space-x-1 cursor-pointer"
                        title="Tozalash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {visibleNotifications.length === 0 && myBroadcasts.length === 0 ? (
                  <div className="py-8 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Hozircha yangi bildirishnomalar yo'q
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Creator Broadcasts (if any) */}
                    {myBroadcasts.map((bc) => {
                      const isRead = (bc.readByUserIds || []).includes(user.id);
                      return (
                        <div
                          key={bc.id}
                          onClick={() => !isRead && onMarkBroadcastRead && onMarkBroadcastRead(bc.id)}
                          className={`p-3 rounded-2xl border text-xs space-y-1.5 transition cursor-pointer ${
                            !isRead
                              ? 'bg-blue-500/10 border-blue-500/30 text-slate-900 dark:text-white'
                              : 'liquid-glass-subtle text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center space-x-1.5">
                              <Megaphone className="w-3.5 h-3.5 text-purple-500" />
                              <span>{bc.title}</span>
                            </span>
                            {!isRead && <span className="text-[10px] text-blue-500 font-bold">● Yangi</span>}
                          </div>
                          {bc.imageUrl && (
                            <img src={bc.imageUrl} alt={bc.title} className="w-full max-h-28 object-cover rounded-xl" />
                          )}
                          <p className="leading-relaxed">{bc.message}</p>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {new Date(bc.createdAt).toLocaleString('uz-UZ')}
                          </div>
                        </div>
                      );
                    })}

                    {/* Role/User-Targeted System, Order, Task & Chat Notifications */}
                    {visibleNotifications.map((n) => {
                      const read = isNotifRead(n);
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleClickNotification(n)}
                          className={`p-3 rounded-2xl border text-xs space-y-1 transition ${
                            n.actionMenu ? 'cursor-pointer hover:border-blue-500/40' : ''
                          } ${
                            !read
                              ? 'bg-blue-500/10 border-blue-500/30 text-slate-900 dark:text-white'
                              : 'liquid-glass-subtle text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {renderCategoryIcon(n.category)}
                            <p className="leading-relaxed font-medium flex-1">{n.message}</p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pl-5">
                            <span>{n.time}</span>
                            {!read && <span className="text-blue-500 font-bold">● Yangi</span>}
                          </div>
                        </div>
                      );
                    })}
                  </>
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
            <span
              className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                user.role === 'creator'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'text-blue-600 dark:text-blue-400 bg-blue-500/15'
              }`}
            >
              {user.role}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
