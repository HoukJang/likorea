import '../../styles/Toast.css';

const Toast = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon" aria-hidden="true" />
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="닫기"
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
