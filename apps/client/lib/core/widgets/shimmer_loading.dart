import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Base shimmer wrapper for consistent styling
class ShimmerWrapper extends StatelessWidget {
  final Widget child;

  const ShimmerWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey[800]! : Colors.grey[300]!,
      highlightColor: isDark ? Colors.grey[700]! : Colors.grey[100]!,
      child: child,
    );
  }
}

/// Shimmer box placeholder
class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 4,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

/// Shimmer for a list item (food entry style)
class ShimmerListItem extends StatelessWidget {
  const ShimmerListItem({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            const ShimmerBox(width: 48, height: 48, borderRadius: 8),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(width: double.infinity, height: 16),
                  const SizedBox(height: 8),
                  ShimmerBox(width: 120, height: 12),
                ],
              ),
            ),
            const SizedBox(width: 12),
            const ShimmerBox(width: 60, height: 16),
          ],
        ),
      ),
    );
  }
}

/// Shimmer for a meal card
class ShimmerMealCard extends StatelessWidget {
  const ShimmerMealCard({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const ShimmerBox(width: 40, height: 40, borderRadius: 8),
              const SizedBox(width: 12),
              Expanded(
                child: ShimmerBox(width: double.infinity, height: 20),
              ),
              const SizedBox(width: 12),
              const ShimmerBox(width: 70, height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shimmer for calorie progress card
class ShimmerCalorieCard extends StatelessWidget {
  const ShimmerCalorieCard({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Circular progress
              const ShimmerBox(width: 160, height: 160, borderRadius: 80),
              const SizedBox(height: 20),
              // Macro bars
              _buildMacroRow(),
              const SizedBox(height: 12),
              _buildMacroRow(),
              const SizedBox(height: 12),
              _buildMacroRow(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMacroRow() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const ShimmerBox(width: 60, height: 14),
            const ShimmerBox(width: 50, height: 14),
          ],
        ),
        const SizedBox(height: 4),
        ShimmerBox(width: double.infinity, height: 8, borderRadius: 4),
      ],
    );
  }
}

/// Shimmer for recipe card
class ShimmerRecipeCard extends StatelessWidget {
  const ShimmerRecipeCard({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const ShimmerBox(width: 64, height: 64, borderRadius: 8),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerBox(width: double.infinity, height: 18),
                    const SizedBox(height: 8),
                    const ShimmerBox(width: 80, height: 14),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const ShimmerBox(width: 50, height: 12),
                        const SizedBox(width: 16),
                        const ShimmerBox(width: 50, height: 12),
                        const SizedBox(width: 16),
                        const ShimmerBox(width: 50, height: 12),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shimmer for streak display widget
class ShimmerStreakDisplay extends StatelessWidget {
  const ShimmerStreakDisplay({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const ShimmerBox(width: 32, height: 32, borderRadius: 16),
            const SizedBox(width: 8),
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerBox(width: 40, height: 24),
                const SizedBox(height: 4),
                const ShimmerBox(width: 30, height: 12),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer for badge grid
class ShimmerBadgeGrid extends StatelessWidget {
  final int count;

  const ShimmerBadgeGrid({super.key, this.count = 6});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.85,
        ),
        itemCount: count,
        itemBuilder: (context, index) => const _ShimmerBadgeItem(),
      ),
    );
  }
}

class _ShimmerBadgeItem extends StatelessWidget {
  const _ShimmerBadgeItem();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const ShimmerBox(width: 64, height: 64, borderRadius: 32),
        const SizedBox(height: 8),
        const ShimmerBox(width: 60, height: 12),
      ],
    );
  }
}

/// Full dashboard loading skeleton
class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Date navigation shimmer
          ShimmerWrapper(
            child: Row(
              children: [
                const ShimmerBox(width: 40, height: 40, borderRadius: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Center(
                    child: const ShimmerBox(width: 150, height: 24),
                  ),
                ),
                const SizedBox(width: 8),
                const ShimmerBox(width: 40, height: 40, borderRadius: 20),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Calorie progress card
          const ShimmerCalorieCard(),
          const SizedBox(height: 24),

          // Meals header
          ShimmerWrapper(
            child: const ShimmerBox(width: 80, height: 24),
          ),
          const SizedBox(height: 12),

          // Meal cards
          const ShimmerMealCard(),
          const SizedBox(height: 8),
          const ShimmerMealCard(),
          const SizedBox(height: 8),
          const ShimmerMealCard(),
          const SizedBox(height: 8),
          const ShimmerMealCard(),
        ],
      ),
    );
  }
}

/// Recipe list loading skeleton
class RecipeListSkeleton extends StatelessWidget {
  final int count;

  const RecipeListSkeleton({super.key, this.count = 5});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: count,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, __) => const ShimmerRecipeCard(),
    );
  }
}

/// Food search results skeleton
class FoodSearchSkeleton extends StatelessWidget {
  final int count;

  const FoodSearchSkeleton({super.key, this.count = 8});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: count,
      itemBuilder: (_, __) => const ShimmerListItem(),
    );
  }
}

/// Profile screen skeleton
class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Avatar
            const ShimmerBox(width: 100, height: 100, borderRadius: 50),
            const SizedBox(height: 16),
            // Name
            const ShimmerBox(width: 150, height: 24),
            const SizedBox(height: 8),
            // Email
            const ShimmerBox(width: 200, height: 16),
            const SizedBox(height: 32),
            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatItem(),
                _buildStatItem(),
                _buildStatItem(),
              ],
            ),
            const SizedBox(height: 24),
            // Settings sections
            for (var i = 0; i < 4; i++) ...[
              const ShimmerBox(width: double.infinity, height: 60, borderRadius: 12),
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem() {
    return Column(
      children: [
        const ShimmerBox(width: 40, height: 40, borderRadius: 20),
        const SizedBox(height: 8),
        const ShimmerBox(width: 60, height: 14),
        const SizedBox(height: 4),
        const ShimmerBox(width: 40, height: 12),
      ],
    );
  }
}

/// Partner screen skeleton
class PartnerSkeleton extends StatelessWidget {
  const PartnerSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Partner card
            const ShimmerBox(width: double.infinity, height: 120, borderRadius: 16),
            const SizedBox(height: 24),
            // Actions section
            const ShimmerBox(width: 120, height: 20),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: const ShimmerBox(width: double.infinity, height: 80, borderRadius: 12)),
                const SizedBox(width: 12),
                Expanded(child: const ShimmerBox(width: double.infinity, height: 80, borderRadius: 12)),
              ],
            ),
            const SizedBox(height: 24),
            // Stats section
            const ShimmerBox(width: 100, height: 20),
            const SizedBox(height: 16),
            const ShimmerBox(width: double.infinity, height: 160, borderRadius: 16),
          ],
        ),
      ),
    );
  }
}

/// Streak detail skeleton
class StreakDetailSkeleton extends StatelessWidget {
  const StreakDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Streak display
            const ShimmerBox(width: double.infinity, height: 200, borderRadius: 16),
            const SizedBox(height: 24),
            // Milestone progress
            const ShimmerBox(width: 150, height: 20),
            const SizedBox(height: 12),
            const ShimmerBox(width: double.infinity, height: 12, borderRadius: 6),
            const SizedBox(height: 24),
            // Stats grid
            Row(
              children: [
                Expanded(child: const ShimmerBox(width: double.infinity, height: 100, borderRadius: 12)),
                const SizedBox(width: 12),
                Expanded(child: const ShimmerBox(width: double.infinity, height: 100, borderRadius: 12)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: const ShimmerBox(width: double.infinity, height: 100, borderRadius: 12)),
                const SizedBox(width: 12),
                Expanded(child: const ShimmerBox(width: double.infinity, height: 100, borderRadius: 12)),
              ],
            ),
            const SizedBox(height: 24),
            // Rest days section
            const ShimmerBox(width: 120, height: 20),
            const SizedBox(height: 12),
            const ShimmerBox(width: double.infinity, height: 100, borderRadius: 12),
          ],
        ),
      ),
    );
  }
}

/// Notification settings skeleton
class NotificationSettingsSkeleton extends StatelessWidget {
  const NotificationSettingsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerWrapper(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          for (var i = 0; i < 6; i++) ...[
            const ShimmerBox(width: double.infinity, height: 64, borderRadius: 12),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}
