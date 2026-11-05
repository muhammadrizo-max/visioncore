import React, { useState, useRef } from 'react';
import { 
  UserCheck, 
  Camera, 
  Shield, 
  Phone, 
  Mail, 
  Send, 
  Save, 
  Check, 
  Copy, 
  Key, 
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { User, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onUpdateAvatar: (newAvatarUrl: string) => void;
  darkMode: boolean;
  language?: Language;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onUpdateAvatar,
  darkMode,
  language = 'uz'
}) => {
  const t = getTranslation(language || user.language || 'uz');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for editable profile fields
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername || '');
  const [copiedId, setCopiedId] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...user,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      telegramUsername: telegramUsername.trim().startsWith('@') || !telegramUsername.trim() ? telegramUsername.trim() : `@${telegramUsername.trim()}`
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      
      {/* Profile Card Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      } shadow-sm space-y-6`}>
        
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          
          {/* Avatar Clickable File Upload */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              src={user.avatar} 
              alt={user.firstName || user.username} 
              className="w-24 h-24 rounded-3xl object-cover border-2 border-blue-500 shadow-md transition group-hover:opacity-85"
            />
            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera className="w-7 h-7 text-white" />
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {user.firstName || user.username} {user.lastName || ''}
              </h1>
              <span className={`uppercase font-extrabold text-xs px-2.5 py-0.5 rounded-full border ${
                user.role === 'creator'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : user.role === 'engineer'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}>
                {user.role}
              </span>
            </div>

            {/* 12-char ID with copy button */}
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-mono">Maxsus ID:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 font-mono font-bold text-blue-600 dark:text-blue-400">
                {user.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 text-slate-400 hover:text-blue-500 transition cursor-pointer"
                title="ID nusxalash"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              id="profile-change-avatar-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition inline-flex items-center space-x-1 shadow-sm active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.changeAvatar}</span>
            </button>
          </div>

        </div>

        {/* Success message */}
        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Profilingiz ma'lumotlari muvaffaqiyatli saqlandi!</span>
          </div>
        )}

        {/* Editable Profile Form */}
        <form onSubmit={handleSubmitProfile} className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <UserIcon className="w-4 h-4 text-blue-500" />
              <span>Shaxsiy Ma'lumotlarni Tahrirlash</span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Barcha maydonlar ixtiyoriy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Ism */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.firstName}
              </label>
              <input 
                type="text"
                placeholder="Ismingizni kiriting"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Familiya */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.lastName}
              </label>
              <input 
                type="text"
                placeholder="Familiyangizni kiriting"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Telefon */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.phone}</span>
              </label>
              <input 
                type="tel"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Telegram */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Send className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.telegram}</span>
              </label>
              <input 
                type="text"
                placeholder="@username"
                value={telegramUsername}
                onChange={e => setTelegramUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Email */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.email}</span>
              </label>
              <input 
                type="email"
                placeholder="elektron_pochta@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

          </div>

          {/* System Non-Editable Credentials & Roles Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Tizimdagi Username (o'zgarmas)</span>
              </span>
              <p className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{user.username}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>Tizimdagi Rol & Huquq</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs uppercase text-blue-600 dark:text-blue-400">{user.role}</span>
                <span className="text-[10px] text-slate-400">
                  {user.role === 'creator' ? '(Boshqaruvchi)' : '(Xavfsiz va cheklangan)'}
                </span>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-md flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
