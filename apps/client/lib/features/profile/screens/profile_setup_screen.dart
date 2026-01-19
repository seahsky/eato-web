import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _pageController = PageController();

  // Form values
  int _currentStep = 0;
  int? _age;
  double? _weight;
  double? _height;
  Gender _gender = Gender.MALE;
  ActivityLevel _activityLevel = ActivityLevel.MODERATELY_ACTIVE;
  double? _calorieGoal;

  // Calculated values
  double? _bmr;
  double? _tdee;

  void _nextStep() {
    if (_currentStep < 3) {
      setState(() {
        _currentStep++;
      });
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _calculateBmrTdee() {
    if (_age == null || _weight == null || _height == null) return;

    // Mifflin-St Jeor equation
    double bmr;
    if (_gender == Gender.MALE) {
      bmr = (10 * _weight!) + (6.25 * _height!) - (5 * _age!) + 5;
    } else {
      bmr = (10 * _weight!) + (6.25 * _height!) - (5 * _age!) - 161;
    }

    final tdee = bmr * _activityLevel.multiplier;

    setState(() {
      _bmr = bmr;
      _tdee = tdee;
      _calorieGoal = tdee;
    });
  }

  Future<void> _saveProfile() async {
    if (_age == null || _weight == null || _height == null || _calorieGoal == null) {
      return;
    }

    final input = ProfileInput(
      age: _age!,
      weight: _weight!,
      height: _height!,
      gender: _gender,
      activityLevel: _activityLevel,
      calorieGoal: _calorieGoal,
    );

    final success = await ref.read(profileProvider.notifier).updateProfile(input);

    if (success && mounted) {
      // Refresh auth state to update needsOnboarding
      await ref.read(authProvider.notifier).refreshUser();
      // Navigate to dashboard
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final profileState = ref.watch(profileProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: [
                      if (_currentStep > 0)
                        IconButton(
                          icon: const Icon(Icons.arrow_back),
                          onPressed: _previousStep,
                        )
                      else
                        const SizedBox(width: 48),
                      Expanded(
                        child: Text(
                          'Set Up Your Profile',
                          style: textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: (_currentStep + 1) / 4,
                    backgroundColor: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Step ${_currentStep + 1} of 4',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),

            // Form pages
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildBasicInfoStep(context),
                  _buildBodyMetricsStep(context),
                  _buildActivityStep(context),
                  _buildGoalStep(context),
                ],
              ),
            ),

            // Error message
            if (profileState.error != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: colorScheme.error),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        profileState.error!,
                        style: TextStyle(color: colorScheme.onErrorContainer),
                      ),
                    ),
                  ],
                ),
              ),

            // Navigation buttons
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_currentStep < 3) ...[
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _canProceed() ? _nextStep : null,
                        child: const Text('Continue'),
                      ),
                    ),
                  ] else ...[
                    Expanded(
                      child: ElevatedButton(
                        onPressed: profileState.isSaving ? null : _saveProfile,
                        child: profileState.isSaving
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Complete Setup'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _canProceed() {
    switch (_currentStep) {
      case 0:
        return true; // Gender always has a default value
      case 1:
        return _age != null && _weight != null && _height != null;
      case 2:
        return true; // Activity level always has a default value
      case 3:
        return _calorieGoal != null;
      default:
        return false;
    }
  }

  Widget _buildBasicInfoStep(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What is your gender?',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This helps us calculate your daily calorie needs more accurately.',
            style: textTheme.bodyLarge?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 32),
          ...Gender.values.map((gender) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _SelectionTile(
                  title: gender.displayName,
                  icon: gender == Gender.MALE ? Icons.male : Icons.female,
                  isSelected: _gender == gender,
                  onTap: () => setState(() => _gender = gender),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildBodyMetricsStep(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your body metrics',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Enter your current measurements for accurate calculations.',
            style: textTheme.bodyLarge?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 32),

          // Age
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Age',
              suffixText: 'years',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            initialValue: _age?.toString(),
            onChanged: (value) {
              setState(() {
                _age = int.tryParse(value);
              });
            },
          ),
          const SizedBox(height: 16),

          // Weight
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Weight',
              suffixText: 'kg',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
            ],
            initialValue: _weight?.toString(),
            onChanged: (value) {
              setState(() {
                _weight = double.tryParse(value);
              });
            },
          ),
          const SizedBox(height: 16),

          // Height
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Height',
              suffixText: 'cm',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
            ],
            initialValue: _height?.toString(),
            onChanged: (value) {
              setState(() {
                _height = double.tryParse(value);
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActivityStep(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'How active are you?',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Select the option that best describes your typical week.',
            style: textTheme.bodyLarge?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),
          ...ActivityLevel.values.map((level) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _SelectionTile(
                  title: level.displayName,
                  subtitle: _getActivityDescription(level),
                  isSelected: _activityLevel == level,
                  onTap: () {
                    setState(() {
                      _activityLevel = level;
                    });
                    _calculateBmrTdee();
                  },
                ),
              )),
        ],
      ),
    );
  }

  String _getActivityDescription(ActivityLevel level) {
    switch (level) {
      case ActivityLevel.SEDENTARY:
        return 'Little or no exercise, desk job';
      case ActivityLevel.LIGHTLY_ACTIVE:
        return 'Light exercise 1-3 days/week';
      case ActivityLevel.MODERATELY_ACTIVE:
        return 'Moderate exercise 3-5 days/week';
      case ActivityLevel.ACTIVE:
        return 'Hard exercise 6-7 days/week';
      case ActivityLevel.VERY_ACTIVE:
        return 'Very hard exercise, physical job';
    }
  }

  Widget _buildGoalStep(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    // Ensure we have calculated values
    if (_bmr == null || _tdee == null) {
      _calculateBmrTdee();
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your daily calorie goal',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Based on your information, we recommend:',
            style: textTheme.bodyLarge?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // Calculated values card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'BMR (Base Metabolic Rate)',
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        '${_bmr?.toInt() ?? '--'} kcal',
                        style: textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'TDEE (Total Daily Energy)',
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        '${_tdee?.toInt() ?? '--'} kcal',
                        style: textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Goal selection
          Text(
            'Daily Calorie Goal',
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),

          // Quick goal options
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _GoalChip(
                label: 'Lose weight',
                value: (_tdee ?? 2000) - 500,
                isSelected: _calorieGoal == (_tdee ?? 2000) - 500,
                onTap: () => setState(() => _calorieGoal = (_tdee ?? 2000) - 500),
              ),
              _GoalChip(
                label: 'Maintain',
                value: _tdee ?? 2000,
                isSelected: _calorieGoal == _tdee,
                onTap: () => setState(() => _calorieGoal = _tdee),
              ),
              _GoalChip(
                label: 'Gain weight',
                value: (_tdee ?? 2000) + 500,
                isSelected: _calorieGoal == (_tdee ?? 2000) + 500,
                onTap: () => setState(() => _calorieGoal = (_tdee ?? 2000) + 500),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Custom goal input
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Custom goal',
              suffixText: 'kcal',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            initialValue: _calorieGoal?.toInt().toString(),
            onChanged: (value) {
              setState(() {
                _calorieGoal = double.tryParse(value);
              });
            },
          ),
        ],
      ),
    );
  }
}

class _SelectionTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _SelectionTile({
    required this.title,
    this.subtitle,
    this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      color: isSelected ? colorScheme.primaryContainer : null,
      child: ListTile(
        leading: icon != null
            ? Icon(
                icon,
                color: isSelected ? colorScheme.onPrimaryContainer : null,
              )
            : null,
        title: Text(
          title,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.w600 : null,
            color: isSelected ? colorScheme.onPrimaryContainer : null,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle!,
                style: TextStyle(
                  color: isSelected
                      ? colorScheme.onPrimaryContainer.withAlpha(179)
                      : colorScheme.onSurfaceVariant,
                ),
              )
            : null,
        trailing: isSelected
            ? Icon(Icons.check_circle, color: colorScheme.primary)
            : null,
        onTap: onTap,
      ),
    );
  }
}

class _GoalChip extends StatelessWidget {
  final String label;
  final double value;
  final bool isSelected;
  final VoidCallback onTap;

  const _GoalChip({
    required this.label,
    required this.value,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return FilterChip(
      label: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          Text(
            '${value.toInt()} kcal',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isSelected
                      ? colorScheme.onPrimaryContainer
                      : colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
      selected: isSelected,
      onSelected: (_) => onTap(),
      showCheckmark: false,
    );
  }
}
