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
  Activity
} from 'lucide-react';
import { User, RoleType, Project, Task, TestReport, NoteItem, SiteSettings } from '../types';

interface CreatorPanelProps {
  currentUser: User;
  allUsers: User[];
  projects: Project[];
  tasks: Task[];
  testReports: TestReport[];
  notes: NoteItem[];
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  onAddMember: (newUser: User) => void;
  onUpdateMember: (updatedUser: User) => void;
  onDeleteMember: (userId: string) => void;
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
  siteSettings,
  onUpdateSiteSettings,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onSwitchUser,
  onNavigateMenu,
  darkMode
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'quickPanels' | 'settings' | 'roleGuide'>('quickPanels');
  
  // New Member Modal / Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('engineer');
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

    const newUser: User = {
      id: `VCG-${Math.floor(10000 + Math.random() * 90000)}`,
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

  const exportWorkspaceJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      siteSettings,
      users: allUsers,
      projects,
      tasks,
      testReports,
      notes
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Executive Creator Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-indigo-700 to-purple-800 p-8 text-white shadow-2xl border border-amber-500/30">
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
              Siz platformaning asosiy boshlig'i va loyiha egasi sifatida barcha panellar, foydalanuvchilar, loyihalar va rollarga to'liq kirish huquqiga egasiz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportWorkspaceJSON}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center space-x-2"
              title="Barcha ma'lumotlarni zaxiralash (Backup)"
            >
              <Download className="w-4 h-4" />
              <span>Zaxira (Backup)</span>
            </button>
            <button
              onClick={checkHealth}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center space-x-2 shadow-lg active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span>{checkingHealth ? 'Tekshirilmoqda...' : 'Tizim Statusi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Status Notification Banner */}
      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-slate-400 hover:text-white text-xs font-bold">×</button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-xs font-bold text-slate-400 uppercase">Jami A'zolar</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black">{allUsers.length} ta</div>
          <span className="text-[10px] text-slate-400">{allUsers.filter(u => u.role === 'engineer' || u.role === 'creator').length} ta Admin / Muhandis</span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-xs font-bold text-slate-400 uppercase">Loyihalar</span>
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black">{projects.length} ta</div>
          <span className="text-[10px] text-slate-400">Faol ishchi loyihalar</span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-green-500">
            <span className="text-xs font-bold text-slate-400 uppercase">Vazifalar</span>
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black">{completedTasksCount}/{tasks.length}</div>
          <span className="text-[10px] text-slate-400">Bajarilgan topshiriqlar</span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-bold text-slate-400 uppercase">Testlar</span>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="mt-2 text-2xl font-black">{passedTestsCount}/{testReports.length}</div>
          <span className="text-[10px] text-slate-400">Muvaffaqiyatli testlar</span>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm col-span-2 sm:col-span-1`}>
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-xs font-bold text-slate-400 uppercase">Server Holati</span>
            <Server className="w-5 h-5" />
          </div>
          <div className="mt-2 text-sm font-bold text-green-400 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span>{serverHealth?.status === 'ok' ? 'Online (3000)' : 'Aktiv'}</span>
          </div>
          <span className="text-[10px] text-slate-400">{dbHealth?.connected ? 'PostgreSQL Ulandi' : 'Lokal rejim'}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('quickPanels')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
            activeTab === 'quickPanels'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Barcha Panellarga Tezkor Kirish</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
            activeTab === 'members'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Jamoa & Rollarni Boshqarish ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roleGuide')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
            activeTab === 'roleGuide'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Rollar & Kirish Login-Parollari</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
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
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Saytda Mavjud Barcha Panellar</span>
              </h2>
              <p className="text-xs text-slate-400">
                Siz Boshliq (Creator) sifatida istalgan panelga to'g'ridan-to'g'ri o'tib ishlashingiz mumkin:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Panel 1: Muhandis (Loyihalar) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">Loyihalar Paneli</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Barcha loyihalarni yaratish, versiyalarini boshqarish, statuslarni yangilash va bosh muhandislik nazorati.
                </p>
                <div className="text-[11px] text-blue-400 font-mono">Mas'ul rol: Engineer / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Loyihalar')}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <span>Loyihalarga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 2: A'zo Qo'shish */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition">A'zolar Paneli</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Yangi a'zolar uchun standart prefiksli login va parol generatsiya qilish hamda guruh a'zolarini ro'yxatga olish.
                </p>
                <div className="text-[11px] text-indigo-400 font-mono">Mas'ul rol: Engineer / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('A\'zo qo\'shish')}
                className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <span>A'zolarga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 3: Tadqiqotchi (Aqlli Qidiruv) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">Aqlli Qidiruv (AI Deep Research)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Google Gemini 2.5, Tavily, SerpAPI, Exa AI va Firecrawl yordamida chuqur ilmiy va texnik tahlil paneli.
                </p>
                <div className="text-[11px] text-emerald-400 font-mono">Mas'ul rol: Researcher / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Aqlli qidiruv')}
                className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <span>Aqlli Qidiruvga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 4: Dizayner (Loyiha Arxitekturasi) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-purple-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-500 flex items-center justify-center font-bold">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition">Loyiha Arxitekturasi</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tizim sxemalari, database tuzilmasi, UI/UX diagrammalari va texnik hujjatlarni Word (.doc) da yuklab olish.
                </p>
                <div className="text-[11px] text-purple-400 font-mono">Mas'ul rol: Designer / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Loyiha arxitekturasi')}
                className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <span>Arxitekturaga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 5: Versiyalash & Rejalash */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-500 flex items-center justify-center font-bold">
                  <GitBranch className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">Versiyalash & Rejalash</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chiqarilish versiyalari (v1.0, v2.0), roadmap, yangi xususiyatlar va reliz rejalari.
                </p>
                <div className="text-[11px] text-amber-400 font-mono">Mas'ul rol: Barcha a'zolar</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Versiyalash & Rejalash')}
                className="w-full py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <span>Rejalashga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel 6: Test Natijalari */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-4 hover:border-rose-500/50 transition shadow-sm group`}>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-500 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition">Test Natijalari (QA)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Xatoliklar (Bugs), test hisobotlari, holat (Passed/Failed) va daraja (Severity) bo'yicha tahlillar.
                </p>
                <div className="text-[11px] text-rose-400 font-mono">Mas'ul rol: Analyst / QA / Creator</div>
              </div>
              <button
                onClick={() => onNavigateMenu('Test Natijalari')}
                className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <span>Testlarga O'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: TEAM & ROLE MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          
          {/* Quick Create Member Form */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>Yangi A'zo yoki Admin Qo'shish</span>
                </h3>
                <p className="text-xs text-slate-400">Yangi a'zoning rolini belgilang va parolini o'rnating</p>
              </div>
              <button
                type="button"
                onClick={generateCredentials}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold transition flex items-center space-x-1"
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
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
              />

              <input 
                type="text"
                required
                placeholder="Username (masalan: vcg-ali01)"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />

              <input 
                type="text"
                required
                placeholder="Parol (masalan: vcg_pass12)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />

              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as RoleType)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
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
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md active:scale-95"
              >
                + A'zo Yaratish
              </button>
            </form>
          </div>

          {/* Members Table */}
          <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Barcha Guruh A'zolari Ro'yxati</h3>
                <p className="text-xs text-slate-400">Jami {allUsers.length} ta foydalanuvchi tizimda ro'yxatdan o'tgan</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/50">
                    <th className="p-4">Foydalanuvchi</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Parol</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {allUsers.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const isVisible = showPasswords[u.id];

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition">
                        {/* Avatar & Name */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img src={u.avatar} alt={u.firstName} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                            <div>
                              <div className="font-bold text-white flex items-center space-x-1.5">
                                <span>{u.firstName || "Nomsiz"} {u.lastName}</span>
                                {u.role === 'creator' && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
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
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs font-mono text-white"
                            />
                          ) : (
                            <div className="flex items-center space-x-1.5 font-mono text-slate-300">
                              <span>{u.username}</span>
                              <button
                                onClick={() => handleCopy(u.username, `u-${u.id}`)}
                                className="p-1 text-slate-500 hover:text-white"
                                title="Nusxalash"
                              >
                                {copiedId === `u-${u.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
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
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs font-mono text-white"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 font-mono text-slate-300">
                              <span>{isVisible ? u.password : '••••••••'}</span>
                              <button
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="p-1 text-slate-500 hover:text-white"
                              >
                                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              {u.password && (
                                <button
                                  onClick={() => handleCopy(u.password || '', `p-${u.id}`)}
                                  className="p-1 text-slate-500 hover:text-white"
                                  title="Parolni nusxalash"
                                >
                                  {copiedId === `p-${u.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
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
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs font-bold text-white"
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
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : u.role === 'engineer'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : u.role === 'researcher'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : u.role === 'designer'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : u.role === 'analyst'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-slate-700/50 text-slate-300 border-slate-600'
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
                                  className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-[11px]"
                                >
                                  Saqlash
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px]"
                                >
                                  Bekor
                                </button>
                              </>
                            ) : (
                              <>
                                {onSwitchUser && (
                                  <button
                                    onClick={() => onSwitchUser(u)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-[11px] transition"
                                    title="Ushbu a'zo nomidan saytni ko'rish (Test)"
                                  >
                                    Sinab ko'rish
                                  </button>
                                )}
                                <button
                                  onClick={() => startEdit(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
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

      {/* TAB 3: ROLES & CREDENTIALS GUIDE */}
      {activeTab === 'roleGuide' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Barcha Rollar va Ularning Maxsus Kirish Ma'lumotlari</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platforma a'zolari turli darajadagi huquqlarga ega. Quyida har bir rolning vazifasi va test qilish uchun tayyor hisoblar keltirilgan:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              
              {/* Creator Card */}
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase">
                    CREATOR (Boshliq)
                  </span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Guruh va Sayt Boshlig'i</h4>
                <p className="text-[11px] text-slate-300">
                  Barcha panellar (Muhandis, Tadqiqotchi, Dizayner, Tahlilchi), a'zolarni to'liq boshqarish va sayt sozlamalari.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-amber-300">vcg-creator</strong></div>
                  <div>Parol: <strong className="text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Engineer Card */}
              <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-extrabold uppercase">
                    ENGINEER (Muhandis)
                  </span>
                  <FolderGit2 className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Bosh Muhandis</h4>
                <p className="text-[11px] text-slate-300">
                  Loyihalar yaratish, yangi versiyalarni belgilash, yangi a'zolar qo'shish va ro'yxatdan o'tkazish.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-blue-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-blue-300">vcg-admin</strong></div>
                  <div>Parol: <strong className="text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Researcher Card */}
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase">
                    RESEARCHER (Tadqiqotchi)
                  </span>
                  <Search className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white">AI Tadqiqotchi</h4>
                <p className="text-[11px] text-slate-300">
                  Gemini, Tavily, SerpAPI, Exa va Firecrawl bilan aqlli qidiruv va chuqur texnik tahlillar paneli.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-emerald-300">vcg-researcher</strong></div>
                  <div>Parol: <strong className="text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Designer Card */}
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-extrabold uppercase">
                    DESIGNER (Dizayner)
                  </span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Arxitektor & Dizayner</h4>
                <p className="text-[11px] text-slate-300">
                  Loyiha arxitekturasi, ERD ma'lumotlar sxemasi, texnik specifikatsiyalar va Word (.doc) yuklab olish.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-purple-300">vcg-designer</strong></div>
                  <div>Parol: <strong className="text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Analyst Card */}
              <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase">
                    ANALYST (Tahlilchi)
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Tizim Tahlilchisi & QA</h4>
                <p className="text-[11px] text-slate-300">
                  Test sinovlari hisoboti, xatoliklar darajasini belgilash (Passed/Failed) va versiya rejalashtirish.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/20 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-rose-300">vcg-analyst</strong></div>
                  <div>Parol: <strong className="text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

              {/* Member Card */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-600 text-white text-[10px] font-extrabold uppercase">
                    USER (Oddiy a'zo)
                  </span>
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Jamoa A'zosi</h4>
                <p className="text-[11px] text-slate-300">
                  Umumiy va shaxsiy chat, vazifalarni bajarish, shaxsiy va jamoaviy qaydlar (notes).
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 font-mono text-[11px] space-y-1">
                  <div>Login: <strong className="text-slate-300">vcg-user</strong></div>
                  <div>Parol: <strong className="text-white">vcg_mcc2ro</strong></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WORKSPACE & SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span>Global Workspace Sozlamalari</span>
              </h3>
              <p className="text-xs text-slate-400">
                Guruh nomi, telegram yordamchi va maxfiylik sozlamalarini boshqaring
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Platforma Nomi</label>
                <input 
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Telegram Admin / Support</label>
                <input 
                  type="text"
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Yopiq / Maxfiy Ofis Rejimi (Private Mode)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
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

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg"
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
