import React from 'react';
import './VersionDisplay.css';

const VersionDisplay = ({ position = 'bottom-right', showCodename = true }) => {
  const version = process.env.REACT_APP_VERSION || 'dev';
  const codename = process.env.REACT_APP_VERSION_CODENAME || '';
  const date = process.env.REACT_APP_VERSION_DATE || '';

  // 개발 환경에서는 표시하지 않음
  if (process.env.NODE_ENV === 'development' && version === 'dev') {
    return null;
  }

  const displayText = showCodename && codename
    ? `v${version} - ${codename}`
    : `v${version}`;

  return (
    <div className={`version-display version-display--${position}`} title={date ? `Released: ${date}` : ''}>
      <span className="version-display__text">{displayText}</span>
    </div>
  );
};

export default VersionDisplay;