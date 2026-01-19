import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  const User({
    required this.id,
    required this.email,
    this.name,
    this.avatarUrl,
    this.partnerId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      partnerId: json['partnerId'] as String?,
    );
  }

  bool get hasPartner => partnerId != null;
}

// Auth state
class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error ?? this.error,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;

  AuthNotifier(this._apiClient) : super(const AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    final token = await AuthInterceptor.getToken();
    if (token != null) {
      await refreshUser();
    } else {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> refreshUser() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final userData = await _apiClient.getCurrentUser();
      final user = User.fromJson(userData);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        user: null,
        error: e.toString(),
      );
    }
  }

  Future<void> signIn(String token) async {
    await AuthInterceptor.setToken(token);
    await refreshUser();
  }

  Future<void> signOut() async {
    await AuthInterceptor.clearToken();
    state = state.copyWith(
      status: AuthStatus.unauthenticated,
      user: null,
    );
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
