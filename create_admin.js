const mongoose = require('./backend/node_modules/mongoose');
const User = require('./backend/models/User');
require('./backend/node_modules/dotenv').config();

async function createAdminUser() {
  try {
    // MongoDB 연결
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://likorea62:WkdghdnrFhddkfzhfldk@likorea.6zxr8.mongodb.net/longisland?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('데이터베이스 연결 완료');

    // 기존 사용자 삭제 (Wkdghdnr)
    await User.deleteOne({ id: 'Wkdghdnr' });
    console.log('기존 Wkdghdnr 계정 삭제 완료');

    // 기존 likorea 계정도 삭제 (중복 방지)
    await User.deleteOne({ id: 'likorea' });
    console.log('기존 likorea 계정 삭제 완료');

    // 새 관리자 계정 생성
    const adminUser = await User.create({
      id: 'likorea',
      email: 'linepic@gmail.com',
      password: 'Wkdghdnr', // 평문 비밀번호 - User 모델에서 자동 해시화됨
      authority: 5, // 관리자 권한
    });

    console.log('관리자 계정 생성 완료:');
    console.log('- 사용자명:', adminUser.id);
    console.log('- 이메일:', adminUser.email);
    console.log('- 권한 레벨:', adminUser.authority);
    console.log('- 비밀번호: Wkdghdnr');

  } catch (error) {
    console.error('계정 생성 중 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('데이터베이스 연결 종료');
  }
}

createAdminUser();