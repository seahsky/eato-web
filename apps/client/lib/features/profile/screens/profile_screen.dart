import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // TODO: Navigate to settings
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User info card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: colorScheme.primaryContainer,
                      child: Icon(
                        Icons.person,
                        size: 40,
                        color: colorScheme.onPrimaryContainer,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'User Name',
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'user@example.com',
                            style: textTheme.bodyMedium?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit),
                      onPressed: () {
                        // TODO: Edit profile
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Stats section
            Text(
              'Daily Goals',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Column(
                children: [
                  _GoalTile(
                    icon: Icons.local_fire_department,
                    label: 'Calorie Goal',
                    value: '2,000 kcal',
                  ),
                  const Divider(height: 1),
                  _GoalTile(
                    icon: Icons.fitness_center,
                    label: 'Protein Goal',
                    value: '150 g',
                  ),
                  const Divider(height: 1),
                  _GoalTile(
                    icon: Icons.grain,
                    label: 'Carb Goal',
                    value: '250 g',
                  ),
                  const Divider(height: 1),
                  _GoalTile(
                    icon: Icons.opacity,
                    label: 'Fat Goal',
                    value: '65 g',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Body metrics section
            Text(
              'Body Metrics',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Column(
                children: const [
                  _MetricTile(label: 'Height', value: '175 cm'),
                  Divider(height: 1),
                  _MetricTile(label: 'Weight', value: '70 kg'),
                  Divider(height: 1),
                  _MetricTile(label: 'Age', value: '30 years'),
                  Divider(height: 1),
                  _MetricTile(label: 'Activity Level', value: 'Moderate'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Calculated values
            Text(
              'Calculated Values',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Column(
                children: const [
                  _MetricTile(label: 'BMR', value: '1,700 kcal'),
                  Divider(height: 1),
                  _MetricTile(label: 'TDEE', value: '2,300 kcal'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sign out button
            OutlinedButton(
              onPressed: () {
                // TODO: Sign out
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: colorScheme.error,
                side: BorderSide(color: colorScheme.error),
              ),
              child: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoalTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _GoalTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return ListTile(
      leading: Icon(icon, color: colorScheme.primary),
      title: Text(label),
      trailing: Text(
        value,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
      ),
      onTap: () {
        // TODO: Edit goal
      },
    );
  }
}

class _MetricTile extends StatelessWidget {
  final String label;
  final String value;

  const _MetricTile({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label),
      trailing: Text(
        value,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
      ),
      onTap: () {
        // TODO: Edit metric
      },
    );
  }
}
