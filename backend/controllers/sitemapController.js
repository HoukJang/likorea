const NodeCache = require('node-cache');
const BoardPost = require('../models/BoardPost');
const { asyncHandler } = require('../middleware/errorHandler');

const sitemapCache = new NodeCache({ stdTTL: 3600 });

// /landing은 noindex, /login·/signup은 유틸 페이지 — sitemap에서 제외 (GSC 미색인 경고 원인)
const STATIC_PAGES = [
  { loc: '/', changefreq: 'hourly', priority: '1.0' },
  { loc: '/boards', changefreq: 'hourly', priority: '0.9' },
];

const TYPE_LABELS = {
  '사고팔고': 'buy-sell',
  '부동산': 'real-estate',
  '모임': 'meetup',
  '문의': 'inquiry',
  '잡담': 'chat',
  '기타': 'other',
  '맛집': 'restaurant',
  '생활정보': 'life-info',
  '뉴스': 'news',
};

const escapeXml = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const getSitemap = asyncHandler(async (req, res) => {
  const cached = sitemapCache.get('sitemap');
  if (cached) {
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(cached);
  }

  const posts = await BoardPost.find({ isApproved: true })
    .select('_id updatedAt tags.type')
    .lean();

  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of STATIC_PAGES) {
    xml += '  <url>\n';
    xml += `    <loc>https://likorea.com${page.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  for (const post of posts) {
    const lastmod = post.updatedAt
      ? new Date(post.updatedAt).toISOString().split('T')[0]
      : today;
    xml += '  <url>\n';
    xml += `    <loc>https://likorea.com/boards/${post._id}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>';

  sitemapCache.set('sitemap', xml);

  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

module.exports = { getSitemap };
