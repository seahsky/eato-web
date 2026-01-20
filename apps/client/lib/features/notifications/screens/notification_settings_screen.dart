import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/models/models.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../providers/notification_provider.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends ConsumerState<NotificationSettingsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).loadSettings();
    });
  }

  @override
  Widget build(BuildContext context) {
    final notificationState = ref.watch(notificationProvider);
    final settings = notificationState.settings;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
      ),
      body: notificationState.isLoading && settings == null
          ? const NotificationSettingsSkeleton()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Permission status card
                  _buildPermissionCard(context, notificationState),
                  const SizedBox(height: 24),

                  // Partner notifications section
                  if (settings != null) ...[
                    _buildSectionHeader(context, 'Partner Notifications'),
                    const SizedBox(height: 8),
                    _buildSettingsCard(context, [
                      _SettingTile(
                        title: 'Food Logged',
                        subtitle: 'When your partner logs a meal',
                        value: settings.partnerFoodLogged,
                        onChanged: (value) => _updateSetting(
                          settings.copyWith(partnerFoodLogged: value),
                        ),
                      ),
                      _SettingTile(
                        title: 'Goal Reached',
                        subtitle: 'When your partner reaches their daily goal',
                        value: settings.partnerGoalReached,
                        onChanged: (value) => _updateSetting(
                          settings.copyWith(partnerGoalReached: value),
                        ),
                      ),
                      _SettingTile(
                        title: 'Partner Linked',
                        subtitle: 'When someone links with your code',
                        value: settings.partnerLinked,
                        onChanged: (value) => _updateSetting(
                          settings.copyWith(partnerLinked: value),
                        ),
                      ),
                      _SettingTile(
                        title: 'Receive Nudges',
                        subtitle: 'Friendly reminders from your partner',
                        value: settings.receiveNudges,
                        onChanged: (value) => _updateSetting(
                          settings.copyWith(receiveNudges: value),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 24),

                    // Meal reminders section
                    _buildSectionHeader(context, 'Meal Reminders'),
                    const SizedBox(height: 8),
                    _buildSettingsCard(context, [
                      _TimeSettingTile(
                        title: 'Breakfast Reminder',
                        subtitle: settings.breakfastReminderTime ?? 'Not set',
                        value: settings.breakfastReminderTime,
                        onChanged: (value) => _updateSetting(
                          settings.copyWith(breakfastReminderTime: value),
                        ),
                        onClear: () => _updateSettingWithNull(
                          'breakfastReminderTime',
                          settings,
                        ),
                      ),
                      _TimeSettingTile(
                        title: 'Lunch Reminder',
                        subtitle: settings.lunchReminderTime ?? 'Not set',
                        value: settings.lunchReminderTime,
                        onChanged: (value) => _updateSetting(
                          settings.copyWith(lunchReminderTime: value),
                        ),
                        onClear: () => _updateSettingWithNull(
                          'lunchReminderTime',
                          settings,
                        ),
                      ),
                      _TimeSettingTile(
                        title: 'Dinner Reminder',
                        subtitle: settings.dinnerReminderTime ?? 'Not set',
                        value: settings.dinnerReminderTime,
                        onChanged: (value) => _updateSetting(
                          settings.copyWith(dinnerReminderTime: value),
                        ),
                        onClear: () => _updateSettingWithNull(
                          'dinnerReminderTime',
                          settings,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 24),

                    // Timezone section
                    _buildSectionHeader(context, 'Timezone'),
                    const SizedBox(height: 8),
                    _buildTimezoneCard(context, settings),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildPermissionCard(
      BuildContext context, NotificationState notificationState) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isEnabled = notificationState.isEnabled;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: isEnabled
                        ? Colors.green.shade100
                        : colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isEnabled
                        ? Icons.notifications_active
                        : Icons.notifications_off,
                    color: isEnabled ? Colors.green : colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEnabled
                            ? 'Notifications Enabled'
                            : 'Notifications Disabled',
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        isEnabled
                            ? 'You\'ll receive updates from your partner'
                            : 'Enable to receive partner updates',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (!isEnabled) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: notificationState.isRegistering
                      ? null
                      : () => ref
                          .read(notificationProvider.notifier)
                          .requestPermissionAndRegister(),
                  child: notificationState.isRegistering
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Enable Notifications'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Text(
      title,
      style: textTheme.titleSmall?.copyWith(
        color: colorScheme.primary,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildSettingsCard(BuildContext context, List<Widget> children) {
    return Card(
      child: Column(
        children: [
          for (int i = 0; i < children.length; i++) ...[
            children[i],
            if (i < children.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }

  Widget _buildTimezoneCard(BuildContext context, NotificationSettings settings) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: ListTile(
        title: const Text('Timezone'),
        subtitle: Text(
          settings.timezone,
          style: textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => _showTimezoneSelector(context, settings),
      ),
    );
  }

  Future<void> _updateSetting(NotificationSettings newSettings) async {
    final success = await ref
        .read(notificationProvider.notifier)
        .updateSettings(newSettings);

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update settings')),
      );
    }
  }

  Future<void> _updateSettingWithNull(
      String field, NotificationSettings current) async {
    // Create a new settings object with the field set to null
    final json = current.toJson();
    json[field] = null;

    await ref.read(notificationProvider.notifier).updateSettings(
          NotificationSettings.fromJson(json),
        );
  }

  Future<void> _showTimezoneSelector(
      BuildContext context, NotificationSettings settings) async {
    final commonTimezones = [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Singapore',
      'Australia/Sydney',
    ];

    final selected = await showDialog<String>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Select Timezone'),
        children: commonTimezones.map((tz) {
          return SimpleDialogOption(
            onPressed: () => Navigator.pop(context, tz),
            child: Row(
              children: [
                Expanded(child: Text(tz)),
                if (tz == settings.timezone)
                  const Icon(Icons.check, color: Colors.green),
              ],
            ),
          );
        }).toList(),
      ),
    );

    if (selected != null && selected != settings.timezone) {
      _updateSetting(settings.copyWith(timezone: selected));
    }
  }
}

class _SettingTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SettingTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return SwitchListTile(
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: textTheme.bodySmall?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
      ),
      value: value,
      onChanged: onChanged,
    );
  }
}

class _TimeSettingTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? value;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  const _TimeSettingTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return ListTile(
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: textTheme.bodySmall?.copyWith(
          color: value != null ? colorScheme.primary : colorScheme.onSurfaceVariant,
        ),
      ),
      trailing: value != null
          ? IconButton(
              icon: const Icon(Icons.clear),
              onPressed: onClear,
            )
          : const Icon(Icons.schedule),
      onTap: () => _showTimePicker(context),
    );
  }

  Future<void> _showTimePicker(BuildContext context) async {
    TimeOfDay initialTime = TimeOfDay.now();
    if (value != null) {
      final parts = value!.split(':');
      initialTime = TimeOfDay(
        hour: int.parse(parts[0]),
        minute: int.parse(parts[1]),
      );
    }

    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );

    if (picked != null) {
      final timeString =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      onChanged(timeString);
    }
  }
}
