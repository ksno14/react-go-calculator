package calculator

// Supported operations
const (
	OpAdd        = "add"
	OpSubtract   = "subtract"
	OpMultiply   = "multiply"
	OpDivide     = "divide"
	OpPower      = "power"
	OpSqrt       = "sqrt"
	OpPercentage = "percentage"
)

// Error codes
const (
	ErrCodeInvalidOperation   = "INVALID_OPERATION"
	ErrCodeMissingOperand     = "MISSING_OPERAND"
	ErrCodeDivisionByZero     = "DIVISION_BY_ZERO"
	ErrCodeNegativeSquareRoot = "NEGATIVE_SQUARE_ROOT"
	ErrCodeNumericOverflow    = "NUMERIC_OVERFLOW"
	ErrCodeInvalidJSON        = "INVALID_JSON"
)

// CalculationRequest represents a generic calculation payload
type CalculationRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b,omitempty"`
}

// BinaryRequest represents standard two-operand requests
type BinaryRequest struct {
	A *float64 `json:"a"`
	B *float64 `json:"b"`
}

// UnaryRequest represents single-operand requests (such as sqrt)
type UnaryRequest struct {
	A *float64 `json:"a"`
}

// CalculationResponse represents the result of an arithmetic calculation
type CalculationResponse struct {
	Operation  string   `json:"operation"`
	A          float64  `json:"a"`
	B          *float64 `json:"b,omitempty"`
	Result     float64  `json:"result"`
	Expression string   `json:"expression"`
}

// ErrorResponse represents structured error messages returned to the client
type ErrorResponse struct {
	Error string `json:"error"`
	Code  string `json:"code"`
}
