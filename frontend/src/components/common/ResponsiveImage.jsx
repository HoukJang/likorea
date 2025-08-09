import React from 'react';

const ResponsiveImage = ({ 
  imageName, 
  alt, 
  className = '', 
  loading = 'eager',
  fetchPriority = 'auto',
  sizes = '100vw',
  decoding = 'async'
}) => {
  // 이미지 경로 생성
  const getImagePath = (suffix, format) => `/images/${imageName}-${suffix}.${format}`;
  
  return (
    <picture>
      {/* WebP 형식 - 모바일 우선 */}
      <source
        type="image/webp"
        media="(max-width: 480px)"
        srcSet={getImagePath('mobile', 'webp')}
      />
      <source
        type="image/webp"
        media="(max-width: 768px)"
        srcSet={getImagePath('tablet', 'webp')}
      />
      <source
        type="image/webp"
        media="(max-width: 1200px)"
        srcSet={getImagePath('desktop', 'webp')}
      />
      <source
        type="image/webp"
        srcSet={getImagePath('full', 'webp')}
      />
      
      {/* PNG 폴백 - 모바일 우선 */}
      <source
        type="image/png"
        media="(max-width: 480px)"
        srcSet={getImagePath('mobile', 'png')}
      />
      <source
        type="image/png"
        media="(max-width: 768px)"
        srcSet={getImagePath('tablet', 'png')}
      />
      <source
        type="image/png"
        media="(max-width: 1200px)"
        srcSet={getImagePath('desktop', 'png')}
      />
      
      {/* 기본 이미지 */}
      <img
        src={getImagePath('desktop', 'png')}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        sizes={sizes}
        decoding={decoding}
      />
    </picture>
  );
};

export default ResponsiveImage;