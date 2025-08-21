const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function checkAllMessages() {
  try {
    // 데이터베이스 연결
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 데이터베이스에 연결 중...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ 데이터베이스 연결 완료');
    }

    // 모든 메시지 조회
    const allMessages = await Message.find({})
      .populate('sender', 'id email')
      .populate('receiver', 'id email')
      .sort({ createdAt: -1 });

    console.log(`\n📊 전체 메시지: ${allMessages.length}개`);
    
    allMessages.forEach((msg, index) => {
      console.log(`\n메시지 ${index + 1}:`);
      console.log(`- ID: ${msg._id}`);
      console.log(`- 보낸 사람: ${msg.sender ? `${msg.sender.id} (${msg.sender._id})` : 'Unknown'}`);
      console.log(`- 받는 사람: ${msg.receiver ? `${msg.receiver.id} (${msg.receiver._id})` : 'Unknown'}`);
      console.log(`- 내용: ${msg.content.substring(0, 50)}...`);
      console.log(`- 읽음 여부: ${msg.isRead ? '읽음' : '읽지 않음'}`);
      console.log(`- 생성일: ${msg.createdAt}`);
    });

    // 사용자 목록 확인
    console.log('\n👥 사용자 목록:');
    const users = await User.find({}, 'id email _id');
    users.forEach(user => {
      console.log(`- ${user.id}: ${user._id}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('\n📡 데이터베이스 연결 종료');
    }
  }
}

// 스크립트로 직접 실행
if (require.main === module) {
  checkAllMessages();
}

module.exports = checkAllMessages;