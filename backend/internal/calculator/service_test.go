package calculator

import (
	"math"
	"testing"
)

func ptr(v float64) *float64 {
	return &v
}

func TestCalculatorError(t *testing.T) {
	err := NewCalculatorError("TEST_CODE", "test message")
	if err.Error() != "test message" {
		t.Errorf("expected 'test message', got '%s'", err.Error())
	}
	if err.Code != "TEST_CODE" {
		t.Errorf("expected 'TEST_CODE', got '%s'", err.Code)
	}
}

func TestCalculatorService_BasicOperations(t *testing.T) {
	svc := NewService()

	t.Run("Add", func(t *testing.T) {
		tests := []struct {
			name     string
			a, b     float64
			expected float64
		}{
			{"positive numbers", 10, 5, 15},
			{"negative and positive", -10, 5, -5},
			{"decimals", 0.1, 0.2, 0.3},
			{"zero", 0, 0, 0},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				res, err := svc.Add(tc.a, tc.b)
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if math.Abs(res-tc.expected) > 1e-9 {
					t.Errorf("expected %v, got %v", tc.expected, res)
				}
			})
		}
	})

	t.Run("Subtract", func(t *testing.T) {
		tests := []struct {
			name     string
			a, b     float64
			expected float64
		}{
			{"positive numbers", 10, 4, 6},
			{"negative result", 4, 10, -6},
			{"subtracting negative", 5, -5, 10},
			{"zero", 0, 0, 0},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				res, err := svc.Subtract(tc.a, tc.b)
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if math.Abs(res-tc.expected) > 1e-9 {
					t.Errorf("expected %v, got %v", tc.expected, res)
				}
			})
		}
	})

	t.Run("Multiply", func(t *testing.T) {
		tests := []struct {
			name     string
			a, b     float64
			expected float64
		}{
			{"positive numbers", 6, 7, 42},
			{"positive and negative", -6, 7, -42},
			{"negative and negative", -6, -7, 42},
			{"multiply by zero", 100, 0, 0},
			{"decimals", 2.5, 4, 10},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				res, err := svc.Multiply(tc.a, tc.b)
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if math.Abs(res-tc.expected) > 1e-9 {
					t.Errorf("expected %v, got %v", tc.expected, res)
				}
			})
		}
	})

	t.Run("Divide", func(t *testing.T) {
		tests := []struct {
			name     string
			a, b     float64
			expected float64
		}{
			{"standard division", 20, 4, 5},
			{"decimal result", 1, 2, 0.5},
			{"negative divisor", 10, -2, -5},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				res, err := svc.Divide(tc.a, tc.b)
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if math.Abs(res-tc.expected) > 1e-9 {
					t.Errorf("expected %v, got %v", tc.expected, res)
				}
			})
		}

		// Division by zero
		_, err := svc.Divide(10, 0)
		if err == nil {
			t.Fatal("expected error on division by zero, got nil")
		}
		calcErr, ok := err.(*CalculatorError)
		if !ok || calcErr.Code != ErrCodeDivisionByZero {
			t.Errorf("expected ErrCodeDivisionByZero, got %v", err)
		}
	})
}

func TestCalculatorService_OptionalOperations(t *testing.T) {
	svc := NewService()

	t.Run("Power", func(t *testing.T) {
		tests := []struct {
			name     string
			a, b     float64
			expected float64
		}{
			{"positive exponent", 2, 8, 256},
			{"zero exponent", 5, 0, 1},
			{"negative exponent", 2, -1, 0.5},
			{"fractional exponent", 27, 1.0 / 3.0, 3},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				res, err := svc.Power(tc.a, tc.b)
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if math.Abs(res-tc.expected) > 1e-9 {
					t.Errorf("expected %v, got %v", tc.expected, res)
				}
			})
		}

		// 0 to negative power
		_, err := svc.Power(0, -2)
		if err == nil {
			t.Fatal("expected error for 0^-2, got nil")
		}
	})

	t.Run("Sqrt", func(t *testing.T) {
		tests := []struct {
			name     string
			a        float64
			expected float64
		}{
			{"perfect square", 144, 12},
			{"zero", 0, 0},
			{"fractional", 0.25, 0.5},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				res, err := svc.Sqrt(tc.a)
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if math.Abs(res-tc.expected) > 1e-9 {
					t.Errorf("expected %v, got %v", tc.expected, res)
				}
			})
		}

		// Negative square root error
		_, err := svc.Sqrt(-9)
		if err == nil {
			t.Fatal("expected error on sqrt of negative number, got nil")
		}
		calcErr, ok := err.(*CalculatorError)
		if !ok || calcErr.Code != ErrCodeNegativeSquareRoot {
			t.Errorf("expected ErrCodeNegativeSquareRoot, got %v", err)
		}
	})

	t.Run("Percentage", func(t *testing.T) {
		// Unary percentage (e.g. 50% = 0.5)
		resUnary, err := svc.Percentage(50, nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resUnary != 0.5 {
			t.Errorf("expected 0.5, got %v", resUnary)
		}

		// Binary percentage (e.g. 20% of 200 = 40)
		resBinary, err := svc.Percentage(200, ptr(20))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resBinary != 40 {
			t.Errorf("expected 40, got %v", resBinary)
		}
	})
}

func TestCalculatorService_Calculate(t *testing.T) {
	svc := NewService()

	t.Run("Valid calculations across all operations", func(t *testing.T) {
		ops := []struct {
			op       string
			a, b     *float64
			expected float64
			expr     string
		}{
			{"add", ptr(12.5), ptr(7.5), 20, "12.5 + 7.5 = 20"},
			{"subtract", ptr(20), ptr(5), 15, "20 - 5 = 15"},
			{"multiply", ptr(4), ptr(2.5), 10, "4 × 2.5 = 10"},
			{"divide", ptr(50), ptr(2), 25, "50 ÷ 2 = 25"},
			{"power", ptr(2), ptr(3), 8, "2 ^ 3 = 8"},
			{"sqrt", ptr(49), nil, 7, "√(49) = 7"},
			{"percentage", ptr(200), ptr(15), 30, "15% of 200 = 30"},
			{"percentage", ptr(75), nil, 0.75, "75% = 0.75"},
		}

		for _, tc := range ops {
			t.Run(tc.op, func(t *testing.T) {
				resp, err := svc.Calculate(CalculationRequest{
					Operation: tc.op,
					A:         tc.a,
					B:         tc.b,
				})
				if err != nil {
					t.Fatalf("unexpected error for %s: %v", tc.op, err)
				}
				if math.Abs(resp.Result-tc.expected) > 1e-9 {
					t.Errorf("expected %v, got %v", tc.expected, resp.Result)
				}
				if resp.Expression != tc.expr {
					t.Errorf("expected expr %s, got %s", tc.expr, resp.Expression)
				}
			})
		}
	})

	t.Run("Missing operands errors", func(t *testing.T) {
		missingTests := []CalculationRequest{
			{Operation: "", A: ptr(1)},
			{Operation: "add", A: nil, B: ptr(5)},
			{Operation: "add", A: ptr(10), B: nil},
			{Operation: "subtract", A: ptr(10), B: nil},
			{Operation: "multiply", A: ptr(10), B: nil},
			{Operation: "divide", A: ptr(10), B: nil},
			{Operation: "power", A: ptr(10), B: nil},
		}

		for _, tc := range missingTests {
			_, err := svc.Calculate(tc)
			if err == nil {
				t.Fatalf("expected error for request %+v", tc)
			}
		}
	})

	t.Run("Invalid operation", func(t *testing.T) {
		_, err := svc.Calculate(CalculationRequest{
			Operation: "integrate",
			A:         ptr(10),
			B:         ptr(5),
		})
		if err == nil {
			t.Fatal("expected error on invalid operation")
		}
		calcErr, ok := err.(*CalculatorError)
		if !ok || calcErr.Code != ErrCodeInvalidOperation {
			t.Errorf("expected ErrCodeInvalidOperation, got %v", err)
		}
	})

	t.Run("Overflow protection", func(t *testing.T) {
		large := math.MaxFloat64
		_, err := svc.Add(large, large)
		if err == nil {
			t.Fatal("expected overflow error on Add")
		}
		_, err = svc.Subtract(-large, large)
		if err == nil {
			t.Fatal("expected overflow error on Subtract")
		}
		_, err = svc.Multiply(large, 2)
		if err == nil {
			t.Fatal("expected overflow error on Multiply")
		}
		_, err = svc.Divide(large, 0.5)
		if err == nil {
			t.Fatal("expected overflow error on Divide")
		}
		_, err = svc.Power(10, 309)
		if err == nil {
			t.Fatal("expected overflow error on Power")
		}
	})
}
