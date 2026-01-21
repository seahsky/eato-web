import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Conditional import: use native login with Clerk on supported platforms,
// web-specific version on web (clerk_flutter doesn't support web)
import 'login_screen_native.dart' if (dart.library.html) 'login_screen_web.dart'
    as platform;

/// Platform-aware login screen.
/// Uses Clerk authentication on native platforms (Android, iOS, macOS).
/// Shows a "coming soon" message on web since clerk_flutter doesn't support web.
class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const platform.LoginScreenPlatform();
  }
}
