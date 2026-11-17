import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  Order,
  Project,
  Task,
  NoteItem,
  ChatMessage,
  ReminderPlan,
  MemberActivity,
  NotificationItem,
  SiteSettings
} from '../types';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  let storedUrl = '';
  let storedKey = '';
  try {
    storedUrl = localStorage.getItem('visioncore_supabase_url') || '';
    storedKey = localStorage.getItem('visioncore_supabase_key') || '';
    if (!storedUrl || !storedKey) {
      const settingsRaw = localStorage.getItem('visioncore_site_settings');
      if (settingsRaw) {
        const parsed = JSON.parse(settingsRaw);
        if (parsed.supabaseUrl && !storedUrl) storedUrl = parsed.supabaseUrl;
        if (parsed.supabaseAnonKey && !storedKey) storedKey = parsed.supabaseAnonKey;
      }
    }
  } catch {
    // ignore storage errors
  }

  return {
    url: (storedUrl || envUrl).trim().replace(/\/+$/, ''),
    anonKey: (storedKey || envKey).trim()
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  try {
    localStorage.setItem('visioncore_supabase_url', url.trim().replace(/\/+$/, ''));
    localStorage.setItem('visioncore_supabase_key', anonKey.trim());
    cachedClient = null;
    cachedUrl = '';
    cachedKey = '';
  } catch {
    // ignore
  }
}

export async function loadBackendSupabaseEnv(): Promise<boolean> {
  const existing = getStoredSupabaseConfig();
  if (existing.url && existing.anonKey) return true;
  try {
    const resp = await fetch('/api/supabase/env');
    if (!resp.ok) return false;
    const data = await resp.json();
    if (data?.configured && data.url && data.anonKey) {
      saveSupabaseConfig(data.url, data.anonKey);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  const url = (customUrl ?? config.url).trim().replace(/\/+$/, '');
  const key = (customKey ?? config.anonKey).trim();

  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  cachedUrl = url;
  cachedKey = key;
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
  return cachedClient;
}

export interface SupabaseSyncPayload {
  users?: User[];
  orders?: Order[];
  projects?: Project[];
  tasks?: Task[];
  notes?: NoteItem[];
  chats?: ChatMessage[];
  reminders?: ReminderPlan[];
  activities?: MemberActivity[];
  notifications?: NotificationItem[];
  siteSettings?: SiteSettings;
}

export async function testSupabaseHealth(customUrl?: string, customKey?: string) {
  const config = getStoredSupabaseConfig();
  const url = (customUrl ?? config.url).trim().replace(/\/+$/, '');
  const key = (customKey ?? config.anonKey).trim();

  if (!url || !key) {
    return {
      connected: false,
      message: 'Supabase Project URL yoki API Key kiritilmagan.'
    };
  }

  const start = performance.now();
  try {
    const resp = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    const latencyMs = Math.round(performance.now() - start);
    if (!resp.ok) {
      return {
        connected: false,
        latencyMs,
        statusCode: resp.status,
        message: `Supabase serveri ruxsat bermadi (HTTP ${resp.status}). Kalitni tekshiring.`,
        lastChecked: new Date().toLocaleTimeString('uz-UZ')
      };
    }

    let tablesCount = 0;
    try {
      const spec = await resp.json();
      if (spec && spec.definitions) {
        tablesCount = Object.keys(spec.definitions).length;
      }
    } catch {
      tablesCount = 0;
    }

    // Check core table row counts via client
    const client = getSupabaseClient(url, key);
    const counts: Record<string, number> = {};
    if (client) {
      const tableNames = ['users', 'orders', 'projects', 'tasks', 'notes', 'chats'];
      await Promise.all(
        tableNames.map(async (tbl) => {
          try {
            const { count, error } = await client.from(tbl).select('*', { count: 'exact', head: true });
            if (!error && typeof count === 'number') {
              counts[tbl] = count;
            }
          } catch {
            // table may not exist yet
          }
        })
      );
    }

    return {
      connected: true,
      latencyMs,
      statusCode: resp.status,
      detectedTablesCount: tablesCount,
      tableCounts: counts,
      message: tablesCount > 0
        ? 'Supabase PostgreSQL bazasiga real-time muvaffaqiyatli ulandi!'
        : 'Supabase ulandi, lekin jadvallar hali yaratilmagan. SQL sxemani SQL Editor orqali ishga tushiring.',
      lastChecked: new Date().toLocaleTimeString('uz-UZ')
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Math.round(performance.now() - start),
      statusCode: 0,
      message: `Tarmoq xatosi: ${err?.message || 'Ulanib bo\'lmadi'}`,
      lastChecked: new Date().toLocaleTimeString('uz-UZ')
    };
  }
}

// Fetch all collections from Supabase
export async function fetchAllFromSupabase(): Promise<SupabaseSyncPayload | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [
      usersRes,
      ordersRes,
      projectsRes,
      tasksRes,
      notesRes,
      chatsRes,
      remindersRes,
      activitiesRes,
      notificationsRes,
      settingsRes
    ] = await Promise.all([
      client.from('users').select('*').order('registered_at', { ascending: false }),
      client.from('orders').select('*').order('created_at', { ascending: false }),
      client.from('projects').select('*'),
      client.from('tasks').select('*').order('date', { ascending: false }),
      client.from('notes').select('*').order('created_at', { ascending: false }),
      client.from('chats').select('*').order('created_at', { ascending: true }),
      client.from('reminders').select('*'),
      client.from('activities').select('*').order('timestamp', { ascending: false }).limit(200),
      client.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
      client.from('site_settings').select('*').eq('id', 'default').maybeSingle()
    ]);

    const result: SupabaseSyncPayload = {};

    if (!usersRes.error && usersRes.data) {
      result.users = usersRes.data.map((r: any) => ({
        id: r.id,
        username: r.username,
        password: r.password,
        firstName: r.first_name || '',
        lastName: r.last_name || '',
        phone: r.phone || '',
        email: r.email || '',
        telegramUsername: r.telegram_username || '',
        role: r.role,
        avatar: r.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${r.username}`,
        registeredAt: r.registered_at
      }));
    }

    if (!ordersRes.error && ordersRes.data) {
      result.orders = ordersRes.data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        clientName: r.client_name,
        clientPhone: r.client_phone,
        clientTelegram: r.client_telegram,
        projectType: r.project_type,
        projectName: r.project_name,
        description: r.description,
        budget: r.budget,
        deadline: r.deadline,
        status: r.status,
        createdAt: r.created_at,
        adminNotes: r.admin_notes,
        acceptedById: r.accepted_by_id,
        acceptedByName: r.accepted_by_name,
        assignedMemberId: r.assigned_member_id,
        assignedMemberName: r.assigned_member_name
      }));
    }

    if (!projectsRes.error && projectsRes.data) {
      result.projects = projectsRes.data.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        status: r.status,
        version: r.version || 'v1.0'
      }));
    }

    if (!tasksRes.error && tasksRes.data) {
      result.tasks = tasksRes.data.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        completed: Boolean(r.completed),
        createdById: r.created_by_id,
        createdByName: r.created_by_name,
        assignedToId: r.assigned_to_id,
        assignedToName: r.assigned_to_name,
        date: r.date
      }));
    }

    if (!notesRes.error && notesRes.data) {
      result.notes = notesRes.data.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        isPrivate: Boolean(r.is_private),
        authorId: r.author_id,
        authorName: r.author_name,
        createdAt: r.created_at,
        category: r.category
      }));
    }

    if (!chatsRes.error && chatsRes.data) {
      result.chats = chatsRes.data.map((r: any) => ({
        id: r.id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderRole: r.sender_role,
        senderAvatar: r.sender_avatar,
        text: r.text,
        timestamp: r.timestamp_label || new Date(r.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        chatId: r.chat_id || 'general',
        attachmentUrl: r.attachment_url,
        isEdited: Boolean(r.is_edited),
        audioUrl: r.audio_url,
        audioDuration: r.audio_duration
      }));
    }

    if (!remindersRes.error && remindersRes.data) {
      result.reminders = remindersRes.data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        date: r.date,
        completed: Boolean(r.completed)
      }));
    }

    if (!activitiesRes.error && activitiesRes.data) {
      result.activities = activitiesRes.data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userRole: r.user_role,
        action: r.action,
        target: r.target,
        timestamp: r.timestamp
      }));
    }

    if (!notificationsRes.error && notificationsRes.data) {
      result.notifications = notificationsRes.data.map((r: any) => ({
        id: r.id,
        message: r.message,
        read: Boolean(r.read),
        time: r.time_label || new Date(r.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      }));
    }

    if (!settingsRes.error && settingsRes.data && settingsRes.data.data) {
      result.siteSettings = settingsRes.data.data;
    }

    return result;
  } catch (err) {
    console.warn('[Supabase Sync] Fetch warning:', err);
    return null;
  }
}

// Individual Upsert & Delete Sync Helpers (non-blocking background sync)
export const sbSync = {
  async upsertUser(u: User) {
    const client = getSupabaseClient();
    if (!client) return;
    const payload: Record<string, any> = {
      id: u.id,
      username: u.username,
      first_name: u.firstName || '',
      last_name: u.lastName || '',
      phone: u.phone || '',
      email: u.email || '',
      telegram_username: u.telegramUsername || '',
      role: u.role,
      avatar: u.avatar || '',
      registered_at: u.registeredAt || new Date().toISOString()
    };
    if (u.password) {
      payload.password = u.password;
    }
    await client.from('users').upsert(payload);
  },
  async deleteUser(userId: string) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('users').delete().eq('id', userId);
  },

  async upsertOrder(o: Order) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('orders').upsert({
      id: o.id,
      user_id: o.userId,
      client_name: o.clientName,
      client_phone: o.clientPhone,
      client_telegram: o.clientTelegram,
      project_type: o.projectType,
      project_name: o.projectName,
      description: o.description,
      budget: o.budget || '',
      deadline: o.deadline || '',
      status: o.status,
      admin_notes: o.adminNotes || '',
      accepted_by_id: o.acceptedById || null,
      accepted_by_name: o.acceptedByName || null,
      assigned_member_id: o.assignedMemberId || null,
      assigned_member_name: o.assignedMemberName || null,
      created_at: o.createdAt || new Date().toISOString()
    });
  },

  async upsertProject(p: Project) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('projects').upsert({
      id: p.id,
      name: p.name,
      description: p.description || '',
      status: p.status,
      version: p.version || 'v1.0'
    });
  },
  async deleteProject(id: string) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('projects').delete().eq('id', id);
  },

  async upsertTask(t: Task) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('tasks').upsert({
      id: t.id,
      title: t.title,
      description: t.description || '',
      completed: Boolean(t.completed),
      created_by_id: t.createdById,
      created_by_name: t.createdByName,
      assigned_to_id: t.assignedToId,
      assigned_to_name: t.assignedToName,
      date: t.date
    });
  },
  async deleteTask(id: string) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('tasks').delete().eq('id', id);
  },

  async upsertNote(n: NoteItem) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('notes').upsert({
      id: n.id,
      title: n.title,
      content: n.content,
      is_private: Boolean(n.isPrivate),
      author_id: n.authorId,
      author_name: n.authorName,
      category: n.category || 'Umumiy',
      created_at: n.createdAt || new Date().toISOString()
    });
  },
  async deleteNote(id: string) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('notes').delete().eq('id', id);
  },

  async upsertChat(m: ChatMessage) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('chats').upsert({
      id: m.id,
      sender_id: m.senderId,
      sender_name: m.senderName,
      sender_role: m.senderRole,
      sender_avatar: m.senderAvatar || '',
      text: m.text,
      timestamp_label: m.timestamp,
      chat_id: m.chatId || 'general',
      attachment_url: m.attachmentUrl || null,
      is_edited: Boolean(m.isEdited),
      audio_url: m.audioUrl || null,
      audio_duration: m.audioDuration || 0,
      created_at: new Date().toISOString()
    });
  },
  async deleteChat(id: string) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('chats').delete().eq('id', id);
  },

  async upsertReminder(r: ReminderPlan) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('reminders').upsert({
      id: r.id,
      user_id: r.userId,
      title: r.title,
      date: r.date,
      completed: Boolean(r.completed)
    });
  },
  async deleteReminder(id: string) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('reminders').delete().eq('id', id);
  },

  async insertActivity(a: MemberActivity) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('activities').upsert({
      id: a.id,
      user_id: a.userId,
      user_name: a.userName,
      user_role: a.userRole,
      action: a.action,
      target: a.target || '',
      timestamp: a.timestamp || new Date().toISOString()
    });
  },

  async upsertNotification(n: NotificationItem) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('notifications').upsert({
      id: n.id,
      message: n.message,
      read: Boolean(n.read),
      time_label: n.time,
      created_at: new Date().toISOString()
    });
  },

  async saveSiteSettings(settings: SiteSettings) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('site_settings').upsert({
      id: 'default',
      data: settings,
      updated_at: new Date().toISOString()
    });
  }
};

export const FULL_SUPABASE_SQL = `-- VISIONCORE GROUP TO'LIQ SUPABASE (POSTGRESQL 15+) SXEMASI
-- Ushbu kodni Supabase Dashboard -> SQL Editor ga tashlab "Run" bosing.

CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(30) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '',
  first_name VARCHAR(100) DEFAULT '',
  last_name VARCHAR(100) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  email VARCHAR(150) DEFAULT '',
  telegram_username VARCHAR(100) DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  avatar TEXT DEFAULT '',
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(60) PRIMARY KEY,
  user_id VARCHAR(30),
  client_name VARCHAR(150) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_telegram VARCHAR(100) NOT NULL,
  project_type VARCHAR(50) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget VARCHAR(100) DEFAULT '',
  deadline VARCHAR(100) DEFAULT '',
  status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT DEFAULT '',
  accepted_by_id VARCHAR(30),
  accepted_by_name VARCHAR(150),
  assigned_member_id VARCHAR(30),
  assigned_member_name VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(50) NOT NULL DEFAULT 'Planning',
  version VARCHAR(30) DEFAULT 'v1.0.0'
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id VARCHAR(60) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  created_by_id VARCHAR(30),
  created_by_name VARCHAR(150),
  assigned_to_id VARCHAR(30),
  assigned_to_name VARCHAR(150),
  date VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS public.notes (
  id VARCHAR(60) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  author_id VARCHAR(30),
  author_name VARCHAR(150),
  category VARCHAR(100) DEFAULT 'Umumiy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chats (
  id VARCHAR(80) PRIMARY KEY,
  sender_id VARCHAR(30) NOT NULL,
  sender_name VARCHAR(150) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  sender_avatar TEXT DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  timestamp_label VARCHAR(50) DEFAULT '',
  chat_id VARCHAR(120) NOT NULL DEFAULT 'general',
  attachment_url TEXT,
  is_edited BOOLEAN DEFAULT false,
  audio_url TEXT,
  audio_duration INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id VARCHAR(60) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(50) DEFAULT '',
  completed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.activities (
  id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action TEXT NOT NULL,
  target VARCHAR(255) DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id VARCHAR(80) PRIMARY KEY,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  time_label VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id VARCHAR(30) PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time & RLS ruxsatlari (Boshliq hisobi backend orqali xavfsiz boshqariladi)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['users','orders','projects','tasks','notes','chats','reminders','activities','notifications','site_settings'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public All" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Public All" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;`;
