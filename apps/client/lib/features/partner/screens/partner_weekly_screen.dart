import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/models/models.dart';
import '../providers/partner_provider.dart';
import '../providers/partner_weekly_provider.dart';

class PartnerWeeklyScreen extends ConsumerWidget {
  const PartnerWeeklyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partnerState = ref.watch(partnerProvider);
    final weeklyState = ref.watch(partnerWeeklyProvider);
    final weekRange = ref.watch(partnerWeekRangeProvider);
    final isCurrentWeek = ref.watch(isPartnerCurrentWeekProvider);

    final partner = partnerState.partner;

    return Scaffold(
      appBar: AppBar(
        title: Text(partner != null
            ? "${partner.displayName}'s Week"
            : 'Partner Weekly'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(partnerWeeklyProvider.notifier).refresh(),
        child: weeklyState.isLoading && weeklyState.weeklySummary == null
            ? const Center(child: CircularProgressIndicator())
            : weeklyState.error != null
                ? _buildErrorState(context, ref, weeklyState.error!)
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Week navigation
                        _WeekNavigation(
                          weekRange: weekRange,
                          isCurrentWeek: isCurrentWeek,
                          onPrevious: () =>
                              ref.read(partnerWeeklyProvider.notifier).previousWeek(),
                          onNext: () =>
                              ref.read(partnerWeeklyProvider.notifier).nextWeek(),
                          onCurrent: () =>
                              ref.read(partnerWeeklyProvider.notifier).goToCurrentWeek(),
                        ),
                        const SizedBox(height: 24),

                        // Weekly overview card
                        if (weeklyState.weeklySummary != null)
                          _WeeklyOverviewCard(summary: weeklyState.weeklySummary!),
                        const SizedBox(height: 24),

                        // Daily chart
                        if (weeklyState.weeklySummary != null) ...[
                          Text(
                            'Daily Calories',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 12),
                          _DailyCaloriesChart(
                            dailyData: weeklyState.weeklySummary!.dailyData,
                            calorieGoal: weeklyState.weeklySummary!.calorieGoal,
                          ),
                        ],
                        const SizedBox(height: 24),

                        // Averages section
                        if (weeklyState.weeklySummary != null) ...[
                          Text(
                            'Daily Averages',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 12),
                          _AveragesCard(summary: weeklyState.weeklySummary!),
                        ],
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
              onPressed: () => ref.read(partnerWeeklyProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _WeekNavigation extends StatelessWidget {
  final String weekRange;
  final bool isCurrentWeek;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onCurrent;

  const _WeekNavigation({
    required this.weekRange,
    required this.isCurrentWeek,
    required this.onPrevious,
    required this.onNext,
    required this.onCurrent,
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
            onTap: isCurrentWeek ? null : onCurrent,
            child: Column(
              children: [
                Text(
                  weekRange,
                  style: textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (!isCurrentWeek)
                  Text(
                    'Tap to go to current week',
                    style: textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
              ],
            ),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: isCurrentWeek ? null : onNext,
        ),
      ],
    );
  }
}

class _WeeklyOverviewCard extends StatelessWidget {
  final WeeklySummary summary;

  const _WeeklyOverviewCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final weeklyGoal = summary.calorieGoal * 7;
    final progress = weeklyGoal > 0 ? (summary.totalCalories / weeklyGoal).clamp(0.0, 1.5) : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Progress ring
            SizedBox(
              width: 140,
              height: 140,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 140,
                    height: 140,
                    child: CircularProgressIndicator(
                      value: progress.clamp(0.0, 1.0),
                      strokeWidth: 10,
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
                        summary.totalCalories.toInt().toString(),
                        style: textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'of ${weeklyGoal.toInt()} kcal',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  label: 'Days Logged',
                  value: '${summary.daysLogged}',
                  icon: Icons.calendar_today,
                ),
                _StatItem(
                  label: 'On Target',
                  value: '${summary.daysOnGoal}',
                  icon: Icons.check_circle_outline,
                ),
                _StatItem(
                  label: 'Avg/Day',
                  value: '${summary.averageCalories.toInt()}',
                  icon: Icons.show_chart,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Icon(
          icon,
          color: colorScheme.primary,
          size: 20,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _DailyCaloriesChart extends StatelessWidget {
  final List<DailyData> dailyData;
  final double calorieGoal;

  const _DailyCaloriesChart({
    required this.dailyData,
    required this.calorieGoal,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    // Ensure we have 7 days of data (pad with empty if necessary)
    final paddedData = List.generate(7, (index) {
      if (index < dailyData.length) {
        return dailyData[index];
      }
      // Create empty data for missing days
      return DailyData(
        date: DateTime.now(),
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        goalMet: false,
      );
    });

    final maxCalories = paddedData.fold<double>(
      calorieGoal,
      (max, data) => data.calories > max ? data.calories : max,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 200,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: maxCalories * 1.2,
              barTouchData: BarTouchData(
                enabled: true,
                touchTooltipData: BarTouchTooltipData(
                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                    final day = _getDayName(groupIndex);
                    return BarTooltipItem(
                      '$day\n${rod.toY.toInt()} kcal',
                      TextStyle(color: colorScheme.onSurface),
                    );
                  },
                ),
              ),
              titlesData: FlTitlesData(
                show: true,
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                      final index = value.toInt();
                      if (index >= 0 && index < days.length) {
                        return Text(
                          days[index],
                          style: TextStyle(
                            color: colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                            fontSize: 12,
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ),
                leftTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
              ),
              borderData: FlBorderData(show: false),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: calorieGoal,
                getDrawingHorizontalLine: (value) {
                  return FlLine(
                    color: colorScheme.primary.withValues(alpha: 0.3),
                    strokeWidth: 2,
                    dashArray: [5, 5],
                  );
                },
              ),
              barGroups: List.generate(7, (index) {
                final data = paddedData[index];
                final isOnTarget = data.goalMet;
                return BarChartGroupData(
                  x: index,
                  barRods: [
                    BarChartRodData(
                      toY: data.calories,
                      color: isOnTarget
                          ? colorScheme.primary
                          : data.calories > calorieGoal
                              ? colorScheme.error
                              : colorScheme.primary.withValues(alpha: 0.5),
                      width: 24,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(4),
                        topRight: Radius.circular(4),
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  String _getDayName(int index) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return index >= 0 && index < days.length ? days[index] : '';
  }
}

class _AveragesCard extends StatelessWidget {
  final WeeklySummary summary;

  const _AveragesCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _AverageRow(
              label: 'Calories',
              value: '${summary.averageCalories.toInt()} kcal',
              color: colorScheme.primary,
            ),
            const Divider(),
            _AverageRow(
              label: 'Protein',
              value: '${summary.averageProtein.toInt()}g',
              color: Colors.blue,
            ),
            const Divider(),
            _AverageRow(
              label: 'Carbs',
              value: '${summary.averageCarbs.toInt()}g',
              color: Colors.orange,
            ),
            const Divider(),
            _AverageRow(
              label: 'Fat',
              value: '${summary.averageFat.toInt()}g',
              color: Colors.purple,
            ),
          ],
        ),
      ),
    );
  }
}

class _AverageRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _AverageRow({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: textTheme.bodyLarge,
              ),
            ],
          ),
          Text(
            value,
            style: textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
