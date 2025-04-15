import React from 'react';
import picture1 from '../styles/Picture1.svg';
import '../styles/Banner.css';

const Banner = () => (
  <div className="banner-container">
    <img src={picture1} alt="Banner" className="banner-image" />
  </div>
);

export default Banner;
