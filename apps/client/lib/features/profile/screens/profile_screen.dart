import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/models/models.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../auth/providers/auth_provider.dart';
import '../../gamification/widgets/streak_display.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final authState = ref.watch(authProvider);
    final profileState = ref.watch(profileProvider);
    final profile = profileState.profile;
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: profileState.isLoading && profile == null
          ? const ProfileSkeleton()
          : profileState.error != null && profile == null
              ? _buildErrorState(context, ref, profileState.error!)
              : RefreshIndicator(
                  onRefresh: () => ref.read(profileProvider.notifier).refresh(),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
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
                                  backgroundImage: user?.avatarUrl != null
                                      ? NetworkImage(user!.avatarUrl!)
                                      : null,
                                  child: user?.avatarUrl == null
                                      ? Icon(
                                          Icons.person,
                                          size: 40,
                                          color: colorScheme.onPrimaryContainer,
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        user?.name ?? 'User',
                                        style: textTheme.titleLarge?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        user?.email ?? '',
                                        style: textTheme.bodyMedium?.copyWith(
                                          color: colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.edit),
                                  onPressed: () => _showEditProfileSheet(context, ref, profile),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Achievements/Streak Card
                        StreakCard(
                          onViewBadges: () => context.push('/badges'),
                          onViewStreakDetails: () => context.push('/streak'),
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
                                value: profile != null
                                    ? '${profile.calorieGoal.toInt()} kcal'
                                    : '-- kcal',
                                onTap: () => _showCalorieGoalDialog(context, ref, profile),
                              ),
                              const Divider(height: 1),
                              _GoalTile(
                                icon: Icons.fitness_center,
                                label: 'Protein Goal',
                                value: profile != null
                                    ? '${profile.proteinGoal.toInt()} g'
                                    : '-- g',
                              ),
                              const Divider(height: 1),
                              _GoalTile(
                                icon: Icons.grain,
                                label: 'Carb Goal',
                                value: profile != null
                                    ? '${profile.carbsGoal.toInt()} g'
                                    : '-- g',
                              ),
                              const Divider(height: 1),
                              _GoalTile(
                                icon: Icons.opacity,
                                label: 'Fat Goal',
                                value: profile != null
                                    ? '${profile.fatGoal.toInt()} g'
                                    : '-- g',
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
                            children: [
                              _MetricTile(
                                label: 'Height',
                                value: profile != null
                                    ? '${profile.height.toInt()} cm'
                                    : '-- cm',
                              ),
                              const Divider(height: 1),
                              _MetricTile(
                                label: 'Weight',
                                value: profile != null
                                    ? '${profile.weight.toStringAsFixed(1)} kg'
                                    : '-- kg',
                              ),
                              const Divider(height: 1),
                              _MetricTile(
                                label: 'Age',
                                value: profile != null
                                    ? '${profile.age} years'
                                    : '-- years',
                              ),
                              const Divider(height: 1),
                              _MetricTile(
                                label: 'Activity Level',
                                value: profile?.activityLevel.displayName ?? '--',
                              ),
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
                            children: [
                              _MetricTile(
                                label: 'BMR',
                                value: profile != null
                                    ? '${profile.bmr.toInt()} kcal'
                                    : '-- kcal',
                              ),
                              const Divider(height: 1),
                              _MetricTile(
                                label: 'TDEE',
                                value: profile != null
                                    ? '${profile.tdee.toInt()} kcal'
                                    : '-- kcal',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Settings section
                        Text(
                          'Settings',
                          style: textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Card(
                          child: Column(
                            children: [
                              ListTile(
                                leading: const Icon(Icons.notifications),
                                title: const Text('Notification Settings'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () => context.push('/notifications/settings'),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Sign out button
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () => _signOut(context, ref),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: colorScheme.error,
                              side: BorderSide(color: colorScheme.error),
                            ),
                            child: const Text('Sign Out'),
                          ),
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
              'Failed to load profile',
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
              onPressed: () => ref.read(profileProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCalorieGoalDialog(
    BuildContext context,
    WidgetRef ref,
    Profile? profile,
  ) async {
    if (profile == null) return;

    final controller = TextEditingController(
      text: profile.calorieGoal.toInt().toString(),
    );

    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Set Calorie Goal'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your TDEE is ${profile.tdee.toInt()} kcal',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Calorie Goal',
                suffixText: 'kcal',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final value = double.tryParse(controller.text);
              if (value != null && value >= 1000 && value <= 10000) {
                Navigator.pop(context, value);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result != null) {
      await ref.read(profileProvider.notifier).updateCalorieGoal(result);
    }
  }

  Future<void> _signOut(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authProvider.notifier).signOut();
    }
  }

  Future<void> _showEditProfileSheet(
    BuildContext context,
    WidgetRef ref,
    Profile? profile,
  ) async {
    if (profile == null) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _EditProfileSheet(profile: profile),
    );
  }
}

class _GoalTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  const _GoalTile({
    required this.icon,
    required this.label,
    required this.value,
    this.onTap,
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
      onTap: onTap,
    );
  }
}

class _MetricTile extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback? onTap;

  const _MetricTile({
    required this.label,
    required this.value,
    this.onTap,
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
      onTap: onTap,
    );
  }
}

class _EditProfileSheet extends ConsumerStatefulWidget {
  final Profile profile;

  const _EditProfileSheet({required this.profile});

  @override
  ConsumerState<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<_EditProfileSheet> {
  late TextEditingController _ageController;
  late TextEditingController _weightController;
  late TextEditingController _heightController;
  late Gender _gender;
  late ActivityLevel _activityLevel;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _ageController = TextEditingController(text: widget.profile.age.toString());
    _weightController = TextEditingController(text: widget.profile.weight.toString());
    _heightController = TextEditingController(text: widget.profile.height.toString());
    _gender = widget.profile.gender;
    _activityLevel = widget.profile.activityLevel;
  }

  @override
  void dispose() {
    _ageController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    super.dispose();
  }

  double _calculateBmr() {
    final age = int.tryParse(_ageController.text) ?? 0;
    final weight = double.tryParse(_weightController.text) ?? 0;
    final height = double.tryParse(_heightController.text) ?? 0;

    if (_gender == Gender.MALE) {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  }

  double _calculateTdee() {
    return _calculateBmr() * _activityLevel.multiplier;
  }

  Future<void> _saveProfile() async {
    final age = int.tryParse(_ageController.text);
    final weight = double.tryParse(_weightController.text);
    final height = double.tryParse(_heightController.text);

    if (age == null || age < 10 || age > 120) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid age (10-120)')),
      );
      return;
    }
    if (weight == null || weight < 20 || weight > 500) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid weight (20-500 kg)')),
      );
      return;
    }
    if (height == null || height < 50 || height > 300) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid height (50-300 cm)')),
      );
      return;
    }

    setState(() => _isSaving = true);

    final input = ProfileInput(
      age: age,
      weight: weight,
      height: height,
      gender: _gender,
      activityLevel: _activityLevel,
      calorieGoal: _calculateTdee(), // Use calculated TDEE as new goal
    );

    final success = await ref.read(profileProvider.notifier).updateProfile(input);

    setState(() => _isSaving = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated!')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final bmr = _calculateBmr();
    final tdee = _calculateTdee();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveProfile,
            child: _isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Gender selection
          Text(
            'Gender',
            style: textTheme.titleSmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          SegmentedButton<Gender>(
            segments: Gender.values.map((g) {
              return ButtonSegment(
                value: g,
                label: Text(g.displayName),
              );
            }).toList(),
            selected: {_gender},
            onSelectionChanged: (selected) {
              setState(() => _gender = selected.first);
            },
          ),
          const SizedBox(height: 24),

          // Age input
          TextFormField(
            controller: _ageController,
            decoration: const InputDecoration(
              labelText: 'Age',
              suffixText: 'years',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),

          // Weight input
          TextFormField(
            controller: _weightController,
            decoration: const InputDecoration(
              labelText: 'Weight',
              suffixText: 'kg',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.]'))],
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),

          // Height input
          TextFormField(
            controller: _heightController,
            decoration: const InputDecoration(
              labelText: 'Height',
              suffixText: 'cm',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.]'))],
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 24),

          // Activity level selection
          Text(
            'Activity Level',
            style: textTheme.titleSmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          ...ActivityLevel.values.map((level) {
            return RadioListTile<ActivityLevel>(
              title: Text(level.displayName),
              subtitle: Text(_getActivityDescription(level)),
              value: level,
              groupValue: _activityLevel,
              onChanged: (value) {
                setState(() => _activityLevel = value!);
              },
            );
          }),
          const SizedBox(height: 24),

          // BMR/TDEE preview
          Card(
            color: colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Calculated Values',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'BMR (Basal Metabolic Rate)',
                        style: TextStyle(color: colorScheme.onPrimaryContainer),
                      ),
                      Text(
                        '${bmr.toInt()} kcal',
                        style: textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'TDEE (Daily Energy)',
                        style: TextStyle(color: colorScheme.onPrimaryContainer),
                      ),
                      Text(
                        '${tdee.toInt()} kcal',
                        style: textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your calorie goal will be updated to ${tdee.toInt()} kcal',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Save button
          ElevatedButton(
            onPressed: _isSaving ? null : _saveProfile,
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save Changes'),
          ),
        ],
      ),
    );
  }

  String _getActivityDescription(ActivityLevel level) {
    switch (level) {
      case ActivityLevel.SEDENTARY:
        return 'Little or no exercise';
      case ActivityLevel.LIGHTLY_ACTIVE:
        return 'Light exercise 1-3 days/week';
      case ActivityLevel.MODERATELY_ACTIVE:
        return 'Moderate exercise 3-5 days/week';
      case ActivityLevel.ACTIVE:
        return 'Hard exercise 6-7 days/week';
      case ActivityLevel.VERY_ACTIVE:
        return 'Very hard exercise or physical job';
    }
  }
}
