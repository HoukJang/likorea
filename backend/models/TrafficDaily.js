const mongoose = require('mongoose');

/**
 * 일별 트래픽 집계 모델
 * TrafficLog는 30일 TTL로 삭제되므로, 장기 추세 분석을 위해
 * 일 단위로 집계된 요약 데이터를 별도 컬렉션에 영구 보존한다.
 */
const trafficDailySchema = new mongoose.Schema(
  {
    // America/New_York 기준 날짜 ('YYYY-MM-DD')
    date: {
      type: String,
      required: true,
      unique: true
    },
    totalRequests: {
      type: Number,
      default: 0
    },
    botRequests: {
      type: Number,
      default: 0
    },
    humanRequests: {
      type: Number,
      default: 0
    },
    uniqueIps: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    avgResponseTime: {
      type: Number,
      default: 0
    },
    errorCount: {
      type: Number,
      default: 0
    },
    // 사람 요청 기준 상위 10개 경로
    topPaths: {
      type: [
        {
          path: { type: String, required: true },
          count: { type: Number, required: true }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// date는 unique 옵션으로 이미 인덱스가 생성되므로 별도 인덱스는 추가하지 않음
// (TTL 인덱스 없음 - 장기 보존)

module.exports = mongoose.model('TrafficDaily', trafficDailySchema);
