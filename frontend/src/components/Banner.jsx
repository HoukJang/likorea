import React from 'react';
import bannerImage from '../styles/banner_image.png';
import '../styles/Banner.css';

const Banner = () => (
  <div className='banner-container'>
    <img src={bannerImage} alt='Long Island Korea Community' className='banner-image' />
  </div>
);

export default Banner;
