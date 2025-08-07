const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../src/styles');
const OUTPUT_DIR = path.join(__dirname, '../public/images');

// 출력 디렉토리 생성
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function optimizeBannerImage() {
  const inputPath = path.join(INPUT_DIR, 'banner_image.png');
  
  // 배너 이미지 사이즈 설정
  const sizes = [
    { width: 412, suffix: 'mobile' },      // 모바일
    { width: 768, suffix: 'tablet' },      // 태블릿
    { width: 1200, suffix: 'desktop' },    // 데스크톱
    { width: 1356, suffix: 'full' }        // 원본 크기
  ];

  console.log('배너 이미지 최적화 시작...');

  for (const size of sizes) {
    // WebP 형식
    await sharp(inputPath)
      .resize(size.width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 85 })
      .toFile(path.join(OUTPUT_DIR, `banner-${size.suffix}.webp`));
    
    // PNG 형식 (fallback)
    await sharp(inputPath)
      .resize(size.width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(path.join(OUTPUT_DIR, `banner-${size.suffix}.png`));
    
    console.log(`✓ banner-${size.suffix} 생성 완료`);
  }

  // 파일 크기 비교
  const originalSize = fs.statSync(inputPath).size;
  console.log(`\n원본 크기: ${(originalSize / 1024).toFixed(2)} KB`);
  
  sizes.forEach(size => {
    const webpPath = path.join(OUTPUT_DIR, `banner-${size.suffix}.webp`);
    const pngPath = path.join(OUTPUT_DIR, `banner-${size.suffix}.png`);
    
    if (fs.existsSync(webpPath)) {
      const webpSize = fs.statSync(webpPath).size;
      console.log(`banner-${size.suffix}.webp: ${(webpSize / 1024).toFixed(2)} KB (${((1 - webpSize/originalSize) * 100).toFixed(1)}% 절약)`);
    }
  });
}

optimizeBannerImage().catch(console.error);