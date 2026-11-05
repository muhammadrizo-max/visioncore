import { User, Project, ChatMessage, Task, NoteItem, VersionPlan, TestReport, ArchitectureDoc, ReminderPlan, LogMessage, SiteSettings } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'VCG-CREATOR-001',
    username: 'vcg-creator',
    password: 'vcg_mcc2ro',
    firstName: 'Boshliq',
    lastName: '(Creator)',
    phone: '+998 90 000 00 00',
    email: 'creator@visioncore.group',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'VCG-ENG-001',
    username: 'vcg-admin',
    password: 'vcg_mcc2ro',
    firstName: 'Bosh Muhandis',
    lastName: '(Admin)',
    phone: '+998 90 000 00 00',
    email: 'admin@visioncore.group',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'VCG-ENG-98100',
    username: 'cipher-res98100',
    password: 'vcg_mcc2ro',
    firstName: 'Bosh Muhandis',
    lastName: '(Engineer)',
    phone: '+998 90 000 00 00',
    email: 'engineer@visioncore.group',
    role: 'engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'VCG-RES-001',
    username: 'vcg-researcher',
    password: 'vcg_mcc2ro',
    firstName: 'Tadqiqotchi',
    lastName: '(AI Researcher)',
    phone: '+998 90 111 22 33',
    email: 'researcher@visioncore.group',
    role: 'researcher',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'VCG-DES-001',
    username: 'vcg-designer',
    password: 'vcg_mcc2ro',
    firstName: 'Dizayner',
    lastName: '(UI/UX & Architect)',
    phone: '+998 90 222 33 44',
    email: 'designer@visioncore.group',
    role: 'designer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'VCG-ANA-001',
    username: 'vcg-analyst',
    password: 'vcg_mcc2ro',
    firstName: 'Tahlilchi',
    lastName: '(Analyst)',
    phone: '+998 90 333 44 55',
    email: 'analyst@visioncore.group',
    role: 'analyst',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
  },
  {
    id: 'VCG-USR-001',
    username: 'vcg-user',
    password: 'vcg_mcc2ro',
    firstName: 'Jamoa A\'zosi',
    lastName: '(Member)',
    phone: '+998 90 444 55 66',
    email: 'member@visioncore.group',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
    language: 'uz'
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
    createdById: 'VCG-CREATOR-001',
    createdByName: 'Boshliq (Creator)',
    assignedToId: 'VCG-ENG-001',
    assignedToName: 'Bosh Muhandis (Admin)',
    date: new Date().toISOString()
  }
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'NOTE-1',
    title: 'VisionCore Group Strategik Reja',
    content: '1. Tadqiqotlar o\'tkazish\n2. Tizim arxitekturasi dizayni\n3. Versiyalash va test sinovlari',
    isPrivate: false,
    authorId: 'VCG-CREATOR-001',
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
