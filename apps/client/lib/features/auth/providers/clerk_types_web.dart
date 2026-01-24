// Web platform: Real implementation using Clerk.js interop
import 'dart:async';

import '../../../core/auth/clerk_js_interop.dart';

/// Web implementation of ClerkAuthState using Clerk.js SDK.
class ClerkAuthState {
  bool _initialized = false;
  StreamSubscription<bool>? _authSubscription;
  final StreamController<bool> _stateController =
      StreamController<bool>.broadcast();

  /// Initialize Clerk.js SDK
  Future<bool> initialize() async {
    if (_initialized) return true;

    _initialized = await ClerkJS.initialize();

    if (_initialized) {
      // Forward auth state changes
      _authSubscription = ClerkJS.authStateChanges.listen((isSignedIn) {
        _stateController.add(isSignedIn);
      });
    }

    return _initialized;
  }

  /// Check if Clerk is ready
  bool get isReady => ClerkJS.isReady;

  /// Check if user is signed in
  bool get isSignedIn => ClerkJS.isSignedIn;

  /// Get the current session token
  Future<String?> getToken() => ClerkJS.getToken();

  /// Sign out the current user
  Future<void> signOut() async {
    await ClerkJS.signOut();
  }

  /// Open the sign in modal
  void openSignIn({String? redirectUrl}) {
    ClerkJS.openSignIn(redirectUrl: redirectUrl);
  }

  /// Open the sign up modal
  void openSignUp({String? redirectUrl}) {
    ClerkJS.openSignUp(redirectUrl: redirectUrl);
  }

  /// Stream of auth state changes
  Stream<bool> get authStateChanges => _stateController.stream;

  /// Stub for compatibility with native API.
  /// On web, use [getToken()] instead.
  dynamic get session => null;

  /// Dispose resources
  void dispose() {
    _authSubscription?.cancel();
    _stateController.close();
  }
}
