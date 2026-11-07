# Full-Stack Cloud Calculator (React + Go)

A modern full-stack calculator application featuring a Go REST API microservice and a responsive React (TypeScript) frontend. Designed with clean architecture, domain-driven boundaries, comprehensive edge-case validation, persistent calculation history, keyboard navigation, full test coverage, and multi-stage Docker containerization.

---

## Table of Contents
- [Architecture & Design Rationale](#architecture--design-rationale)
- [Features & Supported Operations](#features--supported-operations)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Option 1: Run with Docker Compose (Recommended)](#option-1-run-with-docker-compose-recommended)
  - [Option 2: Run Locally (Go + Node)](#option-2-run-locally-go--node)
- [Running Tests & Coverage Report](#running-tests--coverage-report)
  - [Backend Test Suite & Coverage](#backend-test-suite--coverage)
  - [Frontend Test Suite](#frontend-test-suite)
- [Project Directory Structure](#project-directory-structure)
- [Edge Case Handling](#edge-case-handling)

---

## Architecture & Design Rationale

```
+-------------------------------------------------------------+
|                React TypeScript Client (Vite)               |
|  - Keypad & Display Components                              |
|  - useCalculator Custom Hook (State, Keyboard, History)     |
|  - LocalStorage Persistence                                 |
+------------------------------+------------------------------+
                               |  HTTP / REST (JSON)
                               v
+-------------------------------------------------------------+
|                    Go REST Microservice                     |
|  +-------------------------------------------------------+  |
|  | Middleware Stack: CORS, Panic Recovery, Request Log   |  |
|  +-------------------------------------------------------+  |
|  | Handlers (net/http): Request Validation, JSON Decode  |  |
|  +-------------------------------------------------------+  |
|  | Domain Engine: Add, Sub, Mul, Div, Pow, Sqrt, Perc    |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

### Key Architectural Decisions
1. **Clean Separation of Concerns**:
   - The Go microservice separates transport concerns (`internal/handler`) from arithmetic domain logic (`internal/calculator/service.go`). The calculator service has zero dependency on HTTP or routing primitives, making it 100% testable in pure unit isolation.
2. **Standard Library First in Go**:
   - Built using Go 1.22+ standard library `net/http` router with pattern matching (`POST /api/v1/...`) and structured logging with `log/slog`. Avoids heavy framework bloat, guarantees maximum throughput, and eliminates third-party CVE risks.
3. **Decoupled Frontend State**:
   - Calculator interaction logic, operand stack, operator precedence, keyboard & numpad event listeners, and API synchronization are encapsulated within a standalone custom hook (`useCalculator.ts`).
4. **Resilient Error & Security Modeling**:
   - Every domain error returns a typed error containing a machine-readable code (e.g., `DIVISION_BY_ZERO`, `NEGATIVE_SQUARE_ROOT`, `NUMERIC_OVERFLOW`) accompanied by a clear human-readable description.
   - Enforces a 1 MB payload size limit (`http.MaxBytesReader`) and strict JSON schema decoding (`DisallowUnknownFields`).
5. **Multi-Stage Containerization & Hardening**:
   - Minimal attack surface: The Go backend compiles to a statically linked, stripped binary packaged in an Alpine runtime container executed by an unprivileged non-root user (`appuser:10001`). The React frontend is built with reproducible dependencies (`npm ci`) into static assets served via Nginx.
6. **Automated CI/CD**:
   - GitHub Actions pipeline validating Go tests, static analysis (`go vet`), test coverage, React typechecking (`tsc`), Vitest unit tests, and Docker container builds on every push and pull request.

---

## Features & Supported Operations

### Basic Operations
- **Addition (`+`)**: Computes $a + b$
- **Subtraction (`−`)**: Computes $a - b$
- **Multiplication (`×`)**: Computes $a \times b$
- **Division (`÷`)**: Computes $a / b$ (with zero division prevention)

### Advanced & Optional Operations
- **Exponentiation (`xʸ`)**: Computes $a^b$ (handles fractional, negative, and zero powers)
- **Square Root (`√x`)**: Computes $\sqrt{a}$ as an instant unary operation (rejects negative numbers)
- **Percentage (`%`)**:
  - Unary mode: $a / 100$
  - Binary mode: $b\%$ of $a = a \times (b / 100)$

### User Experience Enhancements
- **Interactive Calculation History**: Sliding history tape recording previous calculations. Click any past calculation to immediately recall its result into the current active operand.
- **Physical Keyboard & Numpad Navigation**: Full keyboard input support (number keys `0-9`, Numpad digits, `.`, operators `+`, `-`, `*`, `/`, `^`, `%`, `Enter` / `=` to evaluate, `Backspace` to delete, `Esc` to clear).
- **One-Click Clipboard Copy**: Copy calculation results directly to the clipboard with animated confirmation feedback.
- **Screen Reader Accessibility (A11y)**: Configured with `aria-live="polite"` regions so assistive technology dynamically reads calculation updates.
- **Backend Status Monitor**: Real-time heartbeat checking Go backend connectivity.
- **Responsive Layout**: Designed for mobile touch screens, tablets, and desktop workstations.

---

## API Reference

### Base URL
- Local Dev: `http://localhost:8080/api/v1`
- Docker: Reverse-proxied via Nginx at `/api/v1`

### Endpoints Overview

| Method | Endpoint | Description | Request Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status | None |
| `POST` | `/api/v1/calculate` | Unified calculation endpoint | `{"operation": "add", "a": 10, "b": 5}` |
| `POST` | `/api/v1/add` | Dedicated addition | `{"a": 10, "b": 5}` |
| `POST` | `/api/v1/subtract` | Dedicated subtraction | `{"a": 20, "b": 8}` |
| `POST` | `/api/v1/multiply` | Dedicated multiplication | `{"a": 6, "b": 7}` |
| `POST` | `/api/v1/divide` | Dedicated division | `{"a": 100, "b": 4}` |
| `POST` | `/api/v1/power` | Dedicated exponentiation | `{"a": 2, "b": 8}` |
| `POST` | `/api/v1/sqrt` | Dedicated square root | `{"a": 144}` |
| `POST` | `/api/v1/percentage`| Dedicated percentage | `{"a": 200, "b": 15}` or `{"a": 50}` |

### API Usage Examples (`curl`)

#### 1. Health Check
```bash
curl -X GET http://localhost:8080/api/v1/health
```
**Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-11-02T22:15:00Z"
}
```

#### 2. Unified Calculation (`add`)
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"add","a":12.5,"b":7.5}'
```
**Response (`200 OK`)**:
```json
{
  "operation": "add",
  "a": 12.5,
  "b": 7.5,
  "result": 20,
  "expression": "12.5 + 7.5 = 20"
}
```

#### 3. Exponentiation (`power`)
```bash
curl -X POST http://localhost:8080/api/v1/power \
  -H "Content-Type: application/json" \
  -d '{"a":2,"b":8}'
```
**Response (`200 OK`)**:
```json
{
  "operation": "power",
  "a": 2,
  "b": 8,
  "result": 256,
  "expression": "2 ^ 8 = 256"
}
```

#### 4. Square Root (`sqrt`)
```bash
curl -X POST http://localhost:8080/api/v1/sqrt \
  -H "Content-Type: application/json" \
  -d '{"a":144}'
```
**Response (`200 OK`)**:
```json
{
  "operation": "sqrt",
  "a": 144,
  "result": 12,
  "expression": "√(144) = 12"
}
```

#### 5. Error Handling: Division by Zero
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"divide","a":10,"b":0}'
```
**Response (`400 Bad Request`)**:
```json
{
  "error": "Division by zero is undefined",
  "code": "DIVISION_BY_ZERO"
}
```

#### 6. Error Handling: Negative Square Root
```bash
curl -X POST http://localhost:8080/api/v1/sqrt \
  -H "Content-Type: application/json" \
  -d '{"a":-49}'
```
**Response (`400 Bad Request`)**:
```json
{
  "error": "Square root of negative numbers is undefined in real arithmetic",
  "code": "NEGATIVE_SQUARE_ROOT"
}
```

---

## Getting Started

### Option 1: Run with Docker Compose (Recommended)
Prerequisites: [Docker Desktop](https://www.docker.com/) installed and running.

1. Build and run both backend and frontend containers:
   ```bash
   docker compose up --build
   ```
2. Open your browser:
   - Frontend UI: [http://localhost:3000](http://localhost:3000)
   - Backend API Direct: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
3. Stop services:
   ```bash
   docker compose down
   ```

### Option 2: Run Locally (Go + Node)

#### Prerequisites
- Go 1.22+
- Node.js 18+ and npm

#### 1. Start Go Backend
```bash
cd backend
go run cmd/api/main.go
```
The server will start on port `8080`: `http://localhost:8080`.

#### 2. Start React Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start on port `3000`: `http://localhost:3000`.

---

## Running Tests & Coverage Report

### Backend Test Suite & Coverage

The Go backend features table-driven unit tests and integration tests covering operations, edge cases, HTTP status codes, CORS headers, and panic recovery middleware.

To execute tests and view statement coverage:
```bash
cd backend
go test -v -coverprofile=coverage.out ./internal/...
go tool cover -func=coverage.out
```

### Frontend Test Suite

Frontend unit tests use Vitest and React Testing Library, verifying hook state transitions, decimal input, sign toggling, backspace, API mocking, and component rendering.

To run the frontend test suite:
```bash
cd frontend
npm test
```
**Results**:
- `src/tests/useCalculator.test.ts`: 8 passed
- `src/tests/Calculator.test.tsx`: 4 passed
- **Total: 12 tests passed**

---

## Project Directory Structure

```
react-go-calculator/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go                 # Application bootstrap & graceful shutdown
│   ├── internal/
│   │   ├── calculator/
│   │   │   ├── models.go               # Domain request/response models & error codes
│   │   │   ├── service.go              # Pure arithmetic domain service
│   │   │   └── service_test.go         # Table-driven unit tests
│   │   └── handler/
│   │       ├── calculator_handler.go   # HTTP handlers and input validation
│   │       ├── calculator_handler_test.go # httptest integration tests
│   │       └── middleware.go           # CORS, Logging, Panic recovery
│   ├── go.mod
│   └── Dockerfile                      # Multi-stage minimal Go image
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calculator.tsx          # Calculator shell & keyboard listener
│   │   │   ├── Display.tsx             # Dual-row responsive screen
│   │   │   ├── Keypad.tsx              # Grid of operation buttons
│   │   │   ├── HistoryTape.tsx         # Expandable calculation history tape
│   │   │   └── ErrorAlert.tsx          # Styled dismissible error banner
│   │   ├── hooks/
│   │   │   └── useCalculator.ts        # Custom hook for calculator state machine
│   │   ├── services/
│   │   │   └── api.ts                  # Typed HTTP client & error normalizer
│   │   ├── types/
│   │   │   └── calculator.ts           # TypeScript interfaces & types
│   │   ├── tests/
│   │   │   ├── setup.ts                # Test environment setup
│   │   │   ├── useCalculator.test.ts   # Hook unit tests
│   │   │   └── Calculator.test.tsx     # UI component integration tests
│   │   ├── App.tsx                     # Top-level application view
│   │   ├── main.tsx                    # React DOM entry point
│   │   └── index.css                   # Tailwind CSS imports & animations
│   ├── nginx.conf                      # Nginx reverse proxy configuration
│   ├── Dockerfile                      # Multi-stage Nginx + Vite image
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml                  # Full-stack container orchestration
├── .gitignore
├── .dockerignore
└── README.md                           # Documentation
```

---

## Edge Case Handling

| Edge Case | Backend Action | Frontend Action |
| :--- | :--- | :--- |
| **Division by zero** | Returns `400 Bad Request` with `code: "DIVISION_BY_ZERO"` | Displays alert: *"Division by zero is undefined"*, preserves input |
| **Negative square root** | Returns `400 Bad Request` with `code: "NEGATIVE_SQUARE_ROOT"` | Displays alert: *"Square root of negative numbers is undefined in real arithmetic"* |
| **Zero base with negative power** | Returns `400 Bad Request` with `code: "DIVISION_BY_ZERO"` | Displays alert: *"Zero raised to a negative power is undefined"* |
| **Numeric Overflow / Infinity** | Returns `400 Bad Request` with `code: "NUMERIC_OVERFLOW"` | Displays alert: *"Result exceeds supported numeric limits"* |
| **Malformed JSON / Missing Params** | Returns `400 Bad Request` with `code: "INVALID_JSON"` or `MISSING_OPERAND"` | Surfaces error message and halts evaluation |
| **Network Unreachable** | N/A | Surfaces alert: *"Cannot connect to backend calculator service"*, status badge indicates offline |
