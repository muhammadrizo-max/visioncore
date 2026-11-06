import { 
  User, Project, ChatMessage, Task, NoteItem, VersionPlan, 
  TestReport, ArchitectureDoc, ReminderPlan, LogMessage, SiteSettings, Order, MemberActivity 
} from './types';

// Only the master Creator account is retained so the owner can log in
export const INITIAL_USERS: User[] = [
  {
    id: 'vcg-90000001',
    username: 'vcg-creator',
    password: 'vcg_mcc2ro',
    firstName: 'Boshliq',
    lastName: '(Creator)',
    phone: '+998 90 000 00 00',
    email: 'creator@visioncore.group',
    telegramUsername: '@visioncore_creator',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  }
];

// Clean - Zero dummy orders, projects, tasks, notes, or dummy activities
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_NOTES: NoteItem[] = [];
export const INITIAL_VERSION_PLANS: VersionPlan[] = [];
export const INITIAL_TEST_REPORTS: TestReport[] = [];
export const INITIAL_ARCHITECTURE_DOCS: ArchitectureDoc[] = [];
export const INITIAL_CHATS: ChatMessage[] = [];
export const INITIAL_REMINDERS: ReminderPlan[] = [];
export const INITIAL_LOGS: LogMessage[] = [];
export const INITIAL_ACTIVITIES: MemberActivity[] = [];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'VisionCore Group',
  logo: 'Shield',
  telegramUsername: '@visioncore_admin',
  phoneContact: '+998 90 000 00 00',
  isPrivate: false,
  creatorBackgroundType: 'default',
  creatorBackgroundImage: '',
  heroTitle: 'Zamonaviy IT Loyihalar va Dasturiy Yechimlar Markazi',
  heroSubtitle: 'Biznesingiz uchun professional Telegram botlar, Web ilovalar, CRM tizimlari va yuqori tezlikdagi veb-saytlar yaratamiz.',
  portfolioMarqueeEnabled: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
  services: [
    {
      id: 'srv-1',
      type: 'telegram_bot',
      title: 'Telegram Botlar',
      description: 'Avtomatlashtirilgan savdo, to\'lov qabul qilish, CRM integratsiyasi va mijozlarga 24/7 xizmat ko\'rsatish botlari.',
      startingPrice: 'от $150',
      timeline: '3 - 7 kun',
      features: ['Click/Payme to\'lov', 'Admin panel', 'Avto-javob', 'Foydalanuvchilar bazasi']
    },
    {
      id: 'srv-2',
      type: 'web_app',
      title: 'Web Ilovalar (SaaS & Platformalar)',
      description: 'Murakkab funksionallikka ega shaxsiy kabinetlar, biznes portallari va interaktiv platformalar.',
      startingPrice: 'от $400',
      timeline: '10 - 20 kun',
      features: ['Yuqori xavfsizlik', 'Real-time sinxronizatsiya', 'Moslashuvchan dizayn', 'API integratsiya']
    },
    {
      id: 'srv-3',
      type: 'crm',
      title: 'CRM Tizimlari',
      description: 'Customer Relationship Management: savdo voronkasi, xodimlar nazorati va moliyaviy hisobotlar.',
      startingPrice: 'от $600',
      timeline: '15 - 30 kun',
      features: ['Savdo tahlillari', 'Xodimlar samaradorligi', 'SMS/Telegram xabarnomalar', 'Excel eksport']
    },
    {
      id: 'srv-4',
      type: 'website',
      title: 'Korporativ Websaytlar',
      description: 'Kompaniya va brend nufuzini oshiruvchi zamonaviy, tezkor va SEO optimallashtirilgan saytlar.',
      startingPrice: 'от $250',
      timeline: '5 - 12 kun',
      features: ['SEO optimizatsiya', 'Ultra-tez yuklanish', 'Mobil moslik', 'Katalog va menyu']
    },
    {
      id: 'srv-5',
      type: 'landing_page',
      title: 'Landing Page (Sotuv Sahifalari)',
      description: 'Mijozlar e\'tiborini tortuvchi va yuqori konversiyali bir sahifali taqdimot sayti.',
      startingPrice: 'от $120',
      timeline: '2 - 5 kun',
      features: ['A/B testga tayyor', 'Yuqori konversiya', 'Animatsiyalar', 'Telegramga tushuvchi arizalar']
    },
    {
      id: 'srv-6',
      type: 'mobile_app',
      title: 'Mobil Ilovalar',
      description: 'iOS va Android qurilmalarida qulay ishlovchi zamonaviy mobil ilovalar.',
      startingPrice: 'от $800',
      timeline: '20 - 45 kun',
      features: ['Push-bildirishnomalar', 'Cross-platform', 'Offline rejim', 'App Store & Google Play']
    }
  ],
  portfolio: [
    {
      id: 'port-1',
      title: 'FastDelivery Express Logistika',
      category: 'Web App & Bot',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
      description: 'Kuryerlar, restoranlar va mijozlar uchun avtomatlashtirilgan 3 tomonlama yetkazib berish tizimi.',
      tags: ['React', 'Node.js', 'PostgreSQL', 'Telegram API']
    },
    {
      id: 'port-2',
      title: 'FinCore Smart CRM & Accounting',
      category: 'CRM Tizimi',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
      description: 'Katta savdo tarmog\'i uchun kassa, ombor va xodimlar nazorati platformasi.',
      tags: ['TypeScript', 'Tailwind', 'Real-time Chart', 'Supabase']
    },
    {
      id: 'port-3',
      title: 'LuxeEstate Ko\'chmas Mulk Portali',
      category: 'Korporativ Websayt',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600',
      description: 'Interaktiv 3D xarita, filtrlar va onlayn bron qilish tizimi bilan jihozlangan sayt.',
      tags: ['Next.js', 'Tailwind', 'SEO', 'Mobile Friendly']
    },
    {
      id: 'port-4',
      title: 'EduSmart Onlayn Ta\'lim Platformasi',
      category: 'Web App & LMS',
      image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600',
      description: 'Video darslar, avtomatik test sinovlari va sertifikat beruvchi zamonaviy LMS tizimi.',
      tags: ['React', 'Express', 'Video Stream', 'PostgreSQL']
    },
    {
      id: 'port-5',
      title: 'PaySwift To\'lov & Billing Boti',
      category: 'Telegram Bot',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
      description: 'Click va Payme orqali bir soniyada hisob to\'ldirish va obuna boshqarish boti.',
      tags: ['Node.js', 'Click API', 'Payme API', 'Redis']
    },
    {
      id: 'port-6',
      title: 'AutoClean Avtomoyka Boshqaruv Tizimi',
      category: 'CRM & POS',
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=600',
      description: 'Navbat nazorati, xodimlar maoshi hisob-kitobi va SMS xabarnomalar integratsiyasi.',
      tags: ['Vue.js', 'Tailwind', 'SMS Gateway']
    },
    {
      id: 'port-7',
      title: 'PharmaCore Dorixonalar Tarmog\'i',
      category: 'Web App & CRM',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600',
      description: 'Dori vositalari qoldig\'i, muddati va filiallararo avtomatik yuk taqsimoti tizimi.',
      tags: ['React', 'Supabase', 'Barcode Scan']
    },
    {
      id: 'port-8',
      title: 'GourmetResto Smart Restoran Menyu',
      category: 'Web App & QR',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
      description: 'QR kod orqali interaktiv menyu, ofitsiant chaqirish va to\'lov qilish tizimi.',
      tags: ['React', 'Tailwind', 'WebSockets']
    }
  ]
};
