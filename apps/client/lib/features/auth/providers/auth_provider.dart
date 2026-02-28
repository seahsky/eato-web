import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Platform-aware clerk types (stub on web, real on native)
import 'clerk_types.dart';
import 'token_refresh.dart' as token_refresh;
import '../../../core/api/api_client.dart';
import '../../../core/api/interceptors/auth_interceptor.dart';

// Auth state enum
enum AuthStatus {
  initial,
  authenticated,
  unauthenticated,
  loading,
}

// User model
class User {
  final String id;
  final String email;
  final String? name;
  final String? avatarUrl;
  final String? partnerId;
  final bool profileCompleted;

  const User({
    required this.id,
    required this.email,
    this.name,
    this.avatarUrl,
    this.partnerId,
    this.profileCompleted = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      partnerId: json['partnerId'] as String?,
      profileCompleted: json['profileCompleted'] as bool? ?? false,
    );
  }

  bool get hasPartner => partnerId != null;
  bool get needsOnboarding => !profileCompleted;
}

// Auth state
class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;
  final String? token;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
    this.token,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    String? token,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error ?? this.error,
      token: token ?? this.token,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

/// Callback type for triggering logout from interceptor
typedef LogoutCallback = Future<void> Function();

/// Global logout callback that can be called from the auth interceptor
LogoutCallback? globalLogoutCallback;

// Auth notifier with app lifecycle handling
class AuthNotifier extends StateNotifier<AuthState> with WidgetsBindingObserver {
  final ApiClient _apiClient;
  Timer? _tokenRefreshTimer;
  ClerkAuthState? _clerkAuth;
  DateTime? _lastTokenRefresh;
  bool _isInBackground = false;
  int _consecutiveRefreshFailures = 0;
  static const _maxRefreshFailures = 3;

  AuthNotifier(this._apiClient) : super(const AuthState()) {
    // Register global logout callback
    globalLogoutCallback = _handleUnauthorized;
    // Listen to app lifecycle changes
    WidgetsBinding.instance.addObserver(this);
    _checkAuthStatus();
  }

  @override
  void dispose() {
    _tokenRefreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    globalLogoutCallback = null;
    _clerkAuth?.dispose();
    super.dispose();
  }

  /// Handle app lifecycle state changes
  @override
  void didChangeAppLifecycleState(AppLifecycleState lifecycleState) {
    switch (lifecycleState) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        _handleAppBackground();
      case AppLifecycleState.resumed:
        _handleAppForeground();
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        // No action needed
        break;
    }
  }

  /// Called when app goes to background
  void _handleAppBackground() {
    _isInBackground = true;
    // Pause token refresh timer to save resources
    _tokenRefreshTimer?.cancel();
    _tokenRefreshTimer = null;
  }

  /// Called when app comes to foreground
  Future<void> _handleAppForeground() async {
    if (!_isInBackground) return;
    _isInBackground = false;

    if (!state.isAuthenticated) return;

    // Check if token might have expired while in background
    final now = DateTime.now();
    final tokenAge = _lastTokenRefresh != null
        ? now.difference(_lastTokenRefresh!)
        : const Duration(minutes: 5);

    if (tokenAge.inSeconds >= 50) {
      // Token might be expired or close to expiry, refresh immediately
      await _refreshTokenFromClerk();
    }

    // Restart the refresh timer
    if (state.isAuthenticated) {
      _startTokenRefreshTimer();
    }
  }

  /// Set the Clerk auth provider for session management (native platforms)
  void setClerkAuth(ClerkAuthState clerkAuth) {
    _clerkAuth = clerkAuth;
  }

  /// Set the Clerk auth provider for session management (web platform)
  /// On web, ClerkAuthState is the web implementation with async getToken()
  void setClerkAuthWeb(ClerkAuthState clerkAuth) {
    _clerkAuth = clerkAuth;
  }

  /// Check if there's an existing valid session
  Future<void> _checkAuthStatus() async {
    state = state.copyWith(status: AuthStatus.loading);

    // On web, stored tokens are always expired (Clerk tokens last ~60s).
    // Skip straight to unauthenticated so the login screen's Clerk
    // auto-sign-in can handle auth with a fresh token.
    if (kIsWeb) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return;
    }

    try {
      final token = await AuthInterceptor.getToken();
      if (token != null) {
        await refreshUser();
      } else {
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      // If token retrieval fails (e.g. FlutterSecureStorage on web),
      // fall through to unauthenticated so the login screen shows.
      debugPrint('Auth status check failed: $e');
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  /// Refresh user data from the API
  Future<void> refreshUser() async {
    try {
      final userData = await _apiClient.getCurrentUser();
      if (userData.isNotEmpty) {
        final user = User.fromJson(userData);
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          error: null,
        );
      } else {
        // User not found in our database
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          user: null,
          error: 'User not found',
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        user: null,
        error: e.toString(),
      );
    }
  }

  /// Sign in with a Clerk session token
  Future<void> signIn(String token) async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      // Store the token for API requests
      await AuthInterceptor.setToken(token);
      state = state.copyWith(token: token);
      _lastTokenRefresh = DateTime.now();
      _consecutiveRefreshFailures = 0;

      // Fetch user data from our API
      await refreshUser();

      // Start token refresh timer if authenticated
      if (state.isAuthenticated) {
        _startTokenRefreshTimer();
      }
    } catch (e) {
      debugPrint('signIn failed: $e');
      await AuthInterceptor.clearToken();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// Start a timer to refresh the token before it expires
  /// Clerk tokens typically expire in 60 seconds, so refresh at 50 seconds
  void _startTokenRefreshTimer() {
    _tokenRefreshTimer?.cancel();
    _tokenRefreshTimer = Timer.periodic(
      const Duration(seconds: 50),
      (_) => _refreshTokenFromClerk(),
    );
  }

  /// Refresh the token from Clerk
  /// Uses platform-aware abstraction for native vs web token access.
  /// Tolerates transient failures — only signs out after [_maxRefreshFailures]
  /// consecutive failures (the timer retries every 50s).
  Future<void> _refreshTokenFromClerk() async {
    if (_clerkAuth == null) return;

    try {
      // Check if session is still valid
      if (!token_refresh.isSessionValid(_clerkAuth!)) {
        // No active session — this is definitive, sign out immediately
        await signOut();
        return;
      }

      // Get token using platform-specific method (sync on native, async on web)
      final token = await token_refresh.getTokenFromClerk(_clerkAuth!);
      if (token != null) {
        _consecutiveRefreshFailures = 0;
        await updateToken(token);
      } else {
        _consecutiveRefreshFailures++;
        debugPrint(
          'Token refresh returned null '
          '($_consecutiveRefreshFailures/$_maxRefreshFailures)',
        );
        if (_consecutiveRefreshFailures >= _maxRefreshFailures) {
          await signOut();
        }
      }
    } catch (e) {
      _consecutiveRefreshFailures++;
      debugPrint(
        'Token refresh error ($_consecutiveRefreshFailures/$_maxRefreshFailures): $e',
      );
      if (_consecutiveRefreshFailures >= _maxRefreshFailures) {
        await signOut();
      }
    }
  }

  /// Handle 401 unauthorized response
  Future<void> _handleUnauthorized() async {
    await signOut();
  }

  /// Sign out and clear all auth state.
  ///
  /// When [fromUser] is true (explicit sign-out from profile screen),
  /// the Clerk session is also destroyed so the user must re-authenticate.
  /// When false (error-triggered: 401, token refresh failure), the Clerk
  /// session is preserved so auto-sign-in can recover with a fresh token.
  Future<void> signOut({bool fromUser = false}) async {
    _tokenRefreshTimer?.cancel();
    _tokenRefreshTimer = null;

    // Clear local token
    await AuthInterceptor.clearToken();

    // Only destroy Clerk session on explicit user sign-out.
    // Error-triggered signouts preserve the session for auto-recovery.
    if (fromUser && _clerkAuth != null) {
      try {
        await _clerkAuth!.signOut();
      } catch (e) {
        // Ignore Clerk sign out errors
      }
    }

    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Update the token (called when Clerk refreshes the session)
  Future<void> updateToken(String token) async {
    await AuthInterceptor.setToken(token);
    state = state.copyWith(token: token);
    _lastTokenRefresh = DateTime.now();
  }

  /// Handle Clerk session changes
  Future<void> handleSessionChange(ClerkAuthState clerkAuth) async {
    _clerkAuth = clerkAuth;
    final session = clerkAuth.session;

    if (session == null && state.isAuthenticated) {
      // Session ended externally, sign out
      await signOut();
    }
  }
}

// Providers
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient);
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});

final needsOnboardingProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.needsOnboarding ?? false;
});
