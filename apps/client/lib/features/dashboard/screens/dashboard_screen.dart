import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/models/models.dart';
import '../../profile/providers/profile_provider.dart';
import '../providers/dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textTheme = Theme.of(context).textTheme;

    final dashboardState = ref.watch(dashboardProvider);
    final formattedDate = ref.watch(formattedSelectedDateProvider);
    final isToday = ref.watch(isSelectedDateTodayProvider);
    final profile = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () => _selectDate(context, ref),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
        child: dashboardState.isLoading && dashboardState.dailySummary == null
            ? const Center(child: CircularProgressIndicator())
            : dashboardState.error != null
                ? _buildErrorState(context, ref, dashboardState.error!)
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Date navigation
                        _DateNavigation(
                          formattedDate: formattedDate,
                          isToday: isToday,
                          onPrevious: () =>
                              ref.read(dashboardProvider.notifier).previousDay(),
                          onNext: () =>
                              ref.read(dashboardProvider.notifier).nextDay(),
                          onToday: () =>
                              ref.read(dashboardProvider.notifier).goToToday(),
                        ),
                        const SizedBox(height: 16),

                        // Calorie progress card
                        _CalorieProgressCard(
                          summary: dashboardState.dailySummary,
                          profile: profile,
                        ),
                        const SizedBox(height: 24),

                        // Meals section
                        Text(
                          'Meals',
                          style: textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),

                        _MealCard(
                          icon: Icons.free_breakfast,
                          title: 'Breakfast',
                          entries: dashboardState
                                  .dailySummary?.entriesByMeal.breakfast ??
                              [],
                        ),
                        const SizedBox(height: 8),
                        _MealCard(
                          icon: Icons.lunch_dining,
                          title: 'Lunch',
                          entries:
                              dashboardState.dailySummary?.entriesByMeal.lunch ??
                                  [],
                        ),
                        const SizedBox(height: 8),
                        _MealCard(
                          icon: Icons.dinner_dining,
                          title: 'Dinner',
                          entries: dashboardState
                                  .dailySummary?.entriesByMeal.dinner ??
                              [],
                        ),
                        const SizedBox(height: 8),
                        _MealCard(
                          icon: Icons.cookie,
                          title: 'Snacks',
                          entries:
                              dashboardState.dailySummary?.entriesByMeal.snack ??
                                  [],
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Something went wrong',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref.read(dashboardProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectDate(BuildContext context, WidgetRef ref) async {
    final selectedDate = ref.read(selectedDateProvider);
    final picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) {
      ref.read(dashboardProvider.notifier).selectDate(picked);
    }
  }
}

class _DateNavigation extends StatelessWidget {
  final String formattedDate;
  final bool isToday;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onToday;

  const _DateNavigation({
    required this.formattedDate,
    required this.isToday,
    required this.onPrevious,
    required this.onNext,
    required this.onToday,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: onPrevious,
        ),
        Expanded(
          child: GestureDetector(
            onTap: isToday ? null : onToday,
            child: Text(
              formattedDate,
              style: textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: isToday ? null : onNext,
        ),
      ],
    );
  }
}

class _CalorieProgressCard extends StatelessWidget {
  final DailySummary? summary;
  final Profile? profile;

  const _CalorieProgressCard({
    required this.summary,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final totalCalories = summary?.totalCalories ?? 0;
    final calorieGoal = summary?.calorieGoal ?? profile?.calorieGoal ?? 2000;
    final progress = calorieGoal > 0 ? (totalCalories / calorieGoal).clamp(0.0, 1.5) : 0.0;

    final proteinCurrent = summary?.totalProtein ?? 0;
    final carbsCurrent = summary?.totalCarbs ?? 0;
    final fatCurrent = summary?.totalFat ?? 0;

    final proteinGoal = profile?.proteinGoal ?? 150;
    final carbsGoal = profile?.carbsGoal ?? 250;
    final fatGoal = profile?.fatGoal ?? 65;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Progress ring
            SizedBox(
              width: 160,
              height: 160,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 160,
                    height: 160,
                    child: CircularProgressIndicator(
                      value: progress.clamp(0.0, 1.0),
                      strokeWidth: 12,
                      backgroundColor: colorScheme.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        progress > 1.0 ? colorScheme.error : colorScheme.primary,
                      ),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        totalCalories.toInt().toString(),
                        style: textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'of ${calorieGoal.toInt()} kcal',
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Macro progress bars
            _MacroProgressRow(
              label: 'Protein',
              current: proteinCurrent,
              target: proteinGoal,
              color: Colors.blue,
            ),
            const SizedBox(height: 12),
            _MacroProgressRow(
              label: 'Carbs',
              current: carbsCurrent,
              target: carbsGoal,
              color: Colors.orange,
            ),
            const SizedBox(height: 12),
            _MacroProgressRow(
              label: 'Fat',
              current: fatCurrent,
              target: fatGoal,
              color: Colors.purple,
            ),
          ],
        ),
      ),
    );
  }
}

class _MacroProgressRow extends StatelessWidget {
  final String label;
  final double current;
  final double target;
  final Color color;

  const _MacroProgressRow({
    required this.label,
    required this.current,
    required this.target,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final progress = target > 0 ? (current / target).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: textTheme.bodyMedium,
            ),
            Text(
              '${current.toInt()}/${target.toInt()}g',
              style: textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: color.withValues(alpha: 0.2),
          valueColor: AlwaysStoppedAnimation<Color>(color),
          borderRadius: BorderRadius.circular(4),
          minHeight: 8,
        ),
      ],
    );
  }
}

class _MealCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final List<FoodEntry> entries;

  const _MealCard({
    required this.icon,
    required this.title,
    required this.entries,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final totalCalories = entries.fold<double>(
      0,
      (sum, entry) => sum + entry.calories,
    );

    return Card(
      child: ExpansionTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: colorScheme.onPrimaryContainer,
          ),
        ),
        title: Text(title),
        trailing: Text(
          '${totalCalories.toInt()} kcal',
          style: textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        children: entries.isEmpty
            ? [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'No entries yet',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ]
            : entries.map((entry) => _FoodEntryTile(entry: entry)).toList(),
      ),
    );
  }
}

class _FoodEntryTile extends StatelessWidget {
  final FoodEntry entry;

  const _FoodEntryTile({required this.entry});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return ListTile(
      title: Text(
        entry.displayName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        '${entry.servingSize.toInt()} ${entry.servingUnit}',
        style: textTheme.bodySmall?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
      ),
      trailing: Text(
        '${entry.calories.toInt()} kcal',
        style: textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: () {
        context.push('/food/edit/${entry.id}');
      },
    );
  }
}
