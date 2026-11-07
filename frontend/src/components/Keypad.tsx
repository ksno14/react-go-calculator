import React from 'react';
import { Delete } from 'lucide-react';
import { OperationType } from '../types/calculator';

interface KeypadProps {
  onDigit: (d: string) => void;
  onDecimal: () => void;
  onToggleSign: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onOperation: (op: OperationType) => void;
  onEquals: () => void;
  activeOp: OperationType | null;
  disabled: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onDigit,
  onDecimal,
  onToggleSign,
  onBackspace,
  onClear,
  onOperation,
  onEquals,
  activeOp,
  disabled,
}) => {
  const baseBtnClass =
    'relative flex items-center justify-center font-medium select-none transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-lg sm:text-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50';

  const digitClass = `${baseBtnClass} h-14 bg-slate-800 text-slate-100 hover:bg-slate-700/80 active:bg-slate-700 border border-slate-700/50`;
  const actionClass = `${baseBtnClass} h-14 bg-slate-800/80 text-slate-300 hover:bg-slate-700 active:bg-slate-700 border border-slate-700/50 font-mono`;
  const clearClass = `${baseBtnClass} h-14 bg-rose-950/60 text-rose-300 hover:bg-rose-900/70 border border-rose-800/50 font-semibold`;
  const advancedOpClass = `${baseBtnClass} h-14 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-800/50 font-mono`;

  const getOpBtnClass = (op: OperationType) => {
    const isActive = activeOp === op;
    return `${baseBtnClass} h-14 font-mono font-semibold border ${
      isActive
        ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40 active:bg-amber-500/40'
    }`;
  };

  const equalsClass = `${baseBtnClass} bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold border border-blue-400/30 shadow-lg shadow-blue-600/30 row-span-2 text-2xl`;

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      {/* Row 1: Clear, Backspace, Sign, Divide */}
      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        className={clearClass}
        aria-label="All clear"
      >
        AC
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        className={actionClass}
        aria-label="Backspace"
      >
        <Delete className="w-5 h-5" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleSign}
        className={actionClass}
        aria-label="Toggle sign"
      >
        ±
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOperation('divide')}
        className={getOpBtnClass('divide')}
        aria-label="Divide"
      >
        ÷
      </button>

      {/* Row 2: Advanced (Power, Sqrt, Percentage), Multiply */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOperation('power')}
        className={advancedOpClass}
        aria-label="Power x to the power of y"
      >
        xʸ
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOperation('sqrt')}
        className={advancedOpClass}
        aria-label="Square root"
      >
        √x
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOperation('percentage')}
        className={advancedOpClass}
        aria-label="Percentage"
      >
        %
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOperation('multiply')}
        className={getOpBtnClass('multiply')}
        aria-label="Multiply"
      >
        ×
      </button>

      {/* Row 3: 7, 8, 9, Subtract */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('7')}
        className={digitClass}
      >
        7
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('8')}
        className={digitClass}
      >
        8
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('9')}
        className={digitClass}
      >
        9
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOperation('subtract')}
        className={getOpBtnClass('subtract')}
        aria-label="Subtract"
      >
        −
      </button>

      {/* Row 4: 4, 5, 6, Add */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('4')}
        className={digitClass}
      >
        4
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('5')}
        className={digitClass}
      >
        5
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('6')}
        className={digitClass}
      >
        6
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOperation('add')}
        className={getOpBtnClass('add')}
        aria-label="Add"
      >
        +
      </button>

      {/* Row 5: 1, 2, 3, Equals (spans 2 rows) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('1')}
        className={digitClass}
      >
        1
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('2')}
        className={digitClass}
      >
        2
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('3')}
        className={digitClass}
      >
        3
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onEquals}
        className={equalsClass}
        aria-label="Equals"
      >
        =
      </button>

      {/* Row 6: 0 (span 2), Decimal */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('0')}
        className={`${digitClass} col-span-2`}
      >
        0
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onDecimal}
        className={digitClass}
        aria-label="Decimal point"
      >
        .
      </button>
    </div>
  );
};
