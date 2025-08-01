import { useState, useEffect, useCallback } from 'react';
import {
  login as loginApi,
  logout as logoutApi,
  isAuthenticated,
  isAdmin,
  verifyToken,
} from '../api/auth';

/**
 * 인증 상태를 관리하는 커스텀 훅
 */
export const useAuth = () => {
  // localStorage에서 초기 사용자 정보 가져오기
  const getInitialUser = () => {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const userAuthority = localStorage.getItem('userAuthority');
    
    if (userId && userEmail && userAuthority) {
      return {
        id: userId,
        email: userEmail,
        authority: parseInt(userAuthority, 10)
      };
    }
    return null;
  };

  const [user, setUser] = useState(getInitialUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const validateToken = useCallback(async () => {
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
        // 토큰이 유효하지 않으면 로그아웃
        await logout();
        return false;
      }
    } catch (error) {
      await logout();
      return false;
    }
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
   * 초기 인증 상태 확인 및 주기적 검증
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        // localStorage에 사용자 정보가 있으면 검증 생략
        if (user) {
          setLoading(false);
          return;
        }
        await validateToken();
      } catch (err) {
        setUser(null);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 30분마다 토큰 유효성 검증 (5분은 너무 짧음)
    const interval = setInterval(() => {
      validateToken().catch(() => {
        // 자동 검증 실패 시 조용히 처리
      });
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [validateToken]);

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
      // 호환성을 위해 localStorage에도 사용자 정보 저장 (임시)
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
   * 인증 상태 확인
   */
  const authenticated = useCallback(async () => {
    return await isAuthenticated();
  }, []);

  /**
   * 관리자 권한 확인
   */
  const admin = useCallback(async () => {
    return await isAdmin();
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    authenticated,
    admin,
  };
};
