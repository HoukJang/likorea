const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function checkMessages() {
  try {
    // 데이터베이스 연결
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 데이터베이스에 연결 중...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ 데이터베이스 연결 완료');
    }

    // likorea 사용자 찾기
    const likorea = await User.findOne({ id: 'likorea' });
    if (!likorea) {
      console.error('❌ likorea 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log('\n👤 likorea 사용자 정보:');
    console.log(`- ID: ${likorea.id}`);
    console.log(`- MongoDB _id: ${likorea._id}`);
    console.log(`- Email: ${likorea.email}`);

    // likorea가 받은 메시지 조회
    const receivedMessages = await Message.find({ 
      receiver: likorea._id,
      deletedByReceiver: false 
    })
    .populate('sender', 'id email')
    .sort({ createdAt: -1 });

    console.log(`\n📨 받은 메시지: ${receivedMessages.length}개`);
    
    if (receivedMessages.length > 0) {
      receivedMessages.forEach((msg, index) => {
        console.log(`\n메시지 ${index + 1}:`);
        console.log(`- ID: ${msg._id}`);
        console.log(`- 보낸 사람: ${msg.sender ? msg.sender.id : 'Unknown'}`);
        console.log(`- 내용: ${msg.content.substring(0, 50)}...`);
        console.log(`- 읽음 여부: ${msg.isRead ? '읽음' : '읽지 않음'}`);
        console.log(`- 생성일: ${msg.createdAt}`);
      });
    }

    // likorea가 보낸 메시지 조회
    const sentMessages = await Message.find({ 
      sender: likorea._id,
      deletedBySender: false 
    })
    .populate('receiver', 'id email')
    .sort({ createdAt: -1 });

    console.log(`\n📤 보낸 메시지: ${sentMessages.length}개`);

    // 전체 메시지 수 확인
    const totalMessages = await Message.countDocuments();
    console.log(`\n📊 전체 메시지 수: ${totalMessages}개`);

    // 읽지 않은 메시지 수
    const unreadCount = await Message.countDocuments({
      receiver: likorea._id,
      isRead: false,
      deletedByReceiver: false
    });
    console.log(`\n🔔 읽지 않은 메시지: ${unreadCount}개`);

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
  checkMessages();
}

module.exports = checkMessages;