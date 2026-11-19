import { 
  User, Project, ChatMessage, Task, NoteItem, VersionPlan, 
  TestReport, ArchitectureDoc, ReminderPlan, LogMessage, SiteSettings, Order, MemberActivity 
} from './types';

// Clean initial users array — owner credentials are verified strictly on backend
export const INITIAL_USERS: User[] = [];

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
  portfolio: []
};
