const mongoose = require('mongoose');
const BoardPost = require('../models/BoardPost');
const Comment = require('../models/Comment');
require('dotenv').config();

/**
 * 기존 게시글에 lastActivityAt 필드를 추가하는 마이그레이션 스크립트
 * 
 * 로직:
 * 1. lastActivityAt이 없는 게시글을 찾음
 * 2. 각 게시글의 최신 댓글 시간을 확인
 * 3. 댓글이 있으면 최신 댓글 시간과 modifiedAt 중 더 최근 시간을 lastActivityAt으로 설정
 * 4. 댓글이 없으면 modifiedAt 또는 createdAt을 lastActivityAt으로 설정
 */

async function migrateLastActivityAt() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB에 연결되었습니다.');

    // lastActivityAt이 없는 게시글 찾기
    const postsWithoutActivity = await BoardPost.find({
      $or: [
        { lastActivityAt: { $exists: false } },
        { lastActivityAt: null }
      ]
    });

    console.log(`lastActivityAt이 없는 게시글 ${postsWithoutActivity.length}개를 찾았습니다.`);

    let updatedCount = 0;

    for (const post of postsWithoutActivity) {
      try {
        // 해당 게시글의 모든 댓글 찾기
        const comments = await Comment.find({ post: post._id }).sort({ createdAt: -1 }).limit(1);
        
        let lastActivity;
        
        if (comments.length > 0) {
          // 댓글이 있는 경우: 최신 댓글 시간과 게시글 수정 시간 중 더 최근 시간 사용
          const latestCommentTime = comments[0].createdAt;
          const postModifiedTime = post.modifiedAt || post.createdAt;
          
          lastActivity = latestCommentTime > postModifiedTime ? latestCommentTime : postModifiedTime;
        } else {
          // 댓글이 없는 경우: 게시글 수정 시간 또는 생성 시간 사용
          lastActivity = post.modifiedAt || post.createdAt;
        }

        // lastActivityAt 업데이트
        await BoardPost.updateOne(
          { _id: post._id },
          { $set: { lastActivityAt: lastActivity } }
        );

        updatedCount++;
        console.log(`게시글 ${post.postNumber} (${post.title}) - lastActivityAt 업데이트 완료`);
      } catch (error) {
        console.error(`게시글 ${post.postNumber} 업데이트 중 오류:`, error.message);
      }
    }

    console.log(`\n마이그레이션 완료: ${updatedCount}개의 게시글이 업데이트되었습니다.`);

  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateLastActivityAt();
}

module.exports = migrateLastActivityAt;