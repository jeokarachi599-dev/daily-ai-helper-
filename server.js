/* Daily AI Helper — minimal secure proxy + static server.
   The Gemini API key lives ONLY in the GEMINI_API_KEY environment variable. */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
    const m = l.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* no .env file — fine */ }

const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CHAT_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro'];

app.use(express.json({ limit: '15mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
/* Files may sit in public/ or its subfolders — server checks all levels */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public', 'public')));
app.use(express.static(path.join(__dirname, 'public', 'public', 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true, hasKey: !!GEMINI_KEY }));

const hits = new Map();
function limited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0];
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(ts => now - ts < 60000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 30;
}

app.post('/api/chat', async (req, res) => {
  if (!GEMINI_KEY) return res.status(503).json({ error: 'SERVER_KEY_MISSING' });
  if (limited(req)) return res.status(429).json({ error: 'RATE_LIMITED' });
  const b = req.body || {};
  const model = CHAT_MODELS.includes(b.model) ? b.model : 'gemini-1.5-flash';
  let upstream;
  try {
    upstream = await fetch(BASE + '/models/' + model + ':streamGenerateContent?alt=sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({ contents: b.contents, system_instruction: b.system_instruction, generationConfig: b.generationConfig })
    });
  } catch (e) { return res.status(502).json({ error: 'UPSTREAM_ERROR' }); }
  if (!upstream.ok) {
    let m = 'HTTP ' + upstream.status;
    try { const j = await upstream.json(); m = (j.error && j.error.message) || m; } catch (e) {}
    return res.status(upstream.status === 400 ? 400 : 502).json({ error: m });
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const nodeStream = Readable.fromWeb(upstream.body);
  nodeStream.on('error', () => res.end());
  nodeStream.pipe(res);
  req.on('close', () => { try { nodeStream.destroy(); } catch (e) {} });
});

app.post('/api/image', async (req, res) => {
  if (!GEMINI_KEY) return res.status(503).json({ error: 'SERVER_KEY_MISSING' });
  if (limited(req)) return res.status(429).json({ error: 'RATE_LIMITED' });
  const b = req.body || {};
  const parts = Array.isArray(b.parts) ? b.parts : [{ text: b.prompt || 'image' }];
  for (const m of ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation']) {
    try {
      const r = await fetch(BASE + '/models/' + m + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts }] })
      });
      if (r.ok) {
        const j = await r.json();
        const ps = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
        for (const p of ps) { const d = p.inlineData || p.inline_data; if (d && d.data) return res.json({ dataUrl: 'data:' + (d.mime_type || 'image/png') + ';base64,' + d.data }); }
      }
    } catch (e) {}
  }
  try {
    const r = await fetch(BASE + '/models/imagen-3.0-generate-002:predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({ instances: [{ prompt: b.prompt || 'image' }], parameters: { sampleCount: 1 } })
    });
    if (r.ok) {
      const j = await r.json();
      const bb = j.predictions && j.predictions[0] && j.predictions[0].bytesBase64Encoded;
      if (bb) return res.json({ dataUrl: 'data:image/png;base64,' + bb });
    }
  } catch (e) {}
  res.status(502).json({ error: 'IMAGE_FAILED' });
});

app.listen(PORT, () => console.log('Daily AI Helper running on port ' + PORT));
