# Production dockerfile for API
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/zod-schemas/package.json ./packages/zod-schemas/

# Install dependencies in non-root environment
RUN bun install --production --no-frozen-lockfile

# Builder layer
FROM base AS builder
COPY . .
RUN bun install --no-frozen-lockfile
RUN bun run build --filter=api
RUN bun x prisma generate --schema=apps/api/prisma/schema.prisma

# Runner layer
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["sh", "-c", "bun x prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && bun run apps/api/dist/index.js"]
