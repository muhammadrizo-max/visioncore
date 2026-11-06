import React, { useState, useEffect } from 'react';
import { 
  User, Project, ChatMessage, Task, NoteItem, VersionPlan, 
  TestReport, ArchitectureDoc, ReminderPlan, NotificationItem, Language, SiteSettings, Order, MemberActivity 
} from './types';
import { 
  INITIAL_USERS, INITIAL_PROJECTS, INITIAL_CHATS, INITIAL_TASKS, 
  INITIAL_NOTES, INITIAL_VERSION_PLANS, INITIAL_TEST_REPORTS, 
  INITIAL_ARCHITECTURE_DOCS, INITIAL_REMINDERS, INITIAL_SITE_SETTINGS, INITIAL_ORDERS, INITIAL_ACTIVITIES 
} from './mockData';

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
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { MatrixRain } from './components/MatrixRain';

export default function App() {
  
  // Clean all default mock data on first load to provide real clean slate (Point 3)
  useEffect(() => {
    const isCleaned = localStorage.getItem('visioncore_clean_v5_wiped');
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
      localStorage.setItem('visioncore_clean_v5_wiped', 'true');
    }
  }, []);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('visioncore_dark_mode') || localStorage.getItem('cipher_dark_mode');
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

  // All Team Members List (Only single master creator initially)
  const [users, setUsers] = useState<User[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_users');
      return INITIAL_USERS;
    }
    const saved = localStorage.getItem('visioncore_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Client Orders (Empty)
  const [orders, setOrders] = useState<Order[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_orders');
      return [];
    }
    const saved = localStorage.getItem('visioncore_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Projects (Empty)
  const [projects, setProjects] = useState<Project[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_projects');
      return [];
    }
    const saved = localStorage.getItem('visioncore_projects');
    return saved ? JSON.parse(saved) : [];
  });

  // Chats (Empty)
  const [chats, setChats] = useState<ChatMessage[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_chats');
      return [];
    }
    const saved = localStorage.getItem('visioncore_chats');
    return saved ? JSON.parse(saved) : [];
  });

  // Tasks (Empty)
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_tasks');
      return [];
    }
    const saved = localStorage.getItem('visioncore_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Notes (Empty)
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_notes');
      return [];
    }
    const saved = localStorage.getItem('visioncore_notes');
    return saved ? JSON.parse(saved) : [];
  });

  // Version Plans (Empty)
  const [versionPlans, setVersionPlans] = useState<VersionPlan[]>(() => {
    return [];
  });

  // Test Reports (Empty)
  const [testReports, setTestReports] = useState<TestReport[]>(() => {
    return [];
  });

  // Architecture Docs (Empty)
  const [architectureDocs, setArchitectureDocs] = useState<ArchitectureDoc[]>(() => {
    return [];
  });

  // Reminders (Empty)
  const [reminders, setReminders] = useState<ReminderPlan[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_reminders');
      return [];
    }
    const saved = localStorage.getItem('visioncore_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  // Member Activities (Empty)
  const [activities, setActivities] = useState<MemberActivity[]>(() => {
    if (localStorage.getItem('visioncore_clean_v5_wiped') !== 'true') {
      localStorage.removeItem('visioncore_activities');
      return [];
    }
    const saved = localStorage.getItem('visioncore_activities');
    return saved ? JSON.parse(saved) : [];
  });

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('visioncore_site_settings');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'N1', message: 'VisionCore Group platformasiga muvaffaqiyatli kirdingiz.', read: false, time: 'Hozir' },
    { id: 'N2', message: 'Dasturiy xizmatlar va jamoaviy virtual ofis faol holatda.', read: false, time: '5m oldin' }
  ]);

  // Active Menu & Sidebar State
  const [activeMenu, setActiveMenu] = useState<string>('Bosh sahifa');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('visioncore_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('visioncore_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('visioncore_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('visioncore_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('visioncore_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('visioncore_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('visioncore_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('visioncore_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('visioncore_site_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('visioncore_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('visioncore_current_user');
    }
  }, [currentUser]);

  // Activity logger helper
  const logActivity = (action: string) => {
    if (!currentUser) return;
    const newAct: MemberActivity = {
      id: `ACT-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName || currentUser.username} ${currentUser.lastName || ''}`.trim(),
      userRole: currentUser.role,
      action,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveMenu('Bosh sahifa');
    logActivity('Tizimga muvaffaqiyatli kirdi');
  };

  const handleLogout = () => {
    logActivity('Tizimdan chiqdi');
    setCurrentUser(null);
  };

  const handleLanguageChange = (lang: Language) => {
    if (!currentUser) return;
    const updated = { ...currentUser, language: lang };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: newAvatarUrl };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
    logActivity('Shaxsiy profil rasmini yangiladi');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    logActivity('Shaxsiy profil ma\'lumotlarini saqladi');
  };

  // Orders Handlers
  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    logActivity(`Yangi loyiha buyurtmasi topshirdi: "${newOrder.projectName}"`);
    setNotifications(prev => [
      { id: `N-${Date.now()}`, message: `Yangi buyurtma keldi: "${newOrder.projectName}" (${newOrder.projectType})`, read: false, time: 'Hozir' },
      ...prev
    ]);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    logActivity(`"${updatedOrder.projectName}" buyurtmasi statusini yangiladi: ${updatedOrder.status}`);
  };

  // Members Handlers
  const handleAddMember = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    logActivity(`Yangi guruh a'zosi qo'shildi: "${newUser.username}" (${newUser.role})`);
    setNotifications(prev => [
      { id: `N-${Date.now()}`, message: `Yangi a'zo qo'shildi: ${newUser.firstName} (${newUser.role})`, read: false, time: 'Hozir' },
      ...prev
    ]);
  };

  const handleUpdateMember = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteMember = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity(`A'zo o'chirildi (ID: ${userId})`);
  };

  // Chat Handlers
  const handleSendMessage = (msg: ChatMessage) => {
    setChats(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const handleEditMessage = (msgId: string, newText: string) => {
    setChats(prev => prev.map(m => m.id === msgId ? { ...m, text: newText, isEdited: true } : m));
  };

  const handleDeleteMessage = (msgId: string) => {
    setChats(prev => prev.filter(m => m.id !== msgId));
  };

  // Project Handlers
  const handleAddProject = (proj: Project) => {
    setProjects(prev => [...prev, proj]);
    logActivity(`Yangi loyiha yaratildi: "${proj.name}"`);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  const handleDeleteProject = (projId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projId));
  };

  // Task Handlers
  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
    logActivity(`Yangi vazifa belgilandi: "${newTask.title}"`);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleToggleTask = (taskId: string, currentUserId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const next = !t.completed;
        if (next) logActivity(`"${t.title}" vazifasini bajardi`);
        return { ...t, completed: next };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Note Handlers
  const handleAddNote = (newNote: NoteItem) => {
    setNotes(prev => [newNote, ...prev]);
  };

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
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
  };

  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // Restore backup
  const handleRestoreBackup = (data: any) => {
    if (data.users) setUsers(data.users);
    if (data.orders) setOrders(data.orders);
    if (data.projects) setProjects(data.projects);
    if (data.tasks) setTasks(data.tasks);
    if (data.notes) setNotes(data.notes);
    if (data.siteSettings) setSiteSettings(data.siteSettings);
    logActivity("Zaxira nusxasi (Backup) tiklandi");
  };

  // If no user is logged in, show Saytlab-style high-converting Landing Page
  if (!currentUser) {
    return (
      <LandingPage 
        allUsers={users}
        onLoginSuccess={handleLoginSuccess}
        language="uz"
        siteSettings={siteSettings}
      />
    );
  }

  // Custom Background Check for Creator
  const isCreator = currentUser.role === 'creator';
  const showMatrixRain = isCreator && siteSettings.creatorBackgroundType === 'matrix';
  const customBgStyle = isCreator && siteSettings.creatorBackgroundType === 'custom_image' && siteSettings.creatorBackgroundImage
    ? { backgroundImage: `url(${siteSettings.creatorBackgroundImage})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }
    : undefined;

  return (
    <div 
      style={customBgStyle}
      className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-colors relative ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      
      {/* Optional Matrix Digital Rain for Creator (vivid crisp glowing green) */}
      {showMatrixRain && <MatrixRain opacity={0.70} color="#22c55e" />}

      {/* Top Header */}
      <Header 
        user={currentUser}
        activeMenu={activeMenu}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLanguageChange={handleLanguageChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigateMenu={setActiveMenu}
      />

      {/* Main Layout Container (Pinned sidebar on left, independent scroll on right) */}
      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          user={currentUser}
          activeMenu={activeMenu}
          onChangeMenu={setActiveMenu}
          onLogout={handleLogout}
          darkMode={darkMode}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          language={currentUser.language}
        />

        {/* Content Body View (Scrolls independently while Sidebar remains pinned) */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {activeMenu === 'Bosh sahifa' && (
            <UserDashboard 
              user={currentUser}
              notifications={notifications}
              reminders={reminders}
              orders={orders}
              projects={projects}
              tasks={tasks}
              siteSettings={siteSettings}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onNavigateMenu={setActiveMenu}
              darkMode={darkMode}
              language={currentUser.language}
            />
          )}

          {activeMenu === 'Mijoz Buyurtmalari' && (
            <OrdersManagementView 
              orders={orders}
              allUsers={users}
              currentUser={currentUser}
              onUpdateOrder={handleUpdateOrder}
              darkMode={darkMode}
              language={currentUser.language}
            />
          )}

          {activeMenu === 'A\'zolar' && (
            <MembersView 
              currentUser={currentUser}
              allUsers={users}
              activities={activities}
              tasks={tasks}
              orders={orders}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              darkMode={darkMode}
              language={currentUser.language}
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
              language={currentUser.language}
            />
          )}

          {activeMenu === 'Buyurtma berish' && (
            <OrderView 
              currentUser={currentUser}
              orders={orders}
              onSubmitOrder={handleAddOrder}
              darkMode={darkMode}
              language={currentUser.language}
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
              onUpdateUser={handleUpdateUser}
              onUpdateAvatar={handleUpdateAvatar}
              darkMode={darkMode}
              language={currentUser.language}
            />
          )}

          {activeMenu === 'Sozlamalar' && (
            <SettingsView 
              user={currentUser}
              onLanguageChange={handleLanguageChange}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              siteSettings={siteSettings}
              onUpdateSiteSettings={setSiteSettings}
              allUsers={users}
              orders={orders}
              projects={projects}
              tasks={tasks}
              notes={notes}
              onRestoreBackup={handleRestoreBackup}
            />
          )}

          {/* Specialist role views */}
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
              onSaveArchitecture={() => {}}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Test Natijalari' && (
            <TestReportsView 
              currentUser={currentUser}
              projects={projects}
              testReports={testReports}
              onAddReport={() => {}}
              onDeleteReport={() => {}}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Versiyalash & Rejalash' && (
            <VersionPlanningView 
              currentUser={currentUser}
              projects={projects}
              versionPlans={versionPlans}
              onSavePlan={() => {}}
              darkMode={darkMode}
            />
          )}
        </main>

      </div>

    </div>
  );
}
