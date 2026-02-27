/**
 * Trigger haptic feedback if supported by the device.
 * Falls back to a no-op on unsupported platforms.
 */
export function triggerHaptic(intensity: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

  const durations: Record<string, number> = {
    light: 10,
    medium: 25,
    heavy: 50,
  };

  try {
    navigator.vibrate(durations[intensity]);
  } catch {
    // silently fail
  }
}
