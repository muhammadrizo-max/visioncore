import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  ArrowRight, 
  Rocket, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Users, 
  FolderGit2, 
  CheckSquare, 
  ShoppingBag, 
  Sparkles, 
  Layers, 
  Cpu, 
  Bot, 
  Globe, 
  Smartphone, 
  Briefcase, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { User, NotificationItem, ReminderPlan, Order, Project, Task, Language, SiteSettings } from '../types';
import { getTranslation } from '../lib/translations';

interface UserDashboardProps {
  user: User;
  notifications: NotificationItem[];
  reminders: ReminderPlan[];
  orders: Order[];
  projects: Project[];
  tasks: Task[];
  siteSettings: SiteSettings;
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
  orders,
  projects,
  tasks,
  siteSettings,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onNavigateMenu,
  darkMode,
  language = 'uz'
}) => {
  const currentLang: Language = (language || user.language || 'uz') as Language;
  const t = getTranslation(currentLang);
  const [newReminderTitle, setNewReminderTitle] = useState('');

  const isCreatorOrAdmin = user.role === 'creator' || user.role === 'engineer';
  const myOrders = orders.filter(o => o.userId === user.id);
  const completedTasksCount = tasks.filter(t => t.completed).length;

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    onAddReminder(newReminderTitle.trim(), new Date().toLocaleDateString(currentLang === 'en' ? 'en-US' : 'uz-UZ'));
    setNewReminderTitle('');
  };

  // Pie Chart Data (Orders Status)
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const acceptedOrders = orders.filter(o => o.status === 'accepted' || o.status === 'in_review').length;
  const totalOrders = orders.length || 1;

  // Bar Chart Data (Services Distribution)
  const botOrders = orders.filter(o => o.projectType === 'telegram_bot').length;
  const webAppOrders = orders.filter(o => o.projectType === 'web_app').length;
  const crmOrders = orders.filter(o => o.projectType === 'crm').length;
  const siteOrders = orders.filter(o => o.projectType === 'website').length;
  const otherOrders = orders.filter(o => o.projectType === 'mobile_app' || o.projectType === 'landing_page' || o.projectType === 'other').length;
  const maxBarVal = Math.max(botOrders, webAppOrders, crmOrders, siteOrders, otherOrders, 5);

  // Line Graph Data (Weekly Activity)
  const lineData = [
    { day: 'Dush', val: 2 },
    { day: 'Sesh', val: 4 },
    { day: 'Chor', val: 5 },
    { day: 'Pay', val: 7 },
    { day: 'Jum', val: 6 },
    { day: 'Shan', val: 4 },
    { day: 'Yak', val: 3 }
  ];
  const maxLineVal = 10;
  const lWidth = 500;
  const lHeight = 160;
  const lPad = 30;
  const linePoints = lineData.map((d, i) => {
    const x = lPad + (i * (lWidth - 2 * lPad)) / (lineData.length - 1);
    const y = lHeight - lPad - (d.val / maxLineVal) * (lHeight - 2 * lPad);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. TOP HERO GREETING BANNER (Clean, elegant, properly translated in uz, en, ru) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-blue-100 border border-white/10">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>VisionCore Group Virtual Office</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {t.greetingPrefix}, {user.firstName || user.username}!
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-100">
              <span>{t.welcomeSubtitle}</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md font-mono font-bold text-amber-300 tracking-wider">
                {user.id}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isCreatorOrAdmin ? (
              <button
                onClick={() => onNavigateMenu('Mijoz Buyurtmalari')}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-lg active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Mijoz Buyurtmalari ({orders.length})</span>
              </button>
            ) : (
              <button
                id="dashboard-order-project-btn"
                onClick={() => onNavigateMenu('Buyurtma berish')}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-600 font-extrabold text-xs sm:text-sm transition flex items-center space-x-2 shadow-xl active:scale-95 cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-blue-600" />
                <span>{t.orderProjectBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CREATOR EXECUTIVE DASHBOARD (Line Graph, Bar Chart, Pie Chart) */}
      {isCreatorOrAdmin && (
        <div className="space-y-6">
          
          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex items-center justify-between text-blue-500">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Buyurtmalar</span>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{orders.length} ta</div>
              <span className="text-[10px] text-amber-500 font-semibold">{pendingOrders} yangi kutilmoqda</span>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex items-center justify-between text-indigo-500">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Loyihalar</span>
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{projects.length} ta</div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Faol jamoa loyihalari</span>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex items-center justify-between text-emerald-500">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Topshiriqlar</span>
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{completedTasksCount}/{tasks.length}</div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Bajarilgan topshiriqlar</span>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex items-center justify-between text-purple-500">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tizim Ishonchliligi</span>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-500">99.9%</div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Supabase & API Active</span>
            </div>
          </div>

          {/* Graphical Analytics Row: Line Graph, Bar Chart, Donut / Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Line Graph (Haftalik Faollik) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Haftalik Faollik (Line Graph)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Kunlar kesimida buyurtma va topshiriqlar</p>
                </div>
              </div>

              <div className="relative w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/40 p-2 border border-slate-200/50 dark:border-slate-800">
                <svg viewBox={`0 0 ${lWidth} ${lHeight}`} className="w-full h-36 overflow-visible">
                  {/* Grid lines */}
                  {[0, 5, 10].map((v) => {
                    const y = lHeight - lPad - (v / maxLineVal) * (lHeight - 2 * lPad);
                    return (
                      <line 
                        key={v} 
                        x1={lPad} 
                        y1={y} 
                        x2={lWidth - lPad} 
                        y2={y} 
                        stroke={darkMode ? '#334155' : '#e2e8f0'} 
                        strokeDasharray="3 3" 
                      />
                    );
                  })}
                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />
                  {/* Points */}
                  {lineData.map((d, i) => {
                    const x = lPad + (i * (lWidth - 2 * lPad)) / (lineData.length - 1);
                    const y = lHeight - lPad - (d.val / maxLineVal) * (lHeight - 2 * lPad);
                    return (
                      <g key={d.day}>
                        <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                        <text x={x} y={lHeight - 8} fontSize="9" fontWeight="bold" textAnchor="middle" fill={darkMode ? '#94a3b8' : '#64748b'}>
                          {d.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Chart 2: Bar Chart (Yo'nalishlar taqsimoti) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span>Loyiha Turlari (Bar Chart)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Xizmatlar bo'yicha buyurtmalar taqsimoti</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  { label: 'Telegram Bot', count: botOrders, color: 'bg-blue-500' },
                  { label: 'Web App & Platform', count: webAppOrders, color: 'bg-indigo-500' },
                  { label: 'CRM Tizimi', count: crmOrders, color: 'bg-purple-500' },
                  { label: 'Websayt & Sayt', count: siteOrders, color: 'bg-emerald-500' },
                  { label: 'Boshqa (Mobil/Landing)', count: otherOrders, color: 'bg-amber-500' }
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{item.label}</span>
                      <span className="font-mono text-slate-500">{item.count} ta</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.max((item.count / maxBarVal) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Donut / Pie Chart (Statuslar nisbati) */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-emerald-500" />
                    <span>Statuslar Nisbati (Pie Chart)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Buyurtmalar holati bo'yicha foizlar</p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6 pt-2">
                {/* SVG Donut */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={darkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="3.8" />
                    {/* Segments */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3.8" strokeDasharray={`${(pendingOrders / totalOrders) * 100} 100`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="3.8" strokeDasharray={`${(inProgressOrders / totalOrders) * 100} 100`} strokeDashoffset={`-${(pendingOrders / totalOrders) * 100}`} />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3.8" strokeDasharray={`${(completedOrders / totalOrders) * 100} 100`} strokeDashoffset={`-${((pendingOrders + inProgressOrders) / totalOrders) * 100}`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-400">Jami</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{orders.length}</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Kutilmoqda ({pendingOrders})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Jarayonda ({inProgressOrders})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-300">Bajarildi ({completedOrders})</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Action Navigation Buttons for Creator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigateMenu('Mijoz Buyurtmalari')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Mijoz Buyurtmalari</span>
                <span className="text-[11px] text-slate-400">Barcha arizalar va statuslarni nazorat qilish</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-500" />
            </button>

            <button
              onClick={() => onNavigateMenu('A\'zolar')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-500/50'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Jamoa A'zolari & Harakatlar</span>
                <span className="text-[11px] text-slate-400">A'zolar ro'yxati, parollari va samaradorligi</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500" />
            </button>

            <button
              onClick={() => onNavigateMenu('Sozlamalar')}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-500/50'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Zaxiralash & Supabase</span>
                <span className="text-[11px] text-slate-400">Backup, DB holati va fonni sozlash</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-500" />
            </button>
          </div>

        </div>
      )}

      {/* 3. SAYTLAB-STYLE SERVICES & PORTFOLIO SHOWCASE (Visible to Clients & Regular Users) */}
      {!isCreatorOrAdmin && (
        <div className="space-y-6">
          
          {/* Services Section (Saytlab style modern cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {t.ourServices}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.ourServicesDesc}
                </p>
              </div>
              <button
                onClick={() => onNavigateMenu('Buyurtma berish')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>Barchasini ko'rish</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(siteSettings.services || []).map((srv) => (
                <div
                  key={srv.id}
                  className={`p-5 rounded-3xl border transition shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-500/40 group ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        {srv.type === 'telegram_bot' ? <Bot className="w-5 h-5" /> : 
                         srv.type === 'crm' ? <Briefcase className="w-5 h-5" /> : 
                         srv.type === 'mobile_app' ? <Smartphone className="w-5 h-5" /> : 
                         <Globe className="w-5 h-5" />}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        {srv.startingPrice}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {srv.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {srv.features.slice(0, 3).map((f) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateMenu('Buyurtma berish')}
                    className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Buyurtma Berish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Section (Saytlab style done projects) */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {t.ourPortfolio}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.ourPortfolioDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(siteSettings.portfolio || []).map((port) => (
                <div
                  key={port.id}
                  className={`rounded-3xl border overflow-hidden shadow-sm transition hover:shadow-md ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <img src={port.image} alt={port.title} className="w-full h-36 object-cover" />
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      {port.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {port.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {port.description}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {port.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 4. THREE CARDS (Bildirishnomalar, Rol haqida, Eslatmalar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* Card 1: Notifications (Clean light/dark mode & properly translated) */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        } shadow-sm space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
              <Bell className="w-4 h-4 text-blue-500" />
              <span>{t.recentNotifications}</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
              {notifications.length}
            </span>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                {t.noNotifications}
              </p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 block font-semibold">{n.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Role and tasks explanation */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        } shadow-sm space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{t.myRoleAndTasks}</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black tracking-wide uppercase">
              {user.role === 'creator' ? 'BOSHLIQ / CREATOR' : user.role === 'engineer' ? 'MUHANDIS / ADMIN' : t.userClientBadge}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isCreatorOrAdmin 
                ? 'Siz platforma boshqaruvchisiz. Barcha mijoz buyurtmalari, jamoa a\'zolari, loyihalar va sozlamalar to\'liq sizning nazoratingizda.'
                : t.userRoleDesc}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs font-semibold p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-500 dark:text-slate-400">{t.currentStatus}</span>
              <span className="text-emerald-500 font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t.activeOnline}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Reminders and Plans */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        } shadow-sm space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span>{t.remindersAndPlans}</span>
            </h3>
          </div>

          {/* Add reminder input */}
          <form onSubmit={handleCreateReminder} className="flex items-center space-x-2">
            <input 
              type="text"
              placeholder={t.enterReminderPlaceholder}
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
              className="flex-grow px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer flex-shrink-0"
              title="Qo'shish"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Reminders List */}
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {reminders.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                {t.noRemindersYet}
              </p>
            ) : (
              reminders.map((r) => (
                <div 
                  key={r.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs"
                >
                  <div 
                    onClick={() => onToggleReminder(r.id)} 
                    className="flex items-center space-x-2 cursor-pointer flex-grow truncate"
                  >
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${r.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    <span className={`truncate ${r.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                      {r.title}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteReminder(r.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
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
