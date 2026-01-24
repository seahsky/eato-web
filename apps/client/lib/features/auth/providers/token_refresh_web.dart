// Web platform: Token refresh using Clerk.js async API
import 'clerk_types.dart';

/// Get token from ClerkAuthState on web platform.
/// Web Clerk.js requires async access to the session token.
Future<String?> getTokenFromClerk(ClerkAuthState clerkAuth) async {
  return await clerkAuth.getToken();
}

/// Check if the session is still valid on web platform.
/// On web, we rely on Clerk.js's isSignedIn check.
bool isSessionValid(ClerkAuthState clerkAuth) {
  return clerkAuth.isSignedIn;
}
