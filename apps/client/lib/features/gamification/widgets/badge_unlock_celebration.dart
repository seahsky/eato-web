import 'dart:math';
import 'package:flutter/material.dart' hide Badge;

import '../../../core/api/models/models.dart';

/// Overlay widget for celebrating badge unlocks
class BadgeUnlockCelebration extends StatefulWidget {
  final Badge badge;
  final VoidCallback onDismiss;

  const BadgeUnlockCelebration({
    super.key,
    required this.badge,
    required this.onDismiss,
  });

  @override
  State<BadgeUnlockCelebration> createState() => _BadgeUnlockCelebrationState();
}

class _BadgeUnlockCelebrationState extends State<BadgeUnlockCelebration>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _particleController;
  late AnimationController _glowController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _particleAnimation;
  late Animation<double> _glowAnimation;
  final List<_Particle> _particles = [];
  final _random = Random();

  @override
  void initState() {
    super.initState();

    // Scale animation for badge
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.3), weight: 60),
      TweenSequenceItem(tween: Tween(begin: 1.3, end: 0.95), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 0.95, end: 1.0), weight: 20),
    ]).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeOut,
    ));

    // Particle animation
    _particleController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _particleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _particleController, curve: Curves.easeOut),
    );

    // Glow animation
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _glowAnimation = Tween<double>(begin: 0.3, end: 0.8).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    // Generate particles
    _generateParticles();

    // Start animations
    _scaleController.forward();
    _particleController.forward();
  }

  void _generateParticles() {
    final color = Color(widget.badge.rarity.colorValue);
    for (int i = 0; i < 30; i++) {
      _particles.add(_Particle(
        angle: _random.nextDouble() * 2 * pi,
        speed: 100 + _random.nextDouble() * 150,
        size: 4 + _random.nextDouble() * 8,
        color: color.withValues(alpha: 0.6 + _random.nextDouble() * 0.4),
      ));
    }
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _particleController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rarityColor = Color(widget.badge.rarity.colorValue);

    return GestureDetector(
      onTap: widget.onDismiss,
      child: Material(
        color: Colors.black54,
        child: Center(
          child: AnimatedBuilder(
            animation: Listenable.merge([
              _scaleController,
              _particleController,
              _glowController,
            ]),
            builder: (context, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  // Particles
                  ..._particles.map((particle) {
                    final distance = particle.speed * _particleAnimation.value;
                    final opacity = 1 - _particleAnimation.value;
                    return Positioned(
                      left: MediaQuery.of(context).size.width / 2 +
                          cos(particle.angle) * distance -
                          particle.size / 2,
                      top: MediaQuery.of(context).size.height / 2 +
                          sin(particle.angle) * distance -
                          particle.size / 2,
                      child: Container(
                        width: particle.size,
                        height: particle.size,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: particle.color.withValues(alpha: opacity),
                        ),
                      ),
                    );
                  }),

                  // Glow ring
                  Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: rarityColor.withValues(alpha: _glowAnimation.value),
                          blurRadius: 50,
                          spreadRadius: 20,
                        ),
                      ],
                    ),
                  ),

                  // Badge content
                  Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Badge icon container
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [
                                rarityColor.withValues(alpha: 0.8),
                                rarityColor.withValues(alpha: 0.4),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            border: Border.all(
                              color: rarityColor,
                              width: 4,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: rarityColor.withValues(alpha: 0.5),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              widget.badge.icon,
                              style: const TextStyle(fontSize: 48),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Badge unlocked text
                        Text(
                          'Badge Unlocked!',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            shadows: [
                              Shadow(
                                color: rarityColor,
                                blurRadius: 10,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Badge name
                        Text(
                          widget.badge.name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),

                        // Badge description
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: Text(
                            widget.badge.description,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Rarity indicator
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: rarityColor.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: rarityColor,
                              width: 2,
                            ),
                          ),
                          child: Text(
                            widget.badge.rarity.displayName.toUpperCase(),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: rarityColor,
                              letterSpacing: 2,
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Tap to dismiss
                        Text(
                          'Tap to continue',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Particle {
  final double angle;
  final double speed;
  final double size;
  final Color color;

  _Particle({
    required this.angle,
    required this.speed,
    required this.size,
    required this.color,
  });
}

/// Controller for showing badge unlock celebrations
class BadgeCelebrationController {
  final List<Badge> _pendingBadges = [];
  Badge? _currentBadge;
  Function(Badge)? _showCallback;
  VoidCallback? _hideCallback;

  /// Register callbacks
  void register({
    required Function(Badge) onShow,
    required VoidCallback onHide,
  }) {
    _showCallback = onShow;
    _hideCallback = onHide;

    // Show any pending badges
    if (_pendingBadges.isNotEmpty && _currentBadge == null) {
      _showNext();
    }
  }

  /// Unregister callbacks
  void unregister() {
    _showCallback = null;
    _hideCallback = null;
  }

  /// Queue a badge for celebration
  void celebrateBadge(Badge badge) {
    _pendingBadges.add(badge);
    if (_currentBadge == null && _showCallback != null) {
      _showNext();
    }
  }

  /// Queue multiple badges for celebration
  void celebrateBadges(List<Badge> badges) {
    _pendingBadges.addAll(badges);
    if (_currentBadge == null && _showCallback != null) {
      _showNext();
    }
  }

  /// Dismiss current and show next
  void dismiss() {
    _currentBadge = null;
    _hideCallback?.call();

    if (_pendingBadges.isNotEmpty) {
      // Delay before showing next badge
      Future.delayed(const Duration(milliseconds: 300), _showNext);
    }
  }

  void _showNext() {
    if (_pendingBadges.isEmpty) return;
    _currentBadge = _pendingBadges.removeAt(0);
    _showCallback?.call(_currentBadge!);
  }

  /// Check if celebration is in progress
  bool get isShowing => _currentBadge != null;

  /// Clear all pending badges
  void clear() {
    _pendingBadges.clear();
    _currentBadge = null;
  }
}

/// Global controller instance
final badgeCelebrationController = BadgeCelebrationController();

/// Widget that listens for badge celebrations and shows the overlay
class BadgeCelebrationListener extends StatefulWidget {
  final Widget child;

  const BadgeCelebrationListener({
    super.key,
    required this.child,
  });

  @override
  State<BadgeCelebrationListener> createState() =>
      _BadgeCelebrationListenerState();
}

class _BadgeCelebrationListenerState extends State<BadgeCelebrationListener> {
  Badge? _currentBadge;

  @override
  void initState() {
    super.initState();
    badgeCelebrationController.register(
      onShow: _showBadge,
      onHide: _hideBadge,
    );
  }

  @override
  void dispose() {
    badgeCelebrationController.unregister();
    super.dispose();
  }

  void _showBadge(Badge badge) {
    setState(() {
      _currentBadge = badge;
    });
  }

  void _hideBadge() {
    setState(() {
      _currentBadge = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_currentBadge != null)
          BadgeUnlockCelebration(
            badge: _currentBadge!,
            onDismiss: badgeCelebrationController.dismiss,
          ),
      ],
    );
  }
}
