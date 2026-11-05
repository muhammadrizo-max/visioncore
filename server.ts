import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// PostgreSQL Pool Initialization if DATABASE_URL is set
let dbPool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    dbPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    dbPool.on('error', (err) => {
      console.warn('[PostgreSQL Pool] Idle client error:', err.message);
    });
    console.log('[PostgreSQL] Database pool created with DATABASE_URL.');
  } catch (err) {
    console.error('[PostgreSQL] Connection error:', err);
    dbPool = null;
  }
}

// Research query handlers in native TypeScript
async function queryGemini(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return "⚠️ **Gemini API Key topilmadi.** `.env` fayliga `GEMINI_API_KEY` qiymatini kiritishingiz lozim.";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Siz VisionCore Group AI tadqiqot yordamchisiz (ai.google.dev). Quyidagi so'rov bo'yicha batafsil o'zbekcha tahlil tayyorlang:\n${query}`
    });
    return response.text || "Gemini javob qaytarmadi.";
  } catch (e: any) {
    return `Gemini (ai.google.dev) API xatoligi: ${e?.message || String(e)}`;
  }
}

async function queryTavily(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || process.env.TAVILY_API_KEY;
  if (!key) {
    return "⚠️ **Tavily API Key topilmadi.** `.env` fayliga `TAVILY_API_KEY` qiymatini kiritishingiz lozim.";
  }
  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: 'advanced',
        include_answer: true,
      }),
    });
    const resData: any = await resp.json();
    const answer = resData.answer || '';
    const results = resData.results || [];
    const out: string[] = [];
    if (answer) out.push(`**Tavily Javobi:**\n${answer}\n`);
    if (results.length > 0) {
      out.push('**Manbalar:**');
      results.slice(0, 5).forEach((r: any, idx: number) => {
        out.push(`${idx + 1}. [${r.title || 'Manba'}](${r.url})\n   ${r.content || ''}`);
      });
    }
    return out.length > 0 ? out.join('\n\n') : 'Tavily qidiruvi bo\'yicha natijalar topilmadi.';
  } catch (e: any) {
    return `Tavily (tavily.com) API xatoligi: ${e?.message || String(e)}`;
  }
}

async function querySerpApi(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || process.env.SERPAPI_API_KEY;
  if (!key) {
    return "⚠️ **SerpAPI Key topilmadi.** `.env` fayliga `SERPAPI_API_KEY` qiymatini kiritishingiz lozim.";
  }
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(key)}`;
    const resp = await fetch(url);
    const resData: any = await resp.json();
    const organic = resData.organic_results || [];
    if (!organic.length) return 'SerpAPI natijalari topilmadi.';
    const out = ['**SerpAPI Google Qidiruv Natijalari:**\n'];
    organic.slice(0, 5).forEach((item: any, idx: number) => {
      out.push(`${idx + 1}. **[${item.title || 'Natija'}](${item.link})**\n   ${item.snippet || ''}`);
    });
    return out.join('\n\n');
  } catch (e: any) {
    return `SerpAPI (serpapi.com) API xatoligi: ${e?.message || String(e)}`;
  }
}

async function queryExa(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || process.env.EXA_API_KEY;
  if (!key) {
    return "⚠️ **Exa API Key topilmadi.** `.env` fayliga `EXA_API_KEY` qiymatini kiritishingiz lozim.";
  }
  try {
    const resp = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        numResults: 5,
        useAutoprompt: true,
      }),
    });
    const resData: any = await resp.json();
    const results = resData.results || [];
    if (!results.length) return 'Exa AI natijalari topilmadi.';
    const out = ['**Exa Neural Search Natijalari:**\n'];
    results.forEach((r: any, idx: number) => {
      out.push(`${idx + 1}. **[${r.title || 'Link'}](${r.url})**\n   Score: ${r.score ?? 'N/A'}`);
    });
    return out.join('\n\n');
  } catch (e: any) {
    return `Exa (exa.ai) API xatoligi: ${e?.message || String(e)}`;
  }
}

async function queryFirecrawl(query: string, apiKey?: string): Promise<string> {
  const key = apiKey || process.env.FIRECRAWL_API_KEY;
  if (!key) {
    return "⚠️ **Firecrawl API Key topilmadi.** `.env` fayliga `FIRECRAWL_API_KEY` qiymatini kiritishingiz lozim.";
  }
  try {
    const resp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 5 }),
    });
    const resData: any = await resp.json();
    const items = resData.data || [];
    if (!items.length) return 'Firecrawl qidiruvi bo\'yicha natijalar topilmadi.';
    const out = ['**Firecrawl Web Crawl Natijalari:**\n'];
    items.forEach((item: any, idx: number) => {
      const title = item.title || item.metadata?.title || 'Veb-sahifa';
      const urlLink = item.url || item.metadata?.sourceURL || '#';
      const desc = item.description || (item.markdown || '').slice(0, 200);
      out.push(`${idx + 1}. **[${title}](${urlLink})**\n   ${desc}`);
    });
    return out.join('\n\n');
  } catch (e: any) {
    return `Firecrawl (firecrawl.dev) API xatoligi: ${e?.message || String(e)}`;
  }
}

async function runSearchBackend(payload: { query: string; engine?: string }): Promise<{ text: string; engine?: string }> {
  const query = payload.query?.trim() || '';
  const engine = (payload.engine || 'all').toLowerCase();

  const geminiKey = process.env.GEMINI_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;
  const serpapiKey = process.env.SERPAPI_API_KEY;
  const exaKey = process.env.EXA_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  let resultText = '';

  if (engine === 'tavily') {
    resultText = await queryTavily(query, tavilyKey);
  } else if (engine === 'serpapi') {
    resultText = await querySerpApi(query, serpapiKey);
  } else if (engine === 'gemini') {
    resultText = await queryGemini(query, geminiKey);
  } else if (engine === 'exa') {
    resultText = await queryExa(query, exaKey);
  } else if (engine === 'firecrawl') {
    resultText = await queryFirecrawl(query, firecrawlKey);
  } else {
    // ALL / AUTO engine mode
    const results: string[] = [];
    if (tavilyKey) {
      results.push(`### 🌐 Tavily (tavily.com)\n${await queryTavily(query, tavilyKey)}`);
    }
    if (serpapiKey) {
      results.push(`### 🔍 SerpAPI (serpapi.com)\n${await querySerpApi(query, serpapiKey)}`);
    }
    if (geminiKey) {
      results.push(`### ✨ Google Gemini (ai.google.dev)\n${await queryGemini(query, geminiKey)}`);
    }
    if (exaKey) {
      results.push(`### ⚡ Exa AI (exa.ai)\n${await queryExa(query, exaKey)}`);
    }
    if (firecrawlKey) {
      results.push(`### 🔥 Firecrawl (firecrawl.dev)\n${await queryFirecrawl(query, firecrawlKey)}`);
    }

    if (results.length > 0) {
      resultText = results.join('\n\n---\n\n');
    } else {
      resultText =
        `### 🌐 VisionCore Group Qidiruv Tizimi (Natija)\n\n` +
        `So'rov: **"${query}"**\n\n` +
        `API kalitlar ro'yxati (Sozlamalar):\n` +
        `- **Tavily (tavily.com)**: \`TAVILY_API_KEY\`\n` +
        `- **SerpAPI (serpapi.com)**: \`SERPAPI_API_KEY\`\n` +
        `- **Google Gemini (ai.google.dev)**: \`GEMINI_API_KEY\`\n` +
        `- **Exa AI (exa.ai)**: \`EXA_API_KEY\`\n` +
        `- **Firecrawl (firecrawl.dev)**: \`FIRECRAWL_API_KEY\`\n\n` +
        `*Jonli qidiruv natijalarini olish uchun atigi bitta yoki barcha kalitlarni o'rnating.*`;
    }
  }

  return { text: resultText, engine };
}

// Secure API route for smart AI-powered multi-engine research
app.post('/api/ai-search', async (req, res) => {
  const { query, engine } = req.body;

  if (!query) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  try {
    const searchResult = await runSearchBackend({ query, engine: engine || 'perplexity' });
    res.json(searchResult);
  } catch (error: any) {
    console.error('API Search Error:', error);
    res.status(500).json({ error: error?.message || 'Search backend error' });
  }
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date(), 
    backend: 'Express & Node.js 22',
    postgres: dbPool ? 'configured' : 'disabled'
  });
});

// DB health status
app.get('/api/db/health', async (req, res) => {
  if (!dbPool) {
    res.json({ connected: false, message: 'DATABASE_URL env qoyilmagan (Localstorage rejimida)' });
    return;
  }
  try {
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({ connected: true, serverTime: result.rows[0].now, message: 'PostgreSQL bazasi faol muvaffaqiyatli ulangan' });
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Live Chat in-memory store for instant multi-user real-time sync
const liveChats: any[] = [];

app.get('/api/chats', (req, res) => {
  res.json(liveChats);
});

app.post('/api/chats', (req, res) => {
  const msg = req.body;
  if (!msg || !msg.id) {
    res.status(400).json({ error: 'Message payload invalid' });
    return;
  }
  const existingIdx = liveChats.findIndex((m: any) => m.id === msg.id);
  if (existingIdx >= 0) {
    liveChats[existingIdx] = msg;
  } else {
    liveChats.push(msg);
  }
  // Keep up to 500 recent messages
  if (liveChats.length > 500) {
    liveChats.splice(0, liveChats.length - 500);
  }
  res.json({ success: true, message: msg });
});

app.delete('/api/chats/:id', (req, res) => {
  const { id } = req.params;
  const idx = liveChats.findIndex((m: any) => m.id === id);
  if (idx >= 0) {
    liveChats.splice(idx, 1);
  }
  res.json({ success: true });
});

// Serve config with engineer credentials from environment
app.get('/api/config', (req, res) => {
  res.json({
    engineerUsername: process.env.ENGINEER_USERNAME || 'vcg-admin',
    engineerPassword: process.env.ENGINEER_PASSWORD || 'vcg_mcc2ro'
  });
});

// Vite middleware configuration for full-stack integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VisionCore Group Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
