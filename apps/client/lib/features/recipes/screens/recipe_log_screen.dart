import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/api/models/models.dart';
import '../providers/recipe_provider.dart';

/// Screen for logging a portion of a recipe as a food entry
class RecipeLogScreen extends ConsumerStatefulWidget {
  final String recipeId;

  const RecipeLogScreen({
    super.key,
    required this.recipeId,
  });

  @override
  ConsumerState<RecipeLogScreen> createState() => _RecipeLogScreenState();
}

class _RecipeLogScreenState extends ConsumerState<RecipeLogScreen> {
  final _weightController = TextEditingController();
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    // Fetch recipe details and initialize the log provider
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(recipeDetailProvider.notifier).fetchRecipe(widget.recipeId);
      final recipe = ref.read(recipeDetailProvider).recipe;
      if (recipe != null) {
        ref.read(recipeLogProvider.notifier).setRecipe(recipe);
        _weightController.text =
            ref.read(recipeLogProvider).consumedWeight.toStringAsFixed(0);
        setState(() => _isInitialized = true);
      }
    });
  }

  @override
  void dispose() {
    _weightController.dispose();
    super.dispose();
  }

  void _onWeightChanged(String value) {
    final weight = double.tryParse(value);
    if (weight != null && weight > 0) {
      ref.read(recipeLogProvider.notifier).setConsumedWeight(weight);
    }
  }

  Future<void> _onLog() async {
    final success = await ref.read(recipeLogProvider.notifier).log();
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Recipe logged successfully!'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      // Navigate back to dashboard
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final detailState = ref.watch(recipeDetailProvider);
    final logState = ref.watch(recipeLogProvider);
    final theme = Theme.of(context);

    if (detailState.isLoading || !_isInitialized) {
      return Scaffold(
        appBar: AppBar(title: const Text('Log Recipe')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (detailState.error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Log Recipe')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(detailState.error!),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref
                    .read(recipeDetailProvider.notifier)
                    .fetchRecipe(widget.recipeId),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final recipe = logState.recipe;
    if (recipe == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Log Recipe')),
        body: const Center(child: Text('Recipe not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Log Recipe'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Recipe info card
            _buildRecipeCard(recipe, theme),
            const SizedBox(height: 24),

            // Portion size section
            Text(
              'Portion Size',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildPortionInput(recipe, logState, theme),
            const SizedBox(height: 24),

            // Meal type section
            Text(
              'Meal Type',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildMealTypeSelector(logState.mealType, theme),
            const SizedBox(height: 24),

            // Date section
            Text(
              'Date',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildDateSelector(logState.consumedAt, theme),
            const SizedBox(height: 24),

            // Nutrition preview
            Text(
              'Nutrition',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildNutritionPreview(logState, theme),
            const SizedBox(height: 32),

            // Log button
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: logState.isLogging ? null : _onLog,
                icon: logState.isLogging
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.check),
                label: Text(logState.isLogging ? 'Logging...' : 'Log Recipe'),
              ),
            ),

            if (logState.error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: theme.colorScheme.onErrorContainer,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        logState.error!,
                        style: TextStyle(
                          color: theme.colorScheme.onErrorContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRecipeCard(Recipe recipe, ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: recipe.imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: recipe.imageUrl!,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Container(
                        width: 80,
                        height: 80,
                        color: theme.colorScheme.surfaceContainerHighest,
                        child: Icon(
                          Icons.restaurant,
                          size: 32,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    )
                  : Container(
                      width: 80,
                      height: 80,
                      color: theme.colorScheme.surfaceContainerHighest,
                      child: Icon(
                        Icons.restaurant,
                        size: 32,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
            ),
            const SizedBox(width: 16),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.name,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${recipe.caloriesPer100g.round()} kcal/100g',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  Text(
                    'Total yield: ${recipe.yieldWeight.round()}${recipe.yieldUnit}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPortionInput(
      Recipe recipe, RecipeLogState logState, ThemeData theme) {
    // Quick portion buttons
    final portions = [
      ('Quarter', recipe.yieldWeight / 4),
      ('Half', recipe.yieldWeight / 2),
      ('Full', recipe.yieldWeight),
    ];

    return Column(
      children: [
        // Quick buttons
        Row(
          children: portions.map((portion) {
            final isSelected =
                (logState.consumedWeight - portion.$2).abs() < 0.1;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: portion != portions.last ? 8 : 0,
                ),
                child: OutlinedButton(
                  onPressed: () {
                    ref
                        .read(recipeLogProvider.notifier)
                        .setConsumedWeight(portion.$2);
                    _weightController.text = portion.$2.toStringAsFixed(0);
                  },
                  style: OutlinedButton.styleFrom(
                    backgroundColor: isSelected
                        ? theme.colorScheme.primaryContainer
                        : null,
                    side: isSelected
                        ? BorderSide(color: theme.colorScheme.primary)
                        : null,
                  ),
                  child: Text(portion.$1),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        // Custom weight input
        TextField(
          controller: _weightController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Custom amount',
            suffixText: recipe.yieldUnit,
            helperText:
                'Recipe total: ${recipe.yieldWeight.round()}${recipe.yieldUnit}',
          ),
          onChanged: _onWeightChanged,
        ),
      ],
    );
  }

  Widget _buildMealTypeSelector(MealType selected, ThemeData theme) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: MealType.values.map((mealType) {
        final isSelected = selected == mealType;
        return ChoiceChip(
          label: Text(mealType.displayName),
          selected: isSelected,
          onSelected: (_) {
            ref.read(recipeLogProvider.notifier).setMealType(mealType);
          },
          avatar: isSelected ? const Icon(Icons.check, size: 18) : null,
        );
      }).toList(),
    );
  }

  Widget _buildDateSelector(DateTime date, ThemeData theme) {
    final now = DateTime.now();
    final isToday =
        date.year == now.year && date.month == now.month && date.day == now.day;
    final yesterday = now.subtract(const Duration(days: 1));
    final isYesterday = date.year == yesterday.year &&
        date.month == yesterday.month &&
        date.day == yesterday.day;

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () {
              ref
                  .read(recipeLogProvider.notifier)
                  .setConsumedAt(yesterday);
            },
            style: OutlinedButton.styleFrom(
              backgroundColor:
                  isYesterday ? theme.colorScheme.primaryContainer : null,
              side: isYesterday
                  ? BorderSide(color: theme.colorScheme.primary)
                  : null,
            ),
            child: const Text('Yesterday'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton(
            onPressed: () {
              ref.read(recipeLogProvider.notifier).setConsumedAt(now);
            },
            style: OutlinedButton.styleFrom(
              backgroundColor:
                  isToday ? theme.colorScheme.primaryContainer : null,
              side: isToday
                  ? BorderSide(color: theme.colorScheme.primary)
                  : null,
            ),
            child: const Text('Today'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: date,
                firstDate: now.subtract(const Duration(days: 30)),
                lastDate: now,
              );
              if (picked != null) {
                ref.read(recipeLogProvider.notifier).setConsumedAt(picked);
              }
            },
            icon: const Icon(Icons.calendar_today, size: 16),
            label: Text(
              !isToday && !isYesterday
                  ? '${date.month}/${date.day}'
                  : 'Pick',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNutritionPreview(RecipeLogState state, ThemeData theme) {
    return Card(
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Calories highlight
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.local_fire_department,
                  color: Colors.orange,
                  size: 32,
                ),
                const SizedBox(width: 8),
                Text(
                  '${state.calories.round()}',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'kcal',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Macros row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _MacroItem(
                  label: 'Protein',
                  value: '${state.protein.round()}g',
                  color: Colors.blue,
                ),
                _MacroItem(
                  label: 'Carbs',
                  value: '${state.carbs.round()}g',
                  color: Colors.green,
                ),
                _MacroItem(
                  label: 'Fat',
                  value: '${state.fat.round()}g',
                  color: Colors.purple,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MacroItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MacroItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Text(
          value,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
