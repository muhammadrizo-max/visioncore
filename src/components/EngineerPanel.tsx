import React, { useState } from 'react';
import { UserPlus, FolderGit2, Copy, Check, Eye, EyeOff, Sparkles, Edit3, Trash2, ShieldCheck, Key } from 'lucide-react';
import { User, RoleType, Project, ArchitectureDoc } from '../types';

interface EngineerPanelProps {
  currentUser: User;
  allUsers: User[];
  projects: Project[];
  architectureDocs: ArchitectureDoc[];
  onAddMember: (newUser: User) => void;
  onUpdateMember: (updatedUser: User) => void;
  onDeleteMember: (userId: string) => void;
  onAddProject?: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  activeTab: 'addMember' | 'projects';
  darkMode: boolean;
}

export const EngineerPanel: React.FC<EngineerPanelProps> = ({
  currentUser,
  allUsers,
  projects,
  architectureDocs,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  activeTab = 'addMember',
  darkMode
}) => {
  const [tab, setTab] = useState<'addMember' | 'projects'>(activeTab);

  // Add Member State (No First/Last name required per user prompt)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleType>('researcher');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [msg, setMsg] = useState('');

  // Edit Member State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<RoleType>('user');

  // New Project State
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjVersion, setNewProjVersion] = useState('v1.0.0');
  const [newProjStatus, setNewProjStatus] = useState<'Planning' | 'In Progress' | 'Testing' | 'Completed'>('Planning');

  // Edit Project State
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');
  const [editProjVersion, setEditProjVersion] = useState('');
  const [editProjStatus, setEditProjStatus] = useState<'Planning' | 'In Progress' | 'Testing' | 'Completed'>('Planning');

  // Generator Helpers
  const generateUsername = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const rolePrefix = role.substring(0, 3);
    setUsername(`vcg-${rolePrefix}${randomNum}`);
  };

  const generatePassword = () => {
    const randomChars = Math.random().toString(36).substring(2, 8);
    setPassword(`vcg_${randomChars}`);
  };

  const handleCopyUsername = () => {
    if (!username) return;
    const formatted = username.startsWith('vcg-') || username.startsWith('cipher-') ? username : `vcg-${username}`;
    navigator.clipboard.writeText(formatted);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    const formatted = password.startsWith('vcg_') ? password : `vcg_${password}`;
    navigator.clipboard.writeText(formatted);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setMsg('Username va parolni to\'ldiring!');
      return;
    }

    // Ensure vcg- and vcg_ standards
    const finalUsername = (username.toLowerCase().startsWith('vcg-') || username.toLowerCase().startsWith('cipher-')) 
      ? username.toLowerCase() 
      : `vcg-${username.toLowerCase()}`;

    const finalPassword = password.startsWith('vcg_') ? password : `vcg_${password}`;

    const newUser: User = {
      id: `VCG-${Math.floor(10000 + Math.random() * 90000)}`,
      username: finalUsername,
      password: finalPassword,
      firstName: '', // Filled by user upon first login
      lastName: `(${role.toUpperCase()})`,
      phone: '+998 90 000 00 00',
      email: `${finalUsername}@visioncore.group`,
      role,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      registeredAt: new Date().toISOString()
    };

    onAddMember(newUser);
    setMsg(`A'zo muvaffaqiyatli yaratildi! Username: "${finalUsername}", Parol: "${finalPassword}", Rol: ${role.toUpperCase()}. Foydalanuvchi kirishda ismini o'zi to'ldiradi.`);
    
    setUsername('');
    setPassword('');
  };

  const startEditMember = (user: User) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditPassword(user.password || '');
    setEditRole(user.role);
  };

  const saveEditMember = (user: User) => {
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
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <span>Bosh Muhandis Paneli (Engineer)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Guruh a'zolarini rol boyicha yaratish va kirish ma'lumotlarini boshqarish
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            id="engineer-tab-members-btn"
            onClick={() => setTab('addMember')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              tab === 'addMember' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>A'zo qo'shish & Boshqarish</span>
          </button>

          <button
            id="engineer-tab-projects-btn"
            onClick={() => setTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              tab === 'projects' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Loyihalar va Kod</span>
          </button>
        </div>
      </div>

      {tab === 'addMember' ? (
        <div className="space-y-6">
          
          {msg && (
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-bold text-center leading-relaxed">
              {msg}
            </div>
          )}

          {/* Add Member Form - Only Rol, Username, Parol (no Ism/Familiya required) */}
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}>
            
            <h2 className="text-sm font-bold flex items-center space-x-2 text-blue-500">
              <UserPlus className="w-4 h-4" />
              <span>Yangi Guruh A'zosini Yaratish (Rol uchun Username va Parol)</span>
            </h2>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              
              {/* Role Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Jamoadagi Roli</label>
                <select
                  id="member-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-500 focus:outline-none"
                >
                  <option value="creator">Creator (Guruh Boshlig'i)</option>
                  <option value="researcher">Researcher (Tadqiqotchi)</option>
                  <option value="engineer">Engineer (Bosh muhandis)</option>
                  <option value="designer">Designer (Dizayner)</option>
                  <option value="analyst">Analyst (Tahlilchi)</option>
                  <option value="user">Oddiy a'zo (User)</option>
                </select>
              </div>

              {/* Username & Password inputs with copy, generate, and vcg- / vcg_ standards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Username Input */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-400 flex justify-between">
                    <span>Username (Standart: "vcg-...")</span>
                    {copiedUsername && <span className="text-green-400 text-[10px]">Nusxalandi!</span>}
                  </label>

                  <div className="relative">
                    <input 
                      id="member-username-input"
                      type="text"
                      required
                      placeholder="vcg-sardor90"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-blue-500 font-mono"
                    />
                    
                    <button
                      type="button"
                      onClick={handleCopyUsername}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-500 transition"
                      title="Nusxalash"
                    >
                      {copiedUsername ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={generateUsername}
                      className="text-[10px] font-bold text-blue-500 hover:underline flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Avto Generator</span>
                    </button>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-400 flex justify-between">
                    <span>Parol (Standart: "vcg_...")</span>
                    {copiedPassword && <span className="text-green-400 text-[10px]">Nusxalandi!</span>}
                  </label>

                  <div className="relative">
                    <input 
                      id="member-password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="vcg_pass2026"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-20 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-blue-500 font-mono"
                    />

                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-slate-400 hover:text-blue-500 transition"
                        title="Nusxalash"
                      >
                        {copiedPassword ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-blue-500 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[10px] font-bold text-blue-500 hover:underline flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Avto Generator</span>
                    </button>
                  </div>
                </div>

              </div>

              <button
                id="member-submit-btn"
                type="submit"
                className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md active:scale-95"
              >
                A'zo Yaratish
              </button>

            </form>
          </div>

          {/* Members Table / List */}
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-4`}>
            
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Guruh A'zolari va Kirish Ma'lumotlari
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Ismi / A'zo</th>
                    <th className="py-3 px-3">Rol</th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Parol</th>
                    <th className="py-3 px-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map((m) => {
                    const isEditing = editingUserId === m.id;

                    return (
                      <tr key={m.id} className="hover:bg-slate-500/5 transition">
                        <td className="py-3 px-3 font-bold flex items-center space-x-2">
                          <img src={m.avatar} alt={m.firstName || m.username} className="w-7 h-7 rounded-lg object-cover" />
                          <span>{m.firstName ? `${m.firstName} ${m.lastName || ''}` : <i className="text-slate-500 font-normal">(Kirishda to'ldiriladi)</i>}</span>
                        </td>

                        <td className="py-3 px-3">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as RoleType)}
                              className="px-2 py-1 rounded bg-slate-800 border text-xs"
                            >
                              <option value="creator">creator</option>
                              <option value="researcher">researcher</option>
                              <option value="engineer">engineer</option>
                              <option value="designer">designer</option>
                              <option value="analyst">analyst</option>
                              <option value="user">user</option>
                            </select>
                          ) : (
                            <span className="uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded text-[10px]">
                              {m.role}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-slate-300">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              className="px-2 py-1 rounded bg-slate-800 border text-xs"
                            />
                          ) : (
                            m.username
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-400">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="px-2 py-1 rounded bg-slate-800 border text-xs"
                            />
                          ) : (
                            m.password || '******'
                          )}
                        </td>

                        <td className="py-3 px-3 text-right space-x-2">
                          {isEditing ? (
                            <button
                              onClick={() => saveEditMember(m)}
                              className="px-2.5 py-1 rounded bg-green-600 text-white font-bold text-[10px]"
                            >
                              Saqlash
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditMember(m)}
                              className="text-blue-400 hover:underline font-bold text-[10px]"
                            >
                              Tahrirlash
                            </button>
                          )}

                          {m.id !== currentUser.id && (
                            <button
                              onClick={() => onDeleteMember(m.id)}
                              className="text-red-400 hover:underline font-bold text-[10px] ml-1"
                            >
                              O'chirish
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      ) : (
        /* Projects View */
        <div className="space-y-6">

          {/* New Project Form */}
          {onAddProject && (
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-sm space-y-4`}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-500 flex items-center space-x-2">
                <FolderGit2 className="w-4 h-4" />
                <span>Yangi Loyiha Qo'shish</span>
              </h2>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newProjName.trim()) return;
                  const proj: Project = {
                    id: `PROJ-${Date.now()}`,
                    name: newProjName.trim(),
                    description: newProjDesc.trim(),
                    status: newProjStatus as any,
                    version: newProjVersion.trim() || 'v1.0.0'
                  };
                  onAddProject(proj);
                  setNewProjName('');
                  setNewProjDesc('');
                  setNewProjVersion('v1.0.0');
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Loyiha Nomi</label>
                    <input 
                      type="text"
                      required
                      placeholder="Loyiha nomi..."
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Versiya</label>
                    <input 
                      type="text"
                      placeholder="v1.0.0"
                      value={newProjVersion}
                      onChange={(e) => setNewProjVersion(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Status</label>
                    <select
                      value={newProjStatus}
                      onChange={(e) => setNewProjStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none font-bold text-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Testing">Testing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Loyiha Tavsifi</label>
                  <textarea
                    rows={2}
                    placeholder="Loyiha haqida batafsil..."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Loyihani Yaratish
                </button>
              </form>
            </div>
          )}

          {/* Project List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((p) => {
              const arch = architectureDocs.find(a => a.projectId === p.id);
              const isEditing = editingProjId === p.id;

              return (
                <div 
                  key={p.id}
                  className={`p-6 rounded-3xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  } shadow-sm space-y-4`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Loyiha Nomi</label>
                        <input 
                          type="text"
                          value={editProjName}
                          onChange={(e) => setEditProjName(e.target.value)}
                          className="w-full p-2 text-xs font-bold rounded-xl bg-slate-800 border text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Versiya</label>
                        <input 
                          type="text"
                          value={editProjVersion}
                          onChange={(e) => setEditProjVersion(e.target.value)}
                          className="w-full p-2 text-xs rounded-xl bg-slate-800 border text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tavsifi</label>
                        <textarea
                          rows={2}
                          value={editProjDesc}
                          onChange={(e) => setEditProjDesc(e.target.value)}
                          className="w-full p-2 text-xs rounded-xl bg-slate-800 border text-white resize-none"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => {
                            if (onUpdateProject) {
                              onUpdateProject({
                                ...p,
                                name: editProjName,
                                description: editProjDesc,
                                version: editProjVersion,
                                status: editProjStatus
                              });
                            }
                            setEditingProjId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold"
                        >
                          Saqlash
                        </button>
                        <button
                          onClick={() => setEditingProjId(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-700 text-white text-xs font-bold"
                        >
                          Bekor qilish
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full">
                          {p.status}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-400">{p.version}</span>
                          {onUpdateProject && (
                            <button
                              onClick={() => {
                                setEditingProjId(p.id);
                                setEditProjName(p.name);
                                setEditProjDesc(p.description);
                                setEditProjVersion(p.version);
                                setEditProjStatus(p.status);
                              }}
                              className="text-slate-400 hover:text-blue-500 p-1"
                              title="Tahrirlash"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteProject && (
                            <button
                              onClick={() => onDeleteProject(p.id)}
                              className="text-slate-400 hover:text-red-500 p-1"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h2 className="text-base font-bold">{p.name}</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                    </>
                  )}

                  {arch && (
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs space-y-2">
                      <span className="font-bold text-indigo-400 block">Dizayner Tarafidan Yaratilgan Arxitektura:</span>
                      <p className="text-[11px] text-slate-300 italic">{arch.specsText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
