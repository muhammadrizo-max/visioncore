import crypto from 'crypto';
import path from 'path';
import express, { type NextFunction, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET ?? '';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 15_000;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;
const MEMBER_ID_RE = /^vcg[-_]\d{8}$/;
const ROLES = ['engineer', 'researcher', 'designer', 'analyst', 'user'];
const OWNER_ID = 'vcg-90000001';

if (SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET kamida 32 belgidan iborat bo'lishi kerak");
}

const env = (name: string) => process.env[name]?.trim() || undefined;
const normalizeUsername = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const ilikeEscape = (v: string) => v.replace(/[\\%_]/g, (c) => `\\${c}`);

const SUPABASE_URL = (env('SUPABASE_URL') ?? '').replace(/\/+$/, '');
const SUPABASE_SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
if (!SUPABASE_URL.startsWith('http') || !SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY sozlanishi shart');
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));

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

// ---------- Owner (faqat env orqali) ----------
const OWNER_USERNAME = normalizeUsername(env('OWNER_USERNAME') ?? '');
const OWNER_PASSWORD = env('OWNER_PASSWORD') ?? '';
const OWNER_PASSWORD_HASH = OWNER_PASSWORD ? hashPassword(OWNER_PASSWORD) : null;
const OWNER_ENABLED = Boolean(OWNER_USERNAME && OWNER_PASSWORD_HASH);

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
    res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
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
      res.status(429).json({ error: "Juda ko'p so'rov. Keyinroq urinib ko'ring" });
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

// ---------- Auth ----------
app.post('/api/auth/login', loginLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const fail = () => res.status(401).json({ authenticated: false, error: "Login yoki parol noto'g'ri kiritildi!" });

  if (!USERNAME_RE.test(username) || !password || password.length > 200) {
    res.status(400).json({ error: "Login va parolni to'g'ri kiriting!" });
    return;
  }

  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    if (!verifyPassword(password, OWNER_PASSWORD_HASH!)) {
      fail();
      return;
    }
    const user = toPublicUser(await ensureOwnerRow());
    res.json({ authenticated: true, token: issueToken(user), user });
    return;
  }

  const { data } = await db.from('users').select('*').ilike('username', ilikeEscape(username)).maybeSingle();
  const row = data as UserRow | null;
  if (!row) {
    verifyPassword(password, DUMMY_HASH);
    fail();
    return;
  }

  let valid = false;
  if (row.password_hash) {
    valid = verifyPassword(password, row.password_hash);
  } else if (row.password) {
    valid = safeEqual(password, row.password);
    if (valid) {
      await db.from('users').update({ password_hash: hashPassword(password), password: null }).eq('id', row.id);
    }
  }
  if (!valid) {
    fail();
    return;
  }

  const user = toPublicUser(row);
  res.json({ authenticated: true, token: issueToken(user), user });
}));

app.post('/api/auth/register', registerLimiter, asyncRoute(async (req, res) => {
  const session = sessionFrom(req);
  const asCreator = session?.role === 'creator';
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const firstName = str(req.body?.firstName, 100);

  if (!firstName || !USERNAME_RE.test(username) || password.length < 6 || password.length > 200) {
    res.status(400).json({ error: 'Ism, username (3–32 belgi) va parol (6+ belgi) kiritilishi shart' });
    return;
  }
  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    res.status(409).json({ error: 'Ushbu foydalanuvchi nomi mavjud!' });
    return;
  }

  const { data: taken } = await db.from('users').select('id').ilike('username', ilikeEscape(username)).maybeSingle();
  if (taken) {
    res.status(409).json({ error: 'Ushbu foydalanuvchi nomi mavjud!' });
    return;
  }

  const role = asCreator && ROLES.includes(req.body?.role) ? req.body.role : 'user';
  const requestedId = typeof req.body?.id === 'string' && MEMBER_ID_RE.test(req.body.id) ? req.body.id : null;
  const id = requestedId ?? `vcg-${crypto.randomInt(10_000_000, 100_000_000)}`;

  const { data, error } = await db
    .from('users')
    .insert({
      id,
      username,
      password_hash: hashPassword(password),
      password: null,
      first_name: firstName,
      last_name: str(req.body?.lastName, 100),
      phone: str(req.body?.phone, 50),
      email: str(req.body?.email, 150) || `${username}@visioncore.group`,
      telegram_username: str(req.body?.telegramUsername, 100),
      role,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Ushbu ID yoki username band' });
      return;
    }
    throw error;
  }

  const user = toPublicUser(data as UserRow);
  if (asCreator) {
    res.status(201).json({ user });
    return;
  }
  res.status(201).json({ authenticated: true, token: issueToken(user), user });
}));

app.post('/api/auth/check-username', checkUsernameLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!USERNAME_RE.test(username)) {
    res.status(400).json({
      available: false,
      error: "Foydalanuvchi nomi 3–32 ta harf, raqam yoki _ . - belgilaridan iborat bo'lishi kerak",
    });
    return;
  }
  const ownerTaken = OWNER_ENABLED && username === OWNER_USERNAME;
  const { data } = await db.from('users').select('id').ilike('username', ilikeEscape(username)).maybeSingle();
  if (ownerTaken || data) {
    res.json({ available: false, error: 'Ushbu foydalanuvchi nomi band!' });
    return;
  }
  res.json({ available: true });
}));

// ---------- Ma'lumotlar ----------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/db/health', asyncRoute(async (_req, res) => {
  const start = Date.now();
  const { error } = await db.from('site_settings').select('id').limit(1);
  if (error) {
    console.error('[db/health]', error);
    res.status(503).json({ connected: false, error: "Supabase bilan bog'lanishda xatolik" });
    return;
  }
  res.json({
    connected: true,
    latencyMs: Date.now() - start,
    message: 'Supabase PostgreSQL bazasiga real-time ulandi!',
    lastChecked: new Date().toLocaleTimeString('uz-UZ'),
  });
}));

app.get('/api/sync', requireAuth, asyncRoute(async (req, res) => {
  const s = sessionOf(req);
  const entries = await Promise.all(
    Object.entries(TABLES).map(async ([name, cfg]) => {
      let q: any = db.from(name).select(cfg.columns.join(',')).order(cfg.order, { ascending: cfg.asc ?? false });
      if (name === 'notes' && s.role !== 'creator') {
        q = q.or(`is_private.eq.false,author_id.eq.${s.sub}`);
      }
      if (cfg.limit) q = q.limit(cfg.limit);
      const { data, error } = await q;
      if (error) throw error;
      return [name, data ?? []] as const;
    }),
  );
  res.json(Object.fromEntries(entries));
}));

app.post('/api/db/notifications/clear', requireAuth, asyncRoute(async (_req, res) => {
  const { error } = await db.from('notifications').delete().neq('id', '');
  if (error) throw error;
  res.json({ success: true });
}));

app.post('/api/db/:table/upsert', requireAuth, asyncRoute(async (req, res) => {
  const table = String(req.params.table);
  const cfg = TABLES[table];
  if (!cfg) {
    res.status(404).json({ error: 'Jadval topilmadi' });
    return;
  }

  const input = req.body?.row as Record<string, unknown> | undefined;
  if (!input || typeof input.id !== 'string' || !input.id || input.id.length > 100) {
    res.status(400).json({ error: "Noto'g'ri ma'lumot" });
    return;
  }

  const s = sessionOf(req);
  const row: Record<string, unknown> = {};
  for (const col of cfg.columns) {
    if (col in input) row[col] = input[col];
  }
  row.id = input.id;

  if (table === 'users' && s.role !== 'creator') {
    if (input.id !== s.sub) {
      res.status(403).json({ error: "Ruxsat yo'q" });
      return;
    }
    delete row.role;
  }

  if (cfg.strict && cfg.owner && s.role !== 'creator') {
    const { data } = (await db.from(table).select('*').eq('id', input.id).maybeSingle()) as {
      data: Record<string, unknown> | null;
    };
    if (data && data[cfg.owner] !== s.sub) {
      res.status(403).json({ error: "Ruxsat yo'q" });
      return;
    }
    row[cfg.owner] = s.sub;
  }

  const { error } = await db.from(table).upsert(row);
  if (error) throw error;
  res.json({ success: true });
}));

app.delete('/api/db/:table/:id', requireAuth, asyncRoute(async (req, res) => {
  const table = String(req.params.table);
  const id = String(req.params.id);
  const cfg = TABLES[table];
  if (!cfg) {
    res.status(404).json({ error: 'Jadval topilmadi' });
    return;
  }

  const s = sessionOf(req);
  if (cfg.creatorOnlyDelete && s.role !== 'creator') {
    res.status(403).json({ error: "Ruxsat yo'q" });
    return;
  }

  if (cfg.strict && cfg.owner && s.role !== 'creator') {
    const { data } = (await db.from(table).select('*').eq('id', id).maybeSingle()) as {
      data: Record<string, unknown> | null;
    };
    if (data && data[cfg.owner] !== s.sub) {
      res.status(403).json({ error: "Ruxsat yo'q" });
      return;
    }
  }

  const { error } = await db.from(table).delete().eq('id', id);
  if (error) throw error;
  res.json({ success: true });
}));

app.get('/api/config', (_req, res) => {
  res.json({ siteName: 'VisionCore Group' });
});

// ---------- Multi-engine search ----------
type Engine = 'tavily' | 'serpapi' | 'gemini' | 'exa' | 'firecrawl';
const ENGINES: Engine[] = ['tavily', 'serpapi', 'gemini', 'exa', 'firecrawl'];
const isEngine = (e: string): e is Engine => (ENGINES as string[]).includes(e);

async function fetchJson(url: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });

interface Provider {
  label: string;
  icon: string;
  envName: string;
  key: string | undefined;
  run: (query: string, key: string) => Promise<string>;
}

const providers: Record<Engine, Provider> = {
  tavily: {
    label: 'Tavily (tavily.com)',
    icon: '🌐',
    envName: 'TAVILY_API_KEY',
    key: env('TAVILY_API_KEY'),
    run: async (query, key) => {
      const data = await fetchJson('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ query, search_depth: 'advanced', include_answer: true }),
      });
      const sources = (data.results ?? []).slice(0, 5).map(
        (r: any, i: number) => `${i + 1}. [${r.title || 'Manba'}](${r.url})\n   ${r.content || ''}`,
      );
      const parts = [
        data.answer ? `**Tavily javobi:**\n${data.answer}` : '',
        sources.length ? `**Manbalar:**\n${sources.join('\n')}` : '',
      ].filter(Boolean);
      return parts.join('\n\n') || "Tavily qidiruvi bo'yicha natijalar topilmadi.";
    },
  },
  serpapi: {
    label: 'SerpAPI (serpapi.com)',
    icon: '🔍',
    envName: 'SERPAPI_API_KEY',
    key: env('SERPAPI_API_KEY'),
    run: async (query, key) => {
      const data = await fetchJson(
        `https://serpapi.com/search.json?${new URLSearchParams({ q: query, api_key: key })}`,
      );
      const items = (data.organic_results ?? []).slice(0, 5);
      if (!items.length) return 'SerpAPI natijalari topilmadi.';
      return items
        .map((i: any, idx: number) => `${idx + 1}. **[${i.title || 'Natija'}](${i.link})**\n   ${i.snippet || ''}`)
        .join('\n\n');
    },
  },
  gemini: {
    label: 'Google Gemini (ai.google.dev)',
    icon: '✨',
    envName: 'GEMINI_API_KEY',
    key: env('GEMINI_API_KEY'),
    run: async (query, key) => {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Siz VisionCore Group AI tadqiqot yordamchisiz. Quyidagi so'rov bo'yicha batafsil o'zbekcha tahlil tayyorlang:\n${query}`,
      });
      return response.text || 'Gemini javob qaytarmadi.';
    },
  },
  exa: {
    label: 'Exa AI (exa.ai)',
    icon: '⚡',
    envName: 'EXA_API_KEY',
    key: env('EXA_API_KEY'),
    run: async (query, key) => {
      const data = await fetchJson('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, numResults: 5, useAutoprompt: true }),
      });
      const results = data.results ?? [];
      if (!results.length) return 'Exa AI natijalari topilmadi.';
      return results
        .map((r: any, i: number) => `${i + 1}. **[${r.title || 'Link'}](${r.url})**\n   Score: ${r.score ?? 'N/A'}`)
        .join('\n\n');
    },
  },
  firecrawl: {
    label: 'Firecrawl (firecrawl.dev)',
    icon: '🔥',
    envName: 'FIRECRAWL_API_KEY',
    key: env('FIRECRAWL_API_KEY'),
    run: async (query, key) => {
      const data = await fetchJson('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 5 }),
      });
      const items = data.data ?? [];
      if (!items.length) return "Firecrawl qidiruvi bo'yicha natijalar topilmadi.";
      return items
        .map((item: any, i: number) => {
          const title = item.title || item.metadata?.title || 'Veb-sahifa';
          const link = item.url || item.metadata?.sourceURL || '#';
          const desc = item.description || (item.markdown || '').slice(0, 200);
          return `${i + 1}. **[${title}](${link})**\n   ${desc}`;
        })
        .join('\n\n');
    },
  },
};

async function runProvider(engine: Engine, query: string): Promise<string> {
  const p = providers[engine];
  if (!p.key) {
    return `⚠️ **${p.label} API kaliti topilmadi.** \`${p.envName}\` ni sozlang.`;
  }
  try {
    return await withTimeout(p.run(query, p.key), PROVIDER_TIMEOUT_MS);
  } catch (err) {
    console.error(`[search:${engine}]`, err);
    return `${p.label} bilan bog'lanishda xatolik yuz berdi.`;
  }
}

async function runSearch(query: string, engine: string): Promise<{ text: string; engine: string }> {
  if (engine !== 'all') {
    return { text: await runProvider(engine as Engine, query), engine };
  }
  const active = ENGINES.filter((e) => providers[e].key);
  if (!active.length) {
    return {
      engine,
      text:
        `### 🌐 VisionCore Group Qidiruv Tizimi\n\nSo'rov: **"${query}"**\n\n` +
        `API kalitlarni sozlang: ${ENGINES.map((e) => `\`${providers[e].envName}\``).join(', ')}`,
    };
  }
  const sections = await Promise.all(
    active.map(async (e) => `### ${providers[e].icon} ${providers[e].label}\n${await runProvider(e, query)}`),
  );
  return { text: sections.join('\n\n---\n\n'), engine };
}

app.post('/api/ai-search', requireAuth, searchLimiter, asyncRoute(async (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  const engine = typeof req.body?.engine === 'string' ? req.body.engine.toLowerCase() : 'all';
  if (!query || query.length > 500) {
    res.status(400).json({ error: "So'rov 1–500 belgidan iborat bo'lishi kerak" });
    return;
  }
  if (engine !== 'all' && !isEngine(engine)) {
    res.status(400).json({ error: "Noma'lum qidiruv tizimi" });
    return;
  }
  res.json(await runSearch(query, engine));
}));

// ---------- Parolni unutish ----------
app.post('/api/auth/forgot-password', registerLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const note = str(req.body?.note, 300);
  if (!USERNAME_RE.test(username)) {
    res.status(400).json({ error: "Username 3–32 belgidan iborat bo'lishi kerak" });
    return;
  }
  const { data: user } = await db
    .from('users')
    .select('id, username')
    .ilike('username', ilikeEscape(username))
    .neq('role', 'creator')
    .maybeSingle();
  if (user) {
    await db.from('password_requests').insert({
      user_id: user.id,
      username: user.username,
      note,
      status: 'open',
    });
  }
  // Foydalanuvchi mavjudligini oshkor qilmaslik uchun javob har doim bir xil
  res.json({ message: "So'rovingiz adminga yuborildi. Admin siz bilan Telegram yoki telefon orqali bog'lanadi." });
}));

app.get('/api/admin/password-requests', requireCreator, asyncRoute(async (_req, res) => {
  const { data, error } = await db
    .from('password_requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  res.json(data ?? []);
}));

app.post('/api/admin/password-requests/:id/resolve', requireCreator, asyncRoute(async (req, res) => {
  const requestId = String(req.params.id);
  const { data: reqRow, error: readErr } = await db
    .from('password_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!reqRow) {
    res.status(404).json({ error: "So'rov topilmadi" });
    return;
  }

  const password = `vcg_${crypto.randomBytes(6).toString('base64url')}`;
  const { data: updated, error } = await db
    .from('users')
    .update({
      password_hash: hashPassword(password),
      password: null,
      password_enc: encryptSecret(password),
    })
    .eq('id', reqRow.user_id)
    .neq('role', 'creator')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  await db
    .from('password_requests')
    .update({ status: 'done', resolved_at: new Date().toISOString() })
    .eq('id', requestId);

  res.json({ password, username: reqRow.username });
}));

// ---------- Xatolik va 404 ----------
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Topilmadi' });
});

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error('[server]', err);
  res.status(status).json({
    error: status === 500 ? 'Ichki server xatoligi' : err.expose ? err.message : "So'rov noto'g'ri",
  });
};
app.use(errorHandler);

export default app;

// ---------- Lokal ishga tushirish (Vercel'da ishlamaydi) ----------
if (!process.env.VERCEL) {
  (async () => {
    if (IS_PROD) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      const { createServer } = await import('vite');
      const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[VisionCore Group] http://localhost:${PORT}`);
    });

    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })().catch((err) => {
    console.error('[startup]', err);
    process.exit(1);
  });
}
