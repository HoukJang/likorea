const mongoose = require('mongoose');
const Counter = require('./Counter');

// 댓글 스키마 (임베디드 도큐먼트)
const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    // 댓글 작성자 (User 모델의 ObjectId, populate로 별명 활용 가능)
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const boardPostSchema = new mongoose.Schema(
  {
    postNumber: { type: Number, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    // 글 작성자 (User 모델의 ObjectId, populate로 별명 활용 가능)
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewCount: { type: Number, default: 0 },
    // 태그 시스템 (확장 가능한 구조)
    tags: {
      type: { type: String, required: true }, // 필수 태그
      region: { type: String, required: true }, // 필수 태그
      subcategory: { type: String }, // 소주제 (선택사항)
      // 추후 추가될 수 있는 태그들
      // category: String,
      // location: String,
      // price: String,
      // 등등...
    },
    // 댓글 배열
    comments: [commentSchema],
    // 최근 업데이트 시간 (댓글 추가/수정 시 업데이트)
    modifiedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// 추가: _id를 활용한 가상 id 필드 생성
boardPostSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
boardPostSchema.set('toJSON', { virtuals: true, versionKey: false });

// 새 게시글 생성 시 postNumber 자동 증가 처리
boardPostSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    let counter = await Counter.findById('board');
    if (!counter) {
      counter = await Counter.create({ _id: 'board', seq: 0 });
    }
    counter.seq += 1;
    await counter.save();
    this.postNumber = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('BoardPost', boardPostSchema);