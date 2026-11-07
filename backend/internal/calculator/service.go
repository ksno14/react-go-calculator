package calculator

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

// CalculatorError represents an error with an associated machine-readable code
type CalculatorError struct {
	Code    string
	Message string
}

func (e *CalculatorError) Error() string {
	return e.Message
}

// NewCalculatorError creates a new CalculatorError
func NewCalculatorError(code, message string) *CalculatorError {
	return &CalculatorError{
		Code:    code,
		Message: message,
	}
}

// Service defines calculator operations
type Service interface {
	Add(a, b float64) (float64, error)
	Subtract(a, b float64) (float64, error)
	Multiply(a, b float64) (float64, error)
	Divide(a, b float64) (float64, error)
	Power(a, b float64) (float64, error)
	Sqrt(a float64) (float64, error)
	Percentage(a float64, b *float64) (float64, error)
	Calculate(req CalculationRequest) (*CalculationResponse, error)
}

type calculatorService struct{}

// NewService creates a new instance of Service
func NewService() Service {
	return &calculatorService{}
}

func (s *calculatorService) Add(a, b float64) (float64, error) {
	res := cleanFloat(a + b)
	if math.IsInf(res, 0) || math.IsNaN(res) {
		return 0, NewCalculatorError(ErrCodeNumericOverflow, "Result exceeds supported numeric limits")
	}
	return res, nil
}

func (s *calculatorService) Subtract(a, b float64) (float64, error) {
	res := cleanFloat(a - b)
	if math.IsInf(res, 0) || math.IsNaN(res) {
		return 0, NewCalculatorError(ErrCodeNumericOverflow, "Result exceeds supported numeric limits")
	}
	return res, nil
}

func (s *calculatorService) Multiply(a, b float64) (float64, error) {
	res := cleanFloat(a * b)
	if math.IsInf(res, 0) || math.IsNaN(res) {
		return 0, NewCalculatorError(ErrCodeNumericOverflow, "Result exceeds supported numeric limits")
	}
	return res, nil
}

func (s *calculatorService) Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, NewCalculatorError(ErrCodeDivisionByZero, "Division by zero is undefined")
	}
	res := cleanFloat(a / b)
	if math.IsInf(res, 0) || math.IsNaN(res) {
		return 0, NewCalculatorError(ErrCodeNumericOverflow, "Result exceeds supported numeric limits")
	}
	return res, nil
}

func (s *calculatorService) Power(a, b float64) (float64, error) {
	// 0 to negative power is division by zero
	if a == 0 && b < 0 {
		return 0, NewCalculatorError(ErrCodeDivisionByZero, "Zero raised to a negative power is undefined")
	}

	res := cleanFloat(math.Pow(a, b))
	if math.IsNaN(res) {
		return 0, NewCalculatorError(ErrCodeInvalidOperation, "Exponentiation result is not a real number")
	}
	if math.IsInf(res, 0) {
		return 0, NewCalculatorError(ErrCodeNumericOverflow, "Result exceeds supported numeric limits")
	}
	return res, nil
}

func (s *calculatorService) Sqrt(a float64) (float64, error) {
	if a < 0 {
		return 0, NewCalculatorError(ErrCodeNegativeSquareRoot, "Square root of negative numbers is undefined in real arithmetic")
	}
	res := cleanFloat(math.Sqrt(a))
	if math.IsNaN(res) || math.IsInf(res, 0) {
		return 0, NewCalculatorError(ErrCodeNumericOverflow, "Result exceeds supported numeric limits")
	}
	return res, nil
}

func (s *calculatorService) Percentage(a float64, b *float64) (float64, error) {
	var res float64
	if b != nil {
		// Calculate b% of a: a * (b / 100)
		res = cleanFloat(a * (*b / 100.0))
	} else {
		// Calculate a / 100
		res = cleanFloat(a / 100.0)
	}

	if math.IsInf(res, 0) || math.IsNaN(res) {
		return 0, NewCalculatorError(ErrCodeNumericOverflow, "Result exceeds supported numeric limits")
	}
	return res, nil
}

// Calculate validates and processes any calculation request
func (s *calculatorService) Calculate(req CalculationRequest) (*CalculationResponse, error) {
	normOp := strings.ToLower(strings.TrimSpace(req.Operation))
	if normOp == "" {
		return nil, NewCalculatorError(ErrCodeInvalidOperation, "Operation must not be empty")
	}

	if req.A == nil {
		return nil, NewCalculatorError(ErrCodeMissingOperand, "Primary operand 'a' is required")
	}
	a := *req.A

	var result float64
	var err error
	var expr string

	switch normOp {
	case OpAdd:
		if req.B == nil {
			return nil, NewCalculatorError(ErrCodeMissingOperand, "Secondary operand 'b' is required for addition")
		}
		b := *req.B
		result, err = s.Add(a, b)
		expr = fmt.Sprintf("%s + %s = %s", formatNumber(a), formatNumber(b), formatNumber(result))

	case OpSubtract:
		if req.B == nil {
			return nil, NewCalculatorError(ErrCodeMissingOperand, "Secondary operand 'b' is required for subtraction")
		}
		b := *req.B
		result, err = s.Subtract(a, b)
		expr = fmt.Sprintf("%s - %s = %s", formatNumber(a), formatNumber(b), formatNumber(result))

	case OpMultiply:
		if req.B == nil {
			return nil, NewCalculatorError(ErrCodeMissingOperand, "Secondary operand 'b' is required for multiplication")
		}
		b := *req.B
		result, err = s.Multiply(a, b)
		expr = fmt.Sprintf("%s × %s = %s", formatNumber(a), formatNumber(b), formatNumber(result))

	case OpDivide:
		if req.B == nil {
			return nil, NewCalculatorError(ErrCodeMissingOperand, "Secondary operand 'b' is required for division")
		}
		b := *req.B
		result, err = s.Divide(a, b)
		expr = fmt.Sprintf("%s ÷ %s = %s", formatNumber(a), formatNumber(b), formatNumber(result))

	case OpPower:
		if req.B == nil {
			return nil, NewCalculatorError(ErrCodeMissingOperand, "Secondary operand 'b' is required for exponentiation")
		}
		b := *req.B
		result, err = s.Power(a, b)
		expr = fmt.Sprintf("%s ^ %s = %s", formatNumber(a), formatNumber(b), formatNumber(result))

	case OpSqrt:
		result, err = s.Sqrt(a)
		expr = fmt.Sprintf("√(%s) = %s", formatNumber(a), formatNumber(result))

	case OpPercentage:
		result, err = s.Percentage(a, req.B)
		if req.B != nil {
			expr = fmt.Sprintf("%s%% of %s = %s", formatNumber(*req.B), formatNumber(a), formatNumber(result))
		} else {
			expr = fmt.Sprintf("%s%% = %s", formatNumber(a), formatNumber(result))
		}

	default:
		return nil, NewCalculatorError(ErrCodeInvalidOperation, fmt.Sprintf("Unsupported operation: '%s'", req.Operation))
	}

	if err != nil {
		return nil, err
	}

	return &CalculationResponse{
		Operation:  normOp,
		A:          a,
		B:          req.B,
		Result:     result,
		Expression: expr,
	}, nil
}

// cleanFloat eliminates IEEE 754 precision artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004)
func cleanFloat(val float64) float64 {
	if math.IsNaN(val) || math.IsInf(val, 0) {
		return val
	}
	s := strconv.FormatFloat(val, 'g', 14, 64)
	parsed, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return val
	}
	return parsed
}

func formatNumber(n float64) string {
	return strconv.FormatFloat(cleanFloat(n), 'f', -1, 64)
}
