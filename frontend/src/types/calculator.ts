export type OperationType =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percentage';

export interface CalculationRequest {
  operation: OperationType;
  a: number;
  b?: number;
}

export interface CalculationResponse {
  operation: string;
  a: number;
  b?: number;
  result: number;
  expression: string;
}

export interface CalculationErrorResponse {
  error: string;
  code?: string;
}

export interface HistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: number;
}
