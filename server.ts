import crypto from 'crypto';
import path from 'path';
import express, { type NextFunction, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 15_000;
const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;
const MEMBER_ID_RE = /^vcg[-_]\d{8}$/;
const ROLES = ['engineer', 'researcher', 'designer', 'analyst', 'user'];
const OWNER_ID = 'vcg-90000001';

// ---------- Konfiguratsiya (xato bo'lsa ham server yiqilmaydi) ----------
const env = (name: string) => process.env[name]?.trim() ?? '';

const SESSION_SECRET = env('SESSION_SECRET');
const AUTH_READY = SESSION_SECRET.length >= 32;

const SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const SUPABASE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const DB_READY = SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 0;
const db = createClient(
  DB_READY ? SUPABASE_URL : 'https://placeholder.supabase.co',
  DB_READY ? SUPABASE_KEY : 'placeholder',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const ADMIN_KEY_HEX = env('ADMIN_DATA_KEY');
const ADMIN_KEY = /^[0-9a-fA-F]{64}$/.test(ADMIN_KEY_HEX) ? Buffer.from(ADMIN_KEY_HEX, 'hex') : null;

const normalizeUsername = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const ilikeEscape = (v: string) => v.replace(/[\\%_]/g, (c) => `\\${c}`);
const fail = (res: Response, status: number, error: string) => {
  res.status(status).json({ error });
};

// ---------- Parol xeshlash ----------
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const DUMMY_HASH = hashPassword('timing-equalizer');
const OWNER_USERNAME = normalizeUsername(env('OWNER_USERNAME'));
const OWNER_PASSWORD = env('OWNER_PASSWORD');
const OWNER_PASSWORD_HASH = OWNER_PASSWORD ? hashPassword(OWNER_PASSWORD) : null;
const OWNER_ENABLED = Boolean(OWNER_USERNAME && OWNER_PASSWORD_HASH);

// ---------- Admin uchun shifrlash (parollarni ko'rsatish) ----------
function encryptSecret(plain: string): string | null {
  if (!ADMIN_KEY) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ADMIN_KEY, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${data.toString('base64')}`;
}

function decryptSecret(stored: string): string | null {
  if (!ADMIN_KEY) return null;
  try {
    const [ivB, tagB, dataB] = stored.split('.');
    if (!ivB || !tagB || !dataB) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', ADMIN_KEY, Buffer.from(ivB, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(dataB, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// ---------- Token (HMAC-SHA256) ----------
interface Session {
  sub: string;
  username: string;
  role: string;
  exp: number;
}

type AuthedRequest = Request & { session: Session };

function signToken(payload: Session): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): Session | null {
  if (!AUTH_READY) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

const sessionFrom = (req: Request): Session | null => {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
};

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = sessionFrom(req);
  if (!session) {
    fail(res, 401, 'Avtorizatsiya talab qilinadi');
    return;
  }
  (req as AuthedRequest).session = session;
  next();
}

function requireCreator(req: Request, res: Response, next: NextFunction) {
  const session = sessionFrom(req);
  if (!session) {
    fail(res, 401, 'Avtorizatsiya talab qilinadi');
    return;
  }
  if (session.role !== 'creator') {
    fail(res, 403, 'Faqat creator uchun');
    return;
  }
  (req as AuthedRequest).session = session;
  next();
}

const sessionOf = (req: Request) => (req as AuthedRequest).session;

// ---------- Rate limiter ----------
function rateLimit(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; reset: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      next();
      return;
    }
    entry.count += 1;
    if (entry.count > max) {
      fail(res, 429, "Juda ko'p so'rov. Keyinroq urinib ko'ring");
      return;
    }
    next();
  };
}

const loginLimiter = rateLimit(15 * 60 * 1000, 10);
const registerLimiter = rateLimit(15 * 60 * 1000, 20);
const checkUsernameLimiter = rateLimit(60 * 1000, 30);
const searchLimiter = rateLimit(60 * 1000, 20);

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

// ---------- Foydalanuvchi ----------
interface UserRow {
  id: string;
  username: string;
  password_hash?: string | null;
  password?: string | null;
  password_enc?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  telegram_username?: string | null;
  role: string;
  avatar?: string | null;
  created_at?: string | null;
}

const toPublicUser = (row: UserRow & { registered_at?: string | null }) => ({
  id: row.id,
  username: row.username,
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  telegramUsername: row.telegram_username ?? '',
  role: row.role,
  avatar: row.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.username)}`,
  registeredAt: row.created_at ?? row.registered_at ?? null,
});

type PublicUser = ReturnType<typeof toPublicUser>;

const issueToken = (user: PublicUser) =>
  signToken({ sub: user.id, username: user.username, role: user.role, exp: Date.now() + SESSION_TTL_MS });

async function ensureOwnerRow(): Promise<UserRow> {
  const { data } = await db.from('users').select('*').eq('id', OWNER_ID).maybeSingle();
  if (data) return data as UserRow;

  const baseOwner: Record<string, unknown> = {
    id: OWNER_ID,
    username: OWNER_USERNAME,
    role: 'creator',
    first_name: 'Boshliq',
    last_name: '(Creator)',
    phone: '+998 90 000 00 00',
    email: 'creator@visioncore.group',
    telegram_username: '@visioncore_creator',
    avatar: '',
  };

  // Try modern column (created_at) first, then legacy (registered_at), and never block login on schema mismatch
  const firstTry = await db
    .from('users')
    .insert({ ...baseOwner, created_at: new Date().toISOString() })
    .select('*')
    .maybeSingle();

  if (firstTry.data) return firstTry.data as UserRow;

  const fallbackTry = await db
    .from('users')
    .insert({ ...baseOwner, registered_at: new Date().toISOString() })
    .select('*')
    .maybeSingle();

  if (fallbackTry.data) return fallbackTry.data as UserRow;

  console.warn('[ensureOwnerRow] DB insert skipped:', firstTry.error?.message || fallbackTry.error?.message);
  return {
    id: OWNER_ID,
    username: OWNER_USERNAME,
    role: 'creator',
    first_name: 'Boshliq',
    last_name: '(Creator)',
    phone: '+998 90 000 00 00',
    email: 'creator@visioncore.group',
    telegram_username: '@visioncore_creator',
    avatar: '',
    created_at: new Date().toISOString(),
  };
}

// ---------- Jadval siyosati ----------
interface TableCfg {
  columns: string[];
  order: string;
  asc?: boolean;
  limit?: number;
  owner?: string;
  strict?: boolean;
  creatorOnlyDelete?: boolean;
}

const TABLES: Record<string, TableCfg> = {
  users: {
    columns: ['id', 'username', 'first_name', 'last_name', 'phone', 'email', 'telegram_username', 'role', 'avatar', 'created_at'],
    order: 'created_at',
    creatorOnlyDelete: true,
  },
  orders: {
    columns: ['id', 'user_id', 'client_name', 'client_phone', 'client_telegram', 'project_type', 'project_name', 'description', 'budget', 'deadline', 'status', 'admin_notes', 'accepted_by_id', 'accepted_by_name', 'assigned_member_id', 'assigned_member_name', 'created_at'],
    order: 'created_at',
  },
  projects: {
    columns: ['id', 'name', 'description', 'status', 'version'],
    order: 'id',
    asc: true,
    creatorOnlyDelete: true,
  },
  tasks: {
    columns: ['id', 'title', 'description', 'completed', 'created_by_id', 'created_by_name', 'assigned_to_id', 'assigned_to_name', 'date'],
    order: 'date',
  },
  notes: {
    columns: ['id', 'title', 'content', 'is_private', 'author_id', 'author_name', 'category', 'created_at'],
    order: 'created_at',
    owner: 'author_id',
    strict: true,
  },
  chats: {
    columns: ['id', 'sender_id', 'sender_name', 'sender_role', 'sender_avatar', 'text', 'timestamp_label', 'chat_id', 'attachment_url', 'is_edited', 'audio_url', 'audio_duration', 'created_at'],
    order: 'created_at',
    asc: true,
    owner: 'sender_id',
    strict: true,
  },
  reminders: {
    columns: ['id', 'user_id', 'title', 'date', 'completed'],
    order: 'id',
    asc: true,
    owner: 'user_id',
    strict: true,
  },
  activities: {
    columns: ['id', 'user_id', 'user_name', 'user_role', 'action', 'target', 'timestamp'],
    order: 'timestamp',
    limit: 200,
  },
  notifications: {
    columns: ['id', 'message', 'read', 'time_label', 'created_at'],
    order: 'created_at',
    limit: 100,
  },
  site_settings: {
    columns: ['id', 'data', 'updated_at'],
    order: 'id',
    asc: true,
  },
};

// ---------- Konfiguratsiya tekshiruvi (health va config dan tashqari hammasi uchun) ----------
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '5mb' }));

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/config') {
    next();
    return;
  }
  if (!DB_READY || !AUTH_READY) {
    const missing: string[] = [];
    if (!SUPABASE_URL.startsWith('http')) missing.push('SUPABASE_URL');
    if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (SESSION_SECRET.length < 32) missing.push('SESSION_SECRET (kamida 32 belgi)');
    fail(res, 503, `Server muhit o'zgaruvchilari yetishmayapti: ${missing.join(', ')}`);
    return;
  }
  next();
});

const pickColumns = (row: Record<string, unknown>, allowed: string[]) => {
  const out: Record<string, unknown> = {};
  for (const col of allowed) {
    if (col in row && row[col] !== undefined) {
      out[col] = row[col];
    }
  }
  return out;
};

// ---------- Health & Config ----------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    dbReady: DB_READY,
    authReady: AUTH_READY,
    ownerEnabled: OWNER_ENABLED,
  });
});

app.get('/api/config', asyncRoute(async (_req, res) => {
  let siteSettings = null;
  if (DB_READY) {
    try {
      const { data } = await db.from('site_settings').select('data').eq('id', 'default').maybeSingle();
      if (data?.data && typeof data.data === 'object') {
        siteSettings = data.data;
      }
    } catch {
      // ignore
    }
  }
  res.json({
    siteName: 'VisionCore Group',
    authMode: 'backend',
    siteSettings,
  });
}));

// ---------- Auth ----------
app.post('/api/auth/login', loginLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const invalid = () => fail(res, 401, "Login yoki parol noto'g'ri kiritildi!");

  if (!username || !password || password.length > 200) {
    fail(res, 400, "Login va parolni to'g'ri kiriting!");
    return;
  }

  // 1. Master Owner credentials check (from server / Vercel environment variables)
  if (OWNER_ENABLED && OWNER_PASSWORD_HASH && username === OWNER_USERNAME) {
    if (safeEqual(password, OWNER_PASSWORD) || verifyPassword(password, OWNER_PASSWORD_HASH)) {
      const ownerRow = await ensureOwnerRow();
      const user = toPublicUser(ownerRow);
      res.json({ token: issueToken(user), user });
      return;
    }
  }

  if (!USERNAME_RE.test(username)) {
    invalid();
    return;
  }

  // 2. Registered user / team member lookup in Supabase
  const { data } = await db
    .from('users')
    .select('*')
    .ilike('username', ilikeEscape(username))
    .maybeSingle();

  if (!data) {
    verifyPassword(password, DUMMY_HASH);
    invalid();
    return;
  }

  const row = data as UserRow;
  let valid = false;
  if (row.password_hash) {
    valid = verifyPassword(password, row.password_hash);
  } else if (row.password) {
    valid = safeEqual(password, row.password);
    if (valid) {
      await db.from('users').update({ password_hash: hashPassword(password) }).eq('id', row.id);
    }
  } else {
    verifyPassword(password, DUMMY_HASH);
  }

  if (!valid) {
    invalid();
    return;
  }

  const user = toPublicUser(row);
  res.json({ token: issueToken(user), user });
}));

app.post('/api/auth/register', registerLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const firstName = str(req.body?.firstName, 100);
  const lastName = str(req.body?.lastName, 100);
  const phone = str(req.body?.phone, 50);
  const email = str(req.body?.email, 150);
  const telegramUsername = str(req.body?.telegramUsername, 100);
  const rawId = str(req.body?.id, 30);
  const rawRole = str(req.body?.role, 30);

  if (!USERNAME_RE.test(username) || username.length < 3) {
    fail(res, 400, "Username kamida 3 ta lotin harf/raqamdan iborat bo'lsin!");
    return;
  }
  if (password.length < 6 || password.length > 200) {
    fail(res, 400, "Parol kamida 6 ta belgidan iborat bo'lsin!");
    return;
  }
  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    fail(res, 409, 'Ushbu username band!');
    return;
  }

  const { data: existing } = await db
    .from('users')
    .select('id')
    .ilike('username', ilikeEscape(username))
    .maybeSingle();

  if (existing) {
    fail(res, 409, 'Ushbu username band!');
    return;
  }

  const callerSession = sessionFrom(req);
  const assignedRole =
    callerSession?.role === 'creator' && ROLES.includes(rawRole) ? rawRole : 'user';

  const id = MEMBER_ID_RE.test(rawId)
    ? rawId
    : `vcg-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const passwordHash = hashPassword(password);
  const passwordEnc = encryptSecret(password);

  const insertPayload: Record<string, unknown> = {
    id,
    username,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
    phone,
    email,
    telegram_username: telegramUsername,
    role: assignedRole,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`,
    created_at: new Date().toISOString(),
  };
  if (passwordEnc) {
    insertPayload.password_enc = passwordEnc;
  }

  const { data: created, error } = await db
    .from('users')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !created) {
    fail(res, 500, error?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    return;
  }

  const user = toPublicUser(created as UserRow);
  res.status(201).json({ token: issueToken(user), user });
}));

app.post('/api/auth/check-username', checkUsernameLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!USERNAME_RE.test(username)) {
    res.json({ available: false, error: "Username noto'g'ri formatda!" });
    return;
  }
  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    res.json({ available: false, error: 'Ushbu username band!' });
    return;
  }
  const { data } = await db
    .from('users')
    .select('id')
    .ilike('username', ilikeEscape(username))
    .maybeSingle();

  res.json({
    available: !data,
    ...(data ? { error: 'Ushbu username band!' } : {}),
  });
}));

app.get('/api/admin/lookup', requireCreator, asyncRoute(async (req, res) => {
  const id = str(req.query.id, 30);
  if (!id) {
    fail(res, 400, 'ID kiriting');
    return;
  }
  const { data } = await db
    .from('users')
    .select('*')
    .ilike('id', ilikeEscape(id))
    .maybeSingle();

  if (!data) {
    fail(res, 404, 'Foydalanuvchi topilmadi');
    return;
  }
  res.json(toPublicUser(data as UserRow));
}));

app.post('/api/admin/members/reset-password', requireCreator, asyncRoute(async (req, res) => {
  const id = str(req.body?.id, 30);
  if (!id || id === OWNER_ID) {
    fail(res, 400, "Foydalanuvchi ID noto'g'ri");
    return;
  }

  const { data: userRow } = await db.from('users').select('id, username').eq('id', id).maybeSingle();
  if (!userRow) {
    fail(res, 404, 'Foydalanuvchi topilmadi');
    return;
  }

  const newPassword = `vcg_${crypto.randomBytes(5).toString('hex')}`;
  const updatePayload: Record<string, unknown> = {
    password_hash: hashPassword(newPassword),
  };
  const enc = encryptSecret(newPassword);
  if (enc) updatePayload.password_enc = enc;

  const { error } = await db.from('users').update(updatePayload).eq('id', id);
  if (error) {
    fail(res, 500, error.message);
    return;
  }
  res.json({ password: newPassword, username: userRow.username });
}));

// ---------- Database Sync & CRUD ----------
app.get('/api/db/health', requireAuth, asyncRoute(async (_req, res) => {
  const { error } = await db.from('users').select('id').limit(1);
  if (error) {
    fail(res, 500, error.message);
    return;
  }
  res.json({
    connected: true,
    message: 'Supabase PostgreSQL bazasiga xavfsiz ulandi!',
    lastChecked: new Date().toLocaleTimeString('uz-UZ'),
  });
}));

app.get('/api/sync', requireAuth, asyncRoute(async (req, res) => {
  const session = sessionOf(req);
  const isCreator = session.role === 'creator';
  const isUser = session.role === 'user';

  const result: Record<string, unknown[]> = {};

  await Promise.all(
    Object.entries(TABLES).map(async ([table, cfg]) => {
      if ((table === 'tasks' || table === 'activities') && isUser) {
        result[table] = [];
        return;
      }
      if (table === 'notifications' && !isCreator) {
        result[table] = [];
        return;
      }

      let q = db.from(table).select(cfg.columns.join(', '));

      if (table === 'orders' && isUser) {
        q = q.eq('user_id', session.sub);
      } else if (table === 'notes') {
        if (isUser) {
          q = q.eq('author_id', session.sub);
        } else if (!isCreator) {
          q = q.or(`is_private.eq.false,author_id.eq.${session.sub}`);
        }
      } else if (table === 'chats') {
        const safeSub = ilikeEscape(session.sub);
        q = q.or(`chat_id.eq.general,sender_id.eq.${session.sub},chat_id.ilike.%${safeSub}%`);
      } else if (table === 'reminders') {
        q = q.eq('user_id', session.sub);
      }

      q = q.order(cfg.order, { ascending: Boolean(cfg.asc) });
      if (cfg.limit) q = q.limit(cfg.limit);

      const { data, error } = await q;
      if (error) {
        console.warn(`[sync:${table}]`, error.message);
        result[table] = [];
      } else {
        result[table] = data ?? [];
      }
    }),
  );

  res.json(result);
}));

app.post('/api/db/:table/upsert', requireAuth, asyncRoute(async (req, res) => {
  const session = sessionOf(req);
  const table = req.params.table;
  const cfg = TABLES[table];
  if (!cfg) {
    fail(res, 404, 'Jadval topilmadi');
    return;
  }

  const rawRow = req.body?.row;
  if (!rawRow || typeof rawRow !== 'object' || Array.isArray(rawRow)) {
    fail(res, 400, "Noto'g'ri ma'lumot formati");
    return;
  }

  const row = pickColumns(rawRow as Record<string, unknown>, cfg.columns);
  const rowId = str(row.id, 120);
  if (!rowId) {
    fail(res, 400, 'ID majburiy');
    return;
  }
  row.id = rowId;

  const isCreator = session.role === 'creator';
  const isUser = session.role === 'user';

  if (table === 'users') {
    if (!isCreator) {
      if (rowId !== session.sub) {
        fail(res, 403, 'Faqat shaxsiy profilni tahrirlash mumkin');
        return;
      }
      delete row.role;
    } else if (rowId === OWNER_ID) {
      row.role = 'creator';
    } else if (row.role === 'creator') {
      fail(res, 403, 'Ikkinchi creator tayinlab bo\'lmaydi');
      return;
    }

    if (typeof row.username === 'string') {
      const cleanU = normalizeUsername(row.username);
      if (!USERNAME_RE.test(cleanU)) {
        fail(res, 400, "Username formati noto'g'ri");
        return;
      }
      row.username = cleanU;
    }
  } else if (table === 'site_settings') {
    if (!isCreator) {
      // Allow non-creator users only to mark broadcasts as read without overwriting site settings
      const incomingData = (row.data && typeof row.data === 'object' ? row.data : {}) as Record<string, unknown>;
      const incomingBroadcasts = Array.isArray(incomingData.broadcasts) ? incomingData.broadcasts : [];
      const { data: currentRow } = await db
        .from('site_settings')
        .select('data')
        .eq('id', 'default')
        .maybeSingle();

      if (!currentRow?.data || typeof currentRow.data !== 'object') {
        fail(res, 403, 'Faqat creator uchun');
        return;
      }

      const currentData = currentRow.data as Record<string, unknown>;
      const currentBroadcasts = Array.isArray(currentData.broadcasts) ? currentData.broadcasts : [];
      const readIds = new Set(
        incomingBroadcasts
          .filter((b: any) => b && Array.isArray(b.readByUserIds) && b.readByUserIds.includes(session.sub))
          .map((b: any) => String(b.id)),
      );

      const mergedBroadcasts = currentBroadcasts.map((bc: any) => {
        if (!bc || !readIds.has(String(bc.id))) return bc;
        const existingReads: string[] = Array.isArray(bc.readByUserIds) ? bc.readByUserIds : [];
        if (existingReads.includes(session.sub)) return bc;
        return { ...bc, readByUserIds: [...existingReads, session.sub] };
      });

      row.id = 'default';
      row.data = { ...currentData, broadcasts: mergedBroadcasts };
    }
  } else if (table === 'projects' || table === 'tasks') {
    if (isUser) {
      fail(res, 403, "Bu bo'lim faqat jamoa a'zolari uchun");
      return;
    }
  } else if (table === 'orders') {
    if (isUser) {
      const { data: existingOrder } = await db
        .from('orders')
        .select('user_id')
        .eq('id', rowId)
        .maybeSingle();
      if (existingOrder && existingOrder.user_id !== session.sub) {
        fail(res, 403, 'Ruxsat berilmagan');
        return;
      }
      row.user_id = session.sub;
    }
  } else if (cfg.strict && cfg.owner) {
    const { data: existing } = await db
      .from(table)
      .select(cfg.owner)
      .eq('id', rowId)
      .maybeSingle();

    if (existing && (existing as unknown as Record<string, unknown>)[cfg.owner] !== session.sub && !isCreator) {
      fail(res, 403, 'Ruxsat berilmagan');
      return;
    }
    if (!isCreator || !existing) {
      row[cfg.owner] = session.sub;
    }
  } else if (table === 'activities') {
    row.user_id = session.sub;
  } else if (table === 'notifications') {
    if (!isCreator) {
      const { data: existingNotif } = await db
        .from('notifications')
        .select('id')
        .eq('id', rowId)
        .maybeSingle();
      if (existingNotif) {
        fail(res, 403, 'Faqat creator bildirishnomalarni tahrirlay oladi');
        return;
      }
      row.read = false;
    }
  }

  const { error } = await db.from(table).upsert(row);
  if (error) {
    fail(res, 500, error.message);
    return;
  }
  res.json({ ok: true });
}));

app.delete('/api/db/:table/:id', requireAuth, asyncRoute(async (req, res) => {
  const session = sessionOf(req);
  const table = req.params.table;
  const id = str(req.params.id, 120);
  const cfg = TABLES[table];

  if (!cfg || !id) {
    fail(res, 404, 'Topilmadi');
    return;
  }

  const isCreator = session.role === 'creator';
  if (cfg.creatorOnlyDelete && !isCreator) {
    fail(res, 403, 'Faqat creator o\'chira oladi');
    return;
  }
  if (table === 'users' && id === OWNER_ID) {
    fail(res, 403, 'Asosiy creator hisobini o\'chirib bo\'lmaydi');
    return;
  }

  if (cfg.strict && cfg.owner) {
    const { data: existing } = await db
      .from(table)
      .select(cfg.owner)
      .eq('id', id)
      .maybeSingle();

    if (existing && (existing as unknown as Record<string, unknown>)[cfg.owner] !== session.sub && !isCreator) {
      fail(res, 403, 'Ruxsat berilmagan');
      return;
    }
  } else if (session.role === 'user') {
    fail(res, 403, 'Ruxsat berilmagan');
    return;
  }

  const { error } = await db.from(table).delete().eq('id', id);
  if (error) {
    fail(res, 500, error.message);
    return;
  }
  res.json({ ok: true });
}));

app.post('/api/db/notifications/clear', requireCreator, asyncRoute(async (_req, res) => {
  const { error } = await db.from('notifications').delete().neq('id', '');
  if (error) {
    fail(res, 500, error.message);
    return;
  }
  res.json({ ok: true });
}));

// ---------- Chats compatibility & live typing/recording presence ----------
interface PresenceEntry {
  userId: string;
  userName: string;
  chatKey: string;
  status: 'typing' | 'recording';
  expiresAt: number;
}
const chatPresence = new Map<string, PresenceEntry>();

function canonicalChatKey(rawChatId: string): string {
  const id = str(rawChatId || 'general', 120);
  if (id === 'general') return 'general';
  if (id.startsWith('direct::')) {
    const parts = id.slice(8).split('::').filter(Boolean);
    if (parts.length === 2) return `direct::${[parts[0], parts[1]].sort().join('::')}`;
  }
  if (id.startsWith('direct_')) {
    const body = id.slice(7);
    const matches = body.match(/vcg[-_]\d+/gi);
    if (matches && matches.length === 2) {
      return `direct::${[matches[0], matches[1]].sort().join('::')}`;
    }
  }
  return id;
}

app.get('/api/chats', requireAuth, asyncRoute(async (req, res) => {
  const session = sessionOf(req);
  const safeSub = ilikeEscape(session.sub);
  const { data } = await db
    .from('chats')
    .select(TABLES.chats.columns.join(', '))
    .or(`chat_id.eq.general,sender_id.eq.${session.sub},chat_id.ilike.%${safeSub}%`)
    .order('created_at', { ascending: true });

  res.json(
    (data ?? []).map((r: any) => ({
      id: r.id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderRole: r.sender_role,
      senderAvatar: r.sender_avatar,
      text: r.text,
      timestamp: r.timestamp_label || new Date(r.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      createdAt: r.created_at,
      chatId: r.chat_id || 'general',
      attachmentUrl: r.attachment_url,
      isEdited: Boolean(r.is_edited),
      audioUrl: r.audio_url,
      audioDuration: r.audio_duration,
    })),
  );
}));

app.post('/api/chats', requireAuth, asyncRoute(async (req, res) => {
  const session = sessionOf(req);
  const m = req.body;
  if (!m || !m.id) {
    fail(res, 400, 'Xabar formati noto\'g\'ri');
    return;
  }
  const parsedCreatedAt =
    typeof m.createdAt === 'string' && !Number.isNaN(Date.parse(m.createdAt))
      ? new Date(m.createdAt).toISOString()
      : new Date().toISOString();

  const { error } = await db.from('chats').upsert({
    id: str(m.id, 80),
    sender_id: session.sub,
    sender_name: str(m.senderName, 150),
    sender_role: session.role,
    sender_avatar: str(m.senderAvatar, 2000),
    text: str(m.text, 4000),
    timestamp_label: str(m.timestamp, 50),
    chat_id: str(m.chatId || 'general', 120),
    attachment_url: typeof m.attachmentUrl === 'string' ? m.attachmentUrl : null,
    is_edited: Boolean(m.isEdited),
    audio_url: typeof m.audioUrl === 'string' ? m.audioUrl : null,
    audio_duration: Number(m.audioDuration) || 0,
    created_at: parsedCreatedAt,
  });
  if (error) {
    fail(res, 500, error.message);
    return;
  }
  // Clear sender presence immediately after sending message
  chatPresence.delete(`${session.sub}::${canonicalChatKey(str(m.chatId || 'general', 120))}`);
  res.json({ ok: true });
}));

app.post('/api/chats/presence', requireAuth, (req, res) => {
  const session = sessionOf(req);
  const chatKey = canonicalChatKey(str(req.body?.chatId || 'general', 120));
  const status = req.body?.status;
  const userName = str(req.body?.userName, 100) || session.username;
  const entryKey = `${session.sub}::${chatKey}`;

  if (status === 'typing' || status === 'recording') {
    chatPresence.set(entryKey, {
      userId: session.sub,
      userName,
      chatKey,
      status,
      expiresAt: Date.now() + 4500,
    });
  } else {
    chatPresence.delete(entryKey);
  }
  res.json({ ok: true });
});

app.get('/api/chats/presence', requireAuth, (req, res) => {
  const session = sessionOf(req);
  const chatKey = canonicalChatKey(str(req.query.chatId || 'general', 120));
  const now = Date.now();
  const active: { userId: string; userName: string; status: 'typing' | 'recording' }[] = [];

  for (const [k, v] of chatPresence.entries()) {
    if (v.expiresAt <= now) {
      chatPresence.delete(k);
      continue;
    }
    if (v.chatKey === chatKey && v.userId !== session.sub) {
      active.push({ userId: v.userId, userName: v.userName, status: v.status });
    }
  }
  res.json({ active });
});

// ---------- AI Multi-Engine Search ----------
async function queryGemini(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || env('GEMINI_API_KEY');
  if (!key) return "⚠️ **Gemini API Key topilmadi.** `.env` fayliga `GEMINI_API_KEY` kiriting.";
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const model = env('GEMINI_MODEL') || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `Siz VisionCore Group AI tadqiqot yordamchisiz. Quyidagi so'rov bo'yicha batafsil o'zbekcha tahlil tayyorlang:\n${query}`,
    });
    return response.text || 'Gemini javob qaytarmadi.';
  } catch (e: any) {
    return `Gemini API xatoligi: ${e?.message || String(e)}`;
  }
}

async function queryTavily(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || env('TAVILY_API_KEY');
  if (!key) return "⚠️ **Tavily API Key topilmadi.**";
  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query, search_depth: 'advanced', include_answer: true }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    const resData: any = await resp.json();
    const out: string[] = [];
    if (resData.answer) out.push(`**Tavily Javobi:**\n${resData.answer}\n`);
    if (Array.isArray(resData.results) && resData.results.length > 0) {
      out.push('**Manbalar:**');
      resData.results.slice(0, 5).forEach((r: any, idx: number) => {
        out.push(`${idx + 1}. [${r.title || 'Manba'}](${r.url})\n   ${r.content || ''}`);
      });
    }
    return out.length > 0 ? out.join('\n\n') : "Tavily natijalari topilmadi.";
  } catch (e: any) {
    return `Tavily API xatoligi: ${e?.message || String(e)}`;
  }
}

async function querySerpApi(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || env('SERPAPI_API_KEY');
  if (!key) return "⚠️ **SerpAPI Key topilmadi.**";
  try {
    const resp = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
    );
    const resData: any = await resp.json();
    const organic = resData.organic_results || [];
    if (!organic.length) return 'SerpAPI natijalari topilmadi.';
    const out = ['**SerpAPI Natijalari:**\n'];
    organic.slice(0, 5).forEach((item: any, idx: number) => {
      out.push(`${idx + 1}. **[${item.title || 'Natija'}](${item.link})**\n   ${item.snippet || ''}`);
    });
    return out.join('\n\n');
  } catch (e: any) {
    return `SerpAPI xatoligi: ${e?.message || String(e)}`;
  }
}

async function queryExa(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || env('EXA_API_KEY');
  if (!key) return "⚠️ **Exa API Key topilmadi.**";
  try {
    const resp = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, numResults: 5, useAutoprompt: true }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    const resData: any = await resp.json();
    const results = resData.results || [];
    if (!results.length) return 'Exa AI natijalari topilmadi.';
    const out = ['**Exa Neural Search:**\n'];
    results.forEach((r: any, idx: number) => {
      out.push(`${idx + 1}. **[${r.title || 'Link'}](${r.url})**`);
    });
    return out.join('\n\n');
  } catch (e: any) {
    return `Exa API xatoligi: ${e?.message || String(e)}`;
  }
}

async function queryFirecrawl(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || env('FIRECRAWL_API_KEY');
  if (!key) return "⚠️ **Firecrawl API Key topilmadi.**";
  try {
    const resp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 5 }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    const resData: any = await resp.json();
    const items = resData.data || [];
    if (!items.length) return 'Firecrawl natijalari topilmadi.';
    const out = ['**Firecrawl Natijalari:**\n'];
    items.forEach((item: any, idx: number) => {
      const title = item.title || item.metadata?.title || 'Veb-sahifa';
      const urlLink = item.url || item.metadata?.sourceURL || '#';
      const desc = item.description || (item.markdown || '').slice(0, 200);
      out.push(`${idx + 1}. **[${title}](${urlLink})**\n   ${desc}`);
    });
    return out.join('\n\n');
  } catch (e: any) {
    return `Firecrawl API xatoligi: ${e?.message || String(e)}`;
  }
}

app.post('/api/ai-search', searchLimiter, requireAuth, asyncRoute(async (req, res) => {
  const query = str(req.body?.query, 500);
  const engine = str(req.body?.engine || 'all', 30).toLowerCase();
  if (!query) {
    fail(res, 400, 'So\'rov matnini kiriting');
    return;
  }

  let text = '';
  if (engine === 'tavily') text = await queryTavily(query);
  else if (engine === 'serpapi') text = await querySerpApi(query);
  else if (engine === 'gemini') text = await queryGemini(query);
  else if (engine === 'exa') text = await queryExa(query);
  else if (engine === 'firecrawl') text = await queryFirecrawl(query);
  else {
    const parts: string[] = [];
    if (env('TAVILY_API_KEY')) parts.push(`### 🌐 Tavily\n${await queryTavily(query)}`);
    if (env('SERPAPI_API_KEY')) parts.push(`### 🔍 SerpAPI\n${await querySerpApi(query)}`);
    if (env('GEMINI_API_KEY')) parts.push(`### ✨ Google Gemini\n${await queryGemini(query)}`);
    if (env('EXA_API_KEY')) parts.push(`### ⚡ Exa AI\n${await queryExa(query)}`);
    if (env('FIRECRAWL_API_KEY')) parts.push(`### 🔥 Firecrawl\n${await queryFirecrawl(query)}`);
    text = parts.length > 0
      ? parts.join('\n\n---\n\n')
      : "Qidiruv API kalitlari (.env) hali o'rnatilmagan.";
  }

  res.json({ text, engine });
}));

// ---------- Error Handler ----------
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  if (!res.headersSent) {
    fail(res, 500, 'Ichki server xatoligi yuz berdi');
  }
});

// ---------- Dev (Vite) / Prod Standalone / Vercel Export ----------
async function startStandaloneServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VisionCore Group Server] Running at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  void startStandaloneServer();
}

export default app;
