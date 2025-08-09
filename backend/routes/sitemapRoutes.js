const express = require('express');
const router = express.Router();
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const BoardPost = require('../models/BoardPost');
const logger = require('../utils/logger');

// 캐시 설정 (10분)
let sitemapCache = null;
let cacheTime = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

/**
 * @route   GET /api/sitemap.xml
 * @desc    동적 사이트맵 생성
 * @access  Public
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // 캐시 확인
    if (sitemapCache && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      res.header('Content-Type', 'application/xml; charset=UTF-8');
      res.header('X-Robots-Tag', 'noindex');  // sitemap 자체는 색인 안함
      return res.send(sitemapCache);
    }

    // 사이트맵 스트림 생성
    const smStream = new SitemapStream({ 
      hostname: 'https://likorea.com',
      cacheTime: CACHE_DURATION,
      xmlns: {
        news: false,
        xhtml: true,
        image: false,
        video: false
      }
    });

    // 정적 페이지 URL 추가
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/login', changefreq: 'monthly', priority: 0.3 },
      { url: '/register', changefreq: 'monthly', priority: 0.3 },
      { url: '/boards/general', changefreq: 'hourly', priority: 0.8 },
      { url: '/boards/notice', changefreq: 'daily', priority: 0.8 },
      { url: '/boards/market', changefreq: 'hourly', priority: 0.7 },
      { url: '/boards/realestate', changefreq: 'daily', priority: 0.7 },
      { url: '/boards/meeting', changefreq: 'daily', priority: 0.7 },
      { url: '/boards/qna', changefreq: 'daily', priority: 0.7 },
      { url: '/boards/chat', changefreq: 'hourly', priority: 0.6 },
      { url: '/boards/etc', changefreq: 'daily', priority: 0.6 },
      { url: '/mypage', changefreq: 'weekly', priority: 0.4 },
      { url: '/admin', changefreq: 'weekly', priority: 0.2 }
    ];

    // 정적 페이지 추가
    staticPages.forEach(page => {
      smStream.write(page);
    });

    // 동적 게시글 URL 추가 (최근 1000개)
    const posts = await BoardPost.find({ isDeleted: false })
      .select('boardType postNumber updatedAt')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    posts.forEach(post => {
      const boardPath = getBoardPath(post.boardType);
      smStream.write({
        url: `/boards/${boardPath}/${post.postNumber}`,
        lastmod: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.6
      });
    });

    // 스트림 종료
    smStream.end();

    // 스트림을 프로미스로 변환
    const sitemap = await streamToPromise(Readable.from(smStream));

    // 캐시 저장
    sitemapCache = sitemap;
    cacheTime = Date.now();

    // XML 응답 (gzip 비활성화, 명확한 charset 설정)
    res.header('Content-Type', 'application/xml; charset=UTF-8');
    res.header('X-Robots-Tag', 'noindex');  // sitemap 자체는 색인 안함
    res.send(sitemap);

    logger.info(`Sitemap generated with ${posts.length} posts`);
  } catch (error) {
    logger.error('Sitemap generation error:', error);
    res.status(500).end();
  }
});

// 게시판 타입을 URL 경로로 변환
function getBoardPath(boardType) {
  const boardPaths = {
    'general': 'general',
    'notice': 'notice',
    '사고팔고': 'market',
    '부동산': 'realestate',
    '모임': 'meeting',
    '문의': 'qna',
    '잡담': 'chat',
    '기타': 'etc'
  };
  return boardPaths[boardType] || 'general';
}

// 캐시 초기화 엔드포인트 (관리자용)
router.post('/sitemap/clear-cache', (req, res) => {
  sitemapCache = null;
  cacheTime = null;
  logger.info('Sitemap cache cleared');
  res.json({ message: 'Sitemap cache cleared successfully' });
});

module.exports = router;