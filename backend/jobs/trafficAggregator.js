const TrafficLog = require('../models/TrafficLog');
const TrafficDaily = require('../models/TrafficDaily');
const logger = require('../utils/logger');

const NY_TIMEZONE = 'America/New_York';
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let aggregationInterval = null;

/**
 * America/New_York 기준 오늘/어제 날짜('YYYY-MM-DD') 문자열 반환
 */
const getNyDateString = (offsetDays = 0) => {
  const target = new Date(Date.now() + offsetDays * ONE_DAY_MS);
  return target.toLocaleDateString('en-CA', { timeZone: NY_TIMEZONE });
};

/**
 * 특정 NY 날짜(dateStr)의 TrafficLog를 집계하여 TrafficDaily에 upsert
 * @param {string} dateStr - 'YYYY-MM-DD' (America/New_York 기준)
 */
const aggregateDay = async dateStr => {
  // 인덱스(timestamp)를 타도록 UTC 기준 ±1일 범위로 먼저 좁힌 뒤,
  // $dateToString(timezone: America/New_York)으로 정확한 날짜만 필터링
  const dayStartUtc = new Date(`${dateStr}T00:00:00.000Z`);
  const rangeStart = new Date(dayStartUtc.getTime() - ONE_DAY_MS);
  const rangeEnd = new Date(dayStartUtc.getTime() + 2 * ONE_DAY_MS);

  const pipeline = [
    {
      $match: {
        timestamp: { $gte: rangeStart, $lt: rangeEnd }
      }
    },
    {
      $addFields: {
        nyDate: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: NY_TIMEZONE }
        }
      }
    },
    {
      $match: { nyDate: dateStr }
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalRequests: { $sum: 1 },
              avgResponseTime: { $avg: '$responseTime' },
              errorCount: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
            }
          }
        ],
        botCount: [{ $match: { isBot: true } }, { $count: 'count' }],
        uniqueIps: [{ $group: { _id: '$ip' } }, { $count: 'count' }],
        uniqueUsers: [
          { $match: { userId: { $ne: null } } },
          { $group: { _id: '$userId' } },
          { $count: 'count' }
        ],
        topPaths: [
          { $match: { isBot: { $ne: true } } },
          { $group: { _id: '$path', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]
      }
    }
  ];

  const [result] = await TrafficLog.aggregate(pipeline);

  const totals = (result && result.totals && result.totals[0]) || {
    totalRequests: 0,
    avgResponseTime: 0,
    errorCount: 0
  };
  const botRequests = (result && result.botCount && result.botCount[0]?.count) || 0;
  const uniqueIps = (result && result.uniqueIps && result.uniqueIps[0]?.count) || 0;
  const uniqueUsers = (result && result.uniqueUsers && result.uniqueUsers[0]?.count) || 0;
  const topPaths = ((result && result.topPaths) || []).map(item => ({
    path: item._id,
    count: item.count
  }));

  const dailyDoc = {
    date: dateStr,
    totalRequests: totals.totalRequests,
    botRequests,
    humanRequests: totals.totalRequests - botRequests,
    uniqueIps,
    uniqueUsers,
    avgResponseTime: totals.avgResponseTime || 0,
    errorCount: totals.errorCount,
    topPaths
  };

  await TrafficDaily.findOneAndUpdate({ date: dateStr }, dailyDoc, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  return dailyDoc;
};

/**
 * 오늘 + 어제를 재집계 (오늘은 진행 중인 데이터, 어제는 자정 경계 넘어온 로그 보정용)
 */
const aggregateRecentDays = async () => {
  try {
    await aggregateDay(getNyDateString(-1));
    await aggregateDay(getNyDateString(0));
  } catch (error) {
    logger.error('트래픽 일별 집계 실패:', error.message);
  }
};

/**
 * 일별 트래픽 집계 스케줄러 시작
 * - 즉시 오늘+어제 집계 실행
 * - 이후 1시간마다 오늘+어제 재집계
 * - 테스트 환경에서는 아무것도 하지 않음
 */
const startTrafficAggregation = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // 즉시 1회 실행
  aggregateRecentDays();

  aggregationInterval = setInterval(aggregateRecentDays, ONE_HOUR_MS);
  aggregationInterval.unref();

  logger.info('트래픽 일별 집계 스케줄러 시작 (1시간 주기)');
};

module.exports = {
  aggregateDay,
  startTrafficAggregation
};
