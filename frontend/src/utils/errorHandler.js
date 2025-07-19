// 에러 타입 정의
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP 상태 코드별 에러 타입 매핑
const STATUS_CODE_MAP = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTHENTICATION,
  403: ERROR_TYPES.AUTHORIZATION,
  404: ERROR_TYPES.NOT_FOUND,
  409: ERROR_TYPES.CONFLICT,
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.SERVER,
  503: ERROR_TYPES.SERVER,
  504: ERROR_TYPES.SERVER
};

// 에러 메시지 한글화
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
  [ERROR_TYPES.VALIDATION]: '입력 정보를 확인해주세요.',
  [ERROR_TYPES.AUTHENTICATION]: '로그인이 필요합니다.',
  [ERROR_TYPES.AUTHORIZATION]: '접근 권한이 없습니다.',
  [ERROR_TYPES.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [ERROR_TYPES.CONFLICT]: '이미 존재하는 정보입니다.',
  [ERROR_TYPES.SERVER]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ERROR_TYPES.UNKNOWN]: '알 수 없는 오류가 발생했습니다.'
};

// API 응답 에러 처리
export const handleApiError = (error) => {
  let errorType = ERROR_TYPES.UNKNOWN;
  let message = '알 수 없는 오류가 발생했습니다.';
  let statusCode = null;

  if (error.response) {
    // 서버 응답이 있는 경우
    statusCode = error.response.status;
    errorType = STATUS_CODE_MAP[statusCode] || ERROR_TYPES.UNKNOWN;
    
    // 서버에서 전달된 에러 메시지가 있으면 사용
    if (error.response.data && error.response.data.error) {
      message = error.response.data.error;
    } else {
      message = ERROR_MESSAGES[errorType];
    }
  } else if (error.request) {
    // 요청은 보냈지만 응답을 받지 못한 경우
    errorType = ERROR_TYPES.NETWORK;
    message = ERROR_MESSAGES[errorType];
  } else {
    // 요청 자체를 보내지 못한 경우
    errorType = ERROR_TYPES.NETWORK;
    message = ERROR_MESSAGES[errorType];
  }

  return {
    type: errorType,
    message,
    statusCode,
    originalError: error
  };
};

// 에러 로깅
export const logError = (error, context = '') => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    type: error.type || 'UNKNOWN',
    message: error.message,
    statusCode: error.statusCode,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', errorInfo);
    console.error('Original error:', error.originalError);
  }

  // 프로덕션에서는 에러 추적 서비스로 전송 가능
  // 예: Sentry, LogRocket 등
};

// 에러 처리 훅
export const useErrorHandler = () => {
  const handleError = (error, context = '') => {
    const processedError = handleApiError(error);
    logError(processedError, context);
    return processedError;
  };

  return { handleError };
};

// 토스트 메시지 표시 (선택적)
export const showErrorToast = (message, duration = 5000) => {
  // 토스트 라이브러리가 있다면 사용
  // 예: react-toastify, react-hot-toast 등
  console.error('Error Toast:', message);
  
  // 간단한 alert 대신 커스텀 토스트 구현 가능
  if (typeof window !== 'undefined') {
    // 임시로 alert 사용
    alert(message);
  }
};

// 에러 바운더리용 에러 정보
export const getErrorInfo = (error) => {
  return {
    message: error.message || '알 수 없는 오류가 발생했습니다.',
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
}; 