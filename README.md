# Eato

A mobile-first calorie tracking app for couples to reach their health goals together.

## Monorepo Structure

```
eato/
├── apps/
│   ├── api/                   # Next.js backend (tRPC + Prisma)
│   └── client/                # Flutter app (iOS, Android, Web)
├── packages/                  # Shared code (future)
│   └── shared/
├── docs/                      # Documentation
└── README.md
```

## Features

- **Calorie Tracking**: Log meals with Open Food Facts database search or manual entry
- **BMR Calculator**: Calculate your Basal Metabolic Rate using the Mifflin-St Jeor equation
- **Partner Mode**: Link accounts with your partner to track progress together
- **Daily & Weekly Stats**: Visualize your progress with animated charts
- **Cross-Platform**: Native iOS/Android apps + web support

## Tech Stack

### Backend (apps/api/)
- Next.js 16 (App Router)
- tRPC + trpc-openapi (REST API)
- Prisma + MongoDB
- Clerk Authentication

### Mobile (apps/client/)
- Flutter 3
- Riverpod (State Management)
- GoRouter (Navigation)
- Dio + Retrofit (API Client)

## Getting Started

### Prerequisites

- Node.js 18+
- Flutter 3.19+
- MongoDB database (MongoDB Atlas recommended)

### Backend Setup

1. **Navigate to api directory:**
   ```bash
   cd apps/api
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials.

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Mobile Setup

1. **Navigate to client directory:**
   ```bash
   cd apps/client
   flutter pub get
   ```

2. **Run on device/simulator:**
   ```bash
   flutter run
   ```

## API Documentation

The backend exposes both tRPC and REST endpoints:

- **tRPC**: `/api/trpc/[procedure]`
- **REST (OpenAPI)**: `/api/rest/[path]`
- **OpenAPI Spec**: `/api/openapi.json`

## Development

### Backend Commands
```bash
cd apps/api
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter
npx prisma studio    # Open Prisma Studio
```

### Mobile Commands
```bash
cd apps/client
flutter run -d chrome    # Run on web
flutter run -d ios       # Run on iOS
flutter run -d android   # Run on Android
flutter build apk        # Build Android APK
flutter build ios        # Build iOS app
```
