const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

/**
 * 메모리 내 MongoDB 서버 시작
 */
const connect = async () => {
  try {
    // MongoDB 메모리 서버 시작
    mongod = await MongoMemoryServer.create({
      binary: {
        downloadDir: './mongodb-binaries',
      },
    });
    
    const uri = mongod.getUri();
    
    // mongoose 8 설정
    mongoose.set('strictQuery', false);
    
    // 연결 옵션
    const mongooseOpts = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    };
    
    await mongoose.connect(uri, mongooseOpts);
    console.log('✅ 테스트용 메모리 MongoDB 연결 성공');
    
    return uri;
  } catch (error) {
    console.error('❌ 테스트 DB 연결 실패:', error);
    throw error;
  }
};

/**
 * 메모리 내 MongoDB 서버 종료
 */
const closeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    
    if (mongod) {
      await mongod.stop();
    }
    
    console.log('✅ 테스트 DB 종료 완료');
  } catch (error) {
    console.error('❌ 테스트 DB 종료 실패:', error);
  }
};

/**
 * 데이터베이스 정리
 */
const clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('✅ 테스트 DB 데이터 정리 완료');
  } catch (error) {
    console.error('❌ 테스트 DB 정리 실패:', error);
  }
};

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
};