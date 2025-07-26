const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    // 작성자: User 모델의 ObjectId
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'BoardPost', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
