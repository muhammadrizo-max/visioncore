import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Project, ChatMessage, Task, NoteItem, VersionPlan,
  TestReport, ArchitectureDoc, ReminderPlan, NotificationItem, SiteSettings, Order, MemberActivity, BroadcastMessage
} from './types';
import {
  INITIAL_USERS, INITIAL_SITE_SETTINGS
} from './mockData';
import { fetchAllFromSupabase, sbSync } from './lib/supabase';
import { getToken, clearToken } from './lib/api';

import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { UserDashboard } from './components/UserDashboard';
import { ChatView } from './components/ChatView';
import { TasksView } from './components/TasksView';
import { NotesView } from './components/NotesView';
import { VersionPlanningView } from './components/VersionPlanningView';
import { TestReportsView } from './components/TestReportsView';
import { ResearcherPanel } from './components/ResearcherPanel';
import { EngineerPanel } from './components/EngineerPanel';
import { DesignerPanel } from './components/DesignerPanel';
import { OrderView } from './components/OrderView';
import { OrdersManagementView } from './components/OrdersManagementView';
import { MembersView } from './components/MembersView';
import { BroadcastView } from './components/BroadcastView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { MatrixRain } from './components/MatrixRain';

export default function App() {
  // Clean legacy dummy data once so real production counts start from 0
  useEffect(() => {
    const isCleaned = localStorage.getItem('visioncore_clean_v6_real');
    if (!isCleaned) {
      localStorage.removeItem('visioncore_users');
      localStorage.removeItem('visioncore_tasks');
      localStorage.removeItem('visioncore_projects');
      localStorage.removeItem('visioncore_test_reports');
      localStorage.removeItem('visioncore_version_plans');
      localStorage.removeItem('visioncore_architecture_docs');
      localStorage.removeItem('visioncore_orders');
      localStorage.removeItem('visioncore_notes');
      localStorage.removeItem('visioncore_chats');
      localStorage.removeItem('visioncore_reminders');
      localStorage.removeItem('visioncore_activities');
      localStorage.removeItem('visioncore_notifications');
      localStorage.setItem('visioncore_clean_v6_real', 'true');
    }
  }, []);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('visioncore_dark_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('visioncore_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Current User Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('visioncore_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Real collections (starting clean; master Creator account seeded when empty)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('visioncore_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('visioncore_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('visioncore_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('visioncore_chats');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('visioncore_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('visioncore_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [versionPlans, setVersionPlans] = useState<VersionPlan[]>(() => {
    const saved = localStorage.getItem('visioncore_version_plans');
    return saved ? JSON.parse(saved) : [];
  });

  const [testReports, setTestReports] = useState<TestReport[]>(() => {
    const saved = localStorage.getItem('visioncore_test_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [architectureDocs, setArchitectureDocs] = useState<ArchitectureDoc[]>(() => {
    const saved = localStorage.getItem('visioncore_architecture_docs');
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<ReminderPlan[]>(() => {
    const saved = localStorage.getItem('visioncore_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState<MemberActivity[]>(() => {
    const saved = localStorage.getItem('visioncore_activities');
    return saved ? JSON.parse(saved) : [];
  });

  // Real notifications only (zero fake default alerts)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('visioncore_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('visioncore_site_settings');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  const [activeMenu, setActiveMenu] = useState<string>('Bosh sahifa');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // LocalStorage Persistence
  useEffect(() => { localStorage.setItem('visioncore_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('visioncore_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('visioncore_chats', JSON.stringify(chats)); }, [chats]);
  useEffect(() => { localStorage.setItem('visioncore_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('visioncore_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('visioncore_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('visioncore_version_plans', JSON.stringify(versionPlans)); }, [versionPlans]);
  useEffect(() => { localStorage.setItem('visioncore_test_reports', JSON.stringify(testReports)); }, [testReports]);
  useEffect(() => { localStorage.setItem('visioncore_architecture_docs', JSON.stringify(architectureDocs)); }, [architectureDocs]);
  useEffect(() => { localStorage.setItem('visioncore_reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('visioncore_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('visioncore_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('visioncore_site_settings', JSON.stringify(siteSettings)); }, [siteSettings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('visioncore_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('visioncore_current_user');
    }
  }, [currentUser]);

  // Real Supabase Synchronization + Realtime Channel Subscription
  const syncWithSupabase = useCallback(async (): Promise<boolean> => {
    if (!getToken()) return false;

    const data = await fetchAllFromSupabase();
    if (!data) {
      return false;
    }

    if (data.users && data.users.length > 0) {
      setUsers(data.users);
      setCurrentUser(prev => {
        if (!prev) return null;
        const fresh = data.users!.find(u => u.id === prev.id);
        return fresh || prev;
      });
    }

    if (data.orders) setOrders(data.orders);
    if (data.projects) setProjects(data.projects);
    if (data.tasks) setTasks(data.tasks);
    if (data.notes) setNotes(data.notes);
    if (data.chats) setChats(data.chats);
    if (data.reminders) setReminders(data.reminders);
    if (data.activities) setActivities(data.activities);
    if (data.notifications) setNotifications(data.notifications);
    if (data.siteSettings) {
      setSiteSettings(prev => ({
        ...prev,
        ...data.siteSettings
      }));
    }

    return true;
  }, []);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg?.siteSettings) {
          setSiteSettings((prev) => ({ ...prev, ...cfg.siteSettings }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser || !getToken()) return;
    void syncWithSupabase();
    const timer = setInterval(() => {
      void syncWithSupabase();
    }, 10000);
    return () => clearInterval(timer);
  }, [currentUser, syncWithSupabase]);

  const handleClearNotifications = () => {
    setNotifications([]);
    void sbSync.clearNotifications();
  };

  // Activity logger helper
  const logActivity = (action: string, actor?: User) => {
    const who = actor || currentUser;
    if (!who) return;
    const newAct: MemberActivity = {
      id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: who.id,
      userName: `${who.firstName || who.username} ${who.lastName || ''}`.trim(),
      userRole: who.role,
      action,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newAct, ...prev]);
    void sbSync.insertActivity(newAct);
  };

  // Push real notification helper
  const pushNotification = (message: string) => {
    const newNotif: NotificationItem = {
      id: `N-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      message,
      read: false,
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => [newNotif, ...prev]);
    void sbSync.upsertNotification(newNotif);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      updated.forEach(n => { void sbSync.upsertNotification(n); });
      return updated;
    });
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    const isNewRegistration = !users.some(u => u.id === user.id);
    setCurrentUser(user);
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      return exists ? prev.map(u => (u.id === user.id ? user : u)) : [...prev, user];
    });
    void sbSync.upsertUser(user);
    setActiveMenu('Bosh sahifa');
    logActivity(isNewRegistration ? 'Platformada ro\'yxatdan o\'tdi' : 'Tizimga muvaffaqiyatli kirdi', user);
    if (isNewRegistration && user.role === 'user') {
      pushNotification(`Yangi user ro'yxatdan o'tdi: ${user.firstName || user.username} (${user.id})`);
    }
  };

  const handleLogout = () => {
    logActivity('Tizimdan chiqdi');
    clearToken();
    setCurrentUser(null);
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: newAvatarUrl };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    void sbSync.upsertUser(updated);
    logActivity('Shaxsiy profil rasmini yangiladi');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    void sbSync.upsertUser(updatedUser);
    logActivity('Shaxsiy profil ma\'lumotlarini saqladi');
  };

  // Orders Handlers
  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    void sbSync.upsertOrder(newOrder);
    logActivity(`Yangi loyiha buyurtmasi topshirdi: "${newOrder.projectName}"`);
    pushNotification(`Yangi buyurtma keldi: "${newOrder.projectName}" (${newOrder.projectType})`);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    void sbSync.upsertOrder(updatedOrder);
    logActivity(`"${updatedOrder.projectName}" buyurtmasi statusini yangiladi: ${updatedOrder.status}`);
    pushNotification(`Buyurtma holati yangilandi: "${updatedOrder.projectName}" → ${updatedOrder.status}`);
  };

  // Members Handlers (Enforce single Creator rule)
  const handleAddMember = (newUser: User) => {
    if (newUser.role === 'creator') return;
    setUsers(prev => [...prev, newUser]);
    void sbSync.createMember(newUser);
    logActivity(`Yangi guruh a'zosi qo'shildi: "${newUser.username}" (${newUser.role})`);
    pushNotification(`Yangi a'zo qo'shildi: ${newUser.firstName || newUser.username} (${newUser.role})`);
  };

  const handleUpdateMember = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    void sbSync.upsertUser(updatedUser);
  };

  const handleDeleteMember = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    void sbSync.deleteUser(userId);
    logActivity(`A'zo o'chirildi (ID: ${userId})`);
  };

  // Chat Handlers
  const handleSendMessage = (msg: ChatMessage) => {
    setChats(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    void sbSync.upsertChat(msg);
  };

  const handleEditMessage = (msgId: string, newText: string) => {
    setChats(prev => prev.map(m => {
      if (m.id === msgId) {
        const edited = { ...m, text: newText, isEdited: true };
        void sbSync.upsertChat(edited);
        return edited;
      }
      return m;
    }));
  };

  const handleDeleteMessage = (msgId: string) => {
    setChats(prev => prev.filter(m => m.id !== msgId));
    void sbSync.deleteChat(msgId);
  };

  // Project Handlers
  const handleAddProject = (proj: Project) => {
    setProjects(prev => [...prev, proj]);
    void sbSync.upsertProject(proj);
    logActivity(`Yangi loyiha yaratildi: "${proj.name}"`);
    pushNotification(`Yangi loyiha ochildi: "${proj.name}"`);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    void sbSync.upsertProject(updatedProj);
  };

  const handleDeleteProject = (projId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projId));
    void sbSync.deleteProject(projId);
  };

  // Task Handlers
  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
    void sbSync.upsertTask(newTask);
    logActivity(`Yangi vazifa belgilandi: "${newTask.title}"`);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    void sbSync.upsertTask(updatedTask);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const next = { ...t, completed: !t.completed };
        if (next.completed) logActivity(`"${t.title}" vazifasini bajardi`);
        void sbSync.upsertTask(next);
        return next;
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    void sbSync.deleteTask(taskId);
  };

  // Note Handlers
  const handleAddNote = (newNote: NoteItem) => {
    setNotes(prev => [newNote, ...prev]);
    void sbSync.upsertNote(newNote);
  };

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    void sbSync.upsertNote(updatedNote);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    void sbSync.deleteNote(id);
  };

  // Reminder Handlers
  const handleAddReminder = (title: string, date: string) => {
    if (!currentUser) return;
    const newRem: ReminderPlan = {
      id: `REM-${Date.now()}`,
      userId: currentUser.id,
      title,
      date,
      completed: false
    };
    setReminders(prev => [newRem, ...prev]);
    void sbSync.upsertReminder(newRem);
  };

  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id === id) {
        const next = { ...r, completed: !r.completed };
        void sbSync.upsertReminder(next);
        return next;
      }
      return r;
    }));
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    void sbSync.deleteReminder(id);
  };

  // Site Settings Handler
  const handleUpdateSiteSettings = (nextSettings: SiteSettings) => {
    setSiteSettings(nextSettings);
    void sbSync.saveSiteSettings(nextSettings);
  };

  // Broadcast Handlers (Creator only sends; recipients mark read)
  const handleSendBroadcast = (bc: BroadcastMessage) => {
    const nextBroadcasts = [bc, ...(siteSettings.broadcasts || [])];
    handleUpdateSiteSettings({
      ...siteSettings,
      broadcasts: nextBroadcasts
    });
    logActivity(`Broadcast xabar yubordi: "${bc.title}" (${bc.targetType})`);
  };

  const handleDeleteBroadcast = (id: string) => {
    const nextBroadcasts = (siteSettings.broadcasts || []).filter((b) => b.id !== id);
    handleUpdateSiteSettings({
      ...siteSettings,
      broadcasts: nextBroadcasts
    });
  };

  const handleMarkBroadcastRead = (broadcastId: string) => {
    if (!currentUser) return;
    const nextBroadcasts = (siteSettings.broadcasts || []).map((bc) => {
      if (bc.id !== broadcastId) return bc;
      const existing = bc.readByUserIds || [];
      if (existing.includes(currentUser.id)) return bc;
      return {
        ...bc,
        readByUserIds: [...existing, currentUser.id]
      };
    });
    handleUpdateSiteSettings({
      ...siteSettings,
      broadcasts: nextBroadcasts
    });
  };

  // Specialist local handlers
  const handleSaveArchitecture = (doc: ArchitectureDoc) => {
    setArchitectureDocs(prev => {
      const exists = prev.some(d => d.id === doc.id || d.projectId === doc.projectId);
      return exists ? prev.map(d => (d.id === doc.id || d.projectId === doc.projectId ? doc : d)) : [doc, ...prev];
    });
    logActivity(`Loyiha arxitekturasi saqlandi: "${doc.projectName}"`);
  };

  const handleAddTestReport = (report: TestReport) => {
    setTestReports(prev => [report, ...prev]);
    logActivity(`Test hisoboti qo'shildi: "${report.testName}"`);
  };

  const handleDeleteTestReport = (reportId: string) => {
    setTestReports(prev => prev.filter(r => r.id !== reportId));
  };

  const handleSaveVersionPlan = (plan: VersionPlan) => {
    setVersionPlans(prev => {
      const exists = prev.some(vp => vp.id === plan.id || vp.projectId === plan.projectId);
      return exists ? prev.map(vp => (vp.id === plan.id || vp.projectId === plan.projectId ? plan : vp)) : [plan, ...prev];
    });
    logActivity(`Versiya rejasi yangilandi: "${plan.projectName}" (${plan.version})`);
  };

  // Restore backup
  const handleRestoreBackup = (data: any) => {
    if (data.users) {
      setUsers(data.users);
      data.users.forEach((u: User) => { void sbSync.upsertUser(u); });
    }
    if (data.orders) {
      setOrders(data.orders);
      data.orders.forEach((o: Order) => { void sbSync.upsertOrder(o); });
    }
    if (data.projects) {
      setProjects(data.projects);
      data.projects.forEach((p: Project) => { void sbSync.upsertProject(p); });
    }
    if (data.tasks) {
      setTasks(data.tasks);
      data.tasks.forEach((t: Task) => { void sbSync.upsertTask(t); });
    }
    if (data.notes) {
      setNotes(data.notes);
      data.notes.forEach((n: NoteItem) => { void sbSync.upsertNote(n); });
    }
    if (data.siteSettings) {
      handleUpdateSiteSettings(data.siteSettings);
    }
    logActivity('Zaxira nusxasi (Backup) tiklandi');
    pushNotification('Zaxira nusxasi muvaffaqiyatli tiklandi.');
  };

  // Unauthenticated Landing Page
  if (!currentUser) {
    return (
      <LandingPage
        allUsers={users}
        onLoginSuccess={handleLoginSuccess}
        siteSettings={siteSettings}
        projectsCount={projects.length}
        ordersCount={orders.length}
      />
    );
  }

  const isCreator = currentUser.role === 'creator';
  const bgMode = siteSettings.creatorBackgroundType || 'default';
  const showCustomBg = isCreator && bgMode === 'custom_image' && Boolean(siteSettings.creatorBackgroundImage);
  const showMatrixRain = bgMode === 'matrix';

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-colors relative ${
        darkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 text-slate-900'
      }`}
    >
      {/* Custom Uploaded Background Image Layer for Creator */}
      {showCustomBg && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${siteSettings.creatorBackgroundImage})` }}
        >
          <div className={`absolute inset-0 ${darkMode ? 'bg-slate-950/55' : 'bg-white/35'}`} />
        </div>
      )}

      {/* Ambient Liquid-Glass Orbs */}
      {!showCustomBg && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-blue-500/20 dark:bg-blue-600/15 blur-3xl" />
          <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 dark:bg-purple-600/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-cyan-400/20 dark:bg-emerald-500/10 blur-3xl" />
        </div>
      )}

      {/* Digital Matrix Rain (Active only when Matrix mode is selected) */}
      {showMatrixRain && (
        <MatrixRain
          opacity={darkMode ? 0.72 : 0.22}
          darkMode={darkMode}
        />
      )}

      {/* Top Header */}
      <Header
        user={currentUser}
        activeMenu={activeMenu}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigateMenu={setActiveMenu}
        notifications={notifications}
        broadcasts={siteSettings.broadcasts || []}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onMarkBroadcastRead={handleMarkBroadcastRead}
      />

      {/* Main Layout Container (Fixed left sidebar + independent scroll body) */}
      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        <Sidebar
          user={currentUser}
          activeMenu={activeMenu}
          onChangeMenu={setActiveMenu}
          onLogout={handleLogout}
          darkMode={darkMode}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto min-h-0">
          {activeMenu === 'Bosh sahifa' && (
            <UserDashboard
              user={currentUser}
              allUsers={users}
              reminders={reminders}
              orders={orders}
              projects={projects}
              tasks={tasks}
              activities={activities}
              siteSettings={siteSettings}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onNavigateMenu={setActiveMenu}
              onMarkBroadcastRead={handleMarkBroadcastRead}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Mijoz Buyurtmalari' && currentUser.role !== 'user' && (
            <OrdersManagementView
              orders={orders}
              allUsers={users}
              currentUser={currentUser}
              onUpdateOrder={handleUpdateOrder}
              darkMode={darkMode}
            />
          )}

          {activeMenu === "A'zolar" && isCreator && (
            <MembersView
              currentUser={currentUser}
              allUsers={users}
              activities={activities}
              tasks={tasks}
              orders={orders}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Broadcast' && isCreator && (
            <BroadcastView
              currentUser={currentUser}
              allUsers={users}
              broadcasts={siteSettings.broadcasts || []}
              onSendBroadcast={handleSendBroadcast}
              onDeleteBroadcast={handleDeleteBroadcast}
            />
          )}

          {activeMenu === 'Chat' && (
            <ChatView
              currentUser={currentUser}
              allUsers={users}
              chats={chats}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Buyurtma berish' && (
            <OrderView
              currentUser={currentUser}
              orders={orders}
              onSubmitOrder={handleAddOrder}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Loyihalar' && (
            <EngineerPanel
              currentUser={currentUser}
              allUsers={users}
              projects={projects}
              architectureDocs={architectureDocs}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              activeTab="projects"
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Vazifalar' && (
            <TasksView
              currentUser={currentUser}
              allUsers={users}
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Note' && (
            <NotesView
              currentUser={currentUser}
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              darkMode={darkMode}
            />
          )}

          {(activeMenu === 'Profile' || activeMenu === 'Profil') && (
            <ProfileView
              user={currentUser}
              allUsers={users}
              onUpdateUser={handleUpdateUser}
              onUpdateAvatar={handleUpdateAvatar}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Sozlamalar' && (
            <SettingsView
              user={currentUser}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              siteSettings={siteSettings}
              onUpdateSiteSettings={handleUpdateSiteSettings}
              allUsers={users}
              orders={orders}
              projects={projects}
              tasks={tasks}
              notes={notes}
              onRestoreBackup={handleRestoreBackup}
            />
          )}

          {activeMenu === 'Aqlli qidiruv' && (
            <ResearcherPanel
              currentUser={currentUser}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Loyiha arxitekturasi' && (
            <DesignerPanel
              currentUser={currentUser}
              projects={projects}
              architectureDocs={architectureDocs}
              onSaveArchitecture={handleSaveArchitecture}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Test Natijalari' && (
            <TestReportsView
              currentUser={currentUser}
              projects={projects}
              testReports={testReports}
              onAddReport={handleAddTestReport}
              onDeleteReport={handleDeleteTestReport}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Versiyalash & Rejalash' && (
            <VersionPlanningView
              currentUser={currentUser}
              projects={projects}
              versionPlans={versionPlans}
              onSavePlan={handleSaveVersionPlan}
              darkMode={darkMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}
