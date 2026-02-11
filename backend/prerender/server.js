const express = require('express');
const path = require('path');
const fs = require('fs');
const cacheManager = require('./cacheManager');
const renderer = require('./renderer');

const app = express();
const PORT = process.env.PRERENDER_PORT || 5002;
const SITE_URL = process.env.SITE_URL || 'https://likorea.com';
const INDEX_HTML_PATH = path.join(__dirname, '../../frontend/build/index.html');

const SKIP_PATTERNS = [/^\/dashboard/, /^\/admin/, /^\/api\//, /^\/design-/];

function isAllowedPath(urlPath) {
  return !SKIP_PATTERNS.some(p => p.test(urlPath));
}

function getIndexHtml() {
  try {
    return fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  } catch {
    return '<html><body>Service unavailable</body></html>';
  }
}

app.use(express.json());

// Only allow localhost for mutation endpoints
function localhostOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden' });
}

// Render endpoint - called by Nginx for bot requests
app.get('/render', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).send('Invalid url');
  }

  if (!isAllowedPath(parsed.pathname)) {
    res.set('Content-Type', 'text/html');
    return res.send(getIndexHtml());
  }

  // Check cache
  const cached = cacheManager.get(url);
  if (cached) {
    res.set('Content-Type', 'text/html');
    res.set('X-Prerender-Cache', 'HIT');
    res.set('X-Prerender-Source', cached.source);
    return res.send(cached.html);
  }

  // Render with Puppeteer
  try {
    const html = await renderer.render(url);
    cacheManager.set(url, html);

    res.set('Content-Type', 'text/html');
    res.set('X-Prerender-Cache', 'MISS');
    res.send(html);
  } catch (err) {
    console.error(`Render failed for ${url}:`, err.message);
    res.set('Content-Type', 'text/html');
    res.set('X-Prerender-Cache', 'ERROR');
    res.send(getIndexHtml());
  }
});

// Cache invalidation
app.post('/invalidate', localhostOnly, (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array required' });
  }

  let deleted = 0;
  for (const url of urls) {
    cacheManager.delete(url);
    deleted++;
  }

  console.log(`Cache invalidated: ${deleted} URLs`);
  res.json({ success: true, deleted });
});

// Health check
app.get('/health', (_req, res) => {
  const rendererStatus = renderer.status();
  const cacheStats = cacheManager.stats();

  res.json({
    status: rendererStatus.browserConnected ? 'healthy' : 'degraded',
    renderer: rendererStatus,
    cache: cacheStats
  });
});

// Startup
async function start() {
  const restored = cacheManager.restore();
  console.log(`Cache restored: ${restored} entries from disk`);

  await renderer.initialize();

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Prerender service running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down prerender service...');
  await renderer.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await renderer.close();
  process.exit(0);
});

start().catch(err => {
  console.error('Prerender service failed to start:', err);
  process.exit(1);
});
