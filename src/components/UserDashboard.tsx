import React, { useState } from 'react';
import { Bell, ShieldCheck, Calendar, Plus, Check, Trash2, Sparkles, Send, ShoppingBag } from 'lucide-react';
import { User, NotificationItem, ReminderPlan, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface UserDashboardProps {
  user: User;
  notifications: NotificationItem[];
  reminders: ReminderPlan[];
  onAddReminder: (title: string, date: string) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onNavigateMenu: (menu: string) => void;
  darkMode: boolean;
  language?: Language;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  notifications,
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onNavigateMenu,
  darkMode,
  language = 'uz'
}) => {
  const t = getTranslation(language || user.language || 'uz');

  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    onAddReminder(newReminderTitle.trim(), newReminderDate);
    setNewReminderTitle('');
  };

  // Role responsibility descriptions
  const getRoleResponsibilities = (role: string) => {
    switch (role) {
      case 'creator':
        return {
          title: "Boshliq / Creator (Master)",
          desc: "Guruh va sayt boshlig'i sifatidagi vazifalaringiz: Butun tizim, barcha panellar, loyihalar, a'zolarning rollari va xavfsizlik sozlamalari ustidan to'liq nazorat yuritish.",
          actionLabel: "Creator Paneliga o'tish",
          actionMenu: "Creator Panel",
          icon: Sparkles
        };
      case 'engineer':
        return {
          title: "Bosh Muhandis (Engineer)",
          desc: "Guruh yetakchisi sifatidagi vazifalaringiz: Yangi a'zolarni qo'shish, loyihalar kodi hamda arxitekturasini muvofiqlashtirish, xavfsizlik va umumiy tizim barqarorligini ta'minlash.",
          actionLabel: "Loyihalarni ko'rish",
          actionMenu: "Loyihalar",
          icon: Send
        };
      case 'researcher':
        return {
          title: "Tadqiqotchi (Researcher)",
          desc: "Sizning vazifangiz: Aqlli qidiruv (Gemini, Tavily, SerpAPI, Exa, Firecrawl) orqali dolzarb texnik ma'lumotlarni to'plash va guruh uchun tahlil qilish.",
          actionLabel: "Aqlli qidiruvni ochish",
          actionMenu: "Aqlli qidiruv",
          icon: Send
        };
      case 'designer':
        return {
          title: "Dizayner (Designer)",
          desc: "Sizning vazifangiz: Loyihalarning arxitektura vizualizatsiyasi va dizayn do'skasini shakllantirish hamda Word (.doc) ko'rinishida hujjatlashtirish.",
          actionLabel: "Arxitekturani yaratish",
          actionMenu: "Loyiha arxitekturasi",
          icon: Send
        };
      case 'analyst':
        return {
          title: "Tahlilchi (Analyst)",
          desc: "Sizning vazifangiz: Ishlab chiqilgan modul va barcha loyihalarni testdan o'tkazish, test natijalarini (Success / Failed) qayd etib borish va bug severity darajalarini belgilash.",
          actionLabel: "Test natijalarini kiritish",
          actionMenu: "Test Natijalari",
          icon: Send
        };
      default:
        return {
          title: "Foydalanuvchi / Mijoz",
          desc: "Xush kelibsiz! Siz ushbu platformada Telegram bot, vebsayt, web app, CRM va mobil ilovalarga qulay buyurtma berishingiz, shaxsiy qaydlaringizni yuritishingiz va jamoamiz bilan bog'lanishingiz mumkin.",
          actionLabel: "Loyihaga Buyurtma Berish",
          actionMenu: "Buyurtma berish",
          icon: ShoppingBag
        };
    }
  };

  const roleInfo = getRoleResponsibilities(user.role);
  const ActionIcon = roleInfo.icon;
  const userReminders = reminders.filter(r => r.userId === user.id);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>VisionCore Group Virtual Office</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Assalomu alaykum, {user.firstName || user.username}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Platformaga xush kelibsiz. Sizning maxsus ID raqamingiz: <strong className="bg-white/20 px-2 py-0.5 rounded font-mono font-bold">{user.id}</strong>
            </p>
          </div>

          <button
            id="dashboard-action-btn"
            onClick={() => onNavigateMenu(roleInfo.actionMenu)}
            className="px-6 py-3.5 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs sm:text-sm transition shadow-lg flex items-center space-x-2 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>{roleInfo.actionLabel}</span>
            <ActionIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Notifications */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        } shadow-sm flex flex-col justify-between space-y-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.notifications}</h2>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {notifications.length} ta
            </span>
          </div>

          <div className="space-y-3 flex-grow overflow-y-auto max-h-64 pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t.noNotifications}</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-start">
                  <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">{n.message}</p>
                  <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">{n.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. User Role & Responsibilities */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        } shadow-sm flex flex-col justify-between space-y-4`}>
          <div className="flex items-center space-x-2 border-b pb-3 border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.myRoleInfo}</h2>
          </div>

          <div className="space-y-3 flex-grow">
            <div className="inline-block px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
              {roleInfo.title}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {roleInfo.desc}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between">
            <span className="font-semibold">Hozirgi Rejim:</span>
            <span className="font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">Faol (Online)</span>
          </div>
        </div>

        {/* 3. Reminders & Plans */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        } shadow-sm flex flex-col justify-between space-y-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.remindersAndPlans}</h2>
            </div>
          </div>

          {/* Create Reminder Form */}
          <form onSubmit={handleCreateReminder} className="flex gap-2">
            <input 
              id="dashboard-reminder-title-input"
              type="text"
              placeholder="Eslatma nomini kiriting..."
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
              className="flex-grow px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <button
              id="dashboard-add-reminder-btn"
              type="submit"
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition active:scale-95 cursor-pointer"
              title={t.addReminder}
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* List of Reminders */}
          <div className="space-y-2 flex-grow overflow-y-auto max-h-48 pr-1">
            {userReminders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">{t.noReminders}</p>
            ) : (
              userReminders.map((r) => (
                <div 
                  key={r.id} 
                  className={`p-3 rounded-2xl border transition flex items-center justify-between text-xs ${
                    r.completed
                      ? 'bg-slate-100 dark:bg-slate-800/40 border-transparent text-slate-400 line-through'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <button
                      id={`reminder-toggle-btn-${r.id}`}
                      onClick={() => onToggleReminder(r.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition cursor-pointer ${
                        r.completed ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {r.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className="truncate font-medium">{r.title}</span>
                  </div>

                  <button
                    id={`reminder-delete-btn-${r.id}`}
                    onClick={() => onDeleteReminder(r.id)}
                    className="text-red-500 hover:text-red-600 p-1 transition ml-2 flex-shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
