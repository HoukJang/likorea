const express = require('express');
const {
  getAllTags,
  getTagsByCategory,
  getSubCategoriesByParent,
  addTag,
  updateTag,
  deactivateTag,
  activateTag,
  getAllTagsForAdmin
} = require('../controllers/tagController');
const { requireAdmin } = require('../middleware/auth');
const { cache } = require('../middleware/cache');

const router = express.Router();

// 공개 API (모든 사용자 접근 가능)
router.get('/', cache(), getAllTags);
router.get('/category/:category', cache(), getTagsByCategory);
router.get('/subcategories/:parentCategory', cache(), getSubCategoriesByParent);

// 관리자 전용 API
router.get('/admin', requireAdmin, getAllTagsForAdmin);
router.post('/', requireAdmin, addTag);
router.put('/:tagId', requireAdmin, updateTag);
router.delete('/:tagId', requireAdmin, deactivateTag);
router.patch('/:tagId/activate', requireAdmin, activateTag);

module.exports = router;
