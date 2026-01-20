import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/recipe_provider.dart';

class RecipeFormScreen extends ConsumerStatefulWidget {
  final String? recipeId;

  const RecipeFormScreen({super.key, this.recipeId});

  @override
  ConsumerState<RecipeFormScreen> createState() => _RecipeFormScreenState();
}

class _RecipeFormScreenState extends ConsumerState<RecipeFormScreen> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _yieldController = TextEditingController(text: '100');

  bool get isEditing => widget.recipeId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (isEditing) {
        _loadRecipeForEdit();
      } else {
        ref.read(recipeFormProvider.notifier).reset();
      }
    });
  }

  Future<void> _loadRecipeForEdit() async {
    final apiClient = ref.read(apiClientProvider);
    try {
      final data = await apiClient.getRecipe(widget.recipeId!);
      final recipe = Recipe.fromJson(data);
      ref.read(recipeFormProvider.notifier).initForEdit(recipe);

      _nameController.text = recipe.name;
      _descriptionController.text = recipe.description ?? '';
      _yieldController.text = recipe.yieldWeight.toString();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load recipe: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _yieldController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recipeFormProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Recipe' : 'New Recipe'),
        actions: [
          TextButton(
            onPressed: state.isSaving || !state.isValid ? null : _save,
            child: state.isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Recipe name
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Recipe Name *',
              hintText: 'e.g., Sourdough Bread',
              border: OutlineInputBorder(),
            ),
            onChanged: (value) =>
                ref.read(recipeFormProvider.notifier).setName(value),
          ),

          const SizedBox(height: 16),

          // Description
          TextField(
            controller: _descriptionController,
            decoration: const InputDecoration(
              labelText: 'Description',
              hintText: 'Optional description...',
              border: OutlineInputBorder(),
            ),
            maxLines: 2,
            onChanged: (value) =>
                ref.read(recipeFormProvider.notifier).setDescription(value),
          ),

          const SizedBox(height: 16),

          // Yield weight
          TextField(
            controller: _yieldController,
            decoration: const InputDecoration(
              labelText: 'Total Yield Weight (g) *',
              hintText: 'Final weight in grams',
              border: OutlineInputBorder(),
              suffixText: 'g',
            ),
            keyboardType: TextInputType.number,
            onChanged: (value) {
              final weight = double.tryParse(value);
              if (weight != null && weight > 0) {
                ref.read(recipeFormProvider.notifier).setYieldWeight(weight);
              }
            },
          ),

          const SizedBox(height: 24),

          // Nutrition preview
          if (state.nutritionPreview != null) _buildNutritionPreview(state),

          const SizedBox(height: 24),

          // Ingredients section
          Row(
            children: [
              Text(
                'Ingredients',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _showAddIngredientDialog(),
                icon: const Icon(Icons.add),
                label: const Text('Add'),
              ),
            ],
          ),

          const SizedBox(height: 12),

          if (state.ingredients.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.restaurant_menu,
                    size: 48,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'No ingredients yet',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Add ingredients to calculate nutrition',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            )
          else
            ReorderableListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: state.ingredients.length,
              onReorder: (oldIndex, newIndex) {
                ref
                    .read(recipeFormProvider.notifier)
                    .reorderIngredients(oldIndex, newIndex);
              },
              itemBuilder: (context, index) {
                final ingredient = state.ingredients[index];
                return _IngredientListTile(
                  key: ValueKey(ingredient.id ?? index),
                  ingredient: ingredient,
                  onEdit: () => _showEditIngredientDialog(index, ingredient),
                  onDelete: () =>
                      ref.read(recipeFormProvider.notifier).removeIngredient(index),
                );
              },
            ),

          if (state.error != null) ...[
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
                      state.error!,
                      style: TextStyle(
                        color: theme.colorScheme.onErrorContainer,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 100), // Space for content
        ],
      ),
    );
  }

  Widget _buildNutritionPreview(RecipeFormState state) {
    final preview = state.nutritionPreview!;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.analytics,
                color: theme.colorScheme.primary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Nutrition per 100g',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
              if (state.isPreviewLoading) ...[
                const Spacer(),
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _PreviewStat(
                label: 'Calories',
                value: '${preview.caloriesPer100g.round()}',
                unit: 'kcal',
                color: Colors.orange,
              ),
              _PreviewStat(
                label: 'Protein',
                value: '${preview.proteinPer100g.round()}',
                unit: 'g',
                color: Colors.blue,
              ),
              _PreviewStat(
                label: 'Carbs',
                value: '${preview.carbsPer100g.round()}',
                unit: 'g',
                color: Colors.green,
              ),
              _PreviewStat(
                label: 'Fat',
                value: '${preview.fatPer100g.round()}',
                unit: 'g',
                color: Colors.purple,
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddIngredientDialog() {
    _showIngredientDialog(
      title: 'Add Ingredient',
      onSave: (ingredient) {
        ref.read(recipeFormProvider.notifier).addIngredient(ingredient);
      },
    );
  }

  void _showEditIngredientDialog(int index, RecipeIngredientInput ingredient) {
    _showIngredientDialog(
      title: 'Edit Ingredient',
      initial: ingredient,
      onSave: (updated) {
        ref.read(recipeFormProvider.notifier).updateIngredient(index, updated);
      },
    );
  }

  void _showIngredientDialog({
    required String title,
    RecipeIngredientInput? initial,
    required void Function(RecipeIngredientInput) onSave,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _IngredientFormSheet(
        title: title,
        initial: initial,
        onSave: onSave,
      ),
    );
  }

  Future<void> _save() async {
    final recipe = await ref.read(recipeFormProvider.notifier).save();
    if (recipe != null && mounted) {
      context.pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isEditing ? 'Recipe updated' : 'Recipe created'),
        ),
      );
    }
  }
}

class _PreviewStat extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color color;

  const _PreviewStat({
    required this.label,
    required this.value,
    required this.unit,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          unit,
          style: TextStyle(
            fontSize: 11,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall,
        ),
      ],
    );
  }
}

class _IngredientListTile extends StatelessWidget {
  final RecipeIngredientInput ingredient;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _IngredientListTile({
    super.key,
    required this.ingredient,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final unitDisplay = ingredient.unit == IngredientUnit.percent
        ? '%'
        : ingredient.unit.displayName;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.drag_handle),
        title: Text(ingredient.name),
        subtitle: Text(
          '${ingredient.quantity}$unitDisplay • ${ingredient.caloriesPer100g.round()} kcal/100g',
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: onEdit,
            ),
            IconButton(
              icon: Icon(Icons.delete, color: theme.colorScheme.error),
              onPressed: onDelete,
            ),
          ],
        ),
      ),
    );
  }
}

class _IngredientFormSheet extends StatefulWidget {
  final String title;
  final RecipeIngredientInput? initial;
  final void Function(RecipeIngredientInput) onSave;

  const _IngredientFormSheet({
    required this.title,
    this.initial,
    required this.onSave,
  });

  @override
  State<_IngredientFormSheet> createState() => _IngredientFormSheetState();
}

class _IngredientFormSheetState extends State<_IngredientFormSheet> {
  final _nameController = TextEditingController();
  final _quantityController = TextEditingController();
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();

  IngredientUnit _unit = IngredientUnit.g;

  @override
  void initState() {
    super.initState();
    if (widget.initial != null) {
      _nameController.text = widget.initial!.name;
      _quantityController.text = widget.initial!.quantity.toString();
      _caloriesController.text = widget.initial!.caloriesPer100g.toString();
      _proteinController.text = widget.initial!.proteinPer100g.toString();
      _carbsController.text = widget.initial!.carbsPer100g.toString();
      _fatController.text = widget.initial!.fatPer100g.toString();
      _unit = widget.initial!.unit;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    super.dispose();
  }

  bool get isValid {
    return _nameController.text.isNotEmpty &&
        (double.tryParse(_quantityController.text) ?? 0) > 0 &&
        (double.tryParse(_caloriesController.text) ?? 0) >= 0;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                widget.title,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Name
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Ingredient Name *',
              border: OutlineInputBorder(),
            ),
            onChanged: (_) => setState(() {}),
          ),

          const SizedBox(height: 12),

          // Quantity and unit
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _quantityController,
                  decoration: const InputDecoration(
                    labelText: 'Quantity *',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<IngredientUnit>(
                  value: _unit,
                  decoration: const InputDecoration(
                    labelText: 'Unit',
                    border: OutlineInputBorder(),
                  ),
                  items: IngredientUnit.values.map((u) {
                    return DropdownMenuItem(
                      value: u,
                      child: Text(u.displayName),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) setState(() => _unit = value);
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          Text(
            'Nutrition per 100g',
            style: Theme.of(context).textTheme.titleSmall,
          ),

          const SizedBox(height: 12),

          // Nutrition fields
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _caloriesController,
                  decoration: const InputDecoration(
                    labelText: 'Calories *',
                    border: OutlineInputBorder(),
                    suffixText: 'kcal',
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _proteinController,
                  decoration: const InputDecoration(
                    labelText: 'Protein',
                    border: OutlineInputBorder(),
                    suffixText: 'g',
                  ),
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _carbsController,
                  decoration: const InputDecoration(
                    labelText: 'Carbs',
                    border: OutlineInputBorder(),
                    suffixText: 'g',
                  ),
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _fatController,
                  decoration: const InputDecoration(
                    labelText: 'Fat',
                    border: OutlineInputBorder(),
                    suffixText: 'g',
                  ),
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: isValid ? _save : null,
              child: Text(widget.initial != null ? 'Update' : 'Add'),
            ),
          ),
        ],
      ),
    );
  }

  void _save() {
    final ingredient = RecipeIngredientInput(
      id: widget.initial?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      name: _nameController.text,
      quantity: double.parse(_quantityController.text),
      unit: _unit,
      caloriesPer100g: double.tryParse(_caloriesController.text) ?? 0,
      proteinPer100g: double.tryParse(_proteinController.text) ?? 0,
      carbsPer100g: double.tryParse(_carbsController.text) ?? 0,
      fatPer100g: double.tryParse(_fatController.text) ?? 0,
      isManualEntry: true,
      sortOrder: widget.initial?.sortOrder ?? 0,
    );

    widget.onSave(ingredient);
    Navigator.pop(context);
  }
}
