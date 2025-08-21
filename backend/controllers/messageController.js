const Message = require('../models/Message');
const User = require('../models/User');
const sanitizeHtml = require('sanitize-html');
const { safeParseInt } = require('../utils/security');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  AuthorizationError
} = require('../middleware/errorHandler');

// 메시지 보내기
exports.sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { receiverId, content } = req.body;

  // 입력 검증
  if (!receiverId || !content) {
    throw new ValidationError('수신자와 내용은 필수 항목입니다.');
  }

  // 수신자 존재 확인 (ID 문자열로 검색)
  const receiver = await User.findOne({ id: receiverId });
  if (!receiver) {
    throw new NotFoundError('수신자를 찾을 수 없습니다.');
  }

  // 자기 자신에게 메시지 전송 방지
  if (senderId.toString() === receiver._id.toString()) {
    throw new ValidationError('자기 자신에게는 메시지를 보낼 수 없습니다.');
  }

  // HTML 태그 제거 (XSS 방지)
  const cleanContent = sanitizeHtml(content, {
    allowedTags: ['br', 'p', 'strong', 'em'],
    allowedAttributes: {}
  }).trim();

  // 길이 검증
  if (cleanContent.length > 1000) {
    throw new ValidationError('내용은 1000자를 초과할 수 없습니다.');
  }

  // 메시지 생성
  const message = await Message.create({
    sender: senderId,
    receiver: receiver._id,
    content: cleanContent
  });

  // 생성된 메시지 populate
  await message.populate('sender', 'id');
  await message.populate('receiver', 'id');

  res.status(201).json({
    success: true,
    message: '메시지가 성공적으로 전송되었습니다.',
    data: message
  });
});

// 받은 메시지함 조회
exports.getInbox = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = safeParseInt(req.query.page, 1, 1);
  const limit = safeParseInt(req.query.limit, 20, 1, 100);
  const skip = (page - 1) * limit;

  // 쿼리 조건
  const query = {
    receiver: userId,
    deletedByReceiver: false
  };

  // 전체 메시지 수
  const total = await Message.countDocuments(query);

  // 메시지 조회
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'id');

  // 읽지 않은 메시지 수
  const unreadCount = await Message.getUnreadCount(userId);

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    }
  });
});

// 보낸 메시지함 조회
exports.getSentMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = safeParseInt(req.query.page, 1, 1);
  const limit = safeParseInt(req.query.limit, 20, 1, 100);
  const skip = (page - 1) * limit;

  // 쿼리 조건
  const query = {
    sender: userId,
    deletedBySender: false
  };

  // 전체 메시지 수
  const total = await Message.countDocuments(query);

  // 메시지 조회
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('receiver', 'id');

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// 특정 메시지 조회
exports.getMessage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  // 메시지 조회
  const message = await Message.findById(messageId)
    .populate('sender', 'id')
    .populate('receiver', 'id');

  if (!message) {
    throw new NotFoundError('메시지를 찾을 수 없습니다.');
  }

  // 권한 확인 (보낸 사람 또는 받은 사람만 볼 수 있음)
  const isSender = message.sender._id.toString() === userId.toString();
  const isReceiver = message.receiver._id.toString() === userId.toString();

  if (!isSender && !isReceiver) {
    throw new AuthorizationError('이 메시지를 볼 권한이 없습니다.');
  }

  // 삭제된 메시지 확인
  if ((isSender && message.deletedBySender) || (isReceiver && message.deletedByReceiver)) {
    throw new NotFoundError('삭제된 메시지입니다.');
  }

  // 받은 메시지인 경우 읽음 처리
  if (isReceiver && !message.isRead) {
    await message.markAsRead();
  }

  res.json({
    success: true,
    data: message
  });
});

// 메시지 읽음 처리
exports.markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  // 메시지 조회
  const message = await Message.findById(messageId);

  if (!message) {
    throw new NotFoundError('메시지를 찾을 수 없습니다.');
  }

  // 받은 사람만 읽음 처리 가능
  if (message.receiver.toString() !== userId.toString()) {
    throw new AuthorizationError('이 메시지를 읽음 처리할 권한이 없습니다.');
  }

  // 삭제된 메시지 확인
  if (message.deletedByReceiver) {
    throw new NotFoundError('삭제된 메시지입니다.');
  }

  // 읽음 처리
  await message.markAsRead();

  res.json({
    success: true,
    message: '메시지가 읽음 처리되었습니다.'
  });
});

// 메시지 삭제
exports.deleteMessage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  // 메시지 조회
  const message = await Message.findById(messageId);

  if (!message) {
    throw new NotFoundError('메시지를 찾을 수 없습니다.');
  }

  // 권한 확인
  const isSender = message.sender.toString() === userId.toString();
  const isReceiver = message.receiver.toString() === userId.toString();

  if (!isSender && !isReceiver) {
    throw new AuthorizationError('이 메시지를 삭제할 권한이 없습니다.');
  }

  // 논리적 삭제 처리
  if (isSender) {
    await message.deleteBySender();
  } else {
    await message.deleteByReceiver();
  }

  res.json({
    success: true,
    message: '메시지가 삭제되었습니다.'
  });
});

// 읽지 않은 메시지 수 조회
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await Message.getUnreadCount(userId);

  res.json({
    success: true,
    data: { count }
  });
});

// 대화형 메시지 조회 (특정 사용자와의 모든 메시지)
exports.getConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { otherUserId } = req.params;
  const page = safeParseInt(req.query.page, 1, 1);
  const limit = safeParseInt(req.query.limit, 20, 1, 100);
  const skip = (page - 1) * limit;

  // 상대방 존재 확인
  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  // 대화 메시지 조회
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId }
    ],
    $and: [
      { $or: [{ deletedBySender: false }, { sender: { $ne: userId } }] },
      { $or: [{ deletedByReceiver: false }, { receiver: { $ne: userId } }] }
    ]
  })
    .sort({ createdAt: 1 }) // 오래된 것부터 (대화 순서)
    .skip(skip)
    .limit(limit)
    .populate('sender', 'id')
    .populate('receiver', 'id');

  res.json({
    success: true,
    data: {
      messages,
      otherUser: {
        id: otherUser.id,
        _id: otherUser._id
      }
    }
  });
});