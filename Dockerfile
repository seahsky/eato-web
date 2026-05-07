# =============================================================================
# Dockerfile for Eato API (Next.js standalone, API-only)
# Builds the API surface (no web frontend) and serves it on port 8080.
# Build context is filtered by .dockerignore — iOS, docs, and local env files
# never enter the image.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

# OpenSSL is needed by the Prisma query engine
RUN apk add --no-cache openssl

WORKDIR /api

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Copy only the files needed to build the API. Everything not listed here
# (ios/, docs/, .git/, env backups, etc.) stays out of the image.
COPY src ./src
COPY next.config.ts tsconfig.json ./

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# OpenSSL for Prisma; curl for the HEALTHCHECK probe
RUN apk add --no-cache openssl curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Next.js standalone output: self-contained server.js + traced node_modules.
COPY --from=build /api/.next/standalone ./
COPY --from=build /api/.next/static ./.next/static

# Prisma client + engines aren't always traced into standalone; copy explicitly.
COPY --from=build /api/prisma ./prisma
COPY --from=build /api/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /api/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/rest/health || exit 1

CMD ["node", "server.js"]
