import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
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
  Bot, 
  Globe, 
  Smartphone, 
  Briefcase, 
  ChevronRight
} from 'lucide-react';
import { User, ReminderPlan, Order, Project, Task, MemberActivity, SiteSettings } from '../types';
import { PortfolioShowcase } from './PortfolioShowcase';

interface UserDashboardProps {
  user: User;
  allUsers: User[];
  reminders: ReminderPlan[];
  orders: Order[];
  projects: Project[];
  tasks: Task[];
  activities: MemberActivity[];
  siteSettings: SiteSettings;
  supabaseConnected?: boolean;
  onAddReminder: (title: string, date: string) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onNavigateMenu: (menu: string) => void;
  darkMode: boolean;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  allUsers,
  reminders,
  orders,
  projects,
  tasks,
  activities,
  siteSettings,
  supabaseConnected = false,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onNavigateMenu,
  darkMode
}) => {
  const [newReminderTitle, setNewReminderTitle] = useState('');

  const isCreatorOrAdmin = user.role === 'creator' || user.role === 'engineer';
  const completedTasksCount = tasks.filter(t => t.completed).length;

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    onAddReminder(newReminderTitle.trim(), new Date().toLocaleDateString('uz-UZ'));
    setNewReminderTitle('');
  };

  // Real Pie Chart Data (Orders Status)
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalOrders = orders.length;

  // Real Bar Chart Data (Services Distribution)
  const botOrders = orders.filter(o => o.projectType === 'telegram_bot').length;
  const webAppOrders = orders.filter(o => o.projectType === 'web_app').length;
  const crmOrders = orders.filter(o => o.projectType === 'crm').length;
  const siteOrders = orders.filter(o => o.projectType === 'website').length;
  const otherOrders = orders.filter(o => o.projectType === 'mobile_app' || o.projectType === 'landing_page' || o.projectType === 'other').length;
  const maxBarVal = Math.max(botOrders, webAppOrders, crmOrders, siteOrders, otherOrders, 1);

  // Real Line Graph Data (Last 7 days activity computed from actual orders, tasks, activities)
  const lineData = useMemo(() => {
    const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const result: { day: string; dateStr: string; val: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDay = d.toISOString().split('T')[0];

      const ordersOnDay = orders.filter(o => o.createdAt && o.createdAt.startsWith(isoDay)).length;
      const tasksOnDay = tasks.filter(t => t.date && t.date.startsWith(isoDay)).length;
      const actsOnDay = activities.filter(a => a.timestamp && a.timestamp.startsWith(isoDay)).length;

      result.push({
        day: dayNames[d.getDay()],
        dateStr: isoDay,
        val: ordersOnDay + tasksOnDay + actsOnDay
      });
    }
    return result;
  }, [orders, tasks, activities]);

  const maxLineVal = Math.max(...lineData.map(d => d.val), 5);
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
      
      {/* 1. TOP HERO GREETING BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-700/90 backdrop-blur-xl border border-white/20 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-blue-50 border border-white/15">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>VisionCore Group Virtual Office</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Assalomu alaykum, {user.firstName || user.username}!
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-100">
              <span>Platformaga xush kelibsiz. Sizning maxsus ID raqamingiz:</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md font-mono font-bold text-amber-300 tracking-wider border border-white/15">
                {user.id}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isCreatorOrAdmin ? (
              <button
                onClick={() => onNavigateMenu('Mijoz Buyurtmalari')}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-lg active:scale-95 cursor-pointer"
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
                <span>Loyihaga Buyurtma Berish</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CREATOR EXECUTIVE DASHBOARD (100% Real Data + Liquid Glass Cards) */}
      {isCreatorOrAdmin && (
        <div className="space-y-6">
          
          {/* Real KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl liquid-glass">
              <div className="flex items-center justify-between text-blue-500">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Buyurtmalar</span>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{orders.length} ta</div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{pendingOrders} ta kutilmoqda</span>
            </div>

            <div className="p-5 rounded-3xl liquid-glass">
              <div className="flex items-center justify-between text-indigo-500">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Loyihalar</span>
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{projects.length} ta</div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Faol jamoa loyihalari</span>
            </div>

            <div className="p-5 rounded-3xl liquid-glass">
              <div className="flex items-center justify-between text-emerald-500">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Topshiriqlar</span>
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{completedTasksCount}/{tasks.length}</div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Bajarilgan topshiriqlar</span>
            </div>

            <div className="p-5 rounded-3xl liquid-glass">
              <div className="flex items-center justify-between text-purple-500">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Foydalanuvchilar</span>
                <Users className="w-5 h-5" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{allUsers.length} ta</div>
              <span className={`text-[10px] font-bold flex items-center space-x-1 ${supabaseConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{supabaseConnected ? 'Supabase Real-Time Ulangan' : 'Supabase Sozlanmagan'}</span>
              </span>
            </div>
          </div>

          {/* Real Graphical Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Real Line Graph */}
            <div className="p-6 rounded-3xl liquid-glass space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Haftalik Faollik (Line Graph)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">So'nggi 7 kunlik real harakatlar</p>
                </div>
              </div>

              <div className="relative w-full overflow-hidden rounded-2xl liquid-glass-subtle p-2">
                <svg viewBox={`0 0 ${lWidth} ${lHeight}`} className="w-full h-36 overflow-visible">
                  {[0, Math.round(maxLineVal / 2), maxLineVal].map((v) => {
                    const y = lHeight - lPad - (v / maxLineVal) * (lHeight - 2 * lPad);
                    return (
                      <g key={v}>
                        <line 
                          x1={lPad} 
                          y1={y} 
                          x2={lWidth - lPad} 
                          y2={y} 
                          stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} 
                          strokeDasharray="3 3" 
                        />
                        <text x={lPad - 6} y={y + 3} fontSize="8" textAnchor="end" fill={darkMode ? '#94a3b8' : '#64748b'}>
                          {v}
                        </text>
                      </g>
                    );
                  })}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />
                  {lineData.map((d, i) => {
                    const x = lPad + (i * (lWidth - 2 * lPad)) / (lineData.length - 1);
                    const y = lHeight - lPad - (d.val / maxLineVal) * (lHeight - 2 * lPad);
                    return (
                      <g key={d.dateStr}>
                        <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                        <text x={x} y={lHeight - 8} fontSize="9" fontWeight="bold" textAnchor="middle" fill={darkMode ? '#94a3b8' : '#475569'}>
                          {d.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Chart 2: Real Bar Chart */}
            <div className="p-6 rounded-3xl liquid-glass space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span>Loyiha Turlari (Bar Chart)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Xizmatlar bo'yicha real taqsimot</p>
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
                      <span className="font-mono text-slate-500 dark:text-slate-400">{item.count} ta</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: item.count > 0 ? `${(item.count / maxBarVal) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Real Donut / Pie Chart */}
            <div className="p-6 rounded-3xl liquid-glass space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-emerald-500" />
                    <span>Statuslar Nisbati (Pie Chart)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Buyurtmalar holati bo'yicha real foizlar</p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6 pt-2">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'} strokeWidth="3.8" />
                    {totalOrders > 0 && (
                      <>
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3.8" strokeDasharray={`${(pendingOrders / totalOrders) * 100} 100`} strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="3.8" strokeDasharray={`${(inProgressOrders / totalOrders) * 100} 100`} strokeDashoffset={`-${(pendingOrders / totalOrders) * 100}`} />
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3.8" strokeDasharray={`${(completedOrders / totalOrders) * 100} 100`} strokeDashoffset={`-${((pendingOrders + inProgressOrders) / totalOrders) * 100}`} />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jami</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{totalOrders}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-700 dark:text-slate-300">Kutilmoqda ({pendingOrders})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="text-slate-700 dark:text-slate-300">Jarayonda ({inProgressOrders})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700 dark:text-slate-300">Bajarildi ({completedOrders})</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigateMenu('Mijoz Buyurtmalari')}
              className="p-4 rounded-2xl liquid-glass text-left flex items-center justify-between transition cursor-pointer active:scale-98 hover:border-blue-500/50"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Mijoz Buyurtmalari</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Barcha arizalar va statuslarni nazorat qilish</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-500" />
            </button>

            <button
              onClick={() => onNavigateMenu('A\'zolar')}
              className="p-4 rounded-2xl liquid-glass text-left flex items-center justify-between transition cursor-pointer active:scale-98 hover:border-indigo-500/50"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Jamoa A'zolari & Harakatlar</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">A'zolar ro'yxati, parollari va samaradorligi</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500" />
            </button>

            <button
              onClick={() => onNavigateMenu('Sozlamalar')}
              className="p-4 rounded-2xl liquid-glass text-left flex items-center justify-between transition cursor-pointer active:scale-98 hover:border-purple-500/50"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Zaxiralash & Supabase</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Backup, DB holati va fonni sozlash</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-500" />
            </button>
          </div>

        </div>
      )}

      {/* 3. CLIENT SERVICES & PORTFOLIO SHOWCASE */}
      {!isCreatorOrAdmin && (
        <div className="space-y-6">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Bizning Xizmatlarimiz
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Biznesingizni yangi bosqichga olib chiqadigan professional dasturiy ta'minotlar
                </p>
              </div>
              <button
                onClick={() => onNavigateMenu('Buyurtma berish')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Barchasini ko'rish</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(siteSettings.services || []).map((srv) => (
                <div
                  key={srv.id}
                  className="p-5 rounded-3xl liquid-glass transition flex flex-col justify-between space-y-4 hover:border-blue-500/40 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        {srv.type === 'telegram_bot' ? <Bot className="w-5 h-5" /> : 
                         srv.type === 'crm' ? <Briefcase className="w-5 h-5" /> : 
                         srv.type === 'mobile_app' ? <Smartphone className="w-5 h-5" /> : 
                         <Globe className="w-5 h-5" />}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {srv.startingPrice}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {srv.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {srv.features.slice(0, 3).map((f) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 rounded-md liquid-glass-subtle text-slate-700 dark:text-slate-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateMenu('Buyurtma berish')}
                    className="w-full py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Buyurtma Berish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <PortfolioShowcase
              portfolio={siteSettings.portfolio || []}
              darkMode={darkMode}
              onOrderSimilar={() => onNavigateMenu('Buyurtma berish')}
            />
          </div>
        </div>
      )}

      {/* 4. BOTTOM TWO CARDS (Removed 'So'nggi bildirishnomalar' card as requested) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Card 1: Role and tasks explanation */}
        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <h3 className="text-sm font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>O'z roli va vazifalari haqida</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-black tracking-wide uppercase">
              {user.role === 'creator' ? 'BOSHLIQ / CREATOR' : user.role === 'engineer' ? 'MUHANDIS / ADMIN' : 'FOYDALANUVCHI / MIJOZ'}
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {isCreatorOrAdmin 
                ? 'Siz platforma boshqaruvchisiz. Barcha mijoz buyurtmalari, jamoa a\'zolari, loyihalar va sozlamalar to\'liq sizning nazoratingizda.'
                : 'Xush kelibsiz! Siz ushbu platformada Telegram bot, vebsayt, web app, CRM va mobil ilovalarga qulay buyurtma berishingiz, shaxsiy qaydlaringizni yuritishingiz va jamoamiz bilan bog\'lanishingiz mumkin.'}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs font-semibold p-3 rounded-2xl liquid-glass-subtle">
              <span className="text-slate-600 dark:text-slate-400">Hozirgi Rejim:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Faol (Online)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Reminders and Plans */}
        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <h3 className="text-sm font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span>O'rnatgan eslatmalar va rejalar</span>
            </h3>
          </div>

          <form onSubmit={handleCreateReminder} className="flex items-center space-x-2">
            <input 
              type="text"
              placeholder="Eslatma nomini kiriting..."
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
              className="flex-grow px-3.5 py-2 rounded-xl liquid-glass-subtle text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer flex-shrink-0 shadow-md"
              title="Qo'shish"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {reminders.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                Hozircha eslatmalar mavjud emas.
              </p>
            ) : (
              reminders.map((r) => (
                <div 
                  key={r.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl liquid-glass-subtle text-xs"
                >
                  <div 
                    onClick={() => onToggleReminder(r.id)} 
                    className="flex items-center space-x-2 cursor-pointer flex-grow truncate"
                  >
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${r.completed ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
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
