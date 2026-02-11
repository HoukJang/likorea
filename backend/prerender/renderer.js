const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const RENDER_TIMEOUT = 15000;
const MAX_CONCURRENT = 3;
const MAX_QUEUE = 10;
const QUEUE_TIMEOUT = 30000;

class Renderer {
  constructor() {
    this.browser = null;
    this.activeRenders = 0;
    this.queue = [];
  }

  async initialize() {
    if (this.browser) {
      try { await this.browser.close(); } catch { /* ignore */ }
    }

    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--single-process',
        '--no-zygote'
      ]
    });

    this.browser.on('disconnected', () => {
      console.warn('Browser disconnected, restarting...');
      this.browser = null;
      this.initialize().catch(err => {
        console.error('Browser restart failed:', err.message);
      });
    });

    console.log('Puppeteer browser initialized');
  }

  async _acquireSemaphore() {
    if (this.activeRenders < MAX_CONCURRENT) {
      this.activeRenders++;
      return;
    }

    if (this.queue.length >= MAX_QUEUE) {
      throw new Error('Render queue full');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.queue.indexOf(resolver);
        if (idx > -1) this.queue.splice(idx, 1);
        reject(new Error('Render queue timeout'));
      }, QUEUE_TIMEOUT);

      const resolver = () => {
        clearTimeout(timeout);
        this.activeRenders++;
        resolve();
      };
      this.queue.push(resolver);
    });
  }

  _releaseSemaphore() {
    this.activeRenders--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }

  async render(url) {
    if (!this.browser) {
      await this.initialize();
    }

    await this._acquireSemaphore();

    let page;
    try {
      page = await this.browser.newPage();

      await page.setRequestInterception(true);
      page.on('request', req => {
        const type = req.resourceType();
        if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: RENDER_TIMEOUT
      });

      await page.waitForFunction(() => {
        const title = document.querySelector('title');
        return title && title.textContent && title.textContent.length > 0;
      }, { timeout: 5000 }).catch(() => {
        // title not found within 5s, proceed anyway
      });

      const html = await page.content();
      return html;
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      this._releaseSemaphore();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  status() {
    return {
      browserConnected: !!this.browser,
      activeRenders: this.activeRenders,
      queueLength: this.queue.length
    };
  }
}

module.exports = new Renderer();
