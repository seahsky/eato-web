import 'package:flutter/widgets.dart';

/// Web platform stub - clerk_flutter is not supported on web.
/// This bypasses ClerkAuth and renders the child directly.
///
/// TODO: Implement web-specific authentication when clerk_flutter adds web support
/// or use an alternative authentication method for web.
Widget buildClerkWrapper({
  required String publishableKey,
  required Widget child,
}) {
  // On web, clerk_flutter is not available.
  // Simply return the child without ClerkAuth wrapper.
  // The auth system will need to handle this case gracefully.
  return child;
}
