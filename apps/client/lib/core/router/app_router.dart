import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/food/screens/search_screen.dart';
import '../../features/food/screens/add_food_screen.dart';
import '../../features/partner/screens/partner_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../widgets/main_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/dashboard',
    debugLogDiagnostics: true,
    routes: [
      // Auth routes (no shell)
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Main app routes (with bottom nav shell)
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/search',
            name: 'search',
            builder: (context, state) => const SearchScreen(),
          ),
          GoRoute(
            path: '/add',
            name: 'add',
            builder: (context, state) => const AddFoodScreen(),
          ),
          GoRoute(
            path: '/partner',
            name: 'partner',
            builder: (context, state) => const PartnerScreen(),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
    ],
    redirect: (context, state) {
      // TODO: Add auth redirect logic
      // final isLoggedIn = ref.read(isAuthenticatedProvider);
      // final isLoginRoute = state.matchedLocation == '/login';
      //
      // if (!isLoggedIn && !isLoginRoute) {
      //   return '/login';
      // }
      // if (isLoggedIn && isLoginRoute) {
      //   return '/dashboard';
      // }
      return null;
    },
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );
});
