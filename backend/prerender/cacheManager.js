const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, 'cache');

const TTL_MAP = [
  { pattern: /^\/boards\/[a-f0-9]{24}(\?.*)?$/, ttl: 86400 },
  { pattern: /^\/boards/, ttl: 3600 },
  { pattern: /^\/$/, ttl: 3600 },
  { pattern: /^\/(login|signup)$/, ttl: 86400 },
  { pattern: /^\/landing$/, ttl: 3600 },
];

const DEFAULT_TTL = 3600;

function getTTL(urlPath) {
  for (const { pattern, ttl } of TTL_MAP) {
    if (pattern.test(urlPath)) return ttl;
  }
  return DEFAULT_TTL;
}

class CacheManager {
  constructor() {
    this.memCache = new NodeCache({
      stdTTL: 0,
      checkperiod: 600,
      useClones: false,
      maxKeys: 500
    });
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  _key(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  _filePath(key) {
    return path.join(CACHE_DIR, `${key}.html`);
  }

  _metaPath(key) {
    return path.join(CACHE_DIR, `${key}.meta.json`);
  }

  get(url) {
    const key = this._key(url);

    const memResult = this.memCache.get(key);
    if (memResult) return { html: memResult, source: 'memory' };

    const metaPath = this._metaPath(key);
    const filePath = this._filePath(key);
    if (fs.existsSync(metaPath) && fs.existsSync(filePath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (meta.expiresAt > Date.now()) {
          const html = fs.readFileSync(filePath, 'utf-8');
          const remainingTTL = Math.ceil((meta.expiresAt - Date.now()) / 1000);
          this.memCache.set(key, html, remainingTTL);
          return { html, source: 'file' };
        }
        fs.unlinkSync(metaPath);
        fs.unlinkSync(filePath);
      } catch {
        // corrupted cache file, ignore
      }
    }

    return null;
  }

  set(url, html) {
    const key = this._key(url);
    const urlPath = new URL(url).pathname;
    const ttl = getTTL(urlPath);

    this.memCache.set(key, html, ttl);

    try {
      this._ensureDir();
      fs.writeFileSync(this._filePath(key), html, 'utf-8');
      fs.writeFileSync(this._metaPath(key), JSON.stringify({
        url,
        ttl,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000
      }), 'utf-8');
    } catch (err) {
      console.error('Cache file write failed:', err.message);
    }
  }

  delete(url) {
    const key = this._key(url);
    this.memCache.del(key);

    try {
      const filePath = this._filePath(key);
      const metaPath = this._metaPath(key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    } catch {
      // ignore
    }
  }

  deleteByPattern(pattern) {
    let deleted = 0;
    try {
      const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.meta.json'));
      for (const file of files) {
        const meta = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8'));
        if (pattern.test(meta.url)) {
          this.delete(meta.url);
          deleted++;
        }
      }
    } catch {
      // ignore
    }
    return deleted;
  }

  flush() {
    this.memCache.flushAll();
    try {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    } catch {
      // ignore
    }
  }

  restore() {
    let restored = 0;
    try {
      const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.meta.json'));
      for (const file of files) {
        const metaPath = path.join(CACHE_DIR, file);
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (meta.expiresAt > Date.now()) {
          const key = file.replace('.meta.json', '');
          const filePath = this._filePath(key);
          if (fs.existsSync(filePath)) {
            const html = fs.readFileSync(filePath, 'utf-8');
            const remainingTTL = Math.ceil((meta.expiresAt - Date.now()) / 1000);
            this.memCache.set(key, html, remainingTTL);
            restored++;
          }
        } else {
          fs.unlinkSync(metaPath);
          const htmlPath = path.join(CACHE_DIR, file.replace('.meta.json', '.html'));
          if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
        }
      }
    } catch {
      // ignore
    }
    return restored;
  }

  stats() {
    const memStats = this.memCache.getStats();
    let fileCount = 0;
    try {
      fileCount = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.html')).length;
    } catch {
      // ignore
    }
    return {
      memory: { keys: this.memCache.keys().length, hits: memStats.hits, misses: memStats.misses },
      file: { keys: fileCount },
      hitRate: memStats.hits + memStats.misses > 0
        ? ((memStats.hits / (memStats.hits + memStats.misses)) * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }
}

module.exports = new CacheManager();
