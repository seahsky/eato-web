import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';

/// State for the profile feature
class ProfileState {
  final Profile? profile;
  final bool isLoading;
  final bool isSaving;
  final String? error;
  final BmrTdeePreview? preview;

  const ProfileState({
    this.profile,
    this.isLoading = false,
    this.isSaving = false,
    this.error,
    this.preview,
  });

  ProfileState copyWith({
    Profile? profile,
    bool? isLoading,
    bool? isSaving,
    String? error,
    BmrTdeePreview? preview,
  }) {
    return ProfileState(
      profile: profile ?? this.profile,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      error: error,
      preview: preview ?? this.preview,
    );
  }

  factory ProfileState.initial() => const ProfileState();

  bool get hasProfile => profile != null;
}

/// Profile state notifier
class ProfileNotifier extends StateNotifier<ProfileState> {
  final ApiClient _apiClient;
  final Ref _ref;

  ProfileNotifier(this._apiClient, this._ref) : super(ProfileState.initial()) {
    loadProfile();
  }

  /// Load the current user's profile
  Future<void> loadProfile() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = await _apiClient.getProfile();
      final profile = Profile.fromJson(data);
      state = state.copyWith(profile: profile, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load profile: ${e.toString()}',
      );
    }
  }

  /// Update the user's profile
  Future<bool> updateProfile(ProfileInput input) async {
    state = state.copyWith(isSaving: true, error: null);

    try {
      final data = await _apiClient.updateProfile(input.toJson());
      final profile = Profile.fromJson(data);
      state = state.copyWith(profile: profile, isSaving: false);

      // Refresh the auth state to update user info
      _ref.read(authProvider.notifier).refreshUser();

      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Failed to update profile: ${e.toString()}',
      );
      return false;
    }
  }

  /// Update just the calorie goal
  Future<bool> updateCalorieGoal(double calorieGoal) async {
    final currentProfile = state.profile;
    if (currentProfile == null) return false;

    state = state.copyWith(isSaving: true, error: null);

    try {
      final data = await _apiClient.updateProfile({
        'age': currentProfile.age,
        'weight': currentProfile.weight,
        'height': currentProfile.height,
        'gender': currentProfile.gender.name,
        'activityLevel': currentProfile.activityLevel.name,
        'calorieGoal': calorieGoal,
      });
      final profile = Profile.fromJson(data);
      state = state.copyWith(profile: profile, isSaving: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Failed to update calorie goal: ${e.toString()}',
      );
      return false;
    }
  }

  /// Preview BMR/TDEE calculation before saving
  Future<void> previewBmrTdee({
    required int age,
    required double weight,
    required double height,
    required Gender gender,
    required ActivityLevel activityLevel,
  }) async {
    // Calculate locally using Mifflin-St Jeor equation
    double bmr;
    if (gender == Gender.MALE) {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    final tdee = bmr * activityLevel.multiplier;

    state = state.copyWith(
      preview: BmrTdeePreview(
        bmr: bmr,
        tdee: tdee,
        suggestedGoal: tdee,
      ),
    );
  }

  /// Clear the preview
  void clearPreview() {
    state = state.copyWith(preview: null);
  }

  /// Refresh the profile
  Future<void> refresh() async {
    await loadProfile();
  }
}

/// Profile provider
final profileProvider =
    StateNotifierProvider<ProfileNotifier, ProfileState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProfileNotifier(apiClient, ref);
});

/// Current profile provider for convenience
final currentProfileProvider = Provider<Profile?>((ref) {
  return ref.watch(profileProvider).profile;
});

/// Is profile loading provider
final isProfileLoadingProvider = Provider<bool>((ref) {
  return ref.watch(profileProvider).isLoading;
});

/// Is profile saving provider
final isProfileSavingProvider = Provider<bool>((ref) {
  return ref.watch(profileProvider).isSaving;
});

/// Profile error provider
final profileErrorProvider = Provider<String?>((ref) {
  return ref.watch(profileProvider).error;
});

/// BMR/TDEE preview provider
final bmrTdeePreviewProvider = Provider<BmrTdeePreview?>((ref) {
  return ref.watch(profileProvider).preview;
});
