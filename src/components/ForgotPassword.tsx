import React, { useState } from 'react';
import { apiPost } from '../lib/api';

export const ForgotPassword: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const d = await apiPost<{ message: string }>('/api/auth/forgot-password', {
        username,
        note: contact,
      });
      setMsg(d.message);
      setUsername('');
      setContact('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-blue-500 hover:underline cursor-pointer">
        Parolni unutdingizmi?
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4 rounded-2xl liquid-glass-subtle">
      <p className="text-xs text-slate-600 dark:text-slate-300">
        Login kiriting va bog'lanish uchun Telegram yoki telefon raqamingizni yozing. Admin siz bilan bog'lanib, yangi parol beradi.
      </p>
      <input
        type="text"
        placeholder="Login (username)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full px-3 py-2 rounded-xl liquid-glass-subtle text-xs"
        required
      />
      <input
        type="text"
        placeholder="Telegram @username yoki telefon"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        className="w-full px-3 py-2 rounded-xl liquid-glass-subtle text-xs"
        required
      />
      <button type="submit" disabled={busy} className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer disabled:opacity-60">
        {busy ? 'Yuborilmoqda...' : "So'rov yuborish"}
      </button>
      {msg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>}
    </form>
  );
};
