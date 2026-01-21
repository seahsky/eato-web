// Web platform: stub for ClerkAuthState since clerk_flutter is not available

/// Stub class for ClerkAuthState on web platform.
/// clerk_flutter does not support web, so this is a placeholder.
class ClerkAuthState {
  /// Always returns null on web since Clerk is not available.
  dynamic get session => null;

  /// Always returns false on web since Clerk is not available.
  bool get isSignedIn => false;

  /// No-op on web.
  Future<void> signOut() async {}
}
