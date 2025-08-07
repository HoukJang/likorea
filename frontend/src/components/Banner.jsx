import React from 'react';
import ResponsiveImage from './common/ResponsiveImage';
import '../styles/Banner.css';

const Banner = () => (
  <div className='banner-container'>
    <ResponsiveImage
      imageName="banner"
      alt="Long Island Korea Community"
      className="banner-image"
      fetchPriority="high"
      loading="eager"
      sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 1200px"
    />
  </div>
);

export default Banner;
