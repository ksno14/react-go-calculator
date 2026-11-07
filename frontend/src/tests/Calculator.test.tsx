import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Calculator } from '../components/Calculator';
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

describe('Calculator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders title, display, and key buttons', async () => {
    await act(async () => {
      render(<Calculator />);
    });

    expect(screen.getByText('Full-Stack Calculator')).toBeInTheDocument();
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');

    // Buttons
    expect(screen.getByRole('button', { name: 'All clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Divide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Square root' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Equals' })).toBeInTheDocument();
  });

  it('updates display when number buttons are clicked', async () => {
    await act(async () => {
      render(<Calculator />);
    });

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));

    expect(screen.getByTestId('calculator-display')).toHaveTextContent('789');
  });

  it('displays calculation result after operator and equals click', async () => {
    (apiService.calculate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      operation: 'multiply',
      a: 6,
      b: 7,
      result: 42,
      expression: '6 × 7 = 42',
    });

    await act(async () => {
      render(<Calculator />);
    });

    fireEvent.click(screen.getByRole('button', { name: '6' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Multiply' }));
    });
    fireEvent.click(screen.getByRole('button', { name: '7' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('calculator-display')).toHaveTextContent('42');
    });
  });

  it('shows error banner when API fails (e.g., division by zero)', async () => {
    const errorMsg = 'Division by zero is undefined';
    (apiService.calculate as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error(errorMsg)
    );

    await act(async () => {
      render(<Calculator />);
    });

    fireEvent.click(screen.getByRole('button', { name: '5' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Divide' }));
    });
    fireEvent.click(screen.getByRole('button', { name: '0' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(errorMsg);
    });
  });

  it('copies current value to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(async () => {
      render(<Calculator />);
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));

    const copyBtn = screen.getByRole('button', { name: /copy result to clipboard/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith('89');
  });
});
