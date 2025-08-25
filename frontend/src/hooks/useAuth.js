import { useAuthContext } from '../contexts/AuthContext';

/**
 * 인증 상태를 관리하는 커스텀 훅
 * AuthContext를 사용하여 중앙 집중식 상태 관리
 */
export const useAuth = () => {
  // AuthContext에서 모든 인증 관련 상태와 함수를 가져옴
  return useAuthContext();
};