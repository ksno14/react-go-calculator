import { CalculationRequest, CalculationResponse, CalculationErrorResponse } from '../types/calculator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class CalculatorApiError extends Error {
  code: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'CalculatorApiError';
    this.code = code;
  }
}

export const apiService = {
  async calculate(payload: CalculationRequest): Promise<CalculationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as CalculationErrorResponse;
        throw new CalculatorApiError(
          errorData.error || `Server responded with status ${response.status}`,
          errorData.code || 'API_ERROR'
        );
      }

      return data as CalculationResponse;
    } catch (err) {
      if (err instanceof CalculatorApiError) {
        throw err;
      }
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new CalculatorApiError(
          'Cannot connect to backend calculator service. Ensure Go server is running.',
          'NETWORK_ERROR'
        );
      }
      throw new CalculatorApiError(
        (err as Error).message || 'Unexpected calculation error occurred',
        'CLIENT_ERROR'
      );
    }
  },

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};
