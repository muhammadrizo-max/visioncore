import { api } from './api';
import {
  User, Order, Project, Task, NoteItem, ChatMessage, ReminderPlan,
  MemberActivity, NotificationItem, SiteSettings
} from '../types';

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

// Eski sozlamalar (URL/kalit kiritish) endi kerak emas. Ma'lumot serverdan keladi.
export const getStoredSupabaseConfig = () => ({ url: '', anonKey: '' });
export const saveSupabaseConfig = (_url: string, _anonKey: string) => {};
export const loadBackendSupabaseEnv = async () => true;
export const getSupabaseClient = () => null;

const LOCAL_TIME = (iso: string) =>
  new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

const mapUser = (r: any): User => ({
  id: r.id,
  username: r.username,
  firstName: r.first_name || '',
  lastName: r.last_name || '',
  phone: r.phone || '',
  email: r.email || '',
  telegramUsername: r.telegram_username || '',
  role: r.role,
  avatar: r.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${r.username}`,
  registeredAt: r.created_at,
});

export async function testSupabaseHealth() {
  const start = performance.now();
  try {
    const d = await api<any>('/api/db/health');
    return {
      connected: true,
      latencyMs: Math.round(performance.now() - start),
      statusCode: 200,
      detectedTablesCount: 10,
      tableCounts: {},
      message: d.message,
      lastChecked: d.lastChecked,
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Math.round(performance.now() - start),
      statusCode: 0,
      message: err?.message || "Ulanib bo'lmadi",
      lastChecked: new Date().toLocaleTimeString('uz-UZ'),
    };
  }
}

export async function fetchAllFromSupabase(): Promise<SupabaseSyncPayload | null> {
  try {
    const raw = await api<Record<string, any[]>>('/api/sync');
    return {
      users: (raw.users ?? []).map(mapUser),
      orders: (raw.orders ?? []).map((r: any) => {
        const meta = r._assignmentMeta;
        let ids: string[] = [];
        let names: string[] = [];
        let byCreator = false;

        if (meta && Array.isArray(meta.ids)) {
          ids = meta.ids.map((s: any) => String(s).trim()).filter(Boolean);
          names = Array.isArray(meta.names)
            ? meta.names.map((s: any) => String(s).trim()).filter(Boolean)
            : [];
          byCreator = Boolean(meta.byCreator);
        } else {
          const rawIdStr = String(r.assigned_member_id || '');
          byCreator = rawIdStr.startsWith('CREATOR::');
          const cleanedIdStr = byCreator ? rawIdStr.slice(9) : rawIdStr;
          ids = cleanedIdStr
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
          names = String(r.assigned_member_name || '')
            .split('|')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }

        return {
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
          assignedMemberId: ids[0] || undefined,
          assignedMemberName: names[0] || undefined,
          assignedMemberIds: ids,
          assignedMemberNames: names,
          assignedByCreator: byCreator,
        };
      }),
      projects: (raw.projects ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        status: r.status,
        version: r.version || 'v1.0',
      })),
      tasks: (raw.tasks ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        completed: Boolean(r.completed),
        createdById: r.created_by_id,
        createdByName: r.created_by_name,
        assignedToId: r.assigned_to_id,
        assignedToName: r.assigned_to_name,
        date: r.date,
      })),
      notes: (raw.notes ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        isPrivate: Boolean(r.is_private),
        authorId: r.author_id,
        authorName: r.author_name,
        createdAt: r.created_at,
        category: r.category,
      })),
      chats: (raw.chats ?? []).map((r: any) => ({
        id: r.id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderRole: r.sender_role,
        senderAvatar: r.sender_avatar,
        text: r.text,
        timestamp: r.timestamp_label || LOCAL_TIME(r.created_at),
        createdAt: r.created_at,
        chatId: r.chat_id || 'general',
        attachmentUrl: r.attachment_url,
        isEdited: Boolean(r.is_edited),
        audioUrl: r.audio_url,
        audioDuration: r.audio_duration,
      })),
      reminders: (raw.reminders ?? []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        date: r.date,
        completed: Boolean(r.completed),
      })),
      activities: (raw.activities ?? []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userRole: r.user_role,
        action: r.action,
        target: r.target,
        timestamp: r.timestamp,
      })),
      notifications: (raw.notifications ?? []).map((r: any) => {
        const meta = r._notifMeta;
        if (meta && typeof meta === 'object') {
          return {
            id: r.id,
            message: r.message,
            read: Boolean(r.read),
            time: meta.t || r.time_label || LOCAL_TIME(r.created_at),
            targetScope: meta.scope || 'creator',
            targetUserIds: Array.isArray(meta.to) ? meta.to : undefined,
            category: meta.cat || 'system',
            actionMenu: meta.menu || undefined,
            readByUserIds: Array.isArray(meta.rb) ? meta.rb : undefined,
          };
        }
        const rawLabel = String(r.time_label || '');
        if (rawLabel.startsWith('META::')) {
          try {
            const legacy = JSON.parse(rawLabel.slice(6));
            return {
              id: r.id,
              message: r.message,
              read: Boolean(r.read),
              time: legacy.t || LOCAL_TIME(r.created_at),
              targetScope: legacy.scope || 'creator',
              targetUserIds: Array.isArray(legacy.to) ? legacy.to : undefined,
              category: legacy.cat || 'system',
              actionMenu: legacy.menu || undefined,
              readByUserIds: Array.isArray(legacy.rb) ? legacy.rb : undefined,
            };
          } catch {
            // fallback
          }
        }
        return {
          id: r.id,
          message: r.message,
          read: Boolean(r.read),
          time: rawLabel || LOCAL_TIME(r.created_at),
          targetScope: 'creator' as const,
          category: 'system' as const,
        };
      }),
      siteSettings: raw.site_settings?.[0]?.data,
    };
  } catch (err) {
    console.warn('[Sync] fetch failed:', err);
    return null;
  }
}

const upsert = async (table: string, row: Record<string, unknown>, extra?: Record<string, unknown>) => {
  try {
    await api(`/api/db/${table}/upsert`, { method: 'POST', body: JSON.stringify({ row, ...extra }) });
  } catch (err) {
    console.error(`[sync:${table}]`, err);
  }
};

const remove = async (table: string, id: string) => {
  try {
    await api(`/api/db/${table}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (err) {
    console.error(`[sync:${table}]`, err);
  }
};

export const sbSync = {
  upsertUser: (u: User) =>
    upsert('users', {
      id: u.id,
      username: u.username,
      first_name: u.firstName || '',
      last_name: u.lastName || '',
      phone: u.phone || '',
      email: u.email || '',
      telegram_username: u.telegramUsername || '',
      role: u.role,
      avatar: u.avatar || '',
      created_at: u.registeredAt || new Date().toISOString(),
    }),

  deleteUser: (id: string) => remove('users', id),

  createMember: async (u: User) => {
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          id: u.id,
          username: u.username,
          password: u.password,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          email: u.email,
          telegramUsername: u.telegramUsername,
          role: u.role,
        }),
      });
    } catch (err) {
      console.error('[sync:createMember]', err);
    }
  },

  upsertOrder: (o: Order) => {
    const ids = (o.assignedMemberIds && o.assignedMemberIds.length > 0
      ? o.assignedMemberIds
      : o.assignedMemberId
      ? [o.assignedMemberId]
      : []
    ).filter(Boolean);
    const names = (o.assignedMemberNames && o.assignedMemberNames.length > 0
      ? o.assignedMemberNames
      : o.assignedMemberName
      ? [o.assignedMemberName]
      : []
    ).filter(Boolean);

    return upsert(
      'orders',
      {
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
        accepted_by_id: o.acceptedById ? String(o.acceptedById).slice(0, 30) : null,
        accepted_by_name: o.acceptedByName || null,
        assigned_member_id: ids[0] ? String(ids[0]).slice(0, 30) : null,
        assigned_member_name: names[0] ? String(names[0]).slice(0, 100) : null,
        created_at: o.createdAt || new Date().toISOString(),
      },
      {
        assignmentMeta: {
          ids,
          names,
          byCreator: Boolean(o.assignedByCreator),
        },
      }
    );
  },

  upsertProject: (p: Project) =>
    upsert('projects', {
      id: p.id,
      name: p.name,
      description: p.description || '',
      status: p.status,
      version: p.version || 'v1.0',
    }),
  deleteProject: (id: string) => remove('projects', id),

  upsertTask: (t: Task) =>
    upsert('tasks', {
      id: t.id,
      title: t.title,
      description: t.description || '',
      completed: Boolean(t.completed),
      created_by_id: t.createdById,
      created_by_name: t.createdByName,
      assigned_to_id: t.assignedToId,
      assigned_to_name: t.assignedToName,
      date: t.date,
    }),
  deleteTask: (id: string) => remove('tasks', id),

  upsertNote: (n: NoteItem) =>
    upsert('notes', {
      id: n.id,
      title: n.title,
      content: n.content,
      is_private: Boolean(n.isPrivate),
      author_id: n.authorId,
      author_name: n.authorName,
      category: n.category || 'Umumiy',
      created_at: n.createdAt || new Date().toISOString(),
    }),
  deleteNote: (id: string) => remove('notes', id),

  upsertChat: (m: ChatMessage) =>
    upsert('chats', {
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
      created_at: m.createdAt || new Date().toISOString(),
    }),
  deleteChat: (id: string) => remove('chats', id),

  upsertReminder: (r: ReminderPlan) =>
    upsert('reminders', {
      id: r.id,
      user_id: r.userId,
      title: r.title,
      date: r.date,
      completed: Boolean(r.completed),
    }),
  deleteReminder: (id: string) => remove('reminders', id),

  insertActivity: (a: MemberActivity) =>
    upsert('activities', {
      id: a.id,
      user_id: a.userId,
      user_name: a.userName,
      user_role: a.userRole,
      action: a.action,
      target: a.target || '',
      timestamp: a.timestamp || new Date().toISOString(),
    }),

  upsertNotification: (n: NotificationItem) => {
    const notifMeta = {
      t: n.time,
      scope: n.targetScope || 'creator',
      ...(n.targetUserIds?.length ? { to: n.targetUserIds } : {}),
      ...(n.category ? { cat: n.category } : {}),
      ...(n.actionMenu ? { menu: n.actionMenu } : {}),
      ...(n.readByUserIds?.length ? { rb: n.readByUserIds } : {}),
    };
    return upsert(
      'notifications',
      {
        id: n.id,
        message: n.message,
        read: Boolean(n.read),
        time_label: String(n.time || '').slice(0, 45),
        created_at: new Date().toISOString(),
      },
      { notifMeta }
    );
  },

  clearNotifications: async () => {
    try {
      await api('/api/db/notifications/clear', { method: 'POST' });
    } catch (err) {
      console.error('[sync:notifications]', err);
    }
  },

  saveSiteSettings: (settings: SiteSettings) =>
    upsert('site_settings', {
      id: 'default',
      data: settings,
      updated_at: new Date().toISOString(),
    }),
};
