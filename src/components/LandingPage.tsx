import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  Eye, 
  EyeOff, 
  UserCheck, 
  KeyRound, 
  Crown, 
  FolderGit2, 
  Search, 
  Cpu, 
  FileSpreadsheet, 
  ChevronDown 
} from 'lucide-react';
import { User, Language, RoleType } from '../types';
import { INITIAL_USERS } from '../mockData';
import { getTranslation } from '../lib/translations';

interface LandingPageProps {
  onLoginSuccess: (user: User) => void;
  allUsers: User[];
  language?: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginSuccess,
  allUsers,
  language = 'uz'
}) => {
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRoleList, setShowRoleList] = useState(false);

  const currentLang: Language = (language === 'en' || language === 'ru') ? language : 'uz';
  const t = getTranslation(currentLang);

  const setCredentials = (roleName: string, u: string, p: string) => {
    setFirstName(roleName);
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
    setShowRoleList(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanFirstName = firstName.trim();

    if (!cleanUsername) {
      setErrorMsg('Username kiriting!');
      return;
    }
    if (!cleanPassword) {
      setErrorMsg('Parolni kiriting!');
      return;
    }

    // Standardize vcg- / cipher- prefixes
    const vcgUsername = cleanUsername.startsWith('vcg-') ? cleanUsername : `vcg-${cleanUsername}`;
    const cipherUsername = cleanUsername.startsWith('cipher-') ? cleanUsername : `cipher-${cleanUsername}`;

    // Combine current user list with initial default users
    const combinedUsers = [...allUsers, ...INITIAL_USERS];

    // Find user by username & password
    const foundUser = combinedUsers.find(
      u =>
        u &&
        u.username &&
        typeof u.username === 'string' &&
        (
          u.username.toLowerCase() === cleanUsername || 
          u.username.toLowerCase() === vcgUsername ||
          u.username.toLowerCase() === cipherUsername
        ) &&
        u.password === cleanPassword
    );

    if (foundUser) {
      const updatedUser: User = {
        ...foundUser,
        firstName: cleanFirstName || foundUser.firstName || "A'zo"
      };
      onLoginSuccess(updatedUser);
    } else {
      // Dynamic registration if user doesn't exist yet
      const isCreator = cleanUsername.includes('creator') || cleanUsername === 'vcg-creator';
      const isEngineer = cleanUsername.includes('engineer') || cleanUsername.includes('admin') || cleanUsername === 'vcg-admin' || cleanUsername === 'cipher-res98100';
      const isResearcher = cleanUsername.includes('researcher');
      const isDesigner = cleanUsername.includes('designer');
      const isAnalyst = cleanUsername.includes('analyst');

      let userRole: RoleType = 'user';
      if (isCreator) userRole = 'creator';
      else if (isEngineer) userRole = 'engineer';
      else if (isResearcher) userRole = 'researcher';
      else if (isDesigner) userRole = 'designer';
      else if (isAnalyst) userRole = 'analyst';

      const newUser: User = {
        id: `VCG-USR-${Date.now().toString().slice(-5)}`,
        username: cleanUsername,
        password: cleanPassword,
        firstName: cleanFirstName || (isCreator ? 'Boshliq' : isEngineer ? 'Bosh Muhandis' : "A'zo"),
        lastName: `(${userRole.toUpperCase()})`,
        phone: '',
        email: `${cleanUsername}@visioncore.group`,
        role: userRole,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
        registeredAt: new Date().toISOString(),
        language: currentLang
      };
      onLoginSuccess(newUser);
    }
  };

  return (
    <div 
      className="relative min-h-screen flex flex-col justify-between text-white font-sans bg-slate-950 bg-cover bg-center"
      style={{ backgroundImage: "url('/input_file_0.png')" }}
    >
      {/* Dark overlay for rich contrast */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0"></div>

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              VISIONCORE GROUP
            </span>
            <p className="text-[10px] text-slate-400">Jamoaviy Virtual Ishchi Platforma</p>
          </div>
        </div>
      </header>

      {/* Central Login Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-6 py-8 flex-grow flex flex-col items-center justify-center">
        <div className="w-full p-8 rounded-3xl bg-slate-900/95 border border-slate-800 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col space-y-5">
          
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center shadow-[0_8px_20px_rgba(245,158,11,0.3)] border border-white/20">
              <Crown className="w-7 h-7 text-white fill-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white pt-1">{t.welcome}</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              VisionCore Group virtual ofisiga kirish uchun ma'lumotlarni kiriting
            </p>
          </div>

          {/* Quick Creator / Roles Panel Selector */}
          <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                <Crown className="w-4 h-4 fill-amber-300/30 text-amber-300" />
                <span>Boshliq / Creator (To'liq Boshqaruv):</span>
              </div>
              <button
                type="button"
                onClick={() => setCredentials('Boshliq (Creator)', 'vcg-creator', 'vcg_mcc2ro')}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] transition active:scale-95 shadow-sm"
              >
                Kirish
              </button>
            </div>
            
            <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
              <span>Login: <strong className="text-amber-200">vcg-creator</strong> | Parol: <strong className="text-white">vcg_mcc2ro</strong></span>
              <button
                type="button"
                onClick={() => setShowRoleList(!showRoleList)}
                className="text-amber-400 hover:text-amber-300 flex items-center space-x-0.5 text-[10px] underline ml-2"
              >
                <span>Boshqa panellar</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showRoleList ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown for other roles */}
            {showRoleList && (
              <div className="pt-2 border-t border-amber-500/20 space-y-1.5 animate-in fade-in duration-200">
                <div 
                  onClick={() => setCredentials('Bosh Muhandis', 'vcg-admin', 'vcg_mcc2ro')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-blue-900/40 border border-slate-700/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <div className="text-[11px] font-bold text-white">Muhandis (Loyihalar & A'zolar)</div>
                      <div className="text-[10px] text-slate-400 font-mono">vcg-admin / vcg_mcc2ro</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-semibold">Tanlash</span>
                </div>

                <div 
                  onClick={() => setCredentials('AI Tadqiqotchi', 'vcg-researcher', 'vcg_mcc2ro')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-900/40 border border-slate-700/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <div className="text-[11px] font-bold text-white">Tadqiqotchi (Aqlli AI Qidiruv)</div>
                      <div className="text-[10px] text-slate-400 font-mono">vcg-researcher / vcg_mcc2ro</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Tanlash</span>
                </div>

                <div 
                  onClick={() => setCredentials('Arxitektor & Dizayner', 'vcg-designer', 'vcg_mcc2ro')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-purple-900/40 border border-slate-700/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <div>
                      <div className="text-[11px] font-bold text-white">Dizayner (Loyiha Arxitekturasi)</div>
                      <div className="text-[10px] text-slate-400 font-mono">vcg-designer / vcg_mcc2ro</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-400 font-semibold">Tanlash</span>
                </div>

                <div 
                  onClick={() => setCredentials('Tahlilchi (QA)', 'vcg-analyst', 'vcg_mcc2ro')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-900/40 border border-slate-700/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                    <div>
                      <div className="text-[11px] font-bold text-white">Tahlilchi (Test Sinovlari QA)</div>
                      <div className="text-[10px] text-slate-400 font-mono">vcg-analyst / vcg_mcc2ro</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-rose-400 font-semibold">Tanlash</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 text-center font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Ism (First Name) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Ismingiz</span>
              </label>
              <input 
                id="login-firstname-input"
                type="text"
                placeholder="Ismingizni kiriting"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl focus:border-blue-500 focus:bg-slate-800 focus:outline-none transition text-sm text-white placeholder-slate-500 font-medium"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Username</span>
              </label>
              <input 
                id="login-username-input"
                type="text"
                required
                placeholder="Usernameni kiriting (masalan: vcg-creator)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl focus:border-blue-500 focus:bg-slate-800 focus:outline-none transition text-sm text-white placeholder-slate-500 font-mono"
              />
            </div>

            {/* Parol */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Parol</span>
              </label>
              <div className="relative">
                <input 
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Parolni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl focus:border-blue-500 focus:bg-slate-800 focus:outline-none transition text-sm text-white placeholder-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              id="login-submit-btn"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 transition text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] mt-2 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Tizimga Kirish</span>
            </button>
          </form>

        </div>
      </main>

      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-500 border-t border-slate-900">
        VisionCore Group Workspace &copy; {new Date().getFullYear()} - Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
};
