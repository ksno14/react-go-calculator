# Multi-stage Dockerfile for Go backend
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Optimize Docker layer caching: fetch dependencies first
COPY go.mod go.sum* ./
RUN go mod download

# Copy source files
COPY . .

# Build statically compiled, stripped binary for Linux
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-w -s" -o /app/calculator-api ./cmd/api

# Minimal production image
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S -g 10001 appgroup \
    && adduser -S -u 10001 -G appgroup appuser

WORKDIR /app
COPY --from=builder --chown=appuser:appgroup /app/calculator-api /app/calculator-api

# Run as non-root user for container security
USER appuser

EXPOSE 8080

ENV PORT=8080

CMD ["/app/calculator-api"]
