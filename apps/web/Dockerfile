# Dockerfile for frontend web client
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY . .
RUN bun install
RUN bun run build --filter=web

# Use light nginx to serve built static assets
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
