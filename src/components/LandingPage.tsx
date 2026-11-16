import React, { useState } from 'react';
import { 
  Rocket, 
  Shield, 
  Bot, 
  Globe, 
  Layout, 
  Smartphone, 
  Briefcase, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  X
} from 'lucide-react';
import { User, SiteSettings } from '../types';
import { generateVcgUserId } from '../lib/idGenerator';
import { PortfolioShowcase } from './PortfolioShowcase';
import { INITIAL_SITE_SETTINGS } from '../mockData';

interface LandingPageProps {
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  siteSettings?: SiteSettings;
  projectsCount?: number;
  ordersCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  allUsers,
  onLoginSuccess,
  siteSettings = INITIAL_SITE_SETTINGS,
  projectsCount = 0,
  ordersCount = 0
}) => {
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [errorMsg, setErrorMsg] = useState('');

  const services = [
    {
      type: 'telegram_bot',
      title: 'Telegram Botlar',
      desc: 'Avtomatlashtirilgan savdo, to\'lov qabul qilish va mijozlarga 24/7 xizmat ko\'rsatish botlari.',
      price: 'от $150',
      time: '3-7 kun',
      icon: Bot,
      tags: ['Click/Payme', 'Admin Panel', 'Avto-xabar']
    },
    {
      type: 'web_app',
      title: 'Web Ilovalar (SaaS)',
      desc: 'Murakkab biznes boshqaruvi, shaxsiy kabinetlar va yuqori yuklamali veb-platformalar.',
      price: 'от $400',
      time: '10-20 kun',
      icon: Layout,
      tags: ['React', 'Node.js', 'PostgreSQL', 'API']
    },
    {
      type: 'crm',
      title: 'CRM Tizimlari',
      desc: 'Customer Relationship Management: savdo voronkasi, xodimlar nazorati va moliyaviy tahlil.',
      price: 'от $600',
      time: '15-30 kun',
      icon: Briefcase,
      tags: ['Savdo Tahlili', 'Xodimlar KPI', 'Telegram SMS']
    },
    {
      type: 'website',
      title: 'Websaytlar & Portallar',
      desc: 'Kompaniya nufuzini oshiruvchi ultra-tez, SEO optimallashtirilgan rasmiy veb-saytlar.',
      price: 'от $250',
      time: '5-12 kun',
      icon: Globe,
      tags: ['Ultra Tez', 'SEO', 'Mobil Moslik']
    },
    {
      type: 'mobile_app',
      title: 'Mobil Ilovalar',
      desc: 'iOS va Android uchun qulay, zamonaviy va tezkor ishlovchi mobil dasturlar.',
      price: 'от $800',
      time: '20-40 kun',
      icon: Smartphone,
      tags: ['Flutter', 'React Native', 'Cross-platform']
    },
    {
      type: 'landing_page',
      title: 'Landing Page',
      desc: 'Mahsulot yoki xizmatni taqdim etuvchi va yuqori sotuv keltiruvchi bitta sahifali sayt.',
      price: 'от $120',
      time: '2-5 kun',
      icon: Rocket,
      tags: ['Yuqori Konversiya', 'A/B Test', 'Tezkor']
    }
  ];

  // Auth Form Submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Parol kamida 6 ta belgidan iborat bo\'lishi shart!');
      return;
    }

    if (isRegisterMode) {
      if (!username.trim()) {
        setErrorMsg('Foydalanuvchi nomini kiriting!');
        return;
      }
      if (username.trim().length < 6) {
        setErrorMsg('Foydalanuvchi nomi kamida 6 ta belgidan iborat bo\'lishi tavsiya etiladi!');
        return;
      }
      const finalUsername = username.toLowerCase().trim();
      const exists = allUsers.some(u => u.username.toLowerCase() === finalUsername);
      if (exists) {
        setErrorMsg('Ushbu foydalanuvchi nomi allaqachon mavjud!');
        return;
      }

      const generatedId = generateVcgUserId();

      const newUser: User = {
        id: generatedId,
        username: finalUsername,
        password: password,
        firstName: firstName.trim() || finalUsername,
        lastName: lastName.trim() || '',
        phone: phone.trim() || '+998 90 000 00 00',
        email: `${finalUsername}@visioncore.group`,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${finalUsername}`,
        registeredAt: new Date().toISOString()
      };

      onLoginSuccess(newUser);
    } else {
      const userFound = allUsers.find(
        u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password
      );

      if (userFound) {
        onLoginSuccess(userFound);
      } else {
        setErrorMsg('Login yoki parol noto\'g\'ri kiritildi!');
      }
    }
  };

  const portfolioItems =
    siteSettings?.portfolio && siteSettings.portfolio.length > 0
      ? siteSettings.portfolio
      : INITIAL_SITE_SETTINGS.portfolio || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white dark">
      
      {/* 1. NAVBAR (Liquid Glass header, NO multi-language selector) */}
      <header className="sticky top-0 z-40 w-full liquid-glass border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              {siteSettings.siteName?.toUpperCase() || 'VISIONCORE'}
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-blue-400">
              Group Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMsg('');
              setShowAuthModal(true);
            }}
            className="hidden sm:inline-flex px-4 py-2 rounded-xl liquid-glass-subtle hover:border-blue-500/40 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Ro'yxatdan o'tish
          </button>

          <button
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMsg('');
              setShowAuthModal(true);
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 cursor-pointer"
          >
            Kirish
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-8">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 backdrop-blur-md text-blue-400 text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Professional IT va Dasturiy Yechimlar Markazi</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
          {siteSettings.heroTitle || (
            <>
              Biznesingiz uchun <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">aqlli, tezkor va daromad keltiruvchi</span> IT tizimlar
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {siteSettings.heroSubtitle || 'VisionCore Group — Telegram botlar, Web ilovalar, CRM va murakkab dasturiy ta\'minotlarni eng yuqori sifat va zamonaviy arxitektura asosida yaratadi.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              setIsRegisterMode(true);
              setShowAuthModal(true);
            }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm transition shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center space-x-2 active:scale-95 cursor-pointer"
          >
            <span>Loyiha Boshlash</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsRegisterMode(false);
              setShowAuthModal(true);
            }}
            className="px-8 py-4 rounded-2xl liquid-glass hover:border-blue-500/40 text-slate-200 font-bold text-sm transition active:scale-95 cursor-pointer"
          >
            <span>Virtual Ofisga Kirish</span>
          </button>
        </div>

        {/* 100% Real System Counters (Zero fake claims) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto border-t border-white/10">
          <div className="p-4 rounded-2xl liquid-glass space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-blue-400">{portfolioItems.length} ta</div>
            <div className="text-xs text-slate-400">Portfolio Loyihalari</div>
          </div>
          <div className="p-4 rounded-2xl liquid-glass space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{projectsCount} ta</div>
            <div className="text-xs text-slate-400">Faol Loyihalar</div>
          </div>
          <div className="p-4 rounded-2xl liquid-glass space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-purple-400">{ordersCount} ta</div>
            <div className="text-xs text-slate-400">Qabul Qilingan Buyurtmalar</div>
          </div>
          <div className="p-4 rounded-2xl liquid-glass space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{allUsers.length} ta</div>
            <div className="text-xs text-slate-400">Ro'yxatdan O'tganlar</div>
          </div>
        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Biz Nimalarni Taklif Qilamiz?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Kichik biznesdan tortib yirik korxonalargacha bo'lgan barcha bosqichdagi dasturiy xizmatlar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div 
                key={srv.type}
                className="p-6 rounded-3xl liquid-glass hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/25">
                      {srv.price}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {srv.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {srv.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md liquid-glass-subtle text-slate-300 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{srv.time}</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsRegisterMode(true);
                      setShowAuthModal(true);
                    }}
                    className="text-blue-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Buyurtma</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PORTFOLIO SHOWCASE */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/10">
        <PortfolioShowcase
          portfolio={portfolioItems}
          marqueeEnabled={siteSettings?.portfolioMarqueeEnabled !== undefined ? siteSettings.portfolioMarqueeEnabled : true}
          darkMode={true}
        />
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-white/10 py-10 px-4 sm:px-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-slate-300">VISIONCORE GROUP</span>
        </div>
        <p>© 2026 VisionCore Group. Barcha huquqlar himoyalangan.</p>
        <p className="text-[11px] text-slate-500">
          Telegram Admin: {siteSettings.telegramUsername || '@visioncore_admin'} | Tel: {siteSettings.phoneContact || '+998 90 000 00 00'}
        </p>
      </footer>

      {/* 6. AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl liquid-glass text-white space-y-5">
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black">
                {isRegisterMode ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}
              </h3>
              <p className="text-xs text-slate-400">
                {isRegisterMode ? 'Yangi foydalanuvchi hisobini yarating' : 'VisionCore Group platformasiga kiring'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Ismingiz"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Familiyangiz"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Telefon raqam (+998 90 ...)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-subtle text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Foydalanuvchi nomi {isRegisterMode ? '(kamida 6 belgi tavsiya etiladi)' : ''}
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: vcg-creator yoki sardor99"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Parol (kamida 6 belgi, 8+ tavsiya etiladi)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl liquid-glass-subtle text-xs font-mono text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-lg active:scale-95 cursor-pointer"
              >
                {isRegisterMode ? "Ro'yxatdan o'tish" : 'Kirish'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/10 text-xs text-slate-400">
              {isRegisterMode ? (
                <span>
                  Allaqachon hisobingiz bormi?{' '}
                  <button 
                    onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
                    className="text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Kirish
                  </button>
                </span>
              ) : (
                <span>
                  Hisobingiz yo'qmi?{' '}
                  <button 
                    onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
                    className="text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Ro'yxatdan o'tish
                  </button>
                </span>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
