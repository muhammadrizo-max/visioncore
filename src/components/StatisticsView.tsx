import React, { useMemo } from 'react';
import {
  BarChart3,
  Users,
  FolderCheck,
  Hammer,
  ShoppingBag,
  Briefcase,
  CheckSquare,
  Shield,
  TrendingUp,
  Layers,
} from 'lucide-react';
import {
  User,
  Project,
  Order,
  Task,
  SiteSettings,
  MemberActivity,
  OrderStatus,
  ProjectType,
} from '../types';

interface StatisticsViewProps {
  allUsers: User[];
  projects: Project[];
  orders: Order[];
  tasks: Task[];
  siteSettings: SiteSettings;
  activities: MemberActivity[];
  darkMode: boolean;
}

const ORDER_STATUS_META: { status: OrderStatus; label: string; barColor: string; pillClass: string }[] = [
  { status: 'pending', label: 'Kutilmoqda', barColor: 'bg-amber-500', pillClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { status: 'in_review', label: "Ko'rib chiqilmoqda", barColor: 'bg-indigo-500', pillClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
  { status: 'accepted', label: 'Qabul qilindi', barColor: 'bg-blue-500', pillClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/15 border-blue-500/30' },
  { status: 'in_progress', label: 'Jarayonda', barColor: 'bg-purple-500', pillClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30' },
  { status: 'completed', label: 'Bajarildi', barColor: 'bg-emerald-500', pillClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { status: 'cancelled', label: 'Bekor qilindi', barColor: 'bg-rose-500', pillClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30' },
];

const PROJECT_TYPE_LABELS: { type: ProjectType; label: string; color: string }[] = [
  { type: 'telegram_bot', label: 'Telegram Bot', color: 'bg-sky-500' },
  { type: 'web_app', label: 'Web App', color: 'bg-blue-500' },
  { type: 'website', label: 'Websayt', color: 'bg-indigo-500' },
  { type: 'mobile_app', label: 'Mobil Ilova', color: 'bg-purple-500' },
  { type: 'crm', label: 'CRM Tizimi', color: 'bg-emerald-500' },
  { type: 'landing_page', label: 'Landing Page', color: 'bg-amber-500' },
  { type: 'other', label: 'Boshqa', color: 'bg-slate-500' },
];

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  allUsers,
  projects,
  orders,
  tasks,
  siteSettings,
  activities,
  darkMode,
}) => {
  const teamMembers = useMemo(() => allUsers.filter((u) => u.role !== 'user'), [allUsers]);
  const regularUsers = useMemo(() => allUsers.filter((u) => u.role === 'user'), [allUsers]);

  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === 'Completed'),
    [projects]
  );
  const ongoingProjects = useMemo(
    () => projects.filter((p) => p.status !== 'Completed'),
    [projects]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'completed'),
    [orders]
  );
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'in_progress' || o.status === 'accepted' || o.status === 'in_review'
      ),
    [orders]
  );

  const portfolioCount = siteSettings.portfolio?.length || 0;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const projectStatuses: { status: Project['status']; label: string; color: string }[] = [
    { status: 'Planning', label: 'Rejalashtirish', color: 'bg-slate-500' },
    { status: 'Designing', label: 'Arxitektura & Dizayn', color: 'bg-purple-500' },
    { status: 'In Development', label: 'Dasturlash jarayoni', color: 'bg-blue-500' },
    { status: 'Testing', label: 'Testlash', color: 'bg-amber-500' },
    { status: 'Completed', label: 'Yakunlangan', color: 'bg-emerald-500' },
  ];

  const roleBreakdown = [
    { role: 'creator', label: 'Creator (Boshliq)', color: 'bg-amber-500' },
    { role: 'engineer', label: 'Engineer', color: 'bg-blue-500' },
    { role: 'researcher', label: 'Researcher', color: 'bg-teal-500' },
    { role: 'designer', label: 'Designer', color: 'bg-purple-500' },
    { role: 'analyst', label: 'Analyst', color: 'bg-rose-500' },
    { role: 'user', label: 'Oddiy foydalanuvchilar', color: 'bg-slate-500' },
  ];

  // Weekly 7-day trend
  const weeklyTrend = useMemo(() => {
    const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const now = new Date();
    const out: { label: string; ordersCount: number; tasksCount: number; activityCount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDay = d.toISOString().split('T')[0];
      out.push({
        label: dayNames[d.getDay()],
        ordersCount: orders.filter((o) => o.createdAt && o.createdAt.startsWith(isoDay)).length,
        tasksCount: tasks.filter((t) => t.date && t.date.startsWith(isoDay)).length,
        activityCount: activities.filter((a) => a.timestamp && a.timestamp.startsWith(isoDay)).length,
      });
    }
    return out;
  }, [orders, tasks, activities]);

  const maxWeeklyVal = Math.max(
    ...weeklyTrend.map((d) => Math.max(d.ordersCount + d.tasksCount, d.activityCount)),
    1
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Creator Analytics & Real-Time Statistika</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Statistika Markazi
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Platformadagi barcha real ko'rsatkichlar: a'zolar, bajarilgan va jarayondagi loyihalar, buyurtmalar hamda portfolio
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-2xl liquid-glass text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>100% Real Bazaviy Ma'lumotlar</span>
        </div>
      </div>

      {/* Primary KPI Grid (5 key metrics requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Jami a'zolar */}
        <div className="p-5 rounded-3xl liquid-glass space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Jami a'zolar
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{allUsers.length}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Guruh: <strong className="text-blue-600 dark:text-blue-400">{teamMembers.length}</strong></span>
            <span>Userlar: <strong className="text-emerald-600 dark:text-emerald-400">{regularUsers.length}</strong></span>
          </div>
        </div>

        {/* 2. Jami qilingan loyihalar */}
        <div className="p-5 rounded-3xl liquid-glass space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Qilingan loyihalar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FolderCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {completedProjects.length}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Yakunlangan buyurtmalar: <strong>{completedOrders.length} ta</strong>
          </div>
        </div>

        {/* 3. Qilinayotgan loyihalar */}
        <div className="p-5 rounded-3xl liquid-glass space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Qilinayotgan loyihalar
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Hammer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {ongoingProjects.length}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Jarayondagi buyurtmalar: <strong>{activeOrders.length} ta</strong>
          </div>
        </div>

        {/* 4. Jami buyurtmalar */}
        <div className="p-5 rounded-3xl liquid-glass space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Jami buyurtmalar
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{orders.length}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Kutilmoqda: <strong className="text-amber-500">{orders.filter((o) => o.status === 'pending').length}</strong> · Bajarildi: <strong className="text-emerald-500">{completedOrders.length}</strong>
          </div>
        </div>

        {/* 5. Jami portfolio */}
        <div className="p-5 rounded-3xl liquid-glass space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Jami portfolio
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{portfolioCount}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Landing & Bosh sahifa namunalari
          </div>
        </div>
      </div>

      {/* Buyurtmalar Statistikasi (Statuslar + Yo'nalishlar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Buyurtmalar Statistikasi (Statuslar)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Jami: {orders.length} ta
            </span>
          </div>

          <div className="space-y-3">
            {ORDER_STATUS_META.map((meta) => {
              const count = orders.filter((o) => o.status === meta.status).length;
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              return (
                <div key={meta.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{meta.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {count} ta ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${meta.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Buyurtmalar Yo'nalishlari
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Turlar kesimida
            </span>
          </div>

          <div className="space-y-3">
            {PROJECT_TYPE_LABELS.map((item) => {
              const count = orders.filter((o) => o.projectType === item.type).length;
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {count} ta ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loyihalar Bosqichlari + A'zolar Tarkibi + Haftalik Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loyihalar holati */}
        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <FolderCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Loyihalar Bosqichlari
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Jami: {projects.length}
            </span>
          </div>

          <div className="space-y-3">
            {projectStatuses.map((ps) => {
              const count = projects.filter((p) => p.status === ps.status).length;
              const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
              return (
                <div key={ps.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{ps.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{count} ta</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${ps.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 font-semibold">
              <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Vazifalar bajarilishi</span>
            </span>
            <span className="font-black text-slate-900 dark:text-white">
              {completedTasks}/{tasks.length} ({taskPercent}%)
            </span>
          </div>
        </div>

        {/* A'zolar tarkibi */}
        <div className="p-6 rounded-3xl liquid-glass space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                A'zolar va Userlar Tarkibi
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {allUsers.length} kishi
            </span>
          </div>

          <div className="space-y-3">
            {roleBreakdown.map((rb) => {
              const count = allUsers.filter((u) => u.role === rb.role).length;
              const pct = allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0;
              return (
                <div key={rb.role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{rb.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{count} kishi</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${rb.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Oxirgi 7 kunlik faollik */}
        <div className="p-6 rounded-3xl liquid-glass space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Oxirgi 7 kunlik faollik
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Real dinamika</span>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4">
            {weeklyTrend.map((d, idx) => {
              const val = d.ordersCount + d.tasksCount + d.activityCount;
              const heightPct = Math.max(Math.round((val / Math.max(maxWeeklyVal, 1)) * 100), val > 0 ? 15 : 6);
              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full space-y-2">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{val}</span>
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      className={`w-full max-w-[26px] rounded-t-xl transition-all duration-500 ${
                        val > 0
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-400 shadow-md'
                          : darkMode
                          ? 'bg-white/10'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`Buyurtmalar: ${d.ordersCount}, Vazifalar: ${d.tasksCount}, Harakatlar: ${d.activityCount}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{d.label}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Qayd etilgan harakatlar:</span>
            <strong className="text-slate-900 dark:text-white">{activities.length} ta</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
