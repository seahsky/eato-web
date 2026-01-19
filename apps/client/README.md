# Eato Flutter Client

Mobile client for Eato - a calorie tracking app for couples.

## Prerequisites

- Flutter 3.19+
- Dart 3.2+

## Setup

1. **Install Flutter**

   Follow the official guide: https://flutter.dev/docs/get-started/install

2. **Get dependencies**
   ```bash
   flutter pub get
   ```

3. **Run code generators**
   ```bash
   flutter pub run build_runner build
   ```

4. **Configure environment**

   Create `lib/core/config/env.dart` with your API configuration.

## Running the App

```bash
# Web
flutter run -d chrome

# iOS Simulator
flutter run -d ios

# Android Emulator
flutter run -d android
```

## Project Structure

```
lib/
├── core/
│   ├── api/            # API client and interceptors
│   ├── router/         # GoRouter navigation
│   ├── theme/          # Material 3 theme
│   ├── utils/          # Utility functions
│   └── widgets/        # Shared widgets
├── features/
│   ├── auth/           # Authentication
│   ├── dashboard/      # Home dashboard
│   ├── food/           # Food search and logging
│   ├── partner/        # Partner features
│   ├── profile/        # User profile
│   ├── recipes/        # Recipe management
│   └── gamification/   # Streaks and badges
└── main.dart           # App entry point
```

## State Management

This app uses Riverpod for state management with code generation.

## API Integration

The app connects to the Next.js backend via REST API (OpenAPI).

- Base URL: `http://localhost:3000/api/rest` (development)
- OpenAPI Spec: `http://localhost:3000/api/openapi.json`

## Notes

- Flutter project needs to be initialized with `flutter create` to generate platform-specific files
- Clerk Flutter SDK is ready but commented out pending configuration
- All screens have placeholder implementations
