import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/widgets.dart';

/// Native platform implementation that uses ClerkAuth.
/// Supports Android, iOS, and macOS.
Widget buildClerkWrapper({
  required String publishableKey,
  required Widget child,
}) {
  return ClerkAuth(
    config: ClerkAuthConfig(publishableKey: publishableKey),
    child: child,
  );
}
