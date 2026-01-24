/// Clerk.js interop for Flutter web.
/// This file provides Dart bindings to the Clerk JavaScript SDK.
@JS()
library clerk_js_interop;

import 'dart:async';
import 'dart:js_interop';

/// JavaScript interop for Clerk initialization
@JS('initializeClerk')
external JSPromise<JSBoolean> _initializeClerk();

/// JavaScript interop for checking sign-in status
@JS('clerkIsSignedIn')
external JSBoolean _clerkIsSignedIn();

/// JavaScript interop for getting token
@JS('clerkGetToken')
external JSPromise<JSString?> _clerkGetToken();

/// JavaScript interop for sign out
@JS('clerkSignOut')
external JSPromise<JSBoolean> _clerkSignOut();

/// JavaScript interop for opening sign in modal
@JS('clerkOpenSignIn')
external void _clerkOpenSignIn(JSString? redirectUrl);

/// JavaScript interop for opening sign up modal
@JS('clerkOpenSignUp')
external void _clerkOpenSignUp(JSString? redirectUrl);

/// JavaScript interop for adding auth callback
@JS('clerkAddAuthCallback')
external JSNumber _clerkAddAuthCallback(JSFunction callback);

/// JavaScript interop for removing auth callback
@JS('clerkRemoveAuthCallback')
external void _clerkRemoveAuthCallback(JSNumber index);

/// JavaScript interop for checking if Clerk is ready
@JS('clerkIsReady')
external JSBoolean _clerkIsReady();

/// Dart wrapper class for Clerk.js SDK
class ClerkJS {
  static bool _initialized = false;
  static final StreamController<bool> _authStateController =
      StreamController<bool>.broadcast();

  /// Initialize the Clerk SDK
  static Future<bool> initialize() async {
    if (_initialized) return true;

    try {
      final result = await _initializeClerk().toDart;
      _initialized = result.toDart;

      if (_initialized) {
        // Set up auth state listener
        _setupAuthListener();
      }

      return _initialized;
    } catch (e) {
      return false;
    }
  }

  /// Set up auth state change listener
  static void _setupAuthListener() {
    final callback = ((JSBoolean isSignedIn) {
      _authStateController.add(isSignedIn.toDart);
    }).toJS;

    _clerkAddAuthCallback(callback);
  }

  /// Check if Clerk is ready
  static bool get isReady {
    try {
      return _clerkIsReady().toDart;
    } catch (e) {
      return false;
    }
  }

  /// Check if user is signed in
  static bool get isSignedIn {
    try {
      return _clerkIsSignedIn().toDart;
    } catch (e) {
      return false;
    }
  }

  /// Get the current session token
  static Future<String?> getToken() async {
    try {
      final result = await _clerkGetToken().toDart;
      return result?.toDart;
    } catch (e) {
      return null;
    }
  }

  /// Sign out the current user
  static Future<bool> signOut() async {
    try {
      final result = await _clerkSignOut().toDart;
      return result.toDart;
    } catch (e) {
      return false;
    }
  }

  /// Open the sign in modal
  static void openSignIn({String? redirectUrl}) {
    _clerkOpenSignIn(redirectUrl?.toJS);
  }

  /// Open the sign up modal
  static void openSignUp({String? redirectUrl}) {
    _clerkOpenSignUp(redirectUrl?.toJS);
  }

  /// Stream of auth state changes
  static Stream<bool> get authStateChanges => _authStateController.stream;

  /// Dispose resources
  static void dispose() {
    _authStateController.close();
  }
}
