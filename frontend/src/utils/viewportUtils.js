/**
 * Viewport 설정 유틸리티
 * iOS 기기별 최적화된 viewport 설정
 */

export const setViewportForDevice = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);

  if (isIOS) {
    const screenWidth = window.screen.width;
    let viewportWidth = 'device-width';
    const initialScale = 1;

    // iPhone 모델별 최적화
    const viewportMap = {
      428: '428px', // iPhone 14 Pro Max, 13 Pro Max
      390: '390px', // iPhone 14, 13, 12
      375: '375px', // iPhone SE, 12 mini
      414: '414px' // iPhone Plus 모델들
    };

    viewportWidth = viewportMap[screenWidth] || viewportWidth;

    // viewport 메타 태그 업데이트
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        `width=${viewportWidth}, initial-scale=${initialScale}, maximum-scale=1, user-scalable=no, viewport-fit=cover`
      );
    }
  }
};

export const initViewportHandlers = () => {
  setViewportForDevice();

  let timeoutId;
  const debouncedSetViewport = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(setViewportForDevice, 100);
  };

  // 이벤트 리스너 등록
  window.addEventListener('orientationchange', debouncedSetViewport);
  window.addEventListener('resize', debouncedSetViewport);

  // cleanup 함수 반환
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('orientationchange', debouncedSetViewport);
    window.removeEventListener('resize', debouncedSetViewport);
  };
};