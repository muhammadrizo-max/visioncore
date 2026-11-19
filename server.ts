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

const toPublicUser = (row: UserRow) => ({
  id: row.id,
  username: row.username,
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  telegramUsername: row.telegram_username ?? '',
  role: row.role,
  avatar: row.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.username)}`,
  registeredAt: row.created_at ?? null,
});

type PublicUser = ReturnType<typeof toPublicUser>;

const issueToken = (user: PublicUser) =>
  signToken({ sub: user.id, username: user.username, role: user.role, exp: Date.now() + SESSION_TTL_MS });

async function ensureOwnerRow(): Promise<UserRow> {
  const { data } = await db.from('users').select('*').eq('id', OWNER_ID).maybeSingle();
  if (data) return data as UserRow;
  const { data: created, error } = await db
    .from('users')
    .insert({
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
    })
    .select('*')
    .single();
  if (error) throw error;
  return created as UserRow;
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
app.use(express.json({ limit: '200kb' }));

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/config') {
    next();
    return;
  }
  if (!DB_READY || !AUTH_READY) {
    fail(res, 503, "Server sozlanmagan: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY va SESSION_SECRET ni tekshiring");
    return;
  }
  next();
});

// ---------- Auth ----------
app.post('/api/auth/login', loginLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const invalid = () => fail(res, 401, "Login yoki parol noto'g'ri kiritildi!");

  if (!USERNAME_RE.test(username) || !password || password.length > 200) {
    fail(res, 400, "Login va parolni
