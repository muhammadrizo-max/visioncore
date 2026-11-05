export type RoleType = 
  | 'creator'
  | 'engineer'
  | 'researcher' 
  | 'designer' 
  | 'analyst' 
  | 'user';

export type Language = 'uz' | 'en' | 'ru';

export interface User {
  id: string; // 12 characters: e.g. vcg-84920193 or vcg_84920193
  username: string; // e.g. vcg-creator, sardor99
  password?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  telegramUsername?: string; // e.g. @sardor_dev
  role: RoleType;
  avatar: string;
  registeredAt: string;
  language?: Language;
}

export type ProjectType = 
  | 'telegram_bot'
  | 'web_app'
  | 'website'
  | 'mobile_app'
  | 'crm'
  | 'landing_page'
  | 'other';

export type OrderStatus = 
  | 'pending'
  | 'in_review'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  clientTelegram: string;
  projectType: ProjectType;
  projectName: string;
  description: string;
  budget?: string;
  deadline?: string;
  status: OrderStatus;
  createdAt: string;
  adminNotes?: string;
  acceptedById?: string;
  acceptedByName?: string;
  assignedMemberId?: string;
  assignedMemberName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdById: string;
  createdByName: string;
  assignedToId: string;
  assignedToName: string;
  date: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  isPrivate: boolean;
  authorId: string;
  authorName: string;
  createdAt: string;
  category?: string;
}

export interface VersionPlan {
  id: string;
  projectId: string;
  projectName: string;
  version: string;
  name: string;
  description: string;
  nextStep: string;
  technologies: string[];
  updatedAt: string;
}

export interface TestReport {
  id: string;
  projectId: string;
  projectName: string;
  testName: string;
  result: 'Success' | 'Failed';
  errorTitle?: string;
  severity?: 'Low' | 'Medium' | 'High';
  errorDesc?: string;
  notes: string;
  analystName: string;
  date: string;
}

export interface ArchitectureDoc {
  id: string;
  projectId: string;
  projectName: string;
  specsText: string;
  boardItems: {
    id: string;
    type: 'text' | 'image' | 'file' | 'template';
    title: string;
    content: string;
    x?: number;
    y?: number;
  }[];
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'Designing' | 'In Development' | 'Testing' | 'Completed';
  version: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  chatId: string;
  attachmentUrl?: string;
  isEdited?: boolean;
  audioUrl?: string; // Voice message base64 or audio blob URL
  audioDuration?: number; // duration in seconds
}

export interface ReminderPlan {
  id: string;
  userId: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface LogMessage {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface MemberActivity {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  target?: string;
  timestamp: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  tags: string[];
  link?: string;
}

export interface ServiceItem {
  id: string;
  type: ProjectType;
  title: string;
  description: string;
  startingPrice: string;
  timeline: string;
  features: string[];
}

export interface SiteSettings {
  siteName: string;
  logo: string;
  telegramUsername: string;
  phoneContact?: string;
  isPrivate: boolean;
  creatorBackgroundType?: 'default' | 'matrix' | 'custom_image';
  creatorBackgroundImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  services?: ServiceItem[];
  portfolio?: PortfolioItem[];
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  time: string;
}
