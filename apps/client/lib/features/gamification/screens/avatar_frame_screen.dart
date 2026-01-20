import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/models/models.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../providers/gamification_provider.dart';

class AvatarFrameScreen extends ConsumerStatefulWidget {
  const AvatarFrameScreen({super.key});

  @override
  ConsumerState<AvatarFrameScreen> createState() => _AvatarFrameScreenState();
}

class _AvatarFrameScreenState extends ConsumerState<AvatarFrameScreen> {
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
        title: const Text('Avatar Frame'),
      ),
      body: state.badgeCount == 0 && state.currentAvatarFrame == AvatarFrame.none
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
          const Center(child: ShimmerBox(width: 160, height: 160, borderRadius: 80)),
          const SizedBox(height: 24),
          const ShimmerBox(width: double.infinity, height: 100, borderRadius: 16),
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
        // Avatar preview
        _buildAvatarPreview(state, theme),
        const SizedBox(height: 24),

        // Badge progress info
        _buildBadgeProgress(state, theme),
        const SizedBox(height: 24),

        // Frame selection header
        Text(
          'Available Frames',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Unlock frames by collecting badges',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),

        // Frame list
        ...AvatarFrame.values.map((frame) {
          final isUnlocked = state.badgeCount >= frame.requiredBadges;
          final isSelected = state.currentAvatarFrame == frame;
          return _buildFrameCard(
            frame,
            isUnlocked: isUnlocked,
            isSelected: isSelected,
            isUpdating: state.isUpdating,
            badgeCount: state.badgeCount,
            theme: theme,
          );
        }),
      ],
    );
  }

  Widget _buildAvatarPreview(CustomizationState state, ThemeData theme) {
    final frameColor = _getFrameColor(state.currentAvatarFrame);

    return Center(
      child: Column(
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: state.currentAvatarFrame != AvatarFrame.none
                  ? Border.all(
                      color: frameColor,
                      width: 4,
                    )
                  : null,
              boxShadow: state.currentAvatarFrame != AvatarFrame.none
                  ? [
                      BoxShadow(
                        color: frameColor.withValues(alpha: 0.4),
                        blurRadius: 16,
                        spreadRadius: 2,
                      ),
                    ]
                  : null,
            ),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: theme.colorScheme.surfaceContainerHighest,
              ),
              child: Icon(
                Icons.person,
                size: 60,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            state.currentAvatarFrame == AvatarFrame.none
                ? 'No Frame'
                : '${state.currentAvatarFrame.displayName} Frame',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: state.currentAvatarFrame != AvatarFrame.none
                  ? frameColor
                  : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeProgress(CustomizationState state, ThemeData theme) {
    final totalBadges = state.badgeCount;
    final nextFrame = _getNextUnlockedFrame(state);
    final badgesNeeded = nextFrame != null ? nextFrame.requiredBadges - totalBadges : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.military_tech,
                size: 32,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                '$totalBadges Badges',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          if (nextFrame != null) ...[
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: totalBadges / nextFrame.requiredBadges,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 8),
            Text(
              '$badgesNeeded more badges to unlock ${nextFrame.displayName} Frame',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ] else ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.emoji_events, size: 16, color: Colors.amber[700]),
                const SizedBox(width: 4),
                Text(
                  'All frames unlocked!',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.amber[700],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  AvatarFrame? _getNextUnlockedFrame(CustomizationState state) {
    for (final frame in AvatarFrame.values) {
      if (state.badgeCount < frame.requiredBadges) {
        return frame;
      }
    }
    return null;
  }

  Widget _buildFrameCard(
    AvatarFrame frame, {
    required bool isUnlocked,
    required bool isSelected,
    required bool isUpdating,
    required int badgeCount,
    required ThemeData theme,
  }) {
    final frameColor = _getFrameColor(frame);
    final requiredBadges = frame.requiredBadges;
    final progress = requiredBadges > 0 ? badgeCount / requiredBadges : 1.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: isUnlocked && !isSelected && !isUpdating
            ? () => _selectFrame(frame)
            : null,
        child: Container(
          decoration: BoxDecoration(
            gradient: isUnlocked
                ? LinearGradient(
                    colors: [
                      frameColor.withValues(alpha: 0.15),
                      frameColor.withValues(alpha: 0.05),
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
                // Frame preview
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: frame != AvatarFrame.none
                        ? Border.all(
                            color: isUnlocked
                                ? frameColor
                                : frameColor.withValues(alpha: 0.3),
                            width: 3,
                          )
                        : null,
                    color: isUnlocked
                        ? null
                        : theme.colorScheme.surfaceContainerHighest,
                  ),
                  child: Container(
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: theme.colorScheme.surfaceContainerHighest,
                    ),
                    child: Center(
                      child: !isUnlocked
                          ? Icon(
                              Icons.lock,
                              size: 18,
                              color: theme.colorScheme.onSurfaceVariant
                                  .withValues(alpha: 0.5),
                            )
                          : isSelected
                              ? Icon(
                                  Icons.check,
                                  size: 18,
                                  color: frameColor,
                                )
                              : Icon(
                                  Icons.person,
                                  size: 18,
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),

                // Frame info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            frame == AvatarFrame.none
                                ? 'No Frame'
                                : '${frame.displayName} Frame',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isUnlocked
                                  ? null
                                  : theme.colorScheme.onSurface
                                      .withValues(alpha: 0.5),
                            ),
                          ),
                          if (isSelected) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: frameColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Active',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (!isUnlocked) ...[
                        Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: progress.clamp(0.0, 1.0),
                                  backgroundColor:
                                      theme.colorScheme.surfaceContainerHighest,
                                  valueColor:
                                      AlwaysStoppedAnimation<Color>(frameColor),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '$badgeCount/$requiredBadges',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ] else ...[
                        Text(
                          _getFrameDescription(frame),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
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

  Color _getFrameColor(AvatarFrame frame) {
    switch (frame) {
      case AvatarFrame.none:
        return Colors.grey;
      case AvatarFrame.bronze:
        return const Color(0xFFCD7F32);
      case AvatarFrame.silver:
        return const Color(0xFFC0C0C0);
      case AvatarFrame.gold:
        return const Color(0xFFFFD700);
      case AvatarFrame.diamond:
        return const Color(0xFFB9F2FF);
    }
  }

  String _getFrameDescription(AvatarFrame frame) {
    switch (frame) {
      case AvatarFrame.none:
        return 'Simple and clean';
      case AvatarFrame.bronze:
        return 'A warm copper glow';
      case AvatarFrame.silver:
        return 'Elegant silver shine';
      case AvatarFrame.gold:
        return 'Prestigious golden halo';
      case AvatarFrame.diamond:
        return 'The ultimate achievement';
    }
  }

  Future<void> _selectFrame(AvatarFrame frame) async {
    final success =
        await ref.read(customizationProvider.notifier).updateAvatarFrame(frame);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            frame == AvatarFrame.none
                ? 'Frame removed'
                : 'Frame changed to ${frame.displayName}',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else if (!success && mounted) {
      final error = ref.read(customizationProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Failed to update frame'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }
}
