/// Environment configuration for the Eato app.
///
/// Values are provided via dart-define at build time:
/// flutter run --dart-define=CLERK_PUBLISHABLE_KEY=pk_...
/// flutter run --dart-define=API_BASE_URL=http://localhost:3000
class Env {
  /// Clerk publishable key for authentication.
  /// Required for production builds.
  static const String clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  /// Base URL for the API.
  /// Defaults to localhost for development.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  /// Whether we're running in debug mode.
  static const bool isDebug = bool.fromEnvironment(
    'DEBUG',
    defaultValue: true,
  );

  /// Validates that required environment variables are set.
  static void validate() {
    if (clerkPublishableKey.isEmpty) {
      throw StateError(
        'CLERK_PUBLISHABLE_KEY is not set. '
        'Run with: flutter run --dart-define=CLERK_PUBLISHABLE_KEY=pk_...',
      );
    }
  }
}
