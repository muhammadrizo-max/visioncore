import React, { useState } from 'react';
import { 
  Bot, 
  Globe, 
  Layout, 
  Smartphone, 
  Briefcase, 
  Rocket, 
  Sliders, 
  Send, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  DollarSign, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { User, Order, ProjectType } from '../types';

interface OrderViewProps {
  currentUser: User;
  orders: Order[];
  onSubmitOrder: (newOrder: Order) => void;
  darkMode: boolean;
}

export const OrderView: React.FC<OrderViewProps> = ({
  currentUser,
  orders,
  onSubmitOrder
}) => {
  const [projectType, setProjectType] = useState<ProjectType>('telegram_bot');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState(currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : '');
  const [clientPhone, setClientPhone] = useState(currentUser.phone || '');
  const [clientTelegram, setClientTelegram] = useState(currentUser.telegramUsername || '');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  const myOrders = orders.filter(o => o.userId === currentUser.id);

  const projectTypesList: { type: ProjectType; title: string; subtitle: string; icon: any }[] = [
    { 
      type: 'telegram_bot', 
      title: 'Telegram Bot', 
      subtitle: 'Avtomatlashtirilgan savdo, xizmat ko\'rsatish va to\'lov qabul qiluvchi botlar',
      icon: Bot 
    },
    { 
      type: 'web_app', 
      title: 'Web App (Veb Ilova)', 
      subtitle: 'Interaktiv veb-platforma, shaxsiy kabinet, dashboard yoki SaaS servis',
      icon: Layout 
    },
    { 
      type: 'website', 
      title: 'Websayt (Sayt)', 
      subtitle: 'Kompaniya, xizmatlar yoki korporativ biznes uchun rasmiy veb-sayt',
      icon: Globe 
    },
    { 
      type: 'mobile_app', 
      title: 'Mobil Ilova', 
      subtitle: 'iOS va Android qurilmalari uchun qulay, zamonaviy va tezkor ilova',
      icon: Smartphone 
    },
    { 
      type: 'crm', 
      title: 'CRM Tizimi', 
      subtitle: 'CRM (Customer Relationship Management) - mijozlar va savdo boshqaruvi',
      icon: Briefcase 
    },
    { 
      type: 'landing_page', 
      title: 'Landing Page', 
      subtitle: 'Mahsulot yoki xizmatni taqdimot qilish va sotuvga qaratilgan bitta sahifali sayt',
      icon: Rocket 
    },
    { 
      type: 'other', 
      title: 'Boshqa (Custom)', 
      subtitle: 'Individual talablar asosidagi nostandart va maxsus dasturiy loyiha',
      icon: Sliders 
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!projectName.trim()) {
      setErrorMsg('Iltimos, loyiha nomini kiriting!');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Iltimos, loyiha tavsifi yoki talablaringizni yozing!');
      return;
    }
    if (!clientPhone.trim() && !clientTelegram.trim()) {
      setErrorMsg('Iltimos, siz bilan bog\'lanish uchun telefon raqam yoki Telegram usernameni kiriting!');
      return;
    }

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      clientName: clientName.trim() || currentUser.username,
      clientPhone: clientPhone.trim(),
      clientTelegram: clientTelegram.trim(),
      projectType,
      projectName: projectName.trim(),
      description: description.trim(),
      budget: budget.trim(),
      deadline: deadline.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onSubmitOrder(newOrder);
    setIsSuccess(true);
    setProjectName('');
    setDescription('');
    setBudget('');
    setDeadline('');
    
    setTimeout(() => {
      setIsSuccess(false);
      setActiveTab('history');
    }, 2500);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center space-x-1"><Clock className="w-3 h-3" /><span>Kutilmoqda</span></span>;
      case 'in_review':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center space-x-1"><Clock className="w-3 h-3" /><span>Ko'rib chiqilmoqda</span></span>;
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1"><CheckCircle2 className="w-3 h-3" /><span>Qabul qilindi</span></span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center space-x-1"><Rocket className="w-3 h-3" /><span>Jarayonda</span></span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 flex items-center space-x-1"><CheckCircle2 className="w-3 h-3" /><span>Bajarildi</span></span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center space-x-1"><span>Bekor qilindi</span></span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-700/90 backdrop-blur-xl border border-white/20 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold">
            <Rocket className="w-4 h-4 text-amber-300" />
            <span>VisionCore Group Dasturlash Xizmati</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Yangi Buyurtma Berish
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Biz sizning biznesingiz va g'oyalaringiz uchun Telegram bot, Web ilova, CRM yoki murakkab tizimlarni yuqori sifatda yaratib beramiz.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-300/60 dark:border-white/10 space-x-3">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 px-2 font-bold text-xs sm:text-sm transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'create'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Buyurtma berish</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 font-bold text-xs sm:text-sm transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mening buyurtmalarim ({myOrders.length})</span>
        </button>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-emerald-700 dark:text-emerald-300 flex items-start space-x-3 shadow-sm animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Buyurtmangiz muvaffaqiyatli qabul qilindi!</h4>
            <p className="text-xs opacity-90">Jamoamiz tez orada siz bilan Telegram yoki telefon orqali bog'lanadi.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 backdrop-blur-md text-rose-600 dark:text-rose-300 flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="p-6 rounded-3xl liquid-glass space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>1. Loyiha turini tanlang</span>
                <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Sizga aynan qaysi yo'nalishdagi dasturiy ta'minot kerak?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {projectTypesList.map((item) => {
                const Icon = item.icon;
                const isSelected = projectType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setProjectType(item.type)}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/20'
                        : 'liquid-glass-subtle hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-blue-600/15 text-blue-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-200'}`}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-3xl liquid-glass space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                2. Loyiha haqida ma'lumotlar
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                G'oyangiz va talablaringizni batafsil yozib bering
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <span>Loyiha nomi</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Masalan: Restoran uchun buyurtma berish boti va boshqaruv CRM"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <span>Batafsil tavsif va talablar</span>
                  <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Loyiha qanday vazifalarni bajarishi kerak? Qanday funksiyalar (to'lov, avtorizatsiya, xabar yuborish, admin panel) bo'lishi lozim?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                    <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                    <span>Taxminiy byudjet (ixtiyoriy)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Masalan: $500 - $1,500"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>Muddat (ixtiyoriy)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Masalan: 15-20 kun ichida"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl liquid-glass space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                3. Bog'lanish uchun ma'lumotlaringiz
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Buyurtmani qabul qilib, siz bilan muloqotga chiqishimiz uchun zarur
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ismingiz
                </label>
                <input 
                  type="text"
                  placeholder="Ismingiz"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>Telefon raqamingiz</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>Telegram Username</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="@telegram_username"
                  value={clientTelegram}
                  onChange={e => setClientTelegram(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl liquid-glass-subtle text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Buyurtmani Yuborish</span>
            </button>
          </div>

        </form>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Buyurtmalar Tarixi
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400">Jami: {myOrders.length} ta buyurtma</span>
          </div>

          {myOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl liquid-glass space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 mx-auto flex items-center justify-center">
                <Rocket className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sizda hali buyurtmalar yo'q</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Yangi dasturiy loyiha, Telegram bot yoki CRM tizimiga buyurtma bering!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
              >
                + Yangi Buyurtma Berish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myOrders.map((order) => (
                <div 
                  key={order.id}
                  className="p-6 rounded-3xl liquid-glass space-y-3 transition hover:border-blue-500/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300/50 dark:border-white/10 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {order.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {order.projectName}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {order.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-4">
                      {order.budget && <span>Byudjet: <strong className="text-slate-900 dark:text-slate-200">{order.budget}</strong></span>}
                      {order.deadline && <span>Muddat: <strong className="text-slate-900 dark:text-slate-200">{order.deadline}</strong></span>}
                      {order.clientTelegram && <span>Telegram: <strong className="text-blue-600 dark:text-blue-400">{order.clientTelegram}</strong></span>}
                    </div>

                    <a 
                      href="https://t.me/visioncore_admin" 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white font-bold transition text-[11px] flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Admin bilan bog'lanish</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
