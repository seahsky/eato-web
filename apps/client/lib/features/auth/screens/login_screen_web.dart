import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../providers/clerk_types.dart';

/// Web-specific login screen with Clerk.js authentication.
class LoginScreenPlatform extends ConsumerStatefulWidget {
  const LoginScreenPlatform({super.key});

  @override
  ConsumerState<LoginScreenPlatform> createState() =>
      _LoginScreenPlatformState();
}

class _LoginScreenPlatformState extends ConsumerState<LoginScreenPlatform> {
  final ClerkAuthState _clerkAuth = ClerkAuthState();
  bool _isInitializing = true;
  bool _isAuthenticating = false;
  String? _error;
  StreamSubscription<bool>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _initializeClerk();
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _clerkAuth.dispose();
    super.dispose();
  }

  Future<void> _initializeClerk() async {
    try {
      final success = await _clerkAuth.initialize();

      if (!success) {
        setState(() {
          _error = 'Failed to initialize authentication';
          _isInitializing = false;
        });
        return;
      }

      // Listen for auth state changes
      _authSubscription = _clerkAuth.authStateChanges.listen((isSignedIn) {
        if (isSignedIn && mounted) {
          _handleSignIn();
        }
      });

      // Check if already signed in
      if (_clerkAuth.isSignedIn) {
        await _handleSignIn();
      } else {
        setState(() {
          _isInitializing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Authentication error: $e';
          _isInitializing = false;
        });
      }
    }
  }

  Future<void> _handleSignIn() async {
    if (_isAuthenticating) return;

    setState(() {
      _isAuthenticating = true;
      _error = null;
    });

    try {
      // Get the session token
      final token = await _clerkAuth.getToken();

      if (token == null) {
        setState(() {
          _error = 'Failed to get authentication token';
          _isAuthenticating = false;
        });
        return;
      }

      // Sign in with our auth provider
      final authNotifier = ref.read(authProvider.notifier);
      authNotifier.setClerkAuthWeb(_clerkAuth);
      await authNotifier.signIn(token);

      // Navigate to dashboard
      if (mounted) {
        context.go('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Sign in failed: $e';
          _isAuthenticating = false;
        });
      }
    }
  }

  void _openSignIn() {
    _clerkAuth.openSignIn();
  }

  void _openSignUp() {
    _clerkAuth.openSignUp();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Logo and branding
                Icon(
                  Icons.restaurant_menu,
                  size: 80,
                  color: colorScheme.primary,
                ),
                const SizedBox(height: 24),
                Text(
                  'Eato',
                  style: textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onSurface,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Track calories together with your partner',
                  style: textTheme.bodyLarge?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Loading state
                if (_isInitializing || _isAuthenticating) ...[
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    _isInitializing
                        ? 'Initializing...'
                        : 'Signing you in...',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ]
                // Error state
                else if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.error_outline,
                          color: colorScheme.onErrorContainer,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(
                              color: colorScheme.onErrorContainer,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildAuthButtons(colorScheme, textTheme),
                ]
                // Ready state - show auth buttons
                else ...[
                  _buildAuthButtons(colorScheme, textTheme),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAuthButtons(ColorScheme colorScheme, TextTheme textTheme) {
    return Column(
      children: [
        // Sign In Button
        SizedBox(
          width: double.infinity,
          height: 56,
          child: FilledButton(
            onPressed: _openSignIn,
            style: FilledButton.styleFrom(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Sign In',
              style: textTheme.titleMedium?.copyWith(
                color: colorScheme.onPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Sign Up Button
        SizedBox(
          width: double.infinity,
          height: 56,
          child: OutlinedButton(
            onPressed: _openSignUp,
            style: OutlinedButton.styleFrom(
              foregroundColor: colorScheme.primary,
              side: BorderSide(color: colorScheme.outline),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Create Account',
              style: textTheme.titleMedium?.copyWith(
                color: colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 32),

        // Info text
        Text(
          'Sign in to track your calories and sync with your partner',
          style: textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
