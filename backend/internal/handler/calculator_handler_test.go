package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/react-go-calculator/backend/internal/calculator"
)

func setupTestServer() http.Handler {
	svc := calculator.NewService()
	h := NewHandler(svc)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	// Add panic route for recovery testing
	mux.HandleFunc("GET /api/v1/panic", func(w http.ResponseWriter, r *http.Request) {
		panic("simulated server panic")
	})

	return LoggingMiddleware(RecoveryMiddleware(CORSMiddleware(mux)))
}

func TestHealthCheck(t *testing.T) {
	ts := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	w := httptest.NewRecorder()

	ts.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if body["status"] != "healthy" {
		t.Errorf("expected status healthy, got %v", body["status"])
	}
}

func TestCalculateEndpoint(t *testing.T) {
	ts := setupTestServer()

	t.Run("Valid addition", func(t *testing.T) {
		reqBody := `{"operation":"add","a":15,"b":25}`
		req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		ts.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
		}

		var resp calculator.CalculationResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode json: %v", err)
		}
		if resp.Result != 40 {
			t.Errorf("expected 40, got %v", resp.Result)
		}
	})

	t.Run("Division by zero", func(t *testing.T) {
		reqBody := `{"operation":"divide","a":10,"b":0}`
		req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		ts.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", w.Code)
		}

		var errResp calculator.ErrorResponse
		if err := json.Unmarshal(w.Body.Bytes(), &errResp); err != nil {
			t.Fatalf("failed to decode error json: %v", err)
		}
		if errResp.Code != calculator.ErrCodeDivisionByZero {
			t.Errorf("expected error code %s, got %s", calculator.ErrCodeDivisionByZero, errResp.Code)
		}
	})

	t.Run("Negative square root", func(t *testing.T) {
		reqBody := `{"operation":"sqrt","a":-16}`
		req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		ts.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", w.Code)
		}

		var errResp calculator.ErrorResponse
		if err := json.Unmarshal(w.Body.Bytes(), &errResp); err != nil {
			t.Fatalf("failed to decode error json: %v", err)
		}
		if errResp.Code != calculator.ErrCodeNegativeSquareRoot {
			t.Errorf("expected code %s, got %s", calculator.ErrCodeNegativeSquareRoot, errResp.Code)
		}
	})

	t.Run("Malformed JSON", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(`{invalid json`))
		w := httptest.NewRecorder()

		ts.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("Unknown JSON fields rejected", func(t *testing.T) {
		reqBody := `{"operation":"add","a":10,"b":5,"unexpected_field":"malicious"}`
		req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(reqBody))
		w := httptest.NewRecorder()

		ts.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400 for unknown field, got %d", w.Code)
		}
	})
}

func TestGranularEndpoints(t *testing.T) {
	ts := setupTestServer()

	endpoints := []struct {
		url      string
		body     string
		expected float64
	}{
		{"/api/v1/add", `{"a":20,"b":30}`, 50},
		{"/api/v1/subtract", `{"a":50,"b":15}`, 35},
		{"/api/v1/multiply", `{"a":6,"b":7}`, 42},
		{"/api/v1/divide", `{"a":80,"b":4}`, 20},
		{"/api/v1/power", `{"a":3,"b":4}`, 81},
		{"/api/v1/sqrt", `{"a":81}`, 9},
		{"/api/v1/percentage", `{"a":200,"b":15}`, 30},
	}

	for _, ep := range endpoints {
		t.Run(ep.url, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, ep.url, bytes.NewBufferString(ep.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			ts.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
			}

			var resp calculator.CalculationResponse
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
			if resp.Result != ep.expected {
				t.Errorf("expected %v, got %v", ep.expected, resp.Result)
			}
		})
	}

	t.Run("Granular endpoints errors", func(t *testing.T) {
		// Malformed body
		req := httptest.NewRequest(http.MethodPost, "/api/v1/add", bytes.NewBufferString(`invalid`))
		w := httptest.NewRecorder()
		ts.ServeHTTP(w, req)
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", w.Code)
		}

		// Division by zero on granular endpoint
		reqDivZero := httptest.NewRequest(http.MethodPost, "/api/v1/divide", bytes.NewBufferString(`{"a":10,"b":0}`))
		wDivZero := httptest.NewRecorder()
		ts.ServeHTTP(wDivZero, reqDivZero)
		if wDivZero.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for division by zero, got %d", wDivZero.Code)
		}

		// Malformed body on unary endpoint
		reqSqrtBad := httptest.NewRequest(http.MethodPost, "/api/v1/sqrt", bytes.NewBufferString(`invalid`))
		wSqrtBad := httptest.NewRecorder()
		ts.ServeHTTP(wSqrtBad, reqSqrtBad)
		if wSqrtBad.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", wSqrtBad.Code)
		}

		// Negative sqrt on granular endpoint
		reqSqrtNeg := httptest.NewRequest(http.MethodPost, "/api/v1/sqrt", bytes.NewBufferString(`{"a":-25}`))
		wSqrtNeg := httptest.NewRecorder()
		ts.ServeHTTP(wSqrtNeg, reqSqrtNeg)
		if wSqrtNeg.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", wSqrtNeg.Code)
		}

		// Percentage malformed
		reqPercBad := httptest.NewRequest(http.MethodPost, "/api/v1/percentage", bytes.NewBufferString(`invalid`))
		wPercBad := httptest.NewRecorder()
		ts.ServeHTTP(wPercBad, reqPercBad)
		if wPercBad.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", wPercBad.Code)
		}
	})
}

func TestCORS(t *testing.T) {
	ts := setupTestServer()

	req := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
	w := httptest.NewRecorder()

	ts.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected status 204 for OPTIONS preflight, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("missing CORS header")
	}

	// Test with specific origin
	t.Setenv("ALLOWED_ORIGINS", "http://localhost:3000,http://app.example.com")
	configuredServer := setupTestServer()

	reqOrigin := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
	reqOrigin.Header.Set("Origin", "http://localhost:3000")
	wOrigin := httptest.NewRecorder()

	configuredServer.ServeHTTP(wOrigin, reqOrigin)

	if wOrigin.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Errorf("expected allowed origin http://localhost:3000, got '%s'", wOrigin.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestRecoveryMiddleware(t *testing.T) {
	ts := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/panic", nil)
	w := httptest.NewRecorder()

	ts.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500 on panic recovery, got %d", w.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body["code"] != "INTERNAL_SERVER_ERROR" {
		t.Errorf("expected code INTERNAL_SERVER_ERROR, got %s", body["code"])
	}
}
