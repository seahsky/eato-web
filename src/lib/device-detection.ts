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
