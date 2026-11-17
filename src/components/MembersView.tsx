import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { User, RoleType, MemberActivity, Task, Order } from '../types';

interface MembersViewProps {
  currentUser: User;
  allUsers: User[];
  activities: MemberActivity[];
  tasks: Task[];
  orders: Order[];
  onAddMember: (newUser: User) => void;
  onUpdateMember: (updatedUser: User) => void;
  onDeleteMember: (userId: string) => void;
  darkMode: boolean;
}

type TeamRoleType = 'creator' | 'engineer' | 'researcher' | 'designer' | 'analyst';

export const MembersView: React.FC<MembersViewProps> = ({
  currentUser,
  allUsers,
  activities,
  tasks,
  orders,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  darkMode
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'activity' | 'productivity'>('manage');

  // Form states (No 'user' role allowed when adding team members)
  const [newRole, setNewRole] = useState<TeamRoleType>('engineer');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('+998 ');
  const [newEmail, setNewEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [statusMsg, setStatusMsg] = useState('');

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState<RoleType>('engineer');
  const [editPassword, setEditPassword] = useState('');

  const buildGeneratedCredentials = (roleForPrefix: TeamRoleType) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = roleForPrefix === 'creator' ? 'creator' : roleForPrefix === 'engineer' ? 'admin' : roleForPrefix.substring(0, 3);
    const randomPass = Math.random().toString(36).substring(2, 8);
    return {
      username: `vcg-${prefix}${randomNum}`,
      password: `vcg_${randomPass}`
    };
  };

  // Automatically pre-generate username & password on mount (and let admin regenerate or manually edit anytime)
  useEffect(() => {
    const creds = buildGeneratedCredentials(newRole);
    setNewUsername(creds.username);
    setNewPassword(creds.password);
  }, []);

  const generateCredentials = () => {
    const creds = buildGeneratedCredentials(newRole);
    setNewUsername(creds.username);
    setNewPassword(creds.password);
  };

  const handleRoleChangeWithAutoGen = (selectedRole: TeamRoleType) => {
    setNewRole(selectedRole);
    const creds = buildGeneratedCredentials(selectedRole);
    setNewUsername(creds.username);
    setNewPassword(creds.password);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setStatusMsg('Username va parol kiritilishi shart!');
      return;
    }

    if (newPassword.trim().length < 6) {
      setStatusMsg('Parol kamida 6 ta belgidan iborat bo\'lishi shart!');
      return;
    }

    const finalUsername = newUsername.toLowerCase().trim();
    if (allUsers.some(u => u.username.toLowerCase() === finalUsername)) {
      setStatusMsg(`"${finalUsername}" username allaqachon mavjud. Boshqa nom kiriting yoki qayta generatsiya qiling!`);
      return;
    }

    const finalPassword = newPassword.trim();
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const delimiter = Math.random() > 0.5 ? '-' : '_';
    const newId = `vcg${delimiter}${randomDigits}`;

    const newUser: User = {
      id: newId,
      username: finalUsername,
      password: finalPassword,
      firstName: newFirstName.trim() || 'A\'zo',
      lastName: newLastName.trim() || `(${newRole.toUpperCase()})`,
      phone: newPhone.trim() || '+998 90 000 00 00',
      email: newEmail.trim() || `${finalUsername}@visioncore.group`,
      role: newRole,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${finalUsername}`,
      registeredAt: new Date().toISOString(),
      language: 'uz'
    };

    onAddMember(newUser);
    setStatusMsg(`"${finalUsername}" (${newRole.toUpperCase()}) muvaffaqiyatli qo'shildi!`);
    // Prepare fresh auto-generated credentials for next member
    const nextCreds = buildGeneratedCredentials(newRole);
    setNewUsername(nextCreds.username);
    setNewPassword(nextCreds.password);
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditRole(user.role);
    setEditPassword(user.password || '');
  };

  const saveEdit = (user: User) => {
    const updated: User = {
      ...user,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      role: editRole,
      password: editPassword.trim() || user.password
    };
    onUpdateMember(updated);
    setEditingUserId(null);
    setStatusMsg(`"${user.username}" ma'lumotlari yangilandi.`);
  };

  // Real Team Productivity Line Graph computed from actual tasks, orders & activities over the last 7 days
  const productivityData = useMemo(() => {
    const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const result: { day: string; dateStr: string; tasks: number; orders: number; points: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDay = d.toISOString().split('T')[0];

      const dayTasks = tasks.filter(t => t.date && t.date.startsWith(isoDay) && t.completed).length;
      const dayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(isoDay)).length;
      const dayActs = activities.filter(a => a.timestamp && a.timestamp.startsWith(isoDay)).length;

      result.push({
        day: dayNames[d.getDay()],
        dateStr: isoDay,
        tasks: dayTasks,
        orders: dayOrders,
        points: dayTasks * 10 + dayOrders * 15 + dayActs * 2
      });
    }
    return result;
  }, [tasks, orders, activities]);

  const maxPoints = Math.max(...productivityData.map(d => d.points), 20);
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 35;

  const pointsString = productivityData.map((d, idx) => {
    const x = padding + (idx * (svgWidth - 2 * padding)) / (productivityData.length - 1);
    const y = svgHeight - padding - (d.points / maxPoints) * (svgHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  // Real summary stats (zero fake placeholders)
  const completedTasksTotal = tasks.filter(t => t.completed).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasksTotal / tasks.length) * 100) : 0;
  const completedOrdersTotal = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>VisionCore Group Jamoasi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            A'zolar & Boshqaruv Markazi
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Jamoa a'zolarini ro'yxatga olish, rollarini belgilash, harakatlar jurnali va real ish unumdorligi
          </p>
        </div>

        {/* Top 3 Tabs */}
        <div className="flex items-center space-x-2 p-1.5 rounded-2xl liquid-glass overflow-x-auto">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>A'zo qo'shish & Boshqarish</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>A'zolar Harakatlari</span>
          </button>

          <button
            onClick={() => setActiveTab('productivity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'productivity'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ish Samaradorligi (Grafik)</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 backdrop-blur-md text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span className="font-semibold">{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* TAB 1: ADD & MANAGE MEMBERS */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          
          {/* Create Member Box */}
          <div className="p-6 rounded-3xl liquid-glass space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-500" />
                <span>Yangi Guruh A'zosini Yaratish (Avtomatik yoki Qo'lda)</span>
              </h3>
              <button
                type="button"
                onClick={generateCredentials}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-600 dark:text-blue-300 hover:text-white border border-blue-500/25 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Qayta Avto Generatsiya</span>
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Jamoadagi Roli (Oddiy userlar saytdan mustaqil ro'yxatdan o'tadi)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => handleRoleChangeWithAutoGen(e.target.value as TeamRoleType)}
                  className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="engineer" className="bg-slate-900 text-white">Engineer (Bosh Muhandis & Admin)</option>
                  <option value="researcher" className="bg-slate-900 text-white">Researcher (AI Tadqiqotchi)</option>
                  <option value="designer" className="bg-slate-900 text-white">Designer (UI/UX & Tizim Arxitektori)</option>
                  <option value="analyst" className="bg-slate-900 text-white">Analyst (Tahlilchi & QA Tester)</option>
                  <option value="creator" className="bg-slate-900 text-white">Creator (Boshliq / Guruh Rahbari)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ism va Familiya</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      placeholder="Ismi"
                      value={newFirstName}
                      onChange={e => setNewFirstName(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text"
                      placeholder="Familiya"
                      value={newLastName}
                      onChange={e => setNewLastName(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telefon raqam</label>
                  <input 
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Username (Avto generatsiya / Qo'lda kiritish)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const creds = buildGeneratedCredentials(newRole);
                        setNewUsername(creds.username);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Yangilash</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      placeholder="vcg-username"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 pr-10"
                    />
                    {newUsername && (
                      <button
                        type="button"
                        onClick={() => handleCopy(newUsername, 'new-user')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-500 cursor-pointer"
                      >
                        {copiedId === 'new-user' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Parol (Avto generatsiya / Qo'lda kiritish)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const creds = buildGeneratedCredentials(newRole);
                        setNewPassword(creds.password);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Yangilash</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      placeholder="vcg_pass..."
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 pr-10"
                    />
                    {newPassword && (
                      <button
                        type="button"
                        onClick={() => handleCopy(newPassword, 'new-pass')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-500 cursor-pointer"
                      >
                        {copiedId === 'new-pass' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md active:scale-95 cursor-pointer"
                >
                  + A'zo Yaratish
                </button>
              </div>
            </form>
          </div>

          {/* Members Table */}
          <div className="rounded-3xl liquid-glass overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  GURUH A'ZOLARI VA FOYDALANUVCHILAR ({allUsers.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200/60 dark:border-white/10">
                    <th className="p-4">ISMI / A'ZO</th>
                    <th className="p-4">ROL</th>
                    <th className="p-4">USERNAME</th>
                    <th className="p-4">PAROL</th>
                    <th className="p-4 text-right">AMALLAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                  {allUsers.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const isVisible = showPasswords[u.id];

                    return (
                      <tr key={u.id} className="hover:bg-slate-200/30 dark:hover:bg-white/5 transition">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img src={u.avatar} alt={u.firstName} className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-white/20" />
                            <div>
                              {isEditing ? (
                                <div className="flex space-x-1">
                                  <input 
                                    type="text" 
                                    value={editFirstName} 
                                    onChange={e => setEditFirstName(e.target.value)} 
                                    className="px-2 py-1 rounded liquid-glass-subtle text-xs" 
                                  />
                                  <input 
                                    type="text" 
                                    value={editLastName} 
                                    onChange={e => setEditLastName(e.target.value)} 
                                    className="px-2 py-1 rounded liquid-glass-subtle text-xs" 
                                  />
                                </div>
                              ) : (
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {u.firstName || u.username} {u.lastName || ''}
                                </div>
                              )}
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{u.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value as RoleType)}
                              className="px-2 py-1 rounded liquid-glass-subtle text-xs font-bold"
                            >
                              <option value="creator" className="bg-slate-900 text-white">Creator</option>
                              <option value="engineer" className="bg-slate-900 text-white">Engineer</option>
                              <option value="researcher" className="bg-slate-900 text-white">Researcher</option>
                              <option value="designer" className="bg-slate-900 text-white">Designer</option>
                              <option value="analyst" className="bg-slate-900 text-white">Analyst</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              u.role === 'creator'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : u.role === 'engineer'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : u.role === 'researcher'
                                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30'
                                : u.role === 'designer'
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                : u.role === 'analyst'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/30'
                            }`}>
                              {u.role}
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono text-slate-800 dark:text-slate-200">
                          <div className="flex items-center space-x-1.5">
                            <span>{u.username}</span>
                            <button
                              onClick={() => handleCopy(u.username, `u-${u.id}`)}
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              {copiedId === `u-${u.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-slate-800 dark:text-slate-200">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editPassword} 
                              onChange={e => setEditPassword(e.target.value)} 
                              className="px-2 py-1 rounded liquid-glass-subtle text-xs" 
                            />
                          ) : u.password ? (
                            <div className="flex items-center space-x-2">
                              <span>{isVisible ? u.password : '••••••••'}</span>
                              <button
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              >
                                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => handleCopy(u.password || '', `p-${u.id}`)}
                                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              >
                                {copiedId === `p-${u.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                              Backend himoyalangan
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(u)}
                                  className="text-emerald-500 font-bold hover:underline cursor-pointer"
                                >
                                  Saqlash
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="text-slate-400 hover:underline cursor-pointer"
                                >
                                  Bekor
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(u)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                                >
                                  Tahrirlash
                                </button>
                                {allUsers.length > 1 && u.id !== currentUser.id && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Rostdan ham "${u.username}"ni o'chirmoqchimisiz?`)) {
                                        onDeleteMember(u.id);
                                      }
                                    }}
                                    className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                                  >
                                    O'chirish
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

      {/* TAB 2: MEMBER ACTIVITIES LOG */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span>Jamoa A'zolari Jonli Harakatlar Jurnali</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A'zolarning topshiriqlar, buyurtmalar va tizimdagi barcha haqiqiy amallari ketma-ketligi
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Hozircha harakatlar qayd etilmagan.
              </div>
            ) : (
              activities.map((act) => (
                <div 
                  key={act.id} 
                  className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-subtle text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      {act.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                        <span>{act.userName}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 uppercase">
                          {act.userRole}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{act.action}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(act.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REAL PRODUCTIVITY LINE GRAPH */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl liquid-glass space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Ish Samaradorligi va Unumdorlik Dinamikasi (Real Line Graph)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Haqiqiy bajarilgan topshiriqlar, qabul qilingan buyurtmalar va faollik indeksi
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold">
                <span className="flex items-center space-x-1.5 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Real Samaradorlik Ballari</span>
                </span>
              </div>
            </div>

            {/* Real SVG Line Graph */}
            <div className="relative w-full overflow-hidden rounded-2xl liquid-glass-subtle p-4">
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="w-full h-56 sm:h-64 overflow-visible"
              >
                {[0, Math.round(maxPoints * 0.25), Math.round(maxPoints * 0.5), Math.round(maxPoints * 0.75), maxPoints].map((val) => {
                  const y = svgHeight - padding - (val / maxPoints) * (svgHeight - 2 * padding);
                  return (
                    <g key={val}>
                      <line 
                        x1={padding} 
                        y1={y} 
                        x2={svgWidth - padding} 
                        y2={y} 
                        stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={padding - 8} 
                        y={y + 3} 
                        fontSize="9" 
                        textAnchor="end" 
                        fill={darkMode ? '#94a3b8' : '#475569'}
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />

                <defs>
                  <linearGradient id="productivityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#productivityGrad)"
                  points={`${padding},${svgHeight - padding} ${pointsString} ${svgWidth - padding},${svgHeight - padding}`}
                />

                {productivityData.map((d, idx) => {
                  const x = padding + (idx * (svgWidth - 2 * padding)) / (productivityData.length - 1);
                  const y = svgHeight - padding - (d.points / maxPoints) * (svgHeight - 2 * padding);
                  return (
                    <g key={d.dateStr}>
                      <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                      <text 
                        x={x} 
                        y={svgHeight - 10} 
                        fontSize="10" 
                        fontWeight="bold" 
                        textAnchor="middle" 
                        fill={darkMode ? '#cbd5e1' : '#334155'}
                      >
                        {d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* 100% Real Quick Metrics Cards (No fake numbers!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl liquid-glass-subtle space-y-1">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase">Bajarilgan Topshiriqlar</span>
                <div className="text-xl font-black text-emerald-500">{completedTasksTotal} / {tasks.length}</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Umumiy ijro ulushi: {taskCompletionRate}%</p>
              </div>

              <div className="p-4 rounded-2xl liquid-glass-subtle space-y-1">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase">Yakunlangan Buyurtmalar</span>
                <div className="text-xl font-black text-blue-500">{completedOrdersTotal} / {orders.length}</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Mijozlardan kelgan haqiqiy buyurtmalar</p>
              </div>

              <div className="p-4 rounded-2xl liquid-glass-subtle space-y-1">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase">Qayd Etilgan Harakatlar</span>
                <div className="text-xl font-black text-amber-500">{activities.length} ta</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Tizimdagi real harakatlar jurnali</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
