const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function createTestMessages() {
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

    // 다른 사용자들 찾기
    const senders = await User.find({ 
      id: { $in: ['chulsu', 'younghee', 'minsu', 'sujin', 'testuser1'] } 
    });

    if (senders.length === 0) {
      console.error('❌ 메시지를 보낼 사용자를 찾을 수 없습니다.');
      return;
    }

    // 테스트 메시지 내용
    const messageContents = [
      {
        content: '안녕하세요 관리자님! 사이트가 정말 잘 만들어졌네요. 롱아일랜드 한인분들에게 큰 도움이 될 것 같습니다. 감사합니다!',
        sender: senders[0] || senders[0]
      },
      {
        content: '관리자님, 게시판에 스팸 글이 올라와서 신고합니다. Exit 45 지역 부동산 카테고리에 이상한 광고글이 있어요. 확인 부탁드립니다.',
        sender: senders[1] || senders[0]
      },
      {
        content: '혹시 사이트에 중고거래 사기 신고 기능을 추가할 수 있을까요? 최근에 사기를 당한 분들이 있어서 문의드립니다.',
        sender: senders[2] || senders[0]
      },
      {
        content: '안녕하세요! 롱아일랜드 한인 모임을 계획하고 있는데, 공지사항에 올려도 될까요? 많은 분들이 참여하셨으면 좋겠습니다.',
        sender: senders[3] || senders[0]
      },
      {
        content: '사이트 이용 중에 모바일에서 글쓰기 버튼이 잘 안 눌러지는 것 같아요. 아이폰 사파리에서 테스트했습니다. 확인 부탁드려요!',
        sender: senders[4] || senders[0]
      }
    ];

    // 메시지 생성
    console.log('📨 메시지 생성 중...');
    let createdCount = 0;

    for (let i = 0; i < messageContents.length; i++) {
      const messageData = messageContents[i];
      
      try {
        await Message.create({
          sender: messageData.sender._id,
          receiver: likorea._id,
          content: messageData.content,
          isRead: false,
          createdAt: new Date(Date.now() - (i * 60 * 60 * 1000)) // 1시간씩 차이나게
        });

        console.log(`✅ 메시지 ${i + 1} 생성 완료 (보낸 사람: ${messageData.sender.id})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ 메시지 ${i + 1} 생성 실패:`, error.message);
      }
    }

    console.log(`\n🎉 총 ${createdCount}개의 메시지가 생성되었습니다!`);
    console.log('📌 likorea 계정으로 로그인하여 쪽지함을 확인하세요.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    // 스크립트로 직접 실행된 경우에만 연결 종료
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('📡 데이터베이스 연결 종료');
    }
  }
}

// 스크립트로 직접 실행
if (require.main === module) {
  createTestMessages();
}

module.exports = createTestMessages;