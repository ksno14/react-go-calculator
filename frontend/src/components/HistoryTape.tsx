import React from 'react';
import { History, Trash2, ArrowUpRight } from 'lucide-react';
import { HistoryItem } from '../types/calculator';

interface HistoryTapeProps {
  history: HistoryItem[];
  isOpen: boolean;
  onToggle: () => void;
  onRecall: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryTape: React.FC<HistoryTapeProps> = ({
  history,
  isOpen,
  onToggle,
  onRecall,
  onClear,
}) => {
  const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="w-full">
      {/* Toggle Bar */}
      <div className="flex items-center justify-between py-2 px-1 text-xs text-slate-400">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus:outline-none"
        >
          <History className="w-4 h-4 text-slate-400" />
          <span>Calculation History</span>
          {history.length > 0 && (
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              {history.length}
            </span>
          )}
        </button>

        {history.length > 0 && isOpen && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Expandable History Drawer */}
      {isOpen && (
        <div className="mt-2 max-h-56 overflow-y-auto bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner divide-y divide-slate-800/60 animate-in fade-in duration-150">
          {history.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No calculations yet. Perform any operation to see history.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => onRecall(item)}
                className="group py-2 px-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-mono group-hover:text-slate-300">
                    {item.expression}
                  </span>
                  <span className="text-sm font-semibold font-mono text-white group-hover:text-blue-400">
                    = {item.result}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatTime(item.timestamp)}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
