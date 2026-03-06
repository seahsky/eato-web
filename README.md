# Eato

A mobile-first calorie tracking app for couples to reach their health goals together.

## Project Structure

```
eato/
├── src/                       # Next.js app (tRPC API + frontend)
├── prisma/                    # Database schema
├── Dockerfile                 # Production build
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

## Tech Stack

### Next.js App
- Next.js 16 (App Router) — serves both frontend and API
- tRPC + trpc-openapi (REST API)
- Prisma + MongoDB
- Clerk Authentication
- Web Push + Expo Push Notifications

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB database (MongoDB Atlas recommended)
- Clerk account (authentication)
- FatSecret API credentials (food database)
- Firebase project (push notifications)

### Setup

1. **Install dependencies:**
   ```bash
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

## API Documentation

The backend exposes both tRPC and REST endpoints:

- **tRPC**: `/api/trpc/[procedure]`
- **REST (OpenAPI)**: `/api/rest/[path]`
- **OpenAPI Spec**: `/api/openapi.json`
- **Health Check**: `/api/rest/health`

## Environment Variables

### .env.local

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

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma db push   # Push schema changes to database
```

---

## Production Deployment

### Docker Deployment

The Dockerfile builds and serves the Next.js application directly on port 8080.

#### Build the Docker Image

```bash
docker build -t eato:latest .
```

#### Run the Container

```bash
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL="mongodb+srv://..." \
  -e CLERK_SECRET_KEY="sk_live_..." \
  -e CLERK_WEBHOOK_SECRET="whsec_..." \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..." \
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
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
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

1. **Runtime Variables**: Set as environment variables
2. **Port**: 8080 (configured in Dockerfile)

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

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Container (Port 8080)                    │
├─────────────────────────────────────────────────────────┤
│                    Next.js (Port 8080)                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Frontend  │  tRPC API  │  REST API  │  Webhooks    │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    Prisma ORM                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              MongoDB Atlas (External)                │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Security Considerations

1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Clerk Webhook Verification**: The webhook endpoint verifies signatures using `CLERK_WEBHOOK_SECRET`
3. **HTTPS**: Use a reverse proxy (Cloudflare, AWS ALB) for SSL termination
4. **Rate Limiting**: Consider adding rate limiting at the API level

### Troubleshooting

#### Container Startup Issues

1. Check logs: `docker logs eato`
2. Verify Next.js started: Look for "Ready" in logs
3. Check Prisma generation: Ensure `DATABASE_URL` is accessible

#### API Not Responding

1. Check health endpoint: `curl http://localhost:8080/api/rest/health`
2. Check Next.js logs: `docker exec eato cat /proc/1/fd/1`

---

## License

MIT
