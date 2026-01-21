// Re-export clerk types for conditional import
export 'clerk_types_native.dart' if (dart.library.html) 'clerk_types_web.dart';
