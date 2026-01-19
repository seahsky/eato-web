import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'interceptors/auth_interceptor.dart';

class ApiClient {
  static ApiClient? _instance;
  late final Dio dio;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: _getBaseUrl(),
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    dio.interceptors.addAll([
      AuthInterceptor(),
      if (kDebugMode) _LoggingInterceptor(),
    ]);
  }

  factory ApiClient() {
    _instance ??= ApiClient._internal();
    return _instance!;
  }

  static String _getBaseUrl() {
    // TODO: Configure from environment
    if (kDebugMode) {
      return 'http://localhost:3000/api/rest';
    }
    return 'https://eato.app/api/rest';
  }

  // Auth endpoints
  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await dio.get('/auth/me');
    return response.data as Map<String, dynamic>;
  }

  Future<String> generatePartnerCode() async {
    final response = await dio.post('/auth/partner-code');
    return response.data['code'] as String;
  }

  Future<void> linkPartner(String code) async {
    await dio.post('/auth/link-partner', data: {'code': code});
  }

  Future<void> unlinkPartner() async {
    await dio.post('/auth/unlink-partner');
  }

  // Profile endpoints
  Future<Map<String, dynamic>> getProfile() async {
    final response = await dio.get('/profile');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await dio.put('/profile', data: data);
    return response.data as Map<String, dynamic>;
  }

  // Food endpoints
  Future<List<dynamic>> searchFood(String query) async {
    final response = await dio.get('/food/search', queryParameters: {'q': query});
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getFoodByBarcode(String barcode) async {
    final response = await dio.get('/food/barcode/$barcode');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createFoodEntry(Map<String, dynamic> data) async {
    final response = await dio.post('/food/entries', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateFoodEntry(String id, Map<String, dynamic> data) async {
    final response = await dio.put('/food/entries/$id', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<void> deleteFoodEntry(String id) async {
    await dio.delete('/food/entries/$id');
  }

  // Stats endpoints
  Future<Map<String, dynamic>> getDailySummary(String date) async {
    final response = await dio.get('/stats/daily', queryParameters: {'date': date});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getWeeklySummary(String startDate) async {
    final response = await dio.get('/stats/weekly', queryParameters: {'startDate': startDate});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getPartnerDailySummary(String date) async {
    final response = await dio.get('/stats/partner/daily', queryParameters: {'date': date});
    return response.data as Map<String, dynamic>;
  }
}

class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('API Request: ${options.method} ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('API Response: ${response.statusCode} ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('API Error: ${err.message}');
    handler.next(err);
  }
}
