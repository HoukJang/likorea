const LiKoreaAPI = require('./LiKoreaAPI');
const OpenAIService = require('./OpenAIService');
const GoogleMapsService = require('./GoogleMapsService');
const Bot = require('../models/Bot');

class BotManager {
  constructor(config) {
    this.config = config;
    this.bots = new Map();
    this.likoreaAPI = new LiKoreaAPI(config);
    this.openAIService = new OpenAIService(config);
    this.googleMapsService = new GoogleMapsService();
  }

  async initialize() {
    console.log('Initializing bots...');
    
    // Google Maps 서비스는 필요할 때 초기화
    console.log('Google Maps service will be initialized on demand');
    
    for (const botConfig of this.config.bots) {
      if (botConfig.settings.active) {
        const bot = new Bot(botConfig, this.likoreaAPI, this.openAIService);
        await bot.initialize();
        this.bots.set(botConfig.id, bot);
        console.log(`✅ Bot initialized: ${botConfig.name} (${botConfig.id})`);
      }
    }
    
    console.log(`Total active bots: ${this.bots.size}`);
  }

  async executeTask(botId, task) {
    const bot = this.bots.get(botId);
    
    if (!bot) {
      throw new Error(`Bot ${botId} not found or not active`);
    }
    
    return await bot.executeTask(task);
  }

  getBotList() {
    return Array.from(this.bots.values()).map(bot => ({
      id: bot.config.id,
      name: bot.config.name,
      persona: bot.config.persona,
      settings: bot.config.settings
    }));
  }

  getBotStatus(botId) {
    const bot = this.bots.get(botId);
    
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }
    
    return bot.getStatus();
  }

  async scheduledPost(botId) {
    const bot = this.bots.get(botId);
    
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }
    
    const topics = this.generateTopics(bot.config.persona.interests);
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return await bot.executeTask(randomTopic);
  }

  generateTopics(interests) {
    const topicTemplates = {
      '맛집 탐방': [
        '오늘 다녀온 롱아일랜드 한식당 리뷰',
        '뉴욕 근교 숨은 맛집 소개',
        '이번 주 발견한 카페 추천'
      ],
      '테크': [
        '최신 개발 트렌드 소개',
        'AI 기술의 일상 활용법',
        '유용한 개발 도구 추천'
      ],
      '운동': [
        '롱아일랜드 운동 시설 추천',
        '건강한 라이프스타일 팁',
        '이번 주 운동 루틴 공유'
      ],
      'K-pop': [
        'K-pop 최신 소식',
        '뉴욕에서 K-pop 즐기기',
        'K-pop 콘서트 정보'
      ]
    };
    
    let allTopics = [];
    interests.forEach(interest => {
      if (topicTemplates[interest]) {
        allTopics = allTopics.concat(topicTemplates[interest]);
      }
    });
    
    return allTopics.length > 0 ? allTopics : ['오늘의 일상 공유'];
  }

  async executeRestaurantReview(botId, googleMapsUrl, additionalInfo) {
    console.log(`[BotManager] Starting restaurant review for bot ${botId}`);
    const bot = this.bots.get(botId);
    
    if (!bot) {
      console.error(`[BotManager] Bot ${botId} not found`);
      throw new Error(`Bot ${botId} not found or not active`);
    }
    
    try {
      // Google Maps 서비스 초기화 (필요한 경우)
      if (!this.googleMapsService.browser) {
        console.log(`[BotManager] Initializing Google Maps service...`);
        await this.googleMapsService.initialize();
      }
      
      console.log(`[BotManager] Scraping restaurant info from: ${googleMapsUrl}`);
      // Google Maps에서 식당 정보 스크래핑
      const restaurantInfo = await this.googleMapsService.scrapeRestaurantInfo(googleMapsUrl);
      console.log(`[BotManager] Restaurant info scraped:`, restaurantInfo.name);
      
      // 이미지 다운로드 (최대 3개)
      const images = [];
      for (let i = 0; i < Math.min(3, restaurantInfo.images.length); i++) {
        console.log(`[BotManager] Downloading image ${i+1}/${restaurantInfo.images.length}`);
        const imageData = await this.googleMapsService.downloadImage(restaurantInfo.images[i], i);
        if (imageData) {
          images.push(imageData);
        }
      }
      console.log(`[BotManager] Downloaded ${images.length} images`);
      
      // 리뷰 생성을 위한 task 문자열 구성
      let task = `${restaurantInfo.name} 맛집 리뷰`;
      if (additionalInfo) {
        task += ` - ${additionalInfo}`;
      }
      
      console.log(`[BotManager] Executing task: ${task}`);
      // 봇이 리뷰 작성
      const result = await bot.executeTask(task, { restaurantInfo, images });
      
      return {
        ...result,
        imageCount: images.length
      };
    } catch (error) {
      console.error(`[BotManager] Restaurant review failed for bot ${botId}:`, error);
      throw error;
    }
  }

  async cleanup() {
    await this.googleMapsService.cleanup();
  }
}

module.exports = BotManager;