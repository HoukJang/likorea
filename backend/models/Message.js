const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // 보낸 사람
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    // 받는 사람
    receiver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    // 내용
    content: { 
      type: String, 
      required: true,
      maxlength: 1000
    },
    // 읽음 여부
    isRead: { 
      type: Boolean, 
      default: false 
    },
    // 읽은 시간
    readAt: { 
      type: Date 
    },
    // 삭제 상태 (논리적 삭제)
    deletedBySender: { 
      type: Boolean, 
      default: false 
    },
    deletedByReceiver: { 
      type: Boolean, 
      default: false 
    },
    // 답장 관련 (대화형 메시지용)
    parentMessage: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Message' 
    }
  },
  { 
    timestamps: true 
  }
);

// 가상 필드: id
messageSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// JSON 변환 설정
messageSchema.set('toJSON', { 
  virtuals: true, 
  versionKey: false,
  transform: function(doc, ret) {
    // 삭제된 메시지는 내용을 숨김
    if (ret.deletedBySender || ret.deletedByReceiver) {
      ret.content = '[삭제된 메시지]';
    }
    return ret;
  }
});

// 복합 인덱스 - 성능 최적화
messageSchema.index({ sender: 1, createdAt: -1 }); // 보낸 메시지 조회용
messageSchema.index({ receiver: 1, createdAt: -1 }); // 받은 메시지 조회용
messageSchema.index({ receiver: 1, isRead: 1 }); // 읽지 않은 메시지 카운트용

// 메시지 읽음 처리 메서드
messageSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// 보낸 사람이 삭제 처리
messageSchema.methods.deleteBySender = async function() {
  this.deletedBySender = true;
  await this.save();
  return this;
};

// 받은 사람이 삭제 처리
messageSchema.methods.deleteByReceiver = async function() {
  this.deletedByReceiver = true;
  await this.save();
  return this;
};

// 정적 메서드: 읽지 않은 메시지 수 조회
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false,
    deletedByReceiver: false
  });
};

// 정적 메서드: 대화형 메시지 조회
messageSchema.statics.getConversation = async function(user1Id, user2Id) {
  return this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ],
    $and: [
      { $or: [{ deletedBySender: false }, { sender: { $ne: user1Id } }] },
      { $or: [{ deletedByReceiver: false }, { receiver: { $ne: user1Id } }] }
    ]
  })
  .sort({ createdAt: 1 })
  .populate('sender', 'id')
  .populate('receiver', 'id');
};

module.exports = mongoose.model('Message', messageSchema);