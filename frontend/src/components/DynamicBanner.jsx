import React, { useState, useEffect } from 'react';
import { getActiveBanner } from '../api/banner';
import '../styles/DynamicBanner.css';

const DynamicBanner = () => {
  const [banner, setBanner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const response = await getActiveBanner();
      if (response.data.banner) {
        // 로컬 스토리지에서 이미 닫은 배너인지 확인
        const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
        if (!dismissedBanners.includes(response.data.banner.id)) {
          setBanner(response.data.banner);
        }
      }
    } catch (error) {
      console.error('배너 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    if (banner && banner.dismissible) {
      // 로컬 스토리지에 닫은 배너 ID 저장
      const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
      dismissedBanners.push(banner.id);
      localStorage.setItem('dismissedBanners', JSON.stringify(dismissedBanners));
      
      // 애니메이션 후 제거
      setIsDismissed(true);
      setTimeout(() => setBanner(null), 300);
    }
  };

  // 로딩 중이거나 배너가 없으면 null 반환
  if (isLoading || !banner || isDismissed) {
    return null;
  }

  const getTypeClass = () => {
    switch (banner.type) {
      case 'warning':
        return 'banner-warning';
      case 'success':
        return 'banner-success';
      case 'event':
        return 'banner-event';
      default:
        return 'banner-info';
    }
  };

  return (
    <div className={`dynamic-banner ${getTypeClass()} ${isDismissed ? 'banner-exit' : ''}`}>
      <div className="banner-inner">
        <div className="banner-content">
          <span className="banner-icon" role="img" aria-label="banner icon">
            {banner.icon}
          </span>
          <span className="banner-message">{banner.message}</span>
          {banner.link && banner.link.url && (
            <a 
              href={banner.link.url} 
              className="banner-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {banner.link.text || '자세히 보기'}
            </a>
          )}
        </div>
        {banner.dismissible && (
          <button 
            className="banner-close"
            onClick={handleDismiss}
            aria-label="배너 닫기"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(DynamicBanner);