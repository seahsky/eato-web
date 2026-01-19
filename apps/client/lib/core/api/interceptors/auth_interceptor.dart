import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthInterceptor extends Interceptor {
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

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

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Handle 401 Unauthorized
    if (err.response?.statusCode == 401) {
      // TODO: Trigger logout or token refresh
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
