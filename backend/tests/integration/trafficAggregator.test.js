const mongoose = require('mongoose');
const TrafficLog = require('../../models/TrafficLog');
const TrafficDaily = require('../../models/TrafficDaily');
const { aggregateDay } = require('../../jobs/trafficAggregator');

describe('trafficAggregator Integration Tests', () => {
  const targetDate = '2026-01-15'; // 겨울(EST, UTC-5) 날짜 - DST 영향 없음

  afterEach(async () => {
    await TrafficLog.deleteMany({});
    await TrafficDaily.deleteMany({});
  });

  afterAll(async () => {
    await TrafficLog.deleteMany({});
    await TrafficDaily.deleteMany({});
  });

  test('aggregateDay는 NY 기준 해당 날짜의 로그만 집계하여 TrafficDaily를 upsert한다', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    // 대상 날짜(2026-01-15, NY) 안에 포함되는 로그 4건
    await TrafficLog.create([
      {
        timestamp: new Date('2026-01-15T18:00:00.000Z'), // NY 13:00
        method: 'GET',
        path: '/api/boards',
        statusCode: 200,
        responseTime: 100,
        userAgent: 'Mozilla/5.0 Chrome',
        ip: '1.1.1.1',
        userId: userA,
        isBot: false
      },
      {
        timestamp: new Date('2026-01-15T19:00:00.000Z'), // NY 14:00
        method: 'GET',
        path: '/api/boards',
        statusCode: 404,
        responseTime: 200,
        userAgent: 'Mozilla/5.0 Chrome',
        ip: '1.1.1.1',
        userId: null,
        isBot: false
      },
      {
        timestamp: new Date('2026-01-15T20:00:00.000Z'), // NY 15:00
        method: 'GET',
        path: '/api/boards',
        statusCode: 200,
        responseTime: 50,
        userAgent: 'curl/8.0.1',
        ip: '2.2.2.2',
        userId: null,
        isBot: true
      }
    ]);

    // isBot 필드가 없는 레거시 로그 (human으로 취급되어야 함)
    const legacyLog = await TrafficLog.create({
      timestamp: new Date('2026-01-15T21:00:00.000Z'), // NY 16:00
      method: 'GET',
      path: '/api/users',
      statusCode: 200,
      responseTime: 150,
      userAgent: 'Mozilla/5.0 Safari',
      ip: '3.3.3.3',
      userId: userB
    });
    await TrafficLog.collection.updateOne({ _id: legacyLog._id }, { $unset: { isBot: 1 } });

    // 대상 날짜 범위 밖의 로그 (전날/다음날 경계) - 집계에서 제외되어야 함
    await TrafficLog.create([
      {
        timestamp: new Date('2026-01-15T04:00:00.000Z'), // NY 2026-01-14 23:00
        method: 'GET',
        path: '/api/other',
        statusCode: 200,
        responseTime: 999,
        userAgent: 'Mozilla/5.0 Chrome',
        ip: '4.4.4.4',
        isBot: false
      },
      {
        timestamp: new Date('2026-01-16T06:00:00.000Z'), // NY 2026-01-16 01:00
        method: 'GET',
        path: '/api/other',
        statusCode: 200,
        responseTime: 999,
        userAgent: 'Mozilla/5.0 Chrome',
        ip: '5.5.5.5',
        isBot: false
      }
    ]);

    const result = await aggregateDay(targetDate);

    expect(result.date).toBe(targetDate);
    expect(result.totalRequests).toBe(4);
    expect(result.botRequests).toBe(1);
    expect(result.humanRequests).toBe(3);
    expect(result.uniqueIps).toBe(3); // 1.1.1.1, 2.2.2.2, 3.3.3.3
    expect(result.uniqueUsers).toBe(2); // userA, userB
    expect(result.avgResponseTime).toBeCloseTo((100 + 200 + 50 + 150) / 4);
    expect(result.errorCount).toBe(1); // 404 응답 1건

    // topPaths는 human 요청 기준 (봇 요청인 /api/boards curl 건은 제외 대상이지만
    // 같은 경로에 human 요청도 있으므로 카운트에는 human 것만 반영)
    expect(result.topPaths).toEqual([
      { path: '/api/boards', count: 2 },
      { path: '/api/users', count: 1 }
    ]);

    // DB에 upsert 되었는지 확인
    const stored = await TrafficDaily.findOne({ date: targetDate });
    expect(stored).not.toBeNull();
    expect(stored.totalRequests).toBe(4);
  });

  test('aggregateDay를 동일 날짜로 재실행하면 기존 문서를 갱신한다 (upsert)', async () => {
    await TrafficLog.create({
      timestamp: new Date('2026-01-15T18:00:00.000Z'),
      method: 'GET',
      path: '/api/boards',
      statusCode: 200,
      responseTime: 100,
      userAgent: 'Mozilla/5.0 Chrome',
      ip: '1.1.1.1',
      isBot: false
    });

    await aggregateDay(targetDate);
    let count = await TrafficDaily.countDocuments({ date: targetDate });
    expect(count).toBe(1);

    // 새 로그 추가 후 재집계
    await TrafficLog.create({
      timestamp: new Date('2026-01-15T19:00:00.000Z'),
      method: 'GET',
      path: '/api/boards',
      statusCode: 200,
      responseTime: 300,
      userAgent: 'Mozilla/5.0 Chrome',
      ip: '1.1.1.2',
      isBot: false
    });

    const updated = await aggregateDay(targetDate);
    count = await TrafficDaily.countDocuments({ date: targetDate });
    expect(count).toBe(1); // 중복 생성되지 않고 upsert
    expect(updated.totalRequests).toBe(2);
  });
});
