import React, { useState } from 'react';
import { Shield, Lock, UserCheck, Eye, EyeOff, Sparkles, User as UserIcon, LogIn } from 'lucide-react';
import { User, Language } from '../types';
import { getTranslation } from '../lib/translations';
import { INITIAL_USERS } from '../mockData';

interface LandingPageProps {
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  language: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  allUsers,
  onLoginSuccess,
  language
}) => {
  const t = getTranslation(language);

  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanFirstName = firstName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMsg('Username kiriting!');
      return;
    }
    if (!cleanPassword) {
      setErrorMsg('Parolni kiriting!');
      return;
    }

    // Standardize cipher- prefix check
    const formattedUsername = cleanUsername.startsWith('cipher-') ? cleanUsername : `cipher-${cleanUsername}`;

    // Combine current user list with initial default users
    const combinedUsers = [...allUsers, ...INITIAL_USERS];

    // Find user by username & password
    const foundUser = combinedUsers.find(
      u =>
        u &&
        u.username &&
        typeof u.username === 'string' &&
        (u.username.toLowerCase() === cleanUsername || u.username.toLowerCase() === formattedUsername) &&
        u.password === cleanPassword
    );

    if (foundUser) {
      const updatedUser: User = {
        ...foundUser,
        firstName: cleanFirstName || foundUser.firstName || "A'zo"
      };
      onLoginSuccess(updatedUser);
    } else {
      // Create new registered team member dynamically
      const newUser: User = {
        id: `CIPHER-USR-${Date.now().toString().slice(-5)}`,
        username: cleanUsername,
        password: cleanPassword,
        firstName: cleanFirstName || "A'zo",
        lastName: '',
        phone: '',
        email: `${cleanUsername}@cipher.uz`,
        role: (cleanUsername.includes('engineer') || cleanUsername === 'cipher-res98100') ? 'engineer' : 'user',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
        registeredAt: new Date().toISOString(),
        language: language || 'uz'
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
              CIPHER WORKSPACE
            </span>
            <p className="text-[10px] text-slate-400">Jamoaviy Ishchi Platforma</p>
          </div>
        </div>
      </header>

      {/* Central Login Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-6 py-8 flex-grow flex flex-col items-center justify-center">
        <div className="w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col space-y-6">
          
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.4)] border border-white/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white pt-2">{t.welcome}</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              Tizimga kirish yoki a'zo bo'lish uchun ma'lumotlarni kiriting
            </p>
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
                placeholder="Usernameni kiriting"
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
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 transition text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] mt-2 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Kirish / A'zo bo'lish</span>
            </button>
          </form>

        </div>
      </main>

      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-500 border-t border-slate-900">
        CIPHER Team Workspace &copy; {new Date().getFullYear()} - Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
};
