import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/notifications/providers/notification_provider.dart';

/// Widget that handles foreground notification display.
///
/// Wraps a child widget and listens to incoming push notifications,
/// displaying them as Material Banners when the app is in the foreground.
class ForegroundNotificationHandler extends ConsumerStatefulWidget {
  final Widget child;

  const ForegroundNotificationHandler({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<ForegroundNotificationHandler> createState() =>
      _ForegroundNotificationHandlerState();
}

class _ForegroundNotificationHandlerState
    extends ConsumerState<ForegroundNotificationHandler> {
  StreamSubscription<RemoteMessage>? _messageSubscription;

  @override
  void initState() {
    super.initState();
    _setupNotificationListener();
  }

  void _setupNotificationListener() {
    final pushService = ref.read(pushNotificationServiceProvider);

    _messageSubscription = pushService.onMessage.listen((RemoteMessage message) {
      _showNotificationBanner(message);
    });
  }

  void _showNotificationBanner(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    final title = notification.title ?? 'New Notification';
    final body = notification.body ?? '';
    final data = message.data;

    // Determine the action based on notification type
    final notificationType = data['type'] as String?;
    String? actionRoute;

    switch (notificationType) {
      case 'nudge':
        actionRoute = '/add'; // Go to add food screen
        break;
      case 'approval_request':
        actionRoute = '/partner/approvals';
        break;
      case 'approval_result':
        actionRoute = '/partner/submissions';
        break;
      case 'partner_link':
        actionRoute = '/partner';
        break;
      default:
        actionRoute = null;
    }

    if (!mounted) return;

    final colorScheme = Theme.of(context).colorScheme;

    ScaffoldMessenger.of(context).showMaterialBanner(
      MaterialBanner(
        backgroundColor: colorScheme.primaryContainer,
        leading: Icon(
          _getNotificationIcon(notificationType),
          color: colorScheme.onPrimaryContainer,
        ),
        content: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: colorScheme.onPrimaryContainer,
              ),
            ),
            if (body.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                body,
                style: TextStyle(
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              ScaffoldMessenger.of(context).hideCurrentMaterialBanner();
            },
            child: Text(
              'Dismiss',
              style: TextStyle(color: colorScheme.onPrimaryContainer),
            ),
          ),
          if (actionRoute != null)
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).hideCurrentMaterialBanner();
                context.push(actionRoute!);
              },
              child: Text(
                'View',
                style: TextStyle(
                  color: colorScheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );

    // Auto-dismiss after 5 seconds
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentMaterialBanner();
      }
    });
  }

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'nudge':
        return Icons.notifications_active;
      case 'approval_request':
        return Icons.approval;
      case 'approval_result':
        return Icons.check_circle;
      case 'partner_link':
        return Icons.people;
      default:
        return Icons.notifications;
    }
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
