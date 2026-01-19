import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () {
              // TODO: Open date picker
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // TODO: Refresh data
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date header
              Text(
                'Today',
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              // Calorie progress card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      // Progress ring placeholder
                      Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: colorScheme.surfaceContainerHighest,
                            width: 12,
                          ),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '0',
                                style: textTheme.headlineLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'of 2000 kcal',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Macro progress bars
                      _MacroProgressRow(
                        label: 'Protein',
                        current: 0,
                        target: 150,
                        color: Colors.blue,
                      ),
                      const SizedBox(height: 12),
                      _MacroProgressRow(
                        label: 'Carbs',
                        current: 0,
                        target: 250,
                        color: Colors.orange,
                      ),
                      const SizedBox(height: 12),
                      _MacroProgressRow(
                        label: 'Fat',
                        current: 0,
                        target: 65,
                        color: Colors.purple,
                      ),
                    ],
                  ),
                ),
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
                calories: 0,
              ),
              const SizedBox(height: 8),
              _MealCard(
                icon: Icons.lunch_dining,
                title: 'Lunch',
                calories: 0,
              ),
              const SizedBox(height: 8),
              _MealCard(
                icon: Icons.dinner_dining,
                title: 'Dinner',
                calories: 0,
              ),
              const SizedBox(height: 8),
              _MealCard(
                icon: Icons.cookie,
                title: 'Snacks',
                calories: 0,
              ),
            ],
          ),
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
          backgroundColor: color.withOpacity(0.2),
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
  final int calories;

  const _MealCard({
    required this.icon,
    required this.title,
    required this.calories,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: ListTile(
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
          '$calories kcal',
          style: textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        onTap: () {
          // TODO: Navigate to meal detail
        },
      ),
    );
  }
}
