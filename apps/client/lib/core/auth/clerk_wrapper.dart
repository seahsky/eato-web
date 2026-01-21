import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

// Conditional import: clerk_flutter is only available on Android, iOS, macOS
// Web platform is not supported by clerk_flutter
import 'clerk_wrapper_native.dart' if (dart.library.html) 'clerk_wrapper_web.dart'
    as platform;

/// Platform-aware wrapper for Clerk authentication.
///
/// On supported platforms (Android, iOS, macOS), this wraps the child with ClerkAuth.
/// On web, it bypasses ClerkAuth since the package doesn't support web yet.
class ClerkWrapper extends StatelessWidget {
  final String publishableKey;
  final Widget child;

  const ClerkWrapper({
    super.key,
    required this.publishableKey,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return platform.buildClerkWrapper(
      publishableKey: publishableKey,
      child: child,
    );
  }
}
