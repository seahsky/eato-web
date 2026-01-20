import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/models/models.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../providers/gamification_provider.dart';

/// Milestones for daily streaks
const _dailyMilestones = [7, 14, 30, 60, 90, 180, 365];

/// Milestones for weekly streaks
const _weeklyMilestones = [4, 8, 12, 26, 52];

class StreakDetailScreen extends ConsumerStatefulWidget {
  const StreakDetailScreen({super.key});

  @override
  ConsumerState<StreakDetailScreen> createState() => _StreakDetailScreenState();
}

class _StreakDetailScreenState extends ConsumerState<StreakDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(streakProvider.notifier).fetch();
      ref.read(partnerShieldStatusProvider.notifier).fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(streakProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Streak Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.military_tech),
            tooltip: 'View Badges',
            onPressed: () => context.go('/badges'),
          ),
        ],
      ),
      body: state.isLoading && state.data == null
          ? const StreakDetailSkeleton()
          : state.error != null && state.data == null
              ? _buildError(state.error!)
              : RefreshIndicator(
                  onRefresh: () => ref.read(streakProvider.notifier).refresh(),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Current streak card
                      _buildCurrentStreakCard(state, theme),
                      const SizedBox(height: 16),

                      // Milestone progress
                      _buildMilestoneProgress(state, theme),
                      const SizedBox(height: 16),

                      // Weekly streak section
                      _buildWeeklyStreakCard(state, theme),
                      const SizedBox(height: 16),

                      // Tools section (freezes, rest days, shields)
                      _buildToolsSection(state, theme),
                      const SizedBox(height: 16),

                      // Stats section
                      _buildStatsSection(state, theme),
                    ],
                  ),
                ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(error, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => ref.read(streakProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStreakCard(StreakState state, ThemeData theme) {
    final streak = state.currentStreak;
    final longest = state.longestStreak;
    final flameSize = state.flameSize;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Gradient header with flame
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: _getGradientColors(flameSize),
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              children: [
                _AnimatedFlame(size: flameSize, streak: streak),
                const SizedBox(height: 16),
                Text(
                  '$streak',
                  style: const TextStyle(
                    fontSize: 64,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  streak == 1 ? 'day streak' : 'day streak',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
                if (streak >= longest && streak > 0) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.emoji_events, color: Colors.amber, size: 16),
                        SizedBox(width: 4),
                        Text(
                          'Personal Best!',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          // Stats row
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _StatItem(
                    icon: Icons.emoji_events,
                    iconColor: Colors.amber,
                    label: 'Longest Streak',
                    value: '$longest days',
                  ),
                ),
                Container(
                  width: 1,
                  height: 48,
                  color: theme.dividerColor,
                ),
                Expanded(
                  child: _StatItem(
                    icon: Icons.track_changes,
                    iconColor: Colors.green,
                    label: 'Goal Streak',
                    value: '${state.goalStreak} days',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMilestoneProgress(StreakState state, ThemeData theme) {
    final currentStreak = state.currentStreak;
    final nextMilestone = state.nextMilestone;
    final progress = state.milestoneProgress / 100;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.flag,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Milestone Progress',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Progress bar
            if (nextMilestone != null) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$currentStreak days',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '$nextMilestone days',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 12,
                  backgroundColor: theme.colorScheme.surfaceContainerHighest,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${nextMilestone - currentStreak} days to go',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.star, color: Colors.amber),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'You\'ve completed all milestones! Keep going!',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),

            // Milestone chips
            Text(
              'Daily Milestones',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _dailyMilestones.map((milestone) {
                final achieved = currentStreak >= milestone;
                return _MilestoneChip(
                  days: milestone,
                  achieved: achieved,
                  isCurrent: nextMilestone == milestone,
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeeklyStreakCard(StreakState state, ThemeData theme) {
    final weeklyStreak = state.weeklyStreak;
    final currentWeekDays = state.currentWeekDays;
    final weeklyProgress = state.weeklyProgress / 100;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.calendar_view_week,
                  color: theme.colorScheme.secondary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Weekly Streak',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '$weeklyStreak ${weeklyStreak == 1 ? 'week' : 'weeks'}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSecondaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // This week's progress
            Text(
              'This Week',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: weeklyProgress,
                      minHeight: 12,
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation(
                        theme.colorScheme.secondary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '$currentWeekDays/5 days',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Log 5 days per week to maintain your weekly streak',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),

            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),

            // Weekly milestones
            Text(
              'Weekly Milestones',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _weeklyMilestones.map((milestone) {
                final achieved = weeklyStreak >= milestone;
                return _MilestoneChip(
                  days: milestone,
                  achieved: achieved,
                  suffix: 'wks',
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToolsSection(StreakState state, ThemeData theme) {
    final shieldStatus = ref.watch(partnerShieldStatusProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.build,
                  color: theme.colorScheme.tertiary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Streak Tools',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Tools row
            Row(
              children: [
                Expanded(
                  child: _ToolCard(
                    icon: Icons.ac_unit,
                    iconColor: Colors.cyan,
                    label: 'Streak Freezes',
                    value: '${state.streakFreezes}',
                    description: 'Auto-used when you miss a day',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ToolCard(
                    icon: Icons.weekend,
                    iconColor: Colors.green,
                    label: 'Rest Days',
                    value: '${state.restDaysRemaining}/6',
                    description: 'Per week, won\'t break streak',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Partner shield section
            _buildPartnerShieldSection(shieldStatus, theme),
          ],
        ),
      ),
    );
  }

  Widget _buildPartnerShieldSection(
    PartnerShieldStatusState shieldStatus,
    ThemeData theme,
  ) {
    final status = shieldStatus.data;

    if (shieldStatus.isLoading && status == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    if (status == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(Icons.shield, color: Colors.amber, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Link with a partner to use shields',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      );
    }

    final canShield =
        status.userCanShield.canUseShield && status.userShields > 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: canShield
            ? Colors.amber.withValues(alpha: 0.1)
            : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: canShield ? Border.all(color: Colors.amber, width: 1) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with shields count
          Row(
            children: [
              Icon(Icons.shield, color: Colors.amber, size: 24),
              const SizedBox(width: 8),
              Text(
                'Partner Shields',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              // Shield indicators
              Row(
                children: List.generate(2, (i) {
                  return Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Icon(
                      i < status.userShields
                          ? Icons.shield
                          : Icons.shield_outlined,
                      color: i < status.userShields
                          ? Colors.amber
                          : Colors.grey,
                      size: 20,
                    ),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Action area
          if (canShield) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${status.partnerName ?? "Partner"} missed yesterday!',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Use a shield to save their streak',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: shieldStatus.isUsingShield
                        ? null
                        : () => _showUseShieldDialog(status),
                    child: shieldStatus.isUsingShield
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Use Shield'),
                  ),
                ],
              ),
            ),
          ] else ...[
            Text(
              status.userShields == 0
                  ? 'No shields remaining this month. They reset on the 1st!'
                  : status.userCanShield.reason ?? 'Partner\'s streak is safe',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],

          // Error message
          if (shieldStatus.error != null) ...[
            const SizedBox(height: 8),
            Text(
              shieldStatus.error!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showUseShieldDialog(PartnerShieldStatus status) {
    final targetDate = status.userCanShield.targetDate;
    if (targetDate == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.shield, color: Colors.amber),
            const SizedBox(width: 8),
            const Text('Use Shield?'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This will use 1 of your shields to save ${status.partnerName ?? "your partner"}\'s streak.',
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Shields reset monthly. You have ${status.userShields} remaining.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.of(context).pop();
              final success = await ref
                  .read(partnerShieldStatusProvider.notifier)
                  .useShield(targetDate);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Shield used! ${status.partnerName ?? "Partner"}\'s streak is saved!',
                    ),
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            child: const Text('Use Shield'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection(StreakState state, ThemeData theme) {
    final data = state.data;
    if (data == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.bar_chart,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Statistics',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildStatRow('Longest Daily Streak', '${data.longestStreak} days', theme),
            _buildStatRow('Longest Goal Streak', '${data.longestGoalStreak} days', theme),
            _buildStatRow('Longest Weekly Streak', '${data.longestWeeklyStreak} weeks', theme),
            if (data.lastLogDate != null)
              _buildStatRow('Last Logged', _formatDate(data.lastLogDate!), theme),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
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

class _AnimatedFlame extends StatefulWidget {
  final String size;
  final int streak;

  const _AnimatedFlame({required this.size, required this.streak});

  @override
  State<_AnimatedFlame> createState() => _AnimatedFlameState();
}

class _AnimatedFlameState extends State<_AnimatedFlame>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 0.95, end: 1.1).animate(
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
        size: 64,
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
                  color: Colors.white.withValues(alpha: 0.3),
                  blurRadius: 20,
                  spreadRadius: 5,
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

  double _getIconSize(String size) {
    switch (size) {
      case 'epic':
        return 80;
      case 'large':
        return 72;
      case 'medium':
        return 64;
      default:
        return 56;
    }
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  const _StatItem({
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
        Icon(icon, color: iconColor, size: 28),
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

class _MilestoneChip extends StatelessWidget {
  final int days;
  final bool achieved;
  final bool isCurrent;
  final String suffix;

  const _MilestoneChip({
    required this.days,
    required this.achieved,
    this.isCurrent = false,
    this.suffix = 'days',
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: achieved
            ? theme.colorScheme.primary
            : isCurrent
                ? theme.colorScheme.primaryContainer
                : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: isCurrent
            ? Border.all(color: theme.colorScheme.primary, width: 2)
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (achieved)
            const Padding(
              padding: EdgeInsets.only(right: 4),
              child: Icon(Icons.check, size: 14, color: Colors.white),
            ),
          Text(
            '$days $suffix',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: achieved
                  ? Colors.white
                  : isCurrent
                      ? theme.colorScheme.onPrimaryContainer
                      : theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ToolCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final String description;

  const _ToolCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
