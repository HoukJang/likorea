import { useState, useCallback } from 'react';

/**
 * 로딩 상태 관리를 위한 커스텀 훅
 */
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [loadingStates, setLoadingStates] = useState({});

  /**
   * 로딩 상태 설정
   */
  const setLoadingState = useCallback((isLoading) => {
    setLoading(isLoading);
  }, []);

  /**
   * 특정 작업의 로딩 상태 설정
   */
  const setTaskLoading = useCallback((taskName, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [taskName]: isLoading
    }));
  }, []);

  /**
   * 특정 작업의 로딩 상태 확인
   */
  const isTaskLoading = useCallback((taskName) => {
    return loadingStates[taskName] || false;
  }, [loadingStates]);

  /**
   * 모든 작업의 로딩 상태 확인
   */
  const isAnyTaskLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state);
  }, [loadingStates]);

  /**
   * 비동기 작업을 로딩 상태와 함께 실행
   */
  const withLoading = useCallback(async (asyncFn, taskName = 'default') => {
    try {
      setTaskLoading(taskName, true);
      const result = await asyncFn();
      return result;
    } finally {
      setTaskLoading(taskName, false);
    }
  }, [setTaskLoading]);

  /**
   * 로딩 상태 초기화
   */
  const clearLoading = useCallback(() => {
    setLoading(false);
    setLoadingStates({});
  }, []);

  return {
    loading,
    loadingStates,
    setLoadingState,
    setTaskLoading,
    isTaskLoading,
    isAnyTaskLoading,
    withLoading,
    clearLoading
  };
}; 