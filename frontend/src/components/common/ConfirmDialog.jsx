import { useEffect, useRef, useState } from 'react';
import '../../styles/ConfirmDialog.css';

const ConfirmDialog = ({ type, message, defaultValue = '', onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (type === 'prompt' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    } else if (confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [type]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleConfirm = () => {
    onConfirm(type === 'prompt' ? inputValue : true);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type === 'prompt') {
      handleConfirm();
    }
  };

  return (
    <div className="confirm-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="confirm-dialog" ref={dialogRef}>
        <div className="confirm-dialog-message">{message}</div>
        {type === 'prompt' && (
          <input
            ref={inputRef}
            className="confirm-dialog-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-btn confirm-dialog-btn-cancel" onClick={onCancel}>
            취소
          </button>
          <button
            ref={confirmBtnRef}
            className="confirm-dialog-btn confirm-dialog-btn-confirm"
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
