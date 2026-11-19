import { PasswordAdminPanel } from './PasswordAdminPanel';
import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Activity, TrendingUp, Clock, Shield, Search } from 'lucide-react';
import { User, MemberActivity, Task, Order } from '../types';
import { api } from '../lib/api';

interface MembersViewProps {
  currentUser: User;
  allUsers: User[];
  activities: MemberActivity[];
  tasks: Task[];
  orders: Order[];
  onUpdateMember: (updatedUser: User) => void;
  onDeleteMember: (userId: string) => void;
  darkMode: boolean;
}

type TeamRoleType = 'engineer' | 'researcher' | 'designer' | 'analyst';
const TEAM_ROLES: TeamRoleType[] = ['engineer', 'researcher', 'designer', 'analyst'];

const badgeClass = (role: string) => {
  switch (role) {
    case 'creator':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'engineer':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'researcher':
      return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30';
    case 'designer':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    case 'analyst':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/30';
  }
};

export const MembersView: React.FC<MembersViewProps> = ({
  currentUser,
  allUsers,
  activities,
  tasks,
  orders,
  onUpdateMember,
  onDeleteMember,
  darkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'activity' | 'productivity'>('manage');
  const [statusMsg, setStatusMsg] = useState('');

  // ID orqali qidirish
  const [lookupId, setLookupId] = useState('');
  const [lookupRole, setLookupRole] = useState<TeamRoleType>('engineer');
  const [foundUser, setFoundUser] = useState<User | null>(null);

  // Tahrirlash
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<TeamRoleType>('engineer');

  const teamMembers = allUsers.filter((u) => u.role !== 'user');
  const regularUsers = allUsers.filter((u) => u.role === 'user');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = lookupId.replace(/\s+/g, '').toLowerCase();
    if (!id) {
      setStatusMsg('Foydalanuvchi ID sini kiriting!');
      return;
    }
    let found: User | null = allUsers.find((u) => u.id.toLowerCase() === id) || null;
    if (!found) {
      try {
        found = await api<User>(`/api/admin/lookup?id=${encodeURIComponent(id)}`);
      } catch {
        found = null;
      }
    }
    if (!found) {
      setFoundUser(null);
      setStatusMsg(`"${lookupId.trim()}" ID bilan foydalanuvchi topilmadi. U avval saytda ro'yxatdan o'tishi kerak.`);
      return;
    }
    if (found.role !== 'user') {
      setFoundUser(null);
      setStatusMsg(`"${found.username}" allaqachon jamoa a'zosi (${found.role.toUpperCase()}).`);
      return;
    }
    setFoundUser(found);
    setStatusMsg('');
  };

  const handleAddToWorkspace = () => {
    if (!foundUser) return;
    onUpdateMember({ ...foundUser, role: lookupRole });
    setStatusMsg(`"${foundUser.username}" ${lookupRole.toUpperCase()} sifatida jamoaga qo'shildi!`);
    setFoundUser(null);
    setLookupId('');
  };

  const handleReturnToUser = (u: User) => {
    if (!confirm(`"${u.username}" ni jamoadan chiqarib, oddiy userga qaytarasizmi?`)) return;
    onUpdateMember({ ...u, role: 'user' });
    setStatusMsg(`"${u.username}" oddiy userga qaytarildi.`);
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditUsername(user.username);
    setEditRole((TEAM_ROLES as string[]).includes(user.role) ? (user.role as TeamRoleType) : 'engineer');
  };

  const saveEdit = (user: User) => {
    const cleanedUsername = editUsername.trim().toLowerCase() || user.username;
    if (allUsers.some((u) => u.id !== user.id && u.username.toLowerCase() === cleanedUsername)) {
      setStatusMsg(`"${cleanedUsername}" username band!`);
      return;
    }
    const isTeam = user.role !== 'user' && user.role !== 'creator';
    onUpdateMember({
      ...user,
      username: cleanedUsername,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      role: isTeam ? editRole : user.role,
    });
    setEditingUserId(null);
    setStatusMsg(`"${cleanedUsername}" ma'lumotlari yangilandi.`);
  };

  // Ish samaradorligi (real ma'lumotlar)
  const productivityData = useMemo(() => {
    const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const result: { day: string; dateStr: string; tasks: number; orders: number; points: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDay = d.toISOString().split('T')[0];

      const dayTasks = tasks.filter((t) => t.date && t.date.startsWith(isoDay) && t.completed).length;
      const dayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(isoDay)).length;
      const dayActs = activities.filter((a) => a.timestamp && a.timestamp.startsWith(isoDay)).length;

      result.push({
        day: dayNames[d.getDay()],
        dateStr: isoDay,
        tasks: dayTasks,
        orders: dayOrders,
        points: dayTasks * 10 + dayOrders * 15 + dayActs * 2,
      });
    }
    return result;
  }, [tasks, orders, activities]);

  const maxPoints = Math.max(...productivityData.map((d) => d.points), 20);
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 35;

  const pointsString = productivityData
    .map((d, idx) => {
      const x = padding + (idx * (svgWidth - 2 * padding)) / (productivityData.length - 1);
      const y = svgHeight - padding - (d.points / maxPoints) * (svgHeight - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  const completedTasksTotal = tasks.filter((t) => t.completed).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasksTotal / tasks.length) * 100) : 0;
  const completedOrdersTotal = orders.filter((o) => o.status === 'completed').length;

  const renderNameCell = (u: User) => {
    const isEditing = editingUserId === u.id;
    return (
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-white/20" />
          <div>
            {isEditing ? (
              <div className="flex space-x-1">
                <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="px-2 py-1 rounded liquid-glass-subtle text-xs" />
                <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="px-2 py-1 rounded liquid-glass-subtle text-xs" />
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
    );
  };

  const renderUsernameCell = (u: User) =>
    editingUserId === u.id ? (
      <td className="p-4 font-mono">
        <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="px-2 py-1 rounded liquid-glass-subtle text-xs font-mono" />
      </td>
    ) : (
      <td className="p-4 font-mono text-slate-800 dark:text-slate-200">{u.username}</td>
    );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>VisionCore Group Jamoasi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">A'zolar & Boshqaruv Markazi</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ro'yxatdan o'tgan userlarni ID orqali jamoaga qo'shing, rollarini belgilang va samaradorlikni kuzating
          </p>
        </div>

        <div className="flex items-center space-x-2 p-1.5 rounded-2xl liquid-glass overflow-x-auto">
          {[
            { key: 'manage', label: "A'zolar", icon: UserPlus },
            { key: 'activity', label: "Harakatlar", icon: Activity },
            { key: 'productivity', label: 'Samaradorlik', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 backdrop-blur-md text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span className="font-semibold">{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm font-bold cursor-pointer">×</button>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <PasswordAdminPanel onStatus={setStatusMsg} />

            {/* ID orqali qo'shish */}
            <div className="p-6 rounded-3xl liquid-glass space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Search className="w-4 h-4 text-blue-500" />
                    <span>ID orqali a'zo qo'shish</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Oddiy foydalanuvchi saytda o'zi ro'yxatdan o'tadi va o'z ID sini sizga beradi. Shu ID ni kiritib, uni rol bilan jamoaga qo'shing.
                  </p>
                </div>

                <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="vcg-XXXXXXXX"
                    value={lookupId}
                    onChange={(e) => {
                      setLookupId(e.target.value);
                      setFoundUser(null);
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Qidirish</span>
                  </button>
                </form>
              </div>

              {foundUser && (
                <div className="p-4 rounded-2xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img src={foundUser.avatar} alt={foundUser.username} className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-white/20" />
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {foundUser.firstName || foundUser.username} {foundUser.lastName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {foundUser.id} · {foundUser.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={lookupRole}
                      onChange={(e) => setLookupRole(e.target.value as TeamRoleType)}
                      className="px-3 py-2 rounded-xl liquid-glass-subtle text-xs font-bold cursor-pointer"
                    >
                      {TEAM_ROLES.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddToWorkspace}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md active:scale-95 cursor-pointer"
                    >
                      Jamoaga qo'shish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Jamoa a'zolari */}
          <div className="rounded-3xl liquid-glass overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                GURUH A'ZOLARI ({teamMembers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200/60 dark:border-white/10">
                    <th className="p-4">A'ZO</th>
                    <th className="p-4">ROL</th>
                    <th className="p-4">USERNAME</th>
                    <th className="p-4 text-right">AMALLAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        Hozircha jamoa a'zolari yo'q.
                      </td>
                    </tr>
                  ) : (
                    teamMembers.map((u) => {
                      const isEditing = editingUserId === u.id;
                      const isCreator = u.role === 'creator';
                      return (
                        <tr key={u.id} className="hover:bg-slate-200/30 dark:hover:bg-white/5 transition">
                          {renderNameCell(u)}
                          <td className="p-4">
                            {isEditing && !isCreator ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value as TeamRoleType)}
                                className="px-2 py-1 rounded liquid-glass-subtle text-xs font-bold"
                              >
                                {TEAM_ROLES.map((r) => (
                                  <option key={r} value={r} className="bg-slate-900 text-white">
                                    {r}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeClass(u.role)}`}>
                                {u.role}
                              </span>
                            )}
                          </td>
                          {renderUsernameCell(u)}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveEdit(u)} className="text-emerald-500 font-bold hover:underline cursor-pointer">Saqlash</button>
                                  <button onClick={() => setEditingUserId(null)} className="text-slate-400 hover:underline cursor-pointer">Bekor</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(u)} className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">Tahrirlash</button>
                                  {!isCreator && u.id !== currentUser.id && (
                                    <>
                                      <button onClick={() => handleReturnToUser(u)} className="text-amber-500 hover:underline font-bold cursor-pointer">Userga qaytarish</button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`Rostdan ham "${u.username}"ni o'chirmoqchimisiz?`)) onDeleteMember(u.id);
                                        }}
                                        className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                                      >
                                        O'chirish
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Oddiy userlar */}
          <div className="rounded-3xl liquid-glass overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                ODDIY USERLAR ({regularUsers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200/60 dark:border-white/10">
                    <th className="p-4">FOYDALANUVCHI</th>
                    <th className="p-4">ROL</th>
                    <th className="p-4">USERNAME</th>
                    <th className="p-4 text-right">AMALLAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                  {regularUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        Hozircha ro'yxatdan o'tgan oddiy userlar yo'q.
                      </td>
                    </tr>
                  ) : (
                    regularUsers.map((u) => {
                      const isEditing = editingUserId === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-200/30 dark:hover:bg-white/5 transition">
                          {renderNameCell(u)}
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeClass('user')}`}>USER</span>
                          </td>
                          {renderUsernameCell(u)}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveEdit(u)} className="text-emerald-500 font-bold hover:underline cursor-pointer">Saqlash</button>
                                  <button onClick={() => setEditingUserId(null)} className="text-slate-400 hover:underline cursor-pointer">Bekor</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(u)} className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">Tahrirlash</button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Rostdan ham "${u.username}"ni o'chirmoqchimisiz?`)) onDeleteMember(u.id);
                                    }}
                                    className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                                  >
                                    O'chirish
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="border-b border-slate-200/60 dark:border-white/10 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Jamoa a'zolari harakatlari</span>
            </h3>
          </div>
          <div className="space-y-3 pt-2">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">Hozircha harakatlar qayd etilmagan.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-subtle text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      {act.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                        <span>{act.userName}</span>
                        <span className="text-[10px] px-2 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 uppercase">{act.userRole}</span>
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

      {activeTab === 'productivity' && (
        <div className="p-6 rounded-3xl liquid-glass space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Ish samaradorligi (oxirgi 7 kun)</span>
          </h3>

          <div className="relative w-full overflow-hidden rounded-2xl liquid-glass-subtle p-4">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-56 sm:h-64 overflow-visible">
              {[0, Math.round(maxPoints * 0.25), Math.round(maxPoints * 0.5), Math.round(maxPoints * 0.75), maxPoints].map((val) => {
                const y = svgHeight - padding - (val / maxPoints) * (svgHeight - 2 * padding);
                return (
                  <g key={val}>
                    <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} strokeDasharray="4 4" />
                    <text x={padding - 8} y={y + 3} fontSize="9" textAnchor="end" fill={darkMode ? '#94a3b8' : '#475569'}>
                      {val}
                    </text>
                  </g>
                );
              })}

              <polyline fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={pointsString} />

              {productivityData.map((d, idx) => {
                const x = padding + (idx * (svgWidth - 2 * padding)) / (productivityData.length - 1);
                const y = svgHeight - padding - (d.points / maxPoints) * (svgHeight - 2 * padding);
                return (
                  <g key={d.dateStr}>
                    <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                    <text x={x} y={svgHeight - 10} fontSize="10" fontWeight="bold" textAnchor="middle" fill={darkMode ? '#cbd5e1' : '#334155'}>
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl liquid-glass-subtle space-y-1">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase">Bajarilgan topshiriqlar</span>
              <div className="text-xl font-black text-emerald-500">{completedTasksTotal} / {tasks.length}</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Ijro ulushi: {taskCompletionRate}%</p>
            </div>
            <div className="p-4 rounded-2xl liquid-glass-subtle space-y-1">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase">Yakunlangan buyurtmalar</span>
              <div className="text-xl font-black text-blue-500">{completedOrdersTotal} / {orders.length}</div>
            </div>
            <div className="p-4 rounded-2xl liquid-glass-subtle space-y-1">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase">Qayd etilgan harakatlar</span>
              <div className="text-xl font-black text-amber-500">{activities.length} ta</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
