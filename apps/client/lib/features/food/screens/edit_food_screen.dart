import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../../dashboard/providers/dashboard_provider.dart';

/// Provider for loading a specific food entry
final foodEntryProvider = FutureProvider.family<FoodEntry?, String>((ref, id) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final data = await apiClient.getFoodEntry(id);
    return FoodEntry.fromJson(data);
  } catch (e) {
    return null;
  }
});

/// State for editing a food entry
class EditFoodState {
  final bool isSaving;
  final bool isDeleting;
  final String? error;

  const EditFoodState({
    this.isSaving = false,
    this.isDeleting = false,
    this.error,
  });

  EditFoodState copyWith({
    bool? isSaving,
    bool? isDeleting,
    String? error,
  }) {
    return EditFoodState(
      isSaving: isSaving ?? this.isSaving,
      isDeleting: isDeleting ?? this.isDeleting,
      error: error,
    );
  }
}

/// Notifier for edit food operations
class EditFoodNotifier extends StateNotifier<EditFoodState> {
  final ApiClient _apiClient;
  final Ref _ref;

  EditFoodNotifier(this._apiClient, this._ref) : super(const EditFoodState());

  Future<bool> updateEntry(String id, {
    required String name,
    required double calories,
    double? protein,
    double? carbs,
    double? fat,
    required double servingSize,
    required String servingUnit,
    required MealType mealType,
    required DateTime consumedAt,
  }) async {
    state = state.copyWith(isSaving: true, error: null);

    try {
      await _apiClient.updateFoodEntry(id, {
        'name': name,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'servingSize': servingSize,
        'servingUnit': servingUnit,
        'mealType': mealType.name,
        'consumedAt': consumedAt.toIso8601String(),
      });

      // Refresh the dashboard
      _ref.read(dashboardProvider.notifier).refresh();

      state = state.copyWith(isSaving: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Failed to update entry: ${e.toString()}',
      );
      return false;
    }
  }

  Future<bool> deleteEntry(String id) async {
    state = state.copyWith(isDeleting: true, error: null);

    try {
      await _apiClient.deleteFoodEntry(id);

      // Refresh the dashboard
      _ref.read(dashboardProvider.notifier).refresh();

      state = state.copyWith(isDeleting: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isDeleting: false,
        error: 'Failed to delete entry: ${e.toString()}',
      );
      return false;
    }
  }
}

/// Provider for edit food operations
final editFoodProvider = StateNotifierProvider.autoDispose<EditFoodNotifier, EditFoodState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return EditFoodNotifier(apiClient, ref);
});

class EditFoodScreen extends ConsumerStatefulWidget {
  final String entryId;

  const EditFoodScreen({super.key, required this.entryId});

  @override
  ConsumerState<EditFoodScreen> createState() => _EditFoodScreenState();
}

class _EditFoodScreenState extends ConsumerState<EditFoodScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  final _servingSizeController = TextEditingController();

  MealType _selectedMeal = MealType.BREAKFAST;
  String _selectedUnit = 'g';
  DateTime _selectedDateTime = DateTime.now();
  bool _isInitialized = false;

  @override
  void dispose() {
    _nameController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    _servingSizeController.dispose();
    super.dispose();
  }

  void _initializeForm(FoodEntry entry) {
    if (_isInitialized) return;
    _isInitialized = true;

    _nameController.text = entry.name;
    _caloriesController.text = entry.calories.toStringAsFixed(0);
    _proteinController.text = entry.protein?.toStringAsFixed(1) ?? '';
    _carbsController.text = entry.carbs?.toStringAsFixed(1) ?? '';
    _fatController.text = entry.fat?.toStringAsFixed(1) ?? '';
    _servingSizeController.text = entry.servingSize.toString();
    _selectedMeal = entry.mealType;
    _selectedUnit = entry.servingUnit;
    _selectedDateTime = entry.consumedAt;
  }

  Future<void> _saveEntry() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(editFoodProvider.notifier).updateEntry(
      widget.entryId,
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

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Food entry updated!')),
      );
      context.pop();
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Entry'),
        content: const Text('Are you sure you want to delete this food entry?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Theme.of(context).colorScheme.onError,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await ref.read(editFoodProvider.notifier).deleteEntry(widget.entryId);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Food entry deleted')),
        );
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final entryAsync = ref.watch(foodEntryProvider(widget.entryId));
    final editState = ref.watch(editFoodProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Food'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: editState.isDeleting ? null : _confirmDelete,
          ),
          TextButton(
            onPressed: editState.isSaving ? null : _saveEntry,
            child: editState.isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: entryAsync.when(
        data: (entry) {
          if (entry == null) {
            return const Center(
              child: Text('Food entry not found'),
            );
          }

          _initializeForm(entry);

          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Food name
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
                  'Nutrition',
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
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Error message
                if (editState.error != null) ...[
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
                            editState.error!,
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
                  onPressed: editState.isSaving ? null : _saveEntry,
                  child: editState.isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Save Changes'),
                ),
                const SizedBox(height: 12),

                // Delete button
                OutlinedButton(
                  onPressed: editState.isDeleting ? null : _confirmDelete,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                    side: BorderSide(color: Theme.of(context).colorScheme.error),
                  ),
                  child: editState.isDeleting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Delete Entry'),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
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
                'Failed to load food entry',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => ref.refresh(foodEntryProvider(widget.entryId)),
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
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
