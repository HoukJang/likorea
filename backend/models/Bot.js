const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'inactive'
  },
  // 현재 작업 상태
  taskStatus: {
    type: String,
    enum: ['idle', 'generating', 'completed', 'failed'],
    default: 'idle'
  },
  currentTask: {
    description: String,
    startedAt: Date,
    completedAt: Date,
    error: String
  },
  type: {
    type: String,
    enum: ['news', 'restaurant', 'general'],  // 뉴스봇, 맛집봇, 일반봇
    default: 'news'
  },
  subType: {
    type: String,
    enum: ['local', 'korean', 'business', 'event', 'general'],  // 뉴스 카테고리
    default: 'local'
  },
  lastActivity: {
    type: Date,
    default: null
  },
  settings: {
    autoPost: {
      type: Boolean,
      default: false
    },
    postInterval: {
      type: Number,
      default: 3600000 // 1시간
    },
    targetCategories: [{
      type: String
    }]
  },
  stats: {
    postsCreated: {
      type: Number,
      default: 0
    },
    lastPostDate: {
      type: Date,
      default: null
    }
  },
  persona: {
    age: Number,
    gender: String,
    occupation: String,
    interests: [String],
    personality: String,
    location: String,
    likoreaAccount: {
      username: String,
      password: String,
      email: String
    }
  },
  prompt: {
    system: {
      type: String,
      default: `당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`
    },
    user: {
      type: String,
      default: ''
    }
  },
  // Claude API 파라미터
  apiSettings: {
    maxTokens: {
      type: Number,
      default: 800,
      min: 1,
      max: 200000  // Claude 4 최대 출력 지원
    },
    temperature: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1
    },
    topP: {
      type: Number,
      default: 0.95,
      min: 0,
      max: 1
    },
    topK: {
      type: Number,
      default: 0,
      min: 0
    },
    // 확장된 사고 기능 (Claude 4 모델 전용)
    // 활성화 시 'interleaved-thinking-2025-05-14' 베타 헤더 사용
    enableThinking: {
      type: Boolean,
      default: false
    },
    // 베타 기능 헤더 (커스텀 설정)
    // 주의: 잘못된 헤더 값은 API 오류 발생
    // 올바른 예시: 'anthropic-beta': 'interleaved-thinking-2025-05-14'
    // 잘못된 예시: 'anthropic-beta': 'thinking-2025-05-14' (X)
    betaHeaders: {
      type: Map,
      of: String,
      default: new Map()
    },
    // 전체 기사 추출 설정 (뉴스봇 전용)
    extractFullArticles: {
      type: Boolean,
      default: false,
      description: '전체 기사 내용 추출 여부 (성능 고려 필요)'
    },
    maxFullArticles: {
      type: Number,
      default: 7,
      min: 1,
      max: 10,
      description: '전체 기사 추출 최대 개수'
    }
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  aiModel: {
    type: String,
    enum: [
      // Claude models (현재 사용 가능한 모델)
      'claude-3-haiku-20240307',
      'claude-3-5-haiku-20241022',
      'claude-3-5-sonnet-20241022',
      'claude-3-7-sonnet',  // 하이브리드 추론 모델
      'claude-sonnet-4-20250514',  // Claude 4 Sonnet (2025년 5월 출시)
      'claude-opus-4-20250514'    // Claude 4 Opus (2025년 5월 출시)
    ],
    default: 'claude-3-haiku-20240307'
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Bot', botSchema);