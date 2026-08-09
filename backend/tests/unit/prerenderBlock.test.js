const { shouldBlockRequest } = require('../../prerender/renderer');

describe('shouldBlockRequest', () => {
  test('blocks static resource types', () => {
    expect(shouldBlockRequest('image', 'https://likorea.com/logo.png')).toBe(true);
    expect(shouldBlockRequest('font', 'https://likorea.com/font.woff2')).toBe(true);
    expect(shouldBlockRequest('media', 'https://likorea.com/a.mp4')).toBe(true);
    expect(shouldBlockRequest('stylesheet', 'https://likorea.com/a.css')).toBe(true);
  });

  test('blocks analytics hosts regardless of resource type', () => {
    expect(shouldBlockRequest('script', 'https://www.googletagmanager.com/gtm.js?id=GTM-X')).toBe(true);
    expect(shouldBlockRequest('script', 'https://www.google-analytics.com/g/collect')).toBe(true);
    expect(shouldBlockRequest('xhr', 'https://analytics.google.com/g/collect?v=2')).toBe(true);
    expect(shouldBlockRequest('script', 'https://stats.g.doubleclick.net/j/collect')).toBe(true);
  });

  test('allows app scripts, API calls and documents', () => {
    expect(shouldBlockRequest('document', 'https://likorea.com/boards/abc')).toBe(false);
    expect(shouldBlockRequest('script', 'https://likorea.com/static/js/main.js')).toBe(false);
    expect(shouldBlockRequest('xhr', 'https://likorea.com/api/boards?page=1')).toBe(false);
  });

  test('does not block lookalike hostnames', () => {
    expect(shouldBlockRequest('script', 'https://notgoogletagmanager.com/gtm.js')).toBe(false);
    expect(shouldBlockRequest('script', 'https://google-analytics.com.evil.io/x.js')).toBe(false);
  });

  test('returns false on unparseable URL', () => {
    expect(shouldBlockRequest('script', 'not-a-url')).toBe(false);
  });
});
