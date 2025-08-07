import { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.type === 'error' ? 8000 : 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onDismiss]);

  const getToastStyles = () => {
    return toast.type === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-green-50 border-green-200 text-green-800';
  };

  const getIcon = () => {
    return toast.type === 'error' ? '❌' : '✅';
  };

  return (
    <div className={`border rounded-lg p-4 shadow-lg ${getToastStyles()} animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg">{getIcon()}</span>
          <div>
            <div className="font-medium">{toast.title}</div>
            {toast.message && (
              <div className="text-sm opacity-80 mt-1">{toast.message}</div>
            )}
          </div>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-lg opacity-60 hover:opacity-100 ml-4"
        >
          ×
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    // Don't show toast if title is empty or just whitespace
    if (!title?.trim()) return;
    addToast({ type: 'success', title: title.trim(), message });
  };

  const showError = (title: string, message?: string) => {
    // Don't show toast if title is empty or just whitespace
    if (!title?.trim()) return;
    addToast({ type: 'error', title: title.trim(), message });
  };

  return {
    toasts,
    dismissToast,
    showSuccess,
    showError
  };
}
