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
  Crown, 
  ChevronDown,
  Info
} from 'lucide-react';
import { User, Language, RoleType } from '../types';
import { INITIAL_USERS } from '../mockData';
import { getTranslation } from '../lib/translations';
import { generateVcgUserId } from '../lib/idGenerator';

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

    // Password must be at least 6 characters (cannot be less than 6 as explicitly requested)
    if (!cleanPassword || cleanPassword.length < 6) {
      setErrorMsg('Parol kamida 6 ta belgidan iborat bo\'lishi shart! (6 tadan kam kiritish mumkin emas)');
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
        firstName: cleanFirstName || foundUser.firstName || cleanUsername
      };
      onLoginSuccess(updatedUser);
    } else {
      // Dynamic registration for new visitors / clients
      const isCreator = cleanUsername.includes('creator') || cleanUsername === 'vcg-creator';
      const isEngineer = cleanUsername.includes('admin') || cleanUsername === 'vcg-admin' || cleanUsername === 'cipher-res98100';

      // Oddiy userlar uchun qat'iy cheklangan "user" roli beriladi
      const userRole: RoleType = isCreator ? 'creator' : isEngineer ? 'engineer' : 'user';

      // 12-character ID generation: e.g. "vcg-74920183" (exactly 12 characters)
      const uniqueId = generateVcgUserId();

      const newUser: User = {
        id: uniqueId,
        username: cleanUsername,
        password: cleanPassword,
        firstName: cleanFirstName || cleanUsername,
        lastName: isCreator ? '(Boshliq)' : '',
        phone: '',
        telegramUsername: '',
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
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-0"></div>

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              VISIONCORE GROUP
            </span>
            <p className="text-[10px] text-slate-400">Jamoaviy Virtual Ishchi Platforma</p>
          </div>
        </div>
      </header>

      {/* Central Login Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 py-6 flex-grow flex flex-col items-center justify-center">
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col space-y-5">
          
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.3)] border border-white/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white pt-1">{t.welcome}</h2>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Ismingiz va foydalanuvchi ma'lumotlarini kiriting
            </p>
          </div>

          {/* Quick Creator / Admin Panel Access Helper */}
          <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                <Crown className="w-4 h-4 fill-amber-300/30 text-amber-300" />
                <span>Boshliq (Creator) Paneli:</span>
              </div>
              <button
                type="button"
                onClick={() => setCredentials('Boshliq (Creator)', 'vcg-creator', 'vcg_mcc2ro')}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition active:scale-95 shadow-sm cursor-pointer"
              >
                Kirish
              </button>
            </div>
            
            <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
              <span>Login: <strong className="text-amber-200">vcg-creator</strong> | Parol: <strong className="text-white">vcg_mcc2ro</strong></span>
              <button
                type="button"
                onClick={() => setShowRoleList(!showRoleList)}
                className="text-amber-400 hover:text-amber-300 flex items-center space-x-0.5 text-[10px] underline ml-2 cursor-pointer"
              >
                <span>Yordam</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showRoleList ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Hint for requirements */}
            {showRoleList && (
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-300 space-y-1 animate-in fade-in duration-200">
                <p>• <strong>Oddiy foydalanuvchi:</strong> Istalgan username va parol bilan yangi hisob ochishingiz mumkin.</p>
                <p>• <strong>ID:</strong> Kirishingiz bilan 12 xonali maxsus ID (masalan: <code>vcg-84920193</code>) beriladi.</p>
                <p>• <strong>Xavfsizlik:</strong> Parol kamida 6 belgidan iborat bo'lishi shart.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 text-center font-semibold leading-relaxed">
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
                placeholder="Ismingizni kiriting (masalan: Alisher)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/80 border border-slate-700 rounded-xl focus:border-blue-500 focus:bg-slate-800 focus:outline-none transition text-sm text-white placeholder-slate-500 font-medium"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Username</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">kamida 6 ta tavsiya</span>
              </div>
              <input 
                id="login-username-input"
                type="text"
                required
                placeholder="Usernameni kiriting"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/80 border border-slate-700 rounded-xl focus:border-blue-500 focus:bg-slate-800 focus:outline-none transition text-sm text-white placeholder-slate-500 font-mono"
              />
            </div>

            {/* Parol */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Parol</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-amber-400">kamida 6 ta shart, 8 ta tavsiya</span>
              </div>
              <div className="relative">
                <input 
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Kamida 6 ta belgi kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-slate-800/80 border border-slate-700 rounded-xl focus:border-blue-500 focus:bg-slate-800 focus:outline-none transition text-sm text-white placeholder-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              id="login-submit-btn"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 transition text-sm font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] mt-2 flex items-center justify-center space-x-2 cursor-pointer"
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
