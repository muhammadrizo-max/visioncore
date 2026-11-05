import React, { useState } from 'react';
import { 
  Rocket, 
  Shield, 
  Bot, 
  Globe, 
  Layout, 
  Smartphone, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Star, 
  DollarSign, 
  Clock, 
  Lock, 
  Sparkles, 
  ChevronRight, 
  X,
  Send,
  ExternalLink,
  Code2
} from 'lucide-react';
import { User, Language, ProjectType } from '../types';
import { getTranslation } from '../lib/translations';
import { generateVcgUserId } from '../lib/idGenerator';

interface LandingPageProps {
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  language?: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  allUsers,
  onLoginSuccess,
  language = 'uz'
}) => {
  const [currentLang, setCurrentLang] = useState<Language>(language);
  const t = getTranslation(currentLang);

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

  // Interactive Project Cost Estimator (Saytlab style)
  const [calcType, setCalcType] = useState<ProjectType>('telegram_bot');
  const [calcSpeed, setCalcSpeed] = useState<'normal' | 'express'>('normal');
  const [calcFeatures, setCalcFeatures] = useState<string[]>(['auth', 'admin']);

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

  const portfolio = [
    {
      title: 'FastDelivery Express Logistika',
      cat: 'Web App & Telegram Bot',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
      desc: 'Kuryerlar, restoranlar va mijozlar uchun 3 tomonlama avtomatlashtirilgan yetkazib berish tizimi.',
      tags: ['React', 'PostgreSQL', 'Telegram API']
    },
    {
      title: 'FinCore Smart CRM & Accounting',
      cat: 'CRM Tizimi',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
      desc: 'Omborxona, kassa, xodimlar samaradorligi va avtomatik moliyaviy hisobotlar platformasi.',
      tags: ['Supabase', 'Real-time Chart', 'TypeScript']
    },
    {
      title: 'LuxeEstate Ko\'chmas Mulk Portali',
      cat: 'Websayt & Katalog',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600',
      desc: '3D interaktiv xarita, filtrlar va xaridorlar bilan onlayn shartnoma tuzish tizimi.',
      tags: ['Next.js', 'Tailwind', 'SEO Ready']
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
      const finalUsername = username.toLowerCase().trim();
      const exists = allUsers.some(u => u.username.toLowerCase() === finalUsername);
      if (exists) {
        setErrorMsg('Ushbu foydalanuvchi nomi allaqachon mavjud!');
        return;
      }

      // Generate exact 12-char VCG id: vcg + (- or _) + 8 digits
      const generatedId = generateVcgUserId();

      const newUser: User = {
        id: generatedId,
        username: finalUsername,
        password: password,
        firstName: firstName.trim() || finalUsername,
        lastName: lastName.trim() || '',
        phone: phone.trim() || '+998 90 000 00 00',
        email: `${finalUsername}@visioncore.group`,
        role: 'user', // Regular user
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${finalUsername}`,
        registeredAt: new Date().toISOString(),
        language: currentLang
      };

      onLoginSuccess(newUser);
    } else {
      // Login mode
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. NAVBAR (Saytlab style modern header) */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              VISIONCORE
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-blue-400">
              Group Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language select */}
          <select
            value={currentLang}
            onChange={(e) => setCurrentLang(e.target.value as Language)}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="uz">O'zbekcha</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>

          {/* Login / Register trigger */}
          <button
            onClick={() => {
              setIsRegisterMode(false);
              setShowAuthModal(true);
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 cursor-pointer"
          >
            {t.login}
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION (High-Tech Saytlab style) */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-8">
        
        {/* Ambient Glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Professional IT va Dasturiy Yechimlar Markazi</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
          Biznesingiz uchun <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">aqlli, tezkor va daromad keltiruvchi</span> IT tizimlar
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          VisionCore Group — Telegram botlar, Web ilovalar, CRM va murakkab dasturiy ta'minotlarni eng yuqori sifat va zamonaviy arxitektura asosida yaratadi.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              setIsRegisterMode(true);
              setShowAuthModal(true);
            }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm transition shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center space-x-2 active:scale-95 cursor-pointer"
          >
            <span>{t.startProject}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsRegisterMode(false);
              setShowAuthModal(true);
            }}
            className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition active:scale-95 cursor-pointer"
          >
            <span>{t.login} (Virtual Ofis)</span>
          </button>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto border-t border-slate-800/80">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-blue-400">50+</div>
            <div className="text-xs text-slate-400">Yaratilgan Loyihalar</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">99.8%</div>
            <div className="text-xs text-slate-400">Tizim Ishonchliligi</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-purple-400">24/7</div>
            <div className="text-xs text-slate-400">Qo'llab-quvvatlash</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">100%</div>
            <div className="text-xs text-slate-400">Kafolatlangan Sifat</div>
          </div>
        </div>
      </section>

      {/* 3. SERVICES SECTION (Saytlab style cards) */}
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
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between space-y-4 group shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
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
                    {srv.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center space-x-1">
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

      {/* 4. PORTFOLIO SHOWCASE (Qilingan ishlar) */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-10 border-t border-slate-800">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bizning Qilingan Ishlarimiz (Portfolio)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            VisionCore Group jamoasi tomonidan muvaffaqiyatli topshirilgan loyihalar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portfolio.map((item) => (
            <div 
              key={item.title}
              className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg group hover:border-blue-500/40 transition"
            >
              <div className="relative overflow-hidden h-44">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-3 left-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                  {item.cat}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-800 py-10 px-4 sm:px-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-slate-300">VISIONCORE GROUP</span>
        </div>
        <p>© 2026 VisionCore Group. Barcha huquqlar himoyalangan.</p>
        <p className="text-[11px] text-slate-600">Telegram Admin: @visioncore_admin | Tel: +998 90 000 00 00</p>
      </footer>

      {/* 6. AUTH MODAL (Sign In & Sign Up with 12-char ID & 6-char pass validation) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-5">
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 mx-auto flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black">
                {isRegisterMode ? t.register : t.login}
              </h3>
              <p className="text-xs text-slate-400">
                {isRegisterMode ? 'Yangi foydalanuvchi hisobini yarating' : 'VisionCore Group platformasiga kiring'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Ismingiz"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Familiyangiz"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">{t.username}</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: vcg-creator yoki sardor99"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">{t.password} (kamida 6 belgi)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-lg active:scale-95 cursor-pointer"
              >
                {isRegisterMode ? t.register : t.login}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
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
