#!/usr/bin/env node

const http = require('http');
const https = require('https');

const PRERENDER_URL = 'http://127.0.0.1:5002';
const SITEMAP_URL = process.argv[2] || 'https://likorea.com/sitemap.xml';
const DELAY_MS = 2000;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseSitemapUrls(xml) {
  const urls = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function renderRequest(url) {
  return new Promise((resolve, reject) => {
    const reqUrl = `${PRERENDER_URL}/render?url=${encodeURIComponent(url)}`;
    http.get(reqUrl, { timeout: 30000 }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({
        status: res.statusCode,
        cache: res.headers['x-prerender-cache'],
        size: data.length
      }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function warmup() {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);

  let xml;
  try {
    xml = await fetch(SITEMAP_URL);
  } catch (err) {
    console.error(`Failed to fetch sitemap: ${err.message}`);
    process.exit(1);
  }

  const urls = parseSitemapUrls(xml);
  console.log(`Found ${urls.length} URLs to warm up\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const result = await renderRequest(url);
      console.log(`[${i + 1}/${urls.length}] OK ${result.cache} ${(result.size / 1024).toFixed(1)}KB ${url}`);
      success++;
    } catch (err) {
      console.error(`[${i + 1}/${urls.length}] FAIL ${url}: ${err.message}`);
      fail++;
    }

    if (i < urls.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nWarmup complete: ${success} success, ${fail} failed`);
}

warmup().catch(err => {
  console.error('Warmup failed:', err);
  process.exit(1);
});
