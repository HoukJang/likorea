const mongoose = require('mongoose');

const scrapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoardPost',
      required: true
    }
  },
  { timestamps: true }
);

// 복합 인덱스 - 한 사용자가 같은 글을 중복 스크랩하지 못하도록
scrapSchema.index({ user: 1, post: 1 }, { unique: true });

// 사용자별 스크랩 조회를 위한 인덱스
scrapSchema.index({ user: 1, createdAt: -1 });

// 게시글별 스크랩 수 집계를 위한 인덱스
scrapSchema.index({ post: 1 });

module.exports = mongoose.model('Scrap', scrapSchema);