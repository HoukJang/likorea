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
    boardType: { type: String, required: true, enum: ['trade', 'general'] },
    title: { type: String, required: true },
    content: { type: String, required: true },
    // 글 작성자 (User 모델의 ObjectId, populate로 별명 활용 가능)
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewCount: { type: Number, default: 0 },
    // 댓글 배열
    comments: [commentSchema]
  },
  { timestamps: true }
);

// 추가: _id를 활용한 가상 id 필드 생성
boardPostSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
boardPostSchema.set('toJSON', { virtuals: true, versionKey: false });

// 새 게시글 생성 시 boardType에 따른 postNumber 자동 증가 처리
boardPostSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    let counter = await Counter.findById(this.boardType);
    if (!counter) {
      counter = await Counter.create({ _id: this.boardType, seq: 0 });
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