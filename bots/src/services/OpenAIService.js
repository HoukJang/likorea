const OpenAI = require('openai');

class OpenAIService {
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || config.openai.apiKey,
    });
    this.model = config.openai.model || 'gpt-4';
  }

  async generateContent(persona, task, postingStyle, additionalData = {}) {
    try {
      const systemPrompt = `${persona.prompt.base}\n\n게시글 작성 스타일: ${postingStyle}`;
      
      let userPrompt = `다음 주제로 롱아일랜드 한국인 커뮤니티 게시판에 올릴 게시글을 작성해주세요: ${task}`;
      
      // 맛집 리뷰인 경우 추가 정보 포함
      if (additionalData.restaurantInfo) {
        const info = additionalData.restaurantInfo;
        userPrompt += `\n\n식당 정보:\n- 이름: ${info.name}\n- 평점: ${info.rating}\n- 주소: ${info.address}\n- 인기 시간대: ${info.popularTimes || '정보 없음'}\n\n${persona.prompt.restaurantReviewTemplate || ''}`;
      } else {
        userPrompt += `\n\n요구사항:\n1. 제목과 내용을 포함해주세요\n2. 나의 관점과 경험을 포함해주세요\n3. 커뮤니티에 도움이 되는 정보를 포함해주세요\n4. 자연스럽고 진정성 있게 작성해주세요`;
      }
      
      userPrompt += `\n\n형식:\n제목: [게시글 제목]\n내용:\n[게시글 내용]`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const content = response.choices[0].message.content;
      return this.parseGeneratedContent(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  parseGeneratedContent(content) {
    console.log('[OpenAI] Raw response:', content);
    
    // 제목 추출 시도
    const titleMatch = content.match(/제목[:：]\s*(.+?)[\n\r]/);
    
    // 내용 추출 시도 - 여러 패턴 시도
    let contentMatch = content.match(/내용[:：]\s*([\s\S]+)/);
    if (!contentMatch) {
      contentMatch = content.match(/내용[:：][\n\r]+([\s\S]+)/);
    }
    
    if (!titleMatch || !contentMatch) {
      console.error('[OpenAI] Failed to parse content. Raw:', content);
      // 파싱 실패 시 전체 내용을 사용
      const lines = content.split('\n').filter(line => line.trim());
      return {
        title: lines[0] || '제목 없음',
        content: lines.slice(1).join('\n') || content
      };
    }
    
    return {
      title: titleMatch[1].trim(),
      content: contentMatch[1].trim()
    };
  }

  async generateResponse(persona, message) {
    try {
      const systemPrompt = persona.prompt.base;
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }
}

module.exports = OpenAIService;