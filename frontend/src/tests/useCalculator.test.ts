import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from '../hooks/useCalculator';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    calculate: vi.fn(),
    checkHealth: vi.fn().mockResolvedValue(true),
  },
  CalculatorApiError: class extends Error {
    code: string;
    constructor(msg: string, code: string = 'ERROR') {
      super(msg);
      this.code = code;
    }
  },
}));

describe('useCalculator hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with default zero value', () => {
    const { result } = renderHook(() => useCalculator());
    expect(result.current.currentInput).toBe('0');
    expect(result.current.previousValue).toBeNull();
    expect(result.current.activeOperation).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('inputs digits correctly', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
    });
    expect(result.current.currentInput).toBe('5');

    act(() => {
      result.current.inputDigit('2');
    });
    expect(result.current.currentInput).toBe('52');
  });

  it('handles decimal separator correctly', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('3');
    });
    act(() => {
      result.current.inputDecimal();
    });
    act(() => {
      result.current.inputDigit('1');
    });
    act(() => {
      result.current.inputDigit('4');
    });
    expect(result.current.currentInput).toBe('3.14');

    // Duplicate decimal ignored
    act(() => {
      result.current.inputDecimal();
    });
    expect(result.current.currentInput).toBe('3.14');
  });

  it('toggles sign correctly', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('9');
    });
    act(() => {
      result.current.toggleSign();
    });
    expect(result.current.currentInput).toBe('-9');

    act(() => {
      result.current.toggleSign();
    });
    expect(result.current.currentInput).toBe('9');
  });

  it('handles backspace correctly', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('1');
    });
    act(() => {
      result.current.inputDigit('2');
    });
    act(() => {
      result.current.inputDigit('3');
    });
    expect(result.current.currentInput).toBe('123');

    act(() => {
      result.current.backspace();
    });
    expect(result.current.currentInput).toBe('12');

    act(() => {
      result.current.backspace();
      result.current.backspace();
    });
    expect(result.current.currentInput).toBe('0');
  });

  it('clears all state on clearAll', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('8');
    });
    act(() => {
      result.current.setOperation('add');
    });
    act(() => {
      result.current.clearAll();
    });

    expect(result.current.currentInput).toBe('0');
    expect(result.current.previousValue).toBeNull();
    expect(result.current.activeOperation).toBeNull();
    expect(result.current.expression).toBe('');
  });

  it('performs binary operation via API on equals', async () => {
    (apiService.calculate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      operation: 'add',
      a: 10,
      b: 20,
      result: 30,
      expression: '10 + 20 = 30',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('1');
    });
    act(() => {
      result.current.inputDigit('0');
    });
    await act(async () => {
      await result.current.setOperation('add');
    });

    expect(result.current.previousValue).toBe(10);
    expect(result.current.activeOperation).toBe('add');

    act(() => {
      result.current.inputDigit('2');
    });
    act(() => {
      result.current.inputDigit('0');
    });

    await act(async () => {
      await result.current.executeEquals();
    });

    expect(result.current.currentInput).toBe('30');
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].result).toBe(30);
  });

  it('performs unary square root immediately via API', async () => {
    (apiService.calculate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      operation: 'sqrt',
      a: 64,
      result: 8,
      expression: '√(64) = 8',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('6');
    });
    act(() => {
      result.current.inputDigit('4');
    });

    await act(async () => {
      await result.current.setOperation('sqrt');
    });

    expect(result.current.currentInput).toBe('8');
    expect(result.current.history.length).toBe(1);
  });
});
