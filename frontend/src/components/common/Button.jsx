import './Button.css';

/**
 * Reusable Button component with design system integration
 * @param {Object} props - Button props
 * @param {string} props.variant - Button style variant (primary, secondary, tertiary, ghost, danger, danger-tertiary)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {Function} props.onClick - Click event handler
 * @param {React.ReactNode} props.children - Button content
 * @param {boolean} props.fullWidth - Full width button
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.iconPosition - Icon position (left, right)
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  style = {},
  onClick,
  children,
  type = 'button',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  // Use design system classes
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    icon && !children && 'btn-icon-only',
    className
  ].filter(Boolean).join(' ');

  const handleClick = e => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      style={style}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-loading-spinner">로딩중...</span>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
          {children && <span className="btn-text">{children}</span>}
          {icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
