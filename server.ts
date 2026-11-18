import crypto from 'crypto';
import path from 'path';
import express, { type NextFunction, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET ?? '';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 15_000;
const MAX_CHAT_MESSAGES = 500;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;

if (SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET kamida 32 belgidan iborat bo'lishi kerak");
}

const env = (name: string) => process.env[name]?.trim() || undefined;
const normalizeUsername = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

// ---------- Password hashing (scrypt, no extra dependency) ----------
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
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

// ---------- Owner (credentials only from env) ----------
const OWNER_USERNAME = normalizeUsername(env('OWNER_USERNAME') ?? '');
const OWNER_PASSWORD_HASH = env('OWNER_PASSWORD') ? hashPassword(env('OWNER_PASSWORD')!) : null;
const OWNER_ENABLED = Boolean(OWNER_USERNAME && OWNER_PASSWORD_HASH);
const OWNER_ID = 'vcg-90000001';

// ---------- Signed session tokens (HMAC-SHA256) ----------
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

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const session = header.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
  if (!session) {
    res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    return;
  }
  (req as AuthedRequest).session = session;
  next();
}

const sessionOf = (req: Request) => (req as AuthedRequest).session;

// ---------- In-memory rate limiter ----------
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
const checkUsernameLimiter = rateLimit(60 * 1000, 30);
const searchLimiter = rateLimit(60 * 1000, 20);

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

// ---------- Supabase ----------
const SUPABASE_URL = (env('SUPABASE_URL') || env('VITE_SUPABASE_URL') || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVER_KEY = env('SUPABASE_SERVICE_ROLE_KEY') || SUPABASE_ANON_KEY;
const supabase =
  SUPABASE_URL.startsWith('http') && SUPABASE_SERVER_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVER_KEY, { auth: { persistSession: false } })
    : null;

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
  registered_at?: string | null;
}

interface PublicUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  telegramUsername: string;
  role: string;
  avatar: string;
  registeredAt: string | null;
}

const toPublicUser = (row: UserRow, role?: string): PublicUser => ({
  id: row.id,
  username: row.username,
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  telegramUsername: row.telegram_username ?? '',
  role: role ?? row.role,
  avatar: row.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.username)}`,
  registeredAt: row.registered_at ?? null,
});

const issueToken = (user: PublicUser) =>
  signToken({ sub: user.id, username: user.username, role: user.role, exp: Date.now() + SESSION_TTL_MS });

async function loadOwnerProfile(): Promise<PublicUser> {
  const fallback: PublicUser = {
    id: OWNER_ID,
    username: OWNER_USERNAME,
    firstName: 'Boshliq',
    lastName: '(Creator)',
    phone: '+998 90 000 00 00',
    email: 'creator@visioncore.group',
    telegramUsername: '@visioncore_creator',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    registeredAt: new Date().toISOString(),
  };
  if (!supabase) return fallback;
  try {
    const { data } = await supabase.from('users').select('*').eq('id', OWNER_ID).maybeSingle();
    if (!data) {
      await supabase.from('users').upsert({
        id: OWNER_ID,
        username: OWNER_USERNAME,
        first_name: fallback.firstName,
        last_name: fallback.lastName,
        phone: fallback.phone,
        email: fallback.email,
        telegram_username: fallback.telegramUsername,
        role: 'creator',
        avatar: fallback.avatar,
        registered_at: fallback.registeredAt,
      });
      return fallback;
    }
    return { ...fallback, ...toPublicUser(data as UserRow, 'creator') };
  } catch (err) {
    console.warn('[auth] owner profile load failed:', err);
    return fallback;
  }
}

// ---------- PostgreSQL + chat storage ----------
const dbUrl = env('DATABASE_URL');
const dbPool = dbUrl
  ? new pg.Pool({
      connectionString: dbUrl,
      ssl: /localhost|127\.0\.0\.1/.test(dbUrl)
        ? false
        : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' },
    })
  : null;
dbPool?.on('error', (err) => console.warn('[PostgreSQL] idle client error:', err.message));

type ChatMessage = Record<string, unknown> & { id: string };
const memoryChats: ChatMessage[] = [];

async function initDb() {
  if (!dbPool) return;
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
}

async function listChats(): Promise<ChatMessage[]> {
  if (!dbPool) return memoryChats;
  const { rows } = await dbPool.query<{ payload: ChatMessage }>(
    `SELECT payload FROM (
       SELECT payload, created_at FROM chat_messages ORDER BY created_at DESC LIMIT $1
     ) recent ORDER BY created_at ASC`,
    [MAX_CHAT_MESSAGES],
  );
  return rows.map((r) => r.payload);
}

async function saveChat(msg: ChatMessage) {
  if (!dbPool) {
    const idx = memoryChats.findIndex((m) => m.id === msg.id);
    if (idx >= 0) memoryChats[idx] = msg;
    else memoryChats.push(msg);
    if (memoryChats.length > MAX_CHAT_MESSAGES) memoryChats.splice(0, memoryChats.length - MAX_CHAT_MESSAGES);
    return;
  }
  await dbPool.query(
    `INSERT INTO chat_messages (id, payload) VALUES ($1, $2::jsonb)
     ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
    [msg.id, JSON.stringify(msg)],
  );
  await dbPool.query(
    `DELETE FROM chat_messages WHERE id IN (
       SELECT id FROM chat_messages ORDER BY created_at DESC OFFSET $1
     )`,
    [MAX_CHAT_MESSAGES],
  );
}

async function deleteChat(id: string) {
  if (!dbPool) {
    const idx = memoryChats.findIndex((m) => m.id === id);
    if (idx >= 0) memoryChats.splice(idx, 1);
    return;
  }
  await dbPool.query('DELETE FROM chat_messages WHERE id = $1', [id]);
}

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

// ---------- Server bootstrap ----------
async function startServer() {
  await initDb();

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Topilmadi' });
  });

  if (!IS_PROD) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) console.error('[server]', err);
    res.status(status).json({ error: status === 500 ? 'Ichki server xatoligi' : (err.expose ? err.message : "So'rov noto'g'ri") });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VisionCore Group] http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => server.close(async () => {
    await dbPool?.end();
    process.exit(0);
  });
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[startup]', err);
  process.exit(1);
});
