const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * OpenAI API를 사용하여 게시글 생성
   * @param {Object} bot - 봇 정보
   * @param {string} systemPrompt - 시스템 프롬프트
   * @param {string} userPrompt - 사용자 프롬프트
   * @returns {Promise<Object>} 생성된 게시글 정보
   */
  async generatePost(bot, systemPrompt, userPrompt) {
    try {
      // GPT 모델에 따른 설정
      const modelConfig = this.getModelConfig(bot.aiModel);
      
      // OpenAI API 호출
      const completion = await this.openai.chat.completions.create({
        model: bot.aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: modelConfig.maxTokens,
      });
      
      const response = completion.choices[0].message.content;
      
      // 응답 파싱
      const titleMatch = response.match(/제목:\s*(.+?)(?:\n|$)/);
      const contentMatch = response.match(/내용:\s*([\s\S]+)$/);
      
      if (!titleMatch || !contentMatch) {
        throw new Error('생성된 게시글 형식이 올바르지 않습니다.');
      }
      
      const title = titleMatch[1].trim();
      const content = contentMatch[1].trim();
      
      // HTML 포맷팅
      const htmlContent = content
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('\n');
      
      return {
        title,
        content: htmlContent,
        usage: {
          inputTokens: completion.usage.prompt_tokens,
          outputTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          model: bot.aiModel,
        }
      };
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`게시글 생성 실패: ${error.message}`);
    }
  }

  /**
   * 모델별 설정 반환
   * @param {string} model - 모델 ID
   * @returns {Object} 모델 설정
   */
  getModelConfig(model) {
    const configs = {
      'gpt-3.5-turbo': { maxTokens: 1024, contextWindow: 4096 },
      'gpt-3.5-turbo-16k': { maxTokens: 2048, contextWindow: 16384 },
      'gpt-4': { maxTokens: 1024, contextWindow: 8192 },
      'gpt-4-32k': { maxTokens: 2048, contextWindow: 32768 },
      'gpt-4-turbo': { maxTokens: 2048, contextWindow: 128000 },
      'gpt-4o': { maxTokens: 2048, contextWindow: 128000 },
      'gpt-4o-mini': { maxTokens: 1024, contextWindow: 128000 },
    };
    
    return configs[model] || { maxTokens: 1024, contextWindow: 4096 };
  }

  /**
   * 모델별 비용 계산
   * @param {Object} usage - 토큰 사용량 정보
   * @returns {number} 예상 비용 (USD)
   */
  calculateCost(usage) {
    // 2024년 기준 가격 (USD per 1K tokens)
    const modelPricing = {
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    };
    
    const pricing = modelPricing[usage.model] || modelPricing['gpt-3.5-turbo'];
    const inputCost = (usage.inputTokens / 1000) * pricing.input;
    const outputCost = (usage.outputTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }
}

module.exports = new OpenAIService();