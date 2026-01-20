import 'package:flutter/material.dart' hide Badge;
import 'package:flutter/material.dart' as material show Badge;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/gamification/providers/gamification_provider.dart';
import '../../features/gamification/widgets/badge_unlock_celebration.dart';
import '../../features/partner/providers/approval_provider.dart';

class MainShell extends ConsumerStatefulWidget {
  final Widget child;

  const MainShell({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  bool _hasCheckedRecentAchievements = false;

  @override
  void initState() {
    super.initState();
    // Check for recent achievements on app start
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkRecentAchievements();
    });
  }

  Future<void> _checkRecentAchievements() async {
    if (_hasCheckedRecentAchievements) return;
    _hasCheckedRecentAchievements = true;

    await ref.read(recentAchievementsProvider.notifier).fetch();
    final state = ref.read(recentAchievementsProvider);

    if (state.badges.isNotEmpty && state.hasUnseen) {
      // Celebrate the badges
      badgeCelebrationController.celebrateBadges(state.badges);
      // Mark them as seen
      ref.read(recentAchievementsProvider.notifier).markAsSeen();
    }
  }

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    switch (location) {
      case '/dashboard':
        return 0;
      case '/search':
        return 1;
      case '/add':
        return 2;
      case '/partner':
        return 3;
      case '/profile':
        return 4;
      default:
        return 0;
    }
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/dashboard');
      case 1:
        context.go('/search');
      case 2:
        context.go('/add');
      case 3:
        context.go('/partner');
      case 4:
        context.go('/profile');
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _getSelectedIndex(context);
    final pendingCount = ref.watch(pendingApprovalCountProvider);

    // Listen to recent achievements and trigger celebrations
    ref.listen<RecentAchievementsState>(recentAchievementsProvider, (previous, next) {
      if (next.badges.isNotEmpty && next.hasUnseen) {
        badgeCelebrationController.celebrateBadges(next.badges);
        ref.read(recentAchievementsProvider.notifier).markAsSeen();
      }
    });

    return BadgeCelebrationListener(
      child: Scaffold(
        body: widget.child,
        bottomNavigationBar: NavigationBar(
          selectedIndex: selectedIndex,
          onDestinationSelected: (index) => _onItemTapped(context, index),
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home',
            ),
            const NavigationDestination(
              icon: Icon(Icons.search_outlined),
              selectedIcon: Icon(Icons.search),
              label: 'Search',
            ),
            const NavigationDestination(
              icon: Icon(Icons.add_circle_outline),
              selectedIcon: Icon(Icons.add_circle),
              label: 'Log',
            ),
            NavigationDestination(
              icon: material.Badge(
                isLabelVisible: pendingCount > 0,
                label: Text('$pendingCount'),
                child: const Icon(Icons.people_outline),
              ),
              selectedIcon: material.Badge(
                isLabelVisible: pendingCount > 0,
                label: Text('$pendingCount'),
                child: const Icon(Icons.people),
              ),
              label: 'Partner',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
