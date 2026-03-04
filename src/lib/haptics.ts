/**
 * Lightweight haptic feedback via the Web Vibration API.
 * Falls back silently on unsupported browsers (iOS Safari, desktop).
 */

export const softTap = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

export const mediumTap = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(20);
  }
};
