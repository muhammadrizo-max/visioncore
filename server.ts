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

if (SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET kamida 32 belgidan iborat bo'lishi kerak");

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
const OWNER_PASSWORD_HASH = env('OWNER_PASSWORD') ? hashPassword(env('OWNER_PASSWORD')!) : null;
const OWNER_ENABLED = Boolean(OWNER_USERNAME && OWNER_PASSWORD_HASH);

// ---------- Token (HMAC-SHA256) ----------
interface Session { sub: string; username: string; role: string; exp: number; }
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
  (fn: (req: Request, res: Response) => Promise<void>) =>
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

const issueToken = (user: ReturnType<typeof toPublicUser>) =>
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

// ---------- Jadval siyosati (frontend ma'lumotlari uchun) ----------
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

const errorBody = (res: Response, status: number, error: string) => {
  res.status(status).json({ error });
};

// ---------- Auth ----------
app.post('/api/auth/login', loginLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const fail = () => errorBody(res, 401, "Login yoki parol noto'g'ri kiritildi!");

  if (!USERNAME_RE.test(username) || !password || password.length > 200) {
    errorBody(res, 400, "Login va parolni to'g'ri kiriting!");
    return;
  }

  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    if (!verifyPassword(password, OWNER_PASSWORD_HASH!)) { fail(); return; }
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
  if (!valid) { fail(); return; }

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
    errorBody(res, 400, 'Ism, username (3–32 belgi) va parol (6+ belgi) kiritilishi shart');
    return;
  }
  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    errorBody(res, 409, 'Ushbu foydalanuvchi nomi mavjud!');
    return;
  }

  const { data: taken } = await db.from('users').select('id').ilike('username', ilikeEscape(username)).maybeSingle();
  if (taken) {
    errorBody(res, 409, 'Ushbu foydalanuvchi nomi mavjud!');
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
      errorBody(res, 409, 'Ushbu ID yoki username band');
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
    errorBody(res, 400, "Foydalanuvchi nomi 3–32 ta harf, raqam yoki _ . - belgilaridan iborat bo'lishi kerak");
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
app.get('/api/db/health', asyncRoute(async (_req, res) => {
  const start = Date.now();
  const { error } = await db.from('site_settings').select('id').limit(1);
  if (error) {
    console.error('[db/health]', error);
    errorBody(res, 503, "Supabase bilan bog'lanishda xatolik");
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
      let q = db.from(name).select(cfg.columns.join(',')).order(cfg.order, { ascending: cfg.asc ?? false });
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
  if (!cfg) { errorBody(res, 404, 'Jadval topilmadi'); return; }

  const input = req.body?.row;
  if (!input || typeof input !== 'object' || typeof input.id !== 'string' || !input.id || input.id.length > 100) {
    errorBody(res, 400, "Noto'g'ri ma'lumot");
    return;
  }

  const s = sessionOf(req);
  const row: Record<string, unknown> = {};
  for (const col of cfg.columns) if (col in input) row[col] = input[col];
  row.id = input.id;

  if (table === 'users' && s.role !== 'creator') {
    if (input.id !== s.sub) { errorBody(res, 403, "Ruxsat yo'q"); return; }
    delete row.role;
  }

  if (cfg.strict && cfg.owner && s.role !== 'creator') {
    const { data: existing } = await db.from(table).select(cfg.owner).eq('id', input.id).maybeSingle();
    if (existing && (existing as Record<string, unknown>)[cfg.owner] !== s.sub) {
      errorBody(res, 403, "Ruxsat yo'q");
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
  if (!cfg) { errorBody(res, 404, 'Jadval topilmadi'); return; }

  const s = sessionOf(req);
  if (cfg.creatorOnlyDelete && s.role !== 'creator') { errorBody(res, 403, "Ruxsat yo'q"); return; }

  if (cfg.strict && cfg.owner && s.role !== 'creator') {
    const { data: existing } = await db.from(table).select(cfg.owner).eq('id', id).maybeSingle();
    if (existing && (existing as Record<string, unknown>)[cfg.owner] !== s.sub) {
      errorBody(res, 403, "Ruxsat yo'q");
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
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
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
    label: 'Tavily (tavily.com)', icon: '🌐', envName: 'TAVILY_API_KEY', key: env('TAVILY_API_KEY'),
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
    label: 'SerpAPI (serpapi.com)', icon: '🔍', envName: 'SERPAPI_API_KEY', key: env('SERPAPI_API_KEY'),
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
    label: 'Google Gemini (ai.google.dev)', icon: '✨', envName: 'GEMINI_API_KEY', key: env('GEMINI_API_KEY'),
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
    label: 'Exa AI (exa.ai)', icon: '⚡', envName: 'EXA_API_KEY', key: env('EXA_API_KEY'),
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
    label: 'Firecrawl (firecrawl.dev)', icon: '🔥', envName: 'FIRECRAWL_API_KEY', key: env('FIRECRAWL_API_KEY'),
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
    return `⚠️ **${p.label} API kaliti topilmadi.** \`.env\` fayliga \`${p.envName}\` qiymatini kiriting.`;
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
        `API kalitlarni \`.env\` ga kiriting: ${ENGINES.map((e) => `\`${providers[e].envName}\``).join(', ')}`,
    };
  }
  const sections = await Promise.all(
    active.map(async (e) => `### ${providers[e].icon} ${providers[e].label}\n${await runProvider(e, query)}`),
  );
  return { text: sections.join('\n\n---\n\n'), engine };
}

// ---------- Auth routes ----------
app.post('/api/auth/login', loginLimiter, asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const invalid = () => res.status(401).json({ authenticated: false, error: "Login yoki parol noto'g'ri kiritildi!" });

  if (!username || !password || password.length > 200 || !USERNAME_RE.test(username)) {
    res.status(400).json({ authenticated: false, error: 'Login va parolni to\'g\'ri kiriting!' });
    return;
  }

  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    if (!verifyPassword(password, OWNER_PASSWORD_HASH!)) return invalid();
    const user = await loadOwnerProfile();
    res.json({ authenticated: true, token: issueToken(user), user });
    return;
  }

  if (!supabase) {
    verifyPassword(password, DUMMY_HASH);
    return invalid();
  }

  const { data } = await supabase.from('users').select('*').ilike('username', username).maybeSingle();
  const row = data as UserRow | null;
  if (!row) {
    verifyPassword(password, DUMMY_HASH);
    return invalid();
  }

  let valid = false;
  if (row.password_hash) {
    valid = verifyPassword(password, row.password_hash);
  } else if (row.password) {
    // Legacy plaintext account: verify once, then migrate to a hash.
    valid = safeEqual(password, row.password);
    if (valid) {
      await supabase
        .from('users')
        .update({ password_hash: hashPassword(password), password: null })
        .eq('id', row.id);
    }
  }
  if (!valid) return invalid();

  const user = toPublicUser(row);
  res.json({ authenticated: true, token: issueToken(user), user });
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
  if (OWNER_ENABLED && username === OWNER_USERNAME) {
    res.json({ available: false, error: 'Ushbu foydalanuvchi nomi band!' });
    return;
  }
  if (supabase) {
    const { data } = await supabase.from('users').select('id').ilike('username', username).maybeSingle();
    if (data) {
      res.json({ available: false, error: 'Ushbu foydalanuvchi nomi band!' });
      return;
    }
  }
  res.json({ available: true });
}));

// ---------- Public config ----------
app.get('/api/supabase/env', (_req, res) => {
  res.json({
    configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  });
});

app.get('/api/config', (_req, res) => {
  res.json({ siteName: 'VisionCore Group', authMode: 'backend' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/db/health', asyncRoute(async (_req, res) => {
  if (!dbPool) {
    res.json({ connected: false, message: 'DATABASE_URL sozlanmagan' });
    return;
  }
  try {
    const { rows } = await dbPool.query<{ now: string }>('SELECT NOW() AS now');
    res.json({ connected: true, serverTime: rows[0].now });
  } catch (err) {
    console.error('[db/health]', err);
    res.status(503).json({ connected: false, error: 'PostgreSQL bilan bog\'lanishda xatolik' });
  }
}));

// ---------- Protected routes ----------
app.get('/api/chats', requireAuth, asyncRoute(async (_req, res) => {
  res.json(await listChats());
}));

app.post('/api/chats', requireAuth, asyncRoute(async (req, res) => {
  const msg = req.body;
  if (!msg || typeof msg !== 'object' || typeof msg.id !== 'string' || !msg.id || msg.id.length > 100) {
    res.status(400).json({ error: 'Xabar formati noto\'g\'ri' });
    return;
  }
  await saveChat(msg as ChatMessage);
  res.json({ success: true, message: msg });
}));

app.delete('/api/chats/:id', requireAuth, asyncRoute(async (req, res) => {
  if (sessionOf(req).role !== 'creator') {
    res.status(403).json({ error: 'Ruxsat yo\'q' });
    return;
  }
  await deleteChat(String(req.params.id));
  res.json({ success: true });
}));

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

// ---------- 404 va xatolik ----------
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
  const start = async () => {
    if (IS_PROD) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
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
  };

  start().catch((err) => {
    console.error('[startup]', err);
    process.exit(1);
  });
}
