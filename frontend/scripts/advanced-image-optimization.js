/**
 * 진보된 이미지 최적화 스크립트
 * AVIF 지원, 적응형 이미지, Lazy Loading, 압축 개선
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AdvancedImageOptimizer {
  constructor() {
    this.inputDir = path.join(__dirname, '../public/images');
    this.outputDir = path.join(__dirname, '../public/images/optimized');
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      filesProcessed: 0
    };
  }
  
  async optimize() {
    console.log('🖼️  진보된 이미지 최적화 시작...');
    
    // 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const images = this.getImageFiles();
    
    for (const imagePath of images) {
      await this.processImage(imagePath);
    }
    
    this.generateOptimizationReport();
    this.generateResponsiveImageComponent();
    this.generateLazyLoadingScript();
    
    console.log('✅ 이미지 최적화 완료!');
  }
  
  async processImage(imagePath) {
    const fileName = path.basename(imagePath, path.extname(imagePath));
    const stats = fs.statSync(imagePath);
    this.stats.originalSize += stats.size;
    this.stats.filesProcessed++;
    
    console.log(`📸 처리 중: ${fileName}`);
    
    // 다양한 크기 생성 (반응형 이미지)
    const sizes = this.getSizesForImage(fileName);
    
    for (const size of sizes) {
      // AVIF 형식 (최신 브라우저용)
      await this.generateAVIF(imagePath, fileName, size);
      
      // WebP 형식 (널리 지원)
      await this.generateWebP(imagePath, fileName, size);
      
      // JPEG/PNG 형식 (Fallback)
      await this.generateFallback(imagePath, fileName, size);
    }
  }
  
  async generateAVIF(imagePath, fileName, size) {
    try {
      const outputPath = path.join(this.outputDir, `${fileName}-${size.suffix}.avif`);
      
      const image = sharp(imagePath);
      
      if (size.width && size.height) {
        image.resize(size.width, size.height, { fit: 'cover', position: 'center' });
      } else if (size.width) {
        image.resize(size.width, null, { withoutEnlargement: true });
      }
      
      await image
        .avif({ 
          quality: size.quality || 75,
          effort: 6 // 최고 압축 효율
        })
        .toFile(outputPath);
        
      const stats = fs.statSync(outputPath);
      this.stats.optimizedSize += stats.size;
      
    } catch (error) {
      console.warn(`⚠️  AVIF 생성 실패 (${fileName}-${size.suffix}):`, error.message);
    }
  }
  
  async generateWebP(imagePath, fileName, size) {
    const outputPath = path.join(this.outputDir, `${fileName}-${size.suffix}.webp`);
    
    const image = sharp(imagePath);
    
    if (size.width && size.height) {
      image.resize(size.width, size.height, { fit: 'cover', position: 'center' });
    } else if (size.width) {
      image.resize(size.width, null, { withoutEnlargement: true });
    }
    
    await image
      .webp({ 
        quality: size.quality || 80,
        effort: 6
      })
      .toFile(outputPath);
      
    const stats = fs.statSync(outputPath);
    this.stats.optimizedSize += stats.size;
  }
  
  async generateFallback(imagePath, fileName, size) {
    const ext = path.extname(imagePath).toLowerCase();
    const outputExt = ext === '.png' ? 'png' : 'jpg';
    const outputPath = path.join(this.outputDir, `${fileName}-${size.suffix}.${outputExt}`);
    
    const image = sharp(imagePath);
    
    if (size.width && size.height) {
      image.resize(size.width, size.height, { fit: 'cover', position: 'center' });
    } else if (size.width) {
      image.resize(size.width, null, { withoutEnlargement: true });
    }
    
    if (outputExt === 'png') {
      await image
        .png({ 
          quality: size.quality || 85,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(outputPath);
    } else {
      await image
        .jpeg({ 
          quality: size.quality || 82,
          progressive: true,
          mozjpeg: true
        })
        .toFile(outputPath);
    }
    
    const stats = fs.statSync(outputPath);
    this.stats.optimizedSize += stats.size;
  }
  
  getSizesForImage(fileName) {
    // 배너 이미지
    if (fileName.includes('banner')) {
      return [
        { suffix: 'mobile', width: 480, quality: 85 },
        { suffix: 'tablet', width: 768, quality: 85 },
        { suffix: 'desktop', width: 1200, quality: 80 },
        { suffix: 'xl', width: 1920, quality: 75 }
      ];
    }
    
    // 일반 이미지
    return [
      { suffix: 'sm', width: 320, quality: 85 },
      { suffix: 'md', width: 640, quality: 82 },
      { suffix: 'lg', width: 1024, quality: 80 },
      { suffix: 'xl', width: 1920, quality: 75 }
    ];
  }
  
  generateResponsiveImageComponent() {
    const componentCode = `
import React, { useState, useRef, useEffect } from 'react';

/**
 * 최적화된 반응형 이미지 컴포넌트
 * AVIF -> WebP -> JPEG/PNG 순으로 지원
 * Lazy loading과 인터섹션 옵저버 내장
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  placeholder = 'blur',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const [currentSrc, setCurrentSrc] = useState('');

  // 이미지 소스 생성 함수
  const generateSrcSet = (baseSrc, format) => {
    const baseName = baseSrc.replace(/\\.[^/.]+$/, '');
    const suffixes = ['mobile', 'tablet', 'desktop', 'xl'];
    const widths = [480, 768, 1200, 1920];
    
    return suffixes
      .map((suffix, index) => \`\${baseName}-\${suffix}.\${format} \${widths[index]}w\`)
      .join(', ');
  };

  // 인터섹션 옵저버 설정
  useEffect(() => {
    if (priority) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // 이미지 로드 핸들러
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    // Fallback 이미지로 변경
    if (!currentSrc.includes('.jpg')) {
      const fallbackSrc = src.replace(/\\.[^/.]+$/, '.jpg');
      setCurrentSrc(fallbackSrc);
    }
  };

  // 이미지가 뷰에 들어왔을 때만 소스 설정
  useEffect(() => {
    if (isInView && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [isInView, src, currentSrc]);

  // 스켈레톤 로더
  const SkeletonLoader = () => (
    <div 
      className={\`skeleton-loader \${className}\`}
      style={{
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'loading 1.5s infinite',
        aspectRatio: '16/9'
      }}
    />
  );

  // 뷰에 들어오지 않았으면 플레이스홀더 표시
  if (!isInView) {
    return <div ref={imgRef} className={className}><SkeletonLoader /></div>;
  }

  return (
    <div ref={imgRef} className={\`image-container \${className}\`}>
      {!isLoaded && !hasError && <SkeletonLoader />}
      
      <picture>
        {/* AVIF 지원 브라우저용 */}
        <source
          srcSet={generateSrcSet(currentSrc, 'avif')}
          sizes={sizes}
          type="image/avif"
        />
        
        {/* WebP 지원 브라우저용 */}
        <source
          srcSet={generateSrcSet(currentSrc, 'webp')}
          sizes={sizes}
          type="image/webp"
        />
        
        {/* 기본 형식 (JPEG/PNG) */}
        <img
          src={currentSrc}
          srcSet={generateSrcSet(currentSrc, 'jpg')}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            width: '100%',
            height: 'auto'
          }}
          {...props}
        />
      </picture>
      
      {hasError && (
        <div className="image-error">
          이미지를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

// 사용 예시:
// <OptimizedImage 
//   src="/images/banner-desktop.jpg"
//   alt="롱아일랜드 코리아 배너"
//   priority={true} // Above-the-fold 이미지
//   sizes="(max-width: 768px) 100vw, 50vw"
// />
`;

    fs.writeFileSync(
      path.join(__dirname, '../src/components/common/OptimizedImage.jsx'),
      componentCode
    );
    
    console.log('📦 OptimizedImage 컴포넌트 생성 완료');
  }
  
  generateLazyLoadingScript() {
    const script = `
/**
 * 이미지 지연 로딩 스크립트
 * 네이티브 lazy loading을 지원하지 않는 브라우저용 폴백
 */
(function() {
  'use strict';
  
  // 네이티브 lazy loading 지원 확인
  if ('loading' in HTMLImageElement.prototype) {
    // 네이티브 지원시 추가 최적화만 적용
    optimizeNativeLazyLoading();
    return;
  }
  
  // 폴백 구현
  let observer;
  
  function lazyLoad() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if (lazyImages.length === 0) return;
    
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });
      
      lazyImages.forEach((img) => observer.observe(img));
    } else {
      // IntersectionObserver 미지원시 스크롤 이벤트 사용
      let lazyImageTimeout;
      
      function lazyLoadImages() {
        if (lazyImageTimeout) clearTimeout(lazyImageTimeout);
        
        lazyImageTimeout = setTimeout(() => {
          const scrollTop = window.pageYOffset;
          const windowHeight = window.innerHeight;
          
          lazyImages.forEach((img) => {
            if (img.getBoundingClientRect().top < windowHeight + 50) {
              loadImage(img);
            }
          });
        }, 20);
      }
      
      document.addEventListener('scroll', lazyLoadImages);
      window.addEventListener('resize', lazyLoadImages);
      lazyLoadImages(); // 초기 로드
    }
  }
  
  function loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (!src) return;
    
    // 이미지 프리로드
    const imageLoader = new Image();
    imageLoader.onload = () => {
      img.src = src;
      if (srcset) img.srcset = srcset;
      img.classList.add('loaded');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    };
    
    imageLoader.onerror = () => {
      img.classList.add('error');
      // Fallback 이미지 설정
      const fallbackSrc = src.replace(/\\.(avif|webp)$/, '.jpg');
      if (fallbackSrc !== src) {
        imageLoader.src = fallbackSrc;
      }
    };
    
    imageLoader.src = src;
  }
  
  function optimizeNativeLazyLoading() {
    // Above-the-fold 이미지는 즉시 로드
    const criticalImages = document.querySelectorAll('img[data-priority="true"]');
    criticalImages.forEach(img => {
      img.loading = 'eager';
    });
    
    // 나머지 이미지는 lazy loading
    const lazyImages = document.querySelectorAll('img:not([data-priority])');
    lazyImages.forEach(img => {
      if (!img.loading) img.loading = 'lazy';
    });
  }
  
  // DOM 로드 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lazyLoad);
  } else {
    lazyLoad();
  }
})();
`;
    
    fs.writeFileSync(
      path.join(__dirname, '../public/js/lazy-loading.js'),
      script
    );
    
    console.log('📜 Lazy loading 스크립트 생성 완료');
  }
  
  generateOptimizationReport() {
    const compressionRatio = ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100).toFixed(1);
    
    const report = {
      summary: {
        filesProcessed: this.stats.filesProcessed,
        originalSize: `${(this.stats.originalSize / 1024).toFixed(2)} KB`,
        optimizedSize: `${(this.stats.optimizedSize / 1024).toFixed(2)} KB`,
        savings: `${((this.stats.originalSize - this.stats.optimizedSize) / 1024).toFixed(2)} KB`,
        compressionRatio: `${compressionRatio}%`
      },
      formats: ['AVIF', 'WebP', 'JPEG/PNG'],
      features: [
        '반응형 이미지 (다양한 화면 크기 지원)',
        'Lazy loading (뷰포트 진입시 로드)',
        '차세대 이미지 포맷 (AVIF, WebP)',
        'Progressive JPEG',
        'Intersection Observer API 활용'
      ]
    };
    
    console.log('\\n📊 이미지 최적화 결과:');
    console.log(`   📁 처리된 파일: ${report.summary.filesProcessed}개`);
    console.log(`   📉 크기 감소: ${report.summary.originalSize} → ${report.summary.optimizedSize}`);
    console.log(`   💾 절약된 용량: ${report.summary.savings} (${report.summary.compressionRatio})`);
    console.log(`   🎯 지원 포맷: ${report.formats.join(', ')}`);
  }
  
  getImageFiles() {
    const files = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    
    if (!fs.existsSync(this.inputDir)) return files;
    
    const items = fs.readdirSync(this.inputDir);
    
    items.forEach(item => {
      const fullPath = path.join(this.inputDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (imageExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
    
    return files;
  }
}

// 실행
if (require.main === module) {
  const optimizer = new AdvancedImageOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = { AdvancedImageOptimizer };