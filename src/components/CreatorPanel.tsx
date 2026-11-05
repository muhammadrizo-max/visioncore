import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Users, 
  FolderGit2, 
  Search, 
  Cpu, 
  CheckSquare, 
  GitBranch, 
  FileSpreadsheet, 
  Key, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Database, 
  Server, 
  Globe, 
  ShieldAlert, 
  UserCheck, 
  ArrowRight,
  Download,
  Activity,
  ShoppingBag,
  ExternalLink,
  Phone,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal
} from 'lucide-react';
import { User, RoleType, Project, Task, TestReport, NoteItem, SiteSettings, Order, OrderStatus } from '../types';

interface CreatorPanelProps {
  currentUser: User;
  allUsers: User[];
  projects: Project[];
  tasks: Task[];
  testReports: TestReport[];
  notes: NoteItem[];
  orders: Order[];
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  onAddMember: (newUser: User) => void;
  onUpdateMember: (updatedUser: User) => void;
  onDeleteMember: (userId: string) => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  onSwitchUser?: (user: User) => void;
  onNavigateMenu: (menu: string) => void;
  darkMode: boolean;
}

export const CreatorPanel: React.FC<CreatorPanelProps> = ({
  currentUser,
  allUsers,
  projects,
  tasks,
  testReports,
  notes,
  orders,
  siteSettings,
  onUpdateSiteSettings,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onUpdateOrder,
  onSwitchUser,
  onNavigateMenu,
  darkMode
}) => {
  const [activeTab, setActiveTab] = useState<'quickPanels' | 'orders' | 'supabase' | 'members' | 'roleGuide' | 'settings'>('quickPanels');
  
  // New Member Modal / Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('user');
  const [newFirstName, setNewFirstName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [statusMsg, setStatusMsg] = useState('');

  // Edit Member State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<RoleType>('user');

  // Server & DB Status Check State
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Settings State
  const [siteName, setSiteName] = useState(siteSettings.siteName || 'VisionCore Group Workspace');
  const [telegramUsername, setTelegramUsername] = useState(siteSettings.telegramUsername || '@visioncore_admin');
  const [isPrivate, setIsPrivate] = useState(siteSettings.isPrivate ?? true);

  // Filter Order state
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [copiedSql, setCopiedSql] = useState(false);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const sRes = await fetch('/api/health');
      const sData = await sRes.json();
      setServerHealth(sData);

      const dRes = await fetch('/api/db/health');
      const dData = await dRes.json();
      setDbHealth(dData);
    } catch (e: any) {
      setServerHealth({ status: 'error', message: e?.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const generateCredentials = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = newRole === 'creator' ? 'creator' : newRole === 'engineer' ? 'eng' : newRole.substring(0, 3);
    setNewUsername(`vcg-${prefix}${randomNum}`);
    const randomPass = Math.random().toString(36).substring(2, 8);
    setNewPassword(`vcg_${randomPass}`);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setStatusMsg('Username va parolni kiriting!');
      return;
    }

    const finalUsername = (newUsername.toLowerCase().startsWith('vcg-') || newUsername.toLowerCase().startsWith('cipher-'))
      ? newUsername.toLowerCase()
      : `vcg-${newUsername.toLowerCase()}`;

    const finalPassword = newPassword.startsWith('vcg_') ? newPassword : `vcg_${newPassword}`;

    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const delimiter = Math.random() > 0.5 ? '-' : '_';
    const newId = `vcg${delimiter}${randomDigits}`;

    const newUser: User = {
      id: newId,
      username: finalUsername,
      password: finalPassword,
      firstName: newFirstName.trim() || "A'zo",
      lastName: `(${newRole.toUpperCase()})`,
      phone: '+998 90 000 00 00',
      email: `${finalUsername}@visioncore.group`,
      role: newRole,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${finalUsername}`,
      registeredAt: new Date().toISOString()
    };

    onAddMember(newUser);
    setStatusMsg(`A'zo muvaffaqiyatli yaratildi: "${finalUsername}"`);
    setNewUsername('');
    setNewPassword('');
    setNewFirstName('');
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditPassword(user.password || '');
    setEditRole(user.role);
  };

  const saveEdit = (user: User) => {
    const finalUsername = (editUsername.toLowerCase().startsWith('vcg-') || editUsername.toLowerCase().startsWith('cipher-'))
      ? editUsername.toLowerCase()
      : `vcg-${editUsername.toLowerCase()}`;
    const finalPassword = editPassword.startsWith('vcg_') ? editPassword : `vcg_${editPassword}`;

    const updated: User = {
      ...user,
      username: finalUsername,
      password: finalPassword,
      role: editRole
    };

    onUpdateMember(updated);
    setEditingUserId(null);
    setStatusMsg(`"${user.username}" ma'lumotlari yangilandi.`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings({
      ...siteSettings,
      siteName,
      telegramUsername,
      isPrivate
    });
    setStatusMsg("Workspace sozlamalari muvaffaqiyatli saqlandi!");
  };

  const handleOrderStatusChange = (order: Order, newStatus: OrderStatus) => {
    onUpdateOrder({
      ...order,
      status: newStatus
    });
    setStatusMsg(`"${order.projectName}" buyurtmasi statusi "${newStatus}"ga o'zgartirildi.`);
  };

  const exportWorkspaceJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      siteSettings,
      users: allUsers,
      projects,
      tasks,
      testReports,
      notes,
      orders
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visioncore_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedTasksCount = tasks.filter(t => t.completed).length;
  const passedTestsCount = testReports.filter(r => r.status === 'Passed').length;
  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === orderFilter);

  // Complete SQL Script for Supabase SQL Editor
  const supabaseSQLCode = `-- =========================================================
-- VISIONCORE GROUP PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- =========================================================
-- Ushbu SQL kodni Supabase boshqaruv panelidagi
-- "SQL Editor" bo'limiga nusxalab qo'ying va "Run" tugmasini bosing.
-- =========================================================

-- 1. UUID kengaytmasini faollashtirish
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FOYDALANUVCHILAR (USERS) JADVALI
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(12) PRIMARY KEY, -- Masalan: vcg-84920193 yoki vcg_84920193 (aniq 12 belgi)
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    first_name VARCHAR(100) DEFAULT '',
    last_name VARCHAR(100) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(150) DEFAULT '',
    telegram_username VARCHAR(100) DEFAULT '',
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- creator, engineer, researcher, designer, analyst, user
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    language VARCHAR(10) DEFAULT 'uz'
);

-- 3. MIJOZ BUYURTMALARI (ORDERS) JADVALI
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(50) PRIMARY KEY, -- Masalan: ORD-8492
    user_id VARCHAR(12) REFERENCES public.users(id) ON DELETE CASCADE,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_telegram VARCHAR(100) NOT NULL,
    project_type VARCHAR(50) NOT NULL, -- telegram_bot, web_app, website, mobile_app, crm, landing_page, other
    project_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(100),
    deadline VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_review, accepted, in_progress, completed, cancelled
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ISHCHI LOYIHALAR (PROJECTS) JADVALI
CREATE TABLE IF NOT EXISTS public.projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Planning', -- Planning, Designing, In Development, Testing, Completed
    version VARCHAR(50) DEFAULT 'v1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VAZIFALAR (TASKS) JADVALI
CREATE TABLE IF NOT EXISTS public.tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_by_id VARCHAR(12) REFERENCES public.users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(150),
    assigned_to_id VARCHAR(12) REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(150),
    date VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QAYDLAR (NOTES) JADVALI
CREATE TABLE IF NOT EXISTS public.notes (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_private BOOLEAN DEFAULT TRUE,
    author_id VARCHAR(12) REFERENCES public.users(id) ON DELETE CASCADE,
    author_name VARCHAR(150),
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHAT XABARLARI (CHATS) JADVALI
CREATE TABLE IF NOT EXISTS public.chats (
    id VARCHAR(50) PRIMARY KEY,
    sender_id VARCHAR(12) REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    chat_id VARCHAR(50) DEFAULT 'general',
    attachment_url TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VERSIYALASH VA REJALAR (VERSION_PLANS)
CREATE TABLE IF NOT EXISTS public.version_plans (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    next_step TEXT,
    technologies TEXT[],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TEST HISOBOTLARI (TEST_REPORTS)
CREATE TABLE IF NOT EXISTS public.test_reports (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    result VARCHAR(50) NOT NULL, -- Success, Failed
    error_title VARCHAR(255),
    severity VARCHAR(50), -- Low, Medium, High
    error_desc TEXT,
    notes TEXT,
    analyst_name VARCHAR(150),
    date VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) SOZLAMALARI
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 11. OCHIQ RUXSAT POLISLARI (Anon & Authenticated kirish uchun)
CREATE POLICY "Public users select" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public users insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public users update" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Public orders all" ON public.orders FOR ALL USING (true);
CREATE POLICY "Public projects all" ON public.projects FOR ALL USING (true);
CREATE POLICY "Public tasks all" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Public notes all" ON public.notes FOR ALL USING (true);
CREATE POLICY "Public chats all" ON public.chats FOR ALL USING (true);

-- 12. BOSHLANG'ICH CREATOR VA ADMIN HISOBINI YARATISH
INSERT INTO public.users (id, username, password, first_name, last_name, role, email)
VALUES 
('vcg-98102341', 'vcg-creator', 'vcg_mcc2ro', 'Muhammadrizo', '(Boshliq)', 'creator', 'creator@visioncore.group'),
('vcg_77192834', 'vcg-admin', 'vcg_mcc2ro', 'Bosh Muhandis', '(Admin)', 'engineer', 'admin@visioncore.group')
ON CONFLICT (id) DO NOTHING;
`;

  const copySupabaseSQL = () => {
    navigator.clipboard.writeText(supabaseSQLCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Executive Creator Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-300/30 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-amber-200">
              <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>VISIONCORE GROUP — BOSHLIQ (CREATOR) PANELI</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Boshqaruv va Nazorat Markazi
            </h1>
            <p className="text-xs lg:text-sm text-indigo-100 max-w-2xl leading-relaxed">
              Siz platformaning boshlig'i va egasi sifatida mijoz buyurtmalari, jamoa a'zolari, texnik panellar, ma'lumotlar bazasi (Supabase) va barcha jarayonlarni to'liq boshqarasiz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportWorkspaceJSON}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
              title="Barcha ma'lumotlarni zaxiralash (Backup)"
            >
              <Download className="w-4 h-4" />
              <span>Zaxira (Backup)</span>
            </button>
            <button
              onClick={checkHealth}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center space-x-2 shadow-lg active:scale-95 cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>{checkingHealth ? 'Tekshirilmoqda...' : 'Tizim Statusi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Status Notification Banner */}
      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-500 dark:text-blue-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Orders Card */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Buyurtmalar</span>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{orders.length} ta</div>
          <span className="text-[10px] text-amber-500 font-semibold">{orders.filter(o => o.status === 'pending').length} ta yangi kutilmoqda</span>
        </div>

        {/* Users Card */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Jami A'zolar</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{allUsers.length} ta</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{allUsers.filter(u => u.role === 'engineer' || u.role === 'creator').length} ta Admin / Muhandis</span>
        </div>

        {/* Projects Card */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-green-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Loyihalar</span>
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{projects.length} ta</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Faol jamoa loyihalari</span>
        </div>

        {/* Tasks Card */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Vazifalar</span>
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{completedTasksCount}/{tasks.length}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Bajarilgan topshiriqlar</span>
        </div>

        {/* Supabase / DB Health */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm col-span-2 sm:col-span-1`}>
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Database</span>
            <Database className="w-5 h-5" />
          </div>
          <div className="mt-2 text-sm font-bold text-emerald-500 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Supabase Ready</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">SQL Sxema tayyor</span>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('quickPanels')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'quickPanels'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Panellar Markazi</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/40'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Mijoz Buyurtmalari ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'supabase'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/40'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Supabase SQL Sxema</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'members'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Jamoa & Rollar ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roleGuide')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'roleGuide'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Kirish Login-Parollari</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/40'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Sayt Sozlamalari</span>
        </button>
      </div>

      {/* TAB 1: ALL PANELS QUICK SWITCHER */}
      {activeTab === 'quickPanels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Saytda Mavjud Barcha Ichki Panellar</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Siz Boshliq (Creator) sifatida istalgan texnik panelga to'g'ridan-to'g'ri o'tib ishlashingiz mumkin:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Panel 1: Mijoz Buyurtmalari */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">Mijoz Buyurtmalari</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Foydalanuvchilar yuborgan Telegram bot, veb ilova, websayt va CRM loyihalari buyurtmalarini ko'rib chiqish va statusini boshqarish.
                </p>
                <div className="text-[11px] text-blue-500 font-mono">Mas'ul rol: Creator / Boshliq</div>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Buyurtmalarga O'tish ({orders.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 2: Supabase Sxema */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition">Supabase SQL Sxemasi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Supabase SQL Editor uchun to'liq jadval, ustun, foreign key va RLS xavfsizlik qoidalariga ega SQL skript.
                </p>
                <div className="text-[11px] text-emerald-500 font-mono">Supabase PostgreSQL 15+</div>
              </div>
              <button
                onClick={() => setActiveTab('supabase')}
                className="w-full py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>SQL Sxemani Ko'rish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 3: Muhandis (Loyihalar) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-bold">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition">Loyihalar Paneli</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Barcha texnik loyihalarni yaratish, versiyalarini boshqarish va jamoa a'zolariga biriktirish.
                </p>
                <div className="text-[11px] text-indigo-500 font-mono">Mas'ul rol: Engineer / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Loyihalar')}
                className="w-full py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Loyihalarga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 4: Tadqiqotchi (Aqlli Qidiruv) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-teal-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-600/10 text-teal-500 flex items-center justify-center font-bold">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition">Aqlli Qidiruv (AI Research)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gemini, Tavily, SerpAPI, Exa AI va Firecrawl yordamida chuqur ilmiy va texnik tahlil vositasi.
                </p>
                <div className="text-[11px] text-teal-500 font-mono">Mas'ul rol: Researcher / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Aqlli qidiruv')}
                className="w-full py-2.5 rounded-xl bg-teal-600/10 hover:bg-teal-600 text-teal-600 dark:text-teal-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Aqlli Qidiruvga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 5: Dizayner (Loyiha Arxitekturasi) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-purple-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-500 flex items-center justify-center font-bold">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-500 transition">Loyiha Arxitekturasi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tizim sxemalari, database tuzilmasi, interfeys chizmalari va Word (.doc) texnik hujjat yuklash.
                </p>
                <div className="text-[11px] text-purple-500 font-mono">Mas'ul rol: Designer / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Loyiha arxitekturasi')}
                className="w-full py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 text-purple-600 dark:text-purple-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Arxitekturaga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 6: Test Natijalari */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-rose-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-500 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition">Test Natijalari (QA)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Xatoliklar (Bugs), test hisobotlari, holat (Passed/Failed) va daraja (Severity) bo'yicha tahlillar.
                </p>
                <div className="text-[11px] text-rose-500 font-mono">Mas'ul rol: Analyst / QA / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Test Natijalari')}
                className="w-full py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Testlarga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: CLIENT ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
                <span>Mijozlardan Kelgan Buyurtmalar Boshqaruvi</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Foydalanuvchilar qoldirgan barcha buyurtmalar, ularning aloqa ma'lumotlari va statusi:
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {['all', 'pending', 'in_review', 'accepted', 'in_progress', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                    orderFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {st === 'all' ? 'Barchasi' : st}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-2`}>
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Buyurtmalar topilmadi</h3>
              <p className="text-xs text-slate-500">Ushbu filtr bo'yicha buyurtmalar mavjud emas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => {
                const tgClean = order.clientTelegram.replace(/^@/, '');
                return (
                  <div
                    key={order.id}
                    className={`p-6 rounded-3xl border ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    } shadow-sm space-y-4`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                            {order.id}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {order.projectName}
                          </h3>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                            {order.projectType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3">
                          <span>Buyurtmachi: <strong className="text-slate-800 dark:text-slate-200">{order.clientName}</strong></span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</span>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order, e.target.value as OrderStatus)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                            order.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : order.status === 'in_progress'
                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                              : order.status === 'accepted'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              : order.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                          }`}
                        >
                          <option value="pending">Kutilmoqda (pending)</option>
                          <option value="in_review">Ko'rib chiqilmoqda (in_review)</option>
                          <option value="accepted">Qabul qilindi (accepted)</option>
                          <option value="in_progress">Jarayonda (in_progress)</option>
                          <option value="completed">Yakunlandi (completed)</option>
                          <option value="cancelled">Bekor qilindi (cancelled)</option>
                        </select>
                      </div>
                    </div>

                    {/* Order description */}
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      {order.description}
                    </div>

                    {/* Details & Contacts */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        {order.budget && (
                          <span>Taxminiy Byudjet: <strong className="text-slate-800 dark:text-slate-200">{order.budget}</strong></span>
                        )}
                        {order.deadline && (
                          <span>Muddat: <strong className="text-slate-800 dark:text-slate-200">{order.deadline}</strong></span>
                        )}
                        <span>User ID: <strong className="font-mono text-blue-500">{order.userId}</strong></span>
                      </div>

                      {/* Direct contact action buttons */}
                      <div className="flex items-center space-x-2">
                        {order.clientPhone && (
                          <a
                            href={`tel:${order.clientPhone}`}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white font-bold text-xs transition flex items-center space-x-1.5"
                            title="Telefon qilish"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{order.clientPhone}</span>
                          </a>
                        )}

                        {order.clientTelegram && (
                          <a
                            href={`https://t.me/${tgClean}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white font-bold text-xs transition flex items-center space-x-1.5"
                            title="Telegramda yozish"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>@{tgClean}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPABASE SQL SCHEMA GENERATOR */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                  <Database className="w-4 h-4" />
                  <span>SUPABASE POSTGRESQL TAYYOR SXEMA</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Supabase SQL Editor uchun Kod va Jadvallar Tuzilmasi
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Sizdagi tayyor Supabase kalitlari bilan ishlash uchun quyidagi SQL kodni Supabase boshqaruv panelidagi <strong>SQL Editor</strong> bo'limiga qo'yib <strong>Run</strong> tugmasini bossangiz, barcha jadvallar, munosabatlar va xavfsizlik (RLS) qoidalari avtomatik yaratiladi.
                </p>
              </div>

              <button
                type="button"
                onClick={copySupabaseSQL}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg flex items-center space-x-2 self-start active:scale-95 cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'SQL Nusxalandi!' : 'Barcha SQL Kodni Nusxalash'}</span>
              </button>
            </div>

            {/* Quick summary of created tables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Jadval 1</span>
                <div className="text-xs font-bold text-emerald-400 font-mono">public.users</div>
                <span className="text-[9px] text-slate-500">12-char ID, Rollar</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Jadval 2</span>
                <div className="text-xs font-bold text-blue-400 font-mono">public.orders</div>
                <span className="text-[9px] text-slate-500">Mijoz buyurtmalari</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Jadval 3</span>
                <div className="text-xs font-bold text-indigo-400 font-mono">public.projects</div>
                <span className="text-[9px] text-slate-500">Loyiha & Versiyalar</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Jadval 4</span>
                <div className="text-xs font-bold text-amber-400 font-mono">public.tasks</div>
                <span className="text-[9px] text-slate-500">Vazifalar & Status</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Jadval 5</span>
                <div className="text-xs font-bold text-purple-400 font-mono">public.notes</div>
                <span className="text-[9px] text-slate-500">Shaxsiy & Umumiy</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Jadval 6</span>
                <div className="text-xs font-bold text-rose-400 font-mono">public.chats</div>
                <span className="text-[9px] text-slate-500">Real-time xabarlar</span>
              </div>
            </div>

            {/* SQL Code View Area */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-slate-300">visioncore_supabase_schema.sql</span>
                </div>
                <button
                  onClick={copySupabaseSQL}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Nusxalandi' : 'Nusxalash'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
                {supabaseSQLCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEAM & ROLE MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          
          {/* Quick Create Member Form */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span>Yangi A'zo yoki Admin Qo'shish</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Yangi a'zoning rolini belgilang va parolini o'rnating</p>
              </div>
              <button
                type="button"
                onClick={generateCredentials}
                className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-300 hover:text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Avto-Generatsiya</span>
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <input 
                type="text"
                placeholder="Ismi (ixtiyoriy)"
                value={newFirstName}
                onChange={e => setNewFirstName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />

              <input 
                type="text"
                required
                placeholder="Username (masalan: vcg-ali01)"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />

              <input 
                type="text"
                required
                placeholder="Parol (masalan: vcg_pass12)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />

              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as RoleType)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="creator">Creator (Boshliq)</option>
                <option value="engineer">Engineer (Bosh Muhandis)</option>
                <option value="researcher">Researcher (Tadqiqotchi)</option>
                <option value="designer">Designer (Dizayner)</option>
                <option value="analyst">Analyst (Tahlilchi)</option>
                <option value="user">User (Oddiy a'zo)</option>
              </select>

              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
              >
                + A'zo Yaratish
              </button>
            </form>
          </div>

          {/* Members Table */}
          <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Barcha Guruh A'zolari Ro'yxati</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Jami {allUsers.length} ta foydalanuvchi tizimda ro'yxatdan o'tgan</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700/50">
                    <th className="p-4">Foydalanuvchi</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Parol</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {allUsers.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const isVisible = showPasswords[u.id];

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        {/* Avatar & Name */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img src={u.avatar} alt={u.firstName} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span>{u.firstName || "Nomsiz"} {u.lastName}</span>
                                {u.role === 'creator' && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="p-4">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editUsername}
                              onChange={e => setEditUsername(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-mono text-slate-900 dark:text-white"
                            />
                          ) : (
                            <div className="flex items-center space-x-1.5 font-mono text-slate-700 dark:text-slate-300">
                              <span>{u.username}</span>
                              <button
                                onClick={() => handleCopy(u.username, `u-${u.id}`)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                title="Nusxalash"
                              >
                                {copiedId === `u-${u.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Password */}
                        <td className="p-4">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editPassword}
                              onChange={e => setEditPassword(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-mono text-slate-900 dark:text-white"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 font-mono text-slate-700 dark:text-slate-300">
                              <span>{isVisible ? u.password : '••••••••'}</span>
                              <button
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                              >
                                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              {u.password && (
                                <button
                                  onClick={() => handleCopy(u.password || '', `p-${u.id}`)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                  title="Parolni nusxalash"
                                >
                                  {copiedId === `p-${u.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Role */}
                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value as RoleType)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white"
                            >
                              <option value="creator">Creator</option>
                              <option value="engineer">Engineer</option>
                              <option value="researcher">Researcher</option>
                              <option value="designer">Designer</option>
                              <option value="analyst">Analyst</option>
                              <option value="user">User</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              u.role === 'creator'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : u.role === 'engineer'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : u.role === 'researcher'
                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                                : u.role === 'designer'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                : u.role === 'analyst'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : 'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(u)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  Saqlash
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-300 text-[11px] cursor-pointer"
                                >
                                  Bekor
                                </button>
                              </>
                            ) : (
                              <>
                                {onSwitchUser && (
                                  <button
                                    onClick={() => onSwitchUser(u)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white font-bold text-[11px] transition cursor-pointer"
                                    title="Ushbu a'zo nomidan saytni ko'rish (Test)"
                                  >
                                    Sinab ko'rish
                                  </button>
                                )}
                                <button
                                  onClick={() => startEdit(u)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Tahrirlash"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {allUsers.length > 1 && u.id !== currentUser.id && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Rostdan ham "${u.username}" foydalanuvchisini o'chirmoqchimisiz?`)) {
                                        onDeleteMember(u.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                    title="O'chirish"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ROLES & CREDENTIALS GUIDE */}
      {activeTab === 'roleGuide' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-500" />
              <span>Barcha Rollar va Ularning Maxsus Kirish Ma'lumotlari</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Platforma a'zolari turli darajadagi huquqlarga ega. Quyida har bir rolning vazifasi va test qilish uchun tayyor hisoblar keltirilgan:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              
              {/* Creator Card */}
              <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/30 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase">
                    CREATOR (Boshliq)
                  </span>
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Guruh va Sayt Boshlig'i</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Barcha panellar, buyurtmalar, a'zolarni to'liq boshqarish va Supabase SQL sxemasi.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-amber-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-amber-600 dark:text-amber-400">vcg-creator</strong></div>
                  <div>Parol: <strong className="text-slate-800 dark:text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Engineer Card */}
              <div className="p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-950/30 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-extrabold uppercase">
                    ENGINEER (Muhandis)
                  </span>
                  <FolderGit2 className="w-4 h-4 text-blue-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bosh Muhandis</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Loyihalar yaratish, yangi versiyalarni belgilash, yangi a'zolar qo'shish va ro'yxatdan o'tkazish.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-blue-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-blue-600 dark:text-blue-400">vcg-admin</strong></div>
                  <div>Parol: <strong className="text-slate-800 dark:text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Researcher Card */}
              <div className="p-5 rounded-2xl bg-teal-500/5 dark:bg-teal-950/30 border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-extrabold uppercase">
                    RESEARCHER (Tadqiqotchi)
                  </span>
                  <Search className="w-4 h-4 text-teal-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Tadqiqotchi</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Gemini, Tavily, SerpAPI, Exa va Firecrawl bilan aqlli qidiruv va chuqur texnik tahlillar paneli.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-teal-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-teal-600 dark:text-teal-400">vcg-researcher</strong></div>
                  <div>Parol: <strong className="text-slate-800 dark:text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Designer Card */}
              <div className="p-5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/30 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-extrabold uppercase">
                    DESIGNER (Dizayner)
                  </span>
                  <Cpu className="w-4 h-4 text-purple-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Arxitektor & Dizayner</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Loyiha arxitekturasi, ERD sxemasi, texnik specifikatsiyalar va Word (.doc) yuklab olish.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-purple-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-purple-600 dark:text-purple-400">vcg-designer</strong></div>
                  <div>Parol: <strong className="text-slate-800 dark:text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Analyst Card */}
              <div className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/30 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase">
                    ANALYST (Tahlilchi)
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-rose-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tizim Tahlilchisi & QA</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Test sinovlari hisoboti, xatoliklar darajasini belgilash (Passed/Failed) va versiya rejalashtirish.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-rose-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-rose-600 dark:text-rose-400">vcg-analyst</strong></div>
                  <div>Parol: <strong className="text-slate-800 dark:text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Member Card */}
              <div className="p-5 rounded-2xl bg-slate-500/5 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-600 text-white text-[10px] font-extrabold uppercase">
                    USER (Oddiy a'zo / Mijoz)
                  </span>
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tashrif buyuruvchi / Mijoz</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Loyiha buyurtma berish, shaxsiy va umumiy chat, qaydlar (notes), shaxsiy profil.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-slate-700 dark:text-slate-300">vcg-user</strong></div>
                  <div>Parol: <strong className="text-slate-800 dark:text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 6: WORKSPACE & SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                <span>Global Workspace Sozlamalari</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guruh nomi, telegram yordamchi va maxfiylik sozlamalarini boshqaring
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Platforma Nomi</label>
                <input 
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telegram Admin / Support</label>
                <input 
                  type="text"
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Yopiq / Maxfiy Ofis Rejimi (Private Mode)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Faqatgina ro'yxatdan o'tgan yoki muhandis tomonidan tasdiqlangan a'zolar kira oladi
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
              >
                Sozlamalarni Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
