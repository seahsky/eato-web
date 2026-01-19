import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/models/models.dart';
import '../providers/food_provider.dart';

class AddFoodScreen extends ConsumerStatefulWidget {
  const AddFoodScreen({super.key});

  @override
  ConsumerState<AddFoodScreen> createState() => _AddFoodScreenState();
}

class _AddFoodScreenState extends ConsumerState<AddFoodScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  final _servingSizeController = TextEditingController(text: '100');

  MealType _selectedMeal = MealType.BREAKFAST;
  String _selectedUnit = 'g';
  bool _isManualEntry = true;
  DateTime _selectedDateTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    // Check if a product was selected from search
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final formState = ref.read(foodEntryFormProvider);
      if (formState.selectedProduct != null) {
        _populateFromProduct(formState.selectedProduct!);
        _isManualEntry = false;
      }
    });
  }

  void _populateFromProduct(FoodProduct product) {
    _nameController.text = product.displayName;
    _servingSizeController.text = product.servingSize.toString();
    _selectedUnit = product.servingUnit;
    _updateCalculatedNutrition();
  }

  void _updateCalculatedNutrition() {
    final formState = ref.read(foodEntryFormProvider);
    final product = formState.selectedProduct;
    if (product == null) return;

    final servingSize = double.tryParse(_servingSizeController.text) ?? 100;
    ref.read(foodEntryFormProvider.notifier).setServingSize(servingSize);

    _caloriesController.text = formState.calculatedCalories.toStringAsFixed(0);
    _proteinController.text = formState.calculatedProtein.toStringAsFixed(1);
    _carbsController.text = formState.calculatedCarbs.toStringAsFixed(1);
    _fatController.text = formState.calculatedFat.toStringAsFixed(1);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    _servingSizeController.dispose();
    // Reset the form when leaving
    ref.read(foodEntryFormProvider.notifier).reset();
    super.dispose();
  }

  Future<void> _saveEntry() async {
    if (!_formKey.currentState!.validate()) return;

    final formNotifier = ref.read(foodEntryFormProvider.notifier);
    formNotifier.setMealType(_selectedMeal);

    bool success;
    if (_isManualEntry) {
      success = await formNotifier.saveManualEntry(
        name: _nameController.text.trim(),
        calories: double.parse(_caloriesController.text),
        protein: double.tryParse(_proteinController.text),
        carbs: double.tryParse(_carbsController.text),
        fat: double.tryParse(_fatController.text),
        servingSize: double.parse(_servingSizeController.text),
        servingUnit: _selectedUnit,
        mealType: _selectedMeal,
        consumedAt: _selectedDateTime,
      );
    } else {
      formNotifier.setConsumedAt(_selectedDateTime);
      success = await formNotifier.saveEntry();
    }

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Food entry saved!')),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final formState = ref.watch(foodEntryFormProvider);
    final selectedProduct = formState.selectedProduct;

    return Scaffold(
      appBar: AppBar(
        title: Text(selectedProduct != null ? 'Log Food' : 'Add Food'),
        actions: [
          TextButton(
            onPressed: formState.isSaving ? null : _saveEntry,
            child: formState.isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Selected product info (if from search)
            if (selectedProduct != null) ...[
              _ProductInfoCard(product: selectedProduct),
              const SizedBox(height: 16),
            ],

            // Food name (only for manual entry)
            if (_isManualEntry) ...[
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Food name',
                  hintText: 'e.g., Chicken breast',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a food name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
            ],

            // Meal selection
            DropdownButtonFormField<MealType>(
              value: _selectedMeal,
              decoration: const InputDecoration(
                labelText: 'Meal',
              ),
              items: MealType.values.map((meal) {
                return DropdownMenuItem(
                  value: meal,
                  child: Text(meal.displayName),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedMeal = value!;
                });
              },
            ),
            const SizedBox(height: 16),

            // Date and time picker
            _DateTimePicker(
              dateTime: _selectedDateTime,
              onDateTimeChanged: (dateTime) {
                setState(() {
                  _selectedDateTime = dateTime;
                });
              },
            ),
            const SizedBox(height: 16),

            // Serving size row
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _servingSizeController,
                    decoration: const InputDecoration(
                      labelText: 'Serving size',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
                    ],
                    onChanged: (_) {
                      if (!_isManualEntry) {
                        _updateCalculatedNutrition();
                      }
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      final num = double.tryParse(value);
                      if (num == null || num <= 0) {
                        return 'Invalid';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedUnit,
                    decoration: const InputDecoration(
                      labelText: 'Unit',
                    ),
                    items: const [
                      DropdownMenuItem(value: 'g', child: Text('g')),
                      DropdownMenuItem(value: 'ml', child: Text('ml')),
                      DropdownMenuItem(value: 'oz', child: Text('oz')),
                      DropdownMenuItem(value: 'serving', child: Text('serving')),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedUnit = value!;
                      });
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Nutrition section
            Text(
              _isManualEntry ? 'Nutrition (per serving)' : 'Nutrition (calculated)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),

            // Calories
            TextFormField(
              controller: _caloriesController,
              decoration: const InputDecoration(
                labelText: 'Calories (kcal)',
                hintText: '0',
              ),
              keyboardType: TextInputType.number,
              readOnly: !_isManualEntry,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
              ],
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter calories';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Macros row
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _proteinController,
                    decoration: const InputDecoration(
                      labelText: 'Protein (g)',
                      hintText: '0',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    readOnly: !_isManualEntry,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _carbsController,
                    decoration: const InputDecoration(
                      labelText: 'Carbs (g)',
                      hintText: '0',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    readOnly: !_isManualEntry,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _fatController,
                    decoration: const InputDecoration(
                      labelText: 'Fat (g)',
                      hintText: '0',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    readOnly: !_isManualEntry,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Error message
            if (formState.error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: Theme.of(context).colorScheme.error,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        formState.error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onErrorContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Save button
            ElevatedButton(
              onPressed: formState.isSaving ? null : _saveEntry,
              child: formState.isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Add Food Entry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateTimePicker extends StatelessWidget {
  final DateTime dateTime;
  final ValueChanged<DateTime> onDateTimeChanged;

  const _DateTimePicker({
    required this.dateTime,
    required this.onDateTimeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return InkWell(
      onTap: () => _selectDateTime(context),
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Date & Time',
          border: OutlineInputBorder(),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(_formatDateTime(dateTime)),
            Icon(Icons.calendar_today, color: colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final selected = DateTime(dt.year, dt.month, dt.day);

    String dateStr;
    if (selected == today) {
      dateStr = 'Today';
    } else if (selected == today.subtract(const Duration(days: 1))) {
      dateStr = 'Yesterday';
    } else {
      dateStr = '${dt.day}/${dt.month}/${dt.year}';
    }

    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$dateStr at $hour:$minute';
  }

  Future<void> _selectDateTime(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: dateTime,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
    );

    if (date == null || !context.mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(dateTime),
    );

    if (time == null) return;

    onDateTimeChanged(DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    ));
  }
}

class _ProductInfoCard extends StatelessWidget {
  final FoodProduct product;

  const _ProductInfoCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            if (product.imageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  product.imageUrl!,
                  width: 64,
                  height: 64,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.fastfood, size: 32),
                  ),
                ),
              )
            else
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.fastfood, size: 32),
              ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (product.brand != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      product.brand!,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    '${product.caloriesPer100g.toInt()} kcal per 100g',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.primary,
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
