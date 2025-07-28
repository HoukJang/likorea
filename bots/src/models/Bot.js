class Bot {
  constructor(config, likoreaAPI, openAIService) {
    this.config = config;
    this.likoreaAPI = likoreaAPI;
    this.openAIService = openAIService;
    this.token = null;
    this.tokenExpiry = null;
  }

  async initialize() {
    try {
      console.log(`[Bot] Initializing likorea API for bot ${this.config.id}`);
      const accountExists = await this.checkAccountExists();
      if (!accountExists) {
        await this.likoreaAPI.createBotAccount(this.config);
      }
      await this.authenticate();
    } catch (error) {
      console.error(`Failed to initialize bot ${this.config.id}:`, error.message);
      throw error;
    }
  }

  async checkAccountExists() {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      return false;
    }
  }

  async authenticate() {
    try {
      const { username, password } = this.config.persona.likoreaAccount;
      this.token = await this.likoreaAPI.login(username, password);
      this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      return this.token;
    } catch (error) {
      throw new Error(`Authentication failed for bot ${this.config.id}: ${error.message}`);
    }
  }

  async ensureAuthenticated() {
    if (!this.token || Date.now() > this.tokenExpiry) {
      await this.authenticate();
    }
  }

  async executeTask(task, additionalData = {}) {
    try {
      await this.ensureAuthenticated();
      
      const generatedContent = await this.openAIService.generateContent(
        this.config,
        task,
        this.config.prompt.postingStyle,
        additionalData
      );
      
      // 봇 표시 추가
      const botIndicator = this.getBotIndicator();
      const contentWithIndicator = `${generatedContent.content}\n\n${botIndicator}`;
      
      // 실제 게시글 작성
      console.log(`[Bot] Creating post for ${this.config.name}:`, generatedContent.title);
      
      const postData = {
        title: generatedContent.title,
        content: contentWithIndicator,
        category: this.selectCategory(),
        tags: this.config.settings.tags || []
      };
      
      const post = await this.likoreaAPI.createPost(this.token, postData);
      
      return {
        success: true,
        botName: this.config.name,
        title: generatedContent.title,
        postId: post._id,
        preview: generatedContent.content.substring(0, 100) + '...'
      };
    } catch (error) {
      console.error(`Task execution failed for bot ${this.config.id}:`, error.message);
      throw error;
    }
  }

  selectCategory() {
    const interestCategoryMap = {
      '맛집 탐방': '생활',
      '카페 투어': '생활',
      'K-pop': '문화',
      '테크': 'IT',
      '게임': '취미',
      '운동': '스포츠'
    };
    
    const interest = this.config.persona.interests[0];
    return interestCategoryMap[interest] || '일반';
  }

  getStatus() {
    return {
      id: this.config.id,
      name: this.config.name,
      persona: this.config.persona,
      settings: this.config.settings,
      authenticated: !!this.token && Date.now() < this.tokenExpiry,
      lastActivity: this.lastActivity || null
    };
  }

  getBotIndicator() {
    return `[AI ${this.config.name}]`;
  }

  async generateResponse(message) {
    try {
      return await this.openAIService.generateResponse(this.config, message);
    } catch (error) {
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }
}

module.exports = Bot;