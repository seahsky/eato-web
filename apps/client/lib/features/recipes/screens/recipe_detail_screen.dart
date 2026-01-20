import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/recipe_provider.dart';

class RecipeDetailScreen extends ConsumerStatefulWidget {
  final String recipeId;

  const RecipeDetailScreen({super.key, required this.recipeId});

  @override
  ConsumerState<RecipeDetailScreen> createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends ConsumerState<RecipeDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(recipeDetailProvider.notifier).fetchRecipe(widget.recipeId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recipeDetailProvider);

    return Scaffold(
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? _buildError(state.error!)
              : state.recipe != null
                  ? _buildContent(state.recipe!)
                  : const Center(child: Text('Recipe not found')),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
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

  Widget _buildContent(Recipe recipe) {
    final theme = Theme.of(context);
    final isOwner = recipe.isOwner ?? true;

    return CustomScrollView(
      slivers: [
        // App bar with image
        SliverAppBar(
          expandedHeight: recipe.imageUrl != null ? 250 : 0,
          pinned: true,
          flexibleSpace: recipe.imageUrl != null
              ? FlexibleSpaceBar(
                  background: CachedNetworkImage(
                    imageUrl: recipe.imageUrl!,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      color: Colors.grey[200],
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      color: Colors.grey[200],
                      child: Icon(Icons.restaurant,
                          size: 64, color: Colors.grey[400]),
                    ),
                  ),
                )
              : null,
          actions: [
            if (isOwner) ...[
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => context.push('/recipes/${recipe.id}/edit'),
              ),
              PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'delete') {
                    _showDeleteDialog(recipe);
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Delete', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),

        // Content
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and owner
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        recipe.name,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (!isOwner && recipe.user?.name != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.secondaryContainer,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.person,
                              size: 16,
                              color: theme.colorScheme.onSecondaryContainer,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              recipe.user!.name!,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: theme.colorScheme.onSecondaryContainer,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),

                if (recipe.description != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    recipe.description!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Nutrition per 100g
                _SectionHeader(title: 'Nutrition per 100g'),
                const SizedBox(height: 12),
                _NutritionGrid(
                  calories: recipe.caloriesPer100g,
                  protein: recipe.proteinPer100g,
                  carbs: recipe.carbsPer100g,
                  fat: recipe.fatPer100g,
                  fiber: recipe.fiberPer100g,
                ),

                const SizedBox(height: 24),

                // Yield info
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.scale,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Yield',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          Text(
                            '${recipe.yieldWeight.round()}${recipe.yieldUnit}',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Total Calories',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          Text(
                            '${recipe.totalCalories.round()} kcal',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.orange,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Ingredients
                _SectionHeader(
                  title: 'Ingredients',
                  trailing: Text(
                    '${recipe.ingredients.length} items',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ...recipe.ingredients.map((ing) => _IngredientTile(
                      ingredient: ing,
                    )),

                const SizedBox(height: 100), // Space for FAB
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showDeleteDialog(Recipe recipe) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Recipe'),
        content: Text('Are you sure you want to delete "${recipe.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await _deleteRecipe(recipe);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteRecipe(Recipe recipe) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.deleteRecipe(recipe.id);
      ref.read(recipeListProvider.notifier).refresh();
      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Recipe deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete recipe: $e')),
        );
      }
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const _SectionHeader({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        if (trailing != null) ...[
          const Spacer(),
          trailing!,
        ],
      ],
    );
  }
}

class _NutritionGrid extends StatelessWidget {
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double fiber;

  const _NutritionGrid({
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.fiber,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _NutritionCard(
            label: 'Calories',
            value: '${calories.round()}',
            unit: 'kcal',
            color: Colors.orange,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _NutritionCard(
            label: 'Protein',
            value: '${protein.round()}',
            unit: 'g',
            color: Colors.blue,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _NutritionCard(
            label: 'Carbs',
            value: '${carbs.round()}',
            unit: 'g',
            color: Colors.green,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _NutritionCard(
            label: 'Fat',
            value: '${fat.round()}',
            unit: 'g',
            color: Colors.purple,
          ),
        ),
      ],
    );
  }
}

class _NutritionCard extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color color;

  const _NutritionCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            unit,
            style: theme.textTheme.labelSmall?.copyWith(
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _IngredientTile extends StatelessWidget {
  final RecipeIngredient ingredient;

  const _IngredientTile({required this.ingredient});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final unitDisplay = ingredient.unit == IngredientUnit.percent
        ? '%'
        : ingredient.unit.displayName;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: theme.dividerColor),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ingredient.name,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${ingredient.quantity}$unitDisplay${ingredient.isPercentage ? ' (baker\'s %)' : ''}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${ingredient.caloriesPer100g.round()} kcal',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: Colors.orange,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                'per 100g',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
