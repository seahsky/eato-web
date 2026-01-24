// Native platform: Token refresh using clerk_flutter synchronous API
import 'clerk_types.dart';

/// Get token from ClerkAuthState on native platforms.
/// Native clerk_flutter provides synchronous access to the session token.
Future<String?> getTokenFromClerk(ClerkAuthState clerkAuth) async {
  final session = clerkAuth.session;
  if (session == null) return null;

  final token = session.lastActiveToken;
  if (token == null || token.isExpired) return null;

  return token.jwt;
}

/// Check if the session is still valid on native platforms.
bool isSessionValid(ClerkAuthState clerkAuth) {
  final session = clerkAuth.session;
  if (session == null) return false;

  final token = session.lastActiveToken;
  return token != null && token.isNotExpired;
}
