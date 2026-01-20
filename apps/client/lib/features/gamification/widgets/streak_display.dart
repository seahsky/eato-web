import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/gamification_provider.dart';

/// Compact streak display for dashboard and profile
class StreakDisplay extends ConsumerWidget {
  final bool showMilestone;
  final VoidCallback? onTap;

  const StreakDisplay({
    super.key,
    this.showMilestone = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(achievementSummaryProvider);

    if (state.isLoading && state.data == null) {
      return const SizedBox(
        width: 80,
        height: 60,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    final streak = state.currentStreak;
    final flameSize = _getFlameSize(streak);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: _getGradientColors(flameSize),
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            if (streak > 0)
              BoxShadow(
                color: _getFlameColor(flameSize).withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _FlameIcon(size: flameSize, streak: streak),
            const SizedBox(width: 8),
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$streak',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  streak == 1 ? 'day' : 'days',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getFlameSize(int streak) {
    if (streak == 0) return 'none';
    if (streak < 7) return 'small';
    if (streak < 30) return 'medium';
    if (streak < 90) return 'large';
    return 'epic';
  }

  Color _getFlameColor(String size) {
    switch (size) {
      case 'epic':
        return Colors.purple;
      case 'large':
        return Colors.deepOrange;
      case 'medium':
        return Colors.orange;
      case 'small':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }

  List<Color> _getGradientColors(String size) {
    switch (size) {
      case 'epic':
        return [Colors.purple.shade700, Colors.deepPurple.shade900];
      case 'large':
        return [Colors.deepOrange.shade600, Colors.red.shade900];
      case 'medium':
        return [Colors.orange.shade500, Colors.deepOrange.shade700];
      case 'small':
        return [Colors.amber.shade500, Colors.orange.shade600];
      default:
        return [Colors.grey.shade400, Colors.grey.shade600];
    }
  }
}

/// Animated flame icon
class _FlameIcon extends StatefulWidget {
  final String size;
  final int streak;

  const _FlameIcon({required this.size, required this.streak});

  @override
  State<_FlameIcon> createState() => _FlameIconState();
}

class _FlameIconState extends State<_FlameIcon>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _glowAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.streak == 0) {
      return const Icon(
        Icons.local_fire_department_outlined,
        size: 32,
        color: Colors.white54,
      );
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: _getFlameColor(widget.size)
                      .withValues(alpha: _glowAnimation.value * 0.5),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(
              Icons.local_fire_department,
              size: _getIconSize(widget.size),
              color: Colors.white,
            ),
          ),
        );
      },
    );
  }

  Color _getFlameColor(String size) {
    switch (size) {
      case 'epic':
        return Colors.purple;
      case 'large':
        return Colors.deepOrange;
      case 'medium':
        return Colors.orange;
      case 'small':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }

  double _getIconSize(String size) {
    switch (size) {
      case 'epic':
        return 40;
      case 'large':
        return 36;
      case 'medium':
        return 32;
      default:
        return 28;
    }
  }
}

/// Large streak card for profile/gamification screens
class StreakCard extends ConsumerWidget {
  final VoidCallback? onViewBadges;
  final VoidCallback? onViewStreakDetails;

  const StreakCard({super.key, this.onViewBadges, this.onViewStreakDetails});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(achievementSummaryProvider);
    final theme = Theme.of(context);

    if (state.isLoading && state.data == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final streak = state.currentStreak;
    final longest = state.longestStreak;
    final badges = state.badgeCount;
    final totalBadges = state.totalBadges;
    final flameSize = _getFlameSize(streak);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Header with flame - tappable for streak details
          InkWell(
            onTap: onViewStreakDetails,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: _getGradientColors(flameSize),
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
              children: [
                _FlameIcon(size: flameSize, streak: streak),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Current Streak',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '$streak',
                            style: const TextStyle(
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            streak == 1 ? 'day' : 'days',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
              ),
            ),
          ),

          // Stats row
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _StatColumn(
                    icon: Icons.emoji_events,
                    iconColor: Colors.amber,
                    label: 'Longest',
                    value: '$longest days',
                  ),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: theme.dividerColor,
                ),
                Expanded(
                  child: _StatColumn(
                    icon: Icons.military_tech,
                    iconColor: Colors.blue,
                    label: 'Badges',
                    value: '$badges / $totalBadges',
                  ),
                ),
              ],
            ),
          ),

          // View badges button
          if (onViewBadges != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onViewBadges,
                  icon: const Icon(Icons.military_tech),
                  label: const Text('View All Badges'),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _getFlameSize(int streak) {
    if (streak == 0) return 'none';
    if (streak < 7) return 'small';
    if (streak < 30) return 'medium';
    if (streak < 90) return 'large';
    return 'epic';
  }

  List<Color> _getGradientColors(String size) {
    switch (size) {
      case 'epic':
        return [Colors.purple.shade700, Colors.deepPurple.shade900];
      case 'large':
        return [Colors.deepOrange.shade600, Colors.red.shade900];
      case 'medium':
        return [Colors.orange.shade500, Colors.deepOrange.shade700];
      case 'small':
        return [Colors.amber.shade500, Colors.orange.shade600];
      default:
        return [Colors.grey.shade400, Colors.grey.shade600];
    }
  }
}

class _StatColumn extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  const _StatColumn({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Icon(icon, color: iconColor, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
