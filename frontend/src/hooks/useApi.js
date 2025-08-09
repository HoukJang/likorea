import { useState, useCallback } from 'react';

/**
 * API 호출을 위한 공통 커스텀 훅
 * 로딩 상태, 에러 상태, 데이터 상태를 통합 관리
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * API 호출 함수
   * @param {Function} apiCall - API 호출 함수
   * @param {Object} options - 옵션
   * @returns {Promise} API 호출 결과
   */
  const execute = useCallback(async (apiCall, options = {}) => {
    const { onSuccess, onError, resetData = false } = options;

    try {
      setLoading(true);
      setError(null);

      if (resetData) {
        setData(null);
      }

      const result = await apiCall();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'API 호출 중 오류가 발생했습니다.';
      setError(errorMessage);

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  /**
   * 에러만 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    clearError
  };
};

/**
 * 특정 API 호출을 위한 커스텀 훅
 * @param {Function} apiCall - API 호출 함수
 * @param {Object} options - 옵션
 * @returns {Object} API 상태와 실행 함수
 */
export const useApiCall = (apiCall, options = {}) => {
  const api = useApi();

  const execute = useCallback(
    async (...args) => {
      return api.execute(() => apiCall(...args), options);
    },
    [apiCall, api, options]
  );

  return {
    ...api,
    execute
  };
};
