import React from 'react';
import { useToast } from '../context/ToastContext';

function toastBgClass(type) {
  if (type === 'error') return 'bg-red-600';
  if (type === 'success') return 'bg-green-600';
  return 'bg-gray-600';
}

export default function Toast() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 rounded-lg shadow-lg px-4 py-3 text-white text-sm transition-opacity duration-300 ${toastBgClass(toast.type)}`}
          role="alert"
          aria-live="assertive"
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-2 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
