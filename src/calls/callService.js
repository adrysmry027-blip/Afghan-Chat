import { CALL_FEATURES, CALL_STATES } from "./callConfig";

// Safe placeholder adapter. It never requests microphone/camera and never dials.
export function createCallSession({ contact, media = "voice" } = {}) {
  return {
    id: `demo-${Date.now()}`,
    contact: contact || "مخاطب",
    media,
    state: CALL_STATES.PREPARING,
    realCallingEnabled: CALL_FEATURES.enabled,
    message: "تماس واقعی هنوز فعال نیست. پس از اتصال سرور تماس و تنظیمات امنیتی فعال می‌شود."
  };
}

export function getCallReadiness() {
  return {
    enabled: CALL_FEATURES.enabled,
    voiceReady: CALL_FEATURES.voice.enabled,
    videoReady: CALL_FEATURES.video.enabled,
    signalingReady: CALL_FEATURES.signaling.enabled
  };
}
