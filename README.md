# Eato - Diet Tracking PWA

A mobile-first Progressive Web App for tracking daily calories with your partner.

## Features

- **Calorie Tracking**: Log meals with Open Food Facts database search or manual entry
- **BMR Calculator**: Calculate your Basal Metabolic Rate using the Mifflin-St Jeor equation
- **Partner Mode**: Link accounts with your partner to track progress together
- **Daily & Weekly Stats**: Visualize your progress with animated charts
- **PWA**: Install on your phone for offline access

## Tech Stack

- Next.js 14 (App Router)
- shadcn/ui
- tRPC
- Prisma + MongoDB
- NextAuth.js
- Serwist (PWA)
- Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (MongoDB Atlas recommended)

### Setup

1. **Clone and install:**
   ```bash
   cd eato-web
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/eato"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   ```

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

## Build for Production

```bash
npm run build -- --webpack
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login/Register pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Auth forms
│   ├── dashboard/         # Dashboard components
│   └── food/              # Food tracking components
├── lib/                   # Utilities
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   └── bmr.ts             # BMR calculations
├── server/                # tRPC server
│   ├── routers/           # API routers
│   └── services/          # External services
└── trpc/                  # tRPC client setup
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Secret for JWT signing |
