import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { execFile } from 'child_process';
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
    console.log('[PostgreSQL] Database pool created with DATABASE_URL.');
  } catch (err) {
    console.error('[PostgreSQL] Connection error:', err);
  }
}

// Python API Search Backend Runner
function runPythonSearchBackend(payload: { query: string; engine?: string }): Promise<{ text: string; engine?: string }> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'api_backend.py');
    const inputData = JSON.stringify(payload);

    const child = execFile('python3', [pythonScript, inputData], { env: process.env }, (error, stdout, stderr) => {
      if (error) {
        console.error('Python backend execution error:', stderr || error.message);
        reject(error);
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (parseErr) {
        resolve({ text: stdout.trim() || 'Python process completed without output.' });
      }
    });
  });
}

// Secure API route for smart AI-powered multi-engine research via Python
app.post('/api/ai-search', async (req, res) => {
  const { query, engine } = req.body;

  if (!query) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  try {
    const pythonResult = await runPythonSearchBackend({ query, engine: engine || 'perplexity' });
    res.json(pythonResult);
  } catch (error: any) {
    console.error('API Search Error:', error);
    res.status(500).json({ error: error?.message || 'Python backend search error' });
  }
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date(), 
    backend: 'Python 3.10 & Express',
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

// Serve config with engineer credentials from environment
app.get('/api/config', (req, res) => {
  res.json({
    engineerUsername: process.env.ENGINEER_USERNAME || 'cipher-res98100',
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
    console.log(`[CIPHER Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
