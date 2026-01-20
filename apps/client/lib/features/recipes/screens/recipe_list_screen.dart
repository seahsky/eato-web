import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/api/models/models.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../providers/recipe_provider.dart';

class RecipeListScreen extends ConsumerStatefulWidget {
  const RecipeListScreen({super.key});

  @override
  ConsumerState<RecipeListScreen> createState() => _RecipeListScreenState();
}

class _RecipeListScreenState extends ConsumerState<RecipeListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    // Fetch recipes on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(recipeListProvider.notifier).fetchRecipes();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recipeListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recipes'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'My Recipes (${state.userRecipes.length})'),
            Tab(text: 'Partner (${state.partnerRecipes.length})'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/recipes/search'),
          ),
        ],
      ),
      body: state.isLoading && state.userRecipes.isEmpty
          ? const RecipeListSkeleton()
          : state.error != null
              ? _buildError(state.error!)
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildRecipeList(state.userRecipes, isOwner: true),
                    _buildRecipeList(state.partnerRecipes, isOwner: false),
                  ],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/recipes/new'),
        icon: const Icon(Icons.add),
        label: const Text('New Recipe'),
      ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => ref.read(recipeListProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecipeList(List<Recipe> recipes, {required bool isOwner}) {
    if (recipes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isOwner ? Icons.restaurant_menu : Icons.people_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              isOwner
                  ? 'No recipes yet'
                  : 'Your partner hasn\'t created any recipes',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            if (isOwner) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => context.push('/recipes/new'),
                icon: const Icon(Icons.add),
                label: const Text('Create Recipe'),
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(recipeListProvider.notifier).refresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: recipes.length,
        itemBuilder: (context, index) {
          final recipe = recipes[index];
          return RecipeCard(
            recipe: recipe,
            isOwner: isOwner,
            onTap: () => context.push('/recipes/${recipe.id}'),
          );
        },
      ),
    );
  }
}

class RecipeCard extends StatelessWidget {
  final Recipe recipe;
  final bool isOwner;
  final VoidCallback onTap;

  const RecipeCard({
    super.key,
    required this.recipe,
    required this.isOwner,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image or placeholder
            if (recipe.imageUrl != null)
              CachedNetworkImage(
                imageUrl: recipe.imageUrl!,
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  height: 160,
                  color: Colors.grey[200],
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (_, __, ___) => Container(
                  height: 160,
                  color: Colors.grey[200],
                  child: Icon(Icons.restaurant, size: 48, color: Colors.grey[400]),
                ),
              )
            else
              Container(
                height: 100,
                width: double.infinity,
                color: theme.colorScheme.surfaceContainerHighest,
                child: Icon(
                  Icons.restaurant,
                  size: 48,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and owner indicator
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          recipe.name,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (!isOwner && recipe.user?.name != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.secondaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            recipe.user!.name!,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSecondaryContainer,
                            ),
                          ),
                        ),
                    ],
                  ),

                  if (recipe.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      recipe.description!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  const SizedBox(height: 12),

                  // Nutrition info
                  Row(
                    children: [
                      _NutritionChip(
                        label: '${recipe.caloriesPer100g.round()} kcal',
                        icon: Icons.local_fire_department,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      _NutritionChip(
                        label: '${recipe.proteinPer100g.round()}g P',
                        color: Colors.blue,
                      ),
                      const SizedBox(width: 8),
                      _NutritionChip(
                        label: '${recipe.carbsPer100g.round()}g C',
                        color: Colors.green,
                      ),
                      const SizedBox(width: 8),
                      _NutritionChip(
                        label: '${recipe.fatPer100g.round()}g F',
                        color: Colors.purple,
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Yield info
                  Text(
                    'Yields ${recipe.yieldWeight.round()}${recipe.yieldUnit}',
                    style: theme.textTheme.labelMedium?.copyWith(
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
}

class _NutritionChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color color;

  const _NutritionChip({
    required this.label,
    this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
