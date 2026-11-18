import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { User, SiteSettings } from '../types';
import { generateVcgUserId } from '../lib/idGenerator';
import { apiPost, saveToken } from '../lib/api';
import { PortfolioShowcase } from './PortfolioShowcase';
import { INITIAL_SITE_SETTINGS } from '../mockData';

interface LandingPageProps {
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  siteSettings?: SiteSettings;
  projectsCount?: number;
  ordersCount?: number;
}

function generateUsernameFromName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/['`‘’ʼ]/g, '')
    .replace(/[^a-z0-9]/g, '');
  const base = cleaned || 'user';
  const rand = Math.floor(1000 + Math.random() * 9000);
  const candidate = `${base}_${rand}`;
  return candidate.length >= 6 ? candidate.slice(0, 20) : `vcg_${base}${rand}`.slice(0, 20);
}

export const LandingPage: React.FC<LandingPageProps> = ({
  allUsers,
  onLoginSuccess,
  siteSettings = INITIAL_SITE_SETTINGS,
  projectsCount = 0,
  ordersCount = 0
}) => {
  // 3D Coin Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [coinAngle, setCoinAngle] = useState<number>(0); // 0 = Register (front), 180 = Login (back)
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedAction, setVerifiedAction] = useState<'login' | 'register'>('login');
  const [pendingAuthUser, setPendingAuthUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Fields: Only First Name (auto-generates editable Username) + Password
  const [regFirstName, setRegFirstName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Login Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleFirstNameChange = (value: string) => {
    setRegFirstName(value);
    if (!isUsernameManuallyEdited) {
      if (value.trim().length > 0) {
        setRegUsername(generateUsernameFromName(value));
      } else {
        setRegUsername('');
      }
    }
  };

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

  const openAuthCoin = (mode: 'register' | 'login') => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setIsVerified(false);
    setPendingAuthUser(null);
    setRegError('');
    setLoginError('');
    setCoinAngle(mode === 'login' ? 180 : 0);
    setShowAuthModal(true);
  };

  const closeAuthCoin = () => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setShowAuthModal(false);
    setIsVerified(false);
    setPendingAuthUser(null);
  };

  const triggerCoinSuccess = (authenticatedUser: User, action: 'login' | 'register') => {
    setVerifiedAction(action);
    setPendingAuthUser(authenticatedUser);
    setCoinAngle((prev) => prev + 360);
    setIsVerified(true);

    redirectTimerRef.current = window.setTimeout(() => {
      setShowAuthModal(false);
      setIsVerified(false);
      onLoginSuccess(authenticatedUser);
    }, 3000);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanName = regFirstName.trim();
    if (!cleanName) {
      setRegError('Ismingizni kiriting!');
      return;
    }

    const cleanUsername = (regUsername || generateUsernameFromName(cleanName)).trim().toLowerCase();
    if (cleanUsername.length < 6) {
      setRegError("Username kamida 6 ta belgi bo'lsin!");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Parol kamida 6 ta belgi bo'lsin!");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiPost<{ token: string; user: User }>('/api/auth/register', {
        id: generateVcgUserId(),
        firstName: cleanName,
        username: cleanUsername,
        password: regPassword,
      });
      saveToken(data.token);
      triggerCoinSuccess(data.user, 'register');
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Ro'yxatdan o'tishda xatolik yuz berdi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanUsername = loginUsername.trim().toLowerCase();
    if (!cleanUsername || loginPassword.length < 6) {
      setLoginError('Login va parol (kamida 6 belgi) kiriting!');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiPost<{ token: string; user: User }>('/api/auth/login', {
        username: cleanUsername,
        password: loginPassword,
      });
      saveToken(data.token);
      triggerCoinSuccess(data.user, 'login');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Server bilan bog'lanishda xatolik!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const portfolioItems =
    siteSettings?.portfolio && siteSettings.portfolio.length > 0
      ? siteSettings.portfolio
      : INITIAL_SITE_SETTINGS.portfolio || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white dark">
      
      {/* 1. NAVBAR */}
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
            onClick={() => openAuthCoin('register')}
            className="hidden sm:inline-flex px-4 py-2 rounded-xl liquid-glass-subtle hover:border-blue-500/40 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Ro'yxatdan o'tish
          </button>

          <button
            onClick={() => openAuthCoin('login')}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 cursor-pointer"
          >
            Kirish
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-7">
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
            onClick={() => openAuthCoin('register')}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm transition shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center space-x-2 active:scale-95 cursor-pointer"
          >
            <span>Loyiha Boshlash</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => openAuthCoin('login')}
            className="px-8 py-4 rounded-2xl liquid-glass hover:border-blue-500/40 text-slate-200 font-bold text-sm transition active:scale-95 cursor-pointer"
          >
            <span>Virtual Ofisga Kirish</span>
          </button>
        </div>

        {/* Real System Counters */}
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
      <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
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
                    onClick={() => openAuthCoin('register')}
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
      <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/10">
        <PortfolioShowcase
          portfolio={portfolioItems}
          darkMode={true}
          onOrderSimilar={() => openAuthCoin('register')}
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

      {/* 6. 3D COIN FLIP AUTH MODAL (Transparent glass backdrop, click outside to close, NO X button, NO ring icon) */}
      {showAuthModal && (
        <div
          onClick={closeAuthCoin}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
        >
          {/* 3D COIN STAGE */}
          <div className="coin-stage relative z-10" onClick={(e) => e.stopPropagation()}>
            <div
              className={`coin-object ${isVerified ? 'is-verified' : ''}`}
              style={{ transform: `rotateY(${coinAngle}deg)` }}
            >
              {/* FRONT FACE: RO'YXATDAN O'TISH (Left half Techscape VisionCore Logo BG) */}
              <div className="coin-face coin-front">
                {!(isVerified && verifiedAction === 'register') ? (
                  <div className="w-full max-w-[280px] flex flex-col items-center relative z-10">
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white drop-shadow">
                      Ro'yxatdan o'tish
                    </h2>
                    <p className="text-[11px] text-slate-300 mb-3 text-center">
                      Ismingizni kiriting — username avto yaratiladi
                    </p>

                    {regError && (
                      <div className="w-full mb-2.5 px-2.5 py-1.5 rounded-lg bg-rose-500/25 border border-rose-500/45 text-rose-200 text-[10px] font-semibold text-center">
                        {regError}
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="w-full space-y-2.5">
                      <input
                        type="text"
                        className="coin-input"
                        placeholder="Ismingiz"
                        value={regFirstName}
                        onChange={(e) => handleFirstNameChange(e.target.value)}
                        required
                      />

                      <input
                        type="text"
                        className="coin-input font-mono text-cyan-200"
                        placeholder="Username (avtomatik yaratiladi)"
                        value={regUsername}
                        onChange={(e) => {
                          setIsUsernameManuallyEdited(true);
                          setRegUsername(e.target.value);
                        }}
                        required
                      />

                      <input
                        type="password"
                        className="coin-input"
                        placeholder="Parol (kamida 6 belgi)"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="coin-btn mt-1 disabled:opacity-60"
                      >
                        {isSubmitting ? 'Tekshirilmoqda...' : "Ro'yxatdan o'tish"}
                      </button>
                    </form>

                    <p className="text-[11px] text-slate-300 mt-3 text-center">
                      Allaqachon hisobingiz bormi?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setRegError('');
                          setCoinAngle((prev) => prev - (prev % 360) + 180);
                        }}
                        className="text-cyan-300 font-semibold hover:underline ml-0.5 cursor-pointer"
                      >
                        Kirish
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center px-4 relative z-10">
                    <div className="checkmark-circle mb-4">
                      <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path className="checkmark-path" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-300 leading-snug">
                      Muvaffaqiyatli ro'yxatdan o'tdingiz!
                    </h2>
                    <p className="text-xs text-emerald-100/90 mt-1.5 max-w-[240px]">
                      Hisobingiz yaratildi. VisionCore Group ishchi maydoniga yo'naltirilmoqda...
                    </p>
                    {pendingAuthUser && (
                      <button
                        type="button"
                        onClick={() => {
                          if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
                          setShowAuthModal(false);
                          setIsVerified(false);
                          onLoginSuccess(pendingAuthUser);
                        }}
                        className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 transition cursor-pointer"
                      >
                        Darhol kirish
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* BACK FACE: TIZIMGA KIRISH (Right half Techscape Globe BG) */}
              <div className="coin-face coin-back">
                {!(isVerified && verifiedAction === 'login') ? (
                  <div className="w-full max-w-[280px] flex flex-col items-center relative z-10">
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white drop-shadow">
                      Tizimga kirish
                    </h2>
                    <p className="text-[11px] text-slate-300 mb-3 text-center">
                      VisionCore Group platformasiga kiring
                    </p>

                    {loginError && (
                      <div className="w-full mb-2.5 px-3 py-1.5 rounded-lg bg-rose-500/25 border border-rose-500/45 text-rose-200 text-[11px] font-semibold text-center">
                        {loginError}
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="w-full space-y-2.5">
                      <input
                        type="text"
                        className="coin-input"
                        placeholder="Foydalanuvchi nomi"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                      />

                      <input
                        type="password"
                        className="coin-input"
                        placeholder="Parol"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="coin-btn mt-1 disabled:opacity-60"
                      >
                        {isSubmitting ? 'Tekshirilmoqda...' : 'Kirish'}
                      </button>
                    </form>

                    <p className="text-[11px] text-slate-300 mt-3.5 text-center">
                      Hisobingiz yo'qmi?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setLoginError('');
                          setCoinAngle((prev) => prev - (prev % 360));
                        }}
                        className="text-cyan-300 font-semibold hover:underline ml-0.5 cursor-pointer"
                      >
                        Ro'yxatdan o'tish
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center px-4 relative z-10">
                    <div className="checkmark-circle mb-4">
                      <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path className="checkmark-path" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-300">
                      Tasdiqlandingiz!
                    </h2>
                    <p className="text-xs text-emerald-100/90 mt-1.5 max-w-[240px]">
                      Tizimga muvaffaqiyatli kirdingiz. VisionCore Group ishchi maydoniga xush kelibsiz!
                    </p>
                    {pendingAuthUser && (
                      <button
                        type="button"
                        onClick={() => {
                          if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
                          setShowAuthModal(false);
                          setIsVerified(false);
                          onLoginSuccess(pendingAuthUser);
                        }}
                        className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 transition cursor-pointer"
                      >
                        Darhol kirish
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
