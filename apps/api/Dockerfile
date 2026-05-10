# Production dockerfile for API
FROM oven/bun:1-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# Copy dependency files
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/zod-schemas/package.json ./packages/zod-schemas/

# Install dependencies in non-root environment
RUN bun install --production --no-frozen-lockfile

# Builder layer
FROM base AS builder
COPY . .
RUN bun install --no-frozen-lockfile
RUN cd apps/api && bun run prisma:generate
RUN bun run build --filter=api

# Runner layer
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["sh", "-c", "cd apps/api && bun run prisma:migrate && bun run dist/index.js"]
