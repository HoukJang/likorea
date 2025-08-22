import React from 'react';
import './Input.css';

function TextArea({
  label,
  error,
  className = '',
  disabled = false,
  required = false,
  ...props
}) {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <textarea
        className={`input-field textarea-field ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${props.id}-error`} className="input-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default TextArea;