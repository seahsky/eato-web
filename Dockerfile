# =============================================================================
# Multi-stage Dockerfile for Vue + Next.js Monorepo
# Serves Vue (Vite) web via Nginx, proxies /api/* to Next.js
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build Vue Web App + Next.js API
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

# Install OpenSSL for Prisma query engine
RUN apk add --no-cache openssl

# ---- Build Vue (Vite) Web App ----
WORKDIR /web

# Vite env vars (injected at build time)
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_BASE_URL=
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

COPY apps/web/package.json apps/web/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY apps/web/ ./

# Generate firebase-config.js for the service worker
RUN echo "const firebaseConfig = { \
  apiKey: '${VITE_FIREBASE_API_KEY}', \
  authDomain: '${VITE_FIREBASE_AUTH_DOMAIN}', \
  projectId: '${VITE_FIREBASE_PROJECT_ID}', \
  storageBucket: '${VITE_FIREBASE_STORAGE_BUCKET}', \
  messagingSenderId: '${VITE_FIREBASE_MESSAGING_SENDER_ID}', \
  appId: '${VITE_FIREBASE_APP_ID}' \
};" > public/firebase-config.js

RUN pnpm build

# ---- Build Next.js API ----
WORKDIR /api

COPY apps/api/package*.json ./
COPY apps/api/prisma ./prisma
RUN npm ci
COPY apps/api/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# Install nginx, OpenSSL for Prisma query engine, and curl for health checks
RUN apk add --no-cache nginx openssl curl

# Create nginx log directory and set permissions
RUN mkdir -p /var/log/nginx && \
    mkdir -p /run/nginx && \
    chown -R node:node /var/log/nginx /run/nginx

WORKDIR /app

# Copy Next.js build artifacts
COPY --from=build /api/.next ./.next
COPY --from=build /api/node_modules ./node_modules
COPY --from=build /api/package.json ./
COPY --from=build /api/public ./public
COPY --from=build /api/prisma ./prisma

# Copy Vite build to Nginx html directory
COPY --from=build /web/dist /usr/share/nginx/html

# Copy Nginx config and start script
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Set production environment
ENV NODE_ENV=production

# Expose the Nginx port (Zeabur expects 8080)
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/rest/health || exit 1

# Start both services
CMD ["/start.sh"]
