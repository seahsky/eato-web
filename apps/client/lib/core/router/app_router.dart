import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/food/screens/search_screen.dart';
import '../../features/food/screens/add_food_screen.dart';
import '../../features/food/screens/edit_food_screen.dart';
import '../../features/gamification/screens/badge_showcase_screen.dart';
import '../../features/gamification/screens/streak_detail_screen.dart';
import '../../features/partner/screens/partner_screen.dart';
import '../../features/partner/screens/approvals_screen.dart';
import '../../features/partner/screens/my_submissions_screen.dart';
import '../../features/partner/screens/partner_weekly_screen.dart';
import '../../features/notifications/screens/notification_permission_screen.dart';
import '../../features/notifications/screens/notification_settings_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/profile_setup_screen.dart';
import '../../features/recipes/screens/recipe_list_screen.dart';
import '../../features/recipes/screens/recipe_detail_screen.dart';
import '../../features/recipes/screens/recipe_form_screen.dart';
import '../widgets/main_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _RouterRefreshNotifier(ref);

  return GoRouter(
    initialLocation: '/dashboard',
    debugLogDiagnostics: kDebugMode,
    refreshListenable: refreshNotifier,
    routes: [
      // Auth routes (no shell)
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Profile setup route (no shell, for onboarding)
      GoRoute(
        path: '/profile-setup',
        name: 'profile-setup',
        builder: (context, state) => const ProfileSetupScreen(),
      ),

      // Notification permission route (no shell, for onboarding)
      GoRoute(
        path: '/notification-permission',
        name: 'notification-permission',
        builder: (context, state) {
          final redirectTo = state.uri.queryParameters['redirectTo'];
          return NotificationPermissionScreen(redirectTo: redirectTo);
        },
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
            path: '/food/edit/:id',
            name: 'edit-food',
            builder: (context, state) {
              final entryId = state.pathParameters['id']!;
              return EditFoodScreen(entryId: entryId);
            },
          ),
          GoRoute(
            path: '/partner',
            name: 'partner',
            builder: (context, state) => const PartnerScreen(),
          ),
          GoRoute(
            path: '/partner/approvals',
            name: 'partner-approvals',
            builder: (context, state) => const ApprovalsScreen(),
          ),
          GoRoute(
            path: '/partner/submissions',
            name: 'partner-submissions',
            builder: (context, state) => const MySubmissionsScreen(),
          ),
          GoRoute(
            path: '/partner/weekly',
            name: 'partner-weekly',
            builder: (context, state) => const PartnerWeeklyScreen(),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/notifications/settings',
            name: 'notification-settings',
            builder: (context, state) => const NotificationSettingsScreen(),
          ),
          // Recipe routes
          GoRoute(
            path: '/recipes',
            name: 'recipes',
            builder: (context, state) => const RecipeListScreen(),
          ),
          GoRoute(
            path: '/recipes/new',
            name: 'recipe-new',
            builder: (context, state) => const RecipeFormScreen(),
          ),
          GoRoute(
            path: '/recipes/:id',
            name: 'recipe-detail',
            builder: (context, state) {
              final recipeId = state.pathParameters['id']!;
              return RecipeDetailScreen(recipeId: recipeId);
            },
          ),
          GoRoute(
            path: '/recipes/:id/edit',
            name: 'recipe-edit',
            builder: (context, state) {
              final recipeId = state.pathParameters['id']!;
              return RecipeFormScreen(recipeId: recipeId);
            },
          ),
          // Gamification routes
          GoRoute(
            path: '/badges',
            name: 'badges',
            builder: (context, state) => const BadgeShowcaseScreen(),
          ),
          GoRoute(
            path: '/streak',
            name: 'streak',
            builder: (context, state) => const StreakDetailScreen(),
          ),
        ],
      ),
    ],
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isLoggedIn = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final isLoginRoute = state.matchedLocation == '/login';
      final isProfileSetupRoute = state.matchedLocation == '/profile-setup';

      // Don't redirect while checking auth status
      if (isLoading || authState.status == AuthStatus.initial) {
        return null;
      }

      // Redirect to login if not authenticated
      if (!isLoggedIn && !isLoginRoute) {
        return '/login';
      }

      // Redirect to dashboard if already authenticated and on login page
      if (isLoggedIn && isLoginRoute) {
        // Check if user needs onboarding
        final needsOnboarding = authState.user?.needsOnboarding ?? false;
        if (needsOnboarding) {
          return '/profile-setup';
        }
        return '/dashboard';
      }

      // Redirect to profile setup if logged in but needs onboarding
      if (isLoggedIn && !isProfileSetupRoute) {
        final needsOnboarding = authState.user?.needsOnboarding ?? false;
        if (needsOnboarding) {
          return '/profile-setup';
        }
      }

      return null;
    },
    errorBuilder: (context, state) => const _ErrorPage(),
  );
});

/// Notifier that listens to auth state changes and triggers router refresh.
class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(this._ref) {
    _subscription = _ref.listen(authProvider, (previous, next) {
      // Notify listeners when auth status changes
      if (previous?.status != next.status) {
        notifyListeners();
      }
    });
  }

  final Ref _ref;
  late final ProviderSubscription<AuthState> _subscription;

  @override
  void dispose() {
    _subscription.close();
    super.dispose();
  }
}

/// Error page widget
class _ErrorPage extends StatelessWidget {
  const _ErrorPage();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64),
            SizedBox(height: 16),
            Text('Page not found'),
          ],
        ),
      ),
    );
  }
}
