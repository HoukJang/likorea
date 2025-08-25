import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as loginApi,
  logout as logoutApi,
  verifyToken
} from '../api/auth';

// 전역 변수로 검증 중 상태를 관리하여 중복 호출 방지
let isVerifying = false;
let verificationPromise = null;

const AuthContext = createContext(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  /**
   * 로그아웃 함수
   */
  const logout = useCallback(() => {
    try {
      // 로컬 스토리지에서 사용자 정보 제거
      logoutApi();

      // 사용자 상태 초기화
      setUser(null);
      setError(null);

      // 로그아웃 이벤트 발생
      window.dispatchEvent(new Event('logout'));
    } catch (err) {
      // 로그아웃 오류 시 조용히 처리
    }
  }, []);

  /**
   * 토큰 유효성 검증
   */
  const validateToken = useCallback(async (shouldLogoutOnFail = false) => {
    // 이미 검증 중이면 기존 Promise 반환
    if (isVerifying && verificationPromise) {
      return verificationPromise;
    }

    isVerifying = true;
    verificationPromise = (async () => {
      try {
        const response = await verifyToken();
        if (response.valid && response.user) {
          // 토큰이 유효하면 사용자 정보 업데이트
          setUser(response.user);
          // localStorage도 업데이트
          localStorage.setItem('userId', response.user.id);
          localStorage.setItem('userEmail', response.user.email);
          localStorage.setItem('userAuthority', response.user.authority);
          return true;
        } else {
          // 토큰이 유효하지 않으면 사용자 정보만 초기화
          setUser(null);
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userAuthority');
          // 명시적으로 요청한 경우에만 로그아웃
          if (shouldLogoutOnFail) {
            logout();
          }
          return false;
        }
      } catch (error) {
        // 401 에러는 정상적인 미인증 상태이므로 조용히 처리
        if (error.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userAuthority');
        } else {
          // 다른 에러는 로그
          console.error('Token validation error:', error);
        }
        // 명시적으로 요청한 경우에만 로그아웃
        if (shouldLogoutOnFail) {
          logout();
        }
        return false;
      } finally {
        isVerifying = false;
        verificationPromise = null;
      }
    })();

    return verificationPromise;
  }, [logout]);

  /**
   * 전역 인증 이벤트 리스너 및 상태 동기화
   */
  useEffect(() => {
    // 로그인 이벤트 리스너 - 서버에서 최신 사용자 정보 가져오기
    const handleLoginEvent = async () => {
      try {
        setLoading(true);
        await validateToken(); // 서버에서 최신 상태 확인
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // 로그아웃 이벤트 리스너 - 모든 useAuth 인스턴스 동기화
    const handleLogoutEvent = () => {
      setUser(null);
      setError(null);
      setLoading(false);
    };

    // 이벤트 리스너 등록
    window.addEventListener('login', handleLoginEvent);
    window.addEventListener('logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('login', handleLoginEvent);
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, [validateToken]);

  /**
   * 초기 인증 상태 확인
   */
  useEffect(() => {
    // 이미 초기화되었으면 스킵
    if (hasInitialized) {
      return;
    }

    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        // 서버에서 토큰 유효성을 검증
        await validateToken();
      } catch (err) {
        // 에러는 validateToken에서 처리됨
        setUser(null);
        setError(null);
      } finally {
        setLoading(false);
        setHasInitialized(true);
      }
    };

    checkAuth();
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // 주기적 검증은 별도 useEffect로 분리
  useEffect(() => {
    // 30분마다 토큰 유효성 검증 (로그인된 경우에만)
    const interval = setInterval(() => {
      // 사용자가 로그인된 경우에만 검증
      if (user) {
        validateToken().catch(() => {
          // 자동 검증 실패 시 조용히 처리
        });
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, validateToken]);

  /**
   * 로그인 함수
   * @param {Object} credentials - 로그인 정보
   * @returns {Promise} 로그인 결과
   */
  const login = useCallback(async credentials => {
    try {
      setLoading(true);
      setError(null);

      const data = await loginApi(credentials);

      // 서버에서 httpOnly 쿠키로 토큰 저장됨
      // localStorage에 사용자 정보 저장 (UI 표시용)
      if (data.user) {
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userAuthority', data.user.authority);
      }

      // 서버에서 최신 사용자 정보를 다시 가져와서 상태 동기화
      await validateToken();

      // 로그인 이벤트 발생 (다른 useAuth 인스턴스들에게 알림)
      window.dispatchEvent(new Event('login'));

      return data;
    } catch (err) {
      const errorMessage = err.message || '로그인에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [validateToken]);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 인증 상태 확인 - 캐시된 상태 사용
   */
  const authenticated = useCallback(() => {
    // API 호출 대신 현재 user 상태를 사용
    return !!user;
  }, [user]);

  /**
   * 관리자 권한 확인 - 캐시된 상태 사용
   */
  const admin = useCallback(() => {
    // API 호출 대신 현재 user 상태를 사용
    return user?.authority === 5 || user?.authority === '5';
  }, [user]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    authenticated,
    admin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};