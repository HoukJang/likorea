/**
 * 안전한 데이터 처리 유틸리티 함수들
 */

/**
 * 객체에서 안전하게 값을 가져오는 함수
 * @param {Object} obj - 대상 객체
 * @param {string} path - 경로 (예: 'user.profile.name')
 * @param {*} defaultValue - 기본값
 * @returns {*} 찾은 값 또는 기본값
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
};

/**
 * 배열이 유효한지 확인하는 함수
 * @param {*} arr - 확인할 배열
 * @returns {boolean} 유효한 배열인지 여부
 */
export const isValidArray = (arr) => {
  return Array.isArray(arr) && arr.length > 0;
};

/**
 * 문자열이 유효한지 확인하는 함수
 * @param {*} str - 확인할 문자열
 * @returns {boolean} 유효한 문자열인지 여부
 */
export const isValidString = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

/**
 * 숫자가 유효한지 확인하는 함수
 * @param {*} num - 확인할 숫자
 * @returns {boolean} 유효한 숫자인지 여부
 */
export const isValidNumber = (num) => {
  return typeof num === 'number' && !isNaN(num) && isFinite(num);
};

/**
 * 객체가 유효한지 확인하는 함수
 * @param {*} obj - 확인할 객체
 * @returns {boolean} 유효한 객체인지 여부
 */
export const isValidObject = (obj) => {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
};

/**
 * 날짜를 안전하게 포맷팅하는 함수
 * @param {string|Date} date - 날짜
 * @param {string} locale - 로케일 (기본값: 'ko-KR')
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDate = (date, locale = 'ko-KR') => {
  if (!date) return '날짜 없음';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '잘못된 날짜';
    
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '날짜 오류';
  }
};

/**
 * 작성자 정보를 안전하게 추출하는 함수
 * @param {Object|string} author - 작성자 정보
 * @returns {string} 작성자 ID 또는 '익명'
 */
export const getAuthorId = (author) => {
  if (!author) return '익명';
  
  if (typeof author === 'object' && author !== null) {
    return author.id || author.email || '익명';
  }
  
  if (typeof author === 'string') {
    return author.trim() || '익명';
  }
  
  return '익명';
};

/**
 * 권한 레벨을 안전하게 가져오는 함수
 * @param {Object|string} author - 작성자 정보
 * @returns {number} 권한 레벨 (기본값: 0)
 */
export const getAuthority = (author) => {
  if (!author) return 0;
  
  if (typeof author === 'object' && author !== null) {
    return parseInt(author.authority || '0', 10);
  }
  
  return 0;
};

/**
 * 게시글 데이터를 안전하게 처리하는 함수
 * @param {Object} post - 게시글 데이터
 * @returns {Object} 처리된 게시글 데이터
 */
export const processPostData = (post) => {
  if (!isValidObject(post)) {
    return {
      id: '',
      title: '제목 없음',
      content: '내용 없음',
      author: { id: '익명' },
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      postNumber: 0,
      commentCount: 0,
      tags: {}
    };
  }
  
  return {
    id: post.id || post._id || '',
    title: post.title || '제목 없음',
    content: post.content || '내용 없음',
    author: post.author || { id: '익명' },
    createdAt: post.createdAt || new Date(),
    updatedAt: post.updatedAt || post.createdAt || new Date(),
    viewCount: isValidNumber(post.viewCount) ? post.viewCount : 0,
    postNumber: isValidNumber(post.postNumber) ? post.postNumber : 0,
    commentCount: isValidNumber(post.commentCount) ? post.commentCount : 0,
    tags: post.tags || {}
  };
};

/**
 * 댓글 데이터를 안전하게 처리하는 함수
 * @param {Object} comment - 댓글 데이터
 * @returns {Object} 처리된 댓글 데이터
 */
export const processCommentData = (comment) => {
  if (!isValidObject(comment)) {
    return {
      id: '',
      content: '내용 없음',
      author: '익명',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  return {
    id: comment.id || comment._id || '',
    content: comment.content || '내용 없음',
    author: getAuthorId(comment.author),
    createdAt: comment.createdAt || new Date(),
    updatedAt: comment.updatedAt || comment.createdAt || new Date()
  };
};

/**
 * 게시글 목록을 안전하게 처리하는 함수
 * @param {Array} posts - 게시글 목록
 * @returns {Array} 처리된 게시글 목록
 */
export const processPostsList = (posts) => {
  if (!isValidArray(posts)) {
    return [];
  }
  
  return posts.map(post => processPostData(post));
};

/**
 * 댓글 목록을 안전하게 처리하는 함수
 * @param {Array} comments - 댓글 목록
 * @returns {Array} 처리된 댓글 목록
 */
export const processCommentsList = (comments) => {
  if (!isValidArray(comments)) {
    return [];
  }
  
  return comments.map(comment => processCommentData(comment));
}; 