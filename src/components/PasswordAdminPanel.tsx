import React, { useEffect, useState } from 'react';
import { KeyRound, Search, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface PasswordRequest {
  id: string;
  user_id: string;
  username: string;
  note: string | null;
  created_at: string;
}

interface Props {
  onStatus: (msg: string) => void;
}

export const PasswordAdminPanel: React.FC<Props> = ({ onStatus }) => {
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  const [lookupId, setLookupId] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);

  const loadRequests = async () => {
    try {
      setRequests(await api<PasswordRequest[]>('/api/admin/password-requests'));
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'So\'rovlarni yuklab bo\'lmadi');
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = lookupId.replace(/\s+/g, '');
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

  const resolveRequest = async (r: PasswordRequest) => {
    try {
      const d = await api<{ password: string; username: string }>(
        `/api/admin/password-requests/${r.id}/resolve`,
        { method: 'POST' },
      );
      onStatus(`"${d.username}" yangi paroli: ${d.password} (${r.note || 'aloqa ma\'lumoti yo\'q'} orqali yuboring)`);
      await loadRequests();
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Xatolik');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl liquid-glass space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>ID orqali parolni yangilash</span>
        </h3>
        <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="vcg-XXXXXXXX"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
          />
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer flex items-center gap-2 justify-center">
            <Search className="w-3.5 h-3.5" />
            <span>Qidirish</span>
          </button>
        </form>

        {foundUser && (
          <div className="p-4 rounded-2xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <img src={foundUser.avatar} alt={foundUser.username} className="w-10 h-10 rounded-full object-cover" />
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

      <div className="p-6 rounded-3xl liquid-glass space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Parol tiklash so'rovlari ({requests.length})</h3>
          <button onClick={loadRequests} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Hozircha ochiq so'rovlar yo'q.</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl liquid-glass-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{r.username}</div>
                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{r.user_id}</div>
                <div className="text-slate-600 dark:text-slate-300 mt-1">Aloqa: {r.note || '—'}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(r.created_at).toLocaleString('uz-UZ')}</div>
              </div>
              <button
                onClick={() => resolveRequest(r)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Yangi parol yaratish
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
