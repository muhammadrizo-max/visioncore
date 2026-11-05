import { 
  User, Project, ChatMessage, Task, NoteItem, VersionPlan, 
  TestReport, ArchitectureDoc, ReminderPlan, LogMessage, SiteSettings, Order, MemberActivity 
} from './types';

// Keep essential accounts so the creator and admin can immediately log in
export const INITIAL_USERS: User[] = [
  {
    id: 'vcg-90000001', // Exactly 12 characters
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
  },
  {
    id: 'vcg-90000002',
    username: 'vcg-admin',
    password: 'vcg_mcc2ro',
    firstName: 'Bosh Muhandis',
    lastName: '(Admin)',
    phone: '+998 90 000 00 00',
    email: 'admin@visioncore.group',
    telegramUsername: '@visioncore_admin',
    role: 'engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  }
];

// Clean mock data - real entries will be created by the team
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

export const INITIAL_ACTIVITIES: MemberActivity[] = [
  {
    id: 'ACT-1',
    userId: 'vcg-90000001',
    userName: 'Boshliq (Creator)',
    userRole: 'creator',
    action: 'Tizim ishga tushirildi va sozlamalar yangilandi',
    timestamp: new Date().toISOString()
  }
];

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
      title: 'FastDelivery Logistika Platformasi',
      category: 'Web App & Bot',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
      description: 'Kuryerlar uchun ilova, restoranlar uchun boshqaruv paneli va mijozlar boti.',
      tags: ['React', 'Node.js', 'Telegram API', 'PostgreSQL']
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
    }
  ]
};
