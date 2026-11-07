import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 bg-red-950/80 border border-red-500/40 text-red-200 px-4 py-2.5 rounded-xl mb-4 text-sm animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-red-400 hover:text-red-200 rounded-lg hover:bg-red-900/50 transition-colors shrink-0"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
