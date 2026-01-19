import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/approval_provider.dart';
import '../providers/nudge_provider.dart';
import '../providers/partner_provider.dart';

class PartnerScreen extends ConsumerStatefulWidget {
  const PartnerScreen({super.key});

  @override
  ConsumerState<PartnerScreen> createState() => _PartnerScreenState();
}

class _PartnerScreenState extends ConsumerState<PartnerScreen> {
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final partnerState = ref.watch(partnerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Partner'),
      ),
      body: partnerState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : partnerState.hasPartner
              ? _buildPartnerView(context, partnerState)
              : _buildNoPartnerView(context, partnerState),
    );
  }

  Widget _buildNoPartnerView(BuildContext context, PartnerViewState state) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return RefreshIndicator(
      onRefresh: () => ref.read(partnerProvider.notifier).refresh(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Icon(
                Icons.people_outline,
                size: 80,
                color: colorScheme.primary,
              ),
              const SizedBox(height: 24),
              Text(
                'Connect with your partner',
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Track your calorie goals together and support each other on your health journey.',
                style: textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Generate code section
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        'Your Partner Code',
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (state.hasValidCode) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            state.linkCode!,
                            style: textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              letterSpacing: 4,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: state.linkCode!));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Code copied to clipboard')),
                            );
                          },
                          icon: const Icon(Icons.copy),
                          label: const Text('Copy Code'),
                        ),
                      ] else ...[
                        Text(
                          'Share this code with your partner to connect',
                          style: textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          onPressed: state.isGeneratingCode
                              ? null
                              : () => ref.read(partnerProvider.notifier).generateLinkCode(),
                          icon: state.isGeneratingCode
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.qr_code),
                          label: const Text('Generate Code'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Enter partner code
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        'Have a partner code?',
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _codeController,
                        decoration: const InputDecoration(
                          hintText: 'Enter partner code',
                        ),
                        textAlign: TextAlign.center,
                        textCapitalization: TextCapitalization.characters,
                        maxLength: 6,
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: state.isLinking
                            ? null
                            : () => _linkPartner(context),
                        child: state.isLinking
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Link Partner'),
                      ),
                    ],
                  ),
                ),
              ),

              // Error message
              if (state.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.error_outline,
                        color: colorScheme.error,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          state.error!,
                          style: TextStyle(
                            color: colorScheme.onErrorContainer,
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
      ),
    );
  }

  Widget _buildPartnerView(BuildContext context, PartnerViewState state) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final partner = state.partner!;
    final partnerSummary = state.partnerDailySummary;

    return RefreshIndicator(
      onRefresh: () => ref.read(partnerProvider.notifier).refresh(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Partner header
            Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: colorScheme.primaryContainer,
                  backgroundImage: partner.avatarUrl != null
                      ? NetworkImage(partner.avatarUrl!)
                      : null,
                  child: partner.avatarUrl == null
                      ? const Icon(Icons.person)
                      : null,
                ),
                title: Text(partner.displayName),
                subtitle: const Text('Linked'),
                trailing: IconButton(
                  icon: const Icon(Icons.link_off),
                  onPressed: () => _confirmUnlink(context),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Partner's today summary
            Text(
              "${partner.displayName}'s Today",
              style: textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            if (partnerSummary != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _StatItem(
                            label: 'Calories',
                            value: partnerSummary.totalCalories.toInt().toString(),
                            unit: 'kcal',
                          ),
                          _StatItem(
                            label: 'Protein',
                            value: partnerSummary.totalProtein.toInt().toString(),
                            unit: 'g',
                          ),
                          _StatItem(
                            label: 'Progress',
                            value: (partnerSummary.calorieProgress * 100).toInt().toString(),
                            unit: '%',
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Progress bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: partnerSummary.calorieProgress.clamp(0.0, 1.0),
                          minHeight: 8,
                          backgroundColor: colorScheme.surfaceContainerHighest,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${partnerSummary.totalCalories.toInt()} / ${partnerSummary.calorieGoal.toInt()} kcal',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.restaurant_outlined,
                          size: 48,
                          color: colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No entries logged today',
                          style: textTheme.bodyLarge?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Nudge section
            _buildNudgeSection(context),

            const SizedBox(height: 24),

            // Navigation section
            _buildNavigationSection(context),
          ],
        ),
      ),
    );
  }

  Widget _buildNudgeSection(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final nudgeState = ref.watch(nudgeProvider);

    // Show snackbar for nudge results
    ref.listen<NudgeState>(nudgeProvider, (previous, next) {
      if (next.successMessage != null && previous?.successMessage != next.successMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.successMessage!)),
        );
        ref.read(nudgeProvider.notifier).clearMessages();
      }
      if (next.error != null && previous?.error != next.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: colorScheme.error,
          ),
        );
        ref.read(nudgeProvider.notifier).clearMessages();
      }
    });

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Send a Nudge',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Remind your partner to log their meals',
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: nudgeState.canSendNudge && !nudgeState.isSending
                    ? () => _showNudgeDialog(context)
                    : null,
                icon: nudgeState.isSending
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.notifications_active),
                label: Text(
                  nudgeState.canSendNudge
                      ? 'Send Nudge'
                      : 'Wait ${nudgeState.cooldownDisplay}',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showNudgeDialog(BuildContext context) async {
    final messageController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Send Nudge'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Send a friendly reminder to your partner to log their meals.'),
            const SizedBox(height: 16),
            TextField(
              controller: messageController,
              decoration: const InputDecoration(
                labelText: 'Custom message (optional)',
                hintText: 'e.g., "Don\'t forget lunch!"',
              ),
              maxLines: 2,
              maxLength: 200,
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
            child: const Text('Send'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final message = messageController.text.trim().isEmpty
          ? null
          : messageController.text.trim();
      await ref.read(nudgeProvider.notifier).sendNudge(message: message);
    }

    messageController.dispose();
  }

  Widget _buildNavigationSection(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final pendingCount = ref.watch(pendingApprovalCountProvider);

    return Card(
      child: Column(
        children: [
          ListTile(
            leading: Badge(
              isLabelVisible: pendingCount > 0,
              label: Text('$pendingCount'),
              child: const Icon(Icons.approval),
            ),
            title: const Text('Pending Approvals'),
            subtitle: Text(
              pendingCount > 0
                  ? '$pendingCount entries waiting for your review'
                  : 'No pending entries',
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/partner/approvals'),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.send),
            title: const Text('My Submissions'),
            subtitle: Text(
              'Food you logged for your partner',
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/partner/submissions'),
          ),
        ],
      ),
    );
  }

  Future<void> _linkPartner(BuildContext context) async {
    final code = _codeController.text.trim();
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a 6-character code')),
      );
      return;
    }

    final success = await ref.read(partnerProvider.notifier).linkPartner(code);
    if (success && mounted) {
      _codeController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Successfully linked with partner!')),
      );
    }
  }

  Future<void> _confirmUnlink(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unlink Partner'),
        content: const Text(
          'Are you sure you want to unlink from your partner? '
          'You can link again with a new code.',
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
            child: const Text('Unlink'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await ref.read(partnerProvider.notifier).unlinkPartner();
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Partner unlinked')),
        );
      }
    }
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final String unit;

  const _StatItem({
    required this.label,
    required this.value,
    required this.unit,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Text(
          label,
          style: textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        RichText(
          text: TextSpan(
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
            children: [
              TextSpan(text: value),
              TextSpan(
                text: ' $unit',
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
