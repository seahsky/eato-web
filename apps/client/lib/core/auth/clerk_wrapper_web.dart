import 'package:flutter/widgets.dart';

/// Web platform wrapper - Clerk.js is loaded via index.html script tag.
/// The actual authentication is handled by the login screen using ClerkJS interop.
///
/// This wrapper simply returns the child since Clerk.js initialization
/// happens globally in the browser context.
Widget buildClerkWrapper({
  required String publishableKey,
  required Widget child,
}) {
  // On web, Clerk.js is loaded via the script tag in index.html
  // and initialized by clerk_init.js.
  // The ClerkAuthState in clerk_types_web.dart handles the interop.
  return child;
}
