export type RoleType = 
  | 'user' 
  | 'researcher' 
  | 'designer' 
  | 'analyst' 
  | 'engineer';

export type Language = 'uz' | 'en' | 'ru';

export interface User {
  id: string; // e.g. VCG-10001
  username: string; // e.g. vcg-admin
  password?: string; // e.g. vcg_admin2026
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: RoleType;
  avatar: string;
  registeredAt: string;
  language?: Language;
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
    content: string; // image url, template type, or text
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
  chatId: string; // 'group-all' or sorted user-to-user ID pair
  attachmentUrl?: string;
  isEdited?: boolean;
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

export interface SiteSettings {
  siteName: string;
  logo: string;
  telegramUsername: string;
  isPrivate: boolean;
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  time: string;
}
