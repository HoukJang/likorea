const { isBotUserAgent } = require('../../utils/botDetector');

describe('botDetector Unit Tests', () => {
  describe('isBotUserAgent', () => {
    test('빈 문자열, null, undefined는 봇으로 판별', () => {
      expect(isBotUserAgent('')).toBe(true);
      expect(isBotUserAgent(null)).toBe(true);
      expect(isBotUserAgent(undefined)).toBe(true);
      expect(isBotUserAgent('   ')).toBe(true);
    });

    test('알려진 봇/크롤러 User-Agent를 봇으로 판별', () => {
      const botUserAgents = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
        'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
        'BingPreview/1.0b',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'WhatsApp/2.21.12.21 A',
        'TelegramBot (like TwitterBot)',
        'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
        'KakaoTalk-Scrap/1.0',
        'Mozilla/5.0 HeadlessChrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 Chrome-Lighthouse',
        'Pingdom.com_bot_version_1.4',
        'UptimeRobot/2.0; +http://www.uptimerobot.com/',
        'curl/7.79.1',
        'Wget/1.21.1',
        'python-requests/2.28.1',
        'Python-urllib/3.9',
        'axios/1.11.0',
        'Go-http-client/1.1',
        'okhttp/4.9.0',
        'Java/1.8.0_291',
        'Mozilla/5.0 (compatible; PhantomJS/2.1.1)'
      ];

      botUserAgents.forEach(ua => {
        expect(isBotUserAgent(ua)).toBe(true);
      });
    });

    test('대소문자와 무관하게 봇을 판별 (case-insensitive)', () => {
      expect(isBotUserAgent('SOME-BOT/1.0')).toBe(true);
      expect(isBotUserAgent('CURL/8.0.1')).toBe(true);
      expect(isBotUserAgent('Mozilla/5.0 SpIdEr')).toBe(true);
    });

    test('일반 브라우저 User-Agent는 봇이 아닌 것으로 판별', () => {
      const humanUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      ];

      humanUserAgents.forEach(ua => {
        expect(isBotUserAgent(ua)).toBe(false);
      });
    });
  });
});
