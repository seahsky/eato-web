import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/models/models.dart';
import '../providers/approval_provider.dart';

class MySubmissionsScreen extends ConsumerStatefulWidget {
  const MySubmissionsScreen({super.key});

  @override
  ConsumerState<MySubmissionsScreen> createState() => _MySubmissionsScreenState();
}

class _MySubmissionsScreenState extends ConsumerState<MySubmissionsScreen> {
  @override
  void initState() {
    super.initState();
    // Load my submissions when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(approvalProvider.notifier).loadMySubmissions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final approvalState = ref.watch(approvalProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Submissions'),
      ),
      body: approvalState.isLoading && approvalState.mySubmissions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () =>
                  ref.read(approvalProvider.notifier).loadMySubmissions(),
              child: approvalState.mySubmissions.isEmpty
                  ? _buildEmptyState(context)
                  : _buildSubmissionList(context, approvalState),
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
                Icons.send_outlined,
                size: 80,
                color: colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                'No submissions yet',
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  'When you log food for your partner, it will appear here until they approve it.',
                  style: textTheme.bodyLarge?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubmissionList(BuildContext context, ApprovalState state) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.mySubmissions.length,
      itemBuilder: (context, index) {
        final submission = state.mySubmissions[index];
        return _SubmissionCard(
          submission: submission,
          onResubmit: submission.approvalStatus == ApprovalStatus.REJECTED
              ? () => _handleResubmit(submission.id)
              : null,
        );
      },
    );
  }

  Future<void> _handleResubmit(String entryId) async {
    final success = await ref.read(approvalProvider.notifier).resubmit(entryId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Entry resubmitted for approval')),
      );
    }
  }
}

class _SubmissionCard extends StatelessWidget {
  final MySubmission submission;
  final VoidCallback? onResubmit;

  const _SubmissionCard({
    required this.submission,
    this.onResubmit,
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
            // Header row with food name and status
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
                  child: submission.imageUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            submission.imageUrl!,
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
                        submission.displayName,
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'For ${submission.partnerName ?? 'partner'}',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                _StatusChip(status: submission.approvalStatus),
              ],
            ),
            const SizedBox(height: 12),

            // Nutrition info
            Row(
              children: [
                _NutrientChip(
                  value: '${submission.calories.toInt()}',
                  unit: 'kcal',
                ),
                const SizedBox(width: 8),
                _NutrientChip(
                  value: '${submission.protein?.toInt() ?? 0}',
                  unit: 'g P',
                ),
                const SizedBox(width: 8),
                _NutrientChip(
                  value: '${submission.carbs?.toInt() ?? 0}',
                  unit: 'g C',
                ),
                const SizedBox(width: 8),
                _NutrientChip(
                  value: '${submission.fat?.toInt() ?? 0}',
                  unit: 'g F',
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Meal type and time
            Row(
              children: [
                Icon(
                  _getMealIcon(submission.mealType),
                  size: 16,
                  color: colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  submission.mealType.displayName,
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
                  dateFormat.format(submission.loggedAt),
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),

            // Rejection note if rejected
            if (submission.approvalStatus == ApprovalStatus.REJECTED &&
                submission.rejectionNote != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: 16,
                      color: colorScheme.error,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        submission.rejectionNote!,
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onErrorContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Resubmit button for rejected entries
            if (submission.approvalStatus == ApprovalStatus.REJECTED &&
                onResubmit != null) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onResubmit,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Resubmit'),
                ),
              ),
            ],
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

class _StatusChip extends StatelessWidget {
  final ApprovalStatus status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    Color backgroundColor;
    Color textColor;
    IconData icon;

    switch (status) {
      case ApprovalStatus.PENDING:
        backgroundColor = Colors.orange.shade100;
        textColor = Colors.orange.shade800;
        icon = Icons.hourglass_empty;
      case ApprovalStatus.APPROVED:
        backgroundColor = Colors.green.shade100;
        textColor = Colors.green.shade800;
        icon = Icons.check_circle;
      case ApprovalStatus.REJECTED:
        backgroundColor = colorScheme.errorContainer;
        textColor = colorScheme.error;
        icon = Icons.cancel;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            status.displayName,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _NutrientChip extends StatelessWidget {
  final String value;
  final String unit;

  const _NutrientChip({
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
      child: Text(
        '$value $unit',
        style: textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
