const sanitizeHtml = require('sanitize-html');

/**
 * 입력 데이터 정제 함수
 * @param {Object} data - 정제할 데이터
 * @returns {Object} 정제된 데이터
 */
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return sanitizeHtml(data, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape'
    }).trim();
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효성 여부
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 강도 검증
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} 검증 결과
 */
const validatePassword = (password) => {
  const minLength = 6;
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`비밀번호는 최소 ${minLength}자 이상이어야 합니다.`);
  }
  
  if (!hasLowerCase) {
    errors.push('비밀번호는 소문자를 포함해야 합니다.');
  }
  
  if (!hasNumbers) {
    errors.push('비밀번호는 숫자를 포함해야 합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 사용자 입력 검증 미들웨어
 */
const validateUserInput = (req, res, next) => {
  try {
    const { id, email, password } = req.body;
    
    // ID 검증
    if (id && (typeof id !== 'string' || id.length < 3 || id.length > 20)) {
      return res.status(400).json({
        error: 'ID는 3-20자 사이여야 합니다.'
      });
    }
    
    // 이메일 검증
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        error: '유효한 이메일 주소를 입력해주세요.'
      });
    }
    
    // 비밀번호 검증
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: '비밀번호가 요구사항을 충족하지 않습니다.',
          details: passwordValidation.errors
        });
      }
    }
    
    // 데이터 정제
    req.body = sanitizeData(req.body);
    
    next();
  } catch (error) {
    return res.status(400).json({
      error: '입력 데이터 검증 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시글 입력 검증 미들웨어
 */
const validatePostInput = (req, res, next) => {
  try {
    const { title, content } = req.body;
    
    // 제목 검증
    if (!title || typeof title !== 'string' || title.trim().length < 1 || title.length > 100) {
      return res.status(400).json({
        error: '제목은 1-100자 사이여야 합니다.'
      });
    }
    
    // 내용 검증
    if (!content || typeof content !== 'string' || content.trim().length < 1 || content.length > 10000) {
      return res.status(400).json({
        error: '내용은 1-10000자 사이여야 합니다.'
      });
    }
    
    // 데이터 정제
    req.body = sanitizeData(req.body);
    
    next();
  } catch (error) {
    return res.status(400).json({
      error: '게시글 입력 데이터 검증 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 댓글 입력 검증 미들웨어
 */
const validateCommentInput = (req, res, next) => {
  try {
    const { content } = req.body;
    
    // 내용 검증
    if (!content || typeof content !== 'string' || content.trim().length < 1 || content.length > 1000) {
      return res.status(400).json({
        error: '댓글 내용은 1-1000자 사이여야 합니다.'
      });
    }
    
    // 데이터 정제
    req.body = sanitizeData(req.body);
    
    next();
  } catch (error) {
    return res.status(400).json({
      error: '댓글 입력 데이터 검증 중 오류가 발생했습니다.'
    });
  }
};

/**
 * URL 파라미터 검증 미들웨어
 */
const validateParams = (req, res, next) => {
  try {
    const { boardType, postId, commentId } = req.params;
    
    // boardType 검증
    if (boardType && !/^[a-zA-Z0-9_-]+$/.test(boardType)) {
      return res.status(400).json({
        error: '게시판 타입이 유효하지 않습니다.'
      });
    }
    
    // postId 검증 (MongoDB ObjectId 형식)
    if (postId && !/^[a-fA-F0-9]{24}$/.test(postId)) {
      return res.status(400).json({
        error: '게시글 ID가 유효하지 않습니다.'
      });
    }
    
    // commentId 검증 (MongoDB ObjectId 형식)
    if (commentId && !/^[a-fA-F0-9]{24}$/.test(commentId)) {
      return res.status(400).json({
        error: '댓글 ID가 유효하지 않습니다.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'URL 파라미터 검증 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  sanitizeData,
  validateEmail,
  validatePassword,
  validateUserInput,
  validatePostInput,
  validateCommentInput,
  validateParams
}; 