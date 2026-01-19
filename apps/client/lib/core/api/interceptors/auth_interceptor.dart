import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../features/auth/providers/auth_provider.dart';

class AuthInterceptor extends Interceptor {
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  /// Maximum number of retries for transient failures
  static const _maxRetries = 1;

  /// Track if we're already handling a 401 to prevent loops
  static bool _isHandling401 = false;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Get token from secure storage
    final token = await _storage.read(key: _tokenKey);

    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // Initialize retry count
    options.extra['retryCount'] ??= 0;

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final statusCode = err.response?.statusCode;
    final retryCount = err.requestOptions.extra['retryCount'] as int? ?? 0;

    // Handle 401 Unauthorized
    if (statusCode == 401) {
      if (!_isHandling401) {
        _isHandling401 = true;
        try {
          // Call the global logout callback
          if (globalLogoutCallback != null) {
            await globalLogoutCallback!();
          }
        } finally {
          _isHandling401 = false;
        }
      }
      handler.next(err);
      return;
    }

    // Retry logic for transient failures (5xx, network errors)
    final shouldRetry = retryCount < _maxRetries &&
        (statusCode != null && statusCode >= 500 ||
            err.type == DioExceptionType.connectionTimeout ||
            err.type == DioExceptionType.receiveTimeout ||
            err.type == DioExceptionType.connectionError);

    if (shouldRetry) {
      err.requestOptions.extra['retryCount'] = retryCount + 1;

      // Wait before retrying (exponential backoff)
      await Future.delayed(Duration(milliseconds: 500 * (retryCount + 1)));

      try {
        // Create a new Dio instance for retry to avoid interceptor loops
        final dio = Dio();
        final response = await dio.fetch(err.requestOptions);
        handler.resolve(response);
        return;
      } catch (e) {
        // Retry failed, pass original error
        handler.next(err);
        return;
      }
    }

    handler.next(err);
  }

  // Static methods for token management
  static Future<void> setToken(String token) async {
    const storage = FlutterSecureStorage();
    await storage.write(key: _tokenKey, value: token);
  }

  static Future<void> clearToken() async {
    const storage = FlutterSecureStorage();
    await storage.delete(key: _tokenKey);
  }

  static Future<String?> getToken() async {
    const storage = FlutterSecureStorage();
    return storage.read(key: _tokenKey);
  }
}
