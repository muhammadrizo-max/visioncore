import { User, Project, ChatMessage, Task, NoteItem, VersionPlan, TestReport, ArchitectureDoc, ReminderPlan, LogMessage, SiteSettings } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'VCG-ENG-001',
    username: 'vcg-admin',
    password: 'vcg_mcc2ro',
    firstName: 'VisionCore',
    lastName: 'Bosh Muhandis (Admin)',
    phone: '+998 90 000 00 00',
    email: 'admin@visioncore.group',
    role: 'engineer',
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
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
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

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_NOTES: NoteItem[] = [];

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
