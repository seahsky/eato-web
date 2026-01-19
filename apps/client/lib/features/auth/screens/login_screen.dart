import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _hasAttemptedAuth = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _checkAuthState();
  }

  Future<void> _checkAuthState() async {
    // Get Clerk auth context
    final clerkAuth = ClerkAuth.of(context);

    // Check if user is signed in via Clerk
    if (clerkAuth.isSignedIn && !_hasAttemptedAuth) {
      _hasAttemptedAuth = true;

      // Get the session token
      final session = clerkAuth.session;
      final token = session?.lastActiveToken;

      if (token != null && mounted) {
        // Set the Clerk auth reference for session management
        final authNotifier = ref.read(authProvider.notifier);
        authNotifier.setClerkAuth(clerkAuth);

        // Sign in with our auth provider
        await authNotifier.signIn(token.jwt);

        // Navigate to dashboard
        if (mounted) {
          context.go('/dashboard');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
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

              // Clerk Authentication Widget
              ClerkAuthBuilder(
                signedInBuilder: (context, authState) {
                  // User is signed in, trigger navigation
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    _checkAuthState();
                  });
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                },
                signedOutBuilder: (context, authState) {
                  // Show authentication UI
                  return const ClerkAuthentication();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
