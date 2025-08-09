import './Button.css';

/**
 * 공통 버튼 컴포넌트
 * @param {Object} props - 버튼 속성들
 * @param {string} props.variant - 버튼 스타일 (primary, secondary, danger, success)
 * @param {string} props.size - 버튼 크기 (small, medium, large)
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.style - 인라인 스타일
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 * @param {React.ReactNode} props.children - 버튼 내용
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  style = {},
  onClick,
  children,
  type = 'button',
  ...props
}) => {
  const baseClass = 'common-button';
  const variantClass = `common-button--${variant}`;
  const sizeClass = `common-button--${size}`;
  const disabledClass = disabled || loading ? 'common-button--disabled' : '';
  const loadingClass = loading ? 'common-button--loading' : '';

  const buttonClass = [baseClass, variantClass, sizeClass, disabledClass, loadingClass, className]
    .filter(Boolean)
    .join(' ');

  const handleClick = e => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClass}
      style={style}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="common-button__spinner">
          <div className="spinner"></div>
        </span>
      )}
      <span className="common-button__content">{children}</span>
    </button>
  );
};

export default Button;
