import React, { useState } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';

interface DisplayProps {
  expression: string;
  currentInput: string;
  isLoading: boolean;
}

export const Display: React.FC<DisplayProps> = ({ expression, currentInput, isLoading }) => {
  const [copied, setCopied] = useState(false);

  // Format long display numbers if appropriate, preserving trailing decimal if typing
  const formatForDisplay = (val: string): string => {
    if (val === 'NaN' || val === 'Infinity' || val === '-Infinity') return val;
    if (val.endsWith('.')) {
      const parts = val.split('.');
      return Number(parts[0]).toLocaleString('en-US') + '.';
    }
    const num = Number(val);
    if (!isNaN(num) && val.length > 3 && !val.includes('e')) {
      const parts = val.split('.');
      const integerFormatted = Number(parts[0]).toLocaleString('en-US');
      return parts.length > 1 ? `${integerFormatted}.${parts[1]}` : integerFormatted;
    }
    return val;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API not available
      const textArea = document.createElement('textarea');
      textArea.value = currentInput;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedValue = formatForDisplay(currentInput);

  // Auto scale font size for large inputs
  const getFontSize = (text: string) => {
    if (text.length > 13) return 'text-2xl sm:text-3xl';
    if (text.length > 9) return 'text-3xl sm:text-4xl';
    return 'text-4xl sm:text-5xl';
  };

  return (
    <div
      role="region"
      aria-label="Calculator Display Screen"
      className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-4 shadow-inner flex flex-col justify-between min-h-[120px] transition-all group"
    >
      {/* Upper expression line and quick actions */}
      <div className="flex items-center justify-between text-slate-400 text-sm font-mono h-6 mb-1 overflow-hidden">
        <span className="truncate" aria-label={`Current expression: ${expression || 'none'}`}>
          {expression || '\u00A0'}
        </span>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span
              role="status"
              className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800 animate-pulse"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Computing...
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'Copied to clipboard!' : 'Copy to clipboard'}
            aria-label={copied ? 'Copied to clipboard' : 'Copy result to clipboard'}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main numeric display with a11y live region */}
      <div className="flex items-baseline justify-end overflow-hidden">
        <span
          data-testid="calculator-display"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`font-mono font-semibold tracking-tight text-white select-all transition-all ${getFontSize(
            formattedValue
          )}`}
        >
          {formattedValue}
        </span>
      </div>
    </div>
  );
};
