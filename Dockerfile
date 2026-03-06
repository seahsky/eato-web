# =============================================================================
# Dockerfile for Next.js App
# Builds and serves the Next.js application on port 8080
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build Next.js
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

# Install OpenSSL for Prisma query engine
RUN apk add --no-cache openssl

WORKDIR /api

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# Install OpenSSL for Prisma query engine and curl for health checks
RUN apk add --no-cache openssl curl

WORKDIR /app

# Copy Next.js build artifacts
COPY --from=build /api/.next ./.next
COPY --from=build /api/node_modules ./node_modules
COPY --from=build /api/package.json ./
COPY --from=build /api/public ./public
COPY --from=build /api/prisma ./prisma

# Set production environment
ENV NODE_ENV=production

# Expose port 8080
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/rest/health || exit 1

# Start Next.js
CMD ["node_modules/.bin/next", "start", "-p", "8080"]
