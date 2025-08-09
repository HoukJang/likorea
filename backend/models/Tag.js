const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    // 태그 카테고리 (예: 'type', 'region', 'category' 등)
    category: {
      type: String,
      required: true,
      enum: ['type', 'region', 'category'] // 추후 확장 가능
    },
    // 태그 값 (예: '사고팔고', '부동산', '13', '14' 등)
    value: {
      type: String,
      required: true
    },
    // 태그 표시명 (예: '사고팔고', '부동산', '13세', '14세' 등)
    displayName: {
      type: String,
      required: true
    },
    // 태그 순서 (정렬용)
    order: {
      type: Number,
      default: 0
    },
    // 활성화 여부
    isActive: {
      type: Boolean,
      default: true
    },
    // 태그 설명
    description: {
      type: String
    },
    // 상위 카테고리 (하위 카테고리용)
    parentCategory: {
      type: String
    }
  },
  { timestamps: true }
);

// 복합 인덱스: 카테고리와 값의 조합은 유일해야 함
tagSchema.index({ category: 1, value: 1 }, { unique: true });

// 카테고리별 태그 조회 메서드
tagSchema.statics.getTagsByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ order: 1, value: 1 });
};

// 모든 활성 태그 조회 메서드
tagSchema.statics.getAllActiveTags = function () {
  return this.find({ isActive: true }).sort({ category: 1, order: 1, value: 1 });
};

// 상위 카테고리별 하위 카테고리 조회 메서드
tagSchema.statics.getSubCategoriesByParent = function (parentCategory) {
  return this.find({
    category: 'category',
    parentCategory: parentCategory,
    isActive: true
  }).sort({ order: 1, value: 1 });
};

module.exports = mongoose.model('Tag', tagSchema);
