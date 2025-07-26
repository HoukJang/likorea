import React from 'react';
import './Input.css';

/**
 * 공통 입력 컴포넌트
 * @param {Object} props - 입력 속성들
 * @param {string} props.type - 입력 타입 (text, email, password, number, etc.)
 * @param {string} props.size - 입력 크기 (small, medium, large)
 * @param {string} props.variant - 입력 스타일 (default, error, success)
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {boolean} props.readOnly - 읽기 전용 여부
 * @param {string} props.placeholder - 플레이스홀더 텍스트
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.style - 인라인 스타일
 * @param {Function} props.onChange - 변경 이벤트 핸들러
 * @param {Function} props.onFocus - 포커스 이벤트 핸들러
 * @param {Function} props.onBlur - 블러 이벤트 핸들러
 * @param {string} props.label - 라벨 텍스트
 * @param {string} props.error - 에러 메시지
 * @param {string} props.helperText - 도움말 텍스트
 */
const Input = ({
  type = 'text',
  size = 'medium',
  variant = 'default',
  disabled = false,
  readOnly = false,
  placeholder = '',
  className = '',
  style = {},
  onChange,
  onFocus,
  onBlur,
  label,
  error,
  helperText,
  id,
  name,
  value,
  ...props
}) => {
  const baseClass = 'common-input';
  const sizeClass = `common-input--${size}`;
  const variantClass = error ? 'common-input--error' : `common-input--${variant}`;
  const disabledClass = disabled ? 'common-input--disabled' : '';
  const readonlyClass = readOnly ? 'common-input--readonly' : '';

  const inputClass = [baseClass, sizeClass, variantClass, disabledClass, readonlyClass, className]
    .filter(Boolean)
    .join(' ');

  const inputId = id || name;

  return (
    <div className='common-input-wrapper'>
      {label && (
        <label htmlFor={inputId} className='common-input__label'>
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        className={inputClass}
        style={style}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
      {error && <div className='common-input__error'>{error}</div>}
      {helperText && !error && <div className='common-input__helper'>{helperText}</div>}
    </div>
  );
};

export default Input;
