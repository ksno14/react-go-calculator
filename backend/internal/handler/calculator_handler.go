package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/react-go-calculator/backend/internal/calculator"
)

// maxRequestBodyBytes limits the allowed request payload size to 1 MB
const maxRequestBodyBytes = 1 << 20

// Handler handles HTTP requests for the calculator API
type Handler struct {
	service calculator.Service
}

// NewHandler creates a new Handler with the provided calculator service
func NewHandler(service calculator.Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers all API endpoints on the provided mux
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/health", h.HealthCheck)
	mux.HandleFunc("POST /api/v1/calculate", h.Calculate)
	mux.HandleFunc("POST /api/v1/add", h.handleBinaryOp(calculator.OpAdd))
	mux.HandleFunc("POST /api/v1/subtract", h.handleBinaryOp(calculator.OpSubtract))
	mux.HandleFunc("POST /api/v1/multiply", h.handleBinaryOp(calculator.OpMultiply))
	mux.HandleFunc("POST /api/v1/divide", h.handleBinaryOp(calculator.OpDivide))
	mux.HandleFunc("POST /api/v1/power", h.handleBinaryOp(calculator.OpPower))
	mux.HandleFunc("POST /api/v1/sqrt", h.handleUnaryOp(calculator.OpSqrt))
	mux.HandleFunc("POST /api/v1/percentage", h.handlePercentage)
}

// HealthCheck returns service health status
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	sendJSON(w, http.StatusOK, map[string]any{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// Calculate handles unified calculation requests
func (h *Handler) Calculate(w http.ResponseWriter, r *http.Request) {
	var req calculator.CalculationRequest
	if err := decodeJSON(w, r, &req); err != nil {
		sendError(w, err)
		return
	}

	resp, err := h.service.Calculate(req)
	if err != nil {
		sendError(w, err)
		return
	}

	sendJSON(w, http.StatusOK, resp)
}

func (h *Handler) handleBinaryOp(op string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req calculator.BinaryRequest
		if err := decodeJSON(w, r, &req); err != nil {
			sendError(w, err)
			return
		}

		calcReq := calculator.CalculationRequest{
			Operation: op,
			A:         req.A,
			B:         req.B,
		}

		resp, err := h.service.Calculate(calcReq)
		if err != nil {
			sendError(w, err)
			return
		}

		sendJSON(w, http.StatusOK, resp)
	}
}

func (h *Handler) handleUnaryOp(op string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req calculator.UnaryRequest
		if err := decodeJSON(w, r, &req); err != nil {
			sendError(w, err)
			return
		}

		calcReq := calculator.CalculationRequest{
			Operation: op,
			A:         req.A,
		}

		resp, err := h.service.Calculate(calcReq)
		if err != nil {
			sendError(w, err)
			return
		}

		sendJSON(w, http.StatusOK, resp)
	}
}

func (h *Handler) handlePercentage(w http.ResponseWriter, r *http.Request) {
	var req calculator.CalculationRequest
	if err := decodeJSON(w, r, &req); err != nil {
		sendError(w, err)
		return
	}
	req.Operation = calculator.OpPercentage

	resp, err := h.service.Calculate(req)
	if err != nil {
		sendError(w, err)
		return
	}

	sendJSON(w, http.StatusOK, resp)
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			return calculator.NewCalculatorError(calculator.ErrCodeInvalidJSON, "Request payload exceeds maximum allowed size of 1 MB")
		}
		return calculator.NewCalculatorError(calculator.ErrCodeInvalidJSON, "Malformed or invalid JSON request body")
	}

	return nil
}

func sendJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func sendError(w http.ResponseWriter, err error) {
	code := "BAD_REQUEST"
	if calcErr, ok := err.(*calculator.CalculatorError); ok {
		code = calcErr.Code
	}

	sendJSON(w, http.StatusBadRequest, calculator.ErrorResponse{
		Error: err.Error(),
		Code:  code,
	})
}
