import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/models/models.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../providers/gamification_provider.dart';

class ThemeCustomizationScreen extends ConsumerStatefulWidget {
  const ThemeCustomizationScreen({super.key});

  @override
  ConsumerState<ThemeCustomizationScreen> createState() =>
      _ThemeCustomizationScreenState();
}

class _ThemeCustomizationScreenState
    extends ConsumerState<ThemeCustomizationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(customizationProvider.notifier).fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(customizationProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Theme'),
      ),
      body: state.longestStreak == 0 && state.currentTheme == ThemeId.defaultTheme
          ? _buildSkeleton()
          : state.error != null
              ? _buildError(state.error!)
              : _buildContent(state, theme),
    );
  }

  Widget _buildSkeleton() {
    return ShimmerWrapper(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const ShimmerBox(width: double.infinity, height: 120, borderRadius: 16),
          const SizedBox(height: 24),
          const ShimmerBox(width: 120, height: 24),
          const SizedBox(height: 16),
          for (var i = 0; i < 5; i++) ...[
            const ShimmerBox(width: double.infinity, height: 80, borderRadius: 12),
            const SizedBox(height: 12),
          ],
        ],
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
            onPressed: () => ref.read(customizationProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(CustomizationState state, ThemeData theme) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Current streak info
        _buildStreakInfo(state, theme),
        const SizedBox(height: 24),

        // Theme selection header
        Text(
          'Available Themes',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Unlock themes by maintaining longer streaks',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),

        // Theme list
        ...ThemeId.values.map((themeId) {
          final isUnlocked = state.unlockedThemes.contains(themeId);
          final isSelected = state.currentTheme == themeId;
          return _buildThemeCard(
            themeId,
            isUnlocked: isUnlocked,
            isSelected: isSelected,
            isUpdating: state.isUpdating,
            theme: theme,
          );
        }),
      ],
    );
  }

  Widget _buildStreakInfo(CustomizationState state, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.primary.withValues(alpha: 0.3),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(
            Icons.local_fire_department,
            size: 48,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Longest Streak',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(
                  '${state.longestStreak} days',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${state.unlockedThemes.length} / ${ThemeId.values.length} themes unlocked',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeCard(
    ThemeId themeId, {
    required bool isUnlocked,
    required bool isSelected,
    required bool isUpdating,
    required ThemeData theme,
  }) {
    final themeColors = _getThemeColors(themeId);
    final requiredStreak = themeId.requiredStreak;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: isUnlocked && !isSelected && !isUpdating
            ? () => _selectTheme(themeId)
            : null,
        child: Container(
          decoration: BoxDecoration(
            gradient: isUnlocked
                ? LinearGradient(
                    colors: [
                      themeColors.$1.withValues(alpha: 0.15),
                      themeColors.$2.withValues(alpha: 0.1),
                    ],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  )
                : null,
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Theme preview circle
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [themeColors.$1, themeColors.$2],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    border: isSelected
                        ? Border.all(color: theme.colorScheme.primary, width: 3)
                        : null,
                    boxShadow: isUnlocked
                        ? [
                            BoxShadow(
                              color: themeColors.$1.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: !isUnlocked
                      ? Icon(
                          Icons.lock,
                          size: 20,
                          color: Colors.white.withValues(alpha: 0.7),
                        )
                      : isSelected
                          ? const Icon(Icons.check, size: 20, color: Colors.white)
                          : null,
                ),
                const SizedBox(width: 16),

                // Theme info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            themeId.displayName,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isUnlocked
                                  ? null
                                  : theme.colorScheme.onSurface.withValues(alpha: 0.5),
                            ),
                          ),
                          if (isSelected) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Active',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.onPrimary,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isUnlocked
                            ? _getThemeDescription(themeId)
                            : 'Requires ${requiredStreak}-day streak',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isUnlocked
                              ? theme.colorScheme.onSurfaceVariant
                              : theme.colorScheme.error,
                        ),
                      ),
                    ],
                  ),
                ),

                // Action indicator
                if (isUnlocked && !isSelected)
                  Icon(
                    Icons.chevron_right,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  (Color, Color) _getThemeColors(ThemeId themeId) {
    switch (themeId) {
      case ThemeId.defaultTheme:
        return (const Color(0xFF6750A4), const Color(0xFF9C89B8));
      case ThemeId.midnight:
        return (const Color(0xFF1A237E), const Color(0xFF3F51B5));
      case ThemeId.ocean:
        return (const Color(0xFF006064), const Color(0xFF00BCD4));
      case ThemeId.forest:
        return (const Color(0xFF1B5E20), const Color(0xFF4CAF50));
      case ThemeId.sunset:
        return (const Color(0xFFE65100), const Color(0xFFFF9800));
    }
  }

  String _getThemeDescription(ThemeId themeId) {
    switch (themeId) {
      case ThemeId.defaultTheme:
        return 'Classic purple tones';
      case ThemeId.midnight:
        return 'Deep blue for night owls';
      case ThemeId.ocean:
        return 'Calming cyan waves';
      case ThemeId.forest:
        return 'Fresh green harmony';
      case ThemeId.sunset:
        return 'Warm orange glow';
    }
  }

  Future<void> _selectTheme(ThemeId themeId) async {
    final success =
        await ref.read(customizationProvider.notifier).updateTheme(themeId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Theme changed to ${themeId.displayName}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else if (!success && mounted) {
      final error = ref.read(customizationProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Failed to update theme'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }
}
