# Eato

A mobile-first calorie tracking app for couples to reach their health goals together.

## Monorepo Structure

```
eato/
├── apps/
│   ├── api/                   # Next.js backend (tRPC + REST API)
│   └── client/                # Flutter app (iOS, Android, Web)
├── Dockerfile                 # Multi-stage production build
├── nginx.conf                 # Nginx reverse proxy configuration
├── start.sh                   # Container startup script
└── docs/                      # Documentation
```

## Features

- **Calorie Tracking**: Log meals with FatSecret database search, barcode scanning, or manual entry
- **Recipe Builder**: Create custom recipes with automatic per-100g nutrition calculation
- **BMR Calculator**: Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation
- **Partner Mode**: Link accounts with your partner to track progress together
- **Partner Food Logging**: Log food for your partner (with approval workflow)
- **Gamification**: Streaks, achievements, partner shields, and rest days
- **Push Notifications**: Meal reminders and partner activity alerts
- **Daily & Weekly Stats**: Visualize progress with charts and summaries
- **Cross-Platform**: Native iOS/Android apps + Progressive Web App

## Tech Stack

### Backend (apps/api/)
- Next.js 16 (App Router)
- tRPC + trpc-openapi (REST API)
- Prisma + MongoDB
- Clerk Authentication
- Web Push + Expo Push Notifications

### Mobile (apps/client/)
- Flutter 3
- Riverpod (State Management)
- GoRouter (Navigation)
- Dio (HTTP Client)
- Firebase Cloud Messaging

## Getting Started

### Prerequisites

- Node.js 20+
- Flutter 3.24+
- MongoDB database (MongoDB Atlas recommended)
- Clerk account (authentication)
- FatSecret API credentials (food database)
- Firebase project (push notifications)

### Backend Setup

1. **Navigate to API directory:**
   ```bash
   cd apps/api
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables)).

3. **Generate Prisma client and push schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Flutter Setup

1. **Navigate to client directory:**
   ```bash
   cd apps/client
   flutter pub get
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **Generate code (Riverpod, JSON serialization):**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Run on device/simulator:**
   ```bash
   flutter run                  # Default device
   flutter run -d chrome        # Web
   flutter run -d ios           # iOS simulator
   flutter run -d android       # Android emulator
   ```

## API Documentation

The backend exposes both tRPC and REST endpoints:

- **tRPC**: `/api/trpc/[procedure]`
- **REST (OpenAPI)**: `/api/rest/[path]`
- **OpenAPI Spec**: `/api/openapi.json`
- **Health Check**: `/api/rest/health`

## Environment Variables

### Backend (apps/api/.env.local)

```env
# Database
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/eato"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# FatSecret API (food database)
FATSECRET_CLIENT_ID="your_client_id"
FATSECRET_CLIENT_SECRET="your_client_secret"

# Google Cloud Translation (optional)
GOOGLE_TRANSLATE_API_KEY="your_api_key"

# Web Push (VAPID keys - generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_public_key"
VAPID_PRIVATE_KEY="your_private_key"

# Expo Push (optional)
EXPO_ACCESS_TOKEN="your_access_token"
```

### Flutter (apps/client/.env.local)

```env
# Firebase Configuration
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_VAPID_KEY=BLxx...

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_...

# API URL
API_BASE_URL=http://localhost:3000
```

## Development Commands

### Backend (apps/api/)

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma db push   # Push schema changes to database
```

### Flutter (apps/client/)

```bash
flutter run              # Run on default device
flutter run -d chrome    # Run on web
flutter run -d ios       # Run on iOS
flutter run -d android   # Run on Android
flutter analyze          # Run static analysis
flutter test             # Run tests
flutter build apk        # Build Android APK
flutter build ios        # Build iOS app
flutter build web        # Build web app
```

---

## Production Deployment

### Docker Deployment

The application uses a multi-stage Dockerfile that:
1. Builds Flutter web app with Firebase/Clerk configuration
2. Builds Next.js API with Prisma client
3. Creates a production container with Nginx + Node.js

#### Build the Docker Image

```bash
# Build with required build-time arguments
docker build \
  --build-arg FIREBASE_API_KEY="your_firebase_api_key" \
  --build-arg FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  --build-arg FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg FIREBASE_STORAGE_BUCKET="your-project.appspot.com" \
  --build-arg FIREBASE_MESSAGING_SENDER_ID="123456789" \
  --build-arg FIREBASE_APP_ID="1:123456789:web:abc123" \
  --build-arg FIREBASE_VAPID_KEY="your_vapid_key" \
  --build-arg CLERK_PUBLISHABLE_KEY="pk_live_..." \
  --build-arg DEBUG=false \
  -t eato:latest .
```

#### Run the Container

```bash
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL="mongodb+srv://..." \
  -e CLERK_SECRET_KEY="sk_live_..." \
  -e CLERK_WEBHOOK_SECRET="whsec_..." \
  -e FATSECRET_CLIENT_ID="..." \
  -e FATSECRET_CLIENT_SECRET="..." \
  -e GOOGLE_TRANSLATE_API_KEY="..." \
  -e NEXT_PUBLIC_VAPID_PUBLIC_KEY="..." \
  -e VAPID_PRIVATE_KEY="..." \
  --name eato \
  eato:latest
```

#### Docker Compose (Recommended)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  eato:
    build:
      context: .
      args:
        FIREBASE_API_KEY: ${FIREBASE_API_KEY}
        FIREBASE_AUTH_DOMAIN: ${FIREBASE_AUTH_DOMAIN}
        FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
        FIREBASE_STORAGE_BUCKET: ${FIREBASE_STORAGE_BUCKET}
        FIREBASE_MESSAGING_SENDER_ID: ${FIREBASE_MESSAGING_SENDER_ID}
        FIREBASE_APP_ID: ${FIREBASE_APP_ID}
        FIREBASE_VAPID_KEY: ${FIREBASE_VAPID_KEY}
        CLERK_PUBLISHABLE_KEY: ${CLERK_PUBLISHABLE_KEY}
        DEBUG: "false"
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - CLERK_WEBHOOK_SECRET=${CLERK_WEBHOOK_SECRET}
      - FATSECRET_CLIENT_ID=${FATSECRET_CLIENT_ID}
      - FATSECRET_CLIENT_SECRET=${FATSECRET_CLIENT_SECRET}
      - GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY}
      - NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}
      - VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/rest/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

Run with:
```bash
docker-compose up -d
```

### Cloud Platform Deployment

#### Zeabur / Railway / Render

These platforms automatically detect the Dockerfile and build the image. Configure:

1. **Build Arguments**: Set as build-time environment variables
2. **Runtime Variables**: Set as environment variables
3. **Port**: 8080 (configured in Dockerfile)

#### Zeabur-Specific

Zeabur automatically passes build arguments as environment variables during build. Ensure all `FIREBASE_*` and `CLERK_PUBLISHABLE_KEY` variables are set in the Zeabur dashboard.

### Health Monitoring

The application exposes a health check endpoint:

```bash
curl http://localhost:8080/api/rest/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": "2h 30m 15s"
}
```

Use this endpoint for:
- Container health checks
- Load balancer health probes
- Uptime monitoring services

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Container (Port 8080)                 │
├─────────────────────────────────────────────────────────┤
│                         Nginx                            │
│  ┌─────────────────────┐    ┌─────────────────────────┐ │
│  │   Static Files (/)   │    │  Proxy /api/* to :3000  │ │
│  │   Flutter Web App    │    │                         │ │
│  └─────────────────────┘    └─────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    Next.js (Port 3000)                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  tRPC API  │  REST API  │  Webhooks  │  Cron Jobs   │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    Prisma ORM                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              MongoDB Atlas (External)                │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Security Considerations

1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Clerk Webhook Verification**: The webhook endpoint verifies signatures using `CLERK_WEBHOOK_SECRET`
3. **CORS**: Nginx handles CORS headers; configure allowed origins in production
4. **HTTPS**: Use a reverse proxy (Cloudflare, AWS ALB) for SSL termination
5. **Rate Limiting**: Consider adding rate limiting at the Nginx or API level

### Troubleshooting

#### Container Startup Issues

1. Check logs: `docker logs eato`
2. Verify Next.js started: Look for "Next.js API is ready!" in logs
3. Check Prisma generation: Ensure `DATABASE_URL` is accessible

#### API Not Responding

1. Check health endpoint: `curl http://localhost:8080/api/rest/health`
2. Verify Nginx proxy: Check `/var/log/nginx/error.log` inside container
3. Check Next.js: `docker exec eato curl http://127.0.0.1:3000/api/rest/health`

#### Flutter Web Issues

1. Check browser console for errors
2. Verify Firebase config in network requests
3. Ensure Clerk publishable key is correct for the environment

---

## License

MIT
