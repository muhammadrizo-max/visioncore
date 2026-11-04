import React, { useRef } from 'react';
import { UserCheck, Camera, Shield } from 'lucide-react';
import { User } from '../types';
import { getTranslation } from '../lib/translations';

interface ProfileViewProps {
  user: User;
  onUpdateAvatar: (newAvatarUrl: string) => void;
  darkMode: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateAvatar,
  darkMode
}) => {
  const t = getTranslation(user.language || 'uz');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      
      {/* Profile Card Header */}
      <div className={`p-8 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      } shadow-sm space-y-6`}>
        
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          
          {/* Avatar Clickable File Upload */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              src={user.avatar} 
              alt={user.firstName} 
              className="w-24 h-24 rounded-3xl object-cover border-2 border-blue-500 shadow-md transition group-hover:opacity-80"
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

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h1 className="text-xl font-bold">{user.firstName} {user.lastName}</h1>
              <span className="uppercase font-bold text-xs bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                {user.role}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">CIPHER ID: {user.id}</p>

            <button
              id="profile-change-avatar-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition inline-flex items-center space-x-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.changeAvatar}</span>
            </button>
          </div>

        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Foydalanivchi Nomi (Username)</span>
            </span>
            <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{user.username}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Rol va Huquq</span>
            </span>
            <p className="font-mono font-bold uppercase text-blue-500">{user.role}</p>
          </div>

        </div>

      </div>

    </div>
  );
};
