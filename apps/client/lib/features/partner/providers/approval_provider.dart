import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';

/// State for the approval feature
class ApprovalState {
  final List<PendingApproval> pendingApprovals;
  final List<MySubmission> mySubmissions;
  final int pendingCount;
  final bool isLoading;
  final bool isApproving;
  final bool isRejecting;
  final String? error;

  const ApprovalState({
    this.pendingApprovals = const [],
    this.mySubmissions = const [],
    this.pendingCount = 0,
    this.isLoading = false,
    this.isApproving = false,
    this.isRejecting = false,
    this.error,
  });

  ApprovalState copyWith({
    List<PendingApproval>? pendingApprovals,
    List<MySubmission>? mySubmissions,
    int? pendingCount,
    bool? isLoading,
    bool? isApproving,
    bool? isRejecting,
    String? error,
  }) {
    return ApprovalState(
      pendingApprovals: pendingApprovals ?? this.pendingApprovals,
      mySubmissions: mySubmissions ?? this.mySubmissions,
      pendingCount: pendingCount ?? this.pendingCount,
      isLoading: isLoading ?? this.isLoading,
      isApproving: isApproving ?? this.isApproving,
      isRejecting: isRejecting ?? this.isRejecting,
      error: error,
    );
  }

  factory ApprovalState.initial() => const ApprovalState();
}

/// Approval state notifier
class ApprovalNotifier extends StateNotifier<ApprovalState> {
  final ApiClient _apiClient;

  ApprovalNotifier(this._apiClient) : super(ApprovalState.initial()) {
    loadPendingCount();
  }

  /// Load only the pending approval count (for badge)
  Future<void> loadPendingCount() async {
    try {
      final count = await _apiClient.getPendingApprovalCount();
      state = state.copyWith(pendingCount: count);
    } catch (e) {
      // Silently fail - count is optional
    }
  }

  /// Load all pending approvals
  Future<void> loadPendingApprovals() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = await _apiClient.getPendingApprovals();
      final approvals = data
          .map((json) => PendingApproval.fromJson(json as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        pendingApprovals: approvals,
        pendingCount: approvals.length,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load pending approvals: ${e.toString()}',
      );
    }
  }

  /// Load my pending submissions
  Future<void> loadMySubmissions() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = await _apiClient.getMyPendingSubmissions();
      final submissions = data
          .map((json) => MySubmission.fromJson(json as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        mySubmissions: submissions,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load submissions: ${e.toString()}',
      );
    }
  }

  /// Approve an entry
  Future<bool> approve(String entryId) async {
    state = state.copyWith(isApproving: true, error: null);

    try {
      await _apiClient.approveEntry(entryId);

      // Remove from local list
      final updatedApprovals = state.pendingApprovals
          .where((a) => a.id != entryId)
          .toList();

      state = state.copyWith(
        pendingApprovals: updatedApprovals,
        pendingCount: updatedApprovals.length,
        isApproving: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isApproving: false,
        error: 'Failed to approve entry: ${e.toString()}',
      );
      return false;
    }
  }

  /// Reject an entry
  Future<bool> reject(String entryId, {String? note}) async {
    state = state.copyWith(isRejecting: true, error: null);

    try {
      await _apiClient.rejectEntry(entryId, note: note);

      // Remove from local list
      final updatedApprovals = state.pendingApprovals
          .where((a) => a.id != entryId)
          .toList();

      state = state.copyWith(
        pendingApprovals: updatedApprovals,
        pendingCount: updatedApprovals.length,
        isRejecting: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isRejecting: false,
        error: 'Failed to reject entry: ${e.toString()}',
      );
      return false;
    }
  }

  /// Resubmit a rejected entry
  Future<bool> resubmit(String entryId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _apiClient.resubmitEntry(entryId);

      // Update local list - change status to PENDING
      final updatedSubmissions = state.mySubmissions.map((s) {
        if (s.id == entryId) {
          return MySubmission(
            id: s.id,
            name: s.name,
            barcode: s.barcode,
            brand: s.brand,
            imageUrl: s.imageUrl,
            calories: s.calories,
            protein: s.protein,
            carbs: s.carbs,
            fat: s.fat,
            fiber: s.fiber,
            servingSize: s.servingSize,
            servingUnit: s.servingUnit,
            mealType: s.mealType,
            consumedAt: s.consumedAt,
            loggedAt: s.loggedAt,
            approvalStatus: ApprovalStatus.PENDING,
            rejectionNote: null,
            user: s.user,
          );
        }
        return s;
      }).toList();

      state = state.copyWith(
        mySubmissions: updatedSubmissions,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to resubmit entry: ${e.toString()}',
      );
      return false;
    }
  }

  /// Refresh all data
  Future<void> refresh() async {
    await Future.wait([
      loadPendingApprovals(),
      loadMySubmissions(),
    ]);
  }
}

// Providers

/// Approval provider
final approvalProvider =
    StateNotifierProvider<ApprovalNotifier, ApprovalState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ApprovalNotifier(apiClient);
});

/// Pending approval count provider for badge
final pendingApprovalCountProvider = Provider<int>((ref) {
  return ref.watch(approvalProvider).pendingCount;
});

/// Has pending approvals provider
final hasPendingApprovalsProvider = Provider<bool>((ref) {
  return ref.watch(approvalProvider).pendingCount > 0;
});

/// Pending approvals list provider
final pendingApprovalsListProvider = Provider<List<PendingApproval>>((ref) {
  return ref.watch(approvalProvider).pendingApprovals;
});

/// My submissions list provider
final mySubmissionsListProvider = Provider<List<MySubmission>>((ref) {
  return ref.watch(approvalProvider).mySubmissions;
});
