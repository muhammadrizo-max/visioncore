import React, { useState, useEffect } from 'react';
import { 
  User, Project, ChatMessage, Task, NoteItem, VersionPlan, 
  TestReport, ArchitectureDoc, ReminderPlan, NotificationItem, Language, SiteSettings, Order 
} from './types';
import { 
  INITIAL_USERS, INITIAL_PROJECTS, INITIAL_CHATS, INITIAL_TASKS, 
  INITIAL_NOTES, INITIAL_VERSION_PLANS, INITIAL_TEST_REPORTS, 
  INITIAL_ARCHITECTURE_DOCS, INITIAL_REMINDERS, INITIAL_SITE_SETTINGS, INITIAL_ORDERS 
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
import { CreatorPanel } from './components/CreatorPanel';
import { OrderView } from './components/OrderView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('visioncore_dark_mode') || localStorage.getItem('cipher_dark_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('visioncore_dark_mode', JSON.stringify(darkMode));
    localStorage.setItem('cipher_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync Engineer credentials from backend .env config
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.engineerUsername && data.engineerPassword) {
          setUsers(prev => {
            const exists = prev.some(u => u && u.username && u.username.toLowerCase() === data.engineerUsername.toLowerCase());
            if (!exists) {
              const engUser: User = {
                id: 'vcg-88192014',
                username: data.engineerUsername,
                password: data.engineerPassword,
                firstName: 'Bosh Muhandis',
                lastName: '(Admin)',
                phone: '+998 90 000 00 00',
                email: `${data.engineerUsername}@visioncore.group`,
                role: 'engineer',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                registeredAt: new Date().toISOString(),
                language: 'uz'
              };
              return [engUser, ...prev];
            }
            return prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Current User Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('visioncore_current_user') || localStorage.getItem('cipher_v4_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // All Team Members List
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('visioncore_users') || localStorage.getItem('cipher_v4_users');
    const parsed: User[] = saved ? JSON.parse(saved) : [];
    
    const merged = [...parsed];
    for (const initUser of INITIAL_USERS) {
      if (!merged.some(u => u && u.username && typeof u.username === 'string' && u.username.toLowerCase() === initUser.username.toLowerCase())) {
        merged.unshift(initUser);
      }
    }
    return merged.length > 0 ? merged : INITIAL_USERS;
  });

  // Client Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('visioncore_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Projects
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('visioncore_projects') || localStorage.getItem('cipher_v4_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  // Chats
  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('visioncore_chats') || localStorage.getItem('cipher_v4_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  // Tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('visioncore_tasks') || localStorage.getItem('cipher_v4_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // Notes
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('visioncore_notes') || localStorage.getItem('cipher_v4_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  // Version Plans
  const [versionPlans, setVersionPlans] = useState<VersionPlan[]>(() => {
    const saved = localStorage.getItem('visioncore_version_plans') || localStorage.getItem('cipher_v4_version_plans');
    return saved ? JSON.parse(saved) : INITIAL_VERSION_PLANS;
  });

  // Test Reports
  const [testReports, setTestReports] = useState<TestReport[]>(() => {
    const saved = localStorage.getItem('visioncore_test_reports') || localStorage.getItem('cipher_v4_test_reports');
    return saved ? JSON.parse(saved) : INITIAL_TEST_REPORTS;
  });

  // Architecture Docs
  const [architectureDocs, setArchitectureDocs] = useState<ArchitectureDoc[]>(() => {
    const saved = localStorage.getItem('visioncore_architecture_docs') || localStorage.getItem('cipher_v4_architecture_docs');
    return saved ? JSON.parse(saved) : INITIAL_ARCHITECTURE_DOCS;
  });

  // Reminders
  const [reminders, setReminders] = useState<ReminderPlan[]>(() => {
    const saved = localStorage.getItem('visioncore_reminders') || localStorage.getItem('cipher_v4_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('visioncore_site_settings') || localStorage.getItem('cipher_v4_site_settings');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'N1', message: 'VisionCore Group Workspace tizimiga muvaffaqiyatli kirdingiz.', read: false, time: 'Hozir' },
    { id: 'N2', message: 'Dasturiy ta\'minot va bot buyurtmalari uchun "Buyurtma berish" bo\'limi faol.', read: false, time: '5m oldin' }
  ]);

  // Active Menu & Sidebar State (Opens by default, collapses when shield / < is clicked)
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
    localStorage.setItem('visioncore_version_plans', JSON.stringify(versionPlans));
  }, [versionPlans]);

  useEffect(() => {
    localStorage.setItem('visioncore_test_reports', JSON.stringify(testReports));
  }, [testReports]);

  useEffect(() => {
    localStorage.setItem('visioncore_architecture_docs', JSON.stringify(architectureDocs));
  }, [architectureDocs]);

  useEffect(() => {
    localStorage.setItem('visioncore_reminders', JSON.stringify(reminders));
  }, [reminders]);

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

  // Login Handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveMenu('Bosh sahifa');
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Language change handler
  const handleLanguageChange = (lang: Language) => {
    if (!currentUser) return;
    const updated = { ...currentUser, language: lang };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  // Profile Avatar update handler
  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: newAvatarUrl };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  // User Profile update handler
  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setNotifications(prev => [
      { id: `N-${Date.now()}`, message: 'Profil ma\'lumotlaringiz yangilandi.', read: false, time: 'Hozir' },
      ...prev
    ]);
  };

  // Order Handlers
  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    setNotifications(prev => [
      { id: `N-${Date.now()}`, message: `Yangi buyurtma qabul qilindi: "${newOrder.projectName}" (${newOrder.projectType})`, read: false, time: 'Hozir' },
      ...prev
    ]);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  // Member management handlers
  const handleAddMember = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    setNotifications(prev => [
      { id: `N-${Date.now()}`, message: `Yangi a'zo "${newUser.firstName}" (${newUser.role}) qo'shildi.`, read: false, time: 'Hozir' },
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
  };

  // Chat Handlers
  const handleSendMessage = (msg: ChatMessage) => {
    setChats(prev => [...prev, msg]);
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
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleToggleTask = (taskId: string, currentUserId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.assignedToId === currentUserId) {
        return { ...t, completed: !t.completed };
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

  // Version Plan Handler
  const handleSavePlan = (plan: VersionPlan) => {
    setVersionPlans(prev => {
      const idx = prev.findIndex(p => p.projectId === plan.projectId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = plan;
        return copy;
      }
      return [...prev, plan];
    });
  };

  // Test Report Handler
  const handleAddReport = (report: TestReport) => {
    setTestReports(prev => [report, ...prev]);
  };

  const handleDeleteReport = (reportId: string) => {
    setTestReports(prev => prev.filter(r => r.id !== reportId));
  };

  // Architecture Doc Handler
  const handleSaveArchitecture = (doc: ArchitectureDoc) => {
    setArchitectureDocs(prev => {
      const idx = prev.findIndex(a => a.projectId === doc.projectId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = doc;
        return copy;
      }
      return [...prev, doc];
    });
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

  // If no logged in user, render LandingPage login card
  if (!currentUser) {
    return (
      <LandingPage 
        allUsers={users}
        onLoginSuccess={handleLoginSuccess}
        language="uz"
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
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

      {/* Main Layout */}
      <div className="flex-grow flex overflow-hidden relative">
        
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

        {/* Content Body View */}
        <main className="flex-grow overflow-y-auto">
          {activeMenu === 'Bosh sahifa' && (
            <UserDashboard 
              user={currentUser}
              notifications={notifications}
              reminders={reminders}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onNavigateMenu={setActiveMenu}
              darkMode={darkMode}
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

          {(activeMenu === 'Buyurtma berish' || activeMenu === 'Buyurtmalar') && (
            <OrderView 
              currentUser={currentUser}
              orders={orders}
              onSubmitOrder={handleAddOrder}
              darkMode={darkMode}
              language={currentUser.language}
            />
          )}

          {activeMenu === 'Creator Panel' && (
            <CreatorPanel 
              currentUser={currentUser}
              allUsers={users}
              projects={projects}
              tasks={tasks}
              testReports={testReports}
              notes={notes}
              orders={orders}
              siteSettings={siteSettings}
              onUpdateSiteSettings={setSiteSettings}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onUpdateOrder={handleUpdateOrder}
              onSwitchUser={(user) => setCurrentUser(user)}
              onNavigateMenu={(menu) => setActiveMenu(menu)}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Aqlli qidiruv' && (
            <ResearcherPanel 
              currentUser={currentUser}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'A\'zo qo\'shish' && (
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
              activeTab="addMember"
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

          {activeMenu === 'Loyiha arxitekturasi' && (
            <DesignerPanel 
              currentUser={currentUser}
              projects={projects}
              architectureDocs={architectureDocs}
              onSaveArchitecture={handleSaveArchitecture}
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

          {activeMenu === 'Versiyalash & Rejalash' && (
            <VersionPlanningView 
              currentUser={currentUser}
              projects={projects}
              versionPlans={versionPlans}
              onSavePlan={handleSavePlan}
              darkMode={darkMode}
            />
          )}

          {activeMenu === 'Test Natijalari' && (
            <TestReportsView 
              currentUser={currentUser}
              projects={projects}
              testReports={testReports}
              onAddReport={handleAddReport}
              onDeleteReport={handleDeleteReport}
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
            />
          )}
        </main>

      </div>

    </div>
  );
}
