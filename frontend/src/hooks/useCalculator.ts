import { useState, useEffect, useCallback, useRef } from 'react';
import { OperationType, HistoryItem } from '../types/calculator';
import { apiService } from '../services/api';

const HISTORY_STORAGE_KEY = 'calculator_history_v1';

export function useCalculator() {
  const [currentInput, setCurrentInput] = useState<string>('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [activeOperation, setActiveOperation] = useState<OperationType | null>(null);
  const [expression, setExpression] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Ref tracking whether next digit should replace current input
  const shouldResetRef = useRef<boolean>(false);
  const [, setResetTick] = useState(0);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage errors in private browsing
    }
  }, [history]);

  const getOpSymbol = (op: OperationType): string => {
    switch (op) {
      case 'add': return '+';
      case 'subtract': return '−';
      case 'multiply': return '×';
      case 'divide': return '÷';
      case 'power': return '^';
      case 'sqrt': return '√';
      case 'percentage': return '%';
    }
  };

  const inputDigit = useCallback((digit: string) => {
    setError(null);
    setCurrentInput((prev) => {
      if (shouldResetRef.current || prev === '0') {
        shouldResetRef.current = false;
        setResetTick((t) => t + 1);
        return digit;
      }
      if (prev.replace('-', '').length >= 15) return prev;
      return prev + digit;
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setError(null);
    setCurrentInput((prev) => {
      if (shouldResetRef.current) {
        shouldResetRef.current = false;
        setResetTick((t) => t + 1);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  }, []);

  const toggleSign = useCallback(() => {
    setError(null);
    setCurrentInput((prev) => {
      if (prev === '0') return '0';
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    setCurrentInput((prev) => {
      if (shouldResetRef.current) return prev;
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  }, []);

  const clearAll = useCallback(() => {
    setCurrentInput('0');
    setPreviousValue(null);
    setActiveOperation(null);
    setExpression('');
    setError(null);
    shouldResetRef.current = false;
    setResetTick((t) => t + 1);
  }, []);

  const addHistoryItem = useCallback((expr: string, res: number) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      expression: expr,
      result: res,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
  }, []);

  const handleUnarySqrt = useCallback(async (val: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await apiService.calculate({
        operation: 'sqrt',
        a: val,
      });

      setCurrentInput(resp.result.toString());
      setExpression(`√(${val})`);
      shouldResetRef.current = true;
      setResetTick((t) => t + 1);
      addHistoryItem(resp.expression, resp.result);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Error executing square root';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [addHistoryItem]);

  const handlePercentage = useCallback(async (currentVal: number) => {
    setIsLoading(true);
    setError(null);
    try {
      let resp;
      if (previousValue !== null && activeOperation !== null) {
        resp = await apiService.calculate({
          operation: 'percentage',
          a: previousValue,
          b: currentVal,
        });
      } else {
        resp = await apiService.calculate({
          operation: 'percentage',
          a: currentVal,
        });
      }

      setCurrentInput(resp.result.toString());
      setExpression(resp.expression);
      shouldResetRef.current = true;
      setResetTick((t) => t + 1);
      addHistoryItem(resp.expression, resp.result);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Error calculating percentage';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [previousValue, activeOperation, addHistoryItem]);

  const executeEquals = useCallback(async () => {
    if (previousValue === null || activeOperation === null) return;

    const b = parseFloat(currentInput);
    if (isNaN(b)) return;

    setIsLoading(true);
    setError(null);
    try {
      const resp = await apiService.calculate({
        operation: activeOperation,
        a: previousValue,
        b: b,
      });

      setCurrentInput(resp.result.toString());
      setExpression(`${previousValue} ${getOpSymbol(activeOperation)} ${b} =`);
      setPreviousValue(null);
      setActiveOperation(null);
      shouldResetRef.current = true;
      setResetTick((t) => t + 1);
      addHistoryItem(resp.expression, resp.result);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Calculation error occurred';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [previousValue, activeOperation, currentInput, addHistoryItem]);

  const setOperation = useCallback(async (op: OperationType) => {
    setError(null);
    const currentVal = parseFloat(currentInput);
    if (isNaN(currentVal)) return;

    if (op === 'sqrt') {
      await handleUnarySqrt(currentVal);
      return;
    }

    if (op === 'percentage') {
      await handlePercentage(currentVal);
      return;
    }

    // If there is already an active operation and user entered a new number, evaluate it first
    if (previousValue !== null && activeOperation !== null && !shouldResetRef.current) {
      setIsLoading(true);
      try {
        const resp = await apiService.calculate({
          operation: activeOperation,
          a: previousValue,
          b: currentVal,
        });
        setPreviousValue(resp.result);
        setCurrentInput(resp.result.toString());
        setActiveOperation(op);
        setExpression(`${resp.result} ${getOpSymbol(op)}`);
        shouldResetRef.current = true;
        setResetTick((t) => t + 1);
        addHistoryItem(resp.expression, resp.result);
      } catch (err: unknown) {
        const msg = (err as Error)?.message || 'Calculation failed';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Set new operation
    setPreviousValue(currentVal);
    setActiveOperation(op);
    setExpression(`${currentVal} ${getOpSymbol(op)}`);
    shouldResetRef.current = true;
    setResetTick((t) => t + 1);
  }, [currentInput, previousValue, activeOperation, handleUnarySqrt, handlePercentage, addHistoryItem]);

  const recallHistory = useCallback((item: HistoryItem) => {
    setCurrentInput(item.result.toString());
    setExpression(`Ans: ${item.result}`);
    shouldResetRef.current = true;
    setResetTick((t) => t + 1);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    currentInput,
    previousValue,
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
  };
}
