import { 
  User, Project, ChatMessage, Task, NoteItem, VersionPlan, 
  TestReport, ArchitectureDoc, ReminderPlan, LogMessage, SiteSettings, Order 
} from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'vcg-90000001', // Exactly 12 characters: vcg (3) + '-' (1) + 8 digits
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
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'vcg-90000003',
    username: 'cipher-res98100',
    password: 'vcg_mcc2ro',
    firstName: 'Bosh Muhandis',
    lastName: '(Engineer)',
    phone: '+998 90 000 00 00',
    email: 'engineer@visioncore.group',
    telegramUsername: '@visioncore_eng',
    role: 'engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'vcg-90000004',
    username: 'vcg-researcher',
    password: 'vcg_mcc2ro',
    firstName: 'Tadqiqotchi',
    lastName: '(AI Researcher)',
    phone: '+998 90 111 22 33',
    email: 'researcher@visioncore.group',
    telegramUsername: '@vcg_researcher',
    role: 'researcher',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'vcg-90000005',
    username: 'vcg-designer',
    password: 'vcg_mcc2ro',
    firstName: 'Dizayner',
    lastName: '(UI/UX & Architect)',
    phone: '+998 90 222 33 44',
    email: 'designer@visioncore.group',
    telegramUsername: '@vcg_designer',
    role: 'designer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'vcg-90000006',
    username: 'vcg-analyst',
    password: 'vcg_mcc2ro',
    firstName: 'Tahlilchi',
    lastName: '(Analyst)',
    phone: '+998 90 333 44 55',
    email: 'analyst@visioncore.group',
    telegramUsername: '@vcg_analyst',
    role: 'analyst',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'vcg_84920193', // 12-char with '_'
    username: 'vcg-user',
    password: 'vcg_mcc2ro',
    firstName: 'Jamoa A\'zosi',
    lastName: '(Mijoz)',
    phone: '+998 90 444 55 66',
    email: 'member@visioncore.group',
    telegramUsername: '@vcg_client',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    userId: 'vcg_84920193',
    clientName: 'Sardorbek Rahimov',
    clientPhone: '+998 90 123 45 67',
    clientTelegram: '@sardor_online',
    projectType: 'telegram_bot',
    projectName: 'Savdo va Yetkazib Berish Telegram Boti',
    description: 'Mijozlar buyurtma bera oladigan va to\'lov qila oladigan ko\'p funksiyali Telegram bot tizimi.',
    budget: '$500 - $1,000',
    deadline: '15 kun',
    status: 'in_review',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'ORD-1002',
    userId: 'vcg_84920193',
    clientName: 'Azizbek Toshmatov',
    clientPhone: '+998 94 987 65 43',
    clientTelegram: '@aziz_business',
    projectType: 'crm',
    projectName: 'Kompaniya Savdo CRM Tizimi',
    description: 'CRM (Customer Relationship Management) tizimi: savdo voronkasi, mijozlar bazasi va xodimlar samaradorligi nazorati.',
    budget: '$1,500 - $3,000',
    deadline: '1 oy',
    status: 'accepted',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PROJ-101',
    name: 'VisionCore Group Production Platform',
    description: 'Boshqaruv, tadqiqot, loyihalar va jamoaviy muloqot tizimi.',
    status: 'In Development',
    version: 'v1.0.0'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TASK-1',
    title: 'Platforma xavfsizligini tekshirish',
    description: 'Barcha API endpointlar va autentifikatsiya tizimi tahlili',
    completed: false,
    createdById: 'vcg-90000001',
    createdByName: 'Boshliq (Creator)',
    assignedToId: 'vcg-90000002',
    assignedToName: 'Bosh Muhandis (Admin)',
    date: new Date().toISOString()
  }
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'NOTE-1',
    title: 'VisionCore Group Strategik Reja',
    content: '1. Buyurtmalar qabuli va mijozlar bilan muloqot\n2. Tizim arxitekturasi dizayni\n3. Sifatli dasturiy ta\'minot relizlari',
    isPrivate: false,
    authorId: 'vcg-90000001',
    authorName: 'Boshliq (Creator)',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_VERSION_PLANS: VersionPlan[] = [];

export const INITIAL_TEST_REPORTS: TestReport[] = [];

export const INITIAL_ARCHITECTURE_DOCS: ArchitectureDoc[] = [];

export const INITIAL_CHATS: ChatMessage[] = [];

export const INITIAL_REMINDERS: ReminderPlan[] = [];

export const INITIAL_LOGS: LogMessage[] = [];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'VisionCore Group Workspace',
  logo: 'Shield',
  telegramUsername: '@visioncore_admin',
  isPrivate: true
};
