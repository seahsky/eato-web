import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/env.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Validate environment in production
  if (!kDebugMode) {
    Env.validate();
  }

  runApp(
    ClerkAuth(
      config: ClerkAuthConfig(
        publishableKey: Env.clerkPublishableKey.isNotEmpty
            ? Env.clerkPublishableKey
            : 'pk_test_placeholder', // Placeholder for development
      ),
      child: const ProviderScope(
        child: EatoApp(),
      ),
    ),
  );
}

class EatoApp extends ConsumerWidget {
  const EatoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Eato',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
