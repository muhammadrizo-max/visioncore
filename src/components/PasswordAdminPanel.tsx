import React, { useState } from 'react';
import { KeyRound, Search } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface Props {
  onStatus: (msg: string) => void;
}

export const PasswordAdminPanel: React.FC<Props> = ({ onStatus }) => {
  const [lookupId, setLookupId] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = lookupId.replace(/\s+/g, '');
    if (!id) return;
    try {
      setFoundUser(await api<User>(`/api/admin/lookup?id=${encodeURIComponent(id)}`));
    } catch (err) {
      setFoundUser(null);
      onStatus(err instanceof Error ? err.message : 'Qidiruvda xatolik');
    }
  };

  const resetFor = async (userId: string, username: string) => {
    if (!confirm(`"${username}" uchun yangi parol yaratilsinmi? Eski parol ishlamay qoladi.`)) return;
    try {
      const d = await api<{ password: string }>('/api/admin/members/reset-password', {
        method: 'POST',
        body: JSON.stringify({ id: userId }),
      });
      onStatus(`"${username}" yangi paroli: ${d.password} (foydalanuvchiga yuboring)`);
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Xatolik');
    }
  };

  return (
    <div className="p-6 rounded-3xl liquid-glass space-y-4 h-full flex flex-col justify-between">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>ID orqali parolni yangilash</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            A'zo yoki foydalanuvchi ID sini kiriting va uning uchun xavfsiz yangi parol generatsiya qiling.
          </p>
        </div>

        <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="vcg-XXXXXXXX"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center gap-2 justify-center shadow-md active:scale-95 transition">
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
              <div className="font-bold text-sm text-slate-900 dark:text-white">{foundUser.firstName || foundUser.username} {foundUser.lastName}</div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{foundUser.id} · {foundUser.username} · {foundUser.role}</div>
            </div>
          </div>
          <button
            onClick={() => resetFor(foundUser.id, foundUser.username)}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
          >
            Yangi parol berish
          </button>
        </div>
      )}
    </div>
  );
};
