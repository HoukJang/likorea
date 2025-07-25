const TrafficLog = require('../models/TrafficLog');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * 트래픽 대시보드 데이터 조회
 */
exports.getTrafficDashboard = asyncHandler(async (req, res) => {
  const { period = '24h' } = req.query;
  
  // 기간별 시간 범위 계산
  const now = new Date();
  let startTime;
  
  switch (period) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // 기본 통계
  const totalRequests = await TrafficLog.countDocuments({
    timestamp: { $gte: startTime }
  });

  const uniqueUsers = await TrafficLog.distinct('userId', {
    timestamp: { $gte: startTime },
    userId: { $ne: null }
  });

  const avgResponseTime = await TrafficLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' }
      }
    }
  ]);

  // HTTP 상태 코드별 통계
  const statusCodeStats = await TrafficLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$statusCode',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // HTTP 메서드별 통계
  const methodStats = await TrafficLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // 인기 경로별 통계
  const pathStats = await TrafficLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$path',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // 시간별 요청 수 (차트용)
  const hourlyStats = await TrafficLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
    }
  ]);

  // 에러 통계
  const errorStats = await TrafficLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        $or: [
          { statusCode: { $gte: 400 } },
          { error: { $ne: null } }
        ]
      }
    },
    {
      $group: {
        _id: '$statusCode',
        count: { $sum: 1 },
        errors: { $push: '$error' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // 사용자 권한별 통계
  const authorityStats = await TrafficLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        userAuthority: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$userAuthority',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      period,
      summary: {
        totalRequests,
        uniqueUsers: uniqueUsers.length,
        avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0
      },
      statusCodeStats,
      methodStats,
      pathStats,
      hourlyStats,
      errorStats,
      authorityStats
    }
  });
});

/**
 * 실시간 트래픽 데이터 조회 (최근 1시간)
 */
exports.getRealtimeTraffic = asyncHandler(async (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentTraffic = await TrafficLog.find({
    timestamp: { $gte: oneHourAgo }
  })
  .sort({ timestamp: -1 })
  .limit(50)
  .select('timestamp method path statusCode responseTime userAgent ip userId userAuthority')
  .populate('userId', 'id email');

  res.json({
    success: true,
    data: recentTraffic
  });
});

/**
 * 특정 경로의 상세 트래픽 분석
 */
exports.getPathAnalysis = asyncHandler(async (req, res) => {
  const { path } = req.params;
  const { period = '24h' } = req.query;
  
  const now = new Date();
  let startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  if (period === '7d') {
    startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const pathStats = await TrafficLog.aggregate([
    {
      $match: {
        path: path,
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          hour: { $hour: '$timestamp' }
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
      }
    },
    {
      $sort: { '_id.date': 1, '_id.hour': 1 }
    }
  ]);

  const userStats = await TrafficLog.aggregate([
    {
      $match: {
        path: path,
        timestamp: { $gte: startTime },
        userId: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.json({
    success: true,
    data: {
      path,
      period,
      pathStats,
      userStats
    }
  });
}); 