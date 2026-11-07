import React, { useState, useEffect } from 'react';
import { Activity, Cpu } from 'lucide-react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { Keypad } from './Keypad';
import { HistoryTape } from './HistoryTape';
import { ErrorAlert } from './ErrorAlert';
import { apiService } from '../services/api';

export const Calculator: React.FC = () => {
  const {
    currentInput,
    activeOperation,
    expression,
    isLoading,
    error,
    history,
    inputDigit,
    inputDecimal,
    toggleSign,
    backspace,
    clearAll,
    setOperation,
    executeEquals,
    recallHistory,
    clearHistory,
    setError,
  } = useCalculator();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const ok = await apiService.checkHealth();
      if (isMounted) {
        setBackendStatus(ok ? 'connected' : 'disconnected');
      }
    };
    check();
    const timer = setInterval(check, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea if any exist
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;
      const code = e.code;

      if (/^[0-9]$/.test(key) || (code && code.startsWith('Numpad') && /^Numpad[0-9]$/.test(code))) {
        e.preventDefault();
        inputDigit(key.length === 1 ? key : code.replace('Numpad', ''));
      } else if (key === '.' || key === ',' || code === 'NumpadDecimal') {
        e.preventDefault();
        inputDecimal();
      } else if (key === '+' || code === 'NumpadAdd') {
        e.preventDefault();
        setOperation('add');
      } else if (key === '-' || code === 'NumpadSubtract') {
        e.preventDefault();
        setOperation('subtract');
      } else if (key === '*' || code === 'NumpadMultiply') {
        e.preventDefault();
        setOperation('multiply');
      } else if (key === '/' || code === 'NumpadDivide') {
        e.preventDefault();
        setOperation('divide');
      } else if (key === '^') {
        e.preventDefault();
        setOperation('power');
      } else if (key === '%') {
        e.preventDefault();
        setOperation('percentage');
      } else if (key === 'Enter' || key === '=' || code === 'NumpadEnter') {
        e.preventDefault();
        executeEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        e.preventDefault();
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    inputDigit,
    inputDecimal,
    setOperation,
    executeEquals,
    backspace,
    clearAll,
  ]);

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-2xl shadow-black/80 transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-white">Full-Stack Calculator</span>
        </div>

        {/* Backend health status badge */}
        <div
          title={
            backendStatus === 'connected'
              ? 'Go Backend API Connected'
              : backendStatus === 'disconnected'
              ? 'Go Backend API Offline'
              : 'Checking API...'
          }
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border bg-slate-950/50"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : backendStatus === 'disconnected'
                ? 'bg-rose-500 animate-pulse'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="text-[11px] text-slate-400 capitalize">
            {backendStatus === 'connected' ? 'Go API Online' : backendStatus === 'disconnected' ? 'Go API Offline' : 'Connecting'}
          </span>
        </div>
      </div>

      {/* Error alert message */}
      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Display screen */}
      <Display
        expression={expression}
        currentInput={currentInput}
        isLoading={isLoading}
      />

      {/* Keypad */}
      <Keypad
        onDigit={inputDigit}
        onDecimal={inputDecimal}
        onToggleSign={toggleSign}
        onBackspace={backspace}
        onClear={clearAll}
        onOperation={setOperation}
        onEquals={executeEquals}
        activeOp={activeOperation}
        disabled={isLoading}
      />

      {/* History Drawer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <HistoryTape
          history={history}
          isOpen={isHistoryOpen}
          onToggle={() => setIsHistoryOpen((prev) => !prev)}
          onRecall={recallHistory}
          onClear={clearHistory}
        />
      </div>

      {/* Keyboard hints */}
      <div className="mt-3 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
        <Activity className="w-3 h-3 text-slate-600" />
        <span>Keyboard input enabled (Numbers, +, -, *, /, ^, %, Enter, Esc)</span>
      </div>
    </div>
  );
};
