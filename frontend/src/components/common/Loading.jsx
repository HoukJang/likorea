import './Loading.css';

/**
 * 공통 로딩 컴포넌트
 * @param {Object} props - 로딩 속성들
 * @param {string} props.type - 로딩 타입 (spinner, dots, pulse, skeleton)
 * @param {string} props.size - 로딩 크기 (small, medium, large)
 * @param {string} props.color - 로딩 색상
 * @param {string} props.text - 로딩 텍스트
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.style - 인라인 스타일
 */
const Loading = ({
  type = 'spinner',
  size = 'medium',
  color = '#337ab7',
  text = '로딩 중...',
  className = '',
  style = {},
  ...props
}) => {
  const baseClass = 'common-loading';
  const typeClass = `common-loading--${type}`;
  const sizeClass = `common-loading--${size}`;

  const loadingClass = [baseClass, typeClass, sizeClass, className].filter(Boolean).join(' ');

  const renderSpinner = () => (
    <div className="common-loading__spinner" style={{ borderTopColor: color }}>
      <div className="spinner"></div>
    </div>
  );

  const renderDots = () => (
    <div className="common-loading__dots">
      <div className="dot" style={{ backgroundColor: color }}></div>
      <div className="dot" style={{ backgroundColor: color }}></div>
      <div className="dot" style={{ backgroundColor: color }}></div>
    </div>
  );

  const renderPulse = () => (
    <div className="common-loading__pulse" style={{ backgroundColor: color }}></div>
  );

  const renderSkeleton = () => (
    <div className="common-loading__skeleton">
      <div className="skeleton-line" style={{ backgroundColor: color }}></div>
      <div className="skeleton-line" style={{ backgroundColor: color }}></div>
      <div className="skeleton-line" style={{ backgroundColor: color }}></div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={loadingClass} style={style} {...props}>
      {renderContent()}
      {text && <div className="common-loading__text">{text}</div>}
    </div>
  );
};

export default Loading;
