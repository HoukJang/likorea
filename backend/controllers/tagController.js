const Tag = require('../models/Tag');
const { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} = require('../middleware/errorHandler');

// 모든 활성 태그 조회
exports.getAllTags = asyncHandler(async (req, res) => {
  const tags = await Tag.getAllActiveTags();
  
  // 카테고리별로 그룹화
  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {});
  
  res.json({
    success: true,
    tags: groupedTags
  });
});

// 특정 카테고리의 태그 조회
exports.getTagsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  
  if (!['type', 'region', 'category'].includes(category)) {
    throw new ValidationError('유효하지 않은 태그 카테고리입니다.');
  }
  
  const tags = await Tag.getTagsByCategory(category);
  
  res.json({
    success: true,
    category,
    tags
  });
});

// 관리자: 새 태그 추가
exports.addTag = asyncHandler(async (req, res) => {
  const { category, value, displayName, order, description } = req.body;
  
  // 필수 필드 검증
  if (!category || !value || !displayName) {
    throw new ValidationError('카테고리, 값, 표시명은 필수입니다.');
  }
  
  if (!['type', 'region', 'category'].includes(category)) {
    throw new ValidationError('유효하지 않은 태그 카테고리입니다.');
  }
  
  // 중복 체크
  const existingTag = await Tag.findOne({ category, value });
  if (existingTag) {
    throw new ValidationError('이미 존재하는 태그입니다.');
  }
  
  const tag = await Tag.create({
    category,
    value,
    displayName,
    order: order || 0,
    description: description || ''
  });
  
  res.status(201).json({
    success: true,
    message: '태그가 성공적으로 추가되었습니다.',
    tag
  });
});

// 관리자: 태그 수정
exports.updateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const { displayName, order, description, isActive } = req.body;
  
  const tag = await Tag.findById(tagId);
  if (!tag) {
    throw new NotFoundError('태그를 찾을 수 없습니다.');
  }
  
  if (displayName !== undefined) tag.displayName = displayName;
  if (order !== undefined) tag.order = order;
  if (description !== undefined) tag.description = description;
  if (isActive !== undefined) tag.isActive = isActive;
  
  await tag.save();
  
  res.json({
    success: true,
    message: '태그가 성공적으로 수정되었습니다.',
    tag
  });
});

// 관리자: 태그 삭제 (비활성화)
exports.deactivateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  
  const tag = await Tag.findById(tagId);
  if (!tag) {
    throw new NotFoundError('태그를 찾을 수 없습니다.');
  }
  
  tag.isActive = false;
  await tag.save();
  
  res.json({
    success: true,
    message: '태그가 성공적으로 비활성화되었습니다.'
  });
});

// 관리자: 태그 재활성화
exports.activateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  
  const tag = await Tag.findById(tagId);
  if (!tag) {
    throw new NotFoundError('태그를 찾을 수 없습니다.');
  }
  
  tag.isActive = true;
  await tag.save();
  
  res.json({
    success: true,
    message: '태그가 성공적으로 활성화되었습니다.',
    tag
  });
});

// 관리자: 태그 목록 조회 (활성/비활성 모두)
exports.getAllTagsForAdmin = asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  let query = {};
  if (category) {
    query.category = category;
  }
  
  const tags = await Tag.find(query).sort({ category: 1, order: 1, value: 1 });
  
  // 카테고리별로 그룹화
  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {});
  
  res.json({
    success: true,
    tags: groupedTags
  });
}); 