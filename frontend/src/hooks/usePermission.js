import { useCallback } from 'react';
import { getAuthority } from '../utils/dataUtils';

/**
 * 권한 확인을 위한 커스텀 훅
 */
export const usePermission = () => {
  /**
   * 현재 사용자의 권한 레벨 가져오기
   * @returns {number} 권한 레벨 (기본값: 0)
   */
  const getCurrentAuthority = useCallback(() => {
    const authority = localStorage.getItem('userAuthority');
    return parseInt(authority || '0', 10);
  }, []);

  /**
   * 현재 사용자 ID 가져오기
   * @returns {string|null} 사용자 ID 또는 null
   */
  const getCurrentUserId = useCallback(() => {
    return localStorage.getItem('userId');
  }, []);

  /**
   * 로그인 상태 확인
   * @returns {boolean} 로그인 여부
   */
  const isAuthenticated = useCallback(() => {
    // authToken 또는 userId가 있으면 인증된 것으로 판단
    return !!(localStorage.getItem('authToken') || localStorage.getItem('userId'));
  }, []);

  /**
   * 관리자 권한 확인
   * @returns {boolean} 관리자 여부
   */
  const isAdmin = useCallback(() => {
    const authority = getCurrentAuthority();
    return authority >= 5; // 권한 레벨 5 이상이 관리자
  }, [getCurrentAuthority]);

  /**
   * 게시글/댓글 수정/삭제 권한 확인
   * @param {Object} target - 대상 객체 (게시글 또는 댓글)
   * @returns {boolean} 수정/삭제 권한 여부
   */
  const canModify = useCallback(
    target => {
      console.log('canModify 호출됨:', {
        isAuth: isAuthenticated(),
        hasTarget: !!target,
        token: localStorage.getItem('authToken')
      });
      
      if (!isAuthenticated() || !target) return false;

      const currentUserId = getCurrentUserId();
      const currentAuthority = getCurrentAuthority();

      // 작성자 정보 추출 - 댓글과 게시글의 author 구조가 다름
      let targetAuthorId;
      let targetAuthority = 0;

      if (target.author) {
        if (typeof target.author === 'object') {
          // 게시글이나 댓글의 경우: author가 객체 {id: "likorea", authority: 5}
          targetAuthorId = target.author.id || target.author._id;
          targetAuthority = parseInt(target.author.authority || '0', 10);
        } else {
          // 구버전 댓글의 경우: author가 문자열 "likorea"
          targetAuthorId = target.author;
          // 권한 정보가 없는 경우 기본값 사용
          targetAuthority = 0;
        }
      } else {
        return false;
      }

      console.log('권한 체크:', {
        현재사용자: currentUserId,
        현재권한: currentAuthority,
        작성자: targetAuthorId,
        작성자권한: targetAuthority,
        본인여부: targetAuthorId === currentUserId,
        권한비교: currentAuthority > targetAuthority
      });

      // 1. 본인 작성물인 경우 항상 수정/삭제 가능
      if (targetAuthorId === currentUserId) {
        return true;
      }

      // 2. 현재 사용자의 권한이 작성자보다 높은 경우 수정/삭제 가능
      return currentAuthority > targetAuthority;
    },
    [isAuthenticated, getCurrentUserId, getCurrentAuthority]
  );

  /**
   * 특정 권한 레벨 이상인지 확인
   * @param {number} requiredAuthority - 필요한 권한 레벨
   * @returns {boolean} 권한 충족 여부
   */
  const hasAuthority = useCallback(
    requiredAuthority => {
      const currentAuthority = getCurrentAuthority();
      return currentAuthority >= requiredAuthority;
    },
    [getCurrentAuthority]
  );

  /**
   * 사용자 권한 비교
   * @param {Object} user1 - 첫 번째 사용자
   * @param {Object} user2 - 두 번째 사용자
   * @returns {number} 비교 결과 (-1: user1이 낮음, 0: 같음, 1: user1이 높음)
   */
  const compareAuthority = useCallback((user1, user2) => {
    const authority1 = getAuthority(user1);
    const authority2 = getAuthority(user2);

    if (authority1 < authority2) return -1;
    if (authority1 > authority2) return 1;
    return 0;
  }, []);

  return {
    getCurrentAuthority,
    getCurrentUserId,
    isAuthenticated,
    isAdmin,
    canModify,
    hasAuthority,
    compareAuthority,
  };
};
