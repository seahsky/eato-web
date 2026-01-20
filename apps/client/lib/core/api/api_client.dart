import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../config/env.dart';
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
    return '${Env.apiBaseUrl}/api/rest';
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

  Future<Map<String, dynamic>> getFoodEntry(String id) async {
    final response = await dio.get('/food/entries/$id');
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

  Future<Map<String, dynamic>> getPartnerWeeklySummary(String startDate) async {
    final response = await dio.get('/stats/partner/weekly', queryParameters: {'startDate': startDate});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getStreakData() async {
    final response = await dio.get('/stats/streak');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> getPartnerStreakData() async {
    final response = await dio.get('/stats/partner/streak');
    return response.data as Map<String, dynamic>?;
  }

  // Approval endpoints
  Future<List<dynamic>> getPendingApprovals() async {
    final response = await dio.get('/food/pending-approvals');
    return response.data as List<dynamic>;
  }

  Future<int> getPendingApprovalCount() async {
    final response = await dio.get('/food/pending-approvals/count');
    return response.data['count'] as int;
  }

  Future<List<dynamic>> getMyPendingSubmissions() async {
    final response = await dio.get('/food/my-pending-submissions');
    return response.data as List<dynamic>;
  }

  Future<void> approveEntry(String entryId) async {
    await dio.post('/food/entries/$entryId/approve');
  }

  Future<void> rejectEntry(String entryId, {String? note}) async {
    await dio.post('/food/entries/$entryId/reject', data: {'note': note});
  }

  Future<void> resubmitEntry(String entryId) async {
    await dio.post('/food/entries/$entryId/resubmit');
  }

  // Nudge endpoints
  Future<Map<String, dynamic>> sendNudge({String? message}) async {
    final response = await dio.post('/notifications/nudge', data: {'message': message});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> getLastNudge() async {
    final response = await dio.get('/notifications/nudge/last');
    return response.data as Map<String, dynamic>?;
  }

  // Notification settings endpoints
  Future<Map<String, dynamic>> getNotificationSettings() async {
    final response = await dio.get('/notifications/settings');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateNotificationSettings(Map<String, dynamic> data) async {
    final response = await dio.put('/notifications/settings', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<void> subscribeExpoNotifications({
    required String expoToken,
    String? deviceId,
    String? userAgent,
  }) async {
    await dio.post('/notifications/subscribe-expo', data: {
      'expoToken': expoToken,
      if (deviceId != null) 'deviceId': deviceId,
      if (userAgent != null) 'userAgent': userAgent,
    });
  }

  Future<void> unsubscribeNotifications({String? expoToken}) async {
    await dio.post('/notifications/unsubscribe', data: {
      if (expoToken != null) 'expoToken': expoToken,
    });
  }

  Future<bool> hasNotificationSubscription() async {
    final response = await dio.get('/notifications/has-subscription');
    return response.data as bool;
  }

  // Recipe endpoints
  Future<Map<String, dynamic>> createRecipe(Map<String, dynamic> data) async {
    final response = await dio.post('/recipes', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> listRecipes() async {
    final response = await dio.get('/recipes');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getRecipe(String id) async {
    final response = await dio.get('/recipes/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateRecipe(String id, Map<String, dynamic> data) async {
    final response = await dio.put('/recipes/$id', data: {'id': id, 'data': data});
    return response.data as Map<String, dynamic>;
  }

  Future<void> deleteRecipe(String id) async {
    await dio.delete('/recipes/$id');
  }

  Future<Map<String, dynamic>> logRecipe(Map<String, dynamic> data) async {
    final response = await dio.post('/recipes/log', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> searchRecipes(String query) async {
    final response = await dio.get('/recipes/search', queryParameters: {'query': query});
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> getRecentRecipes({int limit = 5}) async {
    final response = await dio.get('/recipes/recent', queryParameters: {'limit': limit});
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> previewRecipeNutrition(Map<String, dynamic> data) async {
    final response = await dio.post('/recipes/preview-nutrition', data: data);
    return response.data as Map<String, dynamic>;
  }

  // Achievement/Gamification endpoints
  Future<Map<String, dynamic>> getAllAchievements() async {
    final response = await dio.get('/achievements');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getAchievementsByCategory() async {
    final response = await dio.get('/achievements/by-category');
    return response.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getRecentAchievements() async {
    final response = await dio.get('/achievements/recent');
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getAchievementSummary() async {
    final response = await dio.get('/achievements/summary');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> getPartnerAchievements() async {
    final response = await dio.get('/achievements/partner');
    return response.data as Map<String, dynamic>?;
  }

  // Partner shield endpoints
  Future<Map<String, dynamic>> getPartnerShieldStatus() async {
    final response = await dio.get('/stats/partner-shields');
    return response.data as Map<String, dynamic>;
  }

  Future<void> usePartnerShield(String targetDate) async {
    await dio.post('/stats/partner-shields/use', data: {'targetDate': targetDate});
  }

  Future<Map<String, dynamic>> getPartnerShieldHistory() async {
    final response = await dio.get('/stats/partner-shields/history');
    return response.data as Map<String, dynamic>;
  }

  // Theme and Avatar Frame endpoints
  Future<Map<String, dynamic>> updateTheme(String theme) async {
    final response = await dio.put('/achievements/theme', data: {'theme': theme});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateAvatarFrame(String avatarFrame) async {
    final response = await dio.put('/achievements/avatar-frame', data: {'avatarFrame': avatarFrame});
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
