import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/notification_provider.dart';

class NotificationPermissionScreen extends ConsumerWidget {
  /// Where to navigate after permission flow completes
  final String? redirectTo;

  const NotificationPermissionScreen({
    super.key,
    this.redirectTo,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final notificationState = ref.watch(notificationProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),

              // Icon
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.notifications_active,
                  size: 60,
                  color: colorScheme.primary,
                ),
              ),
              const SizedBox(height: 32),

              // Title
              Text(
                'Stay in the Loop',
                style: textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              // Description
              Text(
                'Enable notifications to get updates when your partner logs meals, reaches their goals, or sends you a nudge.',
                style: textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Benefits list
              _BenefitItem(
                icon: Icons.restaurant,
                text: 'Know when your partner logs a meal',
              ),
              const SizedBox(height: 12),
              _BenefitItem(
                icon: Icons.emoji_events,
                text: 'Celebrate when they hit their goals',
              ),
              const SizedBox(height: 12),
              _BenefitItem(
                icon: Icons.favorite,
                text: 'Receive friendly nudges from each other',
              ),

              const Spacer(),

              // Error message
              if (notificationState.error != null) ...[
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
                          notificationState.error!,
                          style: TextStyle(
                            color: colorScheme.onErrorContainer,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Enable button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: notificationState.isRegistering
                      ? null
                      : () => _enableNotifications(context, ref),
                  child: notificationState.isRegistering
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Enable Notifications'),
                ),
              ),
              const SizedBox(height: 12),

              // Skip button
              TextButton(
                onPressed: () => _skip(context),
                child: Text(
                  'Maybe Later',
                  style: TextStyle(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _enableNotifications(BuildContext context, WidgetRef ref) async {
    final success = await ref
        .read(notificationProvider.notifier)
        .requestPermissionAndRegister();

    if (success && context.mounted) {
      _navigateNext(context);
    }
  }

  void _skip(BuildContext context) {
    _navigateNext(context);
  }

  void _navigateNext(BuildContext context) {
    if (redirectTo != null) {
      context.go(redirectTo!);
    } else {
      context.go('/dashboard');
    }
  }
}

class _BenefitItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _BenefitItem({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: colorScheme.primary,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}
