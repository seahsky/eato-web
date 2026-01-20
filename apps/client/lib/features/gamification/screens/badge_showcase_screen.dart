import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/models/models.dart';
import '../providers/gamification_provider.dart';

class BadgeShowcaseScreen extends ConsumerStatefulWidget {
  const BadgeShowcaseScreen({super.key});

  @override
  ConsumerState<BadgeShowcaseScreen> createState() => _BadgeShowcaseScreenState();
}

class _BadgeShowcaseScreenState extends ConsumerState<BadgeShowcaseScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _categories = BadgeCategory.values;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _categories.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(badgesByCategoryProvider.notifier).fetch();
      ref.read(achievementsProvider.notifier).fetch();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoryState = ref.watch(badgesByCategoryProvider);
    final achievementsState = ref.watch(achievementsProvider);

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: _buildHeader(achievementsState),
            ),
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabs: _categories.map((c) => Tab(text: c.displayName)).toList(),
            ),
          ),
        ],
        body: categoryState.isLoading
            ? const Center(child: CircularProgressIndicator())
            : categoryState.error != null
                ? _buildError(categoryState.error!)
                : TabBarView(
                    controller: _tabController,
                    children: _categories.map((category) {
                      final badges =
                          categoryState.data?.forCategory(category) ?? [];
                      return _buildBadgeGrid(badges, category);
                    }).toList(),
                  ),
      ),
    );
  }

  Widget _buildHeader(AchievementsState state) {
    final theme = Theme.of(context);
    final unlockedCount = state.unlockedCount;
    final totalBadges = state.totalBadges;
    final progress = totalBadges > 0 ? unlockedCount / totalBadges : 0.0;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.primary.withValues(alpha: 0.3),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.military_tech,
                    size: 48,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$unlockedCount / $totalBadges',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Badges Unlocked',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: theme.colorScheme.surfaceContainerHighest,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${(progress * 100).round()}% complete',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
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
            onPressed: () =>
                ref.read(badgesByCategoryProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeGrid(List<Badge> badges, BadgeCategory category) {
    if (badges.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.emoji_events_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No ${category.displayName.toLowerCase()} badges yet',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.9,
      ),
      itemCount: badges.length,
      itemBuilder: (context, index) {
        final badge = badges[index];
        return _BadgeCard(badge: badge);
      },
    );
  }
}

class _BadgeCard extends StatelessWidget {
  final Badge badge;

  const _BadgeCard({required this.badge});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUnlocked = badge.unlocked ?? false;
    final rarityColor = Color(badge.rarity.colorValue);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _showBadgeDetails(context),
        child: Container(
          decoration: BoxDecoration(
            gradient: isUnlocked
                ? LinearGradient(
                    colors: [
                      rarityColor.withValues(alpha: 0.1),
                      rarityColor.withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
          ),
          child: Stack(
            children: [
              // Rarity indicator
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: rarityColor.withValues(alpha: isUnlocked ? 1 : 0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badge.rarity.displayName,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isUnlocked ? Colors.white : rarityColor,
                    ),
                  ),
                ),
              ),

              // Content
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Icon
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: isUnlocked
                            ? rarityColor.withValues(alpha: 0.2)
                            : theme.colorScheme.surfaceContainerHighest,
                        shape: BoxShape.circle,
                        border: isUnlocked
                            ? Border.all(color: rarityColor, width: 2)
                            : null,
                      ),
                      child: Center(
                        child: Icon(
                          _getIconForBadge(badge.icon),
                          size: 28,
                          color: isUnlocked
                              ? rarityColor
                              : theme.colorScheme.onSurfaceVariant
                                  .withValues(alpha: 0.5),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Name
                    Text(
                      badge.name,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isUnlocked
                            ? null
                            : theme.colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ),

                    const SizedBox(height: 4),

                    // Requirement or unlock date
                    Text(
                      isUnlocked && badge.unlockedAt != null
                          ? _formatDate(badge.unlockedAt!)
                          : badge.requirement,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),

              // Locked overlay
              if (!isUnlocked)
                Positioned.fill(
                  child: Container(
                    color: theme.colorScheme.surface.withValues(alpha: 0.5),
                    child: Center(
                      child: Icon(
                        Icons.lock,
                        size: 24,
                        color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showBadgeDetails(BuildContext context) {
    final theme = Theme.of(context);
    final isUnlocked = badge.unlocked ?? false;
    final rarityColor = Color(badge.rarity.colorValue);

    showModalBottomSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: isUnlocked
                    ? rarityColor.withValues(alpha: 0.2)
                    : theme.colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
                border: isUnlocked
                    ? Border.all(color: rarityColor, width: 3)
                    : null,
              ),
              child: Center(
                child: Icon(
                  _getIconForBadge(badge.icon),
                  size: 40,
                  color: isUnlocked
                      ? rarityColor
                      : theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Name
            Text(
              badge.name,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 4),

            // Rarity
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: rarityColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                badge.rarity.displayName,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Description
            Text(
              badge.description,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium,
            ),

            const SizedBox(height: 8),

            // Requirement
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isUnlocked ? Icons.check_circle : Icons.info_outline,
                    size: 20,
                    color: isUnlocked ? Colors.green : null,
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      isUnlocked
                          ? 'Unlocked ${_formatDate(badge.unlockedAt!)}'
                          : badge.requirement,
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  IconData _getIconForBadge(String iconName) {
    // Map backend icon names to Flutter icons
    final iconMap = <String, IconData>{
      'utensils': Icons.restaurant,
      'flame': Icons.local_fire_department,
      'fire': Icons.whatshot,
      'calendar': Icons.calendar_month,
      'calendar-check': Icons.event_available,
      'calendar-days': Icons.date_range,
      'star': Icons.star,
      'trophy': Icons.emoji_events,
      'crown': Icons.workspace_premium,
      'medal': Icons.military_tech,
      'sparkles': Icons.auto_awesome,
      'award': Icons.stars,
      'list-check': Icons.checklist,
      'compass': Icons.explore,
      'scan': Icons.qr_code_scanner,
      'sun': Icons.wb_sunny,
      'target': Icons.gps_fixed,
      'check-circle': Icons.check_circle,
      'pie-chart': Icons.pie_chart,
      'zap': Icons.flash_on,
      'heart': Icons.favorite,
      'users': Icons.people,
      'bell': Icons.notifications,
      'gift': Icons.card_giftcard,
    };

    return iconMap[iconName] ?? Icons.emoji_events;
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
