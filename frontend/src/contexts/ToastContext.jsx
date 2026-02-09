import { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ToastContext = createContext(null);

let idCounter = 0;

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const dialogResolveRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 3000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
  };

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      dialogResolveRef.current = resolve;
      setDialog({ type: 'confirm', message });
    });
  }, []);

  const prompt = useCallback((message, defaultValue = '') => {
    return new Promise((resolve) => {
      dialogResolveRef.current = resolve;
      setDialog({ type: 'prompt', message, defaultValue });
    });
  }, []);

  const handleDialogConfirm = useCallback((value) => {
    if (dialogResolveRef.current) {
      dialogResolveRef.current(value);
      dialogResolveRef.current = null;
    }
    setDialog(null);
  }, []);

  const handleDialogCancel = useCallback(() => {
    if (dialogResolveRef.current) {
      dialogResolveRef.current(dialog?.type === 'prompt' ? null : false);
      dialogResolveRef.current = null;
    }
    setDialog(null);
  }, [dialog?.type]);

  return (
    <ToastContext.Provider value={{ toast, confirm, prompt }}>
      {children}
      <Toast toasts={toasts} onDismiss={removeToast} />
      {dialog && (
        <ConfirmDialog
          type={dialog.type}
          message={dialog.message}
          defaultValue={dialog.defaultValue}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </ToastContext.Provider>
  );
};
