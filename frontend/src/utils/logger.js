/**
 * 로깅 유틸리티 - Single Responsibility Principle
 * 로깅 관련 기능만 담당
 */

// 환경별 로그 레벨 설정
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 개발 환경에서만 로그를 출력하는 로거
 */
class Logger {
  constructor() {
    this.isEnabled = isDevelopment;
  }

  /**
   * 에러 로그
   * @param {string} message - 로그 메시지
   * @param {any} data - 추가 데이터
   */
  error(message, data = null) {
    if (this.isEnabled) {
      console.error(`[ERROR] ${message}`, data || '');
    }
  }

  /**
   * 경고 로그
   * @param {string} message - 로그 메시지
   * @param {any} data - 추가 데이터
   */
  warn(message, data = null) {
    if (this.isEnabled) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  /**
   * 정보 로그
   * @param {string} message - 로그 메시지
   * @param {any} data - 추가 데이터
   */
  info(message, data = null) {
    if (this.isEnabled) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  /**
   * 디버그 로그
   * @param {string} message - 로그 메시지
   * @param {any} data - 추가 데이터
   */
  debug(message, data = null) {
    if (this.isEnabled) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  /**
   * API 호출 로그
   * @param {string} method - HTTP 메서드
   * @param {string} url - API URL
   * @param {any} data - 요청/응답 데이터
   */
  api(method, url, data = null) {
    if (this.isEnabled) {
      console.log(`[API] ${method.toUpperCase()} ${url}`, data || '');
    }
  }

  /**
   * 사용자 액션 로그
   * @param {string} action - 액션명
   * @param {any} data - 액션 데이터
   */
  userAction(action, data = null) {
    if (this.isEnabled) {
      console.log(`[USER] ${action}`, data || '');
    }
  }
}

// 싱글톤 인스턴스 생성
const logger = new Logger();

export default logger;

// 편의 메서드들 (기존 console.log를 대체)
export const logError = (message, data) => logger.error(message, data);
export const logWarn = (message, data) => logger.warn(message, data);
export const logInfo = (message, data) => logger.info(message, data);
export const logDebug = (message, data) => logger.debug(message, data);
export const logApi = (method, url, data) => logger.api(method, url, data);
export const logUserAction = (action, data) => logger.userAction(action, data);
