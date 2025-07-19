import { useState, useCallback } from 'react';

/**
 * 로딩 상태를 관리하는 커스텀 훅
 * 여러 로딩 상태를 동시에 관리 가능
 */
export const useLoading = (initialStates = {}) => {
  const [loadingStates, setLoadingStates] = useState(initialStates);

  /**
   * 특정 키의 로딩 상태 설정
   * @param {string} key - 로딩 상태 키
   * @param {boolean} isLoading - 로딩 상태
   */
  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  /**
   * 여러 키의 로딩 상태를 한번에 설정
   * @param {Object} states - 로딩 상태 객체
   */
  const setMultipleLoading = useCallback((states) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states,
    }));
  }, []);

  /**
   * 특정 키의 로딩 상태 확인
   * @param {string} key - 로딩 상태 키
   * @returns {boolean} 로딩 상태
   */
  const isLoading = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  /**
   * 전체 로딩 상태 확인
   * @returns {boolean} 전체 로딩 상태
   */
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  /**
   * 로딩 상태 초기화
   * @param {string|Array} keys - 초기화할 키들 (생략 시 전체 초기화)
   */
  const resetLoading = useCallback((keys = null) => {
    if (keys === null) {
      setLoadingStates({});
    } else {
      const keysToReset = Array.isArray(keys) ? keys : [keys];
      setLoadingStates(prev => {
        const newStates = { ...prev };
        keysToReset.forEach(key => {
          delete newStates[key];
        });
        return newStates;
      });
    }
  }, []);

  /**
   * 로딩 상태를 자동으로 관리하는 함수 래퍼
   * @param {string} key - 로딩 상태 키
   * @param {Function} asyncFunction - 비동기 함수
   * @returns {Function} 래핑된 함수
   */
  const withLoading = useCallback((key, asyncFunction) => {
    return async (...args) => {
      try {
        setLoading(key, true);
        const result = await asyncFunction(...args);
        return result;
      } finally {
        setLoading(key, false);
      }
    };
  }, [setLoading]);

  return {
    loadingStates,
    setLoading,
    setMultipleLoading,
    isLoading,
    isAnyLoading,
    resetLoading,
    withLoading,
  };
}; 