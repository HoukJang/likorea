import { useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getCurrentUser, isAuthenticated, isAdmin } from '../api/auth';

/**
 * 인증 상태를 관리하는 커스텀 훅
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * 초기 인증 상태 확인
   */
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser && isAuthenticated()) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('인증 상태 확인 오류:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * 로그인 함수
   * @param {Object} credentials - 로그인 정보
   * @returns {Promise} 로그인 결과
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const data = await loginApi(credentials);
      
      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userAuthority', data.user.authority);
      
      // 사용자 상태 업데이트
      setUser({
        id: data.user.id,
        email: data.user.email,
        authority: data.user.authority,
      });

      // 로그인 이벤트 발생
      window.dispatchEvent(new Event('login'));
      
      return data;
    } catch (err) {
      const errorMessage = err.message || '로그인에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
      console.error('로그아웃 오류:', err);
    }
  }, []);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 인증 상태 확인
   */
  const authenticated = useCallback(() => {
    return isAuthenticated();
  }, []);

  /**
   * 관리자 권한 확인
   */
  const admin = useCallback(() => {
    return isAdmin();
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