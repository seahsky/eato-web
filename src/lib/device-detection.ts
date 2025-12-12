/**
 * Device detection utilities for handling platform-specific features
 */

/**
 * Detects if the app is running as a PWA on iOS
 * iOS Safari in standalone/PWA mode does NOT support camera access
 */
export function isIOSPWA(): boolean {
  if (typeof window === "undefined") return false;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  return isIOS && isStandalone;
}

/**
 * Detects if the device is running iOS
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Gets the iOS version number (major version only)
 * Returns null if not iOS or version cannot be determined
 */
export function getIOSVersion(): number | null {
  if (typeof window === "undefined") return null;
  if (!isIOS()) return null;

  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Checks if the iOS device supports Web Push (iOS 16.4+)
 * Returns true for non-iOS devices (they have their own support checks)
 */
export function supportsIOSWebPush(): boolean {
  if (typeof window === "undefined") return false;
  if (!isIOS()) return true; // Non-iOS devices handle their own support

  const version = getIOSVersion();
  // Web Push was added in iOS 16.4, but we check for 16+ as minor version detection is complex
  return version !== null && version >= 16;
}
