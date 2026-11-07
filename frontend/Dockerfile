# Multi-stage Dockerfile for React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Optimize layer caching and guarantee deterministic builds
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx runtime stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
