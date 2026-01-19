import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/models/models.dart';
import '../providers/approval_provider.dart';

class ApprovalsScreen extends ConsumerStatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  ConsumerState<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends ConsumerState<ApprovalsScreen> {
  @override
  void initState() {
    super.initState();
    // Load pending approvals when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(approvalProvider.notifier).loadPendingApprovals();
    });
  }

  @override
  Widget build(BuildContext context) {
    final approvalState = ref.watch(approvalProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Approvals'),
      ),
      body: approvalState.isLoading && approvalState.pendingApprovals.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () =>
                  ref.read(approvalProvider.notifier).loadPendingApprovals(),
              child: approvalState.pendingApprovals.isEmpty
                  ? _buildEmptyState(context)
                  : _buildApprovalList(context, approvalState),
            ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.7,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle_outline,
                size: 80,
                color: colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                'All caught up!',
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'No pending food entries to review.',
                style: textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildApprovalList(BuildContext context, ApprovalState state) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.pendingApprovals.length,
      itemBuilder: (context, index) {
        final approval = state.pendingApprovals[index];
        return _ApprovalCard(
          approval: approval,
          isApproving: state.isApproving,
          isRejecting: state.isRejecting,
          onApprove: () => _handleApprove(approval.id),
          onReject: () => _showRejectDialog(approval.id),
        );
      },
    );
  }

  Future<void> _handleApprove(String entryId) async {
    final success = await ref.read(approvalProvider.notifier).approve(entryId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Entry approved!')),
      );
    }
  }

  Future<void> _showRejectDialog(String entryId) async {
    final noteController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Entry'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to reject this entry?'),
            const SizedBox(height: 16),
            TextField(
              controller: noteController,
              decoration: const InputDecoration(
                labelText: 'Reason (optional)',
                hintText: 'Let your partner know why...',
              ),
              maxLines: 2,
            ),
          ],
        ),
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
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final note = noteController.text.trim().isEmpty
          ? null
          : noteController.text.trim();
      final success = await ref
          .read(approvalProvider.notifier)
          .reject(entryId, note: note);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Entry rejected')),
        );
      }
    }

    noteController.dispose();
  }
}

class _ApprovalCard extends StatelessWidget {
  final PendingApproval approval;
  final bool isApproving;
  final bool isRejecting;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  const _ApprovalCard({
    required this.approval,
    required this.isApproving,
    required this.isRejecting,
    required this.onApprove,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final dateFormat = DateFormat('MMM d, h:mm a');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row with food name and logged by
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Food image or icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: approval.imageUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            approval.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Icon(
                              Icons.restaurant,
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        )
                      : Icon(
                          Icons.restaurant,
                          color: colorScheme.onSurfaceVariant,
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        approval.displayName,
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Logged by ${approval.loggedByName ?? 'partner'}',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Nutrition info
            Row(
              children: [
                _NutrientChip(
                  label: 'Calories',
                  value: '${approval.calories.toInt()}',
                  unit: 'kcal',
                ),
                const SizedBox(width: 8),
                _NutrientChip(
                  label: 'Protein',
                  value: '${approval.protein?.toInt() ?? 0}',
                  unit: 'g',
                ),
                const SizedBox(width: 8),
                _NutrientChip(
                  label: 'Carbs',
                  value: '${approval.carbs?.toInt() ?? 0}',
                  unit: 'g',
                ),
                const SizedBox(width: 8),
                _NutrientChip(
                  label: 'Fat',
                  value: '${approval.fat?.toInt() ?? 0}',
                  unit: 'g',
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Meal type and time
            Row(
              children: [
                Icon(
                  _getMealIcon(approval.mealType),
                  size: 16,
                  color: colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  approval.mealType.displayName,
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.schedule,
                  size: 16,
                  color: colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  dateFormat.format(approval.loggedAt),
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: isApproving || isRejecting ? null : onReject,
                    icon: isRejecting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.close),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: colorScheme.error,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: isApproving || isRejecting ? null : onApprove,
                    icon: isApproving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.check),
                    label: const Text('Approve'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      foregroundColor: colorScheme.onPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getMealIcon(MealType mealType) {
    switch (mealType) {
      case MealType.BREAKFAST:
        return Icons.free_breakfast;
      case MealType.LUNCH:
        return Icons.lunch_dining;
      case MealType.DINNER:
        return Icons.dinner_dining;
      case MealType.SNACK:
        return Icons.cookie;
    }
  }
}

class _NutrientChip extends StatelessWidget {
  final String label;
  final String value;
  final String unit;

  const _NutrientChip({
    required this.label,
    required this.value,
    required this.unit,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Text(
            '$value$unit',
            style: textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
