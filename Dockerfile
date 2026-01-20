# =============================================================================
# Multi-stage Dockerfile for Flutter + Next.js Monorepo
# Serves Flutter web via Nginx, proxies /api/* to Next.js
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build Flutter Web App
# -----------------------------------------------------------------------------
FROM ghcr.io/cirruslabs/flutter:stable AS flutter-build
WORKDIR /app

# Copy Flutter client source
COPY apps/client/ ./

# Firebase config build args (Zeabur passes these automatically)
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG FIREBASE_VAPID_KEY
ARG CLERK_PUBLISHABLE_KEY

# Export ARGs as ENV for the shell script
ENV FIREBASE_API_KEY=$FIREBASE_API_KEY \
    FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN \
    FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
    FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET \
    FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID \
    FIREBASE_APP_ID=$FIREBASE_APP_ID \
    FIREBASE_VAPID_KEY=$FIREBASE_VAPID_KEY

# Generate firebase config, build Flutter web, copy config to output
RUN chmod +x scripts/generate-firebase-config.sh && \
    ./scripts/generate-firebase-config.sh && \
    flutter build web --release \
      --dart-define=CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY \
      --dart-define=API_BASE_URL= \
      --dart-define=FIREBASE_VAPID_KEY=$FIREBASE_VAPID_KEY && \
    cp web/firebase-config.js build/web/

# -----------------------------------------------------------------------------
# Stage 2: Build Next.js API
# -----------------------------------------------------------------------------
FROM node:20-alpine AS nextjs-build
WORKDIR /app

# Install dependencies first (for better caching)
COPY apps/api/package*.json ./
RUN npm ci

# Copy source and build
COPY apps/api/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy Next.js build artifacts
COPY --from=nextjs-build /app/.next ./.next
COPY --from=nextjs-build /app/node_modules ./node_modules
COPY --from=nextjs-build /app/package.json ./
COPY --from=nextjs-build /app/public ./public
COPY --from=nextjs-build /app/prisma ./prisma

# Copy Flutter build to Nginx html directory
COPY --from=flutter-build /app/build/web /usr/share/nginx/html

# Copy Nginx config and start script
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose the Nginx port (Zeabur expects 8080)
EXPOSE 8080

# Start both services
CMD ["/start.sh"]
